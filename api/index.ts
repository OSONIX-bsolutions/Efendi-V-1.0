import type { Request, Response } from 'express';
import { createApp } from '../server.js';

let appPromise: ReturnType<typeof createApp> | null = null;

function restoreApiPath(req: Request) {
  try {
    const rawUrl = req.url || '/';
    const parsed = new URL(rawUrl, 'http://localhost');
    const apiPath = parsed.searchParams.get('__apiPath');
    if (apiPath) {
      parsed.searchParams.delete('__apiPath');
      const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
      const qs = parsed.searchParams.toString();
      req.url = qs ? `${normalizedPath}?${qs}` : normalizedPath;
      (req as any).originalUrl = req.url;
    }
  } catch {
    // Keep incoming req.url if URL reconstruction fails
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    restoreApiPath(req);
    if (!appPromise) {
      appPromise = createApp({ serveFrontend: false });
    }
    const app = await appPromise;

    await new Promise<void>((resolve, reject) => {
      const done = () => resolve();
      res.once('finish', done);
      res.once('close', done);
      try {
        app(req, res, (err?: any) => {
          if (err) {
            reject(err);
          } else if (!res.writableEnded) {
            if (!res.headersSent) {
              res.status(404).json({ error: 'API route not found' });
            } else {
              res.end();
            }
          }
        });
      } catch (invokeErr) {
        reject(invokeErr);
      }
    });
  } catch (err: any) {
    appPromise = null;
    if (!res.headersSent) {
      res.status(500).json({
        error: err?.message || 'Serverless API handler failed',
      });
    }
  }
}
