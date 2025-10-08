import { getHelpContent } from '../services/helpService.js';

export async function helpController(req, res, next) {
  try {
    const help = await getHelpContent();
    res.json(help);
  } catch (error) {
    next(error);
  }
}
