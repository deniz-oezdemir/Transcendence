import { createSignal } from '@reactivity';

const [isAuthenticated, setIsAuthenticated] = createSignal(checkAuth());

export function checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
    // return true;
}

export function login(data) {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('username', data.username);
  localStorage.setItem('userId', data.userId);
  setIsAuthenticated(true);
}

export async function logout() {
  try {
    // For local development
    console.log('Attempting to log out...', {
      // username: username(),
    });
    const response = await fetch(`http://localhost:8006/logout/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
        // 'X-CSRFToken': getCookie('csrftoken'),
      },
      // body: JSON.stringify({
      //   username: username(),
      //   password: password()
      // })
    });
    console.log('Response received:', response)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }

    localStorage.removeItem('authToken');
    setIsAuthenticated(false);

    setTimeout(() => {
      window.router.navigate('/login');
    }, 2000);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export { isAuthenticated, setIsAuthenticated };