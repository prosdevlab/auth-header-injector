const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// Simple PNG generator
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '../src/icons');

// Create a simple colored square PNG manually
function createSimplePNG(size, color = [59, 130, 246]) {
  const width = size;
  const height = size;

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(2, 17); // Color type (RGB)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace

  const crc = zlib.crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(crc, 21);

  // IDAT chunk - solid blue color
  const pixelData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    pixelData[y * (1 + width * 3)] = 0; // Filter type
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 3) + 1 + x * 3;
      pixelData[offset] = color[0]; // R
      pixelData[offset + 1] = color[1]; // G
      pixelData[offset + 2] = color[2]; // B
    }
  }

  const compressed = zlib.deflateSync(pixelData);
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const idatCrc = zlib.crc32(idat.subarray(4, 8 + compressed.length));
  idat.writeUInt32BE(idatCrc, 8 + compressed.length);

  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Generate icons
for (const size of sizes) {
  const png = createSimplePNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`✓ Created icon-${size}.png`);
}

console.log('\n✓ Icons generated successfully!');
