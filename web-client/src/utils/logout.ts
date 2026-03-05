/**
 * Hard logout: clears ALL auth and persist data from localStorage,
 * then does a hard navigate to login WITHOUT dispatching Redux actions.
 *
 * This avoids the React re-render race condition where:
 *   dispatch(clearAuth) → React unmounts/remounts Router
 *   → window.location.reload() fires mid-transition → infinite loop.
 */
export function performLogout() {
  // 1. Clear auth data
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_username')
  localStorage.removeItem('auth_role')
  localStorage.removeItem('auth_userId')
  localStorage.removeItem('auth_canEditPublicKB')

  // 2. Do NOT clear persist data — model config is shared across users.
  //    Auth is blacklisted from persist, so no stale auth rehydration.

  // 3. Hard navigate — no Redux dispatch, no React re-render race
  window.location.href = window.location.origin + window.location.pathname + '#/login'
  window.location.reload()
}
