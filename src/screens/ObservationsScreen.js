import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

//import patientBundle from '../assets/obsdata.json';
import patientBundle from '../assets/obsdata2.json';
import GlobalVariables from '../helpers/GlobalVariables';
import axios from 'axios';
import { Alert } from 'react-native';
import useNetworkConnectivity from '../helpers/Connectivity';

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
  const [isConnected, getConnectionStatus] = useNetworkConnectivity();
  //setIsLoading(true); // Add this state to your component:
  const [isLoading, setIsLoading] = useState(true);

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
        const API_URL = 'https://test2.cihis.org/openhimcore/openmrs/ws/fhir2/R4/';
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
console.log(patientObsResponse.data)
console.log(patientObsResponse.status)

        if (patientObsResponse.status === 200) {
          setIsLoading(false);

          onlinePatientBundle = patientObsResponse.data;

          GlobalVariables.setObservations(onlinePatientBundle);

          const parsedObservations = parseObservations(onlinePatientBundle);

          setObservations(parsedObservations);
          console.log(parsedObservations)

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
            setIsLoading(false);

            const parsedObservations = parseObservations(offlineObs);

            setObservations(parsedObservations);

            const tablesData = parseCsv(csvData);

            setTables(tablesData);
          }

          /*           Alert.alert(
            'Error',
            'An error occurred while trying to get results online. Check internet connection'
          ); */
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
          const offlineObs = await GlobalVariables.getObservations();

          if (offlineObs) {
            setIsLoading(false);
            const parsedObservations = parseObservations(offlineObs);

            setObservations(parsedObservations);

            const tablesData = parseCsv(csvData);

            setTables(tablesData);
          } else {
            Alert.alert(
              'Error',
              'An error occurred while trying to get results online. Check internet connection'
            );
          }
        }
      }
    };

    const offlineData = async () => {
      const offlineObs = await GlobalVariables.getObservations();

      if (offlineObs) {
        setIsLoading(false);

        const parsedObservations = parseObservations(offlineObs);

        setObservations(parsedObservations);

        const tablesData = parseCsv(csvData);

        setTables(tablesData);
      } else {
        setIsLoading(false);

        Alert.alert('Alert', 'Connect to internet to get Information');
      }
    };

    if (isConnected) {
      fetchData();
    } else {
      offlineData();
    }
  }, [isConnected]);

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
      {isLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        tables.map((table, index) => (
          <View key={index} style={styles.tableContainer}>
            <Text style={styles.tableTitle}>{table.title}</Text>
            <ScrollView horizontal>
              <View>
                {renderTableHeader(table.codes)}
                {renderTableRows(table.codes)}
              </View>
            </ScrollView>
          </View>
        ))
      )}
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
