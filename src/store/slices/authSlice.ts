import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  token: string;
  departmentId: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Get initial state from localStorage
const getInitialState = (): AuthState => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      return {
        user,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      localStorage.removeItem('user');
    }
  }
  return {
    user: null,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const userData = response.data;
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      return userData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    password: string;
    name: string;
    email: string;
    departmentId: number;
    roleId: number;
    plantId: number;
    securityQuestionId: number;
    securityAnswer: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/reset',
  async (resetData: {
    userId: number;
    currentPassword: string;
    newPassword: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/reset', resetData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  }
);

export const forgetPassword = createAsyncThunk(
  'auth/forgetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/forget-password', { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password reset request failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      // Clear localStorage and axios headers
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Forget Password
      .addCase(forgetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 