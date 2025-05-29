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
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
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

  const handleExpandClick = (qrCodeId: string) => {
    setExpandedRow(expandedRow === qrCodeId ? null : qrCodeId);
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
              {barcodeDetails ? (
                <>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'left', minWidth: '150px' }}>{barcodeDetails.qrCodeNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.productionOrderNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.projectNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.productionSeries}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.drawingNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.idNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.quantity}</TableCell>
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.nomenclature}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleExpandClick(barcodeDetails.qrCodeNumber)}
                      >
                        {expandedRow === barcodeDetails.qrCodeNumber ? 
                          <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                      <Collapse in={expandedRow === barcodeDetails.qrCodeNumber} timeout="auto" unmountOnExit>
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
                                <TableCell>{barcodeDetails.consumedInDrawing || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'center'}}>
                                  <Chip 
                                    label={barcodeDetails.qrCodeStatus || 'N/A'} 
                                    size="small"
                                    color={barcodeDetails.qrCodeStatus === 'readyforconsumption' ? 'success' : 'default'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.irNumber || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.msnNumber || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.mrirNumber || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.desposition || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.users || '-'}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">No QR code scanned</TableCell>
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