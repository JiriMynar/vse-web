import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { registerRoutes } from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const limiter = rateLimit({
  legacyHeaders: false,
  standardHeaders: true,
  windowMs: 60 * 1000,
  max: 120
});

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(limiter);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
