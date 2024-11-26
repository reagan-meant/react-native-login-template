import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

const useNetworkConnectivity = () => {
  const [isConnected, setIsConnected] = useState(null);
  const isConnectedRef = useRef(null);

  const updateConnectionStatus = useCallback((state) => {
    const newConnectionStatus = Boolean(
      //  state.isConnected && state.isInternetReachable && state.isWifiEnabled
      state.isConnected && state.isInternetReachable
    );
    isConnectedRef.current = newConnectionStatus;
    setIsConnected(newConnectionStatus);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(updateConnectionStatus);

    NetInfo.fetch().then(updateConnectionStatus);

    return () => unsubscribe();
  }, [updateConnectionStatus]);

  const getConnectionStatus = useCallback(() => {
    return isConnectedRef.current;
  }, []);

  return [isConnected, getConnectionStatus];
};

export default useNetworkConnectivity;
