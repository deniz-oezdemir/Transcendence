import { createSignal } from '@reactivity';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8007;
const apiUrl = `${protocol}//${hostname}:${port}`;

let userData = null;
const [isAuth, setIsAuth] = createSignal(false);

async function validateToken(token) {
  if (!token) return Promise.resolve(false);

  return fetch(`${apiUrl}/profile/`, {
    method: 'GET',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        console.warn('Invalid token, logging out...');
        localStorage.removeItem('authToken');
        userData = null;
        setIsAuth(false);
        return false;
      }
      return response.json();
    })
    .then((data) => {
      userData = { id: data.id, user: data.username };
      setIsAuth(true);
      return true;
    })
    .catch((error) => {
      console.error('Token validation failed:', error);
      localStorage.removeItem('authToken');
      userData = null;
      setIsAuth(false);
      return false;
    });
}

function getUser() {
  if (userData) return userData;

  const token = localStorage.getItem('authToken');
  if (!token) return null;

  let user = null;
  validateToken(token).then((isValid) => {
    if (isValid) {
      user = userData;
    }
  });

  return user;
}

function checkAuth() {
  if (isAuth()) return true;

  const token = localStorage.getItem('authToken');
  if (!token) return false;

  let isAuthenticated = false;
  validateToken(token).then((isValid) => {
    isAuthenticated = isValid;
  });

  return isAuthenticated;
}

async function login(username, password) {
  try {
    const response = await fetch(`${apiUrl}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }
    const data = await response.json();
    userData = { id: data.id, user: data.username };
    localStorage.setItem('authToken', data.token);
    setIsAuth(true);
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: error.message };
  }
}

async function logout() {
  try {
    console.log('logging out');
    const response = await fetch(`${apiUrl}/logout/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('authToken');
    userData = null;
    setIsAuth(false);
  }
}

function getIsAuth() {
  return { isAuth, setIsAuth };
}

export { logout, login, checkAuth, getUser, getIsAuth };
