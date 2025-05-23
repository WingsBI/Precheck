import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { createQRCode } from '../../store/slices/qrcodeSlice';
import type { RootState } from '../../store/store';

const CreateQRCode: React.FC = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ code: '', date: '' });
  const { loading } = useSelector((state: RootState) => state.qrcode);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createQRCode(form));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create QR Code</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Code"
            name="code"
            value={form.code}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateQRCode; 