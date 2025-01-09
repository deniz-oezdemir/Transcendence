import { createComponent, Link } from '@components';

export default function Navbar() {
  return createComponent('nav', {
    className: 'navbar',
    children: [
      Link({ href: '/', content: 'Home' }),
      Link({ href: '/about', content: 'About' }),
      Link({ href: '/admin', content: 'Admin' }),
      Link({ href: '/pong-game', content: 'Pong Game' }),
    ],
  });
}
