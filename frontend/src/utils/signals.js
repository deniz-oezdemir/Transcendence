export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const signal = () => {
    return value;
  };

  const setSignal = (newValue) => {
    if (value !== newValue) {
      value = newValue;
      subscribers.forEach((fn) => fn(value));
    }
  };

  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  signal.subscribe = subscribe;

  return [signal, setSignal, subscribe];
}
