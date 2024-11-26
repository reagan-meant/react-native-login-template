import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import GlobalVariables from '../helpers/GlobalVariables';

export default function PatientDetailsScreen() {
  const [patientDetails, setPatientDetails] = useState(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const myPatient = await GlobalVariables.getPatient();
        setPatientDetails(myPatient);
      } catch (error) {
        console.error(error);
        Alert.alert(
          'Error',
          'An error occurred while trying to fetch patient details.'
        );
      }
    };

    fetchPatientDetails();
  }, []);

  if (!patientDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading patient details...</Text>
      </View>
    );
  }

  const { name, gender, birthDate, active, deceasedBoolean } = patientDetails;
  const patientName = name[0]?.text || 'Unknown';
  const formattedBirthDate = new Date(birthDate).toLocaleDateString();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Patient Details</Text>
      <View style={styles.detailContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{patientName}</Text>

        <Text style={styles.label}>Gender:</Text>
        <Text style={styles.value}>{gender.toUpperCase()}</Text>

        <Text style={styles.label}>Birth Date:</Text>
        <Text style={styles.value}>{formattedBirthDate}</Text>

        <Text style={styles.label}>Active:</Text>
        <Text style={styles.value}>{active ? 'Yes' : 'No'}</Text>

        <Text style={styles.label}>Deceased:</Text>
        <Text style={styles.value}>{deceasedBoolean ? 'Yes' : 'No'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#bde5dd',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  label: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  value: {
    marginBottom: 10,
  },
});
