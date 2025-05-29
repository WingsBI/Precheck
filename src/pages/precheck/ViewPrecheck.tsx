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
  TablePagination,
  Card,
  CardContent
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { viewPrecheckDetails, exportPrecheckDetails } from '../../store/slices/precheckSlice';
import { getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce';

const ViewPrecheck: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { precheckDetails, isLoading } = useSelector((state: RootState) => state.precheck);
  const { productionSeries, drawingNumbers, isLoading: isLoadingCommon } = useSelector((state: RootState) => state.common);
  
  // Form state
  const [productionOrder, setProductionOrder] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [idNumber, setIdNumber] = useState('');
  
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

  const handleViewPrecheck = () => {
    // According to the API spec, the ViewPrecheck endpoint expects these parameters:
    // ProductionOrderNumber, ProductionSeriesId, Id, DrawingNumberId
    const params = {
      ProductionOrderNumber: productionOrder || undefined,
      ProductionSeriesId: selectedProductionSeries?.id || undefined,
      Id: idNumber ? parseInt(idNumber) : undefined,
      DrawingNumberId: selectedDrawing?.id || undefined
    };
    
    // Only call API if we have at least one parameter
    if (params.ProductionOrderNumber || params.ProductionSeriesId || params.Id || params.DrawingNumberId) {
      dispatch(viewPrecheckDetails(params)).then((result: any) => {
        if (result.payload && Array.isArray(result.payload)) {
          // Map the API response to our table format
          const mappedResults = result.payload.map((item: any, index: number) => ({
            sr: index + 1,
            drawingNumber: item.drawingNumber || item.consumedDrawingNo || '',
            nomenclature: item.nomenclature || '',
            quantity: item.quantity || 0,
            idNumber: item.idNumbers || item.idNumber || '',
            ir: item.irNumber || '',
            msn: item.msnNumber || '',
            mrirNumber: item.mrirNumber || ''
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
    }
  };

  const handleExport = () => {
    // According to the API spec, use ExportPrecheckdetails endpoint
    const exportParams = {
      productionOrderNumber: productionOrder || undefined,
      productionSeriesId: selectedProductionSeries?.id || undefined,
      id: idNumber ? parseInt(idNumber) : undefined,
      drawingNumberId: selectedDrawing?.id || undefined
    };
    
    // Only export if we have at least one parameter
    if (exportParams.productionOrderNumber || exportParams.productionSeriesId || exportParams.id || exportParams.drawingNumberId) {
      // Call the export API endpoint
      // This would typically trigger a file download
      console.log('Exporting precheck details with params:', exportParams);
             // Call the actual export API
       dispatch(exportPrecheckDetails(exportParams));
    } else {
      alert('Please enter search criteria before exporting');
    }
  };

  const handleReset = () => {
    setProductionOrder('');
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setIdNumber('');
    setSearchResults([]);
    setShowResults(false);
    setOrderBy('');
    setOrder('asc');
    setPage(0);
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
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.25rem' }
        }}
      >
        View Precheck
      </Typography>
      
      {/* Form Controls */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }} size="small">
              <TextField
                size="small"
                label="PO Number"
                value={productionOrder}
                onChange={(e) => setProductionOrder(e.target.value)}
                variant="outlined"
                fullWidth
              />
            </FormControl>
            
            <FormControl sx={{ minWidth: { xs: '100%', sm: 300 } }} size="small">
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
                    label="Drawing Number"
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
            
            <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }} size="small">
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
                    label="Prod Series"
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
            
            <FormControl sx={{ minWidth: { xs: '100%', sm: 100 } }} size="small">
              <TextField
                size="small"
                label="ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                variant="outlined"
                fullWidth
              />
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
                sx={{ minWidth: { xs: '30%', sm: 130 }, height: 32 }}
                size="small"
                onClick={handleViewPrecheck}
                disabled={isLoading}
              >
                <VisibilityIcon sx={{ mr: 1 }} />
                View
              </Button>
              <Button
                variant="contained"
                color="info"
                sx={{ minWidth: { xs: '30%', sm: 130 }, height: 32 }}
                size="small"
                onClick={handleExport}
              >
                <FileDownloadIcon sx={{ mr: 1 }} />
                Export
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ minWidth: { xs: '30%', sm: 130 }, height: 32 }}
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

      {/* Results Display */}
      {showResults && (
        <Typography
          variant="body2"
          sx={{ mb: 1, fontWeight: 'medium' }}
        >
          Showing results for Production Order: {productionOrder || 'All'} / Drawing: {selectedDrawing?.drawingNumber || 'All'} / Production Series: {selectedProductionSeries?.productionSeries || 'All'} / ID: {idNumber || 'All'}
        </Typography>
      )}

      {/* Results Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <TableContainer sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'calc(100vh - 350px)' }, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'sr'}
                    direction={orderBy === 'sr' ? order : 'asc'}
                    onClick={() => handleRequestSort('sr')}
                  >
                    Sr No
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'drawingNumber'}
                    direction={orderBy === 'drawingNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('drawingNumber')}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'nomenclature'}
                    direction={orderBy === 'nomenclature' ? order : 'asc'}
                    onClick={() => handleRequestSort('nomenclature')}
                  >
                    Nomenclature
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'quantity'}
                    direction={orderBy === 'quantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('quantity')}
                  >
                    Quantity
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'idNumber'}
                    direction={orderBy === 'idNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('idNumber')}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'ir'}
                    direction={orderBy === 'ir' ? order : 'asc'}
                    onClick={() => handleRequestSort('ir')}
                  >
                    IR
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'msn'}
                    direction={orderBy === 'msn' ? order : 'asc'}
                    onClick={() => handleRequestSort('msn')}
                  >
                    MSN
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 1, px: 1, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={orderBy === 'mrirNumber'}
                    direction={orderBy === 'mrirNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('mrirNumber')}
                  >
                    MRIR Number
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 100 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.sr}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.drawingNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.nomenclature}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.quantity}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.idNumber}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.ir || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.msn || '-'}</TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>{item.mrirNumber || '-'}</TableCell>
                  </TableRow>
                ))
              ) : showResults ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 100 }}>No records found</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 100, color: 'text.secondary' }}>
                    Enter search criteria and click "View Precheck" to see results
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
                minHeight: 40
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

export default ViewPrecheck; 