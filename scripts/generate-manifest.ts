import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mcData from 'minecraft-data';
//@ts-expect-error no types
import mcAssets from 'minecraft-assets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

let srcBlocksPath = path.join(
  projectRoot,
  'Minecraft-default-assets/assets/minecraft/textures/block'
);
let srcItemsPath = path.join(
  projectRoot,
  'Minecraft-default-assets/assets/minecraft/textures/item'
);

if (!fs.existsSync(srcBlocksPath)) {
  try {
    const latestVersion = mcData.versions.pc.find(
      (v) => v.releaseType === 'release' && mcAssets(v.minecraftVersion)
    )?.minecraftVersion;
    const assetsObj = mcAssets(latestVersion);
    srcBlocksPath = path.join(assetsObj.directory, 'blocks');
    srcItemsPath = path.join(assetsObj.directory, 'items');
  } catch {
    // fallback to default paths
  }
}

const publicBlocksPath = path.join(projectRoot, 'public/editor/Images/blocks');
const publicFramesPath = path.join(projectRoot, 'public/editor/Images/frames');
const publicItemsPath = path.join(projectRoot, 'public/editor/Images/items');

fs.mkdirSync(publicBlocksPath, { recursive: true });
fs.mkdirSync(publicFramesPath, { recursive: true });
fs.mkdirSync(publicItemsPath, { recursive: true });

const copyPngFiles = (srcDir: string, destDirs: string[]): string[] => {
  try {
    const files = fs
      .readdirSync(srcDir)
      .filter((file) => file.endsWith('.png') && !file.endsWith('.mcmeta'));

    for (const file of files) {
      const srcFile = path.join(srcDir, file);
      for (const destDir of destDirs) {
        const destFile = path.join(destDir, file);
        fs.copyFileSync(srcFile, destFile);
      }
    }

    return files.map((file) => file.replace('.png', ''));
  } catch (e) {
    console.error('Failed to copy files from', srcDir, e);
    return [];
  }
};

const rawBlocks = copyPngFiles(srcBlocksPath, [
  publicBlocksPath,
  publicFramesPath,
]);
const rawItems = copyPngFiles(srcItemsPath, [publicItemsPath]);

const texFiles = new Set(rawBlocks);

const getIconTexture = (name: string): string | null => {
  if (texFiles.has(name)) return name;
  const candidates = [
    name + '_side',
    name + '_front',
    name + '_top',
    name + '_block',
    name + '_bottom',
    name + '_0',
    name + '_stage0',
  ];
  for (const c of candidates) {
    if (texFiles.has(c)) return c;
  }
  return null;
};

// Method 1: Switch to a Block Registry using minecraft-data (Latest supported version e.g. 26.2 / 26.1 / latest)
const targetVersion =
  mcData.supportedVersions.pc.find((v) => v === '26.2') ||
  mcData.supportedVersions.pc[mcData.supportedVersions.pc.length - 1];

const mc = mcData(targetVersion);
const blocksRegistry = mc.blocksArray
  .filter((b) => b.name !== 'air')
  .map((b) => {
    const icon = getIconTexture(b.name);
    if (!icon) return null;
    return {
      id: `minecraft:${b.name}`,
      key: b.name,
      name: b.displayName || b.name,
      icon,
    };
  })
  .filter(Boolean);

const manifest = {
  blocks: rawBlocks,
  frames: rawBlocks,
  items: rawItems,
};

const libManifestPath = path.join(projectRoot, 'src/lib/texture-manifest.json');
const libBlocksPath = path.join(projectRoot, 'src/lib/blocks.json');

fs.writeFileSync(libManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
fs.writeFileSync(
  libBlocksPath,
  JSON.stringify(blocksRegistry, null, 2),
  'utf8'
);

console.log(
  `Successfully generated Method 1 blocks.json with ${blocksRegistry.length} valid Minecraft blocks (1.21.4)`
);
console.log('Texture manifest and blocks.json generated successfully.');
