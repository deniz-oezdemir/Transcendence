import { createComponent, Link, createCleanupContext } from '@component';
import { createSignal } from '@reactivity';
import styles from './SignupPage.module.css';

export default function SignupPage() {
  const cleanup = createCleanupContext();

  // Form fields signals
  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');
  const [submitError, setSubmitError] = createSignal('');
  const [isUsernameValid, setIsUsernameValid] = createSignal(false);

  // Validation function
  function validateUsername(value) {
    const isValid = 
      value.length >= 3 && 
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

  // Registration handler
  async function handleRegistration(event) {
    console.log('DEBUG: Registration attempt started!');
    event.preventDefault();
    setSubmitError('');

    // Basic validation
    if (!validateUsername(username())) {
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
      // For local development
      // const baseUrl = window.location.hostname === 'localhost' 
      //   ? 'http://localhost:8000' 
      //   : '/user';  // Use proxy or service name in container
      // const registerUrl = window.location.hostname === 'localhost' 
      // ? 'http://host.docker.internal:8000/register'
      // : '/register';

      // const response = await fetch(`${baseUrl}/register`, {
      const response = await fetch(`http://localhost:8006/user/register/`, {
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
      
      console.log('DEBUG: username: ', username());
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Handle successful registration
      window.router.navigate('/login');
    } catch (error) {
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
        events: {
          submit: handleRegistration
        },
        children: [
          // Username Field
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
          // Email Field
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
                    setEmail(event.target.value);
                  }
                }
              })
            ],
          }),
          // Password Field
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
                    setPassword(event.target.value);
                  }
                }
              })
            ],
          }),
          // Submit Error Message
          createComponent('div', {
            className: styles.errorMessage,
            content: () => submitError()
          }),
          // Submit Button
          createComponent('button', {
            type: 'submit',
            className: styles.submitButton,
            content: 'Signup',
            // attributes: {
            //   disabled: () => !isUsernameValid()},
            events: {
              click: (event) => {
                handleRegistration(event);
              }
            }
          }),
        ],
      }),
      // Login Link
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
// import { createComponent, Link, createCleanupContext } from '@component';
// import { createSignal, createEffect } from '@reactivity';
// import styles from './SignupPage.module.css';

// export default function SignupPage() {
//   const cleanup = createCleanupContext();

//   // Create signals for form validation
//   // const [username, setUsername] = createSignal('');
//   // const [usernameError, setUsernameError] = createSignal('');
//   // const [isUsernameValid, setIsUsernameValid] = createSignal(false);
//   const [username, setUsername] = createSignal('');
//   const [email, setEmail] = createSignal('');
//   const [password, setPassword] = createSignal('');
//   const [usernameError, setUsernameError] = createSignal('');
//   const [submitError, setSubmitError] = createSignal('');
//   const [isUsernameValid, setIsUsernameValid] = createSignal(false);


//   // Username validation function
//   function validateUsername(value) {
//     const isValid = 
//       value.length >= 3 && 
//       value.length <= 20 && 
//       /^[a-zA-Z0-9]+$/.test(value);

//     setIsUsernameValid(isValid);
//     setUsernameError(
//       isValid 
//         ? '' 
//         : 'Username must be 3-20 alphanumeric characters'
//     );

//     return isValid;
//   }

//   // // Create username input with validation
//   // const usernameInput = createComponent('input', {
//   //   className: styles.formGroupInput,
//   //   type: 'text',
//   //   id: 'username',
//   //   name: 'username',
//   //   required: true,
//   //   events: {
//   //     input: (event) => {
//   //       const value = event.target.value;
//   //       setUsername(value);
//   //       validateUsername(value);
//   //     }
//   //   }
//   // });

//   // // Create username error message
//   // const usernameErrorElement = createComponent('div', {
//   //   className: styles.errorMessage,
//   //   content: () => usernameError()
//   // });

//   // // Form submission handler
//   // function handleSubmit(event) {
//   //   event.preventDefault();
    
//   //   // Validate all fields
//   //   const isValid = validateUsername(username());
    
