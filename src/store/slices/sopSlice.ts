import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface SopState {
  assemblies: any[];
  sopDetails: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SopState = {
  assemblies: [],
  sopDetails: [],
  isLoading: false,
  error: null,
};

export const getAllAssemblies = createAsyncThunk(
  'sop/getAllAssemblies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/sop/allassemblies');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assemblies');
    }
  }
);

export const getSopForAssembly = createAsyncThunk(
  'sop/getSopForAssembly',
  async (request: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/sop/GetSop', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch SOP');
    }
  }
);

export const exportSopForAssembly = createAsyncThunk(
  'sop/exportSopForAssembly',
  async (request: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/sop/exportSop', request, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export SOP');
    }
  }
);

const sopSlice = createSlice({
  name: 'sop',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSopData: (state) => {
      state.assemblies = [];
      state.sopDetails = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Assemblies
      .addCase(getAllAssemblies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllAssemblies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assemblies = action.payload;
        state.error = null;
      })
      .addCase(getAllAssemblies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get SOP for Assembly
      .addCase(getSopForAssembly.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSopForAssembly.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sopDetails = action.payload;
        state.error = null;
      })
      .addCase(getSopForAssembly.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Export SOP for Assembly
      .addCase(exportSopForAssembly.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportSopForAssembly.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(exportSopForAssembly.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSopData } = sopSlice.actions;
export default sopSlice.reducer; 