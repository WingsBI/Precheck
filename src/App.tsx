import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { theme } from './theme/theme';
import { store } from './store/store';
// Removed initializeAuth to prevent auto-login from cookies/localStorage
import AppRoutes from './routes';
import type { AppDispatch } from './store/store';

// AuthProvider kept for future use if needed, but does not auto-initialize auth
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
      </ThemeProvider>
    </Provider>
  );
}

export default App; 