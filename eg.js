import RNFS from "react-native-fs";
import RNFetchBlob from "rn-fetch-blob";
import * as onnx from "onnxruntime-react-native";
import { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native"; // Ensure correct import

export const useModel = () => {
  const classes = ["non-suspicious", "suspicious"];
  const modelRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [prediction, setPrediction] = useState("");

  useEffect(() => {
    const initializeTensorFlow = async () => {
      await tf.ready();
      await loadModel();
      await tf.setBackend("cpu"); // or 'webgl'
    };
    initializeTensorFlow();
  }, []);

  const copyModelToAccessibleLocation = async () => {
    const assetModelPath = "model.onnx";
    const destPath = `${RNFS.DocumentDirectoryPath}/model.onnx`;

    try {
      const fileExists = await RNFetchBlob.fs.exists(destPath);
      if (!fileExists) {
        await RNFetchBlob.fs.cp(RNFetchBlob.fs.asset(assetModelPath), destPath);
      }
    } catch (error) {
      console.error("Error copying model:", error);
    }
  };

  const loadModel = async () => {
    try {
      await copyModelToAccessibleLocation();
      const modelPath = `${RNFS.DocumentDirectoryPath}/model.onnx`;
      const fileExists = await RNFS.exists(modelPath);

      if (!fileExists) {
        throw new Error("Model file does not exist at path: " + modelPath);
      }

      const session = await onnx.InferenceSession.create(modelPath);
      modelRef.current = session;
      setModelLoaded(true);
      Alert.alert("Model Loaded");
    } catch (e) {
      Alert.alert("Failed to load model", `${e}`);
    }
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

  const predictImage = async (uri) => {
    try {
      if (!modelRef.current) {
        throw new Error("Model not loaded");
      }

      const inputData = await preprocessImage(uri);
      console.log(inputData.size, "length");
      console.log("Input Data shape:", inputData.shape);

      const feeds = {};
      feeds[modelRef.current.inputNames[0]] = new onnx.Tensor(
        "float32",
        inputData.dataSync(),
        [1, 3, 224, 224]
      );
      console.log(modelRef.current, "my Model");

      const fetches = await modelRef.current.run(feeds);
      console.log(fetches, "fetches");
      const output = fetches[modelRef.current.outputNames[0]];

      if (!output) {
        Alert.alert(
          "Failed to get output",
          `${modelRef.current.outputNames[0]}`
        );
      } else {
        const outputData = output.data;
        const predIndex = outputData.indexOf(Math.max(...outputData));
        setPrediction(classes[predIndex]);
        Alert.alert(
          "Model inference successful",
          `Predicted outcome: ${classes[predIndex]}`
        );
      }
    } catch (e) {
      Alert.alert("Failed to run model", `${e}`);
      console.log(e, "lalalalal");
      throw e;
    }
  };

  return { modelLoaded, predictImage, prediction };
};
 