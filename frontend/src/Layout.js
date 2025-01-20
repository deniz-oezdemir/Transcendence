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
      }),
      Footer(),
    ],
  });
}
