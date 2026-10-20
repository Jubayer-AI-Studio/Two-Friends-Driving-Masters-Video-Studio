import { GoogleGenAI, GenerateVideosOperation, Modality } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. API calls will fail.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Helper to parse JSON body from incoming request
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      // Safeguard against gigantic payloads (> 35MB)
      if (data.length > 35 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!data.trim()) {
          resolve({});
          return;
        }
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0] || '';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  // 1. Generate Video with Veo
  if (url === '/api/generate-video' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const {
        prompt,
        imageBase64,
        imageMimeType,
        presetImagePath,
        aspectRatio = '16:9',
        resolution = '720p',
        model = 'veo-3.1-fast-generate-preview',
      } = body;

      const ai = getGenAI();
      let imagePart: { imageBytes: string; mimeType: string } | undefined = undefined;

      if (imageBase64) {
        // Strip data:image/...;base64, prefix if present
        const cleanedBase64 = imageBase64.includes('base64,')
          ? imageBase64.split('base64,')[1]
          : imageBase64;
        imagePart = {
          imageBytes: cleanedBase64,
          mimeType: imageMimeType || 'image/jpeg',
        };
      } else if (presetImagePath) {
        // Read preset image from local filesystem
        const safePath = path.resolve(process.cwd(), 'public', presetImagePath.replace(/^\//, ''));
        if (fs.existsSync(safePath)) {
          const fileBuffer = fs.readFileSync(safePath);
          const ext = path.extname(safePath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
          imagePart = {
            imageBytes: fileBuffer.toString('base64'),
            mimeType: mime,
          };
        }
      }

      // Valid models for Veo
      const validModel =
        model === 'veo-3.1-generate-preview' ||
        model === 'veo-3.1-lite-generate-preview' ||
        model === 'veo-3.1-fast-generate-preview'
          ? model
          : 'veo-3.1-fast-generate-preview';

      const videoParams: any = {
        model: validModel,
        prompt: prompt || 'Cinematic high speed race duel between red and blue supercars',
        config: {
          numberOfVideos: 1,
          resolution: resolution === '1080p' ? '1080p' : '720p',
          aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
        },
      };

      if (imagePart) {
        videoParams.image = imagePart;
      }

      const operation = await ai.models.generateVideos(videoParams);

      sendJson(res, 200, {
        success: true,
        operationName: operation.name,
        model: validModel,
        aspectRatio,
        prompt,
      });
      return true;
    } catch (error: any) {
      console.error('Error generating video:', error);
      sendJson(res, 500, {
        success: false,
        error: error?.message || 'Failed to start video generation',
      });
      return true;
    }
  }

  // 2. Poll Video Status
  if (url === '/api/video-status' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { operationName } = body;

      if (!operationName) {
        sendJson(res, 400, { error: 'operationName is required' });
        return true;
      }

      const ai = getGenAI();
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });

      sendJson(res, 200, {
        done: Boolean(updated.done),
        error: updated.error || null,
        hasVideo: Boolean(updated.response?.generatedVideos?.[0]?.video?.uri),
      });
      return true;
    } catch (error: any) {
      console.error('Error checking video status:', error);
      sendJson(res, 500, {
        error: error?.message || 'Failed to check status',
      });
      return true;
    }
  }

  // 3. Download / Stream Video
  if (url === '/api/video-download' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { operationName } = body;

      if (!operationName) {
        sendJson(res, 400, { error: 'operationName is required' });
        return true;
      }

      const apiKey = process.env.GEMINI_API_KEY || '';
      const ai = getGenAI();
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        sendJson(res, 404, { error: 'Video URI not ready or not found' });
        return true;
      }

      const videoRes = await fetch(uri, {
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!videoRes.ok) {
        sendJson(res, videoRes.status, {
          error: `Failed to fetch video from source: ${videoRes.statusText}`,
        });
        return true;
      }

      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      });

      if (videoRes.body) {
        // @ts-ignore
        const reader = videoRes.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(Buffer.from(value));
          }
        };
        await pump();
      } else {
        const arrayBuf = await videoRes.arrayBuffer();
        res.end(Buffer.from(arrayBuf));
      }
      return true;
    } catch (error: any) {
      console.error('Error downloading video:', error);
      sendJson(res, 500, {
        error: error?.message || 'Failed to download video',
      });
      return true;
    }
  }

  // 4. Generate Story Script & Bengali Commentary
  if (url === '/api/generate-story' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { scenePrompt, customNotes, language = 'bn' } = body;

      const ai = getGenAI();
      const prompt = `You are a cinematic story writer and race commentator.
User story context:
"অনেক বছর আগে এক দেশে দুই বন্ধু ছিল (Shafin & Nafis)। তারা অনেক ভালো বন্ধু ছিল। কিন্তু হঠাৎ তাদের মধ্যে ঝগড়া হয়। তারপর তারা আলাদা হয়ে প্রত্যেকেই ড্রাইভিং মাস্টার হয়ে যায় (Shafin - Speed Master & Nafis - Drift King)। অনেকদিন পর তাদের মধ্যে বিশাল এক গ্র্যান্ড প্রিক্স রেসিং প্রতিযোগিতা হয়।"

Generate a captivating racing scene description, race commentary (in ${language === 'bn' ? 'Bengali with intense excitement and English terms' : 'English with high octane energy'}), dialogue between Shafin and Nafis, and an optimized cinematic Veo video generation prompt.
Return ONLY valid JSON with format:
{
  "title": "Scene title",
  "titleBn": "দৃশ্যের নাম",
  "storyTextBn": "বাংলায় আবেগপূর্ণ ও রোমাঞ্চকর বর্ণনা",
  "storyTextEn": "English cinematic storyline",
  "commentary": "রেস কমেন্ট্রি",
  "shafinDialogue": "শাফিনের সংলাপ",
  "nafisDialogue": "নাফিসের সংলাপ",
  "veoPrompt16x9": "Detailed prompt for Veo 3.1 video generation landscape",
  "veoPrompt9x16": "Detailed prompt for Veo 3.1 video generation portrait (TikTok/Reels format)",
  "cameraAction": "Camera motion details"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt + (customNotes ? `\nUser note: ${customNotes}` : '') + (scenePrompt ? `\nTarget scene: ${scenePrompt}` : ''),
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      let json = {};
      try {
        json = JSON.parse(text);
      } catch {
        json = { rawText: text };
      }

      sendJson(res, 200, json);
      return true;
    } catch (error: any) {
      console.error('Error generating story:', error);
      sendJson(res, 500, { error: error?.message || 'Story generation failed' });
      return true;
    }
  }

  // 5. Generate TTS Narration Audio
  if (url === '/api/generate-narration' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { text, voice = 'Fenrir' } = body;

      if (!text) {
        sendJson(res, 400, { error: 'text is required' });
        return true;
      }

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Narrate with dramatic cinematic intensity and energy: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Fenrir' },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        sendJson(res, 500, { error: 'Audio generation produced empty data' });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        base64Audio,
        mimeType: 'audio/pcm',
        sampleRate: 24000,
      });
      return true;
    } catch (error: any) {
      console.error('Error generating narration:', error);
      sendJson(res, 500, { error: error?.message || 'Narration failed' });
      return true;
    }
  }

  return false;
}
