import { createComponent, Link } from '@components';

export default function HomePage() {
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
