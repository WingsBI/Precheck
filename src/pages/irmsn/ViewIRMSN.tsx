import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, CircularProgress, Select, MenuItem, Button, FormControl, InputLabel, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { fetchIRMSNList } from '../../store/slices/irmsnSlice';
import { getAllDepartments, getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce';

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList, loading } = useSelector((state: RootState) => state.irmsn);
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

  useEffect(() => {
    dispatch(fetchIRMSNList(search));
  }, [dispatch, search]);

  return (
    <Box>
      <Typography variant="h2" gutterBottom>View IR/MSN</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <FormControl sx={{ minWidth: 250 }} size="small">
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
                <Typography variant="body1">
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
        <FormControl sx={{ minWidth: 250 }} size="small">
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
                <Typography variant="body1">
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
        <FormControl sx={{ minWidth: 250 }} size="small">
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
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
                  <Typography variant="body1">
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
          sx={{ minWidth: 100, ml: 2 }}
          size="small"
          onClick={() => dispatch(fetchIRMSNList(search))}
          disabled={!productionSeriesValue || loading}
        >
          Search
        </Button>
        <Button
          variant="contained"
          color="error"
          sx={{ minWidth: 100, ml: 1 }}
          size="small"
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>
      

      {/* IR Numbers Table */}
      <Paper sx={{ mt: 4, mb: 4, p: 2, boxShadow: 2 }}>
        <Typography variant="h6" align="center" fontWeight="bold" gutterBottom>IR Numbers</Typography>
        <TableContainer>
          <Table sx={{ minWidth: 900, minHeight: 250 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Sr No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>IR No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Drg Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>ID Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>UserName</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Data rows go here. Leave empty for now. */}
              <TableRow>
                <TableCell colSpan={7} sx={{ height: 80 }} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MSN Numbers Table */}
      <Paper sx={{ mb: 4, p: 2, boxShadow: 2 }}>
        <Typography variant="h6" align="center" fontWeight="bold" gutterBottom>MSN Numbers</Typography>
        <TableContainer>
          <Table sx={{ minWidth: 900 ,minHeight: 250}} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Sr No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>MSN No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Drg Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>ID Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>MRIR No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>UserName</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Data rows go here. Leave empty for now. */}
              <TableRow>
                <TableCell colSpan={8} sx={{ height: 80 }} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ViewIRMSN; 