import '@renderer/databases'

import type { FC } from 'react'
import { useMemo } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'

import Sidebar from './components/app/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import TabsContainer from './components/Tab/TabContainer'
import NavigationHandler from './handler/NavigationHandler'
import { useNavbarPosition } from './hooks/useSettings'
import CodeToolsPage from './pages/code/CodeToolsPage'
import FilesPage from './pages/files/FilesPage'
import HomePage from './pages/home/HomePage'
import KnowledgePage from './pages/knowledge/KnowledgePage'
import LaunchpadPage from './pages/launchpad/LaunchpadPage'
import MinAppPage from './pages/minapps/MinAppPage'
import MinAppsPage from './pages/minapps/MinAppsPage'
import NotesPage from './pages/notes/NotesPage'
import OpenClawPage from './pages/openclaw/OpenClawPage'
import PaintingsRoutePage from './pages/paintings/PaintingsRoutePage'
import SettingsPage from './pages/settings/SettingsPage'
import AssistantPresetsPage from './pages/store/assistants/presets/AssistantPresetsPage'
import TranslatePage from './pages/translate/TranslatePage'
import LoginPage from './pages/auth/LoginPage'
import { useAppSelector } from './store'
import { selectIsAuthenticated, selectIsAdmin } from './store/authStore'

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const AdminRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = useAppSelector(selectIsAdmin)
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const Router: FC = () => {
  const { navbarPosition } = useNavbarPosition()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const routes = useMemo(() => {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/store" element={<ProtectedRoute><AssistantPresetsPage /></ProtectedRoute>} />
          <Route path="/paintings/*" element={<ProtectedRoute><PaintingsRoutePage /></ProtectedRoute>} />
          <Route path="/translate" element={<ProtectedRoute><TranslatePage /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
          <Route path="/apps/:appId" element={<ProtectedRoute><MinAppPage /></ProtectedRoute>} />
          <Route path="/apps" element={<ProtectedRoute><MinAppsPage /></ProtectedRoute>} />
          <Route path="/code" element={<ProtectedRoute><CodeToolsPage /></ProtectedRoute>} />
          <Route path="/openclaw" element={<ProtectedRoute><OpenClawPage /></ProtectedRoute>} />
          <Route path="/settings/*" element={<ProtectedRoute><AdminRoute><SettingsPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/launchpad" element={<ProtectedRoute><LaunchpadPage /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    )
  }, [])

  if (!isAuthenticated) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    )
  }

  if (navbarPosition === 'left') {
    return (
      <HashRouter>
        <Sidebar />
        {routes}
        <NavigationHandler />
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <NavigationHandler />
      <TabsContainer>{routes}</TabsContainer>
    </HashRouter>
  )
}

export default Router
