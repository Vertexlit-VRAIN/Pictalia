import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const maskApiKey = (value: string): string => {
  if (!value) return '(empty)';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const readJsonBody = async (req: NodeJS.ReadableStream): Promise<any> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
};

const createAiDebugPlugin = (): Plugin => ({
  name: 'ai-debug-proxy',
  configureServer(server) {
    server.middlewares.use('/__ai-debug', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      try {
        const payload = await readJsonBody(req);
        const promptText = String(payload?.promptText || '');
        const settings = payload?.settings || {};
        const provider = settings.provider === 'ollama' ? 'ollama' : 'gemini';

        const requestSummary = {
          provider,
          geminiModel: settings.geminiModel,
          geminiApiKey: maskApiKey(settings.geminiApiKey || ''),
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
        };

        console.log('\n[AI DEBUG] Request settings');
        console.dir(requestSummary, { depth: null });
        console.log('[AI DEBUG] Prompt');
        console.log(promptText);

        let responseText = '';

        if (provider === 'ollama') {
          const baseUrl = String(settings.ollamaBaseUrl || '').replace(/\/+$/, '');
          const upstreamResponse = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: settings.ollamaModel,
              stream: false,
              format: 'json',
              messages: [{
                role: 'user',
                content: promptText,
              }],
            }),
          });

          const rawUpstream = await upstreamResponse.text();
          console.log('[AI DEBUG] Raw Ollama response');
          console.log(rawUpstream);

          if (!upstreamResponse.ok) {
            throw new Error(`Ollama devolvió un error (${upstreamResponse.status}): ${rawUpstream}`);
          }

          const parsed = JSON.parse(rawUpstream);
          responseText = String(parsed?.message?.content || '').trim();
        } else {
          const apiKey = String(settings.geminiApiKey || '').trim();
          const model = String(settings.geminiModel || '');

          const upstreamResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: promptText }],
                }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.4,
                },
              }),
            }
          );

          const rawUpstream = await upstreamResponse.text();
          console.log('[AI DEBUG] Raw Gemini response');
          console.log(rawUpstream);

          if (!upstreamResponse.ok) {
            throw new Error(`Gemini devolvió un error (${upstreamResponse.status}): ${rawUpstream}`);
          }

          const parsed = JSON.parse(rawUpstream);
          responseText = parsed?.candidates?.[0]?.content?.parts
            ?.map((part: { text?: string }) => part.text || '')
            .join('')
            .trim() || '';
        }

        console.log('[AI DEBUG] Extracted response text');
        console.log(responseText);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ text: responseText }));
      } catch (error) {
        console.error('[AI DEBUG] Request failed');
        console.error(error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: error instanceof Error ? error.message : 'Unexpected AI debug proxy error.',
        }));
      }
    });
  },
});

export default defineConfig({
  server: {
  },
  plugins: [react(), createAiDebugPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        visualizer: path.resolve(__dirname, 'visualizer.html')
      }
    }
  }
});
