import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import patientBundle from '../assets/obsdata.json';

export default function ObservationsScreen() {
  const [observations, setObservations] = useState([]);
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    const parseObservations = (bundle) => {
      const observationMap = {};
      const codeSet = new Set();

      bundle.entry.forEach((entry) => {
        const observation = entry.resource;
        const date = new Date(observation.effectiveDateTime).toLocaleDateString();
        const code = observation.code.text;
        const value = observation.valueQuantity?.value;
        const unit = observation.valueQuantity?.unit;

        codeSet.add(code);

        if (!observationMap[date]) {
          observationMap[date] = {};
        }

        observationMap[date][code] = `${value} ${unit}`;
      });

      setCodes(Array.from(codeSet));
      return observationMap;
    };

    const parsedObservations = parseObservations(patientBundle);
    setObservations(parsedObservations);
  }, []);

  const renderTableHeader = () => {
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableHeader, styles.tableCell]}>Date</Text>
        {codes.map((code) => (
          <Text key={code} style={[styles.tableHeader, styles.tableCell]}>{code}</Text>
        ))}
      </View>
    );
  };

  const renderTableRows = () => {
    return Object.keys(observations).map((date) => (
      <View key={date} style={styles.tableRow}>
        <Text style={styles.tableCell}>{date}</Text>
        {codes.map((code) => (
          <Text key={code} style={styles.tableCell}>
            {observations[date][code] || 'N/A'}
          </Text>
        ))}
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container} horizontal>
      <View>
        {renderTableHeader()}
        {renderTableRows()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    width: 150, // Fixed width for all cells
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});
