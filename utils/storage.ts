import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform secure storage utility
 * Uses SecureStore on native platforms and localStorage on web
 */

const isWeb = Platform.OS === 'web';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {

      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {

      throw error;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {

      // Don't throw - deletion errors shouldn't break the flow
    }
  },
};

export { storage };
export default storage;
