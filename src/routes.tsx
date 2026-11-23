import { RouteObject } from 'react-router';
import HomePage from './pages/index';
import ResourcesPage from './pages/resources';
import MoonCalendarPage from './pages/moon-calendar';
import BirthChartPage from './pages/birth-chart';
import AboutPage from './pages/about';
import HerbsPage from './pages/herbs';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import ForgotPasswordPage from './pages/forgot-password';
import AccountPage from './pages/account';
import ProfileStudioPage from './pages/account/profile';
import GrimoirePage from './pages/grimoire';
import TarotPage from './pages/tarot';
import MoonRitualPage from './pages/moon-ritual';
import DashboardPage from './pages/dashboard';
import TimelinePage from './pages/timeline';
import CalendarPage from './pages/calendar';
import DreamJournalPage from './pages/dream-journal';
import SanctuaryPage from './pages/sanctuary';
import SpellsPage from './pages/spells/index';
import SpellDetailPage from './pages/spells/[slug]';
import SubmitSpellPage from './pages/spells/submit';
import AdminDashboardPage from './pages/admin/dashboard';
import AdminApplicationsPage from './pages/admin/applications';
import AdminModeratorPage from './pages/admin/moderator';
import AdminCommunityAdminPage from './pages/admin/community-admin';
import MyApplicationsPage from './pages/account/applications';
import PlusPage from './pages/plus';
import AdminSpellsPage from './pages/admin/spells';
import AdminCommunityPage from './pages/admin/community';
import AdminRolesPage from './pages/admin/roles';
import CreatorApplicationPage from './pages/creator-application';
import CreatorsPage from './pages/creators';
import OrganizationsPage from './pages/organizations';
import CirclesPage from './pages/circles';
// Eager import so renderToString doesn't hit a Suspense boundary on 404 routes
// and abort to client rendering. The prod 404 page is tiny; the dev-tools
// variant stays lazy because it pulls in dev-only code we don't want in
// production bundles.
import ProdNotFoundPage from './pages/_404';
import NumerologyPage from './pages/numerology';
import RunesPage from './pages/runes';
import CompatibilityPage from './pages/compatibility';
import ProfilePage from './pages/profile/[username]';
import UserProfilePage from './pages/u/[username]';
import MessagesPage from './pages/messages';
import PrivacyPage from './pages/privacy';
import TermsPage from './pages/terms';
import CommunityPage from './pages/community/index';
import CommunityCategoryPage from './pages/community/[slug]';
import CommunityPostPage from './pages/community/post/[id]';
import CommunityDiscoverPage from './pages/community/discover';
import CommunityNewPage from './pages/community/new';
import CommunityBookmarksPage from './pages/community/bookmarks';
import CommunityNotificationsPage from './pages/community/notifications';
import AstronomicalAccuracyPage from './pages/astronomical-accuracy';
import TarotCardDetailPage from './pages/tarot/cards/[slug]';
import MoonPhasesPage from './pages/moon/phases';
import MoonEventPage from './pages/moon/[type]/[year]/[month]';
import AstrologyIndexPage from './pages/astrology/index';
import ZodiacSignPage from './pages/astrology/[sign]';
import PlanetsPage from './pages/astrology/planets';
import HousesPage from './pages/astrology/houses';
import AspectsPage from './pages/astrology/aspects';
import LiveSkyPage from './pages/astrology/live-sky';
import CosmicConnectionsPage from './pages/astrology/cosmic-connections';
import CelestialTimeMachinePage from './pages/astrology/celestial-time-machine';
import RemindersPage from './pages/reminders';
import AppStoreSubmissionPage from './pages/app-store-submission';
import AppStoreScreenshotsPage from './pages/app-store-screenshots';
import AppLaunchKitPage from './pages/app-launch-kit';
import HoroscopePage from './pages/horoscope';
import LearnPage from './pages/learn/index';
import AcademyTopicPage from './pages/learn/[topicSlug]/index';
import AcademyLessonPage from './pages/learn/[topicSlug]/[lessonSlug]';
import HowToReadYourBirthChartPage from './pages/seo-guides/how-to-read-your-birth-chart';
import SunMoonRisingSignsPage from './pages/seo-guides/sun-moon-rising-signs-explained';
import TwelveAstrologicalHousesPage from './pages/seo-guides/twelve-astrological-houses';
import MoonSignMeaningPage from './pages/seo-guides/moon-sign-meaning';
import HowToReadTarotPage from './pages/seo-guides/how-to-read-tarot-for-beginners';
import ThreeCardTarotSpreadsPage from './pages/seo-guides/three-card-tarot-spreads';
import MajorVsMinorArcanaPage from './pages/seo-guides/major-vs-minor-arcana';
import EightMoonPhasesPage from './pages/seo-guides/eight-moon-phases-meaning';
import NewMoonVsFullMoonPage from './pages/seo-guides/new-moon-vs-full-moon-rituals';
import HowToUseMoonCalendarPage from './pages/seo-guides/how-to-use-a-moon-calendar';
import WitchcraftForBeginnersPage from './pages/seo-guides/witchcraft-for-beginners';
import HowToCreateGrimoirePage from './pages/seo-guides/how-to-create-a-grimoire';
import TarotSharePage, { loader as tarotShareLoader } from './pages/tarot/share/[publicId]';
import ExplorePage from './pages/explore/index';

