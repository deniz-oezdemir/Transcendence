import { createSignal } from '@reactivity';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8007;
const apiUrl = `${protocol}//${hostname}:${port}`;

const [isAuthenticated, setIsAuthenticated] = createSignal(checkAuth());
// const [username, setUsername] = createSignal(localStorage.getItem('username'));
// const [password, setPassword] = createSignal(localStorage.getItem('password'));

function checkAuth() {
  const token = localStorage.getItem('authToken');
  return !!token;
  // return true;
}

async function login(username, password) {
  const response = await fetch(`${apiUrl}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  const data = await response.json();
  console.log('Response received:', response, data);
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  localStorage.setItem('authToken', data.token);
  localStorage.setItem('username', data.user);
  localStorage.setItem('userId', data.id);
  setIsAuthenticated(true);

  return { success: true };
}

async function logout() {
  const response = await fetch(`${apiUrl}/logout/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
      // 'X-CSRFToken': getCookie('csrftoken'),
    },
    // body: JSON.stringify({
    //   username: username(),
    //   password: password()
    // })
  });
  console.log('Response received:', response);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Logout failed');
  }

  localStorage.removeItem('authToken');
  setIsAuthenticated(false);
}

async function getUser() {
  return {
    id: localStorage.getItem('UserId'),
    username: localStorage.getItem('username'),
  };
}

export {
  logout,
  login,
  checkAuth,
  isAuthenticated,
  setIsAuthenticated,
  getUser,
};

// let userData = null;
// const [isAuth, setIsAuth] = createSignal(false);
// setIsAuth(await checkAuth());

// async function validateToken(token) {
//   if (!token) return Promise.resolve(false);

//   return fetch(`${apiUrl}/profile/`, {
//     method: 'GET',
//     headers: {
//       Authorization: `Token ${token}`,
//       'Content-Type': 'application/json',
//     },
//   })
//     .then((response) => {
//       if (!response.ok) {
//         console.warn('Invalid token, logging out...');
//         localStorage.removeItem('authToken');
//         userData = null;
//         setIsAuth(false);
//         return false;
//       }
//       return response.json();
//     })
//     .then((data) => {
//       userData = { id: data.id, username: data.username };
//       setIsAuth(true);
//       return true;
//     })
//     .catch((error) => {
//       console.error('Token validation failed:', error);
//       localStorage.removeItem('authToken');
//       userData = null;
//       setIsAuth(false);
//       return false;
//     })
//     .finally(() => {
//       return true;
//     });
// }

// async function getUser() {
//   if (userData) return userData;

//   const token = localStorage.getItem('authToken');
//   if (!token) return null;

//   await validateToken(token);
//   return userData;
// }

// async function checkAuth() {
//   if (isAuth()) return true;

//   const token = localStorage.getItem('authToken');
//   if (!token) return false;

//   return await validateToken(token);
// }

// async function login(username, password) {
//   try {
//     const response = await fetch(`${apiUrl}/login/`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ username, password }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Logout failed');
//     }
//     const data = await response.json();
//     userData = { id: data.id, username: data.username };
//     localStorage.setItem('authToken', data.token);
//     setIsAuth(true);
//     return { success: true };
//   } catch (error) {
//     console.error('Login error:', error);
//     return { success: false, message: error.message };
//   }
// }

// async function logout() {
//   try {
//     console.log('logging out');
//     const response = await fetch(`${apiUrl}/logout/`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Token ${localStorage.getItem('authToken')}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Logout failed');
//     }
//   } catch (error) {
//     console.error('Logout error:', error);
//   } finally {
//     localStorage.removeItem('authToken');
//     userData = null;
//     setIsAuth(false);
//   }
// }

// function getIsAuth() {
//   return { isAuth, setIsAuth };
// }

// export { logout, login, checkAuth, getUser, getIsAuth };
