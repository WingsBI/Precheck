import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  FormLabel,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TablePagination,
  Autocomplete,
  FormHelperText,
  Backdrop,
  Divider,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  GetApp as GetAppIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { RootState, AppDispatch } from '../../store/store';
import type { DrawingNumber, QRCodeFormData, IRNumber, MSNNumber, QRCodeItem, QRCodePayload } from '../../types';
import { 
  generateQRCode, 
  generateBatchQRCode, 
  exportQRCode, 
  exportBulkQRCodes,
  fetchIRNumbers,
  fetchMSNNumbers,
  clearError,
  clearGeneratedNumber,
  clearQRCodeList
} from '../../store/slices/qrcodeSlice';
import { 
  getDrawingNumbers, 
  getAllProductionSeries, 
  getAllUnits 
} from '../../store/slices/commonSlice';
import debounce from 'lodash/debounce';

// Create typed versions of the hooks
const useAppDispatch: () => AppDispatch = useDispatch;

export default function BarcodeGeneration() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const dispatch = useAppDispatch();

  // Redux state
  const { 
    qrcodeList, 
    irNumbers, 
    msnNumbers, 
    batchItems, 
    loading, 
    error, 
    generatedNumber,
    isDownloading 
  } = useSelector((state: RootState) => state.qrcode);
  
  const { 
    drawingNumbers, 
    productionSeries, 
    units 
  } = useSelector((state: RootState) => state.common);

  // Local state
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(null);
  const [selectedIRNumber, setSelectedIRNumber] = useState<IRNumber | null>(null);
  const [selectedMSNNumber, setSelectedMSNNumber] = useState<MSNNumber | null>(null);
  const [componentType, setComponentType] = useState<'ID' | 'BATCH' | 'FIM' | 'SI'>('ID');
  const [idType, setIdType] = useState<'series' | 'random'>('series');
  const [randomIds, setRandomIds] = useState<string[]>(Array(12).fill(''));
  const [selectedBarcodes, setSelectedBarcodes] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<QRCodeFormData>({
    defaultValues: {
      componentType: 'ID',
      idType: 'series',
      quantity: 1,
      startRange: 1,
      endRange: 1,
      disposition: 'Accepted',
      manufacturingDate: new Date(),
      randomIds: Array(12).fill(''),
    }
  });

  const watchComponentType = watch('componentType');
  const watchIdType = watch('idType');
  const watchQuantity = watch('quantity');
  const watchStartRange = watch('startRange');

  // Load initial data
  useEffect(() => {
    dispatch(getAllProductionSeries());
    dispatch(getAllUnits());
    dispatch(fetchIRNumbers(undefined));
    dispatch(fetchMSNNumbers(undefined));
  }, [dispatch]);

  // Auto-update end range when quantity or start range changes
  useEffect(() => {
    if (watchQuantity && watchStartRange && watchComponentType === 'ID' && watchIdType === 'series') {
      const endRange = watchStartRange + watchQuantity - 1;
      setValue('endRange', endRange);
    }
  }, [watchQuantity, watchStartRange, watchComponentType, watchIdType, setValue]);

  // Update component type visibility
  useEffect(() => {
    setComponentType(watchComponentType);
    if (watchComponentType !== 'ID') {
      setIdType('series');
      setValue('idType', 'series');
    }
  }, [watchComponentType, setValue]);

  // Update ID type
  useEffect(() => {
    setIdType(watchIdType);
  }, [watchIdType]);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () => debounce((search: string) => {
      if (search.length >= 3) {
        dispatch(getDrawingNumbers({ search }));
      }
    }, 300),
    [dispatch]
  );

  const debouncedIRSearch = useMemo(
    () => debounce((search: string) => {
      if (search.length >= 3) {
        dispatch(fetchIRNumbers(search));
      }
    }, 300),
    [dispatch]
  );

  const debouncedMSNSearch = useMemo(
    () => debounce((search: string) => {
      if (search.length >= 3) {
        dispatch(fetchMSNNumbers(search));
      }
    }, 300),
    [dispatch]
  );

  // Handle random ID changes
  const handleRandomIdChange = (index: number, value: string) => {
    const newRandomIds = [...randomIds];
    newRandomIds[index] = value;
    setRandomIds(newRandomIds);
    setValue('randomIds', newRandomIds);
    
    // Update quantity based on filled random IDs
    const filledCount = newRandomIds.filter(id => id.trim() !== '').length;
    setValue('quantity', filledCount);
  };

  // Handle batch data generation
  const handleGenerateBatchData = async () => {
    if (selectedDrawing) {
      await dispatch(generateBatchQRCode({
        drawingNumberId: selectedDrawing.id,
        quantity: watchQuantity
      }));
    }
  };

  // Prepare payload for QR code generation
  const preparePayload = (data: QRCodeFormData) => {
    const basePayload: QRCodePayload = {
      productionSeriesId: productionSeries.find(ps => ps.productionSeries === data.productionSeries)?.id || 0,
      componentTypeId: selectedDrawing?.componentTypeId || 0,
      nomenclatureId: selectedDrawing?.nomenclatureId || 0,
      lnItemCodeId: selectedDrawing?.lnItemCodeId || 0,
      rackLocationId: selectedDrawing?.rackLocationId || 0,
      irNumberId: selectedIRNumber?.id || 0,
      msnNumberId: selectedMSNNumber?.id || 0,
      disposition: data.disposition,
      productionOrderNumber: data.poNumber,
      projectNumber: data.projectNumber,
      expiryDate: data.expiryDate?.toISOString() || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      manufacturingDate: data.manufacturingDate.toISOString(),
      drawingNumberId: selectedDrawing?.id || 0,
      unitId: units.find(u => u.unitName === data.unit)?.id || 0,
      mrirNumber: data.mrirNumber,
      remark: data.remark,
      quantity: data.quantity,
      ids: [],
      batchIds: [],
    };

    // Handle different component types
    switch (data.componentType) {
      case 'ID':
        if (data.idType === 'series') {
          basePayload.ids = Array.from(
            { length: data.quantity }, 
            (_, i) => data.startRange + i
          );
        } else {
          basePayload.ids = data.randomIds
            .filter(id => id.trim() !== '')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
        }
        break;
      case 'BATCH':
        basePayload.idNumber = data.batchId;
        basePayload.ids = [parseInt(data.batchId, 10) || 0];
        basePayload.quantity = data.quantity;
        basePayload.batchIds = batchItems.map(item => ({
          quantity: item.quantity,
          batchQuantity: item.batchQuantity,
          assemblyDrawingId: item.assemblyDrawingId
        }));
        break;
      case 'FIM':
      case 'SI':
        basePayload.ids = [1];
        basePayload.quantity = data.quantity;
        basePayload.batchIds = [{ quantity: 0, batchQuantity: 0, assemblyDrawingId: 0 }];
        break;
    }

    return basePayload;
  };

  // Form submission
  const onSubmit = async (data: QRCodeFormData) => {
    try {
      const payload = preparePayload(data);
      await dispatch(generateQRCode(payload)).unwrap();
      setSuccessMessage(`Successfully generated ${data.quantity} QR code(s)!`);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    }
  };

  // Handle actions
  const handleReset = () => {
    reset();
    setSelectedDrawing(null);
    setSelectedIRNumber(null);
    setSelectedMSNNumber(null);
    setComponentType('ID');
    setIdType('series');
    setRandomIds(Array(12).fill(''));
    setSelectedBarcodes([]);
    dispatch(clearGeneratedNumber());
    dispatch(clearQRCodeList());
    setSuccessMessage('');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(qrcodeList.map(item => item.id));
    } else {
      setSelectedBarcodes([]);
    }
  };

  const handleSelectBarcode = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(prev => [...prev, id]);
    } else {
      setSelectedBarcodes(prev => prev.filter(bId => bId !== id));
    }
  };

  const handleDownload = async () => {
    if (selectedBarcodes.length === 0) return;
    
    try {
      const selectedQRCodes = qrcodeList
        .filter(qr => selectedBarcodes.includes(qr.id))
        .map(qr => qr.qrCodeNumber || qr.serialNumber);
      
      await dispatch(exportBulkQRCodes(selectedQRCodes)).unwrap();
      setSuccessMessage('QR codes downloaded successfully!');
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard!');
  };

  // Section Header Component
  const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle?: string }) => (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {title}
        </Typography>
      </Stack>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {subtitle}
        </Typography>
      )}
      <Divider sx={{ mt: 1 }} />
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 },
        maxWidth: '100%',
        mx: 'auto'
      }}>
        {/* Loading Backdrop */}
        <Backdrop open={isDownloading} sx={{ zIndex: theme.zIndex.drawer + 1, color: '#fff' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Downloading QR Code, please wait...
            </Typography>
          </Box>
        </Backdrop>

        {/* Header */}
      

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccessMessage('')}
          >
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}

        {/* Main Form */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
             Add Manufacturing Item
            </Typography>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Row 1: Drawing Number, LN Item Code, Nomenclature */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="drawingNumber"
                    control={control}
                    rules={{ required: 'Drawing Number is required' }}
                    render={({ field: { onChange, ...field } }) => (
                      <Autocomplete
                        {...field}
                        options={drawingNumbers}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.drawingNumber;
                        }}
                        value={selectedDrawing}
                        loading={loading}
                        size="small"
                        onInputChange={(_, value) => {
                          setSearchTerm(value);
                          if (value.length >= 3) {
                            debouncedDrawingSearch(value);
                          }
                        }}
                        onChange={(_, value) => {
                          setSelectedDrawing(value);
                          onChange(value ? value.drawingNumber : "");
                          if (value) {
                            setValue('nomenclature', value.nomenclature);
                            setValue('location', value.location || '');
                            setComponentType(value.componentType as 'ID' | 'BATCH' | 'FIM' | 'SI');
                            setValue('componentType', value.componentType as 'ID' | 'BATCH' | 'FIM' | 'SI');
                          }
                        }}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box sx={{ display: "flex", flexDirection: "column", py: 1 }}>
                              <Typography variant="body1">{option.drawingNumber}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.nomenclature} | {option.componentType}
                              </Typography>
                            </Box>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Drawing Number *"
                            error={!!errors.drawingNumber}
                            helperText={errors.drawingNumber?.message}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loading ? (
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
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="LN Item Code"
                    value={selectedDrawing?.lnItemCode || ''}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: 'grey.50' }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="nomenclature"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nomenclature"
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: 'grey.50' }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 2: Production Series, Available For, Component Type */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="productionSeries"
                    control={control}
                    rules={{ required: 'Production Series is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.productionSeries} size="small">
                        <InputLabel>Prod Series *</InputLabel>
                        <Select {...field} label="Prod Series *">
                          {productionSeries.map((series) => (
                            <MenuItem key={series.id} value={series.productionSeries}>
                              {series.productionSeries}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.productionSeries && (
                          <FormHelperText>{errors.productionSeries.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Available For"
                    value={selectedDrawing?.availableFor || ''}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: 'grey.50' }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Component Type"
                    value={selectedDrawing?.componentType || ''}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: 'grey.50' }}
                  />
                </Grid>
              </Grid>

              {/* Component Type Specific Fields */}
              {componentType === 'ID' && (
                <>
                  {/* ID Type Selection */}
                  <Box sx={{ mb: 2 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>ID Type</FormLabel>
                    <Controller
                      name="idType"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup {...field} row>
                          <FormControlLabel value="series" control={<Radio size="small" />} label="Series" />
                          <FormControlLabel value="random" control={<Radio size="small" />} label="Random" />
                        </RadioGroup>
                      )}
                    />
                  </Box>

                  {idType === 'series' ? (
                    /* Row 3: Start ID, End ID, Quantity */
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="startRange"
                          control={control}
                          rules={{ required: 'Start ID is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Start ID *"
                              type="number"
                              fullWidth
                              size="small"
                              error={!!errors.startRange}
                              helperText={errors.startRange?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="endRange"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="End ID *"
                              type="number"
                              fullWidth
                              size="small"
                              InputProps={{ readOnly: true }}
                              sx={{ bgcolor: 'grey.50' }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="quantity"
                          control={control}
                          rules={{ required: 'Quantity is required', min: 1 }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Quantity *"
                              type="number"
                              fullWidth
                              size="small"
                              error={!!errors.quantity}
                              helperText={errors.quantity?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem', mb: 1 }}>
                        Random IDs (Enter up to 12 IDs)
                      </Typography>
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        {Array.from({ length: 12 }, (_, index) => (
                          <Grid item xs={6} sm={4} md={2} key={index}>
                            <TextField
                              size="small"
                              placeholder={`ID ${index + 1}`}
                              value={randomIds[index]}
                              onChange={(e) => handleRandomIdChange(index, e.target.value)}
                              inputProps={{ maxLength: 10 }}
                              fullWidth
                            />
                          </Grid>
                        ))}
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name="quantity"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Quantity"
                                type="number"
                                fullWidth
                                size="small"
                                InputProps={{ readOnly: true }}
                                sx={{ bgcolor: 'grey.50' }}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </>
              )}

              {componentType === 'BATCH' && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="batchId"
                      control={control}
                      rules={{ required: 'Batch ID is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Batch ID *"
                          fullWidth
                          size="small"
                          error={!!errors.batchId}
                          helperText={errors.batchId?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="quantity"
                      control={control}
                      rules={{ required: 'Quantity is required', min: 1 }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity *"
                          type="number"
                          fullWidth
                          size="small"
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="outlined"
                      onClick={handleGenerateBatchData}
                      disabled={!selectedDrawing}
                      size="small"
                      fullWidth
                    >
                      Get Batch Data
                    </Button>
                  </Grid>
                  
                  {batchItems.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem', mt: 2, mb: 1 }}>
                        Batch Details
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Assembly Number</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Batch Quantity</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {batchItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.assemblyNumber}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">{item.batchQuantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </Grid>
              )}

              {(componentType === 'FIM' || componentType === 'SI') && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="quantity"
                      control={control}
                      rules={{ required: 'Quantity is required', min: 1 }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity *"
                          type="number"
                          fullWidth
                          size="small"
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Row 4: Unit, Manufacturing Date, Project Number */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="unit"
                    control={control}
                    rules={{ required: 'Unit is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.unit} size="small">
                        <InputLabel>Unit *</InputLabel>
                        <Select {...field} label="Unit *">
                          {units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.unitName}>
                              {unit.unitName}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.unit && (
                          <FormHelperText>{errors.unit.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="manufacturingDate"
                    control={control}
                    rules={{ required: 'Manufacturing Date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Manufacturing Date *"
                        maxDate={new Date()}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: !!errors.manufacturingDate,
                            helperText: errors.manufacturingDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="projectNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Project Number"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 5: IR Number, MSN Number */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={irNumbers}
                    getOptionLabel={(option) => option.irNumber}
                    value={selectedIRNumber}
                    loading={loading}
                    size="small"
                    onInputChange={(_, value) => {
                      if (value.length >= 3) {
                        debouncedIRSearch(value);
                      }
                    }}
                    onChange={(_, value) => {
                      setSelectedIRNumber(value);
                      setValue('irNumber', value?.irNumber || '');
                    }}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: "flex", flexDirection: "column", py: 1 }}>
                          <Typography variant="body1">{option.irNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            IDs: {option.idNumberRange} | Series: {option.productionSeriesName}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="IR Number"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={msnNumbers}
                    getOptionLabel={(option) => option.msnNumber}
                    value={selectedMSNNumber}
                    loading={loading}
                    size="small"
                    onInputChange={(_, value) => {
                      if (value.length >= 3) {
                        debouncedMSNSearch(value);
                      }
                    }}
                    onChange={(_, value) => {
                      setSelectedMSNNumber(value);
                      setValue('msnNumber', value?.msnNumber || '');
                    }}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: "flex", flexDirection: "column", py: 1 }}>
                          <Typography variant="body1">{option.msnNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            IDs: {option.idNumberRange} | Series: {option.productionSeriesName}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="MSN Number"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 6: PO Number, MRIR Number */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="poNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="PO Number"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="mrirNumber"
                    control={control}
                    rules={{ 
                      required: selectedDrawing?.drawingNumber?.includes('CB') ? false : 'MRIR Number is required'
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`MRIR Number ${selectedDrawing?.drawingNumber?.includes('CB') ? '' : '*'}`}
                        fullWidth
                        size="small"
                        disabled={selectedDrawing?.drawingNumber?.includes('CB')}
                        error={!!errors.mrirNumber}
                        helperText={errors.mrirNumber?.message}
                        sx={selectedDrawing?.drawingNumber?.includes('CB') ? { bgcolor: 'grey.50' } : {}}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Disposition */}
              <Box sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>Disposition *</FormLabel>
                <Controller
                  name="disposition"
                  control={control}
                  rules={{ required: 'Disposition is required' }}
                  render={({ field }) => (
                    <RadioGroup {...field} row>
                      <FormControlLabel value="Accepted" control={<Radio size="small" />} label="Accepted" />
                      <FormControlLabel value="Rejected" control={<Radio size="small" />} label="Rejected" />
                      <FormControlLabel value="Used for QT" control={<Radio size="small" />} label="Used for QT" />
                    </RadioGroup>
                  )}
                />
                {errors.disposition && (
                  <FormHelperText error>{errors.disposition.message}</FormHelperText>
                )}
              </Box>

              {/* Row 7: Location, Remark */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Location"
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: 'grey.50' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Remark"
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2, 
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 120, py: 1.5 }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <QrCodeIcon />}
                  sx={{ minWidth: 200, py: 1.5 }}
                >
                  {loading ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Generated QR Codes */}
        {qrcodeList.length > 0 && (
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack 
                direction={isMobile ? "column" : "row"} 
                justifyContent="space-between" 
                alignItems={isMobile ? "stretch" : "center"}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Generated QR Codes ({qrcodeList.length})
                </Typography>
                
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Checkbox
                    checked={selectedBarcodes.length === qrcodeList.length && qrcodeList.length > 0}
                    indeterminate={selectedBarcodes.length > 0 && selectedBarcodes.length < qrcodeList.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>Select All</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    disabled={selectedBarcodes.length === 0}
                  >
                    Download ({selectedBarcodes.length})
                  </Button>
                </Stack>
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBarcodes.length === qrcodeList.length && qrcodeList.length > 0}
                          indeterminate={selectedBarcodes.length > 0 && selectedBarcodes.length < qrcodeList.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>Sr. No</TableCell>
                      <TableCell>QR Code</TableCell>
                      <TableCell>ID Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qrcodeList
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedBarcodes.includes(item.id)}
                              onChange={(e) => handleSelectBarcode(item.id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {item.qrCodeNumber || item.serialNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.idNumber || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={item.isNewQrCode ? 'New' : 'Existing'}
                              color={item.isNewQrCode ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Copy QR Code">
                                <IconButton 
                                  size="small"
                                  onClick={() => copyToClipboard(item.qrCodeNumber || item.serialNumber)}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton 
                                  size="small"
                                  onClick={() => dispatch(exportQRCode(item.qrCodeNumber || item.serialNumber))}
                                >
                                  <GetAppIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={qrcodeList.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
} 