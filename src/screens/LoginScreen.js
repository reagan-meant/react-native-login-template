import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert, View } from 'react-native';
import { Text } from 'react-native-paper';

import { API_URL } from '../helpers/Constants';

import axios from 'axios';
import { Buffer } from 'buffer';
import * as UUID from 'react-native-uuid';
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
import GlobalVariables from '../helpers/GlobalVariables';
import createEncounterData from '../helpers/createEncounterData';
import useProcessBundles from '../helpers/ProcessBundles';
import FormattedDates from '../helpers/FormattedDates';
import configureBackgroundFetch from '../helpers/BackgroundWorker';
import useNetworkConnectivity from '../helpers/Connectivity';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [id, setID] = useState({ value: '', error: '' });

  const [password, setPassword] = useState({ value: '', error: '' });
  const { processBundles } = useProcessBundles();
  const [isConnected, getConnectionStatus] = useNetworkConnectivity();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await GlobalVariables.isLoggedIn();
      const postObs = await GlobalVariables.getPostObservations();
      const hasPendingSync = await GlobalVariables.hasPendingSync();

      if (loggedIn) {
        console.log('User is logged in');
        console.log(loggedIn);

        console.log(postObs);
        console.log(hasPendingSync);

        console.log('Am callled immediately');

        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        console.log('User is not logged in');
        // Redirect to login page
      }
    };
    GlobalVariables.removeSynced();

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log('Am callled connected');

      configureBackgroundFetch(processBundles);
    }
  }, [isConnected]);

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
    //const uuid = await GlobalVariables.getUuid();

    try {
      //const API_URL = 'https://test2.cihis.org/openhimcore/openmrs/ws/fhir2/R4/';
      if (person_uuid === 'reagan'){
      API_URL = 'https://test2.cihis.org/openhimcore/openmrs/ws/fhir2/R4/';
      }
            console.log(API_URL + 'Patient/' + person_uuid);
// 7ed267ea-a12b-4e51-8606-1e2813529e76
      const patientResponse = await axios.get(
        API_URL + 'Patient/' + person_uuid,
        {
          auth: {
            username: person_uuid,
            password: pw,
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        }
      );

      if (patientResponse.status === 200) {
        GlobalVariables.setPw(pw);
        GlobalVariables.setUuid(person_uuid);

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
      //curl -v --location 'https://test2.cihis.org/openhimcore/openmrs/ws/fhir2/R4/Patient/7ed267ea-a12b-4e51-8606-1e2813529e76';
      //curl -k --location 'https://mulagoscd.site:5000/openmrs/ws/fhir2/R4/Patient/7ed267ea-a12b-4e51-8606-1e2813529e76';

      //console.error(error);
      console.error(error?.response);
      console.error(error);
      console.error('Error message:', error?.message); // Error message
      console.error('Error code:', error?.code); // Error code (e.g., ECONNREFUSED, ECONNABORTED)

      //console.error(error.response.data);

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
      <View style={[styles.row, { display: 'none' }]}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace('RegisterScreen')}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}
//          style={[styles.card, { width: cardWidth, display: 'none' }]}

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
