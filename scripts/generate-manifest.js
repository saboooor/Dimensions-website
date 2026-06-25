import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const blocksPath = path.join(projectRoot, 'public/editor/portal/Images/blocks');
const framesPath = path.join(projectRoot, 'public/editor/portal/Images/frames');
const itemsPath = path.join(projectRoot, 'public/editor/portal/Images/items');

const getPngBasenames = (dirPath) => {
  try {
    return fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.png'))
      .map(file => file.replace('.png', ''));
  } catch (e) {
    console.error('Failed to read directory', dirPath, e);
    return [];
  }
};

const manifest = {
  blocks: getPngBasenames(blocksPath),
  frames: getPngBasenames(framesPath),
  items: getPngBasenames(itemsPath),
};

const outputPath = path.join(projectRoot, 'src/util/texture-manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Texture manifest generated successfully at', outputPath);
