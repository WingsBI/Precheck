import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface QRCodeState {
  qrcodeList: any[];
  consumedInList: any[];
  barcodeDetails: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: QRCodeState = {
  qrcodeList: [],
  barcodeDetails: null,
  consumedInList: [],
  loading: false,
  error: null,
};

export const fetchQRCodeList = createAsyncThunk(
  'qrcode/fetchQRCodeList',
  async () => {
    const response = await api.get('/api/qrcode');
    return response.data;
  }
);

export const createQRCode = createAsyncThunk(
  'qrcode/createQRCode',
  async (data: any) => {
    const response = await api.post('/api/qrcode', data);
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
          .addCase(fetchQRCodeList.pending, (state) => {
            state.loading = true;
          })
          .addCase(fetchQRCodeList.fulfilled, (state, action) => {
            state.loading = false;
            state.qrcodeList = action.payload;
          })
          .addCase(fetchQRCodeList.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch QR code list';
          })
          .addCase(createQRCode.pending, (state) => {
            state.loading = true;
          })
          .addCase(createQRCode.fulfilled, (state, action) => {
            state.loading = false;
            state.qrcodeList.push(action.payload);
          })
          .addCase(createQRCode.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to create QR code';
          })

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
          });
      },
    });

    export default qrcodeSlice.reducer; 