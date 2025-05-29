import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
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
  IconButton,
  Collapse,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { getStoreInData } from '../../store/slices/precheckSlice';
import { updateQrCodeDetails } from '../../store/slices/qrcodeSlice';
import type { AppDispatch } from '../../store/store';

interface QRCodeDetailsResponse {
  qrCodeNumber: string;
  productionSeries: string;
  drawingNumber: string;
  nomenclature: string;
  productionOrderNumber: string;
  projectNumber: string;
  consumedInDrawing: string;
  irNumber: string;
  msnNumber: string;
  quantity: number;
  desposition: string;
  users: string;
  qrCodeStatus: string;
  mrirNumber: string;
  idNumber: string;
}

interface StoreInResponse {
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'info' });
  const [qrCodeList, setQrCodeList] = useState<QRCodeDetailsResponse[]>([]);
  const [storeInList, setStoreInList] = useState<StoreInResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQRCodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQrCodeInput(value);
    
    if (value?.length === 15 || (value?.length === 12 && value.split('').every(char => /\d/.test(char)))) {
      submitQRCode(value);
      setQrCodeInput(''); // Clear after processing
    }
  };

  const submitQRCode = async (qrCode: string) => {
    try {
      setIsLoading(true);

      if (!qrCode?.trim()) {
        setAlertMessage({ message: 'Please enter a valid QR Code ID.', type: 'error' });
        return;
      }

      // Clear existing data before making new requests
      setQrCodeList([]);
      setStoreInList([]);

      // Call the UpdateQrCodeDetails API
      const qrCodeResult = await dispatch(updateQrCodeDetails(qrCode)).unwrap();
      
      if (!qrCodeResult) {
        setAlertMessage({ message: `QR Code ${qrCode} not found.`, type: 'error' });
        return;
      }

      // Process QR code details
      const gridModel: QRCodeDetailsResponse = {
        qrCodeNumber: qrCodeResult.qrCodeNumber,
        productionSeries: qrCodeResult.productionSeries,
        drawingNumber: qrCodeResult.drawingNumber,
        nomenclature: qrCodeResult.nomenclature,
        productionOrderNumber: qrCodeResult.productionOrderNumber,
        projectNumber: qrCodeResult.projectNumber,
        consumedInDrawing: qrCodeResult.consumedInDrawing,
        irNumber: qrCodeResult.irNumber,
        msnNumber: qrCodeResult.msnNumber,
        quantity: qrCodeResult.quantity,
        desposition: qrCodeResult.desposition,
        users: qrCodeResult.users,
        qrCodeStatus: qrCodeResult.qrCodeStatus,
        mrirNumber: qrCodeResult.mrirNumber,
        idNumber: qrCodeResult.idNumber
      };
      setQrCodeList([gridModel]);

      if (qrCodeResult.qrCodeStatus?.toLowerCase() === 'consumed') {
        setAlertMessage({ message: `QR Code ${qrCode} has been consumed.`, type: 'info' });
      }

      // Get store-in data
      const storeInResult = await dispatch(getStoreInData(qrCode)).unwrap();

      if (storeInResult && storeInResult.length > 0) {
        setStoreInList(storeInResult);
        setAlertMessage({ 
          message: `QR Code ${qrCode} processed successfully. ${storeInResult.length} store-in record(s) found.`, 
          type: 'success' 
        });
      } else {
        setAlertMessage({ message: `No store-in records found for QR Code ${qrCode}.`, type: 'info' });
      }

      setQrCodeInput('');

    } catch (error: any) {
      console.error('Error processing QR Code:', error);
      setAlertMessage({ 
        message: `Error processing QR Code ${qrCode}: ${error.message || error}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandClick = (qrCodeId: string) => {
    setExpandedRow(expandedRow === qrCodeId ? null : qrCodeId);
  };

  const reset = () => {
    setQrCodeInput('');
    setQrCodeList([]);
    setStoreInList([]);
    setAlertMessage({ message: '', type: 'info' });
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        Store In
      </Typography>

      {/* Alert Message */}
      {alertMessage.message && (
        <Alert 
          severity={alertMessage.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlertMessage({ message: '', type: 'info' })}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* QR Code Scanning Section */}
      <Paper sx={{ p: 2, mt: 3 }}>
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
              endAdornment: isLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: '400px' }}
          />
        </Box>

        {/* QR Code Details Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: 'center'}}>QRCode ID</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>PO Number</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>Project Number</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>Prod Series</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>Drawing Number</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>ID</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>Qty</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>Nomenclature</TableCell>
                <TableCell sx={{ textAlign: 'center'}}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qrCodeList.length > 0 ? (
                qrCodeList.map((details, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'left', minWidth: '150px' }}>{details.qrCodeNumber}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.productionOrderNumber}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.projectNumber}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.productionSeries}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.drawingNumber}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.idNumber}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.quantity}</TableCell>
                      <TableCell sx={{ textAlign: 'center'}}>{details.nomenclature}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleExpandClick(details.qrCodeNumber)}
                        >
                          {expandedRow === details.qrCodeNumber ? 
                            <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Collapse in={expandedRow === details.qrCodeNumber} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Table size="small" aria-label="details">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Consumed in Drawing</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>Status</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>IR Number</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>MSN Number</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>MRIR Number</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>Disposition</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>Username</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>{details.consumedInDrawing || '-'}</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>
                                    <Chip 
                                      label={details.qrCodeStatus || 'N/A'} 
                                      size="small"
                                      color={details.qrCodeStatus?.toLowerCase() === 'available' ? 'success' : 'default'}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>{details.irNumber || '-'}</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>{details.msnNumber || '-'}</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>{details.mrirNumber || '-'}</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>{details.desposition || '-'}</TableCell>
                                  <TableCell sx={{ textAlign: 'center'}}>{details.users || '-'}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">No QR code scanned</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Store In Dashboard Section */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom color="primary.main">
          Store In Dashboard
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
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              ) : storeInList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No store-in records found</TableCell>
                </TableRow>
              ) : (
                storeInList.map((row, index) => (
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