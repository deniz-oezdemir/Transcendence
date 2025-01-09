import { createComponent, LayoutContent } from '@components';
import Navbar from './components/Navbar';

export default function AppLayout() {
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
