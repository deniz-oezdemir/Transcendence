// Basic Signal System
export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  // Getter function to access the value
  const signal = () => value;

  // Setter function to update the value and notify subscribers
  const setSignal = (newValue) => {
    if (value !== newValue) {
      value = newValue;
      subscribers.forEach((fn) => fn(value));
    }
  };

  // Subscribe to changes in the signal
  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn); // Return an unsubscribe function
  };

  return [signal, setSignal, subscribe];
}
