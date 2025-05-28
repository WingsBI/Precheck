import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { getBarcodeDetails } from '../../store/slices/qrcodeSlice';
import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";

interface QRCodeData {
  qrcodeId: string;
  prodSeries: string;
  drawingNumber: string;
  nomenclature: string;
  consumedInDrawing: string;
  status: string;
  irNumber: string;
  msnNumber: string;
  mrirNumber: string;
  quantity: string;
  disposition: string;
  username: string;
}



const ViewBarcode: React.FC = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const { barcodeDetails, loading, error } = useSelector((state: RootState) => state.qrcode);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    dispatch(getBarcodeDetails(searchQuery));
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download clicked');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ p: 3.5 ,}}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        View QR Code
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View and download existing QR codes
      </Typography>
      
      <Paper sx={{ p: 0.5, mt: 3 ,pl: 2 ,pr: 2, width: '75vw'}}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 , alignItems: 'center' }}>
          <TextField
            sx={{width: '500px'}}
            variant="outlined"
            placeholder="Search QR Code ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: loading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            size="small"
            error={!!error}
            helperText={error}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ minWidth: '120px',marginLeft: 'auto'  }}
            size="small"
          >
            Download
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="QR codes table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>QRCode ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Prod Series</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Drawing Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nomenclature</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ConsumedInDrawing</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>IR Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>MSN Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>MRIR Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Disposition</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {barcodeDetails && (
                <TableRow>
                  <TableCell>{barcodeDetails.qrCodeNumber}</TableCell>
                  <TableCell>{barcodeDetails.productionSeriesId}</TableCell>
                  <TableCell>{barcodeDetails.drawingNumber}</TableCell>
                  <TableCell>{barcodeDetails.nomenclature}</TableCell>
                  <TableCell>{barcodeDetails.consumedInDrawing}</TableCell>
                  <TableCell>{barcodeDetails.qrCodeStatus}</TableCell>
                  <TableCell>{barcodeDetails.irNumber}</TableCell>
                  <TableCell>{barcodeDetails.msnNumber}</TableCell>
                  <TableCell>{barcodeDetails.mrirNumber}</TableCell>
                  <TableCell>{barcodeDetails.quantity}</TableCell>
                  <TableCell>{barcodeDetails.disposition}</TableCell>
                  <TableCell>{barcodeDetails.users}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ViewBarcode; 