import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface QRCodeState {
  qrcodeList: any[];
  loading: boolean;
  error: string | null;
}

const initialState: QRCodeState = {
  qrcodeList: [],
  loading: false,
  error: null,
};

export const fetchQRCodeList = createAsyncThunk(
  'qrcode/fetchQRCodeList',
  async () => {
    const response = await axios.get('/api/qrcode');
    return response.data;
  }
);

export const createQRCode = createAsyncThunk(
  'qrcode/createQRCode',
  async (data: any) => {
    const response = await axios.post('/api/qrcode', data);
    return response.data;
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
      });
  },
});

export default qrcodeSlice.reducer; 