import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import type {
  QRCodeItem as ImportedQRCodeItem,
  BarcodeDetails as ImportedBarcodeDetails,
  BatchInfo as ImportedBatchInfo,
  IRNumber,
  MSNNumber
} from '../../types';

interface QRCodeState {
  qrcodeList: ImportedQRCodeItem[];
  consumedInList: any[];
  barcodeDetails: ImportedBarcodeDetails | null;
  storedComponents: any[];
  irNumbers: IRNumber[];
  msnNumbers: MSNNumber[];
  batchItems: ImportedBatchInfo[];
  loading: boolean;
  error: string | null;
  generatedNumber: string | null;
  isDownloading: boolean;
  storeInQRCodeDetails: ImportedBarcodeDetails | null;
}

interface QRCodePayload {
  productionSeriesId: number;
  componentTypeId: number;
  nomenclatureId: number;
  lnItemCodeId: number;
  rackLocationId: number;
  irNumberId: number;
  msnNumberId: number;
  desposition: string;
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
  isDownloading?: boolean;
}

const initialState: QRCodeState = {
  qrcodeList: [],
  consumedInList: [],
  barcodeDetails: null,
  storedComponents: [],
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

// Generate Standard Field QR Code
export const generateStandardFieldQRCode = createAsyncThunk(
  'qrcode/generateStandardFieldQRCode',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/QRCode/GenerateStandardFieldQRCodeDetails', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate standard field QR code');
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

// Get Barcode Details with Parameters
export const getBarcodeDetailsWithParameters = createAsyncThunk(
  'qrcode/getBarcodeDetailsWithParameters',
  async (params: { prodSeriesId: number; drawingNumberId: number }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/QRCode/GetBarcodeDetailsWithParameters?ProdSeriesId=${params.prodSeriesId}&DrawingNumberId=${params.drawingNumberId}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch barcode details');
    }
  }
);

// Get Stored Components by Date
export const getStoredComponentsByDate = createAsyncThunk(
  'qrcode/getStoredComponentsByDate',
  async (storeInDate: string, { rejectWithValue }) => {
    try {
      // Format date as yyyy-MM-dd for the API endpoint
      const dateObj = new Date(storeInDate.split('/').reverse().join('-'));
      const formattedDate = dateObj.toISOString().split('T')[0]; // yyyy-MM-dd format
      
      const response = await api.get(
        `/api/QRCode/GetStoredComponentsByDate/${formattedDate}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stored components');
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
    if (!qrCodeId) {
      return rejectWithValue('QR code ID must be provided');
    }

    try {
      const response = await api.post('/api/QRCode/ExportQrCode', [qrCodeId], {
        responseType: 'blob',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.size > 0) {
        // Create download link for Excel file
        const url = window.URL.createObjectURL(new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }));
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${qrCodeId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'File downloaded successfully' };
      } else {
        throw new Error('No file content received from the API');
      }
    } catch (error: any) {
      console.error('Error exporting QR code:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to export QR code to Excel'
      );
    }
  }
);

// Export Bulk QR Codes
export const exportBulkQRCodes = createAsyncThunk(
  'qrcode/exportBulkQRCodes',
  async (qrCodes: string[], { rejectWithValue }) => {
    if (!qrCodes || qrCodes.length === 0) {
      return rejectWithValue('At least one QR code must be provided');
    }

    try {
      const response = await api.post('/api/QRCode/ExportQrCode', qrCodes, {
        responseType: 'blob',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.size > 0) {
        // Create download link for Excel file
        const url = window.URL.createObjectURL(new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }));
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `QRCodes_Bulk_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Bulk QR codes downloaded successfully' };
      } else {
        throw new Error('No file content received from the API');
      }
    } catch (error: any) {
      console.error('Error exporting bulk QR codes:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to export bulk QR codes to Excel'
      );
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
  async (searchQuery: string, { rejectWithValue }) => {
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
      // Preserve the original error structure for proper error handling
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.message) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue("Error fetching QR code details");
      }
    }
  }
);

export const exportStoredComponents = createAsyncThunk(
  'qrcode/exportStoredComponents',
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/QRCode/ExportStoredInComponentsByDate/${date}`, null, {
        responseType: 'blob'
      });

      if (response.data) {
        // Create download link for Excel file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `StoredComponents_${date}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Components exported successfully' };
      } else {
        throw new Error('No file content received from the API');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export components');
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
    clearBarcodeDetails: (state) => {
      state.barcodeDetails = null;
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

      // Generate Standard Field QR Code
      .addCase(generateStandardFieldQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateStandardFieldQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.qrcodeList = action.payload;
      })
      .addCase(generateStandardFieldQRCode.rejected, (state, action) => {
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

      // Get Barcode Details with Parameters
      .addCase(getBarcodeDetailsWithParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBarcodeDetailsWithParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.barcodeDetails = action.payload;
      })
      .addCase(getBarcodeDetailsWithParameters.rejected, (state, action) => {
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
      })

      // Get Stored Components by Date
      .addCase(getStoredComponentsByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStoredComponentsByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.storedComponents = action.payload;
      })
      .addCase(getStoredComponentsByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearGeneratedNumber, clearQRCodeList, setIsDownloading, clearBarcodeDetails } = qrcodeSlice.actions;
export default qrcodeSlice.reducer; 