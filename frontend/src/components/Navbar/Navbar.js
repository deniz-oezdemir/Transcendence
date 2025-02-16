import { createComponent, Link } from '@component';
import { createSignal, createEffect } from '@reactivity';
import { setTheme, getPreferredTheme } from '@themeManager';
import { isAuthenticated, login, logout } from '../../auth.js';

import styles from './Navbar.module.css';

export default function Navbar({ location, navigate }) {
  const path = location();

  const [theme, setThemeState] = createSignal(getPreferredTheme());

  const toggleTheme = () => {
    const newTheme = theme() === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
  };

  const handleAuthButtonClick = () => {
    if (isAuthenticated()) {
      try {
        logout();
        router.navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        navigate('/profile');
      }
    } else {
      navigate('/login');
    }
  };

  const themeButton = createComponent('button', {
    className: `btn btn-outline-light me-2 ${styles.customBtn}`,
    attributes: { type: 'button', role: 'button' },
    content: theme() !== 'dark' ? '🌙Dark' : '☀️Light',
    events: {
      click: toggleTheme,
    },
  });

  const authButton = createComponent('button', {
    className: `btn btn-outline-success ${styles.customBtn}`,
    attributes: { type: 'button', role: 'button' },
    content: isAuthenticated() ? 'Logout' : 'Login',
    events: {
      click: handleAuthButtonClick,
    },
  });

  createEffect(() => {
    authButton.element.textContent = isAuthenticated() ? 'Logout' : 'Login';
  });

  createEffect(() => {
    const currentPath = location();
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });

  createEffect(() => {
    const th = theme();
    setTheme(th);
    themeButton.element.textContent = th !== 'dark' ? '🌙Dark' : '☀️Light';
    themeButton.element.classList.toggle('btn-outline-light', th === 'dark');
    themeButton.element.classList.toggle('btn-outline-dark', th === 'light');
  });

  return createComponent('nav', {
    className: `navbar navbar-expand-md bg-body-tertiary ${styles.navbarCustom}`,
    children: [
      createComponent('div', {
        className: `container-fluid`,
        children: [
          Link({
            href: '/',
            content:
              '<img src="/assets/images/icon.png" alt="Logo" width="32" height="32" class="d-inline-block align-text-top">',
            className: 'navbar-brand',
          }),
          createComponent('button', {
            className: 'navbar-toggler',
            attributes: {
              type: 'button',
              'data-bs-toggle': 'collapse',
              'data-bs-target': '#navbarSupportedContent',
              'aria-controls': 'navbarSupportedContent',
              'aria-expanded': 'false',
              'aria-label': 'Toggle navigation',
            },
            children: [
              createComponent('span', {
                className: 'navbar-toggler-icon',
              }),
            ],
          }),
          createComponent('div', {
            className: `collapse navbar-collapse ${styles.navLinks}`,
            id: 'navbarSupportedContent',
            children: [
              createComponent('ul', {
                className: 'navbar-nav me-auto mb-2 mb-lg-0',
                children: [
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/',
                        content: 'Home',
                        className: `nav-link ${path === '/' ? 'active' : ''}`,
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/user/username',
                        content: 'Profile',
                        className: `nav-link ${path === '/user/username' ? 'active' : ''}`,
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/leaderboard',
                        content: 'Leaderboard',
                        className: `nav-link ${path === '/leaderboard' ? 'active' : ''}`,
                        attributes: { 'aria-current': 'page' },
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/online-pong-game',
                        content: 'Online Pong Game',
                        className: `nav-link ${path === '/online-pong-game' ? 'active' : ''}`,
                        attributes: { 'aria-current': 'page' },
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/pong-game-3d',
                        content: 'Pong Game 3D',
                        className: `nav-link ${path === '/pong-game-3d' ? 'active' : ''}`,
                        attributes: { 'aria-current': 'page' },
                      }),
                    ],
                  }),
                ],
              }),
              createComponent('div', {
                className: 'd-flex align-items-center',
                children: [
                  themeButton,
                  authButton,
                  // Link({
                  //   href: '/login',
                  //   className: `btn btn-outline-success ${styles.customBtn}`,
                  //   attributes: { type: 'button', role: 'button' },
                  //   content: 'Login',
                  // }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
