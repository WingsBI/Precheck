import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { decodeJwt } from '../../utils/jwtUtils';

interface AuthState {
  user: {
    token: string | null;
    id: string | null;
    userid: string | null;
    username: string | null;
    roleid: string | null;
    role: string | null;
    plantid: string | null;
    email: string | null;
    deptid: string | null;
    department: string | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Helper function to get initial auth state from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = decodeJwt(token);
      if (decodedToken) {
        // Check if token is not expired
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp && decodedToken.exp > currentTime) {
          return {
            token,
            id: decodedToken.id,
            userid: decodedToken.userid,
            username: decodedToken.username,
            roleid: decodedToken.roleid,
            role: decodedToken.role,
            plantid: decodedToken.plantid,
            email: decodedToken.email,
            deptid: decodedToken.deptid,
            department: decodedToken.department,
          };
        } else {
          // Token expired, remove it
          localStorage.removeItem('token');
        }
      }
    }
  } catch (error) {
    console.error('Error initializing auth state:', error);
    localStorage.removeItem('token');
  }
  return null;
};

const initialState: AuthState = {
  user: getInitialAuthState(),
  isLoading: false,
  error: null,
  isInitialized: true,
};

// Initialize authentication from localStorage
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const decodedToken = decodeJwt(token);
      if (!decodedToken) {
        localStorage.removeItem('token');
        return null;
      }

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp <= currentTime) {
        localStorage.removeItem('token');
        return null;
      }

      // Token is valid, return user data
      return {
        token,
        id: decodedToken.id,
        userid: decodedToken.userid,
        username: decodedToken.username,
        roleid: decodedToken.roleid,
        role: decodedToken.role,
        plantid: decodedToken.plantid,
        email: decodedToken.email,
        deptid: decodedToken.deptid,
        department: decodedToken.department,
      };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Failed to initialize authentication');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { userId: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('https://wingsbi-precheck-api.azurewebsites.net/api/Auth/Login', credentials);
      const token = response.data.token;
      
      if (!token) {
        throw new Error('No token received');
      }

      // Decode the JWT token
      const decodedToken = decodeJwt(token);
      if (!decodedToken) {
        throw new Error('Invalid token received');
      }

      return {
        token,
        id: decodedToken.id,
        userid: decodedToken.userid,
        username: decodedToken.username,
        roleid: decodedToken.roleid,
        role: decodedToken.role,
        plantid: decodedToken.plantid,
        email: decodedToken.email,
        deptid: decodedToken.deptid,
        department: decodedToken.department,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    userId: string;
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
      state.isInitialized = true;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuthFromStorage: (state, action) => {
      state.user = action.payload;
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.isInitialized = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isInitialized = true;
        state.error = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
        state.isInitialized = true;
        localStorage.setItem('token', action.payload.token);
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

export const { logout, clearError, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer; 