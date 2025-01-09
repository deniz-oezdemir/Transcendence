import createSignal from '../signals/createSignal';

export function Score() {
  const [score, setScore] = createSignal(0);

  const element = document.createElement('div');
  element.className = 'score';
  element.innerHTML = `
    <p>Score: <span id="score">${score()}</span></p>
  `;

  // setScore(newScore);

  return element;
}
