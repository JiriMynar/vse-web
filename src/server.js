import http from 'http';
import dotenv from 'dotenv';

import { app } from './app.js';
import { logger } from '../logger.js';

dotenv.config();

export function startServer() {
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(app);

  server.listen(port, () => {
    logger.info(`Server naslouchá na portu ${port}`);
  });

  return server;
}
