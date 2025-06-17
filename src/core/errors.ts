/**
 * Custom error types for LazorKit wallet operations
 */

export class LazorKitError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LazorKitError';
  }
}

export class WalletConnectionError extends LazorKitError {
  constructor(message: string, cause?: unknown) {
    super(message, 'WALLET_CONNECTION_ERROR', cause);
    this.name = 'WalletConnectionError';
  }
}

export class WalletNotConnectedError extends LazorKitError {
  constructor() {
    super('Wallet is not connected', 'WALLET_NOT_CONNECTED');
    this.name = 'WalletNotConnectedError';
  }
}

export class SigningError extends LazorKitError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SIGNING_ERROR', cause);
    this.name = 'SigningError';
  }
}

export class BrowserError extends LazorKitError {
  constructor(message: string, cause?: unknown) {
    super(message, 'BROWSER_ERROR', cause);
    this.name = 'BrowserError';
  }
}

export class ValidationError extends LazorKitError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

/**
 * Error factory functions
 */
export const createError = {
  walletConnection: (message: string, cause?: unknown) => 
    new WalletConnectionError(message, cause),
  
  walletNotConnected: () => 
    new WalletNotConnectedError(),
  
  signing: (message: string, cause?: unknown) => 
    new SigningError(message, cause),
  
  browser: (message: string, cause?: unknown) => 
    new BrowserError(message, cause),
  
  validation: (message: string, cause?: unknown) => 
    new ValidationError(message, cause),
  
  general: (message: string, code: string, cause?: unknown) => 
    new LazorKitError(message, code, cause),
};

/**
 * Error handler utility
 */
export const handleError = (error: unknown): LazorKitError => {
  if (error instanceof LazorKitError) {
    return error;
  }
  
  if (error instanceof Error) {
    return createError.general(error.message, 'UNKNOWN_ERROR', error);
  }
  
  return createError.general(String(error), 'UNKNOWN_ERROR', error);
}; 