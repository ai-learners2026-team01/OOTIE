const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '0.0.0.0';
const port = process.env.PORT || 8000;
const root = __dirname;

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
}

loadDotEnv();

const FAL_API_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY || process.env.FAL_TOKEN || '';
const FAL_MODEL = process.env.FAL_MODEL || 'fal-ai/flux-kontext-dev';

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function callFalOutfitApi(payload) {
  if (!FAL_API_KEY) {
    throw new Error('Missing FAL_KEY environment variable');
  }

  const response = await fetch(`https://fal.run/fal-ai/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'OOTie-App/1.0'
    },
    body: JSON.stringify({
      input: {
        system: 'You are a fashion stylist helping the user create outfit combinations based on their wardrobe and event context.',
        user_prompt: payload.prompt,
        format: 'json'
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal.ai request failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  if (data && typeof data === 'object') {
    if (Array.isArray(data.output)) {
      return data.output;
    }
    if (typeof data.output === 'string') {
      return data.output;
    }
    if (typeof data.data === 'object') {
      return data.data;
    }
    if (data.answer) {
      return data.answer;
    }
    if (data.result) {
      return data.result;
    }
  }

  return data;
}

function extractFalImageUrl(raw) {
  if (!raw) return '';

  if (typeof raw === 'string') return raw;

  if (Array.isArray(raw)) {
    const first = raw[0];
    return extractFalImageUrl(first);
  }

  if (typeof raw === 'object') {
    const direct = raw.image_url || raw.imageUrl || raw.url || raw.output || raw.result || raw.data;
    if (direct) return extractFalImageUrl(direct);
    if (Array.isArray(raw.images)) return extractFalImageUrl(raw.images[0]);
    if (raw.image && typeof raw.image === 'object') return raw.image.url || raw.image.image_url || '';
  }

  return '';
}

async function callFalTryOnApi({ personImage, garmentImage, prompt }) {
  if (!FAL_API_KEY) {
    throw new Error('Missing FAL_KEY environment variable');
  }

  const modelCandidates = [
    FAL_MODEL,
    'fal-ai/flux-kontext-dev',
    'fal-ai/flux-kontext-pro'
  ].filter(Boolean);

  const requestBodies = [
    {
      input: {
        prompt: prompt || 'Generate a realistic outfit try-on preview with the clothing item placed naturally on the person.',
        person_image: personImage,
        garment_image: garmentImage,
        guidance: 8,
        num_images: 1
      }
    },
    {
      input: {
        prompt: prompt || 'Generate a realistic outfit try-on preview with the clothing item placed naturally on the person.',
        person_image_url: personImage,
        garment_image_url: garmentImage,
        guidance: 8,
        num_images: 1
      }
    },
    {
      input: {
        prompt: prompt || 'Generate a realistic outfit try-on preview with the clothing item placed naturally on the person.',
        image_url: personImage,
        garment_url: garmentImage,
        guidance: 8,
        num_images: 1
      }
    }
  ];

  let lastError = null;

  for (const modelName of modelCandidates) {
    for (const payload of requestBodies) {
      try {
        const response = await fetch(`https://fal.run/fal-ai/${modelName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'OOTie-App/1.0'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          lastError = new Error(`Fal.ai try-on request failed for ${modelName} (${response.status}): ${text}`);
          continue;
        }

        const data = await response.json();
        const result = extractFalImageUrl(data) || extractFalImageUrl(data.output) || extractFalImageUrl(data.result) || '';
        if (result) return result;

        const fallbackImage = (data && typeof data === 'object' && Array.isArray(data.images)) ? data.images[0] : '';
        if (fallbackImage) return fallbackImage;

        lastError = new Error('Fal.ai responded without an image URL.');
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Fal.ai try-on generation failed without a usable response.');
}

