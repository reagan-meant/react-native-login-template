import AsyncStorage from '@react-native-async-storage/async-storage';

class GlobalVariables {
  constructor() {
    this.apiUrl = 'https://default-api-url.com';
    this.uuid = 'null';
    this.pw = 'null';
    this.loggedIn = false; // Initial state
    this.patient = 'null';
    this.observations = null;
    this.postObservations = [];
  }
  //7ed267ea-a12b-4e51-8606-1e2813529e76
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

  async getPostObservations() {
    try {
      const observations = await AsyncStorage.getItem('offlineObservations');
      return observations ? JSON.parse(observations) : this.postObservations;
    } catch (error) {
      console.error('Error getting observations:', error);
      return [];
    }
  }

  async setPostObservations(observations) {
    this.postObservations = observations;

    try {
      await AsyncStorage.setItem(
        'offlineObservations',
        JSON.stringify(observations)
      );
    } catch (error) {
      console.error('Error setting observations:', error);
      throw error;
    }
  }

  async updateObservationAtIndex(index) {
    try {
      // Get current observations
      const observations = await this.getPostObservations();
      console.log('upate [index]');

      console.log(observations);
      console.log(observations[index]);
      // Update the observation at the specified index
      observations[index].status = 'synced';
      console.log('observations[index]');
      console.log(observations[index]);

      // Save the updated observations array
      await this.setPostObservations(observations);

      return true;
    } catch (error) {
      console.error('Error updating observation:', error);
      throw error;
    }
  }

  async hasPendingSync() {
    try {
      const observations = await this.getPostObservations();
      return observations.some((obs) => obs.status === 'pending');
    } catch (error) {
      console.error('Error checking pending sync:', error);
      return false;
    }
  }

  async removeSynced() {
    try {
      // Get current observations
      const observations = await this.getPostObservations();

      // Filter out all synced observations
      const pendingObservations = observations.filter(
        (obs) => obs.status === 'pending'
      );

      // Save the filtered array back
      await this.setPostObservations(pendingObservations);

      console.log(
        `Removed ${
          observations.length - pendingObservations.length
        } synced observations`
      );

      // Return true if the operation was successful
      return true;
    } catch (error) {
      console.error('Error removing synced observations:', error);
      throw error;
    }
  }
}

const instance = new GlobalVariables();
Object.freeze(instance);

export default instance;
