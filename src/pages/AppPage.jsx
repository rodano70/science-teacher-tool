import App from '../App.jsx'
import PasswordGate from '../components/PasswordGate.jsx'

export default function AppPage() {
  return (
    <PasswordGate>
      <App />
    </PasswordGate>
  )
}
