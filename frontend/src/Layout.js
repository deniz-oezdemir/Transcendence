import {
  createComponent,
  LayoutContent,
  createCleanupContext,
} from '@componentSystem';
import Navbar from './components/Navbar';

export default function AppLayout(context) {
  createCleanupContext();

  return createComponent('div', {
    className: 'general-layout',
    children: [
      Navbar(context),
      LayoutContent(),
      createComponent('footer', { className: 'footer', content: 'Footer' }),
    ],
  });
}
