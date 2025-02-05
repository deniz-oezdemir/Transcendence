import { createSignal } from '@reactivity';

const [isAuthenticated, setIsAuthenticated] = createSignal(checkAuth());
// const [username, setUsername] = createSignal(localStorage.getItem('username'));
// const [password, setPassword] = createSignal(localStorage.getItem('password'));

function checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
    // return true;
}

async function login(username, password) {
    const response = await fetch(`http://localhost:8006/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });
    console.log('Response received:', response)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('userId', data.userId);
    setIsAuthenticated(true);

}
async function logout() {
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

}

export { logout, login, checkAuth, isAuthenticated, setIsAuthenticated };