import createSignal from '../signals/createSignal';

export function Paddle() {
  const [position, setPosition] = createSignal(100); // Posición inicial

  const element = document.createElement('div');
  element.className = 'paddle';
  element.style.top = `${position()}px`;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      setPosition(position() - 10);
    } else if (e.key === 'ArrowDown') {
      setPosition(position() + 10);
    }
  });

  return element;
}
