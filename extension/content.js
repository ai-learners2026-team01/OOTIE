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

  // 3. 圖片 (優先抓取當前選取的款式/顏色輪播圖或當前主圖，並徹底排除單色色塊小圖)
  function isInvalidImgSrc(src) {
    if (!src) return true;
    const s = src.toLowerCase();
    return s.includes('_color_') || s.includes('/color_') || s.includes('color_') || s.includes('/chip/') || s.includes('chip/') || s.includes('08000800') || s.includes('00480048') || s.includes('logo') || s.includes('icon') || s.includes('banner') || s.includes('spacer') || s.includes('tracking') || s.includes('blank') || s.startsWith('data:');
  }

  const candidateSelectors = [
    // NET 主圖
    '#PRODUCT_IMAGE_MAIN',
    'img[id*="PRODUCT_IMAGE"]',
    'img[src*="_400_"]',
    // UNIQLO 款式主圖
    'img.picture-img',
    'picture.image img',
    'img[src*="/sku/"]',
    'img[src*="/goods/"]',
    'picture img',
    // Lativ 當前款式大圖 (500x500 高清主圖)
    'img[fetchpriority="high"][src*="lativ"]',
    'img[ng-img="true"][src*="0500"]',
    'img.cursor-pointer[src*="0500"]',
    'img[src*="05000500"]',
    'img[ng-img="true"][src*="lativ"]',
    '#picLarge img',
    '#main-image img',
    // 通用主圖
    '.swiper-slide-active img',
    '.slick-current img',
    '.carousel-item.active img',
    '#mainImage',
    '.product-main-image img',
    '.primary-image img',
    '.product_detail_Left img',
    '.main_image img',
    '#product_detail img',
    '.product-image img',
    '.pdp-image img',
    'main img'
  ];

  for (const sel of candidateSelectors) {
    const elList = Array.from(document.querySelectorAll(sel));
    for (const img of elList) {
      const src = img.currentSrc || img.src || img.dataset.src || img.dataset.original || img.dataset.zoomImage || img.dataset.large;
      if (src && !isInvalidImgSrc(src)) {
        const rect = img.getBoundingClientRect();
        if ((rect.width >= 120 || img.naturalWidth >= 150) && (rect.height >= 120 || img.naturalHeight >= 150)) {
          result.image = toAbsoluteUrl(src);
          break;
        }
      }
    }
    if (result.image) break;
  }

  if (!result.image) {
    const metaImg = document.querySelector('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"], meta[itemprop="image"], link[rel="image_src"]');
    if (metaImg) {
      const src = metaImg.getAttribute('content') || metaImg.getAttribute('href');
      if (src && !isInvalidImgSrc(src)) result.image = toAbsoluteUrl(src);
    }
  }

  // 4. 抓取目前選取的顏色 (Active Color)
  const colorSelectors = [
    // Uniqlo 精準顏色標籤
    'span.select-color',
    '.select-color',
    '[class*="select-color"]',
    '[data-test="color-chip"].selected',
    'li.chip.selected[title]',
    // Lativ 當前選取顏色 (img alt)
    'a.color-item.current img[alt]',
    'a.color-item.active img[alt]',
    '.color-box.selected img[alt]',
    '[class*="color_item"].selected img[alt]',
    '[class*="color"].active img[alt]',
    '[class*="color"].selected img[alt]',
    '#colorName',
    '[class*="color-text"]',
    // NET / PAZZO / Universal
    'li.color_box.selected img[alt]',
    'li.color_box.selected',
    'li.color_box.active',
    '.color-selected',
    '.selected-color',
    '[class*="color"][class*="active"]',
    '[class*="color"][class*="selected"]',
    '[class*="color"][class*="checked"]',
    '[aria-selected="true"][class*="color"]',
    '[class*="swatch"][class*="active"]',
    'input[name*="color"]:checked + label',
    'input[name*="color"]:checked',
    '[class*="color_name"]',
    '[class*="selected-color"]'
  ];

  for (const sel of colorSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label') || el.innerText || el.textContent || el.value;
      if (val) {
        const clean = val.replace(/^(顏色|color|colour)[:：\s]*/i, '').trim();
        const isInvalid = clean.includes('請選擇') || clean.includes('全部') || clean.includes('包含未販售') || clean.includes('未販售') || clean.includes('商品顏色');
        if (clean && clean.length <= 25 && !isInvalid) {
          result.color = clean;
          break;
        }
      }
    }
  }

  if (!result.color) {
    const colorTextMatch = document.body.innerText.match(/(?:顏色|Color|COLOR|顏色選取)[:：\s]*([^\n\r<>,，/]+)/i);
    if (colorTextMatch && colorTextMatch[1]) {
      const clean = colorTextMatch[1].trim();
      const isInvalid = clean.includes('請選擇') || clean.includes('未販售') || clean.includes('包含未販售') || clean.includes('商品顏色');
      if (clean && clean.length <= 20 && !isInvalid) result.color = clean;
    }
  }

  // 5. 抓取目前選取的尺寸 (Active Size)
  const sizeSelectors = [
    // Uniqlo 精準尺寸標籤
    'span.select-size',
    '.select-size',
    '[class*="select-size"]',
    '[data-test="size-chip"].selected',
    'li.chip.selected[data-size]',
    'button[class*="size"].selected',
    'button[class*="size"][aria-pressed="true"]',
    // Lativ
    'li.size-item.current',
    'a.size-item.active',
    '[class*="size"].selected',
    // NET / PAZZO / Universal
    'li.size_box.selected',
    'li.size_box.active',
    '.size-selected',
    '.selected-size',
    '[class*="size"][class*="active"]',
    '[class*="size"][class*="selected"]',
    '[class*="size"][class*="checked"]',
    '[aria-selected="true"][class*="size"]',
    'input[name*="size"]:checked + label',
    'input[name*="size"]:checked',
    'select[name*="size"] option:checked',
    '[class*="size_name"]',
    '[class*="selected-size"]'
  ];

  function extractCleanSize(val) {
    if (!val) return '';
    let s = String(val).trim();
    s = s.replace(/^(女裝|男裝|童裝|男女適穿|男女兼用|男女)[\s/／]*/i, '').trim();
    s = s.replace(/^[\s/／]*(男女適穿|男女兼用|女裝|男裝|童裝)\s*/i, '').trim();
    const tokenMatch = s.match(/\b(3?XS|2?XS|XS|S|M|L|2?XL|3?XL|4?XL|FREE|F|\d{2,3}(?:\.\d)?)\b/i);
    if (tokenMatch) return tokenMatch[0].toUpperCase();
    const isInvalid = s.includes('請選擇') || s.includes('全部') || s.includes('丈量') || s.includes('參考') || s.includes('查看') || s.includes('尺寸表') || s.includes('規格') || s.includes('說明') || s.includes('為xs') || s.includes('商品尺寸');
    return isInvalid ? '' : s;
  }

  for (const sel of sizeSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.getAttribute('data-size') || el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('aria-label') || el.innerText || el.textContent || el.value;
      if (val) {
        const clean = extractCleanSize(val);
        if (clean && clean.length <= 15) {
          result.size = clean;
          break;
        }
      }
    }
  }

  // Lativ 等全域規格字串（如：粉紫－S 或 淺米－L）
  const lativSpecMatch = document.body.innerText.match(/[（(]([^\s()（）－\-_—/]{1,10})[－\-_—]([^\s()（）－\-_—]{1,8})[）)]/);
  if (lativSpecMatch) {
    if (!result.color) result.color = lativSpecMatch[1].trim();
    if (!result.size) result.size = extractCleanSize(lativSpecMatch[2]);
  }

  if (!result.size) {
    const sizeTextMatch = document.body.innerText.match(/(?:尺寸|Size|SIZE|尺碼)[:：\s]*([^\n\r<>,，/]+)/i);
    if (sizeTextMatch && sizeTextMatch[1]) {
      const clean = extractCleanSize(sizeTextMatch[1]);
      if (clean && clean.length <= 15) result.size = clean;
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

  // 7. 價格 (優先抓取促銷/特價，排除原價/刪除線標籤)
  if (!result.price) {
    const salePriceSelectors = [
      '.h-price, span.h-price',
      '.special-price',
      '.sale-price',
      '.discount-price',
      '.now-price',
      '.current-price',
      '.sales-price',
      '.price-special',
      'span[class*="font-red"]',
      'span[class*="sale"]',
      '[class*="special-price"]',
      '.product_detail_Right_price',
      '[class*="product_detail"][class*="price"]'
    ];
    for (const sel of salePriceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && !el.closest('del, s, strike, .origin-price, .old-price, [class*="origin"]')) {
        const match = el.textContent.trim().match(/(?:NT\$|NTD|\$|¥|€|£|HK\$|特價|售價|優惠價)?\s*([\d,]+(?:\.\d+)?)\s*(?:元)?/i);
        if (match && match[1]) {
          const num = match[1].replace(/,/g, '');
          if (Number(num) > 0) {
            result.price = num;
            break;
          }
        }
      }
    }
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
    const priceMeta = document.querySelector('meta[itemprop="price"], meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="price"]');
    if (priceMeta) result.price = (priceMeta.getAttribute('content') || '').replace(/[^0-9.]/g, '');
  }

  if (!result.price) {
    const priceSelectors = ['.product_detail_price', '.price', '.product-price', '.goods-price', '.pdp-price', 'span.price', 'span.now', '[class*="price"]'];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && !el.closest('del, s, strike, .origin-price, .old-price')) {
        const match = el.textContent.trim().match(/(?:NT\$|NTD|\$|¥|€|£|HK\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:元)?/i);
        if (match && match[1]) {
          const num = match[1].replace(/,/g, '');
          if (Number(num) > 0) {
            result.price = num;
            break;
          }
        }
      }
    }
  }

  // 貨幣
  const metaCur = document.querySelector('meta[property="product:price:currency"], meta[property="og:price:currency"], meta[itemprop="priceCurrency"]')?.content;
  if (metaCur) result.currency = metaCur.toUpperCase().trim();
  else if (result.sourceDomain.endsWith('.tw') || window.location.href.includes('.tw')) {
    result.currency = 'TWD';
  }

  if (result.price) {
    result.price = result.price.replace(/[^0-9.]/g, '');
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
