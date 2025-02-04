import { Router } from '@router';
import { createComponent, Link, NestedLayoutContent } from '@component';
import { applyInitialTheme, addSystemThemeListener } from '@themeManager';

import AppLayout from './Layout';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import LoginPage from './pages/LoginPage/LoginPage';
import LeaderboardPage from './pages/LeaderboardPage/LeaderboardPage';
import PongGamePage from './pages/PongGamePage/PongGamePage';
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
  if (path === '/' || path === '/login' || path === '/signup') {
    return true;
  }
  if (!isAuthenticated) {
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

// Check if the user is authenticated
function checkAuth() {
  //const token = localStorage.getItem('authToken');
  //return !!token;
  return false;
}

// Nested Layout for Admin Section: With nested layout you can define a layout
// for a specific section of your app, in this case the admin section.
function AdminLayout() {
  const layout = createComponent('div', {
    className: 'admin-layout',
    content: `
      <header class="admin-header">Admin Header - this is an example of a nested layout</header>
    `,
    children: [NestedLayoutContent()],
  });
  return layout;
}

function AdminPage() {
  return createComponent('div', {
    content: '<h1>Admin Dashboard</h1>',
    children: [
      Link({
        href: '/admin/settings',
        content: 'Go to admin settings',
        className: 'btn btn-primary',
        attributes: { type: 'button', role: 'button' },
      }),
    ],
  });
}

function AdminSettingsPage() {
  return createComponent('div', { content: '<h1>Admin Settings</h1>' });
}
// --- END EXAMPLE ---

// Root element
const root = document.getElementById('app');

// Routes
const routes = [
  { path: '/', component: HomePage },
  { path: '/signup', component: SignupPage },
  { path: '/login', component: LoginPage },
  { path: '/user/:username', component: ProfilePage },
  { path: '/leaderboard', component: LeaderboardPage},
  { path: '/pong-game', component: PongGamePage },
  { path: '/admin', component: AdminPage, layoutComponent: AdminLayout },
  {
    path: '/admin/settings',
    component: AdminSettingsPage,
    layoutComponent: AdminLayout,
  },
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
  middlewares: [isAuthenticated],
  //middlewares,
  errorComponent: ErrorPage,
});

// Run the middleware on initial page load
const initialPath = window.location.pathname;
isAuthenticated(initialPath, {}).then((allowed) => {
  if (!allowed) {
    router.navigate('/login');
  } else {
    router.resolve(initialPath);
  }
});

// Expose router to the window object
window.router = router;
