import { createSignal } from '@reactivity';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8000;
const apiUrl = `${protocol}//${hostname}:${port}`;

let userData = null;
const [isAuth, setIsAuth] = createSignal(false);
setIsAuth(await checkAuth());

async function validateToken(token) {
  if (!token) return Promise.resolve(false);

  return fetch(`http://localhost:8000/profile/`, {
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
      userData = { id: data.id, username: data.username };
      setIsAuth(true);
      return true;
    })
    .catch((error) => {
      console.error('Token validation failed:', error);
      localStorage.removeItem('authToken');
      userData = null;
      setIsAuth(false);
      return false;
    })
    .finally(() => {
      return true;
    });
}

async function getUser() {
  if (userData) return userData;

  const token = localStorage.getItem('authToken');
  return !!token;
  // return true;
}

async function login(username, password) {
  try {
    const response = await fetch(`http://localhost:8000/api/uam/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    userData = { id: data.id, username: data.username };
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
    console.log('loggin out');
    const response = await fetch(`http://localhost:8000/api/uam/logout/`, {
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
