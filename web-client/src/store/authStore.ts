import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

export interface AuthState {
  token: string | null
  username: string | null
  role: 'admin' | 'user' | null
  userId: string | null
  canEditPublicKB: boolean
}

const savedToken = localStorage.getItem('auth_token')
const savedUsername = localStorage.getItem('auth_username')
const savedRole = localStorage.getItem('auth_role') as 'admin' | 'user' | null
const savedUserId = localStorage.getItem('auth_userId')
const savedCanEditPublicKB = localStorage.getItem('auth_canEditPublicKB') === 'true'

const initialState: AuthState = {
  token: savedToken,
  username: savedUsername,
  role: savedRole,
  userId: savedUserId,
  canEditPublicKB: savedCanEditPublicKB
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        token: string
        username: string
        role: 'admin' | 'user'
        userId: string
        canEditPublicKB?: boolean
      }>
    ) => {
      state.token = action.payload.token
      state.username = action.payload.username
      state.role = action.payload.role
      state.userId = action.payload.userId
      state.canEditPublicKB = action.payload.canEditPublicKB ?? false
      localStorage.setItem('auth_token', action.payload.token)
      localStorage.setItem('auth_username', action.payload.username)
      localStorage.setItem('auth_role', action.payload.role)
      localStorage.setItem('auth_userId', action.payload.userId)
      localStorage.setItem('auth_canEditPublicKB', String(state.canEditPublicKB))
    },
    clearAuth: (state) => {
      state.token = null
      state.username = null
      state.role = null
      state.userId = null
      state.canEditPublicKB = false
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_username')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_userId')
      localStorage.removeItem('auth_canEditPublicKB')
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions

export const selectIsAuthenticated = (state: RootState) => !!state.auth?.token
export const selectIsAdmin = (state: RootState) => state.auth?.role === 'admin'
export const selectCanEditPublicKB = (state: RootState) =>
  state.auth?.role === 'admin' || state.auth?.canEditPublicKB === true
export const selectAuthToken = (state: RootState) => state.auth?.token
export const selectAuthUser = createSelector(
  (state: RootState) => state.auth?.username,
  (state: RootState) => state.auth?.role,
  (state: RootState) => state.auth?.userId,
  (username, role, userId) => ({ username, role, userId })
)

export default authSlice.reducer
