import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// Fallback for SPA routes when SSR does not generate a response (useful for dev/static hosting)
app.use((req, res, next) => {
  const indexPath = join(browserDistFolder, 'index.html');
  if (req.accepts('html')) {
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    // Development fallback: if index.html is not present (dev server / ng serve),
    // send a minimal HTML shell so the browser doesn't receive a 404 stack trace.
    // This is only for development convenience; in production build you should
    // ensure the browser distribution is generated and served.
    const minimalHtml = `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>ModaExpress (dev fallback)</title>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; connect-src 'self' ws: http://localhost:4200 http://127.0.0.1:4200 http://localhost:* ws://localhost:*; media-src 'self' data: blob:">
      </head>
      <body>
        <app-root></app-root>
        <!-- Dev fallback: scripts will be injected by ng serve in dev mode -->
      </body>
      </html>`;

    return res.status(200).send(minimalHtml);
  }

  next();
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
