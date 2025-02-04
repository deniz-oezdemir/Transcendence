// Check if the user is authenticated
export function checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
    // return true;
  }