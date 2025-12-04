/**
 * Utility to check if the backend is reachable
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

export function getBackendUrl(): string {
  return API_BASE_URL;
}

