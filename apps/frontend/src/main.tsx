import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { TenantProvider } from './tenant/TenantProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import { AppointmentsProvider } from './appointments/AppointmentsProvider'
import { GamificationProvider } from './gamification/GamificationProvider'
import { NotificationsProvider } from './notifications/NotificationsProvider'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { UserProvider } from './user/UserProvider'
import { CustomerAuthProvider } from './auth/CustomerAuthProvider'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TenantProvider>
      <UserProvider>
        <CustomerAuthProvider>
          <GamificationProvider>
            <AppointmentsProvider>
              <NotificationsProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </NotificationsProvider>
            </AppointmentsProvider>
          </GamificationProvider>
        </CustomerAuthProvider>
      </UserProvider>
      </TenantProvider>
    </ThemeProvider>
  </StrictMode>,
)
