import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconsDir = join(__dirname, '../src/icons');
const mainIconPath = join(iconsDir, 'icon-main.png');

const sizes = [16, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(mainIconPath)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));
    console.log(`✓ Created icon-${size}.png`);
  }
  console.log('\n✓ Icons generated successfully!');
}

generateIcons().catch(console.error);
