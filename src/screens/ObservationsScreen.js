import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import patientBundle from '../assets/obsdata.json';

export default function ObservationsScreen() {
  const [observations, setObservations] = useState([]);

  useEffect(() => {
    const parseObservations = (bundle) => {
      return bundle.entry.map((entry) => {
        const observation = entry.resource;
        return {
          id: observation.id,
          code: observation.code.text,
          value: observation.valueQuantity?.value,
          unit: observation.valueQuantity?.unit,
          date: observation.effectiveDateTime,
        };
      });
    };

    const parsedObservations = parseObservations(patientBundle);
    setObservations(parsedObservations);
  }, []);

  const renderObservation = ({ item }) => (
    <View style={styles.observationCard}>
      <Text style={styles.observationText}>Code: {item.code}</Text>
      <Text style={styles.observationText}>
        Value: {item.value} {item.unit}
      </Text>
      <Text style={styles.observationText}>
        Date: {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={observations}
        keyExtractor={(item) => item.id}
        renderItem={renderObservation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  observationCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  observationText: {
    fontSize: 16,
    marginBottom: 5,
  },
});
