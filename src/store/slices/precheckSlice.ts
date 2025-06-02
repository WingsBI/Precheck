import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface PrecheckState {
  assemblyDrawings: any[];
  precheckDetails: any[];
  precheckStatus: any[];
  availableComponents: any[];
  storeInData: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PrecheckState = {
  assemblyDrawings: [],
  precheckDetails: [],
  precheckStatus: [],
  availableComponents: [],
  storeInData: [],
  isLoading: false,
  error: null,
};

export const getAssemblyDrawing = createAsyncThunk(
  'precheck/getAssemblyDrawing',
  async (assemblyNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/precheck/${assemblyNumber}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assembly drawing');
    }
  }
);

export const makePrecheck = createAsyncThunk(
  'precheck/makePrecheck',
  async (request: any[], { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Precheck/MakePrecheck', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to make precheck');
    }
  }
);

export const viewPrecheckDetails = createAsyncThunk(
  'precheck/viewPrecheckDetails',
  async (request: any, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/precheck/ViewPrecheck', { params: request });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to view precheck details');
    }
  }
);

export const getPrecheckStatus = createAsyncThunk(
  'precheck/getPrecheckStatus',
  async (request: any, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/precheck/GetPrecheckStatus', { params: request });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get precheck status');
    }
  }
);

export const getAvailableComponents = createAsyncThunk(
  'precheck/getAvailableComponents',
  async (qrCode: string, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/precheck/GetStoreAvailablComponents/${qrCode}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get available components');
    }
  }
);

export const getStoreAvailableComponents = createAsyncThunk(
  'precheck/getStoreAvailableComponents',
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/Precheck/GetStoreAvailablComponents/${qrCode}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get store available components');
    }
  }
);

export const getAvailableComponentsForBOM = createAsyncThunk(
  'precheck/getAvailableComponentsForBOM',
  async (requestData: {
    prodSeriesId: number;
    drawingNumberId: number;
    quantity: number;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Precheck/GetAvailablComponents', requestData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get available components for BOM');
    }
  }
);

export const fetchConsumptionList = createAsyncThunk(
  'precheck/fetchConsumptionList',
  async (params: any, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/precheck/consumption-list', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch consumption list');
    }
  }
);

export const makePrecheckOrder = createAsyncThunk(
  'precheck/makePrecheckOrder',
  async (orderData: {
    productionOrderNumber: string;
    productionSeriesId: number;
    drawingNumberId: number;
    createdBy: number;
    ids: number[];
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Precheck/MakePrecheckOrder', orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to make precheck order');
    }
  }
);

export const storeInPrecheck = createAsyncThunk(
  'precheck/storeInPrecheck',
  async (payload: any) => {
    try {
      const response = await api.post('api/Precheck/StoreInPrecheck', payload);
      return response.data;
    } catch (error) {
      throw new Error('Error storing precheck');
    }
  }
);

export const exportPrecheckDetails = createAsyncThunk(
  'precheck/exportPrecheckDetails',
  async (exportData: {
    productionOrderNumber?: string;
    productionSeriesId?: number;
    id?: number;
    drawingNumberId?: number;
  }, { rejectWithValue }) => {
    try {
      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(exportData).filter(([_, value]) => value !== undefined)
      );

      const response = await api.post('/api/Precheck/ExportPrecheckdetails', filteredData, {
        responseType: 'blob',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.size > 0) {
        // Create download link for PDF file
        const url = window.URL.createObjectURL(new Blob([response.data], { 
          type: 'application/pdf'
        }));
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PrecheckExport_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Precheck details exported successfully' };
      } else {
        throw new Error('No file content received from the API');
      }
    } catch (error: any) {
      console.error('Error exporting precheck details:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to export precheck details'
      );
    }
  }
);

export const getStoreInData = createAsyncThunk(
  'precheck/getStoreInData',
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/Precheck/GetStoreAvailablComponents/${qrCode}`);
      if (!response.data) {
        throw new Error("No store-in data found");
      }
      return response.data;
    } catch (error: any) {
      throw new Error("Error fetching store-in data: " + (error.message || error));
    }
  }
);

const precheckSlice = createSlice({
  name: 'precheck',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPrecheckData: (state) => {
      state.assemblyDrawings = [];
      state.precheckDetails = [];
      state.precheckStatus = [];
      state.availableComponents = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Assembly Drawing
      .addCase(getAssemblyDrawing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAssemblyDrawing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assemblyDrawings = action.payload;
        state.error = null;
      })
      .addCase(getAssemblyDrawing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Make Precheck
      .addCase(makePrecheck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makePrecheck.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(makePrecheck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // View Precheck Details
      .addCase(viewPrecheckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(viewPrecheckDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.precheckDetails = action.payload;
        state.error = null;
      })
      .addCase(viewPrecheckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Precheck Status
      .addCase(getPrecheckStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPrecheckStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.precheckStatus = action.payload;
        state.error = null;
      })
      .addCase(getPrecheckStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Available Components
      .addCase(getAvailableComponents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableComponents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableComponents = action.payload;
        state.error = null;
      })
      .addCase(getAvailableComponents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Store Available Components
      .addCase(getStoreAvailableComponents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStoreAvailableComponents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableComponents = action.payload;
        state.error = null;
      })
      .addCase(getStoreAvailableComponents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Available Components for BOM
      .addCase(getAvailableComponentsForBOM.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableComponentsForBOM.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableComponents = action.payload;
        state.error = null;
      })
      .addCase(getAvailableComponentsForBOM.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Consumption List
      .addCase(fetchConsumptionList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConsumptionList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.precheckDetails = action.payload;
        state.error = null;
      })
      .addCase(fetchConsumptionList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Make Precheck Order
      .addCase(makePrecheckOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makePrecheckOrder.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(makePrecheckOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Store In Precheck
      .addCase(storeInPrecheck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(storeInPrecheck.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(storeInPrecheck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error storing precheck';
      })
      // Export Precheck Details
      .addCase(exportPrecheckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportPrecheckDetails.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(exportPrecheckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Store In Data
      .addCase(getStoreInData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStoreInData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storeInData = action.payload;
      })
      .addCase(getStoreInData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching store-in data';
      });
  },
});

export const { clearError, clearPrecheckData } = precheckSlice.actions;
export default precheckSlice.reducer; 