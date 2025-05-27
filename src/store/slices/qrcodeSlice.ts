import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface QRCodeState {
  qrcodeList: QRCodeItem[];
  barcodeDetails: BarcodeDetails | null;
  loading: boolean;
  error: string | null;
  generatedNumber: string | null;
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
  disposition: string;
  users: string;
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
}

const initialState: QRCodeState = {
  qrcodeList: [],
  barcodeDetails: null,
  loading: false,
  error: null,
  generatedNumber: null
};

// Thunks
export const generateQRCode = createAsyncThunk(
  'qrcode/generateQRCode',
  async (payload: QRCodePayload) => {
    const response = await api.post('/api/QRCode/GenerateQRCode', payload);
    return response.data;
  }
);

export const getBarcodeDetails = createAsyncThunk(
  'qrcode/getBarcodeDetails',
  async (qrCodeNumber: string) => {
    const response = await api.get(`/api/QRCode/GetBarcodeDetails?QRCodeNumber=${qrCodeNumber}`);
    return response.data;
  }
);

export const generateBatchQRCode = createAsyncThunk(
  'qrcode/generateBatchQRCode',
  async (payload: { drawingNumberId: number, quantity: number }) => {
    const response = await api.post('/api/QRCode/GenerateBatchQRCode', payload);
    return response.data;
  }
);

export const exportQRCode = createAsyncThunk(
  'qrcode/exportQRCode',
  async (qrCodeId: string) => {
    const response = await api.get(`/api/QRCode/ExportQRCode?qrCodeId=${qrCodeId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
);

export const exportBulkQRCodes = createAsyncThunk(
  'qrcode/exportBulkQRCodes',
  async (qrCodes: string[]) => {
    const response = await api.post('/api/QRCode/ExportBulkQRCodes', qrCodes, {
      responseType: 'blob'
    });
    return response.data;
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
    }
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
        state.error = action.error.message || 'Failed to generate QR code';
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
        state.error = action.error.message || 'Failed to get barcode details';
      })
      // Generate Batch QR Code
      .addCase(generateBatchQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBatchQRCode.fulfilled, (state, action) => {
        state.loading = false;
        // Handle batch QR code response
      })
      .addCase(generateBatchQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate batch QR code';
      });
  }
});

export const { clearError, clearGeneratedNumber } = qrcodeSlice.actions;
export default qrcodeSlice.reducer; 