import jwt from 'jsonwebtoken';

const TOKEN_COOKIE = 'token';
const defaultSecret = 'change-me-secret';

export function signToken(payload, expiresIn = '7d') {
  const secret = process.env.JWT_SECRET || defaultSecret;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || defaultSecret;
  return jwt.verify(token, secret);
}

export function authMiddleware(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE] || (req.headers.authorization || '').replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Nejste přihlášen(a).' });
  }

  try {
    const data = verifyToken(token);
    req.user = data;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Neplatný nebo expirovaný token.' });
  }
}

export function attachTokenCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearTokenCookie(res) {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
}
