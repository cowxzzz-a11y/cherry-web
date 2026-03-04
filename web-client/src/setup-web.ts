import { webBridge } from './api/web-bridge'

declare global {
  interface Window {
    api?: any
    electron?: any
  }
}

window.api = webBridge

const ipcListeners = new Map<string, Set<(...args: any[]) => void>>()

const ipcRenderer = {
  invoke: () => Promise.resolve(),
  send: () => {},
  on: (channel: string, listener: (...args: any[]) => void) => {
    const set = ipcListeners.get(channel) ?? new Set()
    set.add(listener)
    ipcListeners.set(channel, set)
    return () => {
      const current = ipcListeners.get(channel)
      current?.delete(listener)
      if (current && current.size === 0) {
        ipcListeners.delete(channel)
      }
    }
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    const set = ipcListeners.get(channel)
    set?.delete(listener)
    if (set && set.size === 0) {
      ipcListeners.delete(channel)
    }
  }
}

window.electron = {
  ipcRenderer,
  process: {
    env: {
      NODE_ENV: import.meta.env.MODE
    }
  }
}
