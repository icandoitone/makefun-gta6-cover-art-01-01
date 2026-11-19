// Vice Sunset — the entry program (Node 22, standard library only).
//
// Copies app/ and screenshots/ from this repository into the output
// directory, then writes /output/dossier.json with buildDossier from the
// kit's vendor/makefun-app.ts, exactly as the bounty requires. The
// output directory is MAKEFUN_OUTPUT_DIR when set, else /output.
// The run is deterministic: the same repository writes the same bytes.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const appDir = join(repoDir, 'app');
const shotsDir = join(repoDir, 'screenshots');

if (!existsSync(appDir)) {
  throw new Error(`no app/ directory in ${repoDir}`);
}
if (!existsSync(shotsDir)) {
  throw new Error(`no screenshots/ directory in ${repoDir}`);
}

mkdirSync(outDir, { recursive: true });
// Clear anything a previous run left behind, so running twice into the
// same directory still writes exactly this repository's files.
for (const name of ['app', 'screenshots', 'dossier.json']) {
  rmSync(join(outDir, name), { recursive: true, force: true });
}
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const sha = createHash('sha256').update(dossier).digest('hex');
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes, sha256 ${sha})`);
