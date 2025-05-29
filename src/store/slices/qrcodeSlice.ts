import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import type {
  QRCodeItem as ImportedQRCodeItem,
  BarcodeDetails as ImportedBarcodeDetails,
  QRCodePayload as ImportedQRCodePayload,
  BatchInfo as ImportedBatchInfo,
  IRNumber,
  MSNNumber
} from '../../types';

interface QRCodeState {
  qrcodeList: ImportedQRCodeItem[];
  consumedInList: any[];
  barcodeDetails: ImportedBarcodeDetails | null;
  irNumbers: IRNumber[];
  msnNumbers: MSNNumber[];
  batchItems: ImportedBatchInfo[];
  loading: boolean;
  error: string | null;
  generatedNumber: string | null;
  isDownloading: boolean;
  storeInQRCodeDetails: ImportedBarcodeDetails | null;
}

interface QRCodeItem {
  id: number;
  serialNumber: string;
  qrCodeData: string;
  qrCodeImage: string;
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  createdDate: string;
  isSelected: boolean;
  status: 'pending' | 'printed' | 'used';
}

interface BarcodeDetails {
  qrCodeNumber: string;
  productionSeriesId: number;
  drawingNumber: string;
  nomenclature: string;
  consumedInDrawing: string;
  qrCodeStatus: string;
  irNumber: string;
  msnNumber: string;
  mrirNumber: string;
  quantity: number;
  desposition: string;
  users: string;
  productionOrderNumber: string;
  projectNumber: string;
  idNumber: string;
  productionSeries: string;
}

interface QRCodePayload {
  productionSeriesId: number;
  componentTypeId: number;
  nomenclatureId: number;
  lnItemCodeId: number;
  rackLocationId: number;
  irNumberId: number;
  msnNumberId: number;
  disposition: string;
  productionOrderNumber: string;
  projectNumber: string;
  expiryDate: string;
  manufacturingDate: string;
  drawingNumberId: number;
  unitId: number;
  mrirNumber: string;
  remark: string;
  quantity: number;
  ids: number[];
  idNumber?: string;
  batchIds: BatchInfo[];
}

interface BatchInfo {
  quantity: number;
  batchQuantity: number;
  assemblyDrawingId: number;
  isDownloading: boolean;
}

const initialState: QRCodeState = {
  qrcodeList: [],
  consumedInList: [],
  barcodeDetails: null,
  irNumbers: [],
  msnNumbers: [],
  batchItems: [],
  loading: false,
  error: null,
  generatedNumber: null,
  isDownloading: false,
  storeInQRCodeDetails: null,
};

// Generate QR Code
export const generateQRCode = createAsyncThunk(
  'qrcode/generateQRCode',
  async (payload: QRCodePayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/QRCode/GenerateQRCode', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate QR code');
    }
  }
);

