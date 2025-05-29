import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { storeInPrecheck, getStoreAvailableComponents } from '../../store/slices/precheckSlice';
import { getBarcodeDetails } from '../../store/slices/qrcodeSlice';
import type { RootState, AppDispatch } from '../../store/store';

interface ScannedQRData {
  qrcodeId: string;
  poNumber: string;
  projectNumber: string;
  prodSeries: string;
  drawingNumber: string;
  id: string;
  qty: string;
  nomenclature: string;
}

interface DashboardData {
  drawingNumber: string;
  productionSeries: string;
  idNumber: string;
  quantity: string;
  projectNumber: string;
  productionOrderNumber: string;
  createdByName: string;
  createdDate: string;
}

const StoreIn: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [qrCodeInput, setQrCodeInput] = useState('');
  const availableComponents = useSelector((state: RootState) => state.precheck.availableComponents);
  const isLoading = useSelector((state: RootState) => state.precheck.isLoading);
  const barcodeDetails = useSelector((state: RootState) => state.qrcode.barcodeDetails);

  const handleQRCodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQrCodeInput(value);
    
    if (value) {
      // Dispatch actions to fetch data when QR code is scanned
      dispatch(getStoreAvailableComponents(value));
      dispatch(getBarcodeDetails(value));
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        Store In
      </Typography>

      {/* QR Code Scanning Section */}
      <Paper sx={{ p: 2, mt: 3 }}>
        {/* QR Code Input and Label in Single Line */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography 
            variant="h6" 
            color="primary.main"
            sx={{ 
              fontWeight: 600,
              minWidth: 'fit-content',
              whiteSpace: 'nowrap'
            }}
          >
            Scanned QR Code Details:
          </Typography>
          <TextField
            fullWidth
            placeholder="Scan QR Code"
            value={qrCodeInput}
            onChange={handleQRCodeScan}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeScannerIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: '400px' }}
          />
        </Box>

        {/* First Table - Barcode Details */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>QRCode ID</TableCell>
                <TableCell>PO Number</TableCell>
                <TableCell>Project Number</TableCell>
                <TableCell>Prod Series</TableCell>
                <TableCell>Drawing Number</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Nomenclature</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {barcodeDetails ? (
                <TableRow>
                  <TableCell sx={{ textAlign: 'left', minWidth: '150px' }}>{barcodeDetails.qrCodeNumber}</TableCell>
                  <TableCell>{barcodeDetails.productionOrderNumber}</TableCell>
                  <TableCell>{barcodeDetails.projectNumber}</TableCell>
                  <TableCell>{barcodeDetails.productionSeries}</TableCell>
                  <TableCell>{barcodeDetails.drawingNumber}</TableCell>
                  <TableCell>{barcodeDetails.idNumber}</TableCell>
                  <TableCell>{barcodeDetails.quantity}</TableCell>
                  <TableCell>{barcodeDetails.nomenclature}</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No QR code scanned</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dashboard Section - API Data */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom color="primary.main">
          Precheck Balance Dashboard
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Drawing Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Production Series</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ID Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Project Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Production Order Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created By Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : availableComponents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No data available. Please scan a QR code.</TableCell>
                </TableRow>
              ) : (
                availableComponents.map((row: DashboardData, index: number) => (
                  <TableRow key={index}>
                    <TableCell sx={{ textAlign: 'left', minWidth: '200px' }}>{row.drawingNumber}</TableCell>
                    <TableCell>{row.productionSeries}</TableCell>
                    <TableCell>{row.idNumber}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.projectNumber}</TableCell>
                    <TableCell>{row.productionOrderNumber}</TableCell>
                    <TableCell>{row.createdByName}</TableCell>
                    <TableCell>{row.createdDate}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StoreIn;