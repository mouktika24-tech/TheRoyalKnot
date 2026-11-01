const sharp = require('sharp');

const MAX_IMAGE_BYTES = 1_048_576;
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;
const MAX_PIXELS = 4_194_304;
const DATA_URL_PATTERN = /^data:image\/(png|jpeg);base64,([\s\S]*)$/;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function getDecodedLength(base64) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function containsApngAnimation(buffer) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < pngSignature.length || !buffer.subarray(0, 8).equals(pngSignature)) {
    return false;
  }

  for (let offset = 8; offset + 12 <= buffer.length;) {
    const chunkLength = buffer.readUInt32BE(offset);
    const chunkEnd = offset + 12 + chunkLength;
    if (chunkEnd > buffer.length) {
      return false;
    }

    const chunkType = buffer.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'acTL') {
      return true;
    }
    if (chunkType === 'IEND') {
      return false;
    }
    offset = chunkEnd;
  }

  return false;
}

async function validateSignatureImage(dataUrl) {
  if (typeof dataUrl !== 'string') {
    throw createValidationError('signature_data must be a PNG or JPEG Base64 data URL');
  }

  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw createValidationError('signature_data must use data:image/png;base64 or data:image/jpeg;base64');
  }

  const [, declaredFormat, base64] = match;
  if (!BASE64_PATTERN.test(base64) || base64.length % 4 !== 0) {
    throw createValidationError('signature_data contains invalid Base64 encoding');
  }

  const decodedLength = getDecodedLength(base64);
  if (decodedLength === 0) {
    throw createValidationError('signature_data image must not be empty');
  }
  if (decodedLength > MAX_IMAGE_BYTES) {
    throw createValidationError('signature_data image must not exceed 1048576 decoded bytes');
  }

  const imageBuffer = Buffer.from(base64, 'base64');
  let decodedPixels;

  try {
    if (
      imageBuffer.length !== decodedLength
      || imageBuffer.toString('base64') !== base64
    ) {
      throw createValidationError('signature_data contains non-canonical Base64 encoding');
    }

    if (declaredFormat === 'png' && containsApngAnimation(imageBuffer)) {
      throw createValidationError('signature_data must contain a single image, not an animated or multi-page image');
    }

    let metadata;
    try {
      metadata = await sharp(imageBuffer, {
        animated: true,
        failOn: 'warning',
        limitInputPixels: MAX_WIDTH * MAX_HEIGHT
      }).metadata();
    } catch {
      throw createValidationError('signature_data is not a valid decodable PNG or JPEG image');
    }

    if (metadata.format !== declaredFormat) {
      throw createValidationError('signature_data MIME type does not match the image content');
    }
    if (metadata.pages > 1) {
      throw createValidationError('signature_data must contain a single image, not an animated or multi-page image');
    }
    if (
      !Number.isInteger(metadata.width)
      || !Number.isInteger(metadata.height)
      || metadata.width < 1
      || metadata.height < 1
    ) {
      throw createValidationError('signature_data image dimensions are invalid');
    }
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      throw createValidationError('signature_data image dimensions must not exceed 4096 by 4096 pixels');
    }
    if (metadata.width * metadata.height > MAX_PIXELS) {
      throw createValidationError('signature_data image must not exceed 4194304 total pixels');
    }

    try {
      const { data: pixels } = await sharp(imageBuffer, {
        animated: false,
        failOn: 'warning',
        limitInputPixels: MAX_PIXELS
      }).raw().toBuffer({ resolveWithObject: true });
      decodedPixels = pixels;
    } catch {
      throw createValidationError('signature_data image is corrupted or cannot be fully decoded');
    }

    return {
      mimeType: declaredFormat === 'png' ? 'image/png' : 'image/jpeg',
      width: metadata.width,
      height: metadata.height,
      sizeBytes: imageBuffer.length
    };
  } finally {
    imageBuffer.fill(0);
    if (decodedPixels) {
      decodedPixels.fill(0);
    }
  }
}

module.exports = {
  MAX_HEIGHT,
  MAX_IMAGE_BYTES,
  MAX_PIXELS,
  MAX_WIDTH,
  validateSignatureImage
};
