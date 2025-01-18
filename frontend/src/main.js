import { Router } from '@router';
import { createComponent, Link, NestedLayoutContent } from '@component';
import { applyInitialTheme, addSystemThemeListener } from '@themeManager';

import AppLayout from './Layout';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import LoginPage from './pages/LoginPage/LoginPage';
import StatsPage from './pages/StatsPage/StatsPage';
import PongGamePage from './pages/PongGamePage/PongGamePage';
import ErrorPage from './pages/ErrorPage/ErrorPage';

import '@popperjs/core';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import '@styles/global.css';

// --- EXAMPLES ----
// Example: Middlewares are functions that run before a navigation, when you
// add this to the the router config.
const middlewares = [
  async (path, context) => {
    console.log(`Navigating to: ${path}`);
    return true;
  },
];

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
  { path: '/login', component: LoginPage },
  { path: '/user/:username', component: ProfilePage },
  { path: '/stats', component: StatsPage },
  { path: '/pong-game', component: PongGamePage },
  { path: '/admin', component: AdminPage, layoutComponent: AdminLayout },
  {
    path: '/admin/settings',
    component: AdminSettingsPage,
    layoutComponent: AdminLayout,
  },
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
