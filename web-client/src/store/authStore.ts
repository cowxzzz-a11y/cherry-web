import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

export interface AuthState {
  token: string | null
  username: string | null
  role: 'admin' | 'user' | null
  userId: string | null
}

const savedToken = localStorage.getItem('auth_token')
const savedUsername = localStorage.getItem('auth_username')
const savedRole = localStorage.getItem('auth_role') as 'admin' | 'user' | null
const savedUserId = localStorage.getItem('auth_userId')

const initialState: AuthState = {
  token: savedToken,
  username: savedUsername,
  role: savedRole,
  userId: savedUserId
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ token: string; username: string; role: 'admin' | 'user'; userId: string }>) => {
      state.token = action.payload.token
      state.username = action.payload.username
      state.role = action.payload.role
      state.userId = action.payload.userId
      localStorage.setItem('auth_token', action.payload.token)
      localStorage.setItem('auth_username', action.payload.username)
      localStorage.setItem('auth_role', action.payload.role)
      localStorage.setItem('auth_userId', action.payload.userId)
    },
    clearAuth: (state) => {
      state.token = null
      state.username = null
      state.role = null
      state.userId = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_username')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_userId')
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions

export const selectIsAuthenticated = (state: RootState) => !!state.auth?.token
export const selectIsAdmin = (state: RootState) => state.auth?.role === 'admin'
export const selectAuthToken = (state: RootState) => state.auth?.token
export const selectAuthUser = (state: RootState) => ({
  username: state.auth?.username,
  role: state.auth?.role,
  userId: state.auth?.userId
})

export default authSlice.reducer