//   //   if (isValid) {
//   //     // Proceed with form submission
//   //     console.log('Form is valid, submit data');
//   //   } else {
//   //     console.log('Form has errors');
//   //   }
//   // }

//   // Registration handler
//   async function handleRegistration(event) {
//     event.preventDefault();
//     setSubmitError('');

//     // Basic validation
//     if (!validateUsername(username())) {
//       return;
//     }

//     try {
//       // For local development
//       const baseUrl = window.location.hostname === 'localhost' 
//         ? 'http://localhost:8000' 
//         : '/api';  // Use proxy or service name in container

//       const response = await fetch(`${baseUrl}/register`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           username: username(),
//           email: email(),
//           password: password()
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Registration failed');
//       }

//       // Handle successful registration
//       window.router.navigate('/login');
//     } catch (error) {
//       setSubmitError(error.message);
//       console.error('Registration error:', error);
//     }
//   }

//   return createComponent('div', {
//     className: styles.container,
//     children: [
//       createComponent('h2', { className: styles.formTitle, content: 'Signup' }),
//       createComponent('form', {
//         //onSubmit: handleSubmit,
//         events: {
//           submit: handleRegistration
//         },
//         children: [
//           // Name Field
//           createComponent('div', {
//             className: styles.formGroup,
//             children: [
//               createComponent('label', { content: 'User Name', htmlFor: 'username' }),
//               // usernameInput,
//               // usernameErrorElement
//               createComponent('input', {
//                 className: styles.formGroupInput,
//                 type: 'text',
//                 id: 'username',
//                 name: 'username',
//                 required: true,
//                 // events: {
//                 //   input: (event) => {
//                 //     const value = event.target.value;
//                 //     setUsername(value);
//                 //     validateUsername(value);
//                 //   }
//                 // }
//               }),
//             ],
//           }),
//           // Email Field
//           createComponent('div', {
//             className: styles.formGroup,
//             children: [
//               createComponent('label', { content: 'Email', htmlFor: 'email' }),
//               createComponent('input', {
//                 className: styles.formGroupInput,
//                 type: 'email',
//                 id: 'email',
//                 name: 'email',
//                 required: true,
//                 // events: {
//                 //   input: (event) => {
//                 //     setEmail(event.target.value);
//                 //   }
//                 // }
//               }),
//             ],
//           }),
//           // Password Field
//           createComponent('div', {
//             className: styles.formGroup,
//             children: [
//               createComponent('label', { content: 'Password', htmlFor: 'password' }),
//               createComponent('input', {
//                 className: styles.formGroupInput,
//                 type: 'password',
//                 id: 'password',
//                 name: 'password',
//                 required: true,
//                 // events: {
//                 //   input: (event) => {
//                 //     setPassword(event.target.value);
//                 //   }
//                 // }
//               }),
//               // // Submit Error Message
//               // createComponent('div', {
//               // className: styles.errorMessage,
//               // content: () => submitError()
//               // }),
//             ],
//           }),
//           // Submit Button
//           createComponent('button', {
//             type: 'submit',
//             className: styles.submitButton,
//             content: 'Signup',
//             // Disables button if username(later on form) is invalid
//             attributes: {
//               disabled: () => !isUsernameValid()
//             },
//             // events: {
//             //   click: (event) => {
//             //     event.preventDefault();
//             //     // Validate all fields
//             //     const isValid = validateUsername(username());
//             //     if (isValid) {
//             //       // Proceed with form submission
//             //       console.log('Form is valid, submit data');
//             //     } else {
//             //       console.log('Form has errors');
//             //     }
//             //   }
//             // },
//           }),
//         ],
//       }),
//       // Link to Login Page
//       createComponent('div', {
//         className: styles.toggleLink,
//         children: [
//           createComponent('span', { content: 'Already have an account? ' }),
//           Link({
//             href: '/login',
//             content: 'Login',
//             className: styles.link,
//           }),
//         ],
//       }),
//     ],
//     cleanup,
//   });
// }