import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface IRMSNState {
  irmsnList: any[];
  loading: boolean;
  error: string | null;
}

const initialState: IRMSNState = {
  irmsnList: [],
  loading: false,
  error: null,
};

export const fetchIRMSNList = createAsyncThunk(
  'irmsn/fetchIRMSNList',
  async (search: string) => {
    const response = await axios.get(`/api/irmsn?search=${search}`);
    return response.data;
  }
);

export const createIRMSN = createAsyncThunk(
  'irmsn/createIRMSN',
  async (data: any) => {
    const response = await axios.post('/api/irmsn', data);
    return response.data;
  }
);

export const updateIRMSN = createAsyncThunk(
  'irmsn/updateIRMSN',
  async (data: any) => {
    const response = await axios.put(`/api/irmsn/${data.id}`, data);
    return response.data;
  }
);

const irmsnSlice = createSlice({
  name: 'irmsn',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIRMSNList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIRMSNList.fulfilled, (state, action) => {
        state.loading = false;
        state.irmsnList = action.payload;
      })
      .addCase(fetchIRMSNList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch IRMSN list';
      })
      .addCase(createIRMSN.pending, (state) => {
        state.loading = true;
      })
      .addCase(createIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        state.irmsnList.push(action.payload);
      })
      .addCase(createIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create IRMSN';
      })
      .addCase(updateIRMSN.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.irmsnList.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.irmsnList[index] = action.payload;
        }
      })
      .addCase(updateIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update IRMSN';
      });
  },
});

export default irmsnSlice.reducer; 