function normalizeFalTextOutput(raw) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      return [{
        title: 'AI outfit suggestion',
        summary: raw,
        score: 90,
        items: [],
        tag: 'AI'
      }];
    }
  }

  if (typeof raw === 'object') {
    const suggestions = raw.suggestions || raw.outfits || raw.recommendations || raw.data || [];
    if (Array.isArray(suggestions)) return suggestions;
    return [{
      title: raw.title || 'AI outfit suggestion',
      summary: raw.summary || raw.description || 'AI-generated look suggestion.',
      score: Number(raw.score || 90),
      items: Array.isArray(raw.items) ? raw.items : [],
      tag: raw.tag || 'AI'
    }];
  }

  return [];
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestPath = requestUrl.pathname === '/' ? '/home.html' : requestUrl.pathname;

  if (requestPath === '/ai.html') {
    res.writeHead(302, { Location: '/tryon.html' });
    res.end();
    return;
  }

  if (req.method === 'POST' && requestPath === '/api/fal/outfit') {
    try {
      const rawBody = await readRequestBody(req);
      const json = rawBody ? JSON.parse(rawBody) : {};
      const wardrobe = Array.isArray(json.wardrobe) ? json.wardrobe : [];
      const occasion = json.occasion || '約會';
      const weather = json.weather || '涼爽';
      const vibe = json.vibe || '輕鬆';
      const limit = Number(json.limit || 3);

      const prompt = `
        You are an expert wardrobe stylist.
        User wants an outfit recommendation for ${occasion} in ${weather} weather with a ${vibe} style.
        Available wardrobe items: ${wardrobe.map(item => item.name_zh || item.name || item).join(', ') || 'No wardrobe specified'}.
        Return JSON as an array of ${Math.max(1, Number(limit) || 3)} outfit suggestions.
        Each item must include: title, score, summary, tag, items array.
        Make recommendations practical and stylish, using only the available wardrobe items when possible.
      `;

      const falData = await callFalOutfitApi({ prompt });
      const suggestions = normalizeFalTextOutput(falData);

      if (!suggestions.length) {
        sendJson(res, 200, { ok: true, suggestions: [], mode: 'demo-fallback' });
        return;
      }

      const mapped = suggestions.slice(0, Math.max(1, Number(limit) || 3)).map((item, index) => ({
        title: item.title || `${occasion} 穿搭 ${index + 1}`,
        score: Number(item.score || 90),
        summary: item.summary || item.description || 'AI-generated outfit recommendation.',
        items: Array.isArray(item.items) && item.items.length ? item.items : (Array.isArray(item.wearing) ? item.wearing : []),
        tag: item.tag || 'AI',
        image: item.image || wardrobe[0]?.photo || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'
      }));

      sendJson(res, 200, { ok: true, suggestions: mapped, mode: 'fal' });
      return;
    } catch (error) {
      sendJson(res, 200, {
        ok: true,
        suggestions: [],
        mode: 'demo-fallback',
        warning: error.message || 'Fal.ai unavailable; using fallback suggestions.'
      });
      return;
    }
  }

  if (requestPath === '/api/fal/health') {
    sendJson(res, 200, {
      ok: true,
      configured: Boolean(FAL_API_KEY),
      model: FAL_MODEL,
      mode: FAL_API_KEY ? 'fal-live' : 'demo'
    });
    return;
  }

  if (requestPath === '/api/tryon') {
    try {
      const rawBody = await readRequestBody(req);
      const json = rawBody ? JSON.parse(rawBody) : {};
      const personImage = json.person_image || json.personImage || '';
      const garmentImage = json.garment_image || json.garmentImage || '';

      if (!personImage || !garmentImage) {
        sendJson(res, 400, { ok: false, error: 'person_image and garment_image are required.' });
        return;
      }

      const tryOnUrl = await callFalTryOnApi({
        personImage,
        garmentImage,
        prompt: json.prompt || 'Create a realistic virtual try-on showing the person wearing the selected outfit naturally.'
      });

      sendJson(res, 200, { ok: true, url: tryOnUrl, mode: 'fal' });
      return;
    } catch (error) {
      sendJson(res, 200, {
        ok: true,
        url: '',
        mode: 'demo-fallback',
        warning: error.message || 'Try-on request unavailable; using local preview mode.'
      });
      return;
    }
  }

  const safePath = path.normalize(requestPath).replace(/^\/+/, '');
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server error');
        return;
      }

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    });
  });
});

server.listen(port, host, () => {
  console.log(`OOTie is running at http://${host}:${port}`);
});
