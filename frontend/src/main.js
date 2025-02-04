import { Router } from '@router';
import { applyInitialTheme, addSystemThemeListener } from '@themeManager';

import AppLayout from './Layout';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import LoginPage from './pages/LoginPage/LoginPage';
import StatsPage from './pages/StatsPage/StatsPage';
import PongGamePage from './pages/PongGamePage/PongGamePage';
import PongGame3DPage from './pages/PongGame3DPage/PongGame3DPage';
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
import SignupPage from './pages/SignupPage.js/SignupPage';

// Authentication Middleware
const isAuthenticated = async (path, context) => {
  const isAuthenticated = checkAuth();
  console.log('path:', path);
  console.log('isAuthenticated:', isAuthenticated);
  if (
    !isAuthenticated &&
    (path.startsWith('/profile') ||
      path.startsWith('/admin') ||
      path.startsWith('/user/username') ||
      path.startsWith('/pong-game') ||
      path.startsWith('/stats'))
  ) {
    console.log('Unauthorized access. Redirecting to login page...');
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

const middlewares = [
  isAuthenticated,
  async (path, context) => {
    console.log(`Navigating to: ${path}`);
    return true;
  },
];

// Check if the user is authenticated
function checkAuth() {
  //const token = localStorage.getItem('authToken');
  //return !!token;
  return true;
}

// Root element
const root = document.getElementById('app');

// Routes
const routes = [
  { path: '/', component: HomePage },
  { path: '/signup', component: SignupPage },
  { path: '/login', component: LoginPage },
  { path: '/user/:username', component: ProfilePage },
  { path: '/stats', component: StatsPage },
  { path: '/pong-game', component: PongGamePage },
  { path: '/pong-game-3d', component: PongGame3DPage },
  { path: '/online-pong-game', component: OnlinePongGamePage },
];

// Initialize Theme Manager
applyInitialTheme();
addSystemThemeListener();

// Initialize Router
const router = new Router({
  routes,
  rootElement: root,
  layoutComponent: AppLayout,
  middlewares,
  errorComponent: ErrorPage,
});

// Expose router to the window object
window.router = router;
