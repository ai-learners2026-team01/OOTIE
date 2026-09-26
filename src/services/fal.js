/**
 * Service for interacting with Fal.ai API using environment variables VITE_FAL_KEY and VITE_FAL_MODEL.
 */

const getFalApiKey = () => {
  return import.meta.env.VITE_FAL_KEY || '';
};

const getFalModel = () => {
  return import.meta.env.VITE_FAL_MODEL || 'fal-ai/fast-sdxl';
};

/**
 * Check if a valid Fal.ai API key is configured in .env
 */
export function hasFalConfig() {
  const key = getFalApiKey();
  return !!key && key !== 'your_fal_key_here';
}

/**
 * Call Fal.ai API for outfit recommendations
 */
export async function callFalOutfitApi(prompt) {
  const apiKey = getFalApiKey();
  const model = getFalModel();

  if (!hasFalConfig()) {
    console.log('Fal.ai key not configured, using local fallback generator.');
    return null;
  }

  try {
    const response = await fetch(`https://fal.run/fal-ai/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OOTie-App/1.0'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          system: 'You are a fashion stylist helping the user create outfit combinations based on their wardrobe.',
          format: 'json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fal.ai API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Fal.ai API request failed:', err);
    return null;
  }
}

/**
 * Call Fal.ai API for Virtual Try-On image generation
 */
export async function callFalTryOnApi({ personImage, garmentImage, prompt }) {
  const apiKey = getFalApiKey();
  const model = getFalModel();

  if (!hasFalConfig()) {
    console.log('Fal.ai key not configured, using simulated try-on renderer.');
    return null;
  }

  try {
    const response = await fetch(`https://fal.run/fal-ai/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OOTie-App/1.0'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt || 'Generate a realistic outfit try-on preview.',
          image_url: personImage,
          garment_url: garmentImage,
          num_images: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fal.ai Virtual Try-On API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    
    // Extract image URL from response
    if (data?.images?.[0]?.url) return data.images[0].url;
    if (data?.image?.url) return data.image.url;
    if (typeof data?.output === 'string') return data.output;
    if (data?.url) return data.url;

    return null;
  } catch (err) {
    console.error('Fal.ai Virtual Try-On API failed:', err);
    return null;
  }
}
