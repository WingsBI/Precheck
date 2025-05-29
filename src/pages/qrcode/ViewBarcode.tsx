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
  Snackbar,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getBarcodeDetails } from '../../store/slices/qrcodeSlice';
import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from '../../store/store';
import * as XLSX from 'xlsx';

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

const Row = ({ barcodeDetails }: { barcodeDetails: any }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ textAlign: 'center', minWidth: '150px' }}>{barcodeDetails.qrCodeNumber}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '50px' }}>{barcodeDetails.productionSeriesId}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '200px' }}>{barcodeDetails.drawingNumber}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '150px' }}>{barcodeDetails.nomenclature}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '250px' }}>{barcodeDetails.consumedInDrawing}</TableCell>
        
        <TableCell sx={{ textAlign: 'center', minWidth: '50px' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>IR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>MSN Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>MRIR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Disposition</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Username</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow> 
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails.qrCodeStatus}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails.irNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails.msnNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails.mrirNumber}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails.quantity}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails.disposition}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails.users}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ViewBarcode: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState('');
  const { barcodeDetails, loading, error } = useSelector((state: RootState) => state.qrcode);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    dispatch(getBarcodeDetails(searchQuery));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDownload = () => {
    try {
      if (!barcodeDetails) {
        setSnackbar({
          open: true,
          message: 'No data available to download',
          severity: 'error'
        });
        return;
      }

      // Prepare data for Excel
      const data = [{
        'QRCode ID': barcodeDetails.qrCodeNumber,
        'Prod Series': barcodeDetails.productionSeriesId,
        'Drawing Number': barcodeDetails.drawingNumber,
        'Nomenclature': barcodeDetails.nomenclature,
        'Consumed In Drawing': barcodeDetails.consumedInDrawing,
        'Status': barcodeDetails.qrCodeStatus,
        'IR Number': barcodeDetails.irNumber,
        'MSN Number': barcodeDetails.msnNumber,
        'MRIR Number': barcodeDetails.mrirNumber,
        'Quantity': barcodeDetails.quantity,
        'Disposition': barcodeDetails.disposition,
        'Username': barcodeDetails.users
      }];

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths (approximately 200px)
      const columnWidths = [ 
        { wch: 18 }, // QRCode ID
        { wch: 18 }, // Prod Series
        { wch: 18 }, // Drawing Number
        { wch: 18 }, // Nomenclature
        { wch: 18 }, // Consumed In Drawing
        { wch: 18 }, // Status
        { wch: 18 }, // IR Number
        { wch: 18 }, // MSN Number
        { wch: 18 }, // MRIR Number
        { wch: 18 }, // Quantity
        { wch: 18 }, // Disposition
        { wch: 18 }  // Username
      ];

      ws['!cols'] = columnWidths;

      // Define the style for all cells
      const cellStyle = {
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true
        },
        font: {
          bold: false,
          sz: 11
        }
      };

      // Define header style
      const headerStyle = {
        ...cellStyle,
        font: {
          bold: true,
          sz: 12
        },
        fill: {
          bgColor: { rgb: "C0C0C0" }
        }
      };

      // Add styling to make text wrap and center-aligned
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:L2');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cell_address]) continue;
          
          // Apply header style to first row, regular style to data rows
          ws[cell_address].s = R === 0 ? headerStyle : cellStyle;
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'QRCode Details');

      // Generate Excel file
      XLSX.writeFile(wb, `QRCode_${barcodeDetails.qrCodeNumber}.xlsx`);

      setSnackbar({
        open: true,
        message: 'File downloaded successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to download file',
        severity: 'error'
      });
      console.error('Download error:', error);
    }
  };

  return (
    <Box sx={{ p: 3.5 }}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        View QR Code
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View and download existing QR codes
      </Typography>
      
      <Paper sx={{ p: 0.5, mt: 3, pl: 2, pr: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1, alignItems: 'center' }}>
          <TextField
            sx={{width: '40vw'}}
            variant="outlined"
            placeholder="Search QR Code ID"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                dispatch(getBarcodeDetails(e.target.value));
              }
            }}
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
            sx={{ minWidth: '120px', marginLeft: 'auto' }}
            size="small"
          >
            Download
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ maxWidth: 'auto' }} aria-label="QR codes table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center' }}>QRCode ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center' }}>Prod Series</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '180px', textAlign: 'center' }}>Drawing Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center' }}>Nomenclature</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center' }}>ConsumedInDrawing</TableCell>
                
                <TableCell sx={{ fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {barcodeDetails && <Row barcodeDetails={barcodeDetails} />}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewBarcode; 