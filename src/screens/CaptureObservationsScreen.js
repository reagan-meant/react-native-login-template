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
temp,Temperature,°C
dbp,Diastolic blood pressure,mmHg
sbp,Systolic blood pressure,mmHg
abo2,Arterial blood oxygen saturation (pulse oximeter),%
pulse,Pulse,bpm
rr,Respiratory rate,breaths/min
weight,Weight (kg),kg
height,Height (cm),cm`;

const parseCSV = (csv) => {
  return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
};

export default function CaptureObservationsScreen() {
  const [inputGroups, setInputGroups] = useState([
    { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
  ]);
  const [options, setOptions] = useState([]);
  const [bundles, setBundles] = useState([]);

  const person_uuid = '6464-48387-389929u3';
  const encounter_uuid = '6464-48387-389929u3';

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
    await generateBundles(inputGroups);

    try {
      const response = await axios.post('YOUR_API_ENDPOINT', inputGroups);
      if (response.status === 200) {
        Alert.alert('Success', 'Observations submitted successfully');
        setInputGroups([
          { id: Date.now(), code: '', displayName: '', value: '', unit: '' },
        ]);
      } else {
        Alert.alert('Error', 'Failed to submit observations');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while submitting observations');
    }
  };

  const generateBundles = async (inputGroups) => {
    const newBundles = inputGroups.map((group) =>
      createObservationBundle(group)
    );
    setBundles(newBundles);
    return newBundles;
  };

  // Function to create the observation bundle
  const createObservationBundle = (group) => {
    return {
      resourceType: 'Observation',
      status: 'preliminary',
      code: {
        coding: [
          {
            code: group.code,
            display: group.displayName,
          },
        ],
      },
      subject: {
        reference: `Patient/${person_uuid}`,
      },
      encounter: {
        reference: `Encounter/${encounter_uuid}`,
      },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: group.value,
        unit: group.unit,
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
      <Text style={styles.header}>Capture Observations</Text>
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
            placeholder={{ label: 'Select an observation', value: null }}
          />
          <TextInput
            style={styles.input}
            placeholder="Value"
            value={group.value}
            onChangeText={(text) => updateInputGroup(index, 'value', text)}
            keyboardType="numeric"
          />
          <Button title="Remove" onPress={() => removeInputGroup(group.id)} />
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addInputGroup}>
        <Text style={styles.addButtonText}>+ Add Another Observation</Text>
      </TouchableOpacity>
      <Button title="Submit Observations" onPress={submitObservations} />
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
