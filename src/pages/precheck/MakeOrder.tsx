import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const MakeOrder: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        Make Order
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Create and manage orders for precheck components
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page will contain the order creation and management functionality.
          Coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default MakeOrder; 