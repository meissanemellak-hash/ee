/**
 * Logger pour l'app (API et client) : log/warn uniquement en dev ou si DEBUG_API=1.
 * En production, évite le bruit et la fuite d'infos sensibles. error() est toujours loggé.
 */
const devOrDebug =
  typeof process === 'undefined' ||
  process.env.NODE_ENV !== 'production' ||
  process.env.DEBUG_API === '1'

export const logger = {
  log: (...args: unknown[]) => {
    if (devOrDebug) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (devOrDebug) console.warn(...args)
  },
  /** Toujours émis (dev + prod) pour que les erreurs restent dans les logs hébergeur. */
  error: (...args: unknown[]) => {
    console.error(...args)
  },
}
