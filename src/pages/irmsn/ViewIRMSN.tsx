import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, CircularProgress, Select, MenuItem, Button, FormControl, InputLabel, Autocomplete, Card, CardContent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { fetchIRMSNList, fetchMSNList, clearTables } from '../../store/slices/irmsnSlice';
import { getAllDepartments, getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce'; 

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList, msnList, loading } = useSelector((state: RootState) => state.irmsn);
  const { departments, productionSeries, drawingNumbers, isLoading: isLoadingCommon } = useSelector((state: RootState) => state.common);
  const [department, setDepartment] = React.useState('');
  const [productionSeriesValue, setProductionSeriesValue] = React.useState('');
  const [drawingNumber, setDrawingNumber] = React.useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [prodSeriesLoading, setProdSeriesLoading] = useState(false);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setLocalLoading(true);
        dispatch(getDrawingNumbers({ search: searchValue }))
          .finally(() => setLocalLoading(false));
      }, 300),
    [dispatch]
  );

  const debouncedDeptSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDeptLoading(true);
        dispatch(getAllDepartments())
          .finally(() => setDeptLoading(false));
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
    dispatch(getDrawingNumbers({}));
  }, [dispatch]);

  // Select first department by default
  useEffect(() => {
    if (departments.length > 0 && !department && !selectedDepartment) {
      const firstDept = departments[0];
      setDepartment(firstDept.id);
      setSelectedDepartment(firstDept);
    }
  }, [departments, department, selectedDepartment]);

  const handleSearch = () => {
    const params = {
      drawingNumber: selectedDrawing?.drawingNumber || '',
      productionSeries: selectedProductionSeries?.productionSeries || '',
      departmentTypeId: selectedDepartment?.id || '',
      stage: ''  // Add stage if needed
    };
    
    dispatch(fetchIRMSNList(params));
    dispatch(fetchMSNList(params));
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "100%", mx: "auto" }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
        }}
      >
        View IR/MSN
      </Typography>
      {/* Form Controls */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <Autocomplete
                size="small"
                options={departments}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.name || '';
                }}
                value={selectedDepartment}
                loading={deptLoading}
                onInputChange={(_, value) => {
                  if (value.length >= 2) {
                    debouncedDeptSearch(value);
                  }
                }}
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
                          {deptLoading ? (
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
            <FormControl sx={{ minWidth: 200 }} size="small">
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
                  if (value.length >= 2) {
                    debouncedProdSeriesSearch(value);
                  }
                }}
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
            <FormControl sx={{ minWidth: 200 }} size="small">
              <Autocomplete
                size="small"
                options={drawingNumbers}
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
                    label="Drawing Number"
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
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 80, height: 32 }}
              size="small"
              onClick={handleSearch}
              disabled={!productionSeriesValue || loading}
            >
              Search
            </Button>
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 80, height: 32 }}
              size="small"
              onClick={handleReset}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* IR Numbers Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <Typography variant="subtitle1" align="center" fontWeight="bold" sx={{ mb: 1 }}>IR Numbers</Typography>
        <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 800 }} size="small">
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
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.drawingNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.idNumberRange}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{new Date(item.createdDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.userName}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.stage}</TableCell>
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
          <Table stickyHeader sx={{ minWidth: 800 }} size="small">
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
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.drawingNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.idNumberRange}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.poNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{new Date(item.createdDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.userName}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.stage}</TableCell>
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