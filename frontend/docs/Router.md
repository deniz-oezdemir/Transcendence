# Router Class

The `Router` class is a lightweight and versatile client-side routing system designed for single-page applications (SPAs). It provides features such as dynamic route matching, middleware support, and centralized error handling.

## Constructor

### `Router(options)`

#### Parameters

- **`routes`**: `Array` (required)

  - An array of route objects. Each route object must have the following structure:

    ```javascript
    {
      path: '/example/:id', // Route path with optional parameters
      component: (context) => HTMLElement // Function that returns an HTML element
    }
    ```

- **`rootElement`**: `HTMLElement` (required)

  - The root DOM element where the matched component will be rendered.

- **`middlewares`**: `Array` (optional, default: `[]`)

  - An array of middleware functions to execute before navigating to a new route.
  - Each middleware function receives the following arguments:
    - `path`: `string` - The target path.
    - `context`: `object` - Additional context (e.g., `currentPath`, `nextPath`).
  - Middleware functions should return `false` to block navigation or any other value to allow it.

- **`errorComponent`**: `Function` (optional, default: `null`)
  - A function that renders a custom error component when an error occurs.
  - The function receives the following arguments:
    - `code`: `number` - The error code (e.g., `404`, `500`).
    - `message`: `string` - The error message.
    - `stack`: `string` (optional) - The stack trace (if available).

### Example

```javascript
const routes = [
  {
    path: '/',
    component: () =>
      document
        .createElement('div')
        .appendChild(document.createTextNode('Home Page')),
  },
  {
    path: '/about',
    component: () =>
      document
        .createElement('div')
        .appendChild(document.createTextNode('About Page')),
  },
];

const router = new Router({
  routes,
  rootElement: document.getElementById('app'),
  errorComponent: ({ code, message }) => {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `<h1>Error ${code}</h1><p>${message}</p>`;
    return errorDiv;
  },
});
```

---

## Methods

### `matchRoute(path)`

Matches the given `path` against the defined routes and extracts route parameters.

#### Parameters

- **`path`**: `string` - The URL path to match.

#### Returns

- `object | null`

  - If matched:

    ```javascript
    {
      route: { path: '/example/:id', component: Function },
      params: { id: 'value' },
    }
    ```

  - If no match, returns `null`.

---

### `render()`

Renders the current route based on the `window.location.pathname`.

- If a matching route is found, its component is rendered.
- If no match is found, a 404 error is thrown and handled by `renderError()`.

---

### `renderError(error)`

Renders an error component when an error occurs during rendering.

#### Parameters

- **`error`**: `object`
  - `code`: `number` (default: `500`) - The error code.
  - `message`: `string` (default: `'An unexpected error occurred.'`) - The error message.
  - `stack`: `string` (optional) - The stack trace (for debugging).

---

### `createFallbackErrorComponent({ code, message })`

Creates a default error component if no `errorComponent` is provided.

#### Parameters

- **`code`**: `number` - The error code.
- **`message`**: `string` - The error message.

#### Returns

- `HTMLElement` - The fallback error component.

---

### `parseQueryString(queryString)`

Parses a query string into an object.

#### Parameters

- **`queryString`**: `string` - The query string from the URL.

#### Returns

- `object` - Key-value pairs of the parsed query string.

#### Example

```javascript
const query = router.parseQueryString('?id=123&name=John');
console.log(query); // { id: '123', name: 'John' }
```

---

### `executeMiddlewares(path, context)`

Executes all middleware functions in sequence.

#### Parameters

- **`path`**: `string` - The target path.
- **`context`**: `object` - Additional context for middlewares.

#### Returns

- `Promise<boolean>` - Resolves to `false` if any middleware blocks the navigation, otherwise `true`.

---

### `navigate(path, options)`

Navigates to a new route.

#### Parameters

- **`path`**: `string` - The target path.
- **`options`**: `object` (optional)
  - `replace`: `boolean` (default: `false`) - If `true`, replaces the current history entry instead of adding a new one.

#### Example

```javascript
router.navigate('/about');
router.navigate('/home', { replace: true });
```

---

### `handlePopState()`

Handles browser back/forward navigation by re-rendering the current route.

---

## Error Handling

Errors during rendering or navigation are automatically caught and passed to `renderError()`. Use a custom `errorComponent` to customize error pages based on error codes or messages.

#### Example

```javascript
const ErrorComponent = ({ code, message }) => {
  const div = document.createElement('div');
  div.innerHTML = `<h1>Error ${code}</h1><p>${message}</p>`;
  return div;
};

const router = new Router({
  routes,
  rootElement: document.getElementById('app'),
  errorComponent: ErrorComponent,
});
```
