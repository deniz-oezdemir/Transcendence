import { createComponent, Link } from '@component';
import { createSignal, createEffect, createMemo } from '@reactivity';
import { setTheme, getPreferredTheme } from '@themeManager';
import { isAuthenticated, login, logout } from '../../auth.js';

export default function Navbar({ location, navigate }) {
  const path = location();

  const [theme, setThemeState] = createSignal(getPreferredTheme());

  const toggleTheme = () => {
    const newTheme = theme() === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
  };

  // Handle the login/logout button
  const handleAuthButtonClick = () => {
    if (isAuthenticated()) {
      try {
        logout();
        setTimeout(() => {
          window.router.navigate('/login');
        }, 1000);
      } catch (error) {
        console.error('Error logging out:', error);
        navigate('/profile');
      }
    } else {
      navigate('/login'); // Redirect to login page if not authenticated
    }
  };

  const themeButton = createComponent('button', {
    className: 'btn btn-outline-light me-2',
    attributes: { type: 'button' },
    content: theme() !== 'dark' ? '🌙 Dark' : '☀️ Light',
    events: {
      click: toggleTheme,
    },
  });

  const authButton = createComponent('button', {
    className: 'btn btn-outline-success',
    attributes: { type: 'button', role: 'button' },
    content: isAuthenticated() ? 'Logout' : 'Login', // Conditional content
    events: {
      click: handleAuthButtonClick, // Handle click event
    },
  });

  createEffect(() => {
    authButton.element.textContent = isAuthenticated() ? 'Logout' : 'Login';
  });

  createEffect(() => {
    const th = theme();
    setTheme(th);
    themeButton.element.textContent = th !== 'dark' ? '🌙 Dark' : '☀️ Light';
    themeButton.element.classList.toggle('btn-outline-light', th === 'dark');
    themeButton.element.classList.toggle('btn-outline-dark', th === 'light');
  });
  
  // // Using createMemo to update nav links based on authentication state
  // const navLinks = createMemo(() => {
  //   const links = [
  //     createComponent('li', {
  //       className: 'nav-item',
  //       children: [
  //         Link({
  //           href: '/pong-game',
  //           content: 'Pong Game',
  //           className: `nav-link ${path === '/pong-game' ? 'active' : ''}`,
  //         }),
  //       ],
  //     }),
  //   ];

  //   // Only show these links if authenticated
  //   if (isAuthenticated()) {
  //     links.push(
  //       createComponent('li', {
  //         className: 'nav-item',
  //         children: [
  //           Link({
  //             href: '/user/username',
  //             content: 'Profile',
  //             className: `nav-link ${path === '/user/username' ? 'active' : ''}`,
  //           }),
  //         ],
  //       }),
  //       createComponent('li', {
  //         className: 'nav-item',
  //         children: [
  //           Link({
  //             href: '/online-pong-game',
  //             content: 'Online Pong Game',
  //             className: `nav-link ${path === '/online-pong-game' ? 'active' : ''}`,
  //           }),
  //         ],
  //       }),
  //       createComponent('li', {
  //         className: 'nav-item',
  //         children: [
  //           Link({
  //             href: '/stats',
  //             content: 'Stats',
  //             className: `nav-link ${path === '/stats' ? 'active' : ''}`,
  //           }),
  //         ],
  //       }),
  //     );
  //   }

  //   // Conditionally render Admin link based on authentication
  //   if (isAuthenticated() && isAdmin()) { // Assuming `isAdmin()` is a function that checks if the user is an admin
  //     links.push(
  //       createComponent('li', {
  //         className: 'nav-item',
  //         children: [
  //           Link({
  //             href: '/admin',
  //             content: 'Admin',
  //             className: `nav-link ${path === '/admin' ? 'active' : ''}`,
  //           }),
  //         ],
  //       })
  //     );
  //   }

  //   return links;
  // });

  return createComponent('nav', {
    className: 'navbar navbar-expand-lg bg-body-tertiary',
    children: [
      createComponent('div', {
        className: 'container-fluid',
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
            className: 'collapse navbar-collapse',
            id: 'navbarSupportedContent',
            children: [
              // createComponent('ul', {
              //   className: 'navbar-nav me-auto mb-2 mb-lg-0',
              //   children: navLinks() || [],
              // }),
              createComponent('ul', {
                className: 'navbar-nav me-auto mb-2 mb-lg-0',
                children: [
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
                        href: '/pong-game',
                        content: 'Pong Game',
                        className: `nav-link ${path === '/pong-game' ? 'active' : ''}`,
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
                        href: '/admin',
                        content: 'Admin',
                        className: `nav-link ${path === '/admin' ? 'active' : ''}`,
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
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
