import { createComponent } from '@component';
import { createSignal, createEffect } from '@reactivity';

export class Router {
  constructor({
    routes,
    rootElement,
    layoutComponent = null,
    middlewares = [],
    errorComponent = null,
  }) {
    this.routes = routes;
    this.rootElement = rootElement;
    this.middlewares = middlewares;
    this.currentRoute = null;
    this.middlewareCache = new Map();
    this.errorComponent = errorComponent || this.createFallbackErrorComponent;
    this.layoutComponent = layoutComponent;
    this.currentLayout = null;
    this.currentNestedLayout = null;
    this.contentContainer = null;
    this.currentComponent = null;

    // Handle signals for tracking current Path
    const [location, setLocation] = createSignal(window.location.pathname);
    this.location = location;
    this.setLocation = setLocation;

    // Render on location change
    createEffect(() => {
      this.render();
    });

    // Bind methods
    this.navigate = this.navigate.bind(this);
    this.handlePopState = this.handlePopState.bind(this);

    // Initialize router
    window.addEventListener('popstate', this.handlePopState);
    this.render();
  }

  // Match the current path to a route and extract parameters
  matchRoute(path) {
    for (const route of this.routes) {
      const paramNames = [];
      const regexPath = route.path.replace(/:([^/]+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      });

      const regex = new RegExp(`^${regexPath}(?:/)?$`);
      const match = path.match(regex);

      if (match) {
        const params = paramNames.reduce((acc, name, index) => {
          acc[name] = match[index + 1];
          return acc;
        }, {});
        return { route, params };
      }
    }
    return null;
  }

  // Render the current route
  render() {
    const path = this.location();

    if (path === this.currentRoute?.path) {
      return;
    }

    try {
      const matched = this.matchRoute(path);
      if (matched) {
        const { route, params } = matched;

        const queryString = window.location.search;
        const queryParams = this.parseQueryString(queryString);

        // console.log('Params:', params);
        // console.log('Query Params:', queryParams);

        const context = {
          params,
          query: queryParams,
          path,
          navigate: this.navigate.bind(this),
          location: this.location,
        };

        // Render general layoutComponent if not already rendered
        if (
          this.layoutComponent &&
          this.currentLayout !== this.layoutComponent
        ) {
          this.currentLayout = this.layoutComponent;
          const layoutComponent = this.layoutComponent(context);
          this.rootElement.replaceChildren(layoutComponent.element);
          this.contentContainer =
            layoutComponent.element.querySelector('.route-content');
        }

        // Handle nested layout changes
        const newNestedLayout = route.layoutComponent || null;
        // Clean up previous nested layout if it's no longer needed
        if (
          this.currentNestedLayout &&
          this.currentNestedLayout !== newNestedLayout
        ) {
          const nestedLayoutElement =
            this.contentContainer?.querySelector('.nested-content');
          if (nestedLayoutElement) {
            nestedLayoutElement.remove(); // Remove the previous nested layout
          }
          this.currentNestedLayout = null;
          this.contentContainer =
            this.rootElement.querySelector('.route-content');
        }

        // Render new nested layout if applicable
        if (newNestedLayout && this.currentNestedLayout !== newNestedLayout) {
          this.currentNestedLayout = newNestedLayout;
          const nestedLayoutElement = newNestedLayout(context);
          if (this.contentContainer) {
            this.contentContainer.replaceChildren(nestedLayoutElement.element);
            this.contentContainer =
              nestedLayoutElement.element.querySelector('.nested-content') ||
              this.contentContainer;
          }
        }

        // Render the route component
        const newComponent = route.component(context);

        if (!this.currentComponent?.element.isEqualNode(newComponent.element)) {
          if (
            this.currentComponent &&
            typeof this.currentComponent.cleanup === 'function'
          ) {
            this.currentComponent.cleanup();
          }

          if (this.contentContainer) {
            this.contentContainer.replaceChildren(newComponent.element);
          } else {
            this.rootElement.replaceChildren(newComponent.element);
          }
          this.currentComponent = newComponent;
        }
        this.currentRoute = route;
      } else {
        // Handle 404 Not Found
        throw { code: 404, message: 'Page Not Found' };
      }
    } catch (error) {
      this.renderError(error);
    }
  }

  renderError(error) {
    console.error('Render error:', error); // Log the error for debugging

    const errorContext = {
      code: error.code || 500,
      message: error.message || 'An unexpected error occurred.',
      stack: error.stack || null,
    };

    const newComponent = this.errorComponent(errorContext);
    if (this.contentContainer) {
      this.contentContainer.replaceChildren(newComponent.element);
    } else {
      this.rootElement.replaceChildren(newComponent.element);
    }
  }

  createFallbackErrorComponent({ code, message }) {
    return createComponent('div', {
      className: 'error',
      content: `
        <h1>Error ${code}</h1>
        <p>${message}</p>
      `,
    });
  }
  // Parse query strings into an object
  parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Execute middleware functions
  async executeMiddlewares(path, context) {
    // if (this.middlewareCache.has(path)) {
    //   return this.middlewareCache.get(path);
    // }

    const results = await Promise.all(
      this.middlewares.map((middleware) => middleware(path, context))
    );
    const proceed = results.every((result) => result !== false);

    // this.middlewareCache.set(path, proceed);
    return proceed;
  }

  // Navigate to a new route
  async navigate(path, { replace = false } = {}) {
    if (path === window.location.pathname) {
      return; // Prevent navigating to the same path
    }

    const context = { currentPath: window.location.pathname, nextPath: path };
    const proceed = await this.executeMiddlewares(path, context);
    if (!proceed) {
      // console.log('Middleware blocked navigation');
      // history.pushState(null, '', '/login');
      return;
    }

    if (replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }

    this.setLocation(path);
  }

  // Handle browser back/forward buttons
  handlePopState() {
    this.setLocation(window.location.pathname);
  }
}
