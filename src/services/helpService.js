import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const helpFile = path.join(__dirname, '..', '..', 'docs', 'help.json');

let cache = null;

export async function getHelpContent() {
  if (cache) {
    return cache;
  }

  const raw = await fs.readFile(helpFile, 'utf-8');
  cache = JSON.parse(raw);
  return cache;
}
