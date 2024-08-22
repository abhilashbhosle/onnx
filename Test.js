import React, { useState, useEffect, } from 'react';
import { View, Text, Button, StyleSheet, Image,Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { InferenceSession } from 'onnxruntime-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native'; // TensorFlow.js React Native integration
import { Buffer } from 'buffer'; // Add Buffer import
import jpeg from 'jpeg-js';
import { decodeJpeg } from './decodeJpeg';
// import { decodeJpeg } from '@tensorflow/tfjs-react-native';

// Polyfill Buffer globally
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

const Test = () => {
  const [session, setSession] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);

  useEffect(() => {
    const initializeTensorFlow = async () => {
      await tf.ready();
      
      console.log("TensorFlow is ready");

      const initializeSession = async () => {
        try {
          const modelPath = `${RNFS.DocumentDirectoryPath}/model.onnx`;
          await RNFS.copyFileAssets('model.onnx', modelPath);
          const modelSession = await InferenceSession.create(modelPath);
          setSession(modelSession);
        } catch (error) {
          console.error('Failed to load ONNX model', error);
        }
      };

      initializeSession();
    };

    initializeTensorFlow();
  }, []);
useEffect(()=>{
  
},[])
  const pickImage = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping:true,
      height:224,
      width:224
    }).then(async (image) => {
      const uri = image.path;
      setImageUri(uri);
      classifyImage(uri);
      console.log(uri)
    }).catch((error) => {
      console.error('Error picking image:', error);
    });
  };

  async function preprocessImage(uri) {
    console.log("PreProcessing Started");
    try {
      const response = await fetch(uri);
 
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
 
      const imageData = await response.blob();
 
      const arrayBufferPromise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(imageData);
      });
 
      const rawImageData = await arrayBufferPromise;
      console.log("Raw image data length:", rawImageData.byteLength);
 
      // Decode the image using TensorFlow.js
      let imgTensor;
      try {
        imgTensor = decodeJpeg(new Uint8Array(rawImageData));
      } catch (decodeError) {
        console.error("Failed to decode JPEG:", decodeError);
        throw decodeError;
      }
 
      console.log("Decoded image shape:", imgTensor.shape); // Should log [height, width, 3]
 
      // Verify the type and shape of the tensor before resizing
      console.log("Type of imgTensor:", imgTensor.constructor.name);
      console.log("Shape of imgTensor:", imgTensor.shape);
 
      // Ensure imgTensor is a tf.Tensor before resizing
      if (!(imgTensor instanceof tf.Tensor)) {
        throw new Error("Decoded image is not a tensor");
      }
 
      // Resize the image to 224x224
      imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224], true);
      console.log("Resized image shape:", imgTensor.shape); // Should log [224, 224, 3]
 
      // Normalize the image
      const mean = [0.485, 0.456, 0.406];
      const std = [0.229, 0.224, 0.225];
      imgTensor = imgTensor.div(tf.scalar(255.0));
      imgTensor = imgTensor.sub(tf.tensor(mean)).div(tf.tensor(std));
 
      // Transpose and add batch dimension: from [224, 224, 3] to [1, 3, 224, 224]
      imgTensor = imgTensor.transpose([2, 0, 1]).expandDims(0);
 
      console.log("Final tensor shape:", imgTensor.shape); // Should log [1, 3, 224, 224]
      console.log("Preprocessing finished");
      return imgTensor;
    } catch (e) {
      Alert.alert("Failed to preprocess image", `${e}`);
      throw e;
    }
  }

  const classifyImage = async (uri) => {
    if (!session) {
      console.log('Model session is not initialized yet.');
      return;
    }

    const tensor = await preprocessImage(uri);
    if (!tensor) {
      console.log('Failed to preprocess the image.');
      return;
    }

    try {
      const input = { input: tensor };
      const outputMap = await session.run(input);

      const outputData = outputMap['output'].data;
      const prediction = mapOutputToLabels(outputData);
      setClassificationResult(prediction);
    } catch (error) {
      console.error('Error during inference:', error);
    }
  };

  const mapOutputToLabels = (output) => {
    const labels = ['cat', 'dog', 'car', 'flower'];
    const predictedIndex = output.indexOf(Math.max(...output));
    return labels[predictedIndex];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Classifier</Text>
      <Button title="Pick Image" onPress={pickImage} />
      {imageUri && (
        <Image
          style={styles.image}
          source={{ uri: imageUri }}
        />
      )}
      {classificationResult && (
        <Text style={styles.result}>Prediction: {classificationResult}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  image: {
    width: 224,
    height: 224,
    marginTop: 20,
  },
  result: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: 'bold',
  },
});

export default Test;
