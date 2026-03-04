
interface CacheItem<T> {
  data: T
  timestamp: number
  duration: number
}

export class CacheService {
  private static cache: Map<string, CacheItem<any>> = new Map()

  static set<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    })
  }

  static get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.duration) {
      this.remove(key)
      return null
    }

    return item.data
  }

  static remove(key: string): void {
    this.cache.delete(key)
  }

  static clear(): void {
    this.cache.clear()
  }

  static has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    const now = Date.now()
    if (now - item.timestamp > item.duration) {
      this.remove(key)
      return false
    }

    return true
  }
}
