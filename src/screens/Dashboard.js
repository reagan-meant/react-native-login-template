import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

export default function Dashboard({ navigation }) {
  return (
    <Background>
      <Header>Let’s start</Header>

      <ScrollView contentContainerStyle={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          onPress={() => navigation.navigate('ObservationsScreen')}
        >
          <Text style={styles.cardText}>Health Records</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          onPress={() => navigation.navigate('SymptomTracking')}
        >
          <Text style={styles.cardText}>Track Symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          onPress={() => navigation.navigate('MedicationTracking')}
        >
          <Text style={styles.cardText}>Track Medication</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Text style={styles.cardText}>Alerts & Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Text style={styles.cardText}>Manage Appointments</Text>
        </TouchableOpacity>
      </ScrollView>
      <Button
        style={[styles.logoutButton, { width: cardWidth }]}
        mode="outlined"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'StartScreen' }],
          })
        }
      >
        Logout
      </Button>
    </Background>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 40,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
