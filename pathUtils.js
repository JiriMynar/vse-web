import fs from 'fs';
import os from 'os';
import path from 'path';

function isWritable(directory) {
  try {
    fs.accessSync(directory, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function ensureWritableDir({ envVar, defaultSubdir }) {
  const candidates = [];

  if (envVar && process.env[envVar]) {
    candidates.push(path.resolve(process.env[envVar]));
  }

  if (defaultSubdir) {
    candidates.push(path.join(process.cwd(), defaultSubdir));
  }

  const homeDir = os.homedir();
  if (homeDir) {
    const homeBase = path.join(homeDir, '.vse-web');
    candidates.push(defaultSubdir ? path.join(homeBase, defaultSubdir) : homeBase);
  }

  const tmpBase = path.join(os.tmpdir(), 'vse-web');
  const tmpDir = defaultSubdir ? path.join(tmpBase, defaultSubdir) : tmpBase;
  candidates.push(tmpDir);

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      if (isWritable(candidate)) {
        return candidate;
      }
    } catch (error) {
      if (error.code === 'EROFS' || error.code === 'EACCES') {
        continue;
      }
      if (error.code === 'EEXIST' && isWritable(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error(`Nebylo možné vytvořit zapisovatelný adresář pro ${defaultSubdir || envVar || 'aplikaci'}`);
}
