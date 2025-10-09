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
  const candidateErrors = new Map();

  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

  const configuredValue = envVar && process.env[envVar] ? path.resolve(process.env[envVar]) : null;
  if (configuredValue) {
    candidates.push(configuredValue);
  }

  const needsPersistentWarning = Boolean(requireEnv && envVar && !configuredValue && isProduction);

  const renderDiskRoots = [process.env.RENDER_DISK_ROOT, '/var/data', '/data'].filter(Boolean);
  const persistentRoots = renderDiskRoots.map((root) => path.resolve(root));
  const renderExampleRoots = [...new Set(renderDiskRoots.map((root) => path.posix.normalize(root)))];

  const warnAboutFallback = (resolvedPath) => {
    const normalizedResolved = path.resolve(resolvedPath);
    const usesKnownPersistentRoot = persistentRoots.some(
      (root) => normalizedResolved === root || normalizedResolved.startsWith(`${root}${path.sep}`)
    );

    if (needsPersistentWarning && !configuredValue && !usesKnownPersistentRoot) {
      console.warn(
        `V produkčním prostředí by měla být proměnná ${envVar} nastavena na perzistentní úložiště pro ${
          purpose || 'aplikaci'
        }. ` +
          `Používám dočasný fallback ${normalizedResolved}. Nastavte ${envVar} na cestu k perzistentnímu úložišti, aby data vydržela i po redeployi.`
      );
    }
  };

  for (const root of renderDiskRoots) {
    const resolved = defaultSubdir ? path.join(root, defaultSubdir) : root;
    if (!candidates.includes(resolved)) {
      candidates.push(resolved);
    }

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

      candidateErrors.set(candidate, {
        code: 'NOT_WRITABLE',
        message: 'Adresář existuje, ale proces do něj nemůže zapisovat.'
      });
    } catch (error) {
      candidateErrors.set(candidate, { code: error.code || 'UNKNOWN', message: error.message });
      if (error.code === 'EROFS' || error.code === 'EACCES' || error.code === 'EPERM') {
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

  const details =
    candidateErrors.size > 0
      ? ` (zkoušeno: ${
          [...candidateErrors.entries()]
            .map(([dir, info]) => {
              const messagePart = info.message ? `: ${info.message}` : '';
              return `${dir} [${info.code}${messagePart}]`;
            })
            .join(', ')
        })`
      : '';

  const guidanceParts = [];

  if (envVar) {
    guidanceParts.push(
      `Nastavte proměnnou ${envVar} na adresář, kam může aplikace zapisovat, nebo upravte oprávnění k uvedeným cestám.`
    );
  } else {
    guidanceParts.push('Zkontrolujte oprávnění k souborovému systému a případně zvolte jiný adresář.');
  }

  if (isProduction && process.env.RENDER === 'true') {
    const renderExamplePaths = renderExampleRoots.length > 0
      ? renderExampleRoots.map((root) => (defaultSubdir ? path.posix.join(root, defaultSubdir) : root))
      : [defaultSubdir ? path.posix.join('/var/data', defaultSubdir) : '/var/data'];
    guidanceParts.push(
      `Na Render.com v detailu služby otevřete kartu Disks a zapněte Persistent Disk. Poté nastavte ${
        envVar || 'příslušnou proměnnou'
      } například na ${renderExamplePaths.join(' nebo ')}.`
    );
  }

  const guidance = guidanceParts.length > 0 ? ` ${guidanceParts.join(' ')}` : '';

  throw new Error(
    `Nebylo možné vytvořit zapisovatelný adresář pro ${defaultSubdir || envVar || 'aplikaci'}${details}.${guidance}`
  );
}
