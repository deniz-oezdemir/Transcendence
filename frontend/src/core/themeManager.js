export function setTheme(theme) {
  document.body.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);
}

export function getPreferredTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyInitialTheme() {
  const initialTheme = getPreferredTheme();
  setTheme(initialTheme);
}

export function addSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e) => {
    const systemTheme = e.matches ? 'dark' : 'light';
    setTheme(systemTheme);
  };

  mediaQuery.addEventListener('change', handleChange);
}
