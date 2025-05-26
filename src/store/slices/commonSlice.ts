import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface CommonState {
  departments: any[];
  modules: any[];
  componentTypes: any[];
  drawingNumbers: any[];
  documentTypes: any[];
  productionSeries: any[];
  units: any[];
  userRoles: any[];
  plants: any[];
  securityQuestions: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CommonState = {
  departments: [],
  modules: [],
  componentTypes: [],
  drawingNumbers: [],
  documentTypes: [],
  productionSeries: [],
  units: [],
  userRoles: [],
  plants: [],
  securityQuestions: [],
  isLoading: false,
  error: null,
};

// Departments
export const getAllDepartments = createAsyncThunk(
  'common/getAllDepartment',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Auth/GetAllDepartment');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

// Modules
export const getAllModules = createAsyncThunk(
  'common/getAllModules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Common/GetAllModules');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch modules');
    }
  }
);

// Component Types
export const getAllComponentTypes = createAsyncThunk(
  'common/getAllComponentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Common/GetAllComponenttype');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch component types');
    }
  }
);

// Drawing Numbers
export const getDrawingNumbers = createAsyncThunk(
  'common/getDrawingNumbers',
  async ({ componentType, search }: { componentType?: string, search?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Common/GetAllDrawingNumber', {
        params: {
          ComponentType: componentType || '',
          search
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch drawing numbers');
    }
  }
);

// Document Types
export const getAllDocumentTypes = createAsyncThunk(
  'common/getAllDocumentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Common/GetAllDocumentType');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch document types');
    }
  }
);

// Production Series
export const getAllProductionSeries = createAsyncThunk(
  'common/getAllProductionSeries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Common/GetAllProductionSeries');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch production series');
    }
  }
);

// Units
export const getAllUnits = createAsyncThunk(
  'common/getAllUnits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Common/GetAllUnit');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch units');
    }
  }
);

// User Roles
export const getUserRoles = createAsyncThunk(
  'common/getUserRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Auth/GetUserRoles');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user roles');
    }
  }
);

// Plants
export const getPlants = createAsyncThunk(
  'common/getPlants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Auth/GetAllPlants');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plants');
    }
  }
);

// Security Questions
export const getSecurityQuestions = createAsyncThunk(
  'common/getSecurityQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Auth/GetSecurityQuestion');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch security questions');
    }
  }
);

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Departments
      .addCase(getAllDepartments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
        state.isLoading = false;
      })
      .addCase(getAllDepartments.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Modules
      .addCase(getAllModules.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllModules.fulfilled, (state, action) => {
        state.modules = action.payload;
        state.isLoading = false;
      })
      .addCase(getAllModules.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Component Types
      .addCase(getAllComponentTypes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllComponentTypes.fulfilled, (state, action) => {
        state.componentTypes = action.payload;
        state.isLoading = false;
      })
      .addCase(getAllComponentTypes.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Drawing Numbers
      .addCase(getDrawingNumbers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDrawingNumbers.fulfilled, (state, action) => {
        state.drawingNumbers = action.payload;
        state.isLoading = false;
      })
      .addCase(getDrawingNumbers.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Document Types
      .addCase(getAllDocumentTypes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllDocumentTypes.fulfilled, (state, action) => {
        state.documentTypes = action.payload;
        state.isLoading = false;
      })
      .addCase(getAllDocumentTypes.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Production Series
      .addCase(getAllProductionSeries.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllProductionSeries.fulfilled, (state, action) => {
        state.productionSeries = action.payload;
        state.isLoading = false;
      })
      .addCase(getAllProductionSeries.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Units
      .addCase(getAllUnits.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllUnits.fulfilled, (state, action) => {
        state.units = action.payload;
        state.isLoading = false;
      })
      .addCase(getAllUnits.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // User Roles
      .addCase(getUserRoles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserRoles.fulfilled, (state, action) => {
        state.userRoles = action.payload;
        state.isLoading = false;
      })
      .addCase(getUserRoles.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Plants
      .addCase(getPlants.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPlants.fulfilled, (state, action) => {
        state.plants = action.payload;
        state.isLoading = false;
      })
      .addCase(getPlants.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Security Questions
      .addCase(getSecurityQuestions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSecurityQuestions.fulfilled, (state, action) => {
        state.securityQuestions = action.payload;
        state.isLoading = false;
      })
      .addCase(getSecurityQuestions.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export const { clearError } = commonSlice.actions;
export default commonSlice.reducer; 