import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, CircularProgress, Select, MenuItem, Button, FormControl, InputLabel, Autocomplete, Card, CardContent, Alert } from '@mui/material';
import api from '../../services/api';
import SearchIcon from '@mui/icons-material/Search';
import { fetchIRMSNList, fetchMSNList, clearTables } from '../../store/slices/irmsnSlice';
import { getAllDepartments, getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce'; 
import {
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList, msnList, loading } = useSelector((state: RootState) => state.irmsn);
  const { departments, productionSeries, drawingNumbers, isLoading: isLoadingCommon } = useSelector((state: RootState) => state.common);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [department, setDepartment] = React.useState('');
  const [productionSeriesValue, setProductionSeriesValue] = React.useState('');
  const [drawingNumber, setDrawingNumber] = React.useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localDrawingNumbers, setLocalDrawingNumbers] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });

  const debouncedSearch = useMemo(
    () =>
      debounce(async (search: string) => {
        if (search.length < 3) {
          setLocalDrawingNumbers([]);
          setSelectedDrawing(null);
          return;
        }
        setLocalLoading(true);
        try {
          const response = await api.get("/api/Common/GetAllDrawingNumber", {
            params: {
              ComponentType: "",
              search,
              pageSize: 10, // Limit results for better performance
            },
          });
          setLocalDrawingNumbers(response.data);
        } catch (error) {
          console.error("Error fetching drawing numbers:", error);
          setLocalDrawingNumbers([]);
        } finally {
          setLocalLoading(false);
        }
      }, 300),
    []
  );

  // Remove unnecessary debounced searches - departments and production series are loaded once

  const handleReset = () => {
    // Reset all fields to empty
    setDepartment('');
    setSelectedDepartment(null);
    setProductionSeriesValue('');
    setSelectedProductionSeries(null);
    setDrawingNumber('');
    setSelectedDrawing(null);
    // Clear table data
    dispatch(clearTables());
  };

  const search = `${department} ${productionSeriesValue} ${drawingNumber}`.trim();

  useEffect(() => {
    dispatch(getAllDepartments());
    dispatch(getAllProductionSeries());
    // Don't load all drawing numbers initially - load them only when user searches
  }, [dispatch]);

  // Select first department by default if user doesn't have a specific department
  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      // Try to use user's department first, otherwise select first available
      const userDept = currentUser?.deptid ? 
        departments.find(dept => dept.id.toString() === currentUser.deptid?.toString()) : null;
      const deptToSelect = userDept || departments[0];
      
      if (deptToSelect) {
        setDepartment(deptToSelect.id);
        setSelectedDepartment(deptToSelect);
      }
    }
  }, [departments, selectedDepartment, currentUser?.deptid]);

  const handleSearch = async () => {
    // Validate required fields like C# version does
    const missingFields = [];
    
    if (!selectedDepartment) {
      missingFields.push('Department Type');
    }
    
    if (!selectedProductionSeries) {
      missingFields.push('Production Series');
    }
    
    if (missingFields.length > 0) {
      setStatusMessage({ 
        type: 'error', 
        message: `Please fill the following required fields: ${missingFields.join(', ')}` 
      });
      return;
    }

    try {
      // Match C# parameter structure exactly
      const params = {
        drawingNumber: selectedDrawing?.drawingNumber || '', // Optional like C#
        productionSeries: selectedProductionSeries?.productionSeries || '', // Required string value
        departmentTypeId: selectedDepartment?.id?.toString() || '', // Required department ID
        stage: ''  // Stage parameter
      };
      
      console.log('Search params:', params); // Debug log
      console.log('Current user context:', currentUser); // Debug log
      console.log('Department ID:', selectedDepartment?.id); // Debug log
      console.log('Production Series Value:', selectedProductionSeries?.productionSeries); // Debug log
      
      // Dispatch both actions and wait for them to complete
      const [irResult, msnResult] = await Promise.all([
        dispatch(fetchIRMSNList(params)),
        dispatch(fetchMSNList(params))
      ]);

      // Show success message like C# version does
      const irCount = irResult.payload?.length || 0;
      const msnCount = msnResult.payload?.length || 0;

      if (irCount > 0 || msnCount > 0) {
        setStatusMessage({ 
          type: 'success', 
          message: `Data loaded successfully. IR Numbers: ${irCount}, MSN Numbers: ${msnCount}` 
        });
        console.log(`Data loaded successfully. IR: ${irCount}, MSN: ${msnCount}`);
      } else {
        setStatusMessage({ 
          type: 'info', 
          message: 'No records found for the selected criteria.' 
        });
        console.log('No records found for the selected criteria.');
      }
    } catch (error) {
      console.error('Error loading IR/MSN numbers:', error);
      setStatusMessage({ 
        type: 'error', 
        message: 'Error loading IR/MSN numbers. Please try again.' 
      });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 1 }, maxWidth: "100%", mx: "auto" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1rem', sm: '1rem', md: '1.25rem' }
        }}
      >
        View IR/MSN
      </Typography>

      {/* Status Message */}
      {statusMessage.type && (
        <Alert 
          severity={statusMessage.type} 
          sx={{ mb: 2 }}
          onClose={() => setStatusMessage({ type: null, message: '' })}
        >
          {statusMessage.message}
        </Alert>
      )}
      {/* Form Controls */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'column', md: 'row' }, 
            alignItems: { xs: 'stretch', md: 'center' }, 
            gap: { xs: 2, md: 1.5 },
            flexWrap: 'wrap'
          }}>
            <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flex: { md: 1 } }} size="small">
              <Autocomplete
                size="small"
                options={departments}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.name || '';
                }}
                value={selectedDepartment}
                loading={isLoadingCommon}
                onChange={(_, value) => {
                  setSelectedDepartment(value);
                  setDepartment(value ? value.id : '');
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === (value?.id || '')
                }
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant="body2">
                      {option.name}
                    </Typography>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Department Type *"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingCommon ? (
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
            <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flex: { md: 0.5 } }} size="small">
              <Autocomplete
                size="small"
                options={productionSeries}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionSeries || '';
                }}
                value={selectedProductionSeries}
                loading={isLoadingCommon}
                onChange={(_, value) => {
                  setSelectedProductionSeries(value);
                  setProductionSeriesValue(value ? value.id : '');
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
                    label="Prod Series *"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingCommon ? (
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
            <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flex: { md: 1 } }} size="small">
              <Autocomplete
                size="small"
                options={localDrawingNumbers}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.drawingNumber || '';
                }}
                value={selectedDrawing}
                loading={localLoading}
                onInputChange={(_, value) => {
                  setSearchTerm(value);
                  if (value.length >= 3) {
                    debouncedSearch(value);
                  }
                }}
                onChange={(_, value) => {
                  setSelectedDrawing(value);
                  setDrawingNumber(value ? value.id : '');
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
                    label="Drawing No"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {localLoading ? (
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
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', md: 'auto' },
              mt: { xs: 1, md: 0 }
            }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ 
                  minWidth: { xs: '100%', sm: 100 }, 
                  height: 32,
                  flex: { xs: 1, sm: 'none' }
                }}
                size="small"
                onClick={handleSearch}
                disabled={!selectedDepartment || !selectedProductionSeries || loading}
              >
                <SearchIcon sx={{ mr: 1 }} />
                Search
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ 
                  minWidth: { xs: '100%', sm: 80 }, 
                  height: 32,
                  flex: { xs: 1, sm: 'none' }
                }}
                size="small"
                onClick={handleReset}
              >
                <RefreshIcon sx={{ mr: 1 }} />
                Reset
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* IR Numbers Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <Typography variant="subtitle1" align="center" fontWeight="bold" sx={{ mb: 1 }}>IR Numbers</Typography>
        <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: { xs: 600, md: 800 } }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5', height: 36 }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Sr No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>IR No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Drg Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>ID Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>UserName</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Stage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ height: 150 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : irmsnList.length > 0 ? (
                irmsnList.map((item, index) => (
                  <TableRow key={item.id} hover sx={{ height: 36 }}>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{index + 1}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.irNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.drawingNumberIdName || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.idNumberRange || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.userName || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.stage || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ height: 150 }}>No records found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MSN Numbers Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <Typography variant="subtitle1" align="center" fontWeight="bold" sx={{ mb: 1 }}>MSN Numbers</Typography>
        <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: { xs: 600, md: 800 } }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5', height: 36 }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Sr No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>MSN No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Drg Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>ID Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>MRIR No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>UserName</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>Stage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 150 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : msnList.length > 0 ? (
                msnList.map((item, index) => (
                  <TableRow key={item.id} hover sx={{ height: 36 }}>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{index + 1}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.msnNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.drawingNumberIdName || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.idNumberRange || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.productionOrderNumber || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.userName || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.stage || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 150 }}>No records found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ViewIRMSN; 