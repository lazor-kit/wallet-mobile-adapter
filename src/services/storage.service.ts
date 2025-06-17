import { StorageService, WalletInfo, WalletConfig } from '../core/types';
import { createError, handleError } from '../core/errors';
import { STORAGE_KEYS } from '../constants';
import { logger } from '../utils/logger';

// Dynamic import of AsyncStorage to handle cases where it's not available
let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  logger.warn('AsyncStorage not available - persistence will be disabled', error);
}

export class AsyncStorageService implements StorageService {
  private readonly isAvailable: boolean;

  constructor() {
    this.isAvailable = Boolean(
      AsyncStorage && 
      typeof AsyncStorage.getItem === 'function' &&
      typeof AsyncStorage.setItem === 'function' &&
      typeof AsyncStorage.removeItem === 'function'
    );

    if (!this.isAvailable) {
      logger.warn('AsyncStorage not available - using memory storage');
    }
  }

  async getWallet(): Promise<WalletInfo | null> {
    try {
      if (!this.isAvailable) return null;
      
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLET);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return this.validateWalletInfo(parsed);
    } catch (error) {
      logger.error('Error reading wallet from storage', error);
      throw createError.general('Failed to read wallet from storage', 'STORAGE_READ_ERROR', error);
    }
  }

  async saveWallet(wallet: WalletInfo): Promise<void> {
    try {
      if (!this.isAvailable) {
        logger.warn('AsyncStorage not available - cannot persist wallet');
        return;
      }
      
      this.validateWalletInfo(wallet);
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    } catch (error) {
      logger.error('Error saving wallet to storage', error);
      throw createError.general('Failed to save wallet to storage', 'STORAGE_WRITE_ERROR', error);
    }
  }

  async removeWallet(): Promise<void> {
    try {
      if (!this.isAvailable) return;
      
      await AsyncStorage.removeItem(STORAGE_KEYS.WALLET);
    } catch (error) {
      logger.error('Error removing wallet from storage', error);
      throw createError.general('Failed to remove wallet from storage', 'STORAGE_REMOVE_ERROR', error);
    }
  }

  async getConfig(): Promise<WalletConfig | null> {
    try {
      if (!this.isAvailable) return null;
      
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return this.validateConfig(parsed);
    } catch (error) {
      logger.error('Error reading config from storage', error);
      throw createError.general('Failed to read config from storage', 'STORAGE_READ_ERROR', error);
    }
  }

  async saveConfig(config: WalletConfig): Promise<void> {
    try {
      if (!this.isAvailable) {
        logger.warn('AsyncStorage not available - cannot persist config');
        return;
      }
      
      this.validateConfig(config);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(config));
    } catch (error) {
      logger.error('Error saving config to storage', error);
      throw createError.general('Failed to save config to storage', 'STORAGE_WRITE_ERROR', error);
    }
  }

  private validateWalletInfo(data: any): WalletInfo {
    if (!data || typeof data !== 'object') {
      throw createError.validation('Invalid wallet data format');
    }

    const required = ['credentialId', 'passkeyPubkey', 'expo', 'platform', 'smartWallet', 'smartWalletAuthenticator'];
    for (const field of required) {
      if (!(field in data)) {
        throw createError.validation(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(data.passkeyPubkey)) {
      throw createError.validation('passkeyPubkey must be an array');
    }

    return {
      credentialId: String(data.credentialId),
      passkeyPubkey: data.passkeyPubkey,
      expo: String(data.expo),
      platform: String(data.platform),
      smartWallet: String(data.smartWallet),
      smartWalletAuthenticator: String(data.smartWalletAuthenticator),
    };
  }

  private validateConfig(data: any): WalletConfig {
    if (!data || typeof data !== 'object') {
      throw createError.validation('Invalid config data format');
    }

    const required = ['ipfsUrl', 'paymasterUrl'];
    for (const field of required) {
      if (!(field in data)) {
        throw createError.validation(`Missing required config field: ${field}`);
      }
    }

    return {
      ipfsUrl: String(data.ipfsUrl),
      paymasterUrl: String(data.paymasterUrl),
      rpcUrl: data.rpcUrl ? String(data.rpcUrl) : undefined,
    };
  }
} 