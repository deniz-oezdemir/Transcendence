import { createComponent } from '@components';

export default function errorComponent({ code, message, stack }) {
  return createComponent('div', {
    className: 'error-page',
    content: `
      <h1>Error ${code}</h1>
      <p>${message}</p>
      ${stack ? `<pre>${stack}</pre>` : ''}
    `,
  });
}
