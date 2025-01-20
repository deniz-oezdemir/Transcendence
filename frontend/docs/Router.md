# Documentation for `router.js`

This file implements a lightweight client-side router inspired by modern frameworks. It provides a robust mechanism for managing routes, rendering layouts and components, handling middleware, and processing navigation events. Below is an in-depth explanation of its functionality.

---

## Core Class: `Router`

### Overview

The `Router` class is responsible for:

- Matching URLs to routes.
- Rendering layouts and components.
- Executing middleware for navigation.
- Handling errors gracefully.

### Constructor

#### `new Router(options)`

Initializes the router.

- **Parameters**:
  - `routes` (array): An array of route definitions.
    - Each route should include:
      - `path` (string): The URL path.
      - `component` (function): The component to render for this route.
      - `layoutComponent` (optional function): Nested layout for the route.
  - `rootElement` (HTMLElement): The root container for rendering components.
  - `layoutComponent` (optional function): The general layout component for all routes.
  - `middlewares` (optional array): Functions to execute before navigating to a route.
  - `errorComponent` (optional function): A component to render in case of errors.

---

## Router Methods

### `matchRoute(path)`

Matches the given path to a route and extracts parameters.

- **Parameters**:

  - `path` (string): The URL path to match.

- **Returns**:
  - An object containing the `route` and `params`, or `null` if no match is found.

---

### `render()`

Renders the current route based on the URL path.

- **Process**:
  1. Matches the path to a route using `matchRoute`.
  2. Executes middleware for navigation.
  3. Updates layouts, nested layouts, and route components.
  4. Handles 404 errors if no route is matched.

---

### `renderError(error)`

Renders the error component for a given error.

- **Parameters**:

  - `error` (object): Contains `code`, `message`, and optional `stack`.

- **Default Behavior**:
  If no custom `errorComponent` is provided, it uses a fallback component.

---

### `createFallbackErrorComponent(context)`

Creates a default error component for fallback cases.

- **Parameters**:
  - `context` (object): Contains `code` (number) and `message` (string).

---

### `navigate(path, options)`

Navigates to a new route programmatically.

- **Parameters**:

  - `path` (string): The target URL path.
  - `options` (object): Contains:
    - `replace` (boolean): Whether to replace the current history state.

- **Middleware Execution**:
  Executes all middleware before navigation. If any middleware returns `false`, navigation is canceled.

---

### `handlePopState()`

Handles browser back/forward navigation by updating the current path.

---

### `parseQueryString(queryString)`

Parses a query string into an object.

- **Parameters**:

  - `queryString` (string): The query string part of a URL.

- **Returns**:
  - An object where keys are parameter names and values are their corresponding values.

---

### `executeMiddlewares(path, context)`

Executes middleware functions before navigating to a route.

- **Parameters**:

  - `path` (string): The target URL path.
  - `context` (object): Contains information about the current and next paths.

- **Returns**:
  - A boolean indicating whether navigation should proceed.

---

## Example Usage

### Defining Routes

```javascript
const routes = [
  {
    path: '/',
    component: (context) => createComponent('div', { content: 'Home Page' }),
  },
  {
    path: '/about',
    component: (context) => createComponent('div', { content: 'About Us' }),
  },
  {
    path: '/user/:id',
    component: (context) =>
      createComponent('div', { content: `User ID: ${context.params.id}` }),
  },
];
```

---

### Initializing the Router

```javascript
const router = new Router({
  routes,
  rootElement: document.getElementById('app'),
  layoutComponent: (context) => createComponent('div', { className: 'layout' }),
  errorComponent: ({ code, message }) =>
    createComponent('div', { content: `<h1>${code}</h1><p>${message}</p>` }),
});
```

---

### Navigating Programmatically

```javascript
router.navigate('/about');
```

---

### Adding Middleware

```javascript
const authMiddleware = async (path, context) => {
  if (path === '/protected' && !context.user.isAuthenticated) {
    alert('You must log in to access this page.');
    return false;
  }
  return true;
};

const routerWithMiddleware = new Router({
  routes,
  rootElement: document.getElementById('app'),
  middlewares: [authMiddleware],
});
```

---

## Lifecycle Management

### General Layout

The `layoutComponent` is rendered once and reused across route changes, reducing re-rendering overhead.

### Nested Layouts

Each route can define a `layoutComponent` for nested layouts, enabling modular layout composition.

### Cleanup

The router ensures proper cleanup of previous components, layouts, and event listeners to prevent memory leaks.

---

## Error Handling

Custom error components or the default fallback component can be used to display user-friendly error messages during navigation failures or 404s.

---

## Features

- **Dynamic Route Matching**: Supports parameterized routes like `/user/:id`.
- **Middleware Support**: Allows pre-navigation checks and transformations.
- **Reactive Rendering**: Automatically updates UI on navigation.
- **Error Handling**: Graceful fallback for unexpected errors or unmatched routes.
- **Modular Layouts**: General and nested layouts for flexible UI composition.
