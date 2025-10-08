export function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Požadovaný zdroj nebyl nalezen.' });
  }

  return res.status(404).send('Not found');
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Nastala neočekávaná chyba.',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  };

  if (res.headersSent) {
    return next(err);
  }

  if (req.path.startsWith('/api/')) {
    res.status(status).json(payload);
  } else {
    res.status(status).send(payload.message);
  }
}
