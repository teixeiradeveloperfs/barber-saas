import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireCustomer } from './auth/RequireCustomer'
import { AppShell } from './components/AppShell/AppShell'
import { Appointments } from './pages/Appointments/Appointments'
import { Barbers } from './pages/Barbers/Barbers'
import { Booking } from './pages/Booking/Booking'
import { Screen } from './components/Screen/Screen'
import { ComingSoon } from './pages/ComingSoon/ComingSoon'
import { Home } from './pages/Home/Home'
import { Install } from './pages/Install/Install'
import { Location } from './pages/Location/Location'
import { Plan } from './pages/Plan/Plan'
import { Profile } from './pages/Profile/Profile'
import { Rewards } from './pages/Rewards/Rewards'
import { isLoyaltyEnabled } from './data/gamification'
import { Services } from './pages/Services/Services'
import { Splash } from './pages/Splash/Splash'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ResetPassword } from './pages/auth/ResetPassword'
import { LegalPage } from './pages/legal/LegalPage'
import { Onboarding } from './pages/Onboarding/Onboarding'
import { Refer } from './pages/Refer/Refer'
import { getTenant } from './tenant/active'

export default function App() {
  return (
    <Screen>
      <Routes>
        {/* Público */}
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/termos" element={<LegalPage slug="termos" />} />
        <Route path="/privacidade" element={<LegalPage slug="privacidade" />} />


        {/* App autenticado: sidebar no desktop, barra inferior no celular */}
        {/* Área do cliente: exige conta */}
        <Route element={<RequireCustomer />}>
          <Route path="/bem-vindo" element={<Onboarding />} />
          <Route element={<AppShell />}>
            <Route path="/home" element={<Home />} />
            <Route path="/agendar/:barberId" element={<Booking />} />
            <Route path="/barbeiros" element={<Barbers />} />
            <Route path="/servicos" element={<Services />} />
            <Route path="/agendamentos" element={<Appointments />} />
            <Route path="/recompensas" element={isLoyaltyEnabled() ? <Rewards /> : <Navigate to="/home" replace />} />
            <Route path="/clube" element={<Plan />} />
            <Route path="/plano" element={<Navigate to="/clube" replace />} />
            <Route path="/indicar" element={getTenant().referral.enabled ? <Refer /> : <Navigate to="/home" replace />} />
            <Route path="/como-chegar" element={<Location />} />
            <Route path="/instalar" element={<Install />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<ComingSoon />} />
      </Routes>
    </Screen>
  )
}
