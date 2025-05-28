import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField,
  Button,
  FormControl,
  Autocomplete,
  CircularProgress,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Chip,
  Collapse,
  TablePagination
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
  QrCode as QrCodeIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Refresh as RefreshIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { viewPrecheckDetails, getAvailableComponents, makePrecheck } from '../../store/slices/precheckSlice';
import { getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce';

interface BarcodeDetails {
  qrCodeStatusId: number;
  drawingNumberId: number;
  drawingNumber: string;
  idNumber: string;
  quantity: number;
  irNumber: string;
  msnNumber: string;
  irNumberId: number;
  msnNumberId: number;
  idNumbers: number;
  productionSeriesId: number;
  componentType: string;
  mrirNumber: string;
  remark: string;
}

interface GridItem {
  sr: number;
  drawingNumber: string;
  nomenclature: string;
  quantity: number;
  idNumber: string;
  ir: string;
  msn: string;
  mrirNumber: string;
  drawingNumberId: number;
  prodSeriesId: number;
  isPrecheckComplete: boolean;
  isUpdated: boolean;
  qrCode?: string;
  componentType?: string;
  username?: string;
  modifiedDate?: string;
  remarks?: string;
  expanded?: boolean;
}

const MakePrecheck: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.precheck);
  const { productionSeries, drawingNumbers } = useSelector((state: RootState) => state.common);
  
  // Form state
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [idNumber, setIdNumber] = useState('');
  
  // Loading states
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [prodSeriesLoading, setProdSeriesLoading] = useState(false);
  
  // Search results
  const [searchResults, setSearchResults] = useState<GridItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // QR Code scanner state
  const [barcodeText, setBarcodeText] = useState('');
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  
  // Quantity dialog state
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [pendingBarcodeData, setPendingBarcodeData] = useState<any>(null);
  
  // Alert state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [showAlert, setShowAlert] = useState(false);
  
  // Sorting state
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected row state
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingLoading(true);
        dispatch(getDrawingNumbers({ search: searchValue }))
          .finally(() => setDrawingLoading(false));
      }, 300),
    [dispatch]
  );

  const debouncedProdSeriesSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setProdSeriesLoading(true);
        dispatch(getAllProductionSeries())
          .finally(() => setProdSeriesLoading(false));
      }, 300),
    [dispatch]
  );

  // Load initial data
  useEffect(() => {
    dispatch(getAllProductionSeries());
    dispatch(getDrawingNumbers({}));
  }, [dispatch]);

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const showAlertMessage = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };

  // Sorting functions
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedResults = useMemo(() => {
    if (!orderBy) return searchResults;
    
    return [...searchResults].sort((a, b) => {
      let aValue = a[orderBy as keyof GridItem];
      let bValue = b[orderBy as keyof GridItem];
      
      // Handle numeric values
      if (orderBy === 'sr' || orderBy === 'quantity') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        // Handle string values
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [searchResults, orderBy, order]);

  const handleMakePrecheck = () => {
    // Validate required fields first
    if (!selectedDrawing || !selectedProductionSeries || !idNumber) {
      showAlertMessage('Please fill all required fields: Drawing Number, Production Series, and ID Number', 'error');
      return;
    }

    // Using the same API as ViewPrecheck with the same parameter structure
    const params = {
      ProductionOrderNumber: undefined, // Not used in MakePrecheck
      ProductionSeriesId: selectedProductionSeries?.id || undefined,
      Id: idNumber ? parseInt(idNumber) : undefined,
      DrawingNumberId: selectedDrawing?.id || undefined
    };
    
    console.log('Making precheck with params:', params); // Debug log
    
    // Only call API if we have at least one parameter
    if (params.ProductionSeriesId || params.Id || params.DrawingNumberId) {
      dispatch(viewPrecheckDetails(params)).then((result: any) => {
        console.log('API Response:', result); // Debug log
        
        if (result.payload && Array.isArray(result.payload)) {
          // Map the API response to our table format (same as ViewPrecheck)
          const mappedResults = result.payload.map((item: any, index: number) => ({
            sr: index + 1,
            drawingNumber: item.drawingNumber || item.consumedDrawingNo || '',
            nomenclature: item.nomenclature || '',
            quantity: item.quantity || 0,
            idNumber: item.idNumbers || item.idNumber || '',
            ir: item.irNumber || '',
            msn: item.msnNumber || '',
            mrirNumber: item.mrirNumber || '',
            drawingNumberId: item.drawingNumberId || 0,
            prodSeriesId: item.prodSeriesId || 0,
            isPrecheckComplete: item.isPrecheckComplete || false,
            isUpdated: false,
            componentType: item.componentType || '',
            username: item.username || '',
            modifiedDate: item.modifiedDate || '',
            remarks: item.remarks || ''
          }));
          setSearchResults(mappedResults);
          setIsSubmitEnabled(false);
          showAlertMessage(`Loaded ${mappedResults.length} components successfully`, 'success');
        } else {
          setSearchResults([]);
          showAlertMessage('No data found for the specified criteria', 'info');
        }
        setShowResults(true);
      }).catch((error) => {
        console.error('API Error:', error); // Debug log
        setSearchResults([]);
        setShowResults(true);
        showAlertMessage('Error loading precheck data. Please try again.', 'error');
      });
    } else {
      showAlertMessage('Please provide valid search criteria', 'error');
    }
  };

  const handleReset = () => {
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setIdNumber('');
    setSearchResults([]);
    setShowResults(false);
    setOrderBy('');
    setOrder('asc');
    setBarcodeText('');
    setIsSubmitEnabled(false);
    setShowAlert(false);
    setExpandedRows(new Set());
    setPage(0);
    setSelectedRow(null);
  };

  const processBarcodeAsync = async (barcode: string) => {
    try {
      const result = await dispatch(getAvailableComponents(barcode));
      const qrCodeDetails = result.payload as BarcodeDetails;

      if (!qrCodeDetails) {
        showAlertMessage('Invalid QR code or no data found', 'error');
        return;
      }

      if (qrCodeDetails.qrCodeStatusId === 3) {
        showAlertMessage('QR code not stored in.', 'info');
        return;
      } else if (qrCodeDetails.qrCodeStatusId !== 1) {
        showAlertMessage('This barcode has already been consumed.', 'info');
        return;
      }

      // Find potential matches
      const potentialMatches = searchResults
        .map((item, index) => ({ item, index }))
        .filter(x => x.item.drawingNumberId === qrCodeDetails.drawingNumberId);

      if (!potentialMatches.length) {
        showAlertMessage(`No components found with drawing number ${qrCodeDetails.drawingNumber}.`, 'info');
        return;
      }

      // Check for ID component type
      if (potentialMatches.some(x => x.item.componentType?.toUpperCase() === 'ID')) {
        const idAlreadyAssigned = searchResults.some(item =>
          item.idNumber === qrCodeDetails.idNumber &&
          item.drawingNumberId === qrCodeDetails.drawingNumberId
        );
        
        if (idAlreadyAssigned) {
          showAlertMessage(`ID ${qrCodeDetails.idNumber} has already been assigned to a component with drawing number ${qrCodeDetails.drawingNumber}.`, 'success');
          return;
        }
      }

      // Find unprocessed item
      const matchingItem = potentialMatches.find(x => 
        !x.item.isPrecheckComplete &&
        !x.item.isUpdated &&
        !x.item.idNumber
      );

      if (!matchingItem) {
        const totalMatchingItems = potentialMatches.length;
        const processedMatchingItems = potentialMatches.filter(x => 
          x.item.isPrecheckComplete || x.item.isUpdated || x.item.idNumber
        ).length;

        if (totalMatchingItems > 0 && processedMatchingItems === totalMatchingItems) {
          showAlertMessage(`All components with drawing number ${qrCodeDetails.drawingNumber} have already been processed.`, 'info');
        } else {
          showAlertMessage('No matching unprocessed component found for the scanned barcode.', 'info');
        }
        return;
      }

      // Handle quantity selection
      if (qrCodeDetails.componentType?.toUpperCase() !== 'ID') {
        const maxQty = matchingItem.item.quantity || 0;
        setMaxQuantity(maxQty);
        setSelectedQuantity(maxQty);
        setPendingBarcodeData({ qrCodeDetails, matchingItem });
        setQuantityDialogOpen(true);
      } else {
        updateGridItem(qrCodeDetails, matchingItem, qrCodeDetails.quantity);
      }

    } catch (error) {
      console.error('Error processing barcode:', error);
      showAlertMessage('Error processing barcode', 'error');
    }
  };

  const updateGridItem = (qrCodeDetails: BarcodeDetails, matchingItem: any, quantity: number) => {
    const updatedResults = [...searchResults];
    const item = updatedResults[matchingItem.index];
    
    // Update the item
    item.qrCode = pendingBarcodeData?.qrCodeDetails?.idNumber || qrCodeDetails.idNumber;
    item.isPrecheckComplete = false;
    item.isUpdated = true;
    item.ir = qrCodeDetails.irNumber;
    item.msn = qrCodeDetails.msnNumber;
    item.idNumber = qrCodeDetails.idNumber;
    item.quantity = quantity;
    item.componentType = qrCodeDetails.componentType;
    item.mrirNumber = qrCodeDetails.mrirNumber;
    item.remarks = qrCodeDetails.remark;
    item.username = 'Current User'; // Replace with actual user
    item.modifiedDate = new Date().toISOString().split('T')[0];

    setSearchResults(updatedResults);
    
    // Check if submit should be enabled
    const hasUpdatedItems = updatedResults.some(item => item.isUpdated && !item.isPrecheckComplete);
    setIsSubmitEnabled(hasUpdatedItems);

    // Check if all items are processed
    const unprocessedItems = updatedResults.filter(item => 
      !item.isPrecheckComplete && !item.isUpdated
    );

    if (unprocessedItems.length === 0) {
      showAlertMessage('All components have been pre-checked!', 'success');
    }
  };

  const handleQuantityConfirm = () => {
    if (pendingBarcodeData) {
      updateGridItem(
        pendingBarcodeData.qrCodeDetails,
        pendingBarcodeData.matchingItem,
        selectedQuantity
      );
      setPendingBarcodeData(null);
    }
    setQuantityDialogOpen(false);
  };

  const handleBarcodeChange = (value: string) => {
    setBarcodeText(value);
    
    // Auto-process when barcode length is 12 or 15 digits
    if ((value.length === 12 || value.length === 15) && /^\d+$/.test(value)) {
      processBarcodeAsync(value);
      setBarcodeText(''); // Clear after processing
    }
  };

  const handleSubmitPrecheck = async () => {
    try {
      const componentsToSubmit = searchResults
        .filter(item => item.isUpdated && !item.isPrecheckComplete)
        .map(item => ({
          consumedDrawingNo: `${selectedProductionSeries?.productionSeries}/${selectedDrawing?.drawingNumber}/${idNumber}`,
          consumedInDrawingNumberID: selectedDrawing?.id,
          consumedInProdSeriesID: selectedProductionSeries?.id,
          consumedInId: parseInt(idNumber) || 0,
          qrCodeNumber: item.qrCode,
          quantity: item.quantity,
          irNumber: item.ir,
          msnNumber: item.msn,
          drawingNumberId: item.drawingNumberId,
          productionSeriesId: item.prodSeriesId,
          remarks: item.remarks,
          componentType: item.componentType,
          idNumbers: item.idNumber,
          mrirNumber: item.mrirNumber
        }));

      if (!componentsToSubmit.length) {
        showAlertMessage('No new components to submit', 'info');
        return;
      }

      const result = await dispatch(makePrecheck(componentsToSubmit));
      
      if (result.payload) {
        // Update grid items as submitted
        const updatedResults = searchResults.map(item => {
          if (item.isUpdated && !item.isPrecheckComplete) {
            return {
              ...item,
              isPrecheckComplete: true,
              isUpdated: false
            };
          }
          return item;
        });
        
        setSearchResults(updatedResults);
        setIsSubmitEnabled(false);
        showAlertMessage('Precheck submitted successfully!', 'success');
      }
    } catch (error) {
      console.error('Error submitting precheck:', error);
      showAlertMessage('Error submitting precheck', 'error');
    }
  };

  // Helper function to get component type icon and color
  const getComponentTypeChip = (componentType: string) => {
    const type = componentType?.toUpperCase();
    switch (type) {
      case 'ID':
        return <Chip icon={<QrCodeIcon />} label="ID" size="small" color="primary" variant="outlined" />;
      case 'BATCH':
        return <Chip icon={<InventoryIcon />} label="BATCH" size="small" color="secondary" variant="outlined" />;
      case 'FIM':
        return <Chip icon={<CategoryIcon />} label="FIM" size="small" color="success" variant="outlined" />;
      case 'SI':
        return <Chip icon={<SettingsIcon />} label="SI" size="small" color="warning" variant="outlined" />;
      default:
        return <Chip label={type || 'N/A'} size="small" variant="outlined" />;
    }
  };

  // Handle row expansion
  const handleRowExpand = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle row selection on double-click
  const handleRowDoubleClick = (index: number) => {
    const actualIndex = page * rowsPerPage + index;
    setSelectedRow(selectedRow === actualIndex ? null : actualIndex);
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, page, rowsPerPage]);

  return (
    <Box sx={{ p: 1 }}>
      <Typography
        variant="h6"
        gutterBottom
      sx={{ 
          color: "primary.main",
          fontWeight: 600,
        mb: 2,
        }}
      >
        Make Precheck
            </Typography>
      
      {/* Alert */}
      {showAlert && (
        <Alert 
          severity={alertSeverity} 
          sx={{ mb: 2 }}
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}
      
      {/* Form Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <FormControl sx={{ minWidth: 175 }} size="small">
          <Autocomplete
            size="small"
            options={drawingNumbers}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.drawingNumber || '';
            }}
            value={selectedDrawing}
            loading={drawingLoading}
            onInputChange={(_: any, value: string) => {
              if (value.length >= 3) {
                debouncedDrawingSearch(value);
              }
            }}
            onChange={(_: any, value: any) => {
              setSelectedDrawing(value);
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === (value?.id || '')
            }
            renderOption={(props: any, option: any) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                  <Typography variant="body2">
                    {option.drawingNumber}
              </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.nomenclature || ''} | {option.componentType || ''}
              </Typography>
            </Box>
              </li>
            )}
            renderInput={(params: any) => (
                      <TextField
                {...params}
                        label="Drawing Number *"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {drawingLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                      />
                    )}
                  />
        </FormControl>
        
        <FormControl sx={{ minWidth: 175 }} size="small">
          <Autocomplete
            size="small"
            options={productionSeries}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.productionSeries || '';
            }}
            value={selectedProductionSeries}
            loading={prodSeriesLoading}
            onInputChange={(_, value) => {
              if (value.length >= 1) {
                debouncedProdSeriesSearch(value);
              }
            }}
            onChange={(_, value) => {
              setSelectedProductionSeries(value);
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === (value?.id || '')
            }
            renderOption={(props, option) => (
              <li {...props}>
                <Typography variant="body2">
                  {option.productionSeries}
                </Typography>
              </li>
            )}
            renderInput={(params) => (
                      <TextField
                {...params}
                        label="Production Series *"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {prodSeriesLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                      />
                    )}
                  />
                      </FormControl>
        
        <FormControl sx={{ minWidth: 120 }} size="small">
                      <TextField
            size="small"
            label="ID Number *"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            variant="outlined"
          />
        </FormControl>
        
        <Button
          variant="contained"
          color="primary"
          sx={{ minWidth: 130, height: 32 }}
          size="small"
          onClick={handleMakePrecheck}
          disabled={isLoading}
        >
          <QrCodeScannerIcon sx={{ mr: 1 }} />
          Make Precheck
        </Button>
        
        <Button
          variant="contained"
          color="error"
          sx={{ minWidth: 130, height: 32 }}
          size="small"
          onClick={handleReset}
        >
          <RefreshIcon sx={{ mr: 1 }} />
          Reset
        </Button>
        
        <Button
          variant="contained"
          color="success"
          sx={{ minWidth: 130, height: 32 }}
          size="small"
          onClick={handleSubmitPrecheck}
          disabled={!isSubmitEnabled}
        >
          <SendIcon sx={{ mr: 1 }} />
          Submit
        </Button>
      </Box>

      {/* QR Code Scanner Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <Typography 
          variant="body2" 
              sx={{ 
            fontWeight: 'bold',
            fontSize: '0.875rem',
            minWidth: 'auto'
          }}
        >
          Scan Qr Code:
              </Typography>
        <TextField
          size="small"
          value={barcodeText}
          onChange={(e) => handleBarcodeChange(e.target.value)}
          placeholder="Scan or enter QR code (12 or 15 digits)"
          sx={{ width: 300 }}
          disabled={!showResults || searchResults.length === 0}
          autoFocus={showResults && searchResults.length > 0}
        />
        <Typography 
          variant="body2" 
        sx={{ 
            fontWeight: 'bold',
            fontSize: '0.875rem',
            ml: 2
          }}
        >
          <span>BOM Details of </span>
          <span style={{ color: '#1976d2' }}>
            {selectedDrawing?.drawingNumber || ''}
          </span>
        </Typography>
      </Box>

      {/* Results Display */}
      {showResults && (
        <Typography
          variant="body2"
          sx={{ mb: 1, fontWeight: 'medium' }}
        >
          Showing results for {selectedProductionSeries?.productionSeries || 'A'} / {selectedDrawing?.drawingNumber || ''} / {idNumber || ''}
        </Typography>
      )}

      {/* BOM Details Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1000 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5', height: 24 }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 20 }}>
                  <TableSortLabel
                    active={orderBy === 'sr'}
                    direction={orderBy === 'sr' ? order : 'asc'}
                    onClick={() => handleRequestSort('sr')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    SR
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'drawingNumber'}
                    direction={orderBy === 'drawingNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('drawingNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 100 }}>
                  <TableSortLabel
                    active={orderBy === 'nomenclature'}
                    direction={orderBy === 'nomenclature' ? order : 'asc'}
                    onClick={() => handleRequestSort('nomenclature')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Nomenclature
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 40 }}>
                  <TableSortLabel
                    active={orderBy === 'quantity'}
                    direction={orderBy === 'quantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('quantity')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Qty
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'idNumber'}
                    direction={orderBy === 'idNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('idNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 60 }}>
                  <TableSortLabel
                    active={orderBy === 'ir'}
                    direction={orderBy === 'ir' ? order : 'asc'}
                    onClick={() => handleRequestSort('ir')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    IR
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 60 }}>
                  <TableSortLabel
                    active={orderBy === 'msn'}
                    direction={orderBy === 'msn' ? order : 'asc'}
                    onClick={() => handleRequestSort('msn')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    MSN
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'mrirNumber'}
                    direction={orderBy === 'mrirNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('mrirNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    MRIR Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  Type
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 40 }}>
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ height: 150 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item, index) => (
                  <React.Fragment key={index}>
                    <TableRow 
                      hover
                      onDoubleClick={() => handleRowDoubleClick(index)}
                      sx={{
                        backgroundColor: item.isPrecheckComplete 
                          ? '#f0f0f0' 
                          : selectedRow === (page * rowsPerPage + index)
                            ? '#e3f2fd'
                            : 'inherit',
                        opacity: item.isPrecheckComplete ? 0.7 : 1,
                        height: 36,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: item.isPrecheckComplete 
                            ? '#f0f0f0' 
                            : selectedRow === (page * rowsPerPage + index)
                              ? '#bbdefb'
                              : '#f5f5f5'
                        }
                      }}
                    >
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.sr}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.drawingNumber}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.nomenclature}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.quantity}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.idNumber || '-'}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.ir || '-'}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.msn || '-'}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.mrirNumber || '-'}</TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>
                        {getComponentTypeChip(item.componentType || '')}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(index)}
                          sx={{ p: 0.2 }}
                        >
                          {expandedRows.has(index) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                        <Collapse in={expandedRows.has(index)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 0.5 }}>
                            <Table size="small" aria-label="additional-details">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>Remarks</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>User</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>Date</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>
                                    {item.remarks || '-'}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>{item.username || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>{item.modifiedDate || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>
                                    <Chip 
                                      label={item.isPrecheckComplete ? 'Completed' : item.isUpdated ? 'Updated' : 'Pending'} 
                                      size="small"
                                      color={item.isPrecheckComplete ? 'success' : item.isUpdated ? 'warning' : 'default'}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : showResults ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ height: 150 }}>No records found</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ height: 150, color: 'text.secondary' }}>
                    Enter search criteria and click "Make Precheck" to see BOM details
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {searchResults.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={searchResults.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ 
              borderTop: '1px solid #e0e0e0',
              '& .MuiTablePagination-toolbar': {
                minHeight: 48
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem'
              }
            }}
          />
        )}
      </Paper>

      {/* Quantity Selection Dialog */}
      <Dialog open={quantityDialogOpen} onClose={() => setQuantityDialogOpen(false)}>
        <DialogTitle>Select Quantity</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Maximum quantity available: {maxQuantity}
                      </Typography>
                        <TextField
            autoFocus
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={selectedQuantity}
            onChange={(e) => setSelectedQuantity(Math.min(parseInt(e.target.value) || 0, maxQuantity))}
            inputProps={{ min: 1, max: maxQuantity }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuantityDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleQuantityConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MakePrecheck; 