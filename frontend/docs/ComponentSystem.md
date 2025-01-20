````markdown
# Documentation for `componentSystem.js`

This file provides a minimalistic framework for building and managing UI components in a reactive manner. It offers tools for creating DOM elements, managing attributes, event listeners, and lifecycle cleanups, inspired by modern SPA frameworks. Below is an explanation of the key concepts and functions.

---

## Core Functions

### `createComponent(tag, options)`

Creates a custom DOM element with specified attributes, events, content, and children.

- **Parameters**:

  - `tag` (string): The HTML tag name (e.g., `div`, `span`).
  - `options` (object): An object containing the following:
    - `className` (string): CSS class names for the element.
    - `content` (string | function): Static content or a reactive function that dynamically updates the content.
    - `children` (array): An array of child components.
    - `id` (string): The `id` of the element.
    - `attributes` (object): Key-value pairs for element attributes.
    - `events` (object): Event listeners with event names as keys and handler functions as values.
    - `cleanup` (function): A function to clean up resources when the component is destroyed.

- **Returns**:

  - An object containing:
    - `element`: The DOM element.
    - `cleanup`: A cleanup function (if provided).

- **Example**:
  ```javascript
  createComponent('button', {
    className: 'btn-primary',
    content: 'Click Me',
    events: { click: () => alert('Button clicked!') },
  });
  ```
````

---

### `Link(options)`

Creates an `<a>` tag with navigation logic.

- **Parameters**:

  - `options` (object): Contains the following:
    - `href` (string): The URL to navigate to.
    - `content` (string): The link text.
    - `className` (string): CSS class names for styling.
    - `events` (object): Additional event listeners.

- **Features**:

  - Prevents default navigation behavior.
  - Integrates with a global `router` object for client-side navigation.

- **Example**:

  ```javascript
  Link({ href: '/about', content: 'About Us', className: 'nav-link' });
  ```

---

### `LayoutContent()`

Creates a `<div>` for rendering route content.

- **Usage**:
  Used as a placeholder for route-specific content within layouts.

- **Example**:

  ```javascript
  LayoutContent(); // Creates a <div class="route-content">
  ```

---

### `NestedLayoutContent()`

Creates a `<div>` for nested route content.

- **Usage**:
  Useful for rendering nested routes within a layout.

- **Example**:

  ```javascript
  NestedLayoutContent(); // Creates a <div class="nested-content">
  ```

---

### `createCleanupContext()`

Manages lifecycle cleanups for components by creating a cleanup context. You con use it in main components like pages or layouts to track all the onCleanup functions from this component and its children.

- **Returns**:

  - A `cleanup` function that executes all registered cleanup functions and restores the previous context.

- **Example**:

  ```javascript
  const cleanup = createCleanupContext();
  onCleanup(() => console.log('Component unmounted!'));
  cleanup();
  ```

---

### `onCleanup(fn)`

Registers a cleanup function to run when the component is destroyed.

- **Parameters**:

  - `fn` (function): The cleanup function.

- **Example**:

  ```javascript
  onCleanup(() => {
    element.removeEventListener('click', handleClick);
  });
  ```

---

## Helper Functions

### `setAttributes(element, attributes)`

Applies a set of attributes to a DOM element.

- **Parameters**:

  - `element` (HTMLElement): The target element.
  - `attributes` (object): Key-value pairs of attributes.

- **Example**:

  ```javascript
  setAttributes(button, { type: 'button', 'aria-label': 'Submit' });
  ```

---

### `setEvents(element, events)`

Adds event listeners to a DOM element and registers them for cleanup.

- **Parameters**:

  - `element` (HTMLElement): The target element.
  - `events` (object): Event listeners with event types as keys.

- **Example**:

  ```javascript
  setEvents(button, { click: () => alert('Clicked!') });
  ```

---

### `setChildren(element, children)`

Appends child components to a parent element.

- **Parameters**:

  - `element` (HTMLElement): The parent element.
  - `children` (array): An array of child components.

- **Example**:

  ```javascript
  setChildren(div, [child1, child2]);
  ```

---

### `validateTag(tag)`

Validates the provided tag name to ensure it is a valid HTML element.

- **Parameters**:

  - `tag` (string): The tag name.

- **Throws**:
  - An error if the tag name is invalid.

---

## Lifecycle and Cleanup Management

### Cleanup Context

The `createCleanupContext` function ensures that resources like event listeners and intervals are cleaned up when components are destroyed. This helps prevent memory leaks.

- Use `onCleanup` within `createComponent` to register cleanup tasks.
- The `cleanup` function executes all registered tasks.

---

## Reactive Features

This system integrates with `createEffect` from the `reactivitySystem.js` module to manage reactive updates, allowing dynamic content updates in components without manual DOM manipulation.

---

### Notes on Design

- This system is inspired by Solid.js, focusing on minimalism and reactivity.
- It emphasizes lightweight components and efficient DOM updates.

### Use Cases

- Building reactive UI components.
- Managing component lifecycle and cleanup effectively.
- Integrating with a custom routing system for navigation.

---
