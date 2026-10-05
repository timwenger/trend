import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const localEnvironmentPath = join(projectRoot, '.env.local');
const generatedModulePath = join(projectRoot, 'src', 'environments', 'primeui-license.generated.ts');

function readLocalLicense() {
  if (!existsSync(localEnvironmentPath)) {
    return '';
  }

  const line = readFileSync(localEnvironmentPath, 'utf8')
    .split(/\r?\n/)
    .find(value => value.trimStart().startsWith('PRIMEUI_LICENSE='));

  if (!line) {
    return '';
  }

  const value = line.slice(line.indexOf('=') + 1).trim();
  const hasMatchingQuotes =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));

  return hasMatchingQuotes ? value.slice(1, -1) : value;
}

const license = process.env.PRIMEUI_LICENSE?.trim() || readLocalLicense();

writeFileSync(
  generatedModulePath,
  `export const primeUiLicense = ${JSON.stringify(license)};\n`,
  'utf8',
);

if (!license) {
  console.warn('PrimeUI license is not configured. Set PRIMEUI_LICENSE or add it to webapp/.env.local.');
}
