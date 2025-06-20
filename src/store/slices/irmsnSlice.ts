import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface IRMSNItem {
  id: number;
  irNumber?: string;
  msnNumber?: string;
  drawingNumberId: number | null;
  productionSeriesName: string | null;
  stage: string;
  productionOrderNumber: string | null;
  nomenclatureId: number | null;
  componentTypeId: number | null;
  quantity: number;
  remark: string | null;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number | null;
  modifiedDate: string | null;
  projectNumber: string;
  supplier: string | null;
  isActive: boolean | null;
  drawingNumberIdName: string | null;
  nomenclature: string;
  componentType: string | null;
  prodSeriesId: number;
  idNumberStart: number | null;
  idNumberEnd: number | null;
  userName: string | null;
  departmentId: number;
  idNumberRange: string | null;
  sequenceNo: number;
  // Computed fields for compatibility
  drawingNumber?: string;
  productionSeries?: string;
  poNumber?: string;
}

interface IRMSNState {
  irmsnList: IRMSNItem[];
  msnList: IRMSNItem[];
  searchResults: IRMSNItem[];
  loading: boolean;
  error: string | null;
  generatedNumber: string | null;
}

const initialState: IRMSNState = {
  irmsnList: [],
  msnList: [],
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
  async (data: any, { rejectWithValue, getState }) => {
    try {
      // Get user context from auth state like C# controller does automatically
      const state = getState() as any;
      const currentUser = state.auth.user;
      
      // Add user context to the payload like C# controller does from JWT
      const enhancedData = {
        ...data,
        // Map React form fields to API expected fields
        drawingNumberId: data.drawingNumberId || data.DrawingNumberId,
        nomenclatureId: data.nomenclatureId || data.NomenclatureId,
        componentTypeId: data.componentTypeId || data.ComponentTypeId,
        prodSeriesId: data.prodSeriesId || data.ProdSeriesId,
        // 🔧 CRITICAL FIX: Map idRange to idNumberRange for proper storage
        idNumberRange: data.idNumberRange || data.idRange || "",
        // Also send original idRange for backwards compatibility
        idRange: data.idRange || data.idNumberRange || "",
        // User context fields (matching C# controller behavior)
        createdBy: data.createdBy || (currentUser?.id || currentUser?.userid ? 
          Number(currentUser.id || currentUser.userid) : undefined),
        departmentId: data.departmentId || (currentUser?.deptid ? 
          Number(currentUser.deptid) : undefined),
        departmentName: data.departmentName || currentUser?.department || '',
        // Additional field mappings
        productionOrderNumber: data.poNumber || data.productionOrderNumber,
        productionSeries: data.productionSeries,
        drawingNumber: data.drawingNumber,
      };
      
      const endpoint = data.documentType === 'IR' ? '/api/reports/IRNumber' : '/api/reports/MSNNumber';
      console.log(`Generating ${data.documentType} with enhanced payload:`, enhancedData);
      
      const response = await api.post(endpoint, enhancedData);
      console.log(`${data.documentType} generation response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Generation error:', error.response?.data || error);
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

// Generate IRMSN
export const fetchIRMSNList = createAsyncThunk(
  'irmsn/fetchIRMSNList',
  async ({ drawingNumber, stage, productionSeries, departmentTypeId }: { 
    drawingNumber?: string, 
    stage?: string, 
    productionSeries?: string, 
    departmentTypeId?: string 
  }, { rejectWithValue, getState }) => {
    try {
      // Get user context from auth state like C# version
      const state = getState() as any;
      const currentUser = state.auth.user;
      
      const params = {
          DrawingNumber: drawingNumber || '',
          Stage: stage || '',
          Productionseries: productionSeries || '',
        DepartmentTypeId: departmentTypeId || '',
        // Add user context like C# controller does
        userId: currentUser?.id || currentUser?.userid ? 
          Number(currentUser.id || currentUser.userid) : undefined,
        departmentId: currentUser?.deptid ? 
          Number(currentUser.deptid) : undefined
      };
      console.log('Fetching IR numbers with params:', params); // Debug log
      const response = await api.get('/api/reports/GetIRNumberByDrawingNumber', { params });
      console.log('IR numbers response:', response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch IR numbers:', error); // Debug log
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch IR numbers');
    }
  }
);

// Fetch MSN List
export const fetchMSNList = createAsyncThunk(
  'irmsn/fetchMSNList',
  async ({ drawingNumber, stage, productionSeries, departmentTypeId }: { 
    drawingNumber?: string, 
    stage?: string, 
    productionSeries?: string, 
    departmentTypeId?: string 
  }, { rejectWithValue, getState }) => {
    try {
      // Get user context from auth state like C# version
      const state = getState() as any;
      const currentUser = state.auth.user;
      
      const params = {
          DrawingNumber: drawingNumber || '',
          Stage: stage || '',
          Productionseries: productionSeries || '',
        DepartmentTypeId: departmentTypeId || '',
        // Add user context like C# controller does
        userId: currentUser?.id || currentUser?.userid ? 
          Number(currentUser.id || currentUser.userid) : undefined,
        departmentId: currentUser?.deptid ? 
          Number(currentUser.deptid) : undefined
      };
      console.log('Fetching MSN numbers with params:', params); // Debug log
      const response = await api.get('/api/reports/GetMSNNumberByDrawingNumber', { params });
      console.log('MSN numbers response:', response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch MSN numbers:', error); // Debug log
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch MSN numbers');
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
    clearTables: (state) => {
      state.irmsnList = [];
      state.msnList = [];
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
      // Fetch IRMSN List
      .addCase(fetchIRMSNList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIRMSNList.fulfilled, (state, action) => {
        state.loading = false;
        state.irmsnList = action.payload;
      })
      .addCase(fetchIRMSNList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch MSN List
      .addCase(fetchMSNList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMSNList.fulfilled, (state, action) => {
        state.loading = false;
        console.log('MSN List received:', action.payload); // Debug log
        state.msnList = action.payload;
      })
      .addCase(fetchMSNList.rejected, (state, action) => {
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
        // Handle both IR and MSN numbers
        console.log('Generated number response:', action.payload); // Debug log
        state.generatedNumber = action.payload.irNumber || action.payload.msnNumber;
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

export const { clearGeneratedNumber, clearError, clearTables } = irmsnSlice.actions;
export default irmsnSlice.reducer; 