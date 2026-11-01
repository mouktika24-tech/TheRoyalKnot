const assert = require('node:assert/strict');
const { test } = require('node:test');
const sharp = require('sharp');
const {
  MAX_IMAGE_BYTES,
  validateSignatureImage
} = require('../src/utils/signatureImageValidation');

async function createImage(format, width = 8, height = 6) {
  return sharp({
    create: { width, height, channels: 3, background: '#456789' }
  })[format]().toBuffer();
}

function dataUrl(format, buffer) {
  return `data:image/${format};base64,${buffer.toString('base64')}`;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function animatedPng(staticPng) {
  const signature = staticPng.subarray(0, 8);
  const chunks = [];
  for (let offset = 8; offset < staticPng.length;) {
    const length = staticPng.readUInt32BE(offset);
    const type = staticPng.toString('ascii', offset + 4, offset + 8);
    const data = staticPng.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += length + 12;
  }

  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR');
  const idat = chunks.find((chunk) => chunk.type === 'IDAT');
  const animationControl = Buffer.alloc(8);
  animationControl.writeUInt32BE(2, 0);
  animationControl.writeUInt32BE(0, 4);

  function frameControl(sequence) {
    const data = Buffer.alloc(26);
    data.writeUInt32BE(sequence, 0);
    data.writeUInt32BE(ihdr.data.readUInt32BE(0), 4);
    data.writeUInt32BE(ihdr.data.readUInt32BE(4), 8);
    data.writeUInt16BE(1, 20);
    data.writeUInt16BE(10, 22);
    return data;
  }

  const frameData = Buffer.alloc(4 + idat.data.length);
  frameData.writeUInt32BE(2, 0);
  idat.data.copy(frameData, 4);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr.data),
    pngChunk('acTL', animationControl),
    pngChunk('fcTL', frameControl(0)),
    pngChunk('IDAT', idat.data),
    pngChunk('fcTL', frameControl(1)),
    pngChunk('fdAT', frameData),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

async function expectInvalid(value, messagePattern) {
  await assert.rejects(
    validateSignatureImage(value),
    (error) => error.statusCode === 400 && messagePattern.test(error.message)
  );
}

test('valid PNG and JPEG data URLs are fully decoded and report dimensions', async () => {
  for (const format of ['png', 'jpeg']) {
    const image = await createImage(format);
    const result = await validateSignatureImage(dataUrl(format, image));
    assert.deepEqual(result, {
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      width: 8,
      height: 6,
      sizeBytes: image.length
    });
  }
});

test('rejects invalid data URLs and unsupported MIME types', async () => {
  await expectInvalid('not a data URL', /data:image/);
  await expectInvalid('data:image/gif;base64,AAAA', /data:image/);
});

test('rejects malformed, invalid, and non-canonical Base64', async () => {
  await expectInvalid('data:image/png;base64,abc', /invalid Base64/);
  await expectInvalid('data:image/png;base64,AA=A', /invalid Base64/);
  await expectInvalid('data:image/png;base64,AB==', /non-canonical Base64/);
});

test('rejects MIME type and image content mismatches', async () => {
  const jpeg = await createImage('jpeg');
  await expectInvalid(dataUrl('png', jpeg), /MIME type does not match/);
});

test('rejects corrupted and empty image data', async () => {
  const png = await createImage('png');
  const corrupted = Buffer.from(png);
  for (let offset = 8; offset + 12 <= corrupted.length;) {
    const chunkLength = corrupted.readUInt32BE(offset);
    const chunkType = corrupted.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'IDAT') {
      corrupted[offset + 8 + Math.floor(chunkLength / 2)] ^= 0xff;
      break;
    }
    offset += chunkLength + 12;
  }
  await sharp(corrupted).metadata();
  await expectInvalid(dataUrl('png', corrupted), /decodable|corrupted/);
  await expectInvalid('data:image/png;base64,', /must not be empty/);
});

test('accepts a valid image whose decoded file size is exactly 1 MiB', async () => {
  const png = await createImage('png', 1, 1);
  const exactLimit = Buffer.concat([
    png,
    Buffer.alloc(MAX_IMAGE_BYTES - png.length)
  ]);
  const result = await validateSignatureImage(dataUrl('png', exactLimit));
  assert.equal(result.sizeBytes, MAX_IMAGE_BYTES);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
});

test('rejects decoded image data larger than 1 MiB', async () => {
  const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1);
  await expectInvalid(dataUrl('png', oversized), /must not exceed 1048576/);
});

test('rejects width and height above the configured bounds', async () => {
  const tooWide = await createImage('png', 4097, 1);
  await expectInvalid(dataUrl('png', tooWide), /dimensions must not exceed/);

  const tooTall = await createImage('png', 1, 4097);
  await expectInvalid(dataUrl('png', tooTall), /dimensions must not exceed/);
});

test('rejects total pixel counts above the configured limit', async () => {
  const tooManyPixels = await createImage('png', 2049, 2049);
  await expectInvalid(dataUrl('png', tooManyPixels), /total pixels/);
});

test('rejects animated PNG inputs', async () => {
  const stillImage = await createImage('png', 1, 1);
  const animated = animatedPng(stillImage);
  assert.ok(animated.includes(Buffer.from('acTL')));
  await expectInvalid(dataUrl('png', animated), /single image/);
});
