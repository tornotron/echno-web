import { useState } from 'react';
import { toast } from '@/lib/styles/toast-styles';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
}

type LocationCallback = (latitude: number, longitude: number) => void;

interface GeolocationResult {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  getCurrentLocation: (onSuccess?: LocationCallback) => void;
}

export function useGeolocation(): GeolocationResult {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false,
  });

  const getCurrentLocation = (onSuccess?: LocationCallback) => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by your browser';
      setState((prev) => ({ ...prev, error }));
      toast.error(error);
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setState({
          latitude,
          longitude,
          error: null,
          isLoading: false,
        });

        onSuccess?.(latitude, longitude);
        toast.success('Location retrieved successfully!');
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';

        switch (error.code) {
          case error.PERMISSION_DENIED: {
            errorMessage =
              'Location access denied. Please enable location permissions.';
            break;
          }
          case error.POSITION_UNAVAILABLE: {
            errorMessage = 'Location information is unavailable';
            break;
          }
          case error.TIMEOUT: {
            errorMessage = 'Location request timed out';
            break;
          }
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      }
    );
  };

  return {
    ...state,
    getCurrentLocation,
  };
}
