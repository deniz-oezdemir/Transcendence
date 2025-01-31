# ReactivitySystem.js Documentation

## Overview

This file provides a lightweight reactivity system inspired by the **Signals pattern**, similar to the implementation in frameworks like **Solid.js**. Signals are a functional and declarative way to manage state and reactivity in JavaScript applications.

## What Are Signals?

Signals are a primitive for managing state that automatically tracks dependencies and propagates changes. Unlike other state management patterns, signals focus on efficiency and simplicity by:

- Avoiding redundant re-computation.
- Automatically tracking dependencies during execution.
- Triggering updates only when their value changes.

## Functions in ReactivitySystem.js

### `createSignal(initialValue)`

Creates a signal with a specified initial value.

#### Parameters

- `initialValue` (_any_): The initial value of the signal.

#### Returns

- An array containing:
  1. `read` (_Function_): A getter function to retrieve the current value.
  2. `write` (_Function_): A setter function to update the value.

#### Example

```javascript
const [count, setCount] = createSignal(0);
console.log(count()); // 0
setCount(1);
console.log(count()); // 1
```

### How It Works

1. **Read function**: Tracks dependencies if an observer exists in the context.
2. **Write function**: Updates the value and notifies subscribers if the value changes.

---

### `createEffect(fn)`

Creates a reactive effect that automatically re-executes when any of its dependencies change.

#### Parameters

- `fn` (_Function_): The effect function to execute.

#### Example

```javascript
const [count, setCount] = createSignal(0);
createEffect(() => {
  console.log(`Count is: ${count()}`);
});

setCount(1); // Logs: Count is: 1
```

### How It Works

1. Cleans up existing dependencies.
2. Executes the function while tracking new dependencies.
3. Re-runs whenever a dependency changes.

---

### `untrack(fn)`

Stops the reactive system from tracking dependencies within the provided function.

#### Parameters

- `fn` (_Function_): A function whose execution should not trigger dependency tracking.

#### Returns

- The result of the executed function.

#### Example

```javascript
const [count, setCount] = createSignal(0);
untrack(() => {
  console.log(count()); // Access without tracking
});
```

---

### `createMemo(fn)`

Creates a memoized signal that updates whenever its dependencies change.

#### Parameters

- `fn` (_Function_): A function that computes the memoized value.

#### Returns

- A signal (_Function_) that provides the memoized value.

#### Example

```javascript
const [a, setA] = createSignal(2);
const [b, setB] = createSignal(3);
const sum = createMemo(() => a() + b());

console.log(sum()); // 5
setA(4);
console.log(sum()); // 7
```

### How It Works

1. Uses `createSignal` internally to store the memoized value.
2. Relies on `createEffect` to re-calculate the value when dependencies change.

---

### Internal Helpers

#### `cleanup(observer)`

Removes all dependencies associated with an observer.

#### `subscribe(observer, subscriptions)`

Adds an observer to a set of subscriptions and tracks dependencies.

---

## Key Concepts

### Dependency Tracking

The system tracks dependencies when signals are read during the execution of `createEffect` or `createMemo`. This ensures updates are propagated efficiently.

### Automatic Cleanup

Observers automatically clean up their dependencies before re-execution, preventing memory leaks and ensuring accurate tracking.

### Efficiency

The system avoids unnecessary updates by comparing old and new values when signals are written.

---

## Comparison with Solid.js

This implementation is directly inspired by Solid.js’s fine-grained reactivity model:

- Signals act as both state holders and dependency trackers.
- Effects and memos automatically re-compute only when dependencies change.
- Minimal overhead, suitable for performance-critical applications.

While simplified, this implementation captures the essence of Solid.js’s reactivity system and can be expanded further for more advanced use cases.

---

## Usage Tips

- Use `createSignal` for managing simple state.
- Use `createEffect` for side effects that depend on reactive state.
- Use `createMemo` for computed values derived from other signals.
- Use `untrack` to prevent dependency tracking when necessary.

---
