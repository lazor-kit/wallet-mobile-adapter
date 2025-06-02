const isDebug = process.env.DEBUG === 'true' || __DEV__;

export const logger = {
    log: (...args: any[]) => isDebug && console.log('[LazorSDK]', ...args),
    error: (msg: string, err: any) => {
        if (isDebug) {
            console.error(`[LazorSDK Error] ${msg}:`, err);
        }
    },
    warn: (...args: any[]) => isDebug && console.warn('[LazorSDK]', ...args),
    info: (...args: any[]) => isDebug && console.info('[LazorSDK]', ...args),
} as const; 