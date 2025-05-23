import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ViewBarcode: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        View QR Code
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View and manage existing QR codes
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          QR Code Viewer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page will contain the QR code viewing and management functionality.
          Coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default ViewBarcode; 