import * as UUID from 'react-native-uuid';
import { API_URL } from '../helpers/Constants';
import axios from 'axios';
import { Buffer } from 'buffer';
import GlobalVariables from './GlobalVariables';
import createEncounterData from './createEncounterData';
import useProcessBundles from './ProcessBundles';
import FormattedDates from './FormattedDates';

// Configure background fetch
const configureBackgroundFetch = async (processBundles) => {
  //const { processBundles } = useProcessBundles();

  // Configure background fetch
  console.log('mum called');

  // Background fetch event handler
  console.log('mum called got far');

  try {
    const hasPendingSync = await GlobalVariables.hasPendingSync();

    if (hasPendingSync) {
      const patientUuid = await GlobalVariables.getUuid();
      const patientPw = await GlobalVariables.getPw();
      const postObs = await GlobalVariables.getPostObservations();
      console.log('to post');
      console.log(postObs);
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

                processBundles([bundle], i);
              }
            } catch (error) {
              console.error('Sync error for bundle:', error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Background fetch failed:', error);
  }
};

export default configureBackgroundFetch;
