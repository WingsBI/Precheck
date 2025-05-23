import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { makePrecheckOrder } from '../../store/slices/precheckSlice';
import type { RootState } from '../../store/store';

const MakeOrder: React.FC = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ item: '', quantity: '', date: '' });
  const { loading } = useSelector((state: RootState) => state.precheck);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(makePrecheckOrder(form));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Make Precheck Order</Typography>
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
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default MakeOrder; 