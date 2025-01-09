import styles from './App.module.css';
import { createSignal } from '@signals';
import { Router } from '@router';
import { createComponent } from '@components';

// import { Score } from './components/Score';
// import { Paddle } from './components/Paddle';
// import { Ball } from './components/Ball';

// export default function App() {
//   const [count, setCount, subscribe] = createSignal(0);

//   subscribe(() => {
//     console.log(`The count is now: ${count()}`);
//   });

//   const element = document.createElement('div');
//   element.className = styles.container;
//   element.innerHTML = `
//         <h1 class="${styles.title}">¡Hola, SPA!</h1>
//         <button class="${styles.button}" id="increment">Increment</button>
//         <p class="${styles.counter}">Count: <span id="count">${count()}</span></p>
//     `;

//   const incrementButton = element.querySelector('#increment');
//   const countDisplay = element.querySelector('#count');

//   incrementButton.addEventListener('click', () => {
//     setCount(count() + 1);
//     countDisplay.textContent = count();
//   });

//   const gameContainer = document.createElement('div');
//   gameContainer.className = styles.gameContainer;

//   gameContainer.appendChild(Score());
//   gameContainer.appendChild(Paddle());
//   gameContainer.appendChild(Ball());

//   element.appendChild(gameContainer);

//   return element;
// }

const Home = () => createComponent('div', { content: '<h1>Home Page</h1>' });
const About = () => createComponent('div', { content: '<h1>About Page</h1>' });
const Hell = () => {
  throw new Error('This is a test error in the About page.'); // Simulate an error
};
const errorComponent = ({ code, message, stack }) =>
  createComponent('div', {
    className: 'error-page',
    content: `
      <h1>Error ${code}</h1>
      <p>${message}</p>
      ${stack ? `<pre>${stack}</pre>` : ''}
    `,
  });

export default function App() {
  const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/hell', component: Hell },
  ];

  const middlewares = [
    async (path, context) => {
      console.log(`Navigating to ${path}`);
      return true;
    },
  ];

  const rootElement = document.getElementById('app');
  // root.appendChild(App());

  const router = new Router({
    routes,
    rootElement,
    middlewares,
    errorComponent,
  });
  router.render();
}
