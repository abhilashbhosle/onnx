import jpeg from 'jpeg-js';
import * as tf from '@tensorflow/tfjs';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally
global.Buffer = Buffer;

export function decodeJpeg(contents, channels = 3) {
  if (channels !== 3) {
    throw new Error('Only 3 channels are supported at this time');
  }

  // Decode JPEG
  const { width, height, data } = jpeg.decode(contents, { useTArray: true });

  console.log('Image width:', width);
  console.log('Image height:', height);
  console.log('Image data length:', data.length);

  if (width === undefined || height === undefined || data === undefined) {
    throw new Error('Image width, height, or data is undefined');
  }

  const imageData = new Float32Array(width * height * channels);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    imageData[j] = data[i] / 255;     // R channel
    imageData[j + 1] = data[i + 1] / 255; // G channel
    imageData[j + 2] = data[i + 2] / 255; // B channel
  }

  try {
    const tensor = tf.tensor3d(imageData, [height, width, channels], 'float32');
    console.log('Created Tensor:', tensor);
    return tensor;
  } catch (e) {
    console.error('Error creating Tensor from image data:', e.message);
    throw e;
  }
}
