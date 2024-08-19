import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Papa from 'papaparse';
import axios from 'axios';

// Mock CSV content, replace with actual CSV loading logic if necessary
const csvContent = `code,displayName,unit
148901AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,Panadol,
140070AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,Aspirin,
dbp,Coartem,
148901AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,Fansidar,
140070AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,Quninine,
dbp,Hydroxyurea,
dbp,Other drugs,`;


const parseCSV = (csv) => {
  return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
};

export default function MedicationScreen() {
  const [inputGroups, setInputGroups] = useState([
    { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
  ]);
  const [options, setOptions] = useState([]);
  const [bundles, setBundles] = useState([]);

  const person_uuid = '25af7a62-ed5a-4a53-8aba-e56f14db82c0';

  useEffect(() => {
    const loadCSV = async () => {
      const parsedData = await parseCSV(csvContent);
      setOptions(parsedData);
    };
    loadCSV();
  }, []);

  const addInputGroup = () => {
    setInputGroups([
      ...inputGroups,
      { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
    ]);
  };

  const removeInputGroup = (id) => {
    setInputGroups(inputGroups.filter((group) => group.id !== id));
  };

  const submitObservations = async () => {
    let today = new Date();
    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1 and pad with zero
    let day = String(today.getDate()).padStart(2, '0');
    let formattedToday = `${year}-${month}-${day}`;

    // Calculate yesterday's date
    let yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Format yesterday's date as YYYY-MM-DD
    let yesterdayYear = yesterday.getFullYear();
    let yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    let yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
    let formattedYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

    // Calculate tomorrow's date
    let tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Format tomorrow's date as YYYY-MM-DD
    let tomorrowYear = tomorrow.getFullYear();
    let tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    let tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
    let formattedTomorrow = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;

    let data = JSON.stringify({
      resourceType: 'Encounter',
      id: '5b829d01-34bb-47d1-b1bb-9303c3a9ebcb',
      meta: {
        tag: [
          {
            system: 'http://fhir.openmrs.org/ext/encounter-tag',
            code: 'encounter',
            display: 'Encounter',
          },
        ],
      },
      status: 'unknown',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
      },
      type: [
        {
          coding: [
            {
              system: 'http://fhir.openmrs.org/code-system/encounter-type',
              code: 'ca3aed11-1aa4-42a1-b85c-8332fc8001fc',
              display: 'Check In',
            },
          ],
        },
      ],
      subject: {
        reference: `Patient/${person_uuid}`,
        type: 'Patient',
      },
      period: {
        start: formattedYesterday,
        end: formattedTomorrow,
      },
      location: [
        {
          location: {
            reference: 'Location/44c3efb0-2583-4c80-a79e-1f756a03c0a1',
          },
        },
      ],
    });
    console.log('data');
    console.log(data);

    const username = 'admin';
    const password = 'Admin123';
    try {
      console.log('encounterResponse1x');

      const encounterResponse = await axios.post(
        'https://dev3.openmrs.org/openmrs/ws/fhir2/R4/Encounter/',
        data,
        {
          auth: {
            username: username,
            password: password,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('encounterResponse1');
      console.log(encounterResponse);

      if (encounterResponse.status === 201) {
        console.log('encounterResponse');
        console.log(encounterResponse);
        console.log('encounterResponse.data');

        console.log(encounterResponse.data);
        console.log(encounterResponse.data.id);

        await generateBundles(inputGroups, encounterResponse.data.id);

        console.log('inputGroups');
        //console.log(inputGroups);
        console.log('inputGroups333');
        console.log(bundles);

        //console.log(bundles[0].code);

        async function processBundles() {
          for (const bundle of bundles) {
            try {
              // Log the 'code' property
              let bundleString = JSON.stringify(bundle, null, 2); // The 'null' and '2' arguments are for pretty-printing
              console.log(bundleString);
              // Perform an asynchronous operation
              const response = await axios.post(
                'https://dev3.openmrs.org/openmrs/ws/fhir2/R4/Observation/',
                bundleString,
                {
                  auth: {
                    username: username,
                    password: password,
                  },
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );
              if (response.status === 201) {
                console.log('Success', 'Observations submitted successfully');
              } else {
                Alert.alert('Error', 'Failed to submit observations');
              }
              // Log the response or handle it
              console.log(response.data);
            } catch (error) {
              // Handle errors
              console.error('Error posting bundle:', error);
            }
          }
        }

        // Call the async function
        processBundles();

        setInputGroups([
          { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create Encounter');
      }
    } catch (error) {
      console.error(error);

      Alert.alert('Error', 'An error occurred while submitting observations');
    }
  };

  const generateBundles = async (inputGroups, encounterId) => {
    const newBundles = inputGroups.map((group) =>
      createObservationBundle(group, encounterId)
    );
    setBundles(newBundles);
    return newBundles;
  };

  // Function to create the observation bundle
  const createObservationBundle = (group, encounterId) => {
    return {
      resourceType: 'Observation',
      status: 'preliminary',
      code: {
        coding: [
          {
            code: `9351fb5e-2bef-4d08-a78b-474a0bd4116a`,
            display: `Signs and Symptoms`,
          },
        ],
      },
      subject: {
        reference: `Patient/${person_uuid}`,
      },
      encounter: {
        reference: `Encounter/${encounterId}`,
      },
      effectiveDateTime: new Date().toISOString(),
      valueCodeableConcept: {
        coding: [
          {
            code: group.code,
            display: group.displayName,
          },
        ],
        text: group.displayName,
      },
    };
  };

  const updateInputGroup = (index, key, value) => {
    const newInputGroups = [...inputGroups];
    newInputGroups[index][key] = value;

    if (key === 'code') {
      const selectedOption = options.find((option) => option.code === value);
      if (selectedOption) {
        newInputGroups[index].displayName = selectedOption.displayName;
        newInputGroups[index].unit = selectedOption.unit;
      }
    }
    setInputGroups(newInputGroups);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Medication taken</Text>
      {inputGroups.map((group, index) => (
        <View key={group.id} style={styles.inputGroup}>
          <RNPickerSelect
            style={pickerSelectStyles}
            onValueChange={(value) => updateInputGroup(index, 'code', value)}
            items={options.map((option, idx) => ({
              key: idx.toString(),
              label: option.displayName,
              value: option.code,
            }))}
            placeholder={{ label: 'Select Medicine', value: null }}
          />
          <Button title="Remove" onPress={() => removeInputGroup(group.id)} />
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addInputGroup}>
        <Text style={styles.addButtonText}>+ Add Another Medicine</Text>
      </TouchableOpacity>
      <Button title="Submit" onPress={submitObservations} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  unitText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  addButton: {
    marginBottom: 20,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    color: '#007BFF',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  inputAndroid: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});
