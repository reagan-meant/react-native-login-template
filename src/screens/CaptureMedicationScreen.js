import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import Papa from 'papaparse';
import axios from 'axios';
import MultiSelect from 'react-native-multiple-select';
import * as UUID from 'react-native-uuid';
import { Buffer } from 'buffer';
import { API_URL } from '../helpers/Constants';
import useNetworkConnectivity from '../helpers/Connectivity';

import GlobalVariables from '../helpers/GlobalVariables';
import createEncounterData from '../helpers/createEncounterData';
import FormattedDates from '../helpers/FormattedDates';
import useProcessBundles from '../helpers/ProcessBundles';

// Mock CSV content, replace with actual CSV loading logic if necessary
const csvContent = `code,displayName,unit
fd1c41e4-900a-412c-bd9c-f0abcbd997e8,Panadol,
71617AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,Aspirin,
b26596cc-1ab7-4f6b-9f9a-bfcc22118c1d,Coartem,
e99a8e95-4319-4133-a721-92fc3cb40fd6,Fansidar,
d79d702a-2230-43cf-a290-e7c46af6b3ca,Quninine,
ad56ef23-fe1a-4035-b233-95dae98f9079,Hydroxyurea,
ff5cdb18-0258-4467-bf1f-35c7b6339767,Ibuprofen,`;

const parseCSV = (csv) => {
  return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
};

export default function CaptureMedicationScreen() {
  const [isConnected, getConnectionStatus] = useNetworkConnectivity();
  const { processBundles } = useProcessBundles();

  const [inputGroups, setInputGroups] = useState([
    { id: Date.now(), code: [], displayName: [], value: '', unit: [] },
  ]);

  const [options, setOptions] = useState([]);
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    const loadCSV = async () => {
      const parsedData = await parseCSV(csvContent);
      setOptions(parsedData);
    };
    loadCSV();

    if (bundles.length > 0) {
      processBundles(bundles, null);
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

    const dateToday = new Date();
    const formattedDates = FormattedDates(dateToday);

    const newUUIDObs = UUID.default.v4();

    const encounterData = createEncounterData(
      newUUIDObs,
      patientUuid,
      formattedDates
    );

    try {
      if (isConnected) {
        const encodedAuth = Buffer.from(`${patientUuid}:${patientPw}`).toString(
          'base64'
        );

        const encounterResponse = await axios.post(
          `${API_URL}Encounter/`,
          encounterData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${encodedAuth}`,
            },
          }
        );

        if (encounterResponse.status === 201) {
          await generateBundles(inputGroups, encounterResponse.data.id);
        } else {
          Alert.alert('Error', 'Failed to save record');
        }
      } else {
        await generateBundles(inputGroups, 'placeHolderEncounterID');

        Alert.alert(
          'Saved Offline',
          'Your drug(s) will be synchronized when internet connection is restored'
        );
      }
    } catch (error) {
      console.error(error);

      Alert.alert('Error', 'An error occurred while submitting drug(s)');
    }
  };

  const generateBundles = async (inputGroupz, encounterId) => {
    const patientUuid = await GlobalVariables.getUuid();

    const newBundles = inputGroupz.flatMap((group) =>
      group.code.map((code, idx) =>
        createObservationBundle(
          { code, displayName: group.displayName[idx], unit: group.unit[idx] },
          encounterId,
          patientUuid
        )
      )
    );
    setBundles(newBundles);

    return newBundles;
  };

  // Function to create the observation bundle
  const createObservationBundle = (group, encounterId, patientUuid) => {
    return {
      resourceType: 'Observation',
      status: 'preliminary',
      code: {
        coding: [
          {
            code: `27069240-bc36-4b50-8795-2dc5cea2cfe5`,
            display: `SCD OTC Drugs at Home`,
          },
        ],
      },
      subject: {
        reference: `Patient/${patientUuid}`,
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
      <Text style={styles.header}>Enter Drugs</Text>
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
              selectText="Select Drugs"
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
