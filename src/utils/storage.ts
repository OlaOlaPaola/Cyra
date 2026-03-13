import { UserData } from '../types';

const STORAGE_KEY = 'plan4her-user-data';

export const saveUserData = (data: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
};

export const loadUserData = (): UserData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load user data:', error);
    return null;
  }
};

export const clearUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
};

// Placeholder functions for future secure storage
export const saveUserDataSecurely = async (
  userId: string,
  data: UserData
): Promise<void> => {
  // TODO: Implement encryption + IPFS storage + confidential compute
  console.log('Saving securely for user:', userId);
  saveUserData(data);
};

export const loadUserDataSecurely = async (
  userId: string
): Promise<UserData | null> => {
  // TODO: Implement decryption + IPFS retrieval + confidential compute
  console.log('Loading securely for user:', userId);
  return loadUserData();
};
