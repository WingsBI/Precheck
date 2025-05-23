import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { storeInPrecheck } from '../../store/slices/precheckSlice';
import type { RootState } from '../../store/store';

const StoreIn: React.FC = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ item: '', quantity: '', date: '' });
  const { isLoading } = useSelector((state: RootState) => state.precheck);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(storeInPrecheck(form) as any);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Precheck Store In</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Item"
            name="item"
            value={form.item}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Quantity"
            name="quantity"
            value={form.quantity}
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
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading}>
            {isLoading ? 'Storing...' : 'Store In'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default StoreIn; 