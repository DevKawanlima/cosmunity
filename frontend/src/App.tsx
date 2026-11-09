import './extra.css'
import { AppProvider, useApp, BARE, ARTIST_ONLY } from './store'
import { BackNavigation, MapFab, MapPanel, PublicShell, Shell } from './layout'
import { showPrototypeNavigator } from './services/config'
import { OverlayHost, ToastStack } from './overlays'
import { Forgot, Landing, Login, PhoneVerify, Reset, Signup, VerifyEmail } from './screens/access'
import { Dashboard, Marketplace, Products, ProductDetail, SearchResults, ServiceDetail, Services } from './screens/discover'
import { ArtistForm, ArtistProfile, BecomeArtist, PortfolioFull, ReviewsPage, WorkDetail } from './screens/artist'
import { ArtistDashboard, ArtistGate, MyPortfolio, MyProducts, MyServices, ProductForm, ServiceForm, WorkForm } from './screens/manage'
import { Chat, ConversationList, Negotiation } from './screens/chat'
import { CommunitiesPage, CommunityChat, CommunityDetail, CommunityForm, Participants } from './screens/community'
import { CalendarView, EventDetail, EventForm, EventList } from './screens/events'
import { ChangePassword, DeactivateAccount, EditProfile, MyProfile, SettingsPage } from './screens/account'
import { DesignSystem } from './screens/design-system'

function Router() {
  const { screen } = useApp()
  switch (screen) {
    case 0: return <DesignSystem />
    case 1: return <Landing />
    case 2: return <Signup />
    case 3: return <VerifyEmail />
    case 4: return <Login />
    case 5: return <Forgot />
    case 6: return <Reset />
    case 7: return <PhoneVerify />
    case 8: return <Dashboard />
    case 9: return <Marketplace />
    case 10: return <Products />
    case 11: return <Services />
    case 12: return <SearchResults />
    case 13: return <ProductDetail />
    case 14: return <ServiceDetail />
    case 15: return <ArtistProfile />
    case 16: return <PortfolioFull />
    case 17: return <WorkDetail />
    case 18: return <BecomeArtist />
    case 19: return <ArtistForm mode="create" />
    case 20: return <ArtistForm mode="edit" />
    case 21: return <ArtistDashboard />
    case 22: return <MyProducts />
    case 23: return <ProductForm mode="create" />
    case 24: return <ProductForm mode="edit" />
    case 25: return <MyServices />
    case 26: return <ServiceForm mode="create" />
    case 27: return <ServiceForm mode="edit" />
    case 28: return <MyPortfolio />
    case 29: return <WorkForm mode="create" />
    case 30: return <WorkForm mode="edit" />
    case 31: return <ConversationList />
    case 32: return <Chat />
    case 33: return <Negotiation />
    case 37: return <ReviewsPage />
    case 38: return <CommunitiesPage />
    case 39: return <CommunityDetail />
    case 40: return <CommunityChat />
    case 41: return <CommunityForm mode="create" />
    case 42: return <CommunityForm mode="edit" />
    case 43: return <Participants />
    case 45: return <CalendarView />
    case 46: return <EventList />
    case 47: return <EventDetail />
    case 48: return <EventForm mode="create" />
    case 49: return <EventForm mode="edit" />
    case 50: return <MyProfile />
    case 51: return <EditProfile />
    case 52: return <SettingsPage />
    case 53: return <ChangePassword />
    case 55: return <DeactivateAccount />
    default: return <Dashboard />
  }
}

function Frame() {
  const { screen, loggedIn, session } = useApp()
  const page = ARTIST_ONLY.has(screen) && session !== 'artist' ? <ArtistGate /> : <Router />
  if (BARE.has(screen)) return <><div className="history-back-bare"><BackNavigation /></div>{page}</>
  if (screen === 1) return <PublicShell>{page}</PublicShell>
  if (loggedIn) return <Shell>{page}</Shell>
  return <PublicShell><div className="page public-page">{page}</div></PublicShell>
}

export default function App() {
  return (
    <AppProvider>
      <Frame />
      <OverlayHost />
      <ToastStack />
      {showPrototypeNavigator && <MapPanel />}
      {showPrototypeNavigator && <MapFab />}
    </AppProvider>
  )
}
