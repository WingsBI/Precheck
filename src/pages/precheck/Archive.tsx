import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Grid,
  Divider
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
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { viewPrecheckDetails, exportPrecheckDetails } from '../../store/slices/precheckSlice';
import { getAllProductionSeries, getDrawingNumbers } from '../../store/slices/commonSlice';
import type { RootState, AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce';

interface ArchiveItem {
  id: string;
  assemblyNumber: string;
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  poNumber: string;
  quantity: number;
  status: 'Completed' | 'Pending' | 'In Progress';
  createdDate: string;
  modifiedDate: string;
  username: string;
  idNumber?: string;
  qrCode?: string;
  irNumber?: string;
  msnNumber?: string;
  mrirNumber?: string;
  remarks?: string;
  expanded?: boolean;
}

const Archive: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { productionSeries, drawingNumbers } = useSelector(
    (state: RootState) => state.common
  );
  const { precheckDetails, isLoading } = useSelector(
    (state: RootState) => state.precheck
  );

  // Local state
  const [selectedAssemblyNumber, setSelectedAssemblyNumber] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [poNumber, setPoNumber] = useState('');
  const [archiveData, setArchiveData] = useState<ArchiveItem[]>([]);
  const [filteredData, setFilteredData] = useState<ArchiveItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Table state
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<string>('createdDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    dispatch(getAllProductionSeries());
    dispatch(getDrawingNumbers());
    loadArchiveData();
  }, [dispatch]);

  // Load archive data (using existing precheck details as historical data)
  const loadArchiveData = async () => {
    try {
      const result = await dispatch(viewPrecheckDetails({})).unwrap();
      if (result && Array.isArray(result)) {
        // Transform precheck data to archive format
        const transformedData: ArchiveItem[] = result.map((item: any, index: number) => ({
          id: item.id || `archive-${index}`,
          assemblyNumber: item.assemblyNumber || 'N/A',
          drawingNumber: item.drawingNumber || 'N/A',
          nomenclature: item.nomenclature || 'N/A',
          productionSeries: item.productionSeries || 'N/A',
          poNumber: item.productionOrderNumber || item.poNumber || 'N/A',
          quantity: item.quantity || 0,
          status: item.isPrecheckComplete ? 'Completed' : item.isUpdated ? 'In Progress' : 'Pending',
          createdDate: item.createdDate || new Date().toISOString(),
          modifiedDate: item.modifiedDate || item.createdDate || new Date().toISOString(),
          username: item.username || item.users || 'System',
          idNumber: item.idNumber,
          qrCode: item.qrCodeNumber || item.qrCode,
          irNumber: item.irNumber,
          msnNumber: item.msnNumber,
          mrirNumber: item.mrirNumber,
          remarks: item.remarks || item.remark
        }));
        setArchiveData(transformedData);
        setFilteredData(transformedData);
      }
    } catch (error) {
      console.error('Error loading archive data:', error);
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

  // Filter data based on selected criteria
  const applyFilters = () => {
    let filtered = [...archiveData];

    if (selectedAssemblyNumber) {
      filtered = filtered.filter(item => 
        item.assemblyNumber.toLowerCase().includes(selectedAssemblyNumber.drawingNumber?.toLowerCase() || '')
      );
    }

    if (selectedProductionSeries) {
      filtered = filtered.filter(item => 
        item.productionSeries.toLowerCase().includes(selectedProductionSeries.productionSeries?.toLowerCase() || '')
      );
    }

    if (poNumber.trim()) {
      filtered = filtered.filter(item => 
        item.poNumber.toLowerCase().includes(poNumber.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setPage(0); // Reset to first page when filtering
  };

  // Debounced filter function
  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, 300),
    [archiveData, selectedAssemblyNumber, selectedProductionSeries, poNumber]
  );

  // Apply filters when criteria change
  useEffect(() => {
    debouncedApplyFilters();
    return () => {
      debouncedApplyFilters.cancel();
    };
  }, [debouncedApplyFilters]);

  // Clear filters
  const clearFilters = () => {
    setSelectedAssemblyNumber(null);
    setSelectedProductionSeries(null);
    setPoNumber('');
    setFilteredData(archiveData);
    setPage(0);
  };

  // Sorting function
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[orderBy as keyof ArchiveItem];
      let bVal = b[orderBy as keyof ArchiveItem];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, order, orderBy]);

  // Pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, rowsPerPage]);

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

  // Get status chip
  const getStatusChip = (status: string) => {
    const color = status === 'Completed' ? 'success' : status === 'In Progress' ? 'warning' : 'default';
    return <Chip label={status} size="small" color={color} variant="outlined" />;
  };

  // Export data
  const handleExport = () => {
    const exportData = {
      assemblyNumber: selectedAssemblyNumber?.drawingNumber || '',
      productionSeries: selectedProductionSeries?.productionSeries || '',
      poNumber: poNumber
    };
    dispatch(exportPrecheckDetails(exportData));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ArchiveIcon />
        Archive - Historical Precheck Data
      </Typography>

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filter Options
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <Autocomplete
                  options={drawingNumbers}
                  getOptionLabel={(option) => option.drawingNumber}
                  value={selectedAssemblyNumber}
                  onChange={(_, newValue) => setSelectedAssemblyNumber(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assembly Number"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <Autocomplete
                  options={productionSeries}
                  getOptionLabel={(option) => option.productionSeries}
                  value={selectedProductionSeries}
                  onChange={(_, newValue) => setSelectedProductionSeries(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="PO Number"
                variant="outlined"
                size="small"
                fullWidth
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={applyFilters}
                  size="small"
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExport}
                  size="small"
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2 }} />

      {/* Results Summary */}
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Showing {filteredData.length} of {archiveData.length} records
        {(selectedAssemblyNumber || selectedProductionSeries || poNumber) && ' (filtered)'}
      </Typography>

      {/* Data Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'assemblyNumber'}
                    direction={orderBy === 'assemblyNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('assemblyNumber')}
                  >
                    Assembly Number
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'drawingNumber'}
                    direction={orderBy === 'drawingNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('drawingNumber')}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'productionSeries'}
                    direction={orderBy === 'productionSeries' ? order : 'asc'}
                    onClick={() => handleRequestSort('productionSeries')}
                  >
                    Production Series
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'poNumber'}
                    direction={orderBy === 'poNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('poNumber')}
                  >
                    PO Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdDate'}
                    direction={orderBy === 'createdDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('createdDate')}
                  >
                    Created Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 200 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TableRow hover>
                      <TableCell>{item.assemblyNumber}</TableCell>
                      <TableCell>{item.drawingNumber}</TableCell>
                      <TableCell>{item.productionSeries}</TableCell>
                      <TableCell>{item.poNumber}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">{getStatusChip(item.status)}</TableCell>
                      <TableCell>{formatDate(item.createdDate)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(index)}
                        >
                          {expandedRows.has(index) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedRows.has(index)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Additional Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Nomenclature
                                </Typography>
                                <Typography variant="body2">
                                  {item.nomenclature}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  ID Number
                                </Typography>
                                <Typography variant="body2">
                                  {item.idNumber || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  QR Code
                                </Typography>
                                <Typography variant="body2">
                                  {item.qrCode || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  IR Number
                                </Typography>
                                <Typography variant="body2">
                                  {item.irNumber || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  MSN Number
                                </Typography>
                                <Typography variant="body2">
                                  {item.msnNumber || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  MRIR Number
                                </Typography>
                                <Typography variant="body2">
                                  {item.mrirNumber || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Modified Date
                                </Typography>
                                <Typography variant="body2">
                                  {formatDate(item.modifiedDate)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  User
                                </Typography>
                                <Typography variant="body2">
                                  {item.username}
                                </Typography>
                              </Grid>
                              {item.remarks && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Remarks
                                  </Typography>
                                  <Typography variant="body2">
                                    {item.remarks}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 200 }}>
                    <Typography variant="body1" color="text.secondary">
                      No archive data found matching the selected criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    </Box>
  );
};

export default Archive;
