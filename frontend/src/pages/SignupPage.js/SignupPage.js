import { createComponent, Link, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './SignupPage.module.css';

export default function SignupPage() {
  const cleanup = createCleanupContext();

  // Create signals for form validation
  const [username, setUsername] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');
  const [isUsernameValid, setIsUsernameValid] = createSignal(false);

  // Username validation function
  function validateUsername(value) {
    const isValid = 
      value.length >= 4 && 
      value.length <= 20 && 
      /^[a-zA-Z0-9]+$/.test(value);

    setIsUsernameValid(isValid);
    setUsernameError(
      isValid 
        ? '' 
        : 'Username must be 3-20 alphanumeric characters'
    );

    return isValid;
  }

  // Create username input with validation
  const usernameInput = createComponent('input', {
    className: styles.formGroupInput,
    type: 'text',
    id: 'username',
    name: 'username',
    required: true,
    events: {
      input: (event) => {
        const value = event.target.value;
        setUsername(value);
        validateUsername(value);
      }
    }
  });

  // Create username error message
  const usernameErrorElement = createComponent('div', {
    className: styles.errorMessage,
    content: () => usernameError()
  });

  // // Form submission handler
  // function handleSubmit(event) {
  //   event.preventDefault();
    
    // Validate all fields
    const isValid = validateUsername(username());
    
    if (isValid) {
      // Proceed with form submission
      console.log('Form is valid, submit data');
    } else {
      console.log('Form has errors');
    }
  }

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h2', { className: styles.formTitle, content: 'Signup' }),
      createComponent('form', {
        //onSubmit: handleSubmit,
        children: [
          // Name Field
          createComponent('div', {
            className: styles.formGroup,
            children: [
              createComponent('label', { content: 'User Name', htmlFor: 'username' }),
              usernameInput,
              usernameErrorElement
              // createComponent('input', {
              //   className: styles.formGroupInput,
              //   type: 'text',
              //   id: 'username',
              //   name: 'username',
              //   required: true,
              // }),
            ],
          }),
          // Email Field
          createComponent('div', {
            className: styles.formGroup,
            children: [
              createComponent('label', { content: 'Email', htmlFor: 'email' }),
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'email',
                id: 'email',
                name: 'email',
                required: true,
              }),
            ],
          }),
          // Password Field
          createComponent('div', {
            className: styles.formGroup,
            children: [
              createComponent('label', { content: 'Password', htmlFor: 'password' }),
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'password',
                id: 'password',
                name: 'password',
                required: true,
              }),
            ],
          }),
          // Submit Button
          createComponent('button', {
            type: 'submit',
            className: styles.submitButton,
            content: 'Signup',
            // Disables button if username(later on form) is invalid
            attributes: {
              disabled: () => !isUsernameValid()
            },
            // events: {
            //   click: (event) => {
            //     event.preventDefault();
            //     // Validate all fields
            //     const isValid = validateUsername(username());
            //     if (isValid) {
            //       // Proceed with form submission
            //       console.log('Form is valid, submit data');
            //     } else {
            //       console.log('Form has errors');
            //     }
            //   }
            // },
          }),
        ],
      }),
      // Link to Login Page
      createComponent('div', {
        className: styles.toggleLink,
        children: [
          createComponent('span', { content: 'Already have an account? ' }),
          Link({
            href: '/login',
            content: 'Login',
            className: styles.link,
          }),
        ],
      }),
    ],
    cleanup,
  });
}