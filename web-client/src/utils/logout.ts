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

  // 2. Clear user-specific persist data to prevent knowledge base leakage across users.
  //    The knowledge slice is persisted in the shared persist key, so we need to
  //    remove the knowledge bases from the persisted state on logout.
  try {
    const persistKey = 'persist:cherry-studio'
    const raw = localStorage.getItem(persistKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.knowledge) {
        const knowledgeState = JSON.parse(parsed.knowledge)
        knowledgeState.bases = []
        parsed.knowledge = JSON.stringify(knowledgeState)
        localStorage.setItem(persistKey, JSON.stringify(parsed))
      }
    }
  } catch {
    // ignore parse errors
  }

  // 3. Hard navigate — no Redux dispatch, no React re-render race
  window.location.href = window.location.origin + window.location.pathname + '#/login'
  window.location.reload()
}
