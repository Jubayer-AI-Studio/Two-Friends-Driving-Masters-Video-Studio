import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRoute } from './api-handler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API routes handled by handleApiRoute
app.use('/api', async (req, res, next) => {
  try {
    const handled = await handleApiRoute(req, res);
    if (!handled) next();
  } catch (err) {
    console.error('Server API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/presets', express.static(path.join(__dirname, 'public', 'presets')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
