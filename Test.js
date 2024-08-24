import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer'; // For handling binary data
import {decodeJpeg} from './decodeJpeg';

const App = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const softmax = logits => {
    const expScores = logits.map(l => Math.exp(l - Math.max(...logits))); // Numerical stability
    const sumExpScores = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(expScore => expScore / sumExpScores);
  };

  const classifyImage = output => {
    const logits = output.cpuData; // Example: [-1.6436803340911865, -0.21476303040981293]
    const classes = ["Non-Suspicious","Suspicious"];
    const probabilities = softmax(logits);
    console.log(probabilities)
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    return classes[maxIndex];
  };

  const processImage = async imagePath => {
    try {
      // Read the image file as base64
      const response = await fetch(imagePath);
      const imageData = await response.blob();

      const arrayBufferPromise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(imageData);
      });

      const rawImageData = await arrayBufferPromise;
      console.log('Raw image data length:', rawImageData.byteLength);

      // Decode image and create tensor
      const imgTensor = decodeJpeg(new Uint8Array(rawImageData));

      console.log('imgTensor shape:', imgTensor.shape);

      // Ensure tensor data and shape are correctly formatted
      const tensorData = imgTensor.data; // Float32Array of image data
      const tensorShape = [...imgTensor.shape]; // Ensure it's a valid number array

      // Ensure shape is correct
      console.log('Processed tensor shape:', tensorShape);

      // Create tensor with correct dimensions and type
      const tensor = new Tensor('float32', tensorData, tensorShape);
      console.log('Tensor:', tensor);

      const modelPath = `${RNFS.DocumentDirectoryPath}/model.onnx`;
      await RNFS.copyFileAssets('model.onnx', modelPath);

      // Run inference
      const session = await InferenceSession.create(modelPath);
      const feeds = {input: tensor}; // Replace 'input' with the actual input name of your model
      const results = await session.run(feeds);
      const classificationResult = classifyImage(results.output);

      console.log('results', classificationResult);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = () => {
    setLoading(true);
    ImagePicker.openPicker({
      width: 224,
      height: 224,
      cropping: true,
    })
      .then(image => {
        setImageUri(image.path);
        processImage(image.path);
      })
      .catch(error => {
        console.error('Error picking image:', error);
        setLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          {imageUri && <Image source={{uri: imageUri}} style={styles.image} />}
          {result ? (
            <Text style={styles.result}>
              Classification result: {JSON.stringify(result)}
            </Text>
          ) : (
            <Text style={styles.result}>No result yet</Text>
          )}
          <Button title="Pick Image and Classify" onPress={handleImagePick} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: 224,
    height: 224,
    marginBottom: 16,
  },
  result: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default App;
