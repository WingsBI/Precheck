import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Types
interface SopAssemblyItem {
  serialNumber: number;
  drawingNumber: string;
  nomenclature: string;
  idNumber: string;
  quantity: number;
  irNumber: string;
  msnNumber: string;
  remarks: string;
  assemblyNumber: string;
  parentId?: string;
  level?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
}

interface GetSopRequestDto {
  assemblyDrawingId: number;
  serielNumberId: number;
  prodSeriesId: number;
}

interface SopState {
  assemblies: any[];
  sopDetails: any[];
  assemblyData: SopAssemblyItem[];
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;
  searchCriteria: GetSopRequestDto | null;
}

const initialState: SopState = {
  assemblies: [],
  sopDetails: [],
  assemblyData: [],
  isLoading: false,
  isExporting: false,
  error: null,
  searchCriteria: null,
};

export const getAllAssemblies = createAsyncThunk(
  'sop/getAllAssemblies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/Sop/allassemblies');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assemblies');
    }
  }
);

export const getSopForAssembly = createAsyncThunk(
  'sop/getSopForAssembly',
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Sop/GetSop', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch SOP');
    }
  }
);

export const getSopAssemblyData = createAsyncThunk(
  'sop/getSopAssemblyData',
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Sop/GetSop', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assembly data');
    }
  }
);

export const exportSopForAssembly = createAsyncThunk(
  'sop/exportSopForAssembly',
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Sop/exportSop', request, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export SOP');
    }
  }
);

export const exportSopAssemblyData = createAsyncThunk(
  'sop/exportSopAssemblyData',
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/Sop/exportSop', request, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SOP_Assembly_Export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export assembly data');
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
      state.assemblyData = [];
      state.error = null;
      state.searchCriteria = null;
    },
    clearAssemblyData: (state) => {
      state.assemblyData = [];
      state.searchCriteria = null;
    },
    toggleAssemblyExpansion: (state, action) => {
      const { serialNumber } = action.payload;
      const item = state.assemblyData.find(item => item.serialNumber === serialNumber);
      if (item) {
        item.isExpanded = !item.isExpanded;
      }
    },
    setSearchCriteria: (state, action) => {
      state.searchCriteria = action.payload;
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
      // Get SOP Assembly Data
      .addCase(getSopAssemblyData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSopAssemblyData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assemblyData = action.payload.map((item: any, index: number) => ({
          ...item,
          serialNumber: index + 1,
          isExpanded: false,
          hasChildren: false, // This should be determined by your API
          level: 0, // This should be determined by your API
        }));
        state.error = null;
      })
      .addCase(getSopAssemblyData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Export SOP for Assembly
      .addCase(exportSopForAssembly.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSopForAssembly.fulfilled, (state) => {
        state.isExporting = false;
        state.error = null;
      })
      .addCase(exportSopForAssembly.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      })
      // Export SOP Assembly Data
      .addCase(exportSopAssemblyData.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSopAssemblyData.fulfilled, (state) => {
        state.isExporting = false;
        state.error = null;
      })
      .addCase(exportSopAssemblyData.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearSopData, 
  clearAssemblyData, 
  toggleAssemblyExpansion,
  setSearchCriteria 
} = sopSlice.actions;

export default sopSlice.reducer; 