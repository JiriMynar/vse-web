import { createAgentkitSession } from '../services/agentkitService.js';

export async function createAgentkitSessionController(req, res, next) {
  try {
    const session = await createAgentkitSession(req.body || {});
    res.json(session);
  } catch (error) {
    next(error);
  }
}
