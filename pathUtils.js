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

export function ensureWritableDir({ envVar, defaultSubdir, requireEnv = false, purpose }) {
  const candidates = [];
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

  const configuredValue = envVar && process.env[envVar] ? path.resolve(process.env[envVar]) : null;
  if (configuredValue) {
    candidates.push(configuredValue);
  }

  const needsPersistentWarning = Boolean(requireEnv && envVar && !configuredValue && isProduction);

  const warnAboutFallback = (resolvedPath) => {
    if (needsPersistentWarning && !configuredValue) {
      console.warn(
        `V produkčním prostředí by měla být proměnná ${envVar} nastavena na perzistentní úložiště pro ${
          purpose || 'aplikaci'
        }. ` +
          `Používám fallbackový adresář ${resolvedPath}.`
      );
    }
  };

  const renderDiskRoots = [process.env.RENDER_DISK_ROOT, '/var/data', '/data'].filter(Boolean);
  for (const root of renderDiskRoots) {
    const resolved = defaultSubdir ? path.join(root, defaultSubdir) : root;
    if (!candidates.includes(resolved)) {
      candidates.push(resolved);
    }
  }

  if (requireEnv && envVar && !process.env[envVar] && isProduction) {
    throw new Error(
      `V produkčním prostředí musí být proměnná ${envVar} nastavena na cestu k perzistentnímu úložišti pro ${
        purpose || 'aplikaci'
      }.`
    );
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
        warnAboutFallback(candidate);
        return candidate;
      }
    } catch (error) {
      if (error.code === 'EROFS' || error.code === 'EACCES') {
        continue;
      }
      if (error.code === 'EEXIST' && isWritable(candidate)) {
        warnAboutFallback(candidate);
        return candidate;
      }
    }
  }

  if (needsPersistentWarning && !configuredValue) {
    throw new Error(
      `V produkčním prostředí musí být proměnná ${envVar} nastavena na cestu k perzistentnímu úložišti pro ${
        purpose || 'aplikaci'
      }.`
    );
  }

  throw new Error(`Nebylo možné vytvořit zapisovatelný adresář pro ${defaultSubdir || envVar || 'aplikaci'}`);
}
