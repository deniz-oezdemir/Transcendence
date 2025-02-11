import { createComponent, Link, createCleanupContext } from '@component';
import styles from './SignupPage.module.css';

export default function SignupPage() {
  const cleanup = createCleanupContext();

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
              createComponent('input', {
                className: styles.formGroupInput,
                type: 'text',
                id: 'username',
                name: 'username',
                required: true,
              }),
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