import { Router } from '@router';
import {
  createComponent,
  Link,
  LayoutContent,
  NestedLayoutContent,
} from '@components';
import App from './App';

import 'bootstrap';
import '@styles/global.css';

const errorComponent = ({ code, message, stack }) =>
  createComponent('div', {
    className: 'error-page',
    content: `
      <h1>Error ${code}</h1>
      <p>${message}</p>
      ${stack ? `<pre>${stack}</pre>` : ''}
    `,
  });

const middlewares = [
  async (path, context) => {
    console.log(`Navigating to ${path}`);
    return true;
  },
];

function Navbar() {
  return createComponent('nav', {
    className: 'navbar',
    children: [
      Link({ href: '/', content: 'Home' }),
      Link({ href: '/about', content: 'About' }),
      Link({ href: '/admin', content: 'Admin' }),
    ],
  });
}

// App Layout
function GeneralLayout() {
  const layout = createComponent('div', {
    className: 'general-layout',
    children: [
      Navbar(),
      LayoutContent(),
      createComponent('footer', { className: 'footer', content: 'Footer' }),
    ],
  });

  return layout;
}

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
function HomePage() {
  return createComponent('div', {
    content: `
      <h1>Home Page</h1>
      <p>Welcome to the Home Page!</p>
    `,
    children: [
      Link({ href: '/about', content: 'Go to About Page' }),
      Link({
        href: '/admin',
        content: 'Go to Admin Page',
        className: 'admin-link',
      }),
    ],
  });
}

function AboutPage() {
  return createComponent('div', { content: '<h1>About Page</h1>' });
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
  layoutComponent: GeneralLayout,
  middlewares,
  errorComponent,
});

window.router = router;
router.render();
