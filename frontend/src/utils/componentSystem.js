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
  Object.keys(events).forEach((eventType) => {
    element.addEventListener(eventType, events[eventType]);
  });
}

function setChildren(element, children) {
  children.forEach((child) => element.appendChild(child.element));
}

function validateTag(tag) {
  if (typeof tag !== 'string' || !document.createElement(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  }
}

export function createComponent(
  tag,
  { className, content, children, id, attributes, events } = {}
) {
  validateTag(tag);
  const element = document.createElement(tag);

  // Context for the component cleanup
  const cleanupFns = [];
  cleanupContext = cleanupFns;

  if (className) element.className = className;
  if (id) element.id = id;
  if (attributes) setAttributes(element, attributes);
  if (events) setEvents(element, events);

  if (typeof content === 'function') {
    const updateContent = () => {
      const newContent = content();
      if (newContent !== element.innerHTML) {
        element.innerHTML = newContent;
      }
    };
    createEffect(updateContent);
  } else if (content) {
    element.innerHTML = content;
  }

  if (children) setChildren(element, children);

  cleanupContext = null;

  return {
    element,
    cleanup: () => {
      cleanupFns.forEach((fn) => fn());
    },
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
