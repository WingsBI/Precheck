import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

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
      // Set the token in api headers
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
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
      // Map username to userId as per API specification
      const loginData = {
        userId: credentials.username,
        password: credentials.password
      };
      const response = await api.post('/api/Auth/login', loginData);
      console.log('API Response:', response.data); // Add debugging
      
      const authData = response.data;
      
      // Transform the API response to match our User interface
      const userData = {
        id: authData.id || 1, // Provide default if not present
        email: authData.email || '',
        role: authData.role || 'user',
        token: authData.token || authData.accessToken || '', // Handle different token field names
        departmentId: authData.departmentId || 0,
        // Include any other fields from the API response
        ...authData
      };
      
      console.log('Transformed user data:', userData); // Add debugging
      
      // Store user data in localStorage 
      localStorage.setItem('user', JSON.stringify(userData));
      // Set the token in api headers
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      return userData;
    } catch (error: any) {
      console.error('Login API error:', error.response?.data); // Add debugging
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
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
      // Map to API expected fields
      const registerData = {
        userName: userData.username,
        email: userData.email,
        userId: userData.name, // Using name as userId based on the Register component mapping
        password: userData.password,
        userroleId: userData.roleId,
        plantId: userData.plantId,
        deptId: userData.departmentId,
        securityQuestionId: userData.securityQuestionId,
        securityAnswer: userData.securityAnswer
      };
      const response = await api.post('/api/Auth/register', registerData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/reset',
  async (resetData: {
    userId: string;
    password: string;
    securityQuestionId: number;
    securityAnswer: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Auth/reset', resetData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  }
);

export const forgetPassword = createAsyncThunk(
  'auth/forgetPassword',
  async (forgetData: {
    userId: string;
    securityQuestion: string;
    securityAnswer: string;
    newPassword: string;
  }, { rejectWithValue }) => {
    try {
      // The API might need this in a different format
      const resetData = {
        userId: forgetData.userId,
        password: forgetData.newPassword,
        securityQuestionId: parseInt(forgetData.securityQuestion),
        securityAnswer: forgetData.securityAnswer
      };
      const response = await api.post('/api/Auth/reset', resetData);
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
      // Clear localStorage and api headers
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
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