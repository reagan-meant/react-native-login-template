import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert, View } from 'react-native';
import { Text } from 'react-native-paper';
import { API_URL } from '@env';
import axios from 'axios';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';
import { emailValidator } from '../helpers/emailValidator';
import { iDValidator } from '../helpers/iDValidator';
import { passwordValidator } from '../helpers/passwordValidator';
import GlobalVariables from './GlobalVariables';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [id, setID] = useState({ value: '', error: '' });

  const [password, setPassword] = useState({ value: '', error: '' });

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await GlobalVariables.isLoggedIn();
      if (loggedIn) {
        console.log('User is logged in');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        console.log('User is not logged in');
        // Redirect to login page
      }
    };

    checkLoginStatus();
  }, []);

  const onLoginPressed = async () => {
    const emailError = emailValidator(email.value);
    const iDError = iDValidator(id.value);

    const passwordError = passwordValidator(password.value);
    if (iDError || passwordError) {
      setID({ ...id, error: iDError });
      setPassword({ ...password, error: passwordError });
      return;
    }
    const person_uuid = id.value;
    const pw = password.value;
    //  set uuid here for patient
    const uuid = await GlobalVariables.getUuid();

    try {
      API_URL =
        'https://5001-reaganmeant-hiescdmulag-8yke8gpo3yw.ws-eu116.gitpod.io/openmrs/ws/fhir2/R4/';
      console.log(API_URL + 'Patient/' + uuid);
      const patientResponse = await axios.get(API_URL + 'Patient/' + uuid, {
        auth: {
          username: uuid,
          password: pw,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (patientResponse.status === 200) {
        GlobalVariables.setPw(pw);
        GlobalVariables.setLoggedIn(true);
        GlobalVariables.setPatient(patientResponse.data);

        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else if (patientResponse.status === 401) {
        Alert.alert('Error', 'Incorrect password or ID');
      } else {
        Alert.alert('Error', 'Error logging in');
      }
    } catch (error) {
      console.error('error');

      console.error(error);
      console.error(error.response);
      console.error(error.response.data);

      if (error.response.status === 401) {
        Alert.alert('Error', 'Incorrect password or ID');
      } else {
        Alert.alert(
          'Error',
          'An error occurred while trying to log in...\nContact system Administrator'
        );
      }
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Logo />
      <Header>Welcome back.</Header>
      <TextInput
        label="ID"
        returnKeyType="next"
        value={id.value}
        onChangeText={(text) => setID({ value: text, error: '' })}
        error={!!id.error}
        errorText={id.error}
        autoCapitalize="none"
        textContentType="none"
        keyboardType="default"
      />
      <TextInput
        label="Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: '' })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ResetPasswordScreen')}
        >
          <Text style={styles.forgot}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
      <Button mode="contained" onPress={onLoginPressed}>
        Login
      </Button>
      <View style={styles.row}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace('RegisterScreen')}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
