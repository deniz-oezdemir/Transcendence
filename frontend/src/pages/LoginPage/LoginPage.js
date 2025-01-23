import { createComponent, Link, createCleanupContext } from '@component';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const cleanup = createCleanupContext();

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h2', { className: styles.formTitle, content: 'Login' }),
      createComponent('form', {
        children: [
          createComponent('div', {
            className: styles.formGroupLabel,
            children: [
              createComponent('label', { content: 'Email', htmlFor: 'email' }),
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'email',
                id: 'email',
                name: 'email',
                placeholder: 'Enter your email',
                required: true,
              }),
            ],
          }),
          createComponent('div', {
            className: styles.formGroupLabel,
            children: [
              createComponent('label', { content: 'Password', htmlFor: 'password' }),
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'password',
                id: 'password',
                name: 'password',
                placeholder: 'Enter your password',
                required: true,
              }),
            ],
          }),
          createComponent('button', {
            type: 'submit',
            className: styles.submitButton,
            content: 'Login',
          }),
        ],
      }),
      createComponent('div', {
        className: styles.toggleLink,
        children: [
          createComponent('span', { content: "Don't have an account? " }),
          createComponent('a', { href: '/signup', content: 'Sign up' }),
        ],
      }),
    ],
    cleanup,
  });
}