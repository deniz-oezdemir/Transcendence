const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8007;
const apiUrl = `${protocol}//${hostname}:${port}`;

let userData = null;
let isAuth = false;

async function validateToken(token) {
  if (!token) return false;

  try {
    // console.log('Validating token...');
    const response = await fetch(`${apiUrl}/profile/`, {
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
      isAuth = false;
      window.router.navigate('/login');
      return false;
    }

    const data = await response.json();
    userData = { id: data.id, user: data.username };
    isAuth = true;
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    localStorage.removeItem('authToken');
    userData = null;
    isAuth = false;
    window.router.navigate('/login');
    return false;
  }
}

async function getUser() {
  if (userData) return userData;
  const token = localStorage.getItem('authToken');
  if (await validateToken(token)) return userData;
  return null;
}

async function checkAuth() {
  if (isAuth) return true;

  const token = localStorage.getItem('authToken');
  if (!token) return false;

  return await validateToken(token);
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

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    userData = { id: data.id, user: data.username };
    localStorage.setItem('authToken', data.token);
    isAuth = true;
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: error.message };
  }
}

async function logout() {
  try {
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
    isAuth = false;
    window.router.navigate('/login');
  }
}

export { logout, login, checkAuth, getUser };
