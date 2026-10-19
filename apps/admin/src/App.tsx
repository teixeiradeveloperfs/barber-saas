import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/AppShell/AppShell'
import { ToastProvider } from './components/Toast/ToastProvider'
import { AccountPage } from './pages/Account/AccountPage'
import { LoginPage } from './pages/Login/LoginPage'
import { NotFound } from './pages/NotFound'
import { EditorShell } from './editor/EditorShell'
import { BrandEditor } from './pages/Tenant/editors/BrandEditor'
import { ClubEditor } from './pages/Tenant/editors/ClubEditor'
import { CopyEditor } from './pages/Tenant/editors/CopyEditor'
import { FeaturesEditor } from './pages/Tenant/editors/FeaturesEditor'
import { LegalEditor } from './pages/Tenant/editors/LegalEditor'
import { LoyaltyEditor } from './pages/Tenant/editors/LoyaltyEditor'
import { ReferralEditor } from './pages/Tenant/editors/ReferralEditor'
import { PlaceEditor } from './pages/Tenant/editors/PlaceEditor'
import { ServicesEditor } from './pages/Tenant/editors/ServicesEditor'
import { AgendaIndex } from './pages/Agenda/AgendaIndex'
import { AgendaPage } from './pages/Agenda/AgendaPage'
import { BarberDayPage } from './pages/Agenda/BarberDayPage'
import { Landing } from './pages/Landing'
import { HomeIndex } from './pages/Home/HomeIndex'
import { BarbershopHome } from './pages/Home/BarbershopHome'
import { AccessIndex } from './pages/Access/AccessIndex'
import { AccessPage } from './pages/Access/AccessPage'
import { TeamIndex } from './pages/Team/TeamIndex'
import { TeamPage } from './pages/Team/TeamPage'
import { MediaPage } from './pages/Tenant/MediaPage'
import { OverviewPage } from './pages/Tenant/OverviewPage'
import { TenantLayout } from './pages/Tenant/TenantLayout'
import { ThemeProvider } from './theme/ThemeProvider'
import { WhatsAppIndex } from './pages/WhatsApp/WhatsAppIndex'
import { WhatsAppPage } from './pages/WhatsApp/WhatsAppPage'
import { FirstAccessPage } from './pages/FirstAccess/FirstAccessPage'
import { OnboardingPage } from './pages/Onboarding/OnboardingPage'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/primeiro-acesso" element={<FirstAccessPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<Landing />} />
                  <Route path="/agenda" element={<AgendaIndex />} />
                  <Route path="/agenda/:installationId" element={<AgendaPage />} />
                  <Route path="/agenda/:installationId/:barberId" element={<BarberDayPage />} />
                  <Route path="/equipe" element={<TeamIndex />} />
                  <Route path="/equipe/:installationId" element={<TeamPage />} />
                  <Route path="/comecar/:installationId" element={<OnboardingPage />} />
                  <Route path="/comecar/:installationId/:step" element={<OnboardingPage />} />
                  <Route path="/whatsapp" element={<WhatsAppIndex />} />
                  <Route path="/whatsapp/:installationId" element={<WhatsAppPage />} />
                  <Route path="/conta" element={<AccountPage />} />
                  <Route path="/inicio" element={<HomeIndex />} />
                  <Route path="/inicio/:installationId" element={<BarbershopHome />} />
                  <Route path="/acessos" element={<AccessIndex />} />
                  <Route path="/acessos/:installationId" element={<AccessPage />} />
                  <Route path="/barbearias/:id" element={<TenantLayout />}>
                    <Route index element={<OverviewPage />} />
                    <Route path="imagens" element={<MediaPage />} />
                    <Route element={<EditorShell />}>
                      <Route path="marca" element={<BrandEditor />} />
                      <Route path="textos" element={<CopyEditor />} />
                      <Route path="local" element={<PlaceEditor />} />
                      <Route path="servicos" element={<ServicesEditor />} />
                      <Route path="clube" element={<ClubEditor />} />
                      <Route path="fidelidade" element={<LoyaltyEditor />} />
                      <Route path="indicacao" element={<ReferralEditor />} />
                      <Route path="legal" element={<LegalEditor />} />
                      <Route path="recursos" element={<FeaturesEditor />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
