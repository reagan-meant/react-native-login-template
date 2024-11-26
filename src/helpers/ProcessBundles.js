import React from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
// eslint-disable-next-line import/no-unresolved
import { API_URL } from '../helpers/Constants';
import { Buffer } from 'buffer';
import GlobalVariables from './GlobalVariables';
import useNetworkConnectivity from './Connectivity';

const useProcessBundles = () => {
  const [isConnected, getConnectionStatus] = useNetworkConnectivity();
  //  const isConnected = true;
  const processBundles = async (bundlez, index) => {
    if (isConnected) {
      const patientUuid = await GlobalVariables.getUuid();
      const patientPw = await GlobalVariables.getPw();
      console.log('calleddddd');
      try {
        await bundlez.reduce(async (previousPromise, bundle) => {
          // Wait for the previous item to complete
          await previousPromise;

          // Process the current bundle
          const bundleString = JSON.stringify(bundle, null, 2);

          const encodedAuth = Buffer.from(
            `${patientUuid}:${patientPw}`
          ).toString('base64');

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
            console.log('index 201');
            console.log(index);

            if (index !== null) {
              console.log('index 202');

              // Mark this bundle as synced
              // console.log
              GlobalVariables.updateObservationAtIndex(index);
              console.log('Success', 'Observations submitted successfully');
            } else {
              console.log('Success', 'Observations submitted successfully');
              Alert.alert('Success', 'Synced successfully');
            }
          } else {
            Alert.alert('Error', 'Failed to submit observations');
          }
        }, Promise.resolve());
      } catch (error) {
        if (index !== null) {
          console.error('Error posting bundles:', error);
        } else {
          console.error('Error posting bundles:', error);
          Alert.alert('Error', 'Failed to process bundles');
        }
      }
    } else {
      const offlineBundle = {
        observations: bundlez,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const existingObservations =
        (await GlobalVariables.getPostObservations()) || [];

      await GlobalVariables.setPostObservations([
        ...existingObservations,
        offlineBundle,
      ]);

      Alert.alert(
        'Saved Offline',
        'Your information will be synchronized when internet connection is restored'
      );
    }
  };

  return { processBundles };
};

export default useProcessBundles;
