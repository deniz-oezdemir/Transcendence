import {
  createComponent,
  LayoutContent,
  createCleanupContext,
} from '@componentSystem';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function AppLayout(context) {
  createCleanupContext();

  return createComponent('div', {
    className: 'general-layout',
    children: [
      Navbar(context),
      createComponent('div', {
        className: 'container',
        children: [LayoutContent()],
      }),
      Footer(),
    ],
  });
}
