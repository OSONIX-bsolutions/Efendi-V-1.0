import type { Request, Response } from 'express';
import { createApp } from '../server';

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
    return app(req, res);
  } catch (err: any) {
    appPromise = null;
    return res.status(500).json({
      error: err?.message || 'Serverless API handler initialization failed',
    });
  }
}
