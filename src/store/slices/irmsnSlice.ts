import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface IRMSNItem {
  id: number;
  irNumber?: string;
  msnNumber?: string;
  drawingNumber: string;
  productionSeries: string;
  nomenclature: string;
  idNumberRange: string;
  quantity: number;
  projectNumber: string;
  poNumber: string;
  stage: string;
  supplier?: string;
  remark?: string;
  createdDate: string;
  userName: string;
}

interface IRMSNState {
  irmsnList: IRMSNItem[];
  searchResults: IRMSNItem[];
  loading: boolean;
  error: string | null;
  generatedNumber: string | null;
}

const initialState: IRMSNState = {
  irmsnList: [],
  searchResults: [],
  loading: false,
  error: null,
  generatedNumber: null,
};

// Search IRMSN
export const searchIRMSN = createAsyncThunk(
  'irmsn/searchIRMSN',
  async ({ documentType, searchTerm }: { documentType: 'IR' | 'MSN', searchTerm: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/IRMSN/Search`, {
        params: { documentType, searchTerm }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search IRMSN');
    }
  }
);

// Generate IRMSN
export const generateIRMSN = createAsyncThunk(
  'irmsn/generateIRMSN',
  async (data: any, { rejectWithValue }) => {
    try {
      const endpoint = data.documentType === 'IR' ? '/api/reports/IRNumber' : '/api/reports/MSNNumber';
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate IRMSN number');
    }
  }
);

// Update IRMSN
export const updateIRMSN = createAsyncThunk(
  'irmsn/updateIRMSN',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/IRMSN/${data.id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update IRMSN');
    }
  }
);

const irmsnSlice = createSlice({
  name: 'irmsn',
  initialState,
  reducers: {
    clearGeneratedNumber: (state) => {
      state.generatedNumber = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search IRMSN
      .addCase(searchIRMSN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Generate IRMSN
      .addCase(generateIRMSN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedNumber = action.payload.irNumber;
      })
      .addCase(generateIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update IRMSN
      .addCase(updateIRMSN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = state.searchResults.map(item =>
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(updateIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGeneratedNumber, clearError } = irmsnSlice.actions;
export default irmsnSlice.reducer; 