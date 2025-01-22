import { createEffect } from '@reactivity';

let cleanupContext = null;

export function onCleanup(fn) {
  if (cleanupContext) {
    cleanupContext.push(fn);
  } else {
    throw new Error('onCleanup must be called during component creation.');
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

export function createComponent(
  tag,
  { className, content, children, id, attributes, events, cleanup } = {}
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
        element.innerHTML = content;
      } else if (newContent.element !== element.innerHTML) {
        element.replaceChildren(newContent.element);
      }
    };
    createEffect(updateContent);
  } else if (content) {
    element.innerHTML = content;
  }

  if (children) setChildren(element, children);

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