const NotFoundPage = ProdNotFoundPage;

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/account',
    element: <AccountPage />,
  },
  {
    path: '/account/profile',
    element: <ProfileStudioPage />,
  },
  {
    path: '/sanctuary',
    element: <SanctuaryPage />,
  },
  {
    path: '/spells',
    element: <SpellsPage />,
  },
  {
    path: '/spells/submit',
    element: <SubmitSpellPage />,
  },
  {
    path: '/spells/:slug',
    element: <SpellDetailPage />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboardPage />,
  },
  {
    path: '/admin/applications',
    element: <AdminApplicationsPage />,
  },
  {
    path: '/admin/moderator',
    element: <AdminModeratorPage />,
  },
  {
    path: '/admin/community-admin',
    element: <AdminCommunityAdminPage />,
  },
  {
    path: '/account/applications',
    element: <MyApplicationsPage />,
  },
  {
    path: '/plus',
    element: <PlusPage />,
  },
  {
    path: '/admin/spells',
    element: <AdminSpellsPage />,
  },
  {
    path: '/admin/community',
    element: <AdminCommunityPage />,
  },
  {
    path: '/admin/roles',
    element: <AdminRolesPage />,
  },
  {
    path: '/creator-application',
    element: <CreatorApplicationPage />,
  },
  {
    path: '/grimoire',
    element: <GrimoirePage />,
  },
  {
    path: '/explore',
    element: <ExplorePage />,
  },
  {
    path: '/tarot',
    element: <TarotPage />,
  },
  {
    path: '/moon-ritual',
    element: <MoonRitualPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/timeline',
    element: <TimelinePage />,
  },
  {
    path: '/calendar',
    element: <CalendarPage />,
  },
  {
    path: '/dream-journal',
    element: <DreamJournalPage />,
  },
  {
    path: '/resources',
    element: <ResourcesPage />,
  },
  {
    path: '/moon-calendar',
    element: <MoonCalendarPage />,
  },
  {
    path: '/birth-chart',
    element: <BirthChartPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/herbs',
    element: <HerbsPage />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  { path: '/numerology', element: <NumerologyPage /> },
  { path: '/runes', element: <RunesPage /> },
  { path: '/compatibility', element: <CompatibilityPage /> },
  { path: '/profile/:username', element: <ProfilePage /> },
  { path: '/u/:username', element: <UserProfilePage /> },
  { path: '/messages', element: <MessagesPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/community', element: <CommunityPage /> },
  // Static community paths MUST come before /community/:slug so React Router
  // does not match "new", "bookmarks", "notifications", "post", or "discover"
  // as a :slug param and render the wrong page.
  { path: '/community/new', element: <CommunityNewPage /> },
  { path: '/community/bookmarks', element: <CommunityBookmarksPage /> },
  { path: '/community/notifications', element: <CommunityNotificationsPage /> },
  { path: '/community/discover', element: <CommunityDiscoverPage /> },
  { path: '/community/post/:id', element: <CommunityPostPage /> },
  { path: '/community/:slug', element: <CommunityCategoryPage /> },
  { path: '/creators', element: <CreatorsPage /> },
  { path: '/organizations', element: <OrganizationsPage /> },
  { path: '/circles', element: <CirclesPage /> },
  { path: '/astronomical-accuracy', element: <AstronomicalAccuracyPage /> },
  { path: '/tarot/cards/:slug', element: <TarotCardDetailPage /> },
  { path: '/tarot/share/:publicId', element: <TarotSharePage />, loader: tarotShareLoader },
  { path: '/moon/phases', element: <MoonPhasesPage /> },
  { path: '/moon/:type/:year/:month', element: <MoonEventPage /> },
  { path: '/astrology', element: <AstrologyIndexPage /> },
  { path: '/astrology/planets', element: <PlanetsPage /> },
  { path: '/astrology/houses', element: <HousesPage /> },
  { path: '/astrology/aspects', element: <AspectsPage /> },
  { path: '/astrology/live-sky', element: <LiveSkyPage /> },
  { path: '/astrology/cosmic-connections', element: <CosmicConnectionsPage /> },
  { path: '/astrology/celestial-time-machine', element: <CelestialTimeMachinePage /> },
  { path: '/astrology/:sign', element: <ZodiacSignPage /> },
  { path: '/reminders', element: <RemindersPage /> },
  { path: '/app-store-submission', element: <AppStoreSubmissionPage /> },
  { path: '/app-store-screenshots', element: <AppStoreScreenshotsPage /> },
  { path: '/app-launch-kit', element: <AppLaunchKitPage /> },
  { path: '/horoscope', element: <HoroscopePage /> },
  { path: '/learn', element: <LearnPage /> },
  { path: '/learn/:topicSlug', element: <AcademyTopicPage /> },
  { path: '/learn/:topicSlug/:lessonSlug', element: <AcademyLessonPage /> },
  { path: '/seo-guides/how-to-read-your-birth-chart', element: <HowToReadYourBirthChartPage /> },
  { path: '/seo-guides/sun-moon-rising-signs-explained', element: <SunMoonRisingSignsPage /> },
  { path: '/seo-guides/twelve-astrological-houses', element: <TwelveAstrologicalHousesPage /> },
  { path: '/seo-guides/moon-sign-meaning', element: <MoonSignMeaningPage /> },
  { path: '/seo-guides/how-to-read-tarot-for-beginners', element: <HowToReadTarotPage /> },
  { path: '/seo-guides/three-card-tarot-spreads', element: <ThreeCardTarotSpreadsPage /> },
  { path: '/seo-guides/major-vs-minor-arcana', element: <MajorVsMinorArcanaPage /> },
  { path: '/seo-guides/eight-moon-phases-meaning', element: <EightMoonPhasesPage /> },
  { path: '/seo-guides/new-moon-vs-full-moon-rituals', element: <NewMoonVsFullMoonPage /> },
  { path: '/seo-guides/how-to-use-a-moon-calendar', element: <HowToUseMoonCalendarPage /> },
  { path: '/seo-guides/witchcraft-for-beginners', element: <WitchcraftForBeginnersPage /> },
  { path: '/seo-guides/how-to-create-a-grimoire', element: <HowToCreateGrimoirePage /> },
  {
    id: 'airo-not-found',
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/birth-chart';

export type Params = Record<string, string | undefined>;
