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
  TablePagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getConsumedIn } from '../../store/slices/qrcodeSlice';
import { getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce';

const ViewConsumedIn: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { consumedInList, loading } = useSelector((state: RootState) => state.qrcode);
  const { productionSeries, drawingNumbers, isLoading: isLoadingCommon } = useSelector((state: RootState) => state.common);
  
  // Form state
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [idNumber, setIdNumber] = useState('');
  const [assemblyNumber, setAssemblyNumber] = useState('');
  
  // Loading states
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [prodSeriesLoading, setProdSeriesLoading] = useState(false);
  
  // Search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Sorting state
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Sorting functions
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedResults = useMemo(() => {
    if (!orderBy) return searchResults;
    
    return [...searchResults].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      
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

  const handleViewConsumption = () => {
    // Validate required fields
    if (!selectedDrawing || !selectedProductionSeries) {
      alert('Please select both Drawing Number and Production Series');
      return;
    }

    // According to the API spec, the GetConsumedIn endpoint expects these parameters:
    // ProdSeriesId, IdNumber, DrawingNumberId, AssemblyNumber
    const params = {
      ProdSeriesId: selectedProductionSeries.id,
      IdNumber: idNumber ? parseInt(idNumber) : undefined,
      DrawingNumberId: selectedDrawing.id,
      AssemblyNumber: assemblyNumber || undefined
    };
    
    // Call API with required parameters
    dispatch(getConsumedIn(params)).then((result: any) => {
      if (result.payload && Array.isArray(result.payload)) {
        // Map the API response to our table format
        const mappedResults = result.payload.map((item: any, index: number) => ({
          sr: index + 1,
          idNumber: item.idNumber || item.id || '',
          consumedInDrawingNumber: item.consumedInDrawingNumber || item.drawingNumber || '',
          poNumber: item.poNumber || item.productionOrderNumber || '',
          irNumber: item.irNumber || '',
          msnNumber: item.msnNumber || '',
          date: item.date || item.createdDate || '',
          username: item.username || item.userName || ''
        }));
        setSearchResults(mappedResults);
      } else {
        setSearchResults([]);
      }
      setShowResults(true);
    }).catch(() => {
      setSearchResults([]);
      setShowResults(true);
    });
  };

  const handleReset = () => {
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setIdNumber('');
    setAssemblyNumber('');
    setSearchResults([]);
    setShowResults(false);
    setOrderBy('');
    setOrder('asc');
    setPage(0);
  };

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
        View Consumed In
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <FormControl sx={{ minWidth: 175 }} size="small">
          <Autocomplete
            size="small"
            sx={{ width: 175 }}
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
            sx={{ width: 175 }}
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
        <FormControl sx={{ minWidth: 150 }} size="small">
          <TextField
            size="small"
            sx={{ width: 150 }}
            label="Assembly Number"
            value={assemblyNumber}
            onChange={(e) => setAssemblyNumber(e.target.value)}
            variant="outlined"
          />
        </FormControl>
        <FormControl sx={{ minWidth: 130 }} size="small">
          <TextField
            size="small"
            sx={{ width: 130 }}
            label="ID Number"
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
          onClick={handleViewConsumption}
          disabled={loading}
        >
          <SearchIcon sx={{ mr: 1 }} />
          View Consumption
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
      </Box>

      {/* Results Display */}
      {showResults && (
        <Typography
          variant="body2"
          sx={{ mb: 1, fontWeight: 'medium' }}
        >
          Showing consumption results for {selectedDrawing?.drawingNumber || ''} / {selectedProductionSeries?.productionSeries || ''}
        </Typography>
      )}

      {/* Results Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 800 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5', height: 24 }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'sr'}
                    direction={orderBy === 'sr' ? order : 'asc'}
                    onClick={() => handleRequestSort('sr')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Sr No
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'idNumber'}
                    direction={orderBy === 'idNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('idNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'consumedInDrawingNumber'}
                    direction={orderBy === 'consumedInDrawingNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('consumedInDrawingNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Consumed IN Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'poNumber'}
                    direction={orderBy === 'poNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('poNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    PO Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'irNumber'}
                    direction={orderBy === 'irNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('irNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    IR Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'msnNumber'}
                    direction={orderBy === 'msnNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('msnNumber')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    MSN Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'date'}
                    direction={orderBy === 'date' ? order : 'asc'}
                    onClick={() => handleRequestSort('date')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.3, px: 0.8, fontSize: '0.85rem' }}>
                  <TableSortLabel
                    active={orderBy === 'username'}
                    direction={orderBy === 'username' ? order : 'asc'}
                    onClick={() => handleRequestSort('username')}
                    sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Username
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 150 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item, index) => (
                  <TableRow key={index} hover sx={{ height: 36 }}>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.sr}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.idNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.consumedInDrawingNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.poNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.irNumber || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.msnNumber || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.date || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem' }}>{item.username || '-'}</TableCell>
                  </TableRow>
                ))
              ) : showResults ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 150 }}>No records found</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 150, color: 'text.secondary' }}>
                    Enter search criteria and click "View Consumption" to see results
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
    </Box>
  );
};

export default ViewConsumedIn; 