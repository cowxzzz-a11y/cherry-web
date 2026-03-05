/**
 * @deprecated Scheduled for removal in v2.0.0
 * --------------------------------------------------------------------------
 * ⚠️ NOTICE: V2 DATA&UI REFACTORING (by 0xfullex)
 * --------------------------------------------------------------------------
 * STOP: Feature PRs affecting this file are currently BLOCKED.
 * Only critical bug fixes are accepted during this migration phase.
 *
 * This file is being refactored to v2 standards.
 * Any non-critical changes will conflict with the ongoing work.
 *
 * 🔗 Context & Status:
 * - Contribution Hold: https://github.com/CherryHQ/cherry-studio/issues/10954
 * - v2 Refactor PR   : https://github.com/CherryHQ/cherry-studio/pull/10162
 * --------------------------------------------------------------------------
 */
import { loggerService } from '@logger'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { IpcChannel } from '@shared/IpcChannel'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import storeSyncService from '../services/StoreSyncService'
import assistants from './assistants'
import auth from './authStore'
import backup from './backup'
import codeTools from './codeTools'
import copilot from './copilot'
import inputToolsReducer from './inputTools'
import knowledge from './knowledge'
import llm from './llm'
import mcp from './mcp'
import memory from './memory'
import messageBlocksReducer from './messageBlock'
import migrate from './migrate'
import minapps from './minapps'
import newMessagesReducer from './newMessage'
import { setNotesPath } from './note'
import note from './note'
import nutstore from './nutstore'
import ocr from './ocr'
import openclaw from './openclaw'
import paintings from './paintings'
import preprocess from './preprocess'
import runtime from './runtime'
import selectionStore from './selectionStore'
import settings from './settings'
import shortcuts from './shortcuts'
import tabs from './tabs'
import toolPermissions from './toolPermissions'
import translate from './translate'
import websearch from './websearch'

const logger = loggerService.withContext('Store')

// Shared persist key for all users — model config (llm, settings, etc.) is shared.
const PERSIST_KEY = 'cherry-studio'

// Per-user persist key for assistants (topics, knowledge_base selections, etc.)
const persistUserId = localStorage.getItem('auth_userId')
const ASSISTANTS_PERSIST_KEY = persistUserId ? `cherry-assistants-${persistUserId}` : 'cherry-assistants'

// One-time migration: if shared persist data doesn't exist, copy from any per-user key
;(() => {
  const sharedData = localStorage.getItem(`persist:${PERSIST_KEY}`)
  if (!sharedData) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('persist:cherry-studio-') && key !== `persist:${PERSIST_KEY}`) {
        const data = localStorage.getItem(key)
        if (data) {
          localStorage.setItem(`persist:${PERSIST_KEY}`, data)
          break
        }
      }
    }
  }

  // Seed per-user assistants data from shared persist if not yet split
  if (persistUserId && !localStorage.getItem(`persist:${ASSISTANTS_PERSIST_KEY}`)) {
    const source = localStorage.getItem(`persist:${PERSIST_KEY}`)
    if (source) {
      try {
        const parsed = JSON.parse(source)
        if (parsed.assistants) {
          localStorage.setItem(`persist:${ASSISTANTS_PERSIST_KEY}`, parsed.assistants)
        }
      } catch {
        // ignore parse errors
      }
    }
  }
})()

// Per-user persisted assistants reducer (topics & KB selections are user-specific)
const persistedAssistants = persistReducer(
  {
    key: ASSISTANTS_PERSIST_KEY,
    storage
  },
  assistants
)

const rootReducer = combineReducers({
  auth,
  assistants: persistedAssistants,
  backup,
  codeTools,
  nutstore,
  paintings,
  llm,
  settings,
  runtime,
  shortcuts,
  knowledge,
  minapps,
  websearch,
  mcp,
  memory,
  copilot,
  openclaw,
  selectionStore,
  tabs,
  preprocess,
  messages: newMessagesReducer,
  messageBlocks: messageBlocksReducer,
  inputTools: inputToolsReducer,
  translate,
  ocr,
  note,
  toolPermissions
})

const persistedReducer = persistReducer(
  {
    key: PERSIST_KEY,
    storage,
    version: 200,
    blacklist: ['runtime', 'messages', 'messageBlocks', 'tabs', 'toolPermissions', 'auth', 'assistants'],
    migrate
  },
  rootReducer
)

/**
 * Configures the store sync service to synchronize specific state slices across all windows.
 * For detailed implementation, see @renderer/services/StoreSyncService.ts
 *
 * Usage:
 * - 'xxxx/' - Synchronizes the entire state slice
 * - 'xxxx/sliceName' - Synchronizes a specific slice within the state
 *
 * To listen for store changes in a window:
 * Call storeSyncService.subscribe() in the window's entryPoint.tsx
 */
storeSyncService.setOptions({
  syncList: ['assistants/', 'settings/', 'llm/', 'selectionStore/', 'note/']
})

const store = configureStore({
  // @ts-ignore store type is unknown
  reducer: persistedReducer as typeof rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(storeSyncService.createMiddleware())
  },
  devTools: true
})

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch

export const persistor = persistStore(store, undefined, () => {
  // Initialize notes path after rehydration if empty
  const state = store.getState()
  if (!state.note.notesPath) {
    // Use setTimeout to ensure this runs after the store is fully initialized
    setTimeout(async () => {
      try {
        const info = await window.api.getAppInfo()
        const notesPath = typeof info?.notesPath === 'string' ? info.notesPath : ''
        if (notesPath) {
          store.dispatch(setNotesPath(notesPath))
          logger.info('Initialized notes path on startup:', notesPath)
        }
      } catch (error) {
        logger.error('Failed to initialize notes path on startup:', error as Error)
      }
    }, 0)
  }

  // Notify main process that Redux store is ready
  window.electron?.ipcRenderer?.invoke(IpcChannel.ReduxStoreReady)
  logger.info('Redux store ready, notified main process')
})

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<typeof store>()
window.store = store

export async function handleSaveData() {
  logger.info('Flushing redux persistor data')
  await persistor.flush()
  logger.info('Flushed redux persistor data')
}

export default store
