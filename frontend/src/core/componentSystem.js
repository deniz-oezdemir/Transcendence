import { createEffect } from '@reactivity';

let cleanupContext = null;
let mountContext = null;

export function onCleanup(fn) {
  if (cleanupContext) {
    cleanupContext.push(fn);
  } else {
    throw new Error('onCleanup must be called during component creation.');
  }
}

export function onMount(fn) {
  if (mountContext) {
    mountContext.push(fn);
  } else {
    throw new Error('onMount must be called during component creation.');
  }
}

function setAttributes(element, attributes) {
  Object.keys(attributes).forEach((key) =>
    element.setAttribute(key, attributes[key])
  );
}

function setEvents(element, events) {
  const listeners = [];
  Object.keys(events).forEach((eventType) => {
    const handler = events[eventType];
    element.addEventListener(eventType, handler);
    listeners.push({ eventType, handler });
  });
  // Register event listeners for cleanup
  onCleanup(() => {
    listeners.forEach(({ eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
  });
}

function setChildren(element, children) {
  children.forEach((child) => {
    // console.log(child);
    element.appendChild(child.element);
  });
}

function validateTag(tag) {
  if (typeof tag !== 'string' || !document.createElement(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  }
}

export function createCleanupContext() {
  const cleanupFns = [];
  const previousContext = cleanupContext; // Save the previous context
  cleanupContext = cleanupFns; // Assign the new context

  const cleanup = () => {
    console.log('cleanup context', cleanupFns);
    cleanupFns.forEach((fn) => {
      console.log('cleaning fn: ', fn);
      fn();
    });
    cleanupFns.length = 0; // Clear the functions
    cleanupContext = previousContext; // Restore the previous context
  };

  return cleanup;
}

export function createMountContext() {
  const mountFns = [];
  const previousMountContext = mountContext;
  mountContext = mountFns;

  return () => {
    mountFns.forEach((fn) => fn());
    mountFns.length = 0;
    mountContext = previousMountContext;
  };
}

/**
 * @param {string} tag - The tag name of the element to create
 * @param {Object} options - An object containing the options for the component
 * @param {string} options.className - The class name of the element
 * @param {string} options.content - The inner HTML content of the element
 * @param {Array} options.children - An array of child components
 * @param {Object} options.attributes - An object containing attributes to set on the element
 * @param {Object} options.events - An object containing event listeners to set on the element
 * @param {Function} options.ref - A function to call with the element as an argument when the component is created
 * @param {Function} options.cleanup - A function to call when the component is cleaned up
 * @returns {Object} An object containing the element and a cleanup function
 */
export function createComponent(
  tag,
  {
    className,
    content,
    children,
    id,
    attributes,
    events,
    ref,
    cleanup,
    mount,
  } = {}
) {
  validateTag(tag);
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (id) element.id = id;
  if (attributes) setAttributes(element, attributes);
  if (events) setEvents(element, events);

  if (typeof content === 'function') {
    const updateContent = () => {
      const newContent = content();
      if (!newContent.element) {
        element.innerHTML = newContent;
      } else if (newContent.element !== element.innerHTML) {
        element.replaceChildren(newContent.element);
      }
    };
    createEffect(updateContent);
  } else if (content) {
    element.innerHTML = content;
  }

  if (children) setChildren(element, children);

  if (typeof ref === 'function') ref(element);

  // Execute OnMount() callbacks from the context
  if (mount) requestAnimationFrame(mount);

  return {
    element,
    cleanup,
  };
}

export function Link({ href, content, className = '', events = {} }) {
  return createComponent('a', {
    className: `${className}`,
    content,
    attributes: { href },
    events: {
      click: (event) => {
        event.preventDefault();
        if (window.router) {
          window.router.navigate(href);
        } else {
          console.error('Router is not available in the window object.');
        }
      },
      ...events,
    },
  });
}

export function LayoutContent() {
  return createComponent('div', { className: 'route-content' });
}

export function NestedLayoutContent() {
  return createComponent('div', {
    className: 'nested-content',
  });
}
