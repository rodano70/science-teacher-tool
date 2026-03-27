import App from '../App.jsx'
import PasswordGate from '../components/PasswordGate.jsx'
import AppShell from '../components/AppShell.jsx'

export default function AppPage() {
  return (
    <PasswordGate>
      <AppShell>
        <App />
      </AppShell>
    </PasswordGate>
  )
}
