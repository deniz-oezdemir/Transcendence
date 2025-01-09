# `createComponent` Function Documentation

## Overview

The `createComponent` function is a utility to create DOM elements with customizable attributes, content, children, and event handlers. It allows you to create components in a modular way, enabling reusable and scalable code for your frontend application.

## Function Signature

```js
createComponent(
  tag,
  ({
    className = '',
    content = '',
    children = [],
    id = '',
    attributes = {},
    events = {},
  } = {})
);
```

## Parameters

- **`tag`** _(string)_: The type of HTML element to create (e.g., `'div'`, `'button'`, `'p'`, `'input'`, etc.).
- **`className`** _(string, optional)_: The class name(s) to assign to the element. Default is an empty string.

- **`content`** _(string, optional)_: The inner HTML content of the element. Default is an empty string.

- **`children`** _(array of elements, optional)_: An array of child elements to append to the created element. Default is an empty array.

- **`id`** _(string, optional)_: The `id` attribute to assign to the element. Default is an empty string.

- **`attributes`** _(object, optional)_: An object containing additional attributes to set on the element (e.g., `type`, `placeholder`, etc.). Default is an empty object.

- **`events`** _(object, optional)_: An object containing event listeners to attach to the element. The keys are event types (e.g., `'click'`, `'change'`) and the values are the event handler functions. Default is an empty object.

## Returns

The function returns the created DOM element, which can be appended to the DOM or manipulated as needed.

## Usage Examples

### 1. Creating a Button with `onClick` Event

```js
const button = createComponent('button', {
  className: 'my-button',
  content: 'Click Me',
  id: 'unique-button',
  events: {
    click: () => alert('Button clicked!'),
  },
});
```

### 2. Creating an Input with `onChange` Event

```js
const input = createComponent('input', {
  className: 'my-input',
  attributes: { type: 'text', placeholder: 'Type here' },
  events: {
    change: (event) => console.log('Input changed:', event.target.value),
  },
});
```

### 3. Creating a Div with Multiple Events

```js
const div = createComponent('div', {
  className: 'my-div',
  content: 'Hover or click me!',
  events: {
    click: () => alert('Div clicked!'),
    mouseover: () => console.log('Mouse is over the div!'),
  },
});
```
