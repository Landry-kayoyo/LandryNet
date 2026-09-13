import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = path.resolve(import.meta.dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const optimizedDir = path.join(assetsDir, 'optimized');

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function ensureCleanOptimizedDir() {
  try {
    await fs.rm(optimizedDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Unable to clear optimized assets dir:', error);
  }

  await fs.mkdir(optimizedDir, { recursive: true });
}

async function optimizeFile(inputPath, outputName) {
  const source = sharp(inputPath);
  const metadata = await source.metadata();
  const maxDimension = Math.max(metadata.width ?? 1800, metadata.height ?? 1800);
  const resizeWidth = maxDimension > 1800 ? 1800 : metadata.width ?? 1800;

  const resized = await source
    .resize({
      width: resizeWidth,
      height: 1800,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();

  const optimizedSource = sharp(resized);

  await optimizedSource
    .webp({ quality: 74, effort: 6 })
    .toFile(path.join(optimizedDir, `${outputName}.webp`));

  await optimizedSource
    .avif({ quality: 68, effort: 6 })
    .toFile(path.join(optimizedDir, `${outputName}.avif`));
}

async function main() {
  await ensureCleanOptimizedDir();

  const entries = await fs.readdir(assetsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!imageExtensions.has(ext) || entry.name.startsWith('.')) {
      continue;
    }

    const inputPath = path.join(assetsDir, entry.name);

    if (entry.name.endsWith('.webp') || entry.name.endsWith('.avif')) {
      continue;
    }

    const outputName = path.basename(entry.name, ext);

    await optimizeFile(inputPath, outputName);
  }
}

main().catch((error) => {
  console.error('Image optimization failed:', error);
  process.exit(1);
});
