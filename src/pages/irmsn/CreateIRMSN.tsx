import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { createIRMSN } from '../../store/slices/irmsnSlice';
import type { RootState, AppDispatch } from '../../store/store';

const CreateIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({ name: '', status: '', date: '' });
  const { loading } = useSelector((state: RootState) => state.irmsn);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (dispatch as any)(createIRMSN(form));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create IRMSN</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Status"
            name="status"
            value={form.status}
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

export default CreateIRMSN; 