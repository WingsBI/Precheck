import Cookies from 'js-cookie';

// Cookie configuration (session cookie: no expires)
const COOKIE_CONFIG = {
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  sameSite: 'strict' as const, // Protect against CSRF attacks
  path: '/', // Available across the entire site
};

// Cookie names
const TOKEN_COOKIE_NAME = 'auth_token';
const USER_COOKIE_NAME = 'auth_user';

export const cookieUtils = {
  // Set authentication token
  setToken: (token: string): void => {
    Cookies.set(TOKEN_COOKIE_NAME, token, COOKIE_CONFIG);
  },

  // Get authentication token
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_COOKIE_NAME);
  },

  // Remove authentication token
  removeToken: (): void => {
    Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  },

  // Set user data
  setUser: (userData: any): void => {
    Cookies.set(USER_COOKIE_NAME, JSON.stringify(userData), COOKIE_CONFIG);
  },

  // Get user data
  getUser: (): any => {
    const userData = Cookies.get(USER_COOKIE_NAME);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data from cookie:', error);
        return null;
      }
    }
    return null;
  },

  // Remove user data
  removeUser: (): void => {
    Cookies.remove(USER_COOKIE_NAME, { path: '/' });
  },

  // Clear all authentication cookies
  clearAuth: (): void => {
    cookieUtils.removeToken();
    cookieUtils.removeUser();
  },

  // Check if user is authenticated (has valid token)
  isAuthenticated: (): boolean => {
    const token = cookieUtils.getToken();
    return !!token;
  },

  // Migrate from localStorage to cookies (for backward compatibility)
  migrateFromLocalStorage: (): void => {
    try {
      const token = localStorage.getItem('token');
      if (token && !cookieUtils.getToken()) {
        // Move token from localStorage to cookies
        cookieUtils.setToken(token);
        localStorage.removeItem('token');
        console.log('Successfully migrated token from localStorage to cookies');
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  },

  // Clear localStorage (cleanup after migration)
  clearLocalStorage: (): void => {
    try {
      localStorage.removeItem('token');
      console.log('Cleared localStorage authentication data');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};
