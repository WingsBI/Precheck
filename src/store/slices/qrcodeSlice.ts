import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface QRCodeState {
  qrcodeList: QRCodeItem[];
  consumedInList: any[];
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
  consumedInList: [],
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
    const qrcodeSlice = createSlice({
      name: 'qrcode',
      initialState,
      reducers: {},
      extraReducers: (builder) => {
        builder
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
            state.error = action.error.message || 'Failed to fetch barcode details';
          })

          .addCase(getConsumedIn.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(getConsumedIn.fulfilled, (state, action) => {
            state.loading = false;
            state.consumedInList = action.payload;
            state.error = null;
          })
          .addCase(getConsumedIn.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
          })
      },
    });

export default qrcodeSlice.reducer; 