import styles from './App.module.css';

export function App() {
  const element = document.createElement('div');
  element.className = styles.container;
  element.innerHTML = `<h1 class="${styles.title}">¡Hola, SPA!</h1>`;
  return element;
}
