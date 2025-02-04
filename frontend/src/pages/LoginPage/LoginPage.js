import { createComponent, Link, createCleanupContext } from '@component';
import styles from './LoginPage.module.css';
import { createSignal } from '@reactivity';

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
      /^[a-zA-Z0-9]+$/.test(value);

    // setIsUsernameValid(isValid);
    setUsernameError(
      isValid 
        ? '' 
        : 'Username must be 3-20 alphanumeric characters'
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

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsLoggingIn(true);

    if (!validateUsername(username()) || !validatePassword(password())) {
      setIsLoggingIn(false);
      return;
    }

    try {
      // For local development
      console.log('Attempting login with:', {
        username: username(),
        password: password()
      });
      const response = await fetch(`http://localhost:8006/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          username: username(),
          password: password()
        })
      });
      console.log('Response received:', response)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('userId', data.userId);
      
      setSubmitSuccess('User logged in successfully! Redirecting to home page...');

      setTimeout(() => {
        window.router.navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Login error:', error);
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
        events: {
          submit: handleLogin
        },
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
                content: usernameError()
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
              createComponent('span', {
                className: styles.errorMessage,
                content: passwordError()
              })
            ],
          }),
          // Submit Error Message
          createComponent('div', {
            className: styles.errorMessage,
            content: () => submitError()
          }),
          // Submit Success Message
          createComponent('div', {
            className: styles.successMessage,
            content: () => submitSuccess()
          }),
          createComponent('button', {
            type: 'submit',
            className: styles.submitButton,
            content: 'Login',
            disabled: () => isLoggingIn(),
            events: {
              click: (event) => {
                // event.preventDefault();
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