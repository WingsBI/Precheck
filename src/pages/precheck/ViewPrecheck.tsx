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
  CardContent,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon
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

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
        console.log("dederes",result);
        if (result.payload && Array.isArray(result.payload)) {
          // Map the API response to our table format
          const mappedResults = result.payload.map((item: any, index: number) => ({
            sr: index + 1,
            drawingNumber: item.drawingNumber || '',
            nomenclature: item.nomenclature || '',
            quantity: item.quantity || 0,
            idNumber: item.idNumber || '',
            ir: item.irNumber || '',
            msn: item.msnNumber || '',
            mrirNumber: item.mrirNumber || '',
            componentType: item.componentType || '',
            remarks: item.remarks || '',
            username: item.username || '',
            modifiedDate: item.modifiedDate ? formatDate(item.modifiedDate) : 
                        item.createdDate ? formatDate(item.createdDate) : '',
            isPrecheckComplete: item.isPrecheckComplete || false,
            consumedInDrawing: item.consumedInDrawing || '',
            productionOrderNumber: item.productionOrderNumber || '',
            projectNumber: item.projectNumber || ''
          }));
          console.log("Mapped Results:", mappedResults);
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
    // Create export parameters object with only defined values
    const exportParams: {
      productionOrderNumber?: string;
      productionSeriesId?: number;
      id?: number;
      drawingNumberId?: number;
    } = {};

    // Only add parameters that have values
    if (productionOrder) {
      exportParams.productionOrderNumber = productionOrder;
    }
    if (selectedProductionSeries?.id) {
      exportParams.productionSeriesId = selectedProductionSeries.id;
    }
    if (idNumber) {
      exportParams.id = parseInt(idNumber);
    }
    if (selectedDrawing?.id) {
      exportParams.drawingNumberId = selectedDrawing.id;
    }

    // Check if at least one parameter is provided
    if (Object.keys(exportParams).length === 0) {
      alert('Please enter at least one search criteria before exporting');
      return;
    }

    // Call the export API
    dispatch(exportPrecheckDetails(exportParams))
      .unwrap()
      .then((result) => {
        if (result.success) {
          // You can show a success message here if needed
          // toast.success(result.message);
        }
      })
      .catch((error) => {
        // Show error message
        alert(error.message || 'Failed to export precheck details');
      });
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
    setExpandedRows(new Set());
  };

  const handleRowExpand = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

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

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
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
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 20 }}>
                  <TableSortLabel
                    active={orderBy === 'sr'}
                    direction={orderBy === 'sr' ? order : 'asc'}
                    onClick={() => handleRequestSort('sr')}
                  >
                    SR
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'drawingNumber'}
                    direction={orderBy === 'drawingNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('drawingNumber')}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 100 }}>
                  <TableSortLabel
                    active={orderBy === 'nomenclature'}
                    direction={orderBy === 'nomenclature' ? order : 'asc'}
                    onClick={() => handleRequestSort('nomenclature')}
                  >
                    Nomenclature
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 40 }}>
                  <TableSortLabel
                    active={orderBy === 'quantity'}
                    direction={orderBy === 'quantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('quantity')}
                  >
                    Qty
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'idNumber'}
                    direction={orderBy === 'idNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('idNumber')}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 60 }}>
                  <TableSortLabel
                    active={orderBy === 'ir'}
                    direction={orderBy === 'ir' ? order : 'asc'}
                    onClick={() => handleRequestSort('ir')}
                  >
                    IR
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 60 }}>
                  <TableSortLabel
                    active={orderBy === 'msn'}
                    direction={orderBy === 'msn' ? order : 'asc'}
                    onClick={() => handleRequestSort('msn')}
                  >
                    MSN
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'mrirNumber'}
                    direction={orderBy === 'mrirNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('mrirNumber')}
                  >
                    MRIR Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 80 }}>
                  Type
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', py: 0.3, px: 0.8, fontSize: '0.85rem', minWidth: 40 }}>
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ height: 100 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item :any, index:number) => (
                  <React.Fragment key={index}>
                    <TableRow hover>
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
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                        <Collapse in={expandedRows.has(index)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 0.5 }}>
                            <Table size="small" aria-label="additional-details">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>Remarks</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>User</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 0.2, px: 0.8 }}>Date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>{item.remarks || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>{item.username || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', py: 0.2, px: 0.8 }}>{formatDate(item.createdDate || '')}</TableCell>
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
                  <TableCell colSpan={11} align="center" sx={{ height: 100 }}>No records found</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ height: 100, color: 'text.secondary' }}>
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