
export const loggerService = {
  withContext: (context: string) => ({
    info: (...args: any[]) => console.log(`[INFO][${context}]`, ...args),
    warn: (...args: any[]) => console.warn(`[WARN][${context}]`, ...args),
    error: (...args: any[]) => console.error(`[ERROR][${context}]`, ...args),
    debug: (...args: any[]) => console.debug(`[DEBUG][${context}]`, ...args),
    silly: (...args: any[]) => {} // console.debug(`[SILLY][${context}]`, ...args)
  }),
  info: (...args: any[]) => console.log(`[INFO]`, ...args),
  warn: (...args: any[]) => console.warn(`[WARN]`, ...args),
  error: (...args: any[]) => console.error(`[ERROR]`, ...args)
};
