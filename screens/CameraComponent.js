// CameraComponent.js
import React, { useRef, useState, useEffect } from 'react';
import { View, Button, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { RNCamera } from 'react-native-camera';

const CameraComponent = () => {
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // For iOS
    };

    const checkPermissions = async () => {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('Camera permission denied');
      }
    };

    checkPermissions();
  }, []);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      console.log(data.uri); // Handle the image URI as needed
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        onCameraReady={handleCameraReady}
      >
        <View style={styles.buttonContainer}>
          <Button
            onPress={takePicture}
            title="Take Picture"
            disabled={!isCameraReady}
          />
        </View>
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  buttonContainer: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default CameraComponent;
