import { Router } from '@router';
import { applyInitialTheme, addSystemThemeListener } from '@themeManager';

import AppLayout from './Layout';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import LoginPage from './pages/LoginPage/LoginPage';
import PongGame3DPage from './pages/PongGame3DPage/PongGame3DPage';
import SignupPage from './pages/SignupPage/SignupPage';
import LeaderboardPage from './pages/LeaderboardPage/LeaderboardPage';
import OnlinePongGamePage from './pages/OnlinePongGamePage/OnlinePongGamePage';
import ErrorPage from './pages/ErrorPage/ErrorPage';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import {
  faCircleUp,
  faCircleDown,
  faW,
  faS,
  faKeyboard,
} from '@fortawesome/free-solid-svg-icons';

import '@popperjs/core';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

import '@styles/global.css';
import { checkAuth } from './auth';

// Authentication Middleware
const authentication = async (path, context) => {
  const isAuthenticated = await checkAuth();
  // console.log('isAuthenticated in middleware:', isAuthenticated);

  const publicRoutes = ['/', '/login', '/signup'];

  if (publicRoutes.includes(context.nextPath)) {
    if (
      isAuthenticated &&
      (context.nextPath === '/login' || context.nextPath === '/signup')
    ) {
      // console.log('User already authenticated, redirecting to home...');
      router.navigate('/', { queryParams: { message: 'You are already logged in' } });
      return false;
    }
    return true;
  }

  if (!isAuthenticated) {
    // console.log('Unauthorized access. Redirecting to login page...');
    router.navigate('/login');
    return false;
  }

  return true;
};

// --- Icons from Font Awesome
// Add icons to library
library.add(faCircleUp, faCircleDown, faW, faS, faKeyboard);
// Replace i tags with SVG automatically
dom.watch();

// Root element
const root = document.getElementById('app');

// Routes
const routes = [
  { path: '/', component: HomePage },
  { path: '/signup', component: SignupPage },
  { path: '/login', component: LoginPage },
  { path: '/user/:username', component: ProfilePage },
  { path: '/online-pong-game', component: OnlinePongGamePage },
  { path: '/pong-game-3d', component: PongGame3DPage },
  { path: '/leaderboard', component: LeaderboardPage },
];

// Initialize Theme Manager
applyInitialTheme();
addSystemThemeListener();

// Initialize Router
const router = new Router({
  routes,
  rootElement: root,
  layoutComponent: AppLayout,
  middlewares: [authentication],
  errorComponent: ErrorPage,
});

// // Run the Auth middleware on initial page load
authentication({}, { next: window.location.pathname });

// Expose router to the window object
window.router = router;
