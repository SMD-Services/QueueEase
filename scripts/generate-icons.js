import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(2, 9); // Color type 2: RGB
  ihdr.writeUInt8(0, 10); // Compression method 0
  ihdr.writeUInt8(0, 11); // Filter method 0
  ihdr.writeUInt8(0, 12); // Interlace 0

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Raw image data with 0-filter per scanline
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength;
    rawData[offset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 3;
      // Slight vertical gradient from #142D4E (20, 45, 78) to #2563EB (37, 99, 235)
      const ratio = y / height;
      const curR = Math.round(20 * (1 - ratio) + 37 * ratio);
      const curG = Math.round(45 * (1 - ratio) + 99 * ratio);
      const curB = Math.round(78 * (1 - ratio) + 235 * ratio);

      // Check center square/ticket icon
      const cx = width / 2;
      const cy = height / 2;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const inBox = dx < width * 0.28 && dy < height * 0.28;

      if (inBox && (dx > width * 0.24 || dy > height * 0.24 || (dy < height * 0.05 && dx < width * 0.18))) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else {
        rawData[pxOffset] = curR;
        rawData[pxOffset + 1] = curG;
        rawData[pxOffset + 2] = curB;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressedData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Minimal CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const iconsDir = path.resolve('assets/icons');
const publicDir = path.resolve('public');
fs.mkdirSync(iconsDir, { recursive: true });

// 1. Generate 192x192
const p192 = createPNG(192, 192, 20, 45, 78);
fs.writeFileSync(path.join(iconsDir, 'pwa-192x192.png'), p192);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), p192);

// 2. Generate 512x512
const p512 = createPNG(512, 512, 20, 45, 78);
fs.writeFileSync(path.join(iconsDir, 'pwa-512x512.png'), p512);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), p512);

// 3. Maskable 512x512
fs.writeFileSync(path.join(iconsDir, 'pwa-maskable-512x512.png'), p512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), p512);

// 4. Apple Touch Icon (180x180)
const p180 = createPNG(180, 180, 20, 45, 78);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), p180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), p180);

console.log('PWA PNG Icons successfully generated!');
