import { createSignal } from '@reactivity';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8000;
const apiUrl = `${protocol}//${hostname}:${port}`;

let userData = null;
const [isAuth, setIsAuth] = createSignal(false);
setIsAuth(await checkAuth());

async function validateToken(token) {
  if (!token) return false;

  try {
    const response = await fetch(`https://localhost:8443/profile/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Invalid token, logging out...');
      localStorage.removeItem('authToken');
      userData = null;
      setIsAuth(false);
      window.router.navigate('/login');
      return false;
    }

    const data = await response.json();
    // Asegurarse de que ambos campos existen antes de actualizar userData
    if (data && data.id !== undefined && data.username) {
      userData = { id: data.id, username: data.username };
      setIsAuth(true);
      return true;
    } else {
      console.warn('Incomplete user data received');
      return false;
    }
  } catch (error) {
    console.error('Token validation failed:', error);
    localStorage.removeItem('authToken');
    userData = null;
    setIsAuth(false);
    window.router.navigate('/login');
    return false;
  }
}

async function getUser() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  // Si userData existe pero hay campos undefined, volvemos a validar
  if (userData && userData.id !== undefined && userData.username) {
    return userData;
  }

  // Si no hay datos completos, validamos de nuevo
  const isValid = await validateToken(token);
  return isValid ? userData : null;
}

async function checkAuth() {
  if (isAuth()) return true;

  const token = localStorage.getItem('authToken');
  if (!token) return false;

  return await validateToken(token);
}

async function login(username, password) {
  try {
    const response = await fetch(`https://localhost:8443/api/uam/login/`, {
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
