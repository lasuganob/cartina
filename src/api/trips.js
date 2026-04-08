import { apiClient } from './client';

export function getTrips() {
  return apiClient.getTrips();
}

export function createTrip(payload) {
  return apiClient.createTrip(payload);
}
