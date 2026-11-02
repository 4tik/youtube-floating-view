import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(crcData), 8 + len);
  return chunk;
}

function generatePNG(width, height, renderPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = writeChunk('IHDR', ihdr);
  const idatChunk = writeChunk('IDAT', deflated);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function inRoundedRect(px, py, rx, ry, rw, rh, radius) {
  if (px < rx || px > rx + rw || py < ry || py > ry + rh) return false;
  const dx = Math.max(rx + radius - px, 0, px - (rx + rw - radius));
  const dy = Math.max(ry + radius - py, 0, py - (ry + rh - radius));
  return (dx * dx + dy * dy) <= radius * radius;
}

function renderYouTubeFloatingViewIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Outer YouTube display screen
  const mainX = 0.06;
  const mainY = 0.12;
  const mainW = 0.88;
  const mainH = 0.76;
  const mainRadius = 0.22;

  // Floating PiP overlay window (lower-right)
  const pipW = 0.50;
  const pipH = 0.44;
  const pipX = 0.94 - pipW;
  const pipY = 0.88 - pipH;
  const pipRadius = 0.14;

  const inPipInner = inRoundedRect(nx, ny, pipX, pipY, pipW, pipH, pipRadius);
  const inPipBorder = inRoundedRect(nx, ny, pipX - 0.04, pipY - 0.04, pipW + 0.08, pipH + 0.08, pipRadius + 0.03);

  // Play triangle inside floating window
  const pipCenterX = pipX + pipW * 0.52;
  const pipCenterY = pipY + pipH * 0.5;
  const pRelX = (nx - pipCenterX) / pipW;
  const pRelY = (ny - pipCenterY) / pipH;

  const inPipPlay = inPipInner && (
    pRelX >= -0.22 && pRelX <= 0.24 &&
    pRelY >= -0.25 && pRelY <= 0.25 &&
    pRelY <= (0.25 - (pRelX - -0.22) * 0.54) &&
    pRelY >= (-0.25 + (pRelX - -0.22) * 0.54)
  );

  // Main YouTube screen play triangle (subtle or translucent behind PiP)
  const mCenterX = mainX + mainW * 0.36;
  const mCenterY = mainY + mainH * 0.50;
  const mRelX = (nx - mCenterX) / (mainW * 0.5);
  const mRelY = (ny - mCenterY) / (mainH * 0.5);
  const inMainPlay = inRoundedRect(nx, ny, mainX, mainY, mainW, mainH, mainRadius) && (
    mRelX >= -0.20 && mRelX <= 0.22 &&
    mRelY >= -0.26 && mRelY <= 0.26 &&
    mRelY <= (0.26 - (mRelX - -0.20) * 0.62) &&
    mRelY >= (-0.26 + (mRelX - -0.20) * 0.62)
  );

  // Layer 1: Floating window play icon
  if (inPipPlay) {
    return [255, 255, 255, 255]; // Crisp white
  }

  // Layer 2: Floating window body (rich YouTube Red / crimson gradient)
  if (inPipInner) {
    const t = (nx - pipX) / pipW;
    const r = Math.round(255 - t * 25);
    const g = Math.round(18 - t * 10);
    const b = Math.round(18 + t * 10);
    return [r, g, b, 255];
  }

  // Layer 3: Floating window outer border / glow
  if (inPipBorder) {
    return [15, 23, 42, 255]; // Dark slate border for extreme contrast
  }

  // Layer 4: Main screen inner play icon
  if (inMainPlay) {
    return [255, 255, 255, 180]; // Translucent white in background screen
  }

  // Layer 5: Main screen body (Dark slate / deep indigo cinema display)
  if (inRoundedRect(nx, ny, mainX, mainY, mainW, mainH, mainRadius)) {
    // Subtle top-to-bottom monitor gradient
    const grad = ny;
    const r = Math.round(26 + grad * 12);
    const g = Math.round(32 + grad * 16);
    const b = Math.round(44 + grad * 24);
    return [r, g, b, 255];
  }

  return [0, 0, 0, 0]; // Transparent
}

const outDir = path.resolve('./public/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const png = generatePNG(size, size, renderYouTubeFloatingViewIcon);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${size}x${size}) for YouTube Floating View`);
}
