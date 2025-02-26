import { createComponent, Link, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './SignupPage.module.css';
import { validateUsername, validatePassword, matchPasswords, validateEmail } from '../../core/utils';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8000;
const apiUrl = `${protocol}//${hostname}:${port}`;

export default function SignupPage() {
  const cleanup = createCleanupContext();

  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [passwordRepeat, setPasswordRepeat] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');
  const [emailError, setEmailError] = createSignal('');
  const [passwordError, setPasswordError] = createSignal('');
  const [submitError, setSubmitError] = createSignal('');
  const [submitSuccess, setSubmitSuccess] = createSignal('');
  const [isSigningUp, setIsSigningUp] = createSignal(false);

  async function handleRegistration(event) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (isSigningUp()) return;

    setIsSigningUp(true);

    if (!validateUsername(username(), setUsernameError) || !validateEmail(email(), setEmailError) || !validatePassword(password(), setPasswordError) || !matchPasswords(password(), passwordRepeat(), setPasswordError)) {
      setIsSigningUp(false);
      return;
    }

    try {
      const response = await fetch(`http://accountUrl/api/uam/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username(),
          email: email(),
          password: password()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSubmitSuccess('User created successfully! Redirecting to login page...');
      setTimeout(() => {
        setIsSigningUp(false);
        router.navigate('/login');
      }, 2000);
    } catch (error) {
      setIsSigningUp(false);
      setSubmitError(error.message);
      console.error('Registration error:', error);
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
                    validateUsername(value, setUsernameError);
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
                    validateEmail(value, setEmailError);
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
                attributes: {
                  type: "password",
                  required: true,
                },
                events: {
                  input: (event) => {
                    const value = event.target.value;
                    setPassword(value);
                    validatePassword(password(), setPasswordError);
                  }
                }
              }),
              createComponent('input', {
                className: styles.formGroupInput,
                attributes: {
                  type: "password",
                  required: true,
                },
                events: {
                  input: (event) => {
                    const value = event.target.value;
                    setPasswordRepeat(value);
                    matchPasswords(password(), passwordRepeat(), setPasswordError);
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
