import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
//import patientBundle from '../assets/obsdata.json';
import patientBundle from '../assets/obsdata2.json';

const csvData = `
Nutritional Values,Left MUAC:MUAC;Weight (kg):W;Height (cm):H
Vital Signs,Pulse:P;Respiratory rate:RR;Diastolic blood pressure:DBP;Systolic blood pressure:SBP
Lab Values,Haemoglobin:Hb;Neutrophils:Neu;White blood cells:WBC;Platelets:Pt;Bili-Total/Direct:Bili;Blood urea nitrogen:BUN;AST/ALT:AST/ALT;RDT:RDT
Medication,Folic Acid Usage:FA;Malaria Prophylaxis:Malaria;Pneumococcal Prophylaxis:Pneumo Prophy;Analgesics:Analgesics;Anti-malarials (treatment):Anti Malaria;Other OutPatientMedications:Other Meds
`;

const parseCsv = (csv) => {
  const lines = csv.trim().split('\n');
  return lines.map((line) => {
    const [title, codes] = line.split(',');
    const parts = codes.split(';');

    const parsedCodes = parts.map((part) => {
      const indparts = part.split(':'); // Split the string at ':'
      return {
        displayName: indparts[0], // The first part is the display name
        alias: indparts[1], // The second part is the alias
      };
    });

    return {
      title,
      codes: parsedCodes,
    };
  });
};

export default function ObservationsScreen() {
  const [observations, setObservations] = useState({});
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const parseObservations = (bundle) => {
      const observationMap = {};

      bundle.entry.forEach((entry) => {
        const observation = entry.resource;
        const date = new Date(
          observation.effectiveDateTime
        ).toLocaleDateString();
        const code = observation.code.text;
        //const value = observation.valueQuantity?.value;
        const value =
          observation.valueQuantity?.value ??
          observation.valueCodeableConcept?.text ??
          observation.valueString;

        //const unit = observation.valueQuantity?.unit;
        const unit = observation.valueQuantity?.unit ?? '';

        if (!observationMap[date]) {
          observationMap[date] = {};
        }

        observationMap[date][code] = `${value} ${unit}`;
      });

      return observationMap;
    };

    const parsedObservations = parseObservations(patientBundle);
    //console.log(parsedObservations)
    setObservations(parsedObservations);

    const tablesData = parseCsv(csvData);
    //console.log(tablesData);

    setTables(tablesData);
  }, []);

  const renderTableHeader = (codes) => {
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.tableHeader]}>Date</Text>
        {codes.map((code) => (
          <Text
            key={code.displayName}
            style={[styles.tableHeader, styles.tableCell]}
          >
            {code.alias || code.displayName}
          </Text>
        ))}
      </View>
    );
  };

  const renderTableRows = (codes) => {
    return Object.keys(observations).map((date) => {
      const shouldRenderRow = codes.some(
        (code) =>
          observations[date][code.displayName] !== null &&
          observations[date][code.displayName] !== undefined
      );
      if (shouldRenderRow) {
        return (
          <View key={date} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>{date}</Text>
            {codes.map((code) => (
              <Text key={code.displayName} style={styles.tableCell}>
                {observations[date][code.displayName] || ''}
              </Text>
            ))}
          </View>
        );
      }
      return null;
    });
  };

  return (
    <ScrollView style={styles.container}>
      {tables.map((table, index) => (
        <View key={index} style={styles.tableContainer}>
          <Text style={styles.tableTitle}>{table.title}</Text>
          <ScrollView horizontal>
            <View>
              {renderTableHeader(table.codes)}
              {renderTableRows(table.codes)}
            </View>
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#bde5dd',
  },
  tableContainer: {
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#aeccd4',
  },
  tableCell: {
    width: 85, // Fixed width for all cells
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#a8c7c7',
  },
});
