import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Backdrop,
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as ExportIcon,
  Refresh as ResetIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { debounce } from 'lodash';
import type { RootState } from '../../store/store';
import { 
  getSopAssemblyData, 
  exportSopAssemblyData, 
  clearAssemblyData, 
  clearError,
  setSearchCriteria 
} from '../../store/slices/sopSlice';
import { 
  getAllProductionSeries, 
  getDrawingNumbers 
} from '../../store/slices/commonSlice';

interface FormData {
  prodSeriesId: number;
  drawingNumberId: number;
  assemblyNumber: string;
}

const ViewSOP: React.FC = () => {
  const dispatch = useDispatch();

  // Redux state
  const { 
    assemblyData, 
    isLoading, 
    isExporting, 
    error 
  } = useSelector((state: RootState) => state.sop);
  
  const { 
    productionSeries, 
    drawingNumbers, 
    isLoading: commonLoading 
  } = useSelector((state: RootState) => state.common);

  // Local state matching ViewModel
  const [drwDisplayText, setDrwDisplayText] = useState('');
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [isDRWDropDownOpen, setIsDRWDropDownOpen] = useState(false);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form setup
  const { control, handleSubmit, reset, watch, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      prodSeriesId: 0,
      drawingNumberId: 0,
      assemblyNumber: '',
    }
  });

  const watchedValues = watch();

  // Debounced drawing number search - matches LoadDRWNumbers logic
  const loadDRWNumbers = useCallback(
    debounce(async (searchText: string) => {
      if (!searchText || searchText.length < 3) {
        setIsDRWDropDownOpen(false);
        return;
      }

      try {
        const result = await dispatch(getDrawingNumbers({ search: searchText }) as any);
        if (result.payload && result.payload.length > 0) {
          setIsDRWDropDownOpen(true);
        } else {
          setIsDRWDropDownOpen(false);
        }
      } catch (error) {
        console.error('Error loading drawing numbers:', error);
        setIsDRWDropDownOpen(false);
      }
    }, 300),
    [dispatch]
  );

  // Initialize data - matches InitializeAsync
  useEffect(() => {
    const initializeAsync = async () => {
      try {
        await dispatch(getAllProductionSeries() as any);
      } catch (error) {
        console.error('Initialization failed:', error);
      }
    };

    initializeAsync();
  }, [dispatch]);

  // Handle DRW display text changes
  useEffect(() => {
    if (!isSelectingItem) {
      loadDRWNumbers(drwDisplayText);
    }
  }, [drwDisplayText, isSelectingItem, loadDRWNumbers]);

  // Clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Validate required fields - matches ValidateRequiredFields
  const validateRequiredFields = useCallback((): string[] => {
    const values = getValues();
    const missingFields: string[] = [];
    
    if (!values.drawingNumberId || values.drawingNumberId <= 0) {
      missingFields.push('Drawing Number');
    }
    
    if (!values.prodSeriesId || values.prodSeriesId <= 0) {
      missingFields.push('Series Number');
    }
    
    return missingFields;
  }, [getValues]);

  // Handle search - matches ExecuteSearch
  const executeSearch = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(`Please fill the following required fields: ${missingFields.join(', ')}`);
        return;
      }

      const values = getValues();
      const request = {
        assemblyDrawingId: values.drawingNumberId || 0,
        serielNumberId: parseInt(values.assemblyNumber || '0') || 0,
        prodSeriesId: values.prodSeriesId || 0,
      };

      dispatch(setSearchCriteria(request));
      const result = await dispatch(getSopAssemblyData(request) as any);
      
      if (result.payload && result.payload.length > 0) {
        setSuccessMessage(`Found ${result.payload.length} records matching your criteria.`);
      } else {
        setSuccessMessage('No records found matching your criteria.');
      }
    } catch (error) {
      console.error('Error during search:', error);
      setSuccessMessage('Error during search');
    }
  }, [dispatch, validateRequiredFields, getValues]);

  // Handle export - matches ExecuteExport
  const executeExport = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(`Please fill the following required fields before exporting: ${missingFields.join(', ')}`);
        return;
      }

      if (!assemblyData || assemblyData.length === 0) {
        setSuccessMessage('No data available to export. Please perform a search first.');
        return;
      }

      const values = getValues();
      const request = {
        assemblyDrawingId: values.drawingNumberId || 0,
        serielNumberId: parseInt(values.assemblyNumber || '0') || 0,
        prodSeriesId: values.prodSeriesId || 0,
      };

      await dispatch(exportSopAssemblyData(request) as any);
      setSuccessMessage('Export completed successfully!');
    } catch (error) {
      console.error('Error during export:', error);
      setSuccessMessage('Error during export');
    }
  }, [dispatch, validateRequiredFields, assemblyData, getValues]);

  // Handle reset - matches ExecuteReset
  const executeReset = useCallback(() => {
    // Clear all form values
    reset({
      prodSeriesId: 0,
      drawingNumberId: 0,
      assemblyNumber: '',
    });
    
    // Clear local state
    setDrwDisplayText('');
    setSelectedDrawingNumber(null);
    setIsDRWDropDownOpen(false);
    setIsSelectingItem(false);
    setSuccessMessage('');
    
    // Clear Redux state
    dispatch(clearAssemblyData());
  }, [reset, dispatch]);

  // Handle drawing number selection
  const handleDrawingNumberChange = useCallback((newValue: any) => {
    if (newValue) {
      setIsSelectingItem(true);
      try {
        setSelectedDrawingNumber(newValue);
        setDrwDisplayText(newValue.drawingNumber || '');
        setValue('drawingNumberId', newValue.id || 0);
      } finally {
        setIsSelectingItem(false);
      }
    } else {
      setSelectedDrawingNumber(null);
      setValue('drawingNumberId', 0);
    }
  }, [setValue]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert 
          severity={successMessage.includes('Error') || successMessage.includes('Please fill') ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      {/* Input Section - matches XAML Border with form */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          border: '1px solid #E0E0E0'
        }}
      >
        <Grid container spacing={2} alignItems="end">
          {/* Production Series - matches first Grid.Column */}
          <Grid item xs={12} sm={6} md={2}>
            <Controller
              name="prodSeriesId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Prod Series <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <Select 
                    {...field} 
                    displayEmpty
                    sx={{ height: 35 }}
                  >
                    <MenuItem value={0}>Select Series</MenuItem>
                    {productionSeries.map((series: any) => (
                      <MenuItem key={series.id} value={series.id}>
                        {series.productionSeries}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          {/* Drawing Number - matches second Grid.Column with ComboBox */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
              Drawing Number: <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Autocomplete
              options={drawingNumbers || []}
              getOptionLabel={(option: any) => option.drawingNumber || ''}
              value={selectedDrawingNumber}
              onChange={(_, newValue) => handleDrawingNumberChange(newValue)}
              inputValue={drwDisplayText}
              onInputChange={(_, newInputValue) => {
                if (!isSelectingItem) {
                  setDrwDisplayText(newInputValue);
                }
              }}
              open={isDRWDropDownOpen}
              onOpen={() => setIsDRWDropDownOpen(true)}
              onClose={() => setIsDRWDropDownOpen(false)}
              loading={commonLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-root': { height: 35 },
                    minWidth: 180
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {commonLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option: any) => (
                <li {...props}>
                  <Typography variant="body2">{option.drawingNumber}</Typography>
                </li>
              )}
              noOptionsText={
                drwDisplayText.length < 3 
                  ? "Type at least 3 characters" 
                  : "No drawing numbers found"
              }
            />
          </Grid>

          {/* Assembly ID Number - matches third Grid.Column */}
          <Grid item xs={12} sm={6} md={2.5}>
            <Controller
              name="assemblyNumber"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Assembly ID Number: <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <TextField
                    {...field}
                    size="small"
                    fullWidth
                    sx={{ '& .MuiInputBase-root': { height: 35 } }}
                  />
                </Box>
              )}
            />
          </Grid>

          {/* Buttons - matches StackPanel with buttons */}
          <Grid item xs={12} md={4.5}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={executeSearch}
                disabled={isLoading}
                sx={{ 
                  backgroundColor: '#2196F3',
                  '&:hover': { backgroundColor: '#1976D2' },
                  height: 35,
                  minWidth: 120,
                  fontWeight: 'bold'
                }}
              >
                Search
              </Button>
              
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={executeExport}
                disabled={isExporting || !assemblyData || assemblyData.length === 0}
                sx={{ 
                  backgroundColor: '#810055',
                  '&:hover': { backgroundColor: '#6d0047' },
                  height: 35,
                  minWidth: 120,
                  fontWeight: 'bold'
                }}
              >
                Export
              </Button>
              
              <Button
                variant="contained"
                startIcon={<ResetIcon />}
                onClick={executeReset}
                sx={{ 
                  backgroundColor: '#f44336',
                  '&:hover': { backgroundColor: '#d32f2f' },
                  height: 35,
                  minWidth: 120,
                  fontWeight: 'bold'
                }}
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid Section - matches XAML DataGrid */}
      <Paper elevation={1} sx={{ border: '1px solid #E0E0E0' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Sr No.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 130 }}>Drawing Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 90 }}>Nomenclature</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 80 }}>ID No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Quantity</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 130 }}>IR Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 130 }}>MSN Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 60 }}>Remarks</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 80 }}>Assembly Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assemblyData && assemblyData.length > 0 ? (
                assemblyData.map((item, index) => (
                  <TableRow 
                    key={item.serialNumber || index} 
                    sx={{ 
                      backgroundColor: index % 2 === 1 ? '#E3F2FD' : 'white',
                      height: 40
                    }}
                  >
                    <TableCell align="center">{item.serialNumber}</TableCell>
                    <TableCell align="center">{item.drawingNumber}</TableCell>
                    <TableCell align="center">{item.nomenclature}</TableCell>
                    <TableCell align="center">{item.idNumber}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="center">{item.irNumber}</TableCell>
                    <TableCell align="center">{item.msnNumber}</TableCell>
                    <TableCell align="center">{item.remarks}</TableCell>
                    <TableCell align="center">{item.assemblyNumber}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {isLoading ? 'Loading...' : 'No data available. Please perform a search.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Loading Backdrop - matches XAML Loader */}
      <Backdrop
        sx={{ color: '#fff', zIndex: 1000 }}
        open={isExporting}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: 'white',
            color: 'black',
            minWidth: 350,
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CircularProgress 
            size={50} 
            sx={{ 
              color: '#4BACC6',
              mb: 2
            }} 
          />
          <Typography variant="h6" sx={{ fontSize: 16 }}>
            Exporting SOP Data, please wait...
          </Typography>
        </Paper>
      </Backdrop>
    </Box>
  );
};

export default ViewSOP; 