// Get Barcode Details
export const getBarcodeDetails = createAsyncThunk(
  'qrcode/getBarcodeDetails',
  async (searchQuery: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`api/QRCode/GetBarcodeDetails?QRCodeNumber=${searchQuery}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch barcode details');
    }
  }
);

// Generate Batch QR Code
export const generateBatchQRCode = createAsyncThunk(
  'qrcode/generateBatchQRCodeDetails',
  async (payload: { drawingNumberId: number, quantity: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/QRCode/GenerateBatchQRCodeDetails', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate batch QR code');
    }
  }
);

// Export Single QR Code
export const exportQRCode = createAsyncThunk(
  'qrcode/exportQRCode',
  async (qrCodeId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/QRCode/ExportQRCode?qrCodeId=${qrCodeId}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QRCode_${qrCodeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export QR code');
    }
  }
);

// Export Bulk QR Codes
export const exportBulkQRCodes = createAsyncThunk(
  'qrcode/exportBulkQRCodes',
  async (qrCodes: string[], { rejectWithValue }) => {
    try {
      const response = await api.post('/api/QRCode/ExportBulkQRCodes', qrCodes, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QRCodes_Bulk.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export bulk QR codes');
    }
  }
);

// Get Consumed In Data
export const getConsumedIn = createAsyncThunk(
  'qrcode/getConsumedIn',
  async (params: {
    ProdSeriesId?: number;
    IdNumber?: number;
    DrawingNumberId?: number;
    AssemblyNumber?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/QRCode/GetConsumedIn', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get consumed in data');
    }
  }
);

// Fetch IR Numbers for QR Code
export const fetchIRNumbers = createAsyncThunk(
  'qrcode/fetchIRNumbers',
  async (searchText: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/reports/GetIRNumberByDrawingNumber', {
        params: {
          DrawingNumber: '',
          Stage: '',
          Productionseries: '',
          DepartmentTypeId: ''
        }
      });

      let filteredData = response.data;
      if (searchText && searchText.length >= 3) {
        filteredData = response.data.filter((item: IRNumber) =>
          item.irNumber?.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      return filteredData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch IR numbers');
    }
  }
);

// Fetch MSN Numbers for QR Code
export const fetchMSNNumbers = createAsyncThunk(
  'qrcode/fetchMSNNumbers',
  async (searchText: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/reports/GetMSNNumberByDrawingNumber', {
        params: {
          DrawingNumber: '',
          Stage: '',
          Productionseries: '',
          DepartmentTypeId: ''
        }
      });

      let filteredData = response.data;
      if (searchText && searchText.length >= 3) {
        filteredData = response.data.filter((item: MSNNumber) =>
          item.msnNumber?.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      return filteredData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch MSN numbers');
    }
  }
);

// Action to update QR code details for store-in
export const updateQrCodeDetails = createAsyncThunk(
  'qrcode/updateQrCodeDetails',
  async (searchQuery: string) => {
    try {
      const response = await api.post('/api/QRCode/ComponentStoreIn', JSON.stringify(searchQuery), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error("No response received from barcode details endpoint");
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error("Error fetching QR code details: " + (error.message || error));
    }
  }
);
const qrcodeSlice = createSlice({
  name: 'qrcode',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGeneratedNumber: (state) => {
      state.generatedNumber = null;
    },
    clearQRCodeList: (state) => {
      state.qrcodeList = [];
    },
    setIsDownloading: (state, action) => {
      state.isDownloading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate QR Code
      .addCase(generateQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.qrcodeList = action.payload;
        state.generatedNumber = action.payload[0]?.qrCodeNumber || null;
      })
      .addCase(generateQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Barcode Details
      .addCase(getBarcodeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBarcodeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.barcodeDetails = action.payload;
      })
      .addCase(getBarcodeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Generate Batch QR Code
      .addCase(generateBatchQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBatchQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.batchItems = action.payload;
      })
      .addCase(generateBatchQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Export QR Code
      .addCase(exportQRCode.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(exportQRCode.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(exportQRCode.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = action.payload as string;
      })

      // Export Bulk QR Codes
      .addCase(exportBulkQRCodes.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(exportBulkQRCodes.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(exportBulkQRCodes.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = action.payload as string;
      })

      // Get Consumed In
      .addCase(getConsumedIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getConsumedIn.fulfilled, (state, action) => {
        state.loading = false;
        state.consumedInList = action.payload;
      })
      .addCase(getConsumedIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch IR Numbers
      .addCase(fetchIRNumbers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIRNumbers.fulfilled, (state, action) => {
        state.loading = false;
        state.irNumbers = action.payload;
      })
      .addCase(fetchIRNumbers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch MSN Numbers
      .addCase(fetchMSNNumbers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMSNNumbers.fulfilled, (state, action) => {
        state.loading = false;
        state.msnNumbers = action.payload;
      })
      .addCase(fetchMSNNumbers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Handle updateQrCodeDetails
      .addCase(updateQrCodeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQrCodeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.storeInQRCodeDetails = action.payload;
      })
      .addCase(updateQrCodeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error updating QR code details';
      });
  },
});

export const { clearError, clearGeneratedNumber, clearQRCodeList, setIsDownloading } = qrcodeSlice.actions;
export default qrcodeSlice.reducer; 