import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, FlatList } from 'react-native';
import Papa from 'papaparse';
import axios from 'axios';
import MultiSelect from 'react-native-multiple-select';
import { API_URL } from '@env';
import * as UUID from 'react-native-uuid';
import { Buffer } from 'buffer';

import GlobalVariables from './GlobalVariables';

// Mock CSV content, replace with actual CSV loading logic if necessary
const csvContent = `code,displayName,unit
138609AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,Stomach Pain,
e2f633c6-9c78-435a-aa9d-ca7dc49ce4bb,Hand/Feet Swelling,
867c163c-0302-4a2e-a543-110fd0c95091,Hand/Feet Pain,
743085c6-df08-4e2d-b278-44e0953b42ac,Chest Pain,
02e31a12-7b49-4536-8e6e-a48b5e902897,Stomach Pain,
9292a0ea-cd28-436a-88c8-b0b938a7f55d,Tiredness,
12f3c86e-f5e6-4d4b-948d-cdf6d64b6819,Difficulty Breathing,
3d156cb0-7392-460e-92fb-b0da6ecb33cb,Fever,
85507f2c-4111-4363-805a-402440652892,Cough/Flue,`;

const parseCSV = (csv) => {
  return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
};

export default function CaptureObservationsScreen() {
  /*  const [inputGroups, setInputGroups] = useState([
    { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
  ]); */

  const [inputGroups, setInputGroups] = useState([
    { id: Date.now(), code: [], displayName: [], value: '', unit: [] },
  ]);

  const [options, setOptions] = useState([]);
  const [bundles, setBundles] = useState([]);

  //  const person_uuid = '26a9c5e4-45c0-4a2c-9a19-014883b77de4';
  const person_uuid = 'fc6cbfa8-7091-484d-a723-1f7068287aff';

  const username = 'admin';
  const password = 'Admin123';
  useEffect(() => {
    const loadCSV = async () => {
      const parsedData = await parseCSV(csvContent);
      setOptions(parsedData);
    };
    loadCSV();

    if (bundles.length > 0) {
      processBundles();

      setInputGroups([
        { id: Date.now(), code: [], displayName: [], value: '', unit: [] },
      ]);
    }
  }, [bundles]);

  const addInputGroup = () => {
    setInputGroups([
      ...inputGroups,
      { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
    ]);
  };

  const submitObservations = async () => {
    const patientUuid = await GlobalVariables.getUuid();
    const patientPw = await GlobalVariables.getPw();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1 and pad with zero
    const day = String(today.getDate()).padStart(2, '0');
    let formattedToday = `${year}-${month}-${day}`;

    // Calculate yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Format yesterday's date as YYYY-MM-DD
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
    const formattedYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

    // Calculate tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Format tomorrow's date as YYYY-MM-DD
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
    const formattedTomorrow = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;

    const uuidObs = UUID.default.v4();

    const data = JSON.stringify({
      resourceType: 'Encounter',
      id: uuidObs,
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

    try {
      const encodedAuth = Buffer.from(`${patientUuid}:${patientPw}`).toString(
        'base64'
      );

      /*       const encounterResponse = await axios.post(`${API_URL}Encounter/`, data, {
        auth: {
          patientUuid,
          patientPw,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }); */

      const encounterResponse = await axios.post(`${API_URL}Encounter/`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedAuth}`,
        },
      });

      if (encounterResponse.status === 201) {
        await generateBundles(inputGroups, encounterResponse.data.id);
      } else {
        Alert.alert('Error', 'Failed to create Encounter');
      }
    } catch (error) {
      console.error(error);

      Alert.alert('Error', 'An error occurred while submitting observations');
    }
  };

  const processBundles = async () => {
    const patientUuid = await GlobalVariables.getUuid();
    const patientPw = await GlobalVariables.getPw();

    try {
      await bundles.reduce(async (previousPromise, bundle) => {
        // Wait for the previous item to complete
        await previousPromise;

        // Process the current bundle
        const bundleString = JSON.stringify(bundle, null, 2);

        const encodedAuth = Buffer.from(`${patientUuid}:${patientPw}`).toString(
          'base64'
        );
        console.log(`${API_URL}Observation/`);

        const response = await axios.post(
          `${API_URL}Observation/`,
          bundleString,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${encodedAuth}`,
            },
          }
        );

        if (response.status === 201) {
          console.log('Success', 'Observations submitted successfully');
          Alert.alert('Success', 'Symptom(s)/Sign(s) saved successfully');
        } else {
          Alert.alert('Error', 'Failed to submit observations');
        }
      }, Promise.resolve());
    } catch (error) {
      console.error('Error posting bundles:', error);
      Alert.alert('Error', 'Failed to process bundles');
    }
  };

  const generateBundles = async (inputGroupz, encounterId) => {
    const newBundles = inputGroupz.flatMap((group) =>
      group.code.map((code, idx) =>
        createObservationBundle(
          { code, displayName: group.displayName[idx], unit: group.unit[idx] },
          encounterId
        )
      )
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
            code: `464d8752-45f8-4a25-8972-772cbc52efbe`,
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

  const updateInputGroup = (index, selectedItems) => {
    const newInputGroups = [...inputGroups];
    newInputGroups[index].code = selectedItems;

    // Get the selected options based on the selected items
    const selectedOptions = options.filter((option) =>
      selectedItems.includes(option.code)
    );

    newInputGroups[index].displayName = selectedOptions.map(
      (option) => option.displayName
    );
    newInputGroups[index].unit = selectedOptions.map((option) => option.unit);

    setInputGroups(newInputGroups);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Capture Signs/Symptoms</Text>
      <FlatList
        data={inputGroups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.inputGroup}>
            <MultiSelect
              items={options.map((option) => ({
                id: option.code,
                name: option.displayName,
              }))}
              uniqueKey="id"
              onSelectedItemsChange={(selectedItems) =>
                updateInputGroup(index, selectedItems)
              }
              selectedItems={item.code}
              selectText="Select Signs/Symptoms"
              searchInputPlaceholderText="Search..."
              tagRemoveIconColor="#CCC"
              tagBorderColor="#CCC"
              tagTextColor="#CCC"
              selectedItemTextColor="#CCC"
              selectedItemIconColor="#CCC"
              itemTextColor="#000"
              displayKey="name"
              searchInputStyle={{ color: '#CCC' }}
              submitButtonColor="#CCC"
              submitButtonText="Done"
            />
          </View>
        )}
        ListFooterComponent={
          <>
            <Button title="Submit" onPress={submitObservations} />
          </>
        }
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
