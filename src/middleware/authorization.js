export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Tato akce je dostupná pouze administrátorům.' });
  }
  return next();
}
