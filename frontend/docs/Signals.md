# `createSignal` Function Documentation

## Overview

The `createSignal` function provides a basic reactive signal system that allows you to create reactive state in your application. It follows the observer pattern to notify subscribers whenever the value changes. This system is similar to how modern frontend frameworks handle reactivity(Solid js).

## Function Signature

```js
createSignal(initialValue);
```

## Parameters

- **`initialValue`** _(any type)_: The initial value of the signal. This value will be accessible through the getter function returned by `createSignal`.

## Returns

The function returns an array containing:

1. **`signal`** _(getter function)_: A function that returns the current value of the signal.
2. **`setSignal`** _(setter function)_: A function that allows you to update the signal's value and notify all subscribed functions.
3. **`subscribe`** _(subscribe function)_: A function to add subscribers that will be notified when the signal changes.

### Example of the return value structure

```js
const [signal, setSignal, subscribe] = createSignal(initialValue);
```

## Usage Examples

### 1. Creating a Simple Signal

```js
const [count, setCount, subscribe] = createSignal(0);

// Access the signal value
console.log(count()); // Output: 0

// Update the signal value
setCount(5);
console.log(count()); // Output: 5
```

### 2. Subscribing to a Signal

```js
const [count, setCount, subscribe] = createSignal(0);

// Subscribe to signal changes
const unsubscribe = subscribe(() => {
  console.log(`The count is now: ${count()}`);
});

// Trigger a value change
setCount(1); // Output: The count is now: 1
setCount(2); // Output: The count is now: 2

// Unsubscribe from the signal
unsubscribe();
setCount(3); // No output (no subscribers)
```

### 3. Using Signals for Reactive Updates

```js
const [temperature, setTemperature, subscribe] = createSignal(25);

// Subscribe to signal changes to update UI (e.g., temperature display)
subscribe(() => {
  const temp = temperature();
  document.getElementById('tempDisplay').innerText = `Temperature: ${temp}°C`;
});

// Update the signal and trigger UI update
setTemperature(30);
```

## Explanation

- **`signal`**: A getter function that provides access to the current value of the signal. You can call this function to get the latest value.
- **`setSignal`**: A setter function that updates the signal's value. When the value is changed, all subscribers are notified, and their respective callback functions are called.

- **`subscribe`**: This function allows you to add a subscriber (callback function) that will be executed every time the signal's value is updated. The subscriber function is invoked whenever you call `setSignal`. You can also unsubscribe from the signal by calling the returned function from `subscribe()`.

## Advantages

- **Reactivity**: Automatically updates subscribers whenever the signal's value changes, making it easy to manage dynamic data.
- **Encapsulation**: The signal's value is private to the `createSignal` function, and the only way to modify or access it is via the getter and setter functions.
- **Composability**: Signals can be used independently or in combination with other reactive systems to create complex UIs or logic.
