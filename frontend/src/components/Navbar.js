import { createComponent, Link } from '@components';
// import styles from './Navbar.module.css';

// export default function Navbar() {
//   return createComponent('nav', {
//     className: 'navbar',
//     children: [
//       Link({ href: '/', content: 'Home' }),
//       Link({ href: '/about', content: 'About' }),
//       Link({ href: '/admin', content: 'Admin' }),
//       Link({ href: '/pong-game', content: 'Pong Game' }),
//     ],
//   });
// }

export default function Navbar() {
  return createComponent('nav', {
    className: 'navbar navbar-expand-lg bg-body-tertiary',
    children: [
      createComponent('div', {
        className: 'container-fluid',
        children: [
          Link({
            href: '/',
            content: 'Home',
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
              createComponent('ul', {
                className: 'navbar-nav me-auto mb-2 mb-lg-0',
                children: [
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/about',
                        content: 'About',
                        className: 'nav-link',
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      Link({
                        href: '/admin',
                        content: 'Admin',
                        className: 'nav-link active',
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
                        className: 'nav-link active',
                        attributes: { 'aria-current': 'page' },
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item dropdown',
                    content: `
											<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
												Dropdown
											</a>
										`,
                    children: [
                      createComponent('ul', {
                        className: 'dropdown-menu',
                        children: [
                          createComponent('li', {
                            children: [
                              Link({
                                href: '/admin',
                                content: 'Action',
                                className: 'dropdown-item',
                              }),
                            ],
                          }),
                          createComponent('li', {
                            children: [
                              Link({
                                href: '#',
                                content: 'Another action',
                                className: 'dropdown-item',
                              }),
                            ],
                          }),
                          createComponent('li', {
                            children: [
                              createComponent('hr', {
                                className: 'dropdown-divider',
                              }),
                            ],
                          }),
                          createComponent('li', {
                            children: [
                              Link({
                                href: '#',
                                content: 'Something else here',
                                className: 'dropdown-item',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  createComponent('li', {
                    className: 'nav-item',
                    children: [
                      createComponent('a', {
                        className: 'nav-link disabled',
                        content: 'Disabled',
                        attributes: { 'aria-disabled': 'true' },
                      }),
                    ],
                  }),
                ],
              }),
              createComponent('form', {
                className: 'd-flex',
                attributes: { role: 'search' },
                children: [
                  createComponent('input', {
                    className: 'form-control me-2',
                    attributes: {
                      type: 'search',
                      placeholder: 'Search',
                      'aria-label': 'Search',
                    },
                  }),
                  createComponent('button', {
                    className: 'btn btn-outline-success',
                    attributes: { type: 'submit' },
                    content: 'Search',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// <nav class="navbar navbar-expand-lg bg-body-tertiary">
//   <div class="container-fluid">
//     <a class="navbar-brand" href="#">Navbar</a>
//     <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
//       <span class="navbar-toggler-icon"></span>
//     </button>
//     <div class="collapse navbar-collapse" id="navbarSupportedContent">
//       <ul class="navbar-nav me-auto mb-2 mb-lg-0">
//         <li class="nav-item">
//           <a class="nav-link active" aria-current="page" href="#">Home</a>
//         </li>
//         <li class="nav-item">
//           <a class="nav-link" href="#">Link</a>
//         </li>
//         <li class="nav-item dropdown">
//           <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
//             Dropdown
//           </a>
//           <ul class="dropdown-menu">
//             <li><a class="dropdown-item" href="#">Action</a></li>
//             <li><a class="dropdown-item" href="#">Another action</a></li>
//             <li><hr class="dropdown-divider"></li>
//             <li><a class="dropdown-item" href="#">Something else here</a></li>
//           </ul>
//         </li>
//         <li class="nav-item">
//           <a class="nav-link disabled" aria-disabled="true">Disabled</a>
//         </li>
//       </ul>
//       <form class="d-flex" role="search">
//         <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
//         <button class="btn btn-outline-success" type="submit">Search</button>
//       </form>
//     </div>
//   </div>
// </nav>
