import { Router } from '@router';
import { createComponent, Link, NestedLayoutContent } from '@components';

import HomePage from './pages/HomePage';
import ErrorPage from './pages/ErrorPage';
import PongGamePage from './pages/PongGamePage';
import AppLayout from './Layout';

import '@popperjs/core';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import '@styles/global.css';

const middlewares = [
  async (path, context) => {
    console.log(`Navigating to ${path}`);
    return true;
  },
];

// Nested Layout for Admin Section
function AdminLayout() {
  const layout = createComponent('div', {
    className: 'admin-layout',
    content: `
      <header class="admin-header">Admin Header</header>
    `,
    children: [NestedLayoutContent()],
  });
  return layout;
}

// Components
function AboutPage() {
  return createComponent('div', {
    content: `
      <h1 class="text-center">About Page</h1>
      <div class="card" style="width: 18rem;">
        <img src="https://via.placeholder.com/150" class="card-img-top" alt="Image">
        <div class="card-body">
          <h5 class="card-title">Bootstrap Card</h5>
          <p class="card-text">This is a simple Bootstrap card added to the About Page. You can use Bootstrap components like buttons, cards, forms, etc.</p>
          <a href="#" class="btn btn-primary">Go somewhere</a>
        </div>
      </div>
    `,
  });
}

function AdminPage() {
  return createComponent('div', { content: '<h1>Admin Dashboard</h1>' });
}

function AdminSettingsPage() {
  return createComponent('div', { content: '<h1>Admin Settings</h1>' });
}

// Routes
const routes = [
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/pong-game', component: PongGamePage },
  { path: '/admin', component: AdminPage, layoutComponent: AdminLayout },
  {
    path: '/admin/settings',
    component: AdminSettingsPage,
    layoutComponent: AdminLayout,
  },
];

// Initialize Router
const router = new Router({
  routes,
  rootElement: document.getElementById('app'),
  layoutComponent: AppLayout,
  middlewares,
  errorComponent: ErrorPage,
});

window.router = router;
router.render();
