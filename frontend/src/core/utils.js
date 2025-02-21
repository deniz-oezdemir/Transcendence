export function validateUsername(value, setUsernameError) {
  const isValid =
    value.length >= 3 && value.length <= 20 && /^[a-zA-Z0-9]+$/.test(value);

  setUsernameError(
    isValid
      ? ''
      : 'Username must be 3-20 alphanumeric characters and/or underscores'
  );

  return isValid;
}

export function validateEmail(value, setEmailError) {
  const isValid =
    value.length >= 8 &&
    value.length <= 50 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  setEmailError(isValid ? '' : 'Invalid email address');
  return isValid;
}

export function validatePassword(value, setPasswordError) {
  const isValid =
    value.length >= 8 && value.length <= 20 && !/[ /\\]/.test(value);

  setPasswordError(
    isValid
      ? ''
      : 'Password must be 8-20 characters and cannot contain spaces, /, or \\'
  );
  return isValid;
}

export function matchPasswords(password, passwordRepeat, setPasswordError) {
  const isValid = password === passwordRepeat;
  setPasswordError(isValid ? '' : 'Passwords do not match');
  return isValid;
}
