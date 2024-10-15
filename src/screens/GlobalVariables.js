import AsyncStorage from '@react-native-async-storage/async-storage';

class GlobalVariables {
  constructor() {
    this.apiUrl = 'https://default-api-url.com';
    this.uuid = 'e17d7f38-f94c-4273-82f2-81e4c8c66012';
    this.pw = 'null';
    this.loggedIn = false; // Initial state
    this.patient = 'null';
    this.observations = null;
  }

  // Set and persist API URL
  async setApiUrl(url) {
    this.apiUrl = url;
    await AsyncStorage.setItem('apiUrl', url);
  }

  // Get API URL
  async getApiUrl() {
    const url = await AsyncStorage.getItem('apiUrl');
    return url || this.apiUrl;
  }

  // Set and persist UUID
  async setUuid(uuid) {
    this.uuid = uuid;
    await AsyncStorage.setItem('uuid', uuid);
  }

  // Get UUID
  async getUuid() {
    const uuid = await AsyncStorage.getItem('uuid');
    return uuid || this.uuid;
  }

  // Set and persist password
  async setPw(pw) {
    this.pw = pw;
    await AsyncStorage.setItem('pw', pw);
  }

  // Get password
  async getPw() {
    const pw = await AsyncStorage.getItem('pw');
    return pw || this.pw;
  }

  // Set and persist logged in state
  async setLoggedIn(isLoggedIn) {
    this.loggedIn = isLoggedIn;
    await AsyncStorage.setItem('loggedIn', JSON.stringify(isLoggedIn));
  }

  // Get logged in state
  async isLoggedIn() {
    const loggedIn = await AsyncStorage.getItem('loggedIn');
    return loggedIn !== null ? JSON.parse(loggedIn) : this.loggedIn;
  }

  // Set and persist Patient
  async setPatient(patient) {
    this.patient = patient;
    await AsyncStorage.setItem('patient', JSON.stringify(patient));
  }

  // Get Patient
  async getPatient() {
    const patient = await AsyncStorage.getItem('patient');
    return patient ? JSON.parse(patient) : this.patient;
  }

  // Set and persist Patient
  async setObservations(observations) {
    this.observations = observations;
    await AsyncStorage.setItem('observations', JSON.stringify(observations));
  }

  // Get Patient
  async getObservations() {
    const observations = await AsyncStorage.getItem('observations');
    return observations ? JSON.parse(observations) : this.observations;
  }
}

const instance = new GlobalVariables();
Object.freeze(instance);

export default instance;
