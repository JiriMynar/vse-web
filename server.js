import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

import { getDb } from './db.js';
import { authMiddleware, signToken, attachTokenCookie, clearTokenCookie } from './auth.js';
import { getBotResponse } from './chatService.js';
import { logger } from './logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Prosím vyplňte jméno, e-mail a heslo.' });
  }

  const db = await getDb();

  const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Uživatel s tímto e-mailem již existuje.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', email.toLowerCase(), passwordHash, name.trim());

  logger.info(`Registrace nového uživatele: ${email.toLowerCase()}`);

  const token = signToken({ id: result.lastID, email: email.toLowerCase(), name: name.trim() });
  attachTokenCookie(res, token);

  res.status(201).json({ message: 'Registrace proběhla úspěšně.', user: { id: result.lastID, email: email.toLowerCase(), name: name.trim() } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Zadejte e-mail a heslo.' });
  }

  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Nesprávné přihlašovací údaje.' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Nesprávné přihlašovací údaje.' });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  attachTokenCookie(res, token);

  res.json({ message: 'Přihlášení proběhlo úspěšně.', user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Byli jste odhlášeni.' });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = await db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', req.user.id);
  res.json({ user });
});

app.get('/api/chat/history', authMiddleware, async (req, res) => {
  const db = await getDb();
  const messages = await db.all('SELECT role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY id ASC', req.user.id);
  res.json({ messages });
});

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Zpráva musí obsahovat text.' });
  }

  const db = await getDb();

  await db.run('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)', req.user.id, 'user', message.trim());

  const reply = await getBotResponse(message.trim());
  await db.run('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)', req.user.id, 'assistant', reply);

  res.json({ reply });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Něco se pokazilo.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(port, () => {
  logger.info(`Server naslouchá na portu ${port}`);
});
