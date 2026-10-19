import { useReveal } from './lib/useReveal'
import { CheckoutPage } from './checkout/CheckoutPage'
import { WhatsappFloat } from './components/WhatsappFloat'
import { SettingsProvider } from './settings'
import { AgendaDemo } from './sections/AgendaDemo'
import { Cta } from './sections/Cta'
import { Ends } from './sections/Ends'
import { Faq } from './sections/Faq'
import { Features } from './sections/Features'
import { Footer } from './sections/Footer'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { HowItWorks } from './sections/HowItWorks'
import { Pricing } from './sections/Pricing'
import { Partners } from './sections/Partners'
import { PartnersPage } from './partners/PartnersPage'
import { captureRef } from './utm'
import { LegalPage } from './legal/LegalPage'
import { DOCUMENTS } from './legal/documents'

export default function App() {
  captureRef()
  const path = window.location.pathname.replace(/\/$/, '')
  const legal = DOCUMENTS.find((doc) => doc.path === path)
  if (legal) {
    return (
      <SettingsProvider>
        <LegalPage doc={legal} />
      </SettingsProvider>
    )
  }
  if (path === '/parceiros') {
    return (
      <SettingsProvider>
        <PartnersPage />
        <WhatsappFloat />
      </SettingsProvider>
    )
  }
  // Checkout próprio em /assinar; o resto é a página única.
  if (path === '/assinar') {
    return (
      <SettingsProvider>
        <CheckoutPage />
        <WhatsappFloat />
      </SettingsProvider>
    )
  }
  return <Landing />
}

function Landing() {
  useReveal()
  return (
    <SettingsProvider>
      <Header />
      <main id="conteudo">
        <Hero />
        <Ends />
        <Features />
        <HowItWorks />
        <AgendaDemo />
        <Pricing />
        <Partners />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <WhatsappFloat />
    </SettingsProvider>
  )
}
