import {
  createComponent,
  LayoutContent,
  createCleanupContext,
} from '@component';

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

export default function AppLayout(context) {
  createCleanupContext();

  return createComponent('div', {
    className: 'general-layout',
    children: [
      Navbar(context),
      createComponent('div', {
        className: 'container',
        children: [LayoutContent()],
        attributes: { style: 'flex-grow: 1;' },
      }),
      Footer(),
    ],
    attributes: {
      style:
        'display: flex; flex-direction: column; width: 100vw; height: 100vh;',
    },
  });
}
