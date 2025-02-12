import { createComponent, Link, createCleanupContext } from '@component';
import styles from './LoginPage.module.css';
import { createSignal, createEffect } from '@reactivity';
import { login } from '../../auth';

export default function LoginPage() {
  const cleanup = createCleanupContext();
  
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');
  const [passwordError, setPasswordError] = createSignal('');
  const [submitError, setSubmitError] = createSignal('');
  const [submitSuccess, setSubmitSuccess] = createSignal('');
  const [isLoggingIn, setIsLoggingIn] = createSignal(false);

  function validateUsername(value) {
    const isValid = 
      value.length >= 3 && 
      value.length <= 20 &&
      /^[a-zA-Z0-9_]+$/.test(value);

    setUsernameError(
      isValid 
        ? '' 
        : 'Username must be 3-20 alphanumeric characters and/or underscores'
    );

    return isValid;
  }

  function validatePassword(value) {
    const isValid =
      value.length >= 8 &&
      value.length <= 20 &&
      !/[ /\\]/.test(value);

      setPasswordError(
      isValid
        ? ''
        : 'Password must be 8-20 characters and cannot contain spaces, /, or \\'
    );
    return isValid;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (isLoggingIn()) return;

    setIsLoggingIn(true);

    if (!validateUsername(username()) || !validatePassword(password())) {
      setIsLoggingIn(false);
      return;
    }
    try {
      const response = await login(username(), password());
      if (response.success) {
        setSubmitSuccess('User logged in successfully! Redirecting to home page...');
        setTimeout(() => {
          setIsLoggingIn(false);
          router.navigate('/');
        }, 2000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setIsLoggingIn(false);
      setSubmitError(error.message);
    }
  }

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h2', {
        className: styles.formTitle,
        content: 'Login'
      }),
      createComponent('form', {
        children: [
          createComponent('div', {
            className: styles.formGroupLabel,
            children: [
              createComponent('label', {
                content: 'User Name',
                htmlFor: 'username'
              }),
              createComponent('input', {
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
              }),
              createComponent('span', {
                className: styles.errorMessage,
                content: () => usernameError()
              })
            ],
          }),
          createComponent('div', {
            className: styles.formGroupLabel,
            children: [
              createComponent('label', {
                content: 'Password',
                htmlFor: 'password'
              }),
              createComponent('input', {
                className: styles.formGroupInput,
                attributes: {
                  type: "password",
                  // placeholder: "Password...",
                  required: true,
                },
                events: {
                  input: (event) => {
                    const value = event.target.value;
                    setPassword(value);
                    validatePassword(value);
                  }
                }
              }),
              createComponent('div', {
                className: styles.errorMessage,
                content: () => passwordError()
              })
            ],
          }),
          createComponent('div', {
            className: styles.errorMessage,
            content: () => submitError()
          }),
          createComponent('div', {
            className: styles.successMessage,
            content: () => submitSuccess()
          }),
          createComponent('button', {
            type: 'submit',
            className: styles.submitButton,
            content: () => (isLoggingIn() ? 'Logging in...' : 'Login'),
            disabled: () => Boolean(isLoggingIn()),
            events: {
              click: (event) => {
                handleLogin(event);
              }
            }
          }),
        ],
      }),
      createComponent('div', {
        className: styles.toggleLink,
        children: [
          createComponent('span', { content: "Don't have an account? " }),
          Link({
            href: '/signup',
            content: 'Sign up',
            className: styles.link,
          }),
        ],
      }),
    ],
    cleanup,
  });
}