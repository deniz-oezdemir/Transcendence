import { createComponent, Link, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './SignupPage.module.css';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8007;
const apiUrl = `${protocol}//${hostname}:${port}`;

export default function SignupPage() {
  const cleanup = createCleanupContext();

  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');
  const [emailError, setEmailError] = createSignal('');
  const [passwordError, setPasswordError] = createSignal('');
  const [submitError, setSubmitError] = createSignal('');
  const [submitSuccess, setSubmitSuccess] = createSignal('');
  const [isSigningUp, setIsSigningUp] = createSignal(false);

  function validateUsername(value) {
    const isValid =
      value.length >= 3 &&
      value.length <= 20 &&
      /^[a-zA-Z0-9]+$/.test(value);

    setUsernameError(
      isValid
        ? ''
        : 'Username must be 3-20 alphanumeric characters and/or underscores'
    );

    return isValid;
  }

  function validateEmail(value) {
    const isValid =
      value.length >= 8 &&
      value.length <= 50 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    setEmailError(
      isValid
        ? ''
        : 'Invalid email address'
    );
    return isValid;
  }

  function validatePassword(value) {
    const isValid =
      value.length >= 8 &&
      value.length <= 50;

    setPasswordError(
      isValid
        ? ''
        : 'Password must be 8-50 characters'
    );
    return isValid;
  }

  async function handleRegistration(event) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (isSigningUp()) return;

    setIsSigningUp(true);

    if (!validateUsername(username()) || !validateEmail(email()) || !validatePassword(password())) {
      setIsSigningUp(false);
      return;
    }

    // // Get CSRF token from cookies
    // function getCookie(name) {
    //   let cookieValue = null;
    //   if (document.cookie && document.cookie !== '') {
    //     const cookies = document.cookie.split(';');
    //     for (let i = 0; i < cookies.length; i++) {
    //       const cookie = cookies[i].trim();
    //       if (cookie.substring(0, name.length + 1) === (name + '=')) {
    //         cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //         break;
    //       }
    //     }
    //   }
    //   return cookieValue;
    // }

    try {
      const response = await fetch(`${apiUrl}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          username: username(),
          email: email(),
          password: password()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed on server side');
      }

      setSubmitSuccess('User created successfully! Redirecting to login page...');
      setTimeout(() => {
        setIsSigningUp(false);
        router.navigate('/login');
      }, 2000);
    } catch (error) {
      setIsSigningUp(false);
      console.error('Registration error:', error);
      setSubmitError(error.message);
    }
  }

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h2', {
        className: styles.formTitle,
        content: 'Signup'
      }),
      createComponent('form', {
        children: [
          createComponent('div', {
            className: styles.formGroup,
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
              createComponent('div', {
                className: styles.errorMessage,
                content: () => usernameError()
              })
            ],
          }),
          createComponent('div', {
            className: styles.formGroup,
            children: [
              createComponent('label', {
                content: 'Email',
                htmlFor: 'email'
              }),
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'email',
                id: 'email',
                name: 'email',
                required: true,
                events: {
                  input: (event) => {
                    const value = event.target.value;
                    setEmail(value);
                    validateEmail(value);
                  }
                }
              }),
              createComponent('div', {
                className: styles.errorMessage,
                content: () => emailError()
              })
            ],
          }),
          createComponent('div', {
            className: styles.formGroup,
            children: [
              createComponent('label', {
                content: 'Password',
                htmlFor: 'password'
              }),
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'password',
                id: 'password',
                name: 'password',
                required: true,
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
            content: () => (isSigningUp() ? 'Signing Up...' : 'Signup'),
            disabled: () => Boolean(isSigningUp()),
            events: {
              click: (event) => {
                handleRegistration(event);
              }
            }
          }),
        ],
      }),
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
