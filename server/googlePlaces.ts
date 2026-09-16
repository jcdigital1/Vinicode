import { GoogleGenAI } from '@google/genai';

export interface ResolvedPlace {
  businessName: string;
  address: string;
  city: string;
  placeId: string;
  reviewUrl: string;
  originalUrl?: string;
}

// Follow shortened URLs to resolve target Google Maps URL
export async function followRedirects(initialUrl: string, maxHops = 5): Promise<string> {
  let currentUrl = initialUrl.trim();
  if (!/^https?:\/\//i.test(currentUrl)) {
    currentUrl = `https://${currentUrl}`;
  }

  for (let i = 0; i < maxHops; i++) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const location = response.headers.get('location');
      if (location && (response.status >= 300 && response.status < 400)) {
        currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
      } else {
        break;
      }
    } catch (err) {
      console.warn('Could not follow redirect directly with HEAD, trying GET:', err);
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        currentUrl = response.url || currentUrl;
      } catch (e) {
        console.error('Failed to fetch URL:', e);
      }
      break;
    }
  }

  return currentUrl;
}

// Extract information from Google Maps URL or use Gemini to reliably identify Place ID and details
export async function resolveGoogleMapsEntity(input: string): Promise<ResolvedPlace> {
  let finalUrl = input.trim();
  let extractedName = '';
  let extractedPlaceId = '';

  // Check if it's a URL
  const isUrl = /^https?:\/\/|^maps\.app\.goo\.gl|^goo\.gl\/maps|^google\.[a-z.]+\/maps/i.test(finalUrl);

  if (isUrl) {
    try {
      finalUrl = await followRedirects(finalUrl);
    } catch (err) {
      console.error('Error following redirects:', err);
    }

    // Direct place_id in query params?
    try {
      const parsed = new URL(finalUrl);
      const queryPlaceId = parsed.searchParams.get('place_id') || parsed.searchParams.get('placeid');
      if (queryPlaceId && queryPlaceId.startsWith('ChIJ')) {
        extractedPlaceId = queryPlaceId;
      }

      // Check /place/Name/@lat,lng
      const placeMatch = parsed.pathname.match(/\/place\/([^/@]+)/);
      if (placeMatch && placeMatch[1]) {
        extractedName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }

      // Check data=!4m... for Place ID (e.g. 1s0x...:0x...)
      const chijMatch = finalUrl.match(/(ChIJ[a-zA-Z0-9_-]{20,})/);
      if (chijMatch && chijMatch[1]) {
        extractedPlaceId = chijMatch[1];
      }
    } catch {
      // ignore
    }
  } else {
    extractedName = input.trim();
  }

  // Use Gemini to extract or verify place details and accurate Place ID
  let aiInfo: Partial<ResolvedPlace> | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Você é um especialista em Google Maps e Google Meu Negócio.
Analise este link ou nome de estabelecimento do Google Maps:
ENTRADA: "${input}"
URL RESOLVIDA: "${finalUrl}"
NOME DETECTADO: "${extractedName}"
PLACE_ID DETECTADO: "${extractedPlaceId}"

Sua tarefa é identificar a empresa real no Google com precisão.
Retorne EXCLUSIVAMENTE um objeto JSON válido sem Markdown (sem \`\`\`json) com os campos:
{
  "businessName": "Nome oficial da empresa",
  "address": "Endereço completo com rua e número",
  "city": "Cidade - Estado (ex: São Paulo - SP)",
  "placeId": "O Google Place ID oficial se identificado ou inferido da URL (começa com ChIJ...) ou vazio se não puder ser determinado"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim() : '';
      const cleanJson = text.replace(/^```json\s*|\s*```$/g, '').trim();
      aiInfo = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('Gemini Places parsing error:', err);
    }
  }

  const businessName =
    aiInfo?.businessName || extractedName || (isUrl ? 'Empresa no Google' : input);
  const address =
    aiInfo?.address || 'Endereço registrado no Google Maps';
  const city = aiInfo?.city || 'Localização cadastrada';

  // Ensure Place ID
  let placeId = extractedPlaceId || aiInfo?.placeId || '';

  // If placeId wasn't found in the URL and not returned by AI, check if URL has hex CID
  if (!placeId) {
    const cidMatch = finalUrl.match(/cid=(\d+|0x[0-9a-f]+)/i) || finalUrl.match(/!1s0x[0-9a-f]+:0x([0-9a-f]+)/i);
    if (cidMatch) {
      // Fallback: place search link or formatted review link
      placeId = cidMatch[1];
    } else {
      // Generate a stable identifier based on name if no placeId exists
      placeId = 'ChIJ' + Buffer.from(businessName).toString('base64url').slice(0, 23);
    }
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  return {
    businessName,
    address,
    city,
    placeId,
    reviewUrl,
    originalUrl: input,
  };
}
