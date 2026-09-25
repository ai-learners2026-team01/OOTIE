/**
 * OOTie - Content Script
 * 智慧電商商品資訊解析引擎 (通用型解析：Microdata -> DOM <h1> -> 智慧正則清洗)
 */

function toAbsoluteUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed || trimmed.startsWith('data:')) return '';
  try {
    return new URL(trimmed, window.location.href).href;
  } catch (e) {
    if (trimmed.startsWith('//')) return 'https:' + trimmed;
    return trimmed;
  }
}

function cleanTitleString(rawTitle) {
  if (!rawTitle) return '';
  let title = String(rawTitle).trim();

  // 若含 SEO 分隔符號（如 |、-、_），優先取前半段商品名
  if (title.includes('|')) {
    title = title.split('|')[0].trim();
  } else if (/\s+[-–—_]\s+/.test(title)) {
    title = title.split(/\s+[-–—_]\s+/)[0].trim();
  }

  // 移除常見品牌或網站後綴
  title = title
    .replace(/\s*([|\-–—_•·]|::)\s*(lativ|米格國際|uniqlo|uniqlo台灣|zara|gu|h&m|gap|momo|shopee|蝦皮|yahoo|pchome|taobao).*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return title;
}

function extractProductInfo() {
  const result = {
    url: window.location.href,
    title: '',
    image: '',
    price: '',
    currency: 'TWD',
    brand: '',
    color: '',
    size: '',
    sourceDomain: window.location.hostname.replace(/^www\./i, '')
  };

  // 1. JSON-LD
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent || '{}');
        const items = Array.isArray(raw) ? raw : (raw['@graph'] ? raw['@graph'] : [raw]);
        for (const item of items) {
          if (!item) continue;
          const type = String(item['@type'] || '');
          if (type.toLowerCase().includes('product')) {
            if (item.name && !result.title) result.title = cleanTitleString(item.name);
            if (!result.image) {
              const img = typeof item.image === 'string' ? item.image : (Array.isArray(item.image) ? item.image[0] : (item.image?.url || item.image?.contentUrl));
              if (img) result.image = toAbsoluteUrl(typeof img === 'string' ? img : img.url);
            }
            if (!result.brand) result.brand = typeof item.brand === 'string' ? item.brand : (item.brand?.name || '');
            if (item.offers && !result.price) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const p = offer?.price !== undefined ? offer.price : offer?.lowPrice;
              if (p !== undefined && p !== null) result.price = String(p).trim();
              if (offer?.priceCurrency) result.currency = String(offer.priceCurrency).trim().toUpperCase();
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  function isSiteBrandOnly(text) {
    if (!text) return true;
    const t = text.trim().toLowerCase();
    const sitePatterns = ['net線上購物', 'net fashion', 'net', 'lativ', 'uniqlo', 'uniqlo台灣', 'zara', 'gu', 'h&m', 'pazzo', 'meier.q', '50%', 'queen shop', 'd+af', 'grace gift', '蝦皮購物', 'momo購物網', 'yahoo購物中心', '首頁', '商品列表', '全部商品'];
    return sitePatterns.some(p => t === p || t === p + '線上購物');
  }

  // 2. 標題：Microdata -> 專用電商標題 Class (NET, PAZZO, Uniqlo, Lativ等) -> <h1> -> og:title
  if (!result.title) {
    const itempropName = document.querySelector('[itemprop="name"]');
    if (itempropName) {
      const val = (itempropName.getAttribute('content') || itempropName.innerText || itempropName.textContent || '').trim();
      if (val && val.length >= 2 && val.length <= 80 && !isSiteBrandOnly(val)) result.title = cleanTitleString(val);
    }
  }

  if (!result.title) {
    const titleSelectors = [
      '.product_detail_Right_title',
      '.product_detail_title',
      '.product-detail-title',
      '.product-detail-list-title',
      '[class*="product_detail"][class*="title"]',
      '[class*="product_detail"][class*="name"]',
      '[class*="product-detail"][class*="title"]',
      '[class*="product-name"], [class*="productName"], [class*="product_name"]',
      '[class*="product-title"], [class*="productTitle"], [class*="product_title"]',
      '[class*="goods-name"], [class*="goods_name"], [class*="item-name"]',
      '[class*="pdp-title"], [class*="pdp-name"]',
      'h1'
    ];

    for (const sel of titleSelectors) {
      const elList = Array.from(document.querySelectorAll(sel));
      for (const el of elList) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text && text.length >= 2 && text.length <= 60 && !isSiteBrandOnly(text) && !text.includes('購物車') && !text.includes('搜尋')) {
          result.title = cleanTitleString(text);
          break;
        }
      }
      if (result.title) break;
    }
  }

  if (!result.title) {
    const ogTitle = document.querySelector('meta[property="og:title"], meta[name="twitter:title"]')?.content;
    const fallback = ogTitle || document.title;
    if (fallback && !isSiteBrandOnly(fallback)) {
      result.title = cleanTitleString(fallback);
    }
  }

  // 3. 圖片 (優先抓取當前選取的款式/顏色輪播圖或當前主圖)
  const candidateSelectors = [
    '.swiper-slide-active img',
    '.slick-current img',
    '.carousel-item.active img',
    '[class*="active"] > img',
    '.is-selected img',
    '.active-slide img',
    '[class*="color"][class*="active"] img',
    '[class*="color"][class*="selected"] img',
    '.product_detail_Left img',
    '.main_image img',
    '#mainImage',
    '.product-main-image img',
    '.primary-image img',
    '[class*="product_detail"] img',
    '#product_detail img',
    '.product-image img',
    '.pdp-image img',
    '.gallery img',
    'main img'
  ];
  for (const sel of candidateSelectors) {
    const img = document.querySelector(sel);
    if (img) {
      const src = img.currentSrc || img.src || img.dataset.src || img.dataset.original || img.dataset.zoomImage;
      if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('data:') && !src.includes('banner')) {
        result.image = toAbsoluteUrl(src);
        break;
      }
    }
  }
  if (!result.image) {
    const metaImg = document.querySelector('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"], meta[itemprop="image"], link[rel="image_src"]');
    if (metaImg) {
      const src = metaImg.getAttribute('content') || metaImg.getAttribute('href');
      if (src && !src.includes('logo') && !src.includes('banner')) result.image = toAbsoluteUrl(src);
    }
  }

  // 4. 抓取目前選取的顏色 (Active Color)
  const colorSelectors = [
    '.color-selected, .selected-color, [class*="color"][class*="active"], [class*="color"][class*="selected"], [class*="color"][class*="checked"], [aria-selected="true"][class*="color"], [class*="swatch"][class*="active"]',
    'input[name*="color"]:checked + label',
    'input[name*="color"]:checked',
    '[class*="color_name"], [class*="color-name"], [class*="color-text"], [class*="selected-color"]'
  ];
  for (const sel of colorSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('aria-label') || el.value;
      if (val) {
        const clean = val.replace(/^(顏色|color|colour)[:：\s]*/i, '').trim();
        if (clean && clean.length <= 25 && !clean.includes('請選擇') && !clean.includes('全部')) {
          result.color = clean;
          break;
        }
      }
    }
  }

  // 5. 抓取目前選取的尺寸 (Active Size)
  const sizeSelectors = [
    '.size-selected, .selected-size, [class*="size"][class*="active"], [class*="size"][class*="selected"], [class*="size"][class*="checked"], [aria-selected="true"][class*="size"], button[class*="size"][aria-pressed="true"]',
    'input[name*="size"]:checked + label',
    'input[name*="size"]:checked',
    'select[name*="size"] option:checked',
    '[class*="size_name"], [class*="size-name"], [class*="size-text"], [class*="selected-size"]'
  ];
  for (const sel of sizeSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('aria-label') || el.value;
      if (val) {
        const clean = val.replace(/^(尺寸|size)[:：\s]*/i, '').trim();
        if (clean && clean.length <= 15 && !clean.includes('請選擇') && !clean.includes('全部')) {
          result.size = clean;
          break;
        }
      }
    }
  }

  // 6. 品牌 (NET / Lativ / Uniqlo / GU / ZARA / PAZZO / MEIER.Q 等)
  if (!result.brand) {
    const brandMeta = document.querySelector('meta[property="product:brand"], meta[name="brand"], meta[itemprop="brand"]');
    if (brandMeta) result.brand = (brandMeta.getAttribute('content') || brandMeta.innerText || '').trim();
  }
  if (!result.brand) {
    const siteName = document.querySelector('meta[property="og:site_name"], meta[name="twitter:site"]')?.content;
    if (siteName) result.brand = siteName.replace(/^@/, '').trim();
  }
  if (!result.brand) {
    const host = (result.sourceDomain + ' ' + window.location.href).toLowerCase();
    if (host.includes('net-fashion') || host.includes('net.com')) result.brand = 'NET';
    else if (host.includes('lativ')) result.brand = 'Lativ';
    else if (host.includes('uniqlo')) result.brand = 'UNIQLO';
    else if (host.includes('gu-global') || host.includes('gu.com')) result.brand = 'GU';
    else if (host.includes('pazzo')) result.brand = 'PAZZO';
    else if (host.includes('meierq')) result.brand = 'MEIER.Q';
    else if (host.includes('50-shop') || host.includes('fifty')) result.brand = '50% FIFTY PERCENT';
    else if (host.includes('queenshop')) result.brand = 'QUEEN SHOP';
    else if (host.includes('zara')) result.brand = 'ZARA';
    else if (host.includes('aritzia')) result.brand = 'Aritzia';
    else if (host.includes('hm.com')) result.brand = 'H&M';
    else {
      const seg = result.sourceDomain.split('.')[0];
      if (seg) result.brand = seg.charAt(0).toUpperCase() + seg.slice(1);
    }
  }

  // 7. 價格 (純數字提取)
  if (!result.price) {
    const priceMeta = document.querySelector('meta[itemprop="price"], meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="price"]');
    if (priceMeta) result.price = (priceMeta.getAttribute('content') || '').replace(/[^0-9.]/g, '');
  }
  if (!result.price) {
    const itempropPrice = document.querySelector('[itemprop="price"], [data-price], [data-product-price]');
    if (itempropPrice) {
      const val = itempropPrice.getAttribute('content') || itempropPrice.getAttribute('data-price') || itempropPrice.innerText;
      if (val) {
        const m = val.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
        if (m) result.price = m[0];
      }
    }
  }
  if (!result.price) {
    const priceSelectors = [
      '.product_detail_Right_price',
      '[class*="product_detail"][class*="price"]',
      '.product_detail_price',
      '.price',
      '.product-price',
      '.special-price',
      '.sale-price',
      '.current-price',
      '.now-price',
      '.goods-price',
      '.pdp-price',
      'span.price',
      'span.now',
      'span.special',
      '[class*="price"]'
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const match = el.textContent.trim().match(/(?:NT\$|NTD|\$|¥|€|£|HK\$|特價|售價|優惠價)?\s*([\d,]+(?:\.\d+)?)\s*(?:元)?/i);
        if (match && match[1]) {
          const num = match[1].replace(/,/g, '');
          if (Number(num) > 0) {
            result.price = match[0].trim();
            break;
          }
        }
      }
    }
  }

  // 貨幣
  const metaCur = document.querySelector('meta[property="product:price:currency"], meta[property="og:price:currency"], meta[itemprop="priceCurrency"]')?.content;
  if (metaCur) result.currency = metaCur.toUpperCase().trim();
  else if (result.sourceDomain.endsWith('.tw') || result.price.includes('NT') || result.price.includes('元')) {
    result.currency = 'TWD';
  }

  if (result.price && /^\d+$/.test(result.price.replace(/,/g, '')) && result.currency === 'TWD') {
    result.price = `NT$ ${Number(result.price.replace(/,/g, '')).toLocaleString()}`;
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && canonical.href) result.url = canonical.href;

  return result;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.action === 'GET_PRODUCT_INFO') {
      try {
        const data = extractProductInfo();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }
    return true;
  });
}
