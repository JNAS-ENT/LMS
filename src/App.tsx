import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { AppRouter } from './router'

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <AppRouter />
      </WorkspaceProvider>
    </AuthProvider>
  )
}

export default App
