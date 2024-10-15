import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
//import patientBundle from '../assets/obsdata.json';
import patientBundle from '../assets/obsdata2.json';
import GlobalVariables from './GlobalVariables';
import axios from 'axios';
import { Alert } from 'react-native';

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

export default function ObservationsScreen({ navigation }) {
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

    let onlinePatientBundle;
    const fetchData = async () => {
      try {
        const API_URL =
          'https://5001-reaganmeant-hiescdmulag-8yke8gpo3yw.ws-eu116.gitpod.io/openmrs/ws/fhir2/R4/';
        const uuid = await GlobalVariables.getUuid();
        const pw = await GlobalVariables.getPw();
        const patientObsResponse = await axios.get(
          API_URL + 'Observation?subject=' + uuid,
          {
            auth: {
              username: uuid,
              password: pw,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (patientObsResponse.status === 200) {
          onlinePatientBundle = patientObsResponse.data;

          GlobalVariables.setObservations(onlinePatientBundle);

          const parsedObservations = parseObservations(onlinePatientBundle);

          setObservations(parsedObservations);

          const tablesData = parseCsv(csvData);

          setTables(tablesData);
        } else if (patientObsResponse.status === 401) {
          Alert.alert('Error', 'Incorrect password or ID');
          GlobalVariables.setLoggedIn(false);

          navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
          });
        } else {
          const offlineObs = await GlobalVariables.getObservations();

          if (offlineObs) {
            const parsedObservations = parseObservations(offlineObs);

            setObservations(parsedObservations);

            const tablesData = parseCsv(csvData);

            setTables(tablesData);
          }
        }
      } catch (error) {
        console.error(error);
        console.error(error.response.status);

        if (error.response.status === 401) {
          //send to login
          console.error(error.response.status);

          Alert.alert('Error', 'User is unauthenticated');
          console.error(error.response.status);
          GlobalVariables.setLoggedIn(false);

          navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
          });
        } else {
          Alert.alert(
            'Error',
            'An error occurred while trying to query records online...'
          );
          const offlineObs = await GlobalVariables.getObservations();

          if (offlineObs) {
            const parsedObservations = parseObservations(offlineObs);

            setObservations(parsedObservations);

            const tablesData = parseCsv(csvData);

            setTables(tablesData);
          }
        }
      }
    };

    fetchData();
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
