import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getBarcodeDetails, getBarcodeDetailsWithParameters } from '../../store/slices/qrcodeSlice';
import { getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from '../../store/store';
import * as XLSX from 'xlsx';
import { debounce } from '@mui/material/utils';
import InputBase from '@mui/material/InputBase';
import ReplayIcon from '@mui/icons-material/Replay';

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
  desposition: string;
  username: string;
}

const Row = ({ barcodeDetails }: { barcodeDetails: any }) => {
  const [open, setOpen] = useState(false);

  // Add debugging console log
  console.log("Row component - barcodeDetails:", barcodeDetails);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ textAlign: 'center', minWidth: '150px' }}>{barcodeDetails?.qrCodeNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '50px' }}>{barcodeDetails?.productionSeriesId || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '200px' }}>{barcodeDetails?.drawingNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '150px' }}>{barcodeDetails?.nomenclature || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '250px' }}>{barcodeDetails?.consumedInDrawing || 'N/A'}</TableCell>
        
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
                    <TableCell sx={{ textAlign: 'center'}}>{barcodeDetails?.qrCodeStatus || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails?.irNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails?.msnNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails?.mrirNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails?.quantity || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails?.desposition || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{barcodeDetails?.users || 'N/A'}</TableCell>
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
  const [selectedProdSeriesId, setSelectedProdSeriesId] = useState<number | ''>('');
  const [selectedDrawingNumberId, setSelectedDrawingNumberId] = useState<number | ''>('');
  const [selectedProdSeries, setSelectedProdSeries] = useState('');
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState('');
  const [drawingSearchText, setDrawingSearchText] = useState('');
  
  // Get data from redux store
  const { barcodeDetails, loading, error } = useSelector((state: RootState) => state.qrcode);
  const { productionSeries, drawingNumbers, isLoading } = useSelector((state: RootState) => state.common);

  // Add debugging console logs
  console.log("Redux state - barcodeDetails:", barcodeDetails);
  console.log("Redux state - loading:", loading);
  console.log("Redux state - error:", error);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filtered drawing numbers based on search
  const filteredDrawingNumbers = React.useMemo(() => {
    if (!Array.isArray(drawingNumbers)) return [];
    return drawingNumbers.filter(drawing => 
      drawing.drawingNumber.toLowerCase().includes(drawingSearchText.toLowerCase())
    );
  }, [drawingNumbers, drawingSearchText]);

  // Fetch production series on component mount
  useEffect(() => {
    dispatch(getAllProductionSeries());
  }, [dispatch]);

  // Handle production series change
  const handleProdSeriesChange = (event: any) => {
    const selectedSeries = productionSeries.find((series: any) => series.productionSeries === event.target.value);
    console.log("selectedSeries", selectedSeries);
    setSelectedProdSeries(event.target.value);
    setSelectedProdSeriesId(selectedSeries ? selectedSeries.id : '');
    
    // Reset drawing number selection when production series changes
    setSelectedDrawingNumber('');
    setSelectedDrawingNumberId('');
    setDrawingSearchText('');
    
    if (event.target.value && selectedSeries) {
      dispatch(getDrawingNumbers({ componentType: '', search: event.target.value }));
    }
  };

  // Handle drawing number change
  const handleDrawingNumberChange = (event: any) => {
    const selectedDrawing = drawingNumbers.find((drawing: any) => drawing.drawingNumber === event.target.value);
    console.log("selectedDrawing", selectedDrawing);
    setSelectedDrawingNumber(event.target.value);
    setSelectedDrawingNumberId(selectedDrawing ? selectedDrawing.id : '');
  };

  // Debounced search handler for drawing numbers
  const debouncedDrawingSearch = React.useMemo(
    () => debounce((searchValue: string) => {
      if (selectedProdSeries) {
        dispatch(getDrawingNumbers({ componentType: '', search: searchValue }));
      }
    }, 500),
    [dispatch, selectedProdSeries]
  );

  // Handle drawing search change
  const handleDrawingSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDrawingSearchText(event.target.value);
    debouncedDrawingSearch(event.target.value);
  };

  const handleFilterSearch = () => {
    if (selectedProdSeriesId && selectedDrawingNumberId) {
      console.log("Dispatching getBarcodeDetailsWithParameters with:");
      console.log("selectedProdSeriesId:", selectedProdSeriesId);
      console.log("selectedDrawingNumberId:", selectedDrawingNumberId);
      console.log("selectedProdSeries:", selectedProdSeries);
      console.log("selectedDrawingNumber:", selectedDrawingNumber);
      
      dispatch(getBarcodeDetailsWithParameters({
        prodSeriesId: selectedProdSeriesId,
        drawingNumberId: selectedDrawingNumberId
      }));
    } else {
      // Show warning if either selection is missing
      setSnackbar({
        open: true,
        message: 'Please select both Production Series and Drawing Number',
        severity: 'error'
      });
    }
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

      // Check if barcodeDetails is an array or single object
      const dataArray = Array.isArray(barcodeDetails) ? barcodeDetails : [barcodeDetails];
      
      // Prepare data for Excel
      const data = dataArray.map(item => ({
        'QRCode ID': item?.qrCodeNumber || 'N/A',
        'Prod Series': item?.productionSeriesId || 'N/A',
        'Drawing Number': item?.drawingNumber || 'N/A',
        'Nomenclature': item?.nomenclature || 'N/A',
        'Consumed In Drawing': item?.consumedInDrawing || 'N/A',
        'Status': item?.qrCodeStatus || 'N/A',
        'IR Number': item?.irNumber || 'N/A',
        'MSN Number': item?.msnNumber || 'N/A',
        'MRIR Number': item?.mrirNumber || 'N/A',
        'Quantity': item?.quantity || 'N/A',
        'Disposition': item?.desposition || 'N/A',
        'Username': item?.users || 'N/A'
      }));

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
      const filename = Array.isArray(barcodeDetails) && barcodeDetails.length > 1 
        ? 'QRCode_Details.xlsx' 
        : `QRCode_${barcodeDetails?.qrCodeNumber || 'Unknown'}.xlsx`;
      
      XLSX.writeFile(wb, filename);

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

  const handleReset = () => {
    setSearchQuery('');
    setSelectedProdSeries('');
    setSelectedProdSeriesId('');
    setSelectedDrawingNumber('');
    setSelectedDrawingNumberId('');
    setDrawingSearchText('');
    // Optionally, clear barcodeDetails if you want to clear the table as well
    // dispatch({ type: 'qrcode/clearBarcodeDetails' }); // if you have such an action
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
        View QR Code
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View and download existing QR codes
      </Typography>
      
      <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            width: '100%'
          }}
        >
          <TextField
            size="small"
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
            sx={{ 
              width: { xs: '100%', sm: '20%' },
              minWidth: { sm: '210px' }
            }}
            error={!!error}
            helperText={error}
          />

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: { xs: 'none', sm: 'block' }
            }}
          >
            OR
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            alignItems: 'center', 
            width: { xs: '100%', sm: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <FormControl 
              size="small" 
              sx={{ 
                width: { xs: '100%', sm: '130px' }
              }}
            >
              <InputLabel>Prod Series</InputLabel>
              <Select
                value={selectedProdSeries}
                label="Prod Series"
                onChange={handleProdSeriesChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {Array.isArray(productionSeries) && productionSeries.map((series: any) => (
                  <MenuItem key={series.productionSeriesId} value={series.productionSeries}>
                    {series.productionSeries}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl 
              size="small" 
              sx={{ 
                width: { xs: '100%', sm: '250px' }
              }}
            >
              <InputLabel>Drawing Number</InputLabel>
              <Select
                value={selectedDrawingNumber}
                label="Drawing Number"
                onChange={handleDrawingNumberChange}
                disabled={!selectedProdSeries}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 350
                    }
                  },
                  sx: {
                    '& .MuiPaper-root': {
                      width: '310px'
                    }
                  }
                }}
              >
                <MenuItem dense sx={{ p: 0, sticky: 0 }}>
                  <Box sx={{ p: 1, width: '100%' }}>
                    <InputBase
                      placeholder="Search drawing number..."
                      value={drawingSearchText}
                      onChange={handleDrawingSearchChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      }
                      sx={{ 
                        width: '100%',
                        '& input': { p: 0.5 }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {filteredDrawingNumbers.slice(0, 100).map((drawing: any) => (
                  <MenuItem 
                    key={drawing.drawingNumberId} 
                    value={drawing.drawingNumber}
                    sx={{
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}
                  >
                    {drawing.drawingNumber}
                  </MenuItem>
                ))}
                {filteredDrawingNumbers.length > 100 && (
                  <MenuItem disabled>
                    <em>Type to search more results...</em>
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' }
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFilterSearch}
                size="small"
                disabled={!selectedProdSeries || !selectedDrawingNumber}
                sx={{ 
                  height: '40px',
                  width: { xs: '45%', sm: 'auto' },
                  minWidth: '100px'
                }}
              >
                Search
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                size="small"
                sx={{ 
                  height: '40px',
                  width: { xs: '45%', sm: 'auto' },
                  minWidth: '130px'
                }}
              >
                Download
              </Button>

              <Button
                variant="contained"
                color="error"
                startIcon={<ReplayIcon />}
                onClick={handleReset}
                size="small"
                sx={{ 
                  height: '40px',
                  width: { xs: '45%', sm: 'auto' },
                  minWidth: '140px'
                }}
              >
                Reset
              </Button>
            </Box>
          </Box>
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
              {/* Handle both array and single object cases */}
              {Array.isArray(barcodeDetails) ? (
                barcodeDetails.map((item, index) => (
                  <Row key={index} barcodeDetails={item} />
                ))
              ) : (
                barcodeDetails && <Row barcodeDetails={barcodeDetails} />
              )}
              
              {/* Show message when no data */}
              {!barcodeDetails && !loading && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No data found. Please search for QR codes.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
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