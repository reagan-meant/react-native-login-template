import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [editIndex, setEditIndex] = useState(null);

  const addAlert = () => {
    if (editIndex !== null) {
      const updatedAlerts = alerts.map((alert, index) =>
        index === editIndex ? { title, date } : alert
      );
      setAlerts(updatedAlerts);
      setEditIndex(null);
    } else {
      setAlerts([...alerts, { title, date }]);
    }
    setTitle('');
    setDate(new Date());
  };

  const editAlert = (index) => {
    setTitle(alerts[index].title);
    setDate(new Date(alerts[index].date));
    setEditIndex(index);
  };

  const deleteAlert = (index) => {
    const updatedAlerts = alerts.filter((_, i) => i !== index);
    setAlerts(updatedAlerts);
  };

  const renderAlert = ({ item, index }) => (
    <View style={styles.alertItem}>
      <Text>{item.title}</Text>
      <Text>{new Date(item.date).toLocaleString()}</Text>
      <View style={styles.alertActions}>
        <Button title="Edit" onPress={() => editAlert(index)} />
        <Button title="Delete" onPress={() => deleteAlert(index)} />
      </View>
    </View>
  );

  const showDateTimePicker = () => {
    setShowDatePicker(true);
  };
  const showTimeForDatePicker = () => {
    setShowTimePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    console.log('called here');

    if (selectedDate !== undefined) {
      const currentDate = selectedDate || date;
      setDate(currentDate);

      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    if (selectedTime !== undefined) {
      const currentTime = selectedTime || event.time;

      setDate(
        new Date(
          date.setHours(currentTime.getHours(), currentTime.getMinutes())
        )
      );
      setShowTimePicker(false);
    } else {
      setShowTimePicker(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Alerts and Reminders</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity onPress={showDateTimePicker} style={styles.dateInput}>
          <Text>{date.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity
          onPress={showTimeForDatePicker}
          style={styles.dateInput}
        >
          <Text>
            {date.getHours() +
              ':' +
              (date.getMinutes() < 10
                ? '0' + date.getMinutes()
                : date.getMinutes())}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Button
          title={editIndex !== null ? 'Update' : 'Add'}
          onPress={addAlert}
        />
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderAlert}
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
  form: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  dateInput: {
    height: 40,
    justifyContent: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  alertItem: {
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
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
