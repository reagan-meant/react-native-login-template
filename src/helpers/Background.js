import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as UUID from 'react-native-uuid';
import axios from 'axios';
import { API_URL } from './Constants';
import GlobalVariables from './GlobalVariables';
import createEncounterData from './createEncounterData';
import useProcessBundles from './ProcessBundles';
import FormattedDates from './FormattedDates';

const BACKGROUND_FETCH_TASK = 'background-fetch';

// Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('asynnnnc called');
    const hasPendingSync = await GlobalVariables.hasPendingSync();
    const { processBundles } = useProcessBundles();

    if (hasPendingSync) {
      const patientUuid = await GlobalVariables.getUuid();
      const patientPw = await GlobalVariables.getPw();
      const postObs = await GlobalVariables.getPostObservations();

      const dateToday = new Date();
      const formattedDates = FormattedDates(dateToday);

      const newUUIDObs = UUID.default.v4();

      const encounterData = createEncounterData(
        newUUIDObs,
        patientUuid,
        formattedDates
      );

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
      console.log(encounterResponse.data.id);

      for (let i = 0; i < postObs.length; i++) {
        if (postObs[i].status === 'pending') {
          const bundles = postObs[i].observations;

          for (let index = 0; index < bundles.length; index++) {
            const bundle = bundles[index];

            try {
              // First post the encounter

              if (encounterResponse.status === 201) {
                const encounterId = encounterResponse.data.id;

                // Update observations with new encounterId and post them
                // Update the encounter reference
                bundle.encounter.reference = `Encounter/${encounterId}`;

                processBundles([bundle]);
              }
            } catch (error) {
              console.error('Sync error for bundle:', error);
            }
          }
          // Mark this bundle as synced
          GlobalVariables.updateObservationAtIndex(i);
        }
      }
      // IMPORTANT: You must call finish()
      return BackgroundFetch.Result.NewData;
    }
    return BackgroundFetch.Result.NoData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.Result.Failed;
  }
});

// Register and configure the task
export async function registerBackgroundFetchAsync() {
  try {
    const minimumInterval = __DEV__ ? 60 : 15 * 60; // 1 minute in dev, 15 minutes in prod

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval, // 15 minutes
      stopOnTerminate: false, // Android only
      startOnBoot: true, // Android only
    });

    console.log('Task registered');
    console.log(
      'Background fetch task registered with interval:',
      minimumInterval
    );
  } catch (err) {
    console.log('Task Register failed:', err);
  }
}

// Unregister task
export async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  } catch (err) {
    console.log('Task Unregister failed:', err);
  }
}

// Use in your component
/* function YourComponent() {
  useEffect(() => {
    registerBackgroundFetchAsync();
    return () => {
      unregisterBackgroundFetchAsync();
    };
  }, []);

  return (
    // Your component JSX
  );
} */
