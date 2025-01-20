import { createComponent } from '@component';

export default function ErrorPage({ code, message, stack }) {
  return createComponent('div', {
    className: 'error-page',
    content: `
      <h1>Error ${code}</h1>
      <p>${message}</p>
      ${stack ? `<pre>${stack}</pre>` : ''}
    `,
  });
}
