let context = [];

export function untrack(fn) {
  const prevContext = context;
  context = [];
  const res = fn();
  context = prevContext;
  return res;
}

function cleanup(observer) {
  for (const dep of observer.dependencies) {
    dep.delete(observer);
  }
  observer.dependencies.clear();
}

function subscribe(observer, subscriptions) {
  subscriptions.add(observer);
  observer.dependencies.add(subscriptions);
}

export function createSignal(initialValue) {
  let value = initialValue;
  const subscriptions = new Set();

  const read = () => {
    const observer = context[context.length - 1];
    if (observer) subscribe(observer, subscriptions);
    return value;
  };

  const write = (newValue) => {
    if (value !== newValue) {
      value = newValue;
      for (const observer of [...subscriptions]) {
        observer.execute();
      }
    }
  };

  return [read, write];
}

export function createEffect(fn) {
  const effect = {
    execute() {
      cleanup(effect);
      context.push(effect);
      try {
        fn();
      } catch (error) {
        console.error('Error inside createEffect:', error);
      }
      context.pop();
    },
    dependencies: new Set(),
  };

  effect.execute();
}

export function createMemo(fn) {
  const [signal, setSignal] = createSignal();
  createEffect(() => {
    try {
      setSignal(fn());
    } catch (error) {
      console.error('Error inside createMemo:', error);
    }
  });
  return signal;
}
