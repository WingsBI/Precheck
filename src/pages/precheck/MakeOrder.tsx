import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Autocomplete,
  FormControl,
  TablePagination
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import debounce from 'lodash.debounce';
import type { RootState, AppDispatch } from '../../store/store';
import { makePrecheckOrder, getAvailableComponentsForBOM } from '../../store/slices/precheckSlice';
import { getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';

interface BOMItem {
  sr: number;
  drawingNumber: string;
  nomenclature: string;
  qty: number;
}

interface QRCodeItem {
  qrCodeNumber: string;
  id: string;
  qty: number;
  status: string;
  location: string;
  expiry: string;
  mfg: string;
}

interface FormData {
  productionOrder: string;
  drawingNumber: any;
  productionSeries: any;
  startIdNumber: number;
  quantity: number;
}

// Validation schema
const schema = yup.object().shape({
  productionOrder: yup.string().required('Production Order is required'),
  drawingNumber: yup.object().nullable().required('Drawing Number is required'),
  productionSeries: yup.object().nullable().required('Production Series is required'),
  startIdNumber: yup.number().min(1, 'Start ID must be at least 1').required('Start ID is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
});

const MakeOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { isLoading, availableComponents } = useSelector((state: RootState) => state.precheck);
  const { productionSeries, drawingNumbers, isLoading: isLoadingCommon } = useSelector((state: RootState) => state.common);
  const { user } = useSelector((state: RootState) => state.auth);

  // Local state
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [prodSeriesLoading, setProdSeriesLoading] = useState(false);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [bomData, setBomData] = useState<BOMItem[]>([]);
  const [qrCodeData, setQrCodeData] = useState<QRCodeItem[]>([]);
  const [selectedBomRow, setSelectedBomRow] = useState<number | null>(null);

  // Pagination state for QR codes table
  const [qrPage, setQrPage] = useState(0);
  const [qrRowsPerPage, setQrRowsPerPage] = useState(10);

  // Form setup
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      productionOrder: '',
      drawingNumber: null,
      productionSeries: null,
      startIdNumber: 1,
      quantity: 1,
    }
  });

  const watchDrawingNumber = watch('drawingNumber');

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
      debounce(() => {
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

  // Clear BOM data when drawing number changes (will be populated after API call)
  useEffect(() => {
    setBomData([]);
  }, [watchDrawingNumber]);

  // Update QR code data when available components change
  useEffect(() => {
    if (availableComponents && Array.isArray(availableComponents)) {
      const mappedQrData = availableComponents.map((item: any, index: number) => ({
        qrCodeNumber: item.qrCodeNumber || item.qrCode || '',
        id: item.id || item.idNumber || '',
        qty: item.quantity || item.qty || 0,
        status: item.status || 'Available',
        location: item.location || item.storeLocation || '',
        expiry: item.expiryDate || item.expiry || '',
        mfg: item.manufacturingDate || item.mfg || '',
      }));
      setQrCodeData(mappedQrData);
    }
  }, [availableComponents]);

  const onSubmit = async (data: FormData) => {
    setError('');
    setSuccessMessage('');

    try {
      // Generate IDs array based on start ID and quantity
      const ids = Array.from({ length: data.quantity }, (_, i) => data.startIdNumber + i);

      const orderData = {
        productionOrderNumber: data.productionOrder,
        productionSeriesId: Number(data.productionSeries?.id) || 0,
        drawingNumberId: Number(data.drawingNumber?.id) || 0,
        createdBy: Number(user?.id) || 0,
        ids: ids,
      };

      const result = await dispatch(makePrecheckOrder(orderData)).unwrap();
      
      // Populate BOM table with API response data
      if (result && Array.isArray(result)) {
        const mappedBomData = result.map((item: any, index: number) => ({
          sr: index + 1,
          drawingNumber: item.drawingNumber || '',
          nomenclature: item.nomenclature || '',
          qty: item.quantity || 0,
        }));
        setBomData(mappedBomData);
      }

      // Note: QR Code data would come from a separate API call if needed
      // For now, keeping it empty until we know the QR code data source

      setSuccessMessage('Order created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err: any) {
      setError(err || 'Failed to create order. Please try again.');
    }
  };

  const handleReset = () => {
    reset();
    setError('');
    setSuccessMessage('');
    setBomData([]);
    setQrCodeData([]);
    setSelectedBomRow(null);
    setQrPage(0);
  };

  const handleBomRowDoubleClick = async (bomItem: BOMItem, index: number) => {
    const formData = watch();
    
    if (!formData.productionSeries?.id || !formData.drawingNumber?.id) {
      setError('Please select Production Series and Drawing Number first');
      return;
    }

    // Set selected row for visual feedback
    setSelectedBomRow(index);
    setQrCodeLoading(true);
    setError('');

    try {
      const requestData = {
        prodSeriesId: Number(formData.productionSeries.id),
        drawingNumberId: Number(formData.drawingNumber.id),
        quantity: bomItem.qty || 1,
      };

      console.log('Making API call with:', requestData);
      console.log('Selected BOM item:', bomItem);

      const result = await dispatch(getAvailableComponentsForBOM(requestData)).unwrap();
      
      console.log('API Response:', result);
      
      // The result will be automatically handled by the useEffect when availableComponents changes
      if (!result || (Array.isArray(result) && result.length === 0)) {
        setError('No available components found for this BOM item');
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err || 'Failed to fetch available components');
      setQrCodeData([]);
    } finally {
      setQrCodeLoading(false);
    }
  };

  // Pagination handlers for QR codes table
  const handleQrChangePage = (event: unknown, newPage: number) => {
    setQrPage(newPage);
  };

  const handleQrChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQrRowsPerPage(parseInt(event.target.value, 10));
    setQrPage(0);
  };

  // Paginated QR code results
  const paginatedQrResults = useMemo(() => {
    const startIndex = qrPage * qrRowsPerPage;
    const endIndex = startIndex + qrRowsPerPage;
    return qrCodeData.slice(startIndex, endIndex);
  }, [qrCodeData, qrPage, qrRowsPerPage]);

  return (
    <Box sx={{ p: 1 }}>
      {/* Page Title */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 2,
        }}
      >
        Make Order
      </Typography>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <Controller
            name="productionOrder"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Production Order *"
                variant="outlined"
                error={!!errors.productionOrder}
                helperText={errors.productionOrder?.message || ''}
              />
            )}
          />
        </FormControl>

        <FormControl sx={{ minWidth: 175 }} size="small">
          <Controller
            name="drawingNumber"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                size="small"
                options={drawingNumbers}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.drawingNumber || '';
                }}
                loading={drawingLoading}
                onInputChange={(_, value) => {
                  if (value.length >= 3) {
                    debouncedDrawingSearch(value);
                  }
                }}
                onChange={(_, value) => {
                  field.onChange(value);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === (value?.id || '')
                }
                renderOption={(props, option) => (
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
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Drawing Number *"
                    error={!!errors.drawingNumber}
                    helperText={String(errors.drawingNumber?.message || '')}
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
            )}
          />
        </FormControl>

        <FormControl sx={{ minWidth: 175 }} size="small">
          <Controller
            name="productionSeries"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                size="small"
                options={productionSeries}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionSeries || '';
                }}
                loading={prodSeriesLoading}
                onInputChange={(_, value) => {
                  if (value.length >= 2) {
                    debouncedProdSeriesSearch();
                  }
                }}
                onChange={(_, value) => {
                  field.onChange(value);
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
                    error={!!errors.productionSeries}
                    helperText={String(errors.productionSeries?.message || '')}
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
            )}
          />
        </FormControl>

        <FormControl sx={{ minWidth: 100 }} size="small">
          <Controller
            name="startIdNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Start ID Number"
                variant="outlined"
                type="number"
                error={!!errors.startIdNumber}
                helperText={errors.startIdNumber?.message}
                sx={{ width: 100 }}
              />
            )}
          />
        </FormControl>

        <FormControl sx={{ minWidth: 100 }} size="small">
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Quantity *"
                variant="outlined"
                type="number"
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
                sx={{ width: 100 }}
              />
            )}
          />
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          sx={{ minWidth: 150, height: 32 }}
          size="small"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <ShoppingCartIcon sx={{ mr: 1 }} />
          Make Order
        </Button>
        
        <Button
          variant="contained"
          color="error"
          sx={{ minWidth: 150, height: 32 }}
          size="small"
          onClick={handleReset}
        >
          <RefreshIcon sx={{ mr: 1 }} />
          Reset
        </Button>
      </Box>

      {/* Tables Section - Split into two side-by-side tables */}
      <Grid container spacing={2}>
        {/* BOM Table */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
            <Typography variant="subtitle1" align="center" fontWeight="bold" sx={{ mb: 0.5 }}>
              BOM for {watchDrawingNumber?.drawingNumber || 'CK310-0800-360CB'}
            </Typography>
            <Typography variant="caption" align="center" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Double-click on any row to load available components
            </Typography>
            <TableContainer sx={{ maxHeight: 300, overflow: 'auto' }}>
              <Table stickyHeader sx={{ minWidth: 400 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Sr</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Drawing Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Nomenclature</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bomData.map((item, index) => (
                    <TableRow 
                      key={item.sr} 
                      hover
                      onDoubleClick={() => handleBomRowDoubleClick(item, index)}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedBomRow === index ? '#e3f2fd' : 'inherit',
                        '&:hover': {
                          backgroundColor: selectedBomRow === index ? '#bbdefb' : '#f5f5f5',
                        }
                      }}
                    >
                      <TableCell>{item.sr}</TableCell>
                      <TableCell>{item.drawingNumber}</TableCell>
                      <TableCell>{item.nomenclature}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                    </TableRow>
                  ))}
                  {bomData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No BOM data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* QR Codes Table */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Available QR Codes {qrCodeData.length > 0 ? `(${qrCodeData.length} items)` : ''}
              </Typography>
              {qrCodeLoading && (
                <CircularProgress size={16} sx={{ ml: 1 }} />
              )}
            </Box>
            <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
              <Table stickyHeader sx={{ minWidth: 400 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>QR Code Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Mfg</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qrCodeLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Loading available components...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedQrResults.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{item.qrCodeNumber}</TableCell>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{item.expiry}</TableCell>
                          <TableCell>{item.mfg}</TableCell>
                        </TableRow>
                      ))}
                      {qrCodeData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Double-click on a BOM row to load QR codes
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination for QR Codes */}
            {qrCodeData.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={qrCodeData.length}
                rowsPerPage={qrRowsPerPage}
                page={qrPage}
                onPageChange={handleQrChangePage}
                onRowsPerPageChange={handleQrChangeRowsPerPage}
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default MakeOrder; 