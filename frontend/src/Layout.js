import { createComponent, LayoutContent } from '@componentSystem';
import Navbar from './components/Navbar';

export default function AppLayout(context) {
  const layout = createComponent('div', {
    className: 'general-layout',
    children: [
      Navbar(context),
      LayoutContent(),
      createComponent('footer', { className: 'footer', content: 'Footer' }),
    ],
  });

  return layout;
}
