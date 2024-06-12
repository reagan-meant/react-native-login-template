import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  KeyboardAvoidingView,
  View,
} from 'react-native';
import { theme } from '../core/theme';

export default function Background({ children }) {
  return (
    <ImageBackground
      source={require('../assets/medical_bg.jpeg')}
      resizeMode="repeat"
      style={styles.background}
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {children}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Adjust the alpha value to control the lightness
  },
  container: {
    flex: 1,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
