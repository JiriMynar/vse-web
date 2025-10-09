import http from 'http';
import dotenv from 'dotenv';

import { app } from './app.js';
import { logger } from '../logger.js';
import { ensureAdminUser } from './services/adminService.js';

dotenv.config();

export function startServer() {
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(app);

  ensureAdminUser().catch((error) => {
    logger.error(`Inicializace administrátora selhala: ${error.message}`);
  });

  server.listen(port, () => {
    logger.info(`Server naslouchá na portu ${port}`);
  });

  return server;
}
