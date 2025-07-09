import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Collapse,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from '../../store/store';
import { getStoredComponentsByDate } from '../../store/slices/qrcodeSlice';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Types for stored components
interface StoredComponent {
  qrCodeNumber: string;
  qrCodeStatus: string;
  qrCodeStatusId: number;
  productionSeriesId: number;
  assemblyNumberId: number | null;
  drawingComponentLnItemCodeId: number | null;
  nomenclatureId: number;
  componentTypeId: number;
  idNumber: string;
  irNumberId: number;
  msnNumberId: number;
  refDocRemarks: string | null;
  quantity: number;
  desposition: string;
  myDate: string | null;
  users: string;
  productionOrderNumber: string;
  rackLocation: string;
  operationNo: string | null;
  sopNamesId: number | null;
  expiryDate: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string | null;
  isActive: boolean;
  id: number;
  drawingNumberId: number;
  irNumber: string;
  msnNumber: string;
  nomenclature: string;
  componentType: string;
  productionSeries: string;
  drawingNumber: string;
  unitId: number | null;
  consumedInDrawing: string | null;
  mrirNumber: string;
  idNumbers: number;
  isNewQrCode: boolean;
  manufacturingDate: string;
  remark: string;
  projectNumber: string;
  assemblyNumber: string;
  lnItemCode: string;
}

const Row = ({ component }: { component: StoredComponent }) => {
  const [open, setOpen] = useState(false);

  // Format date
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
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.qrCodeNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.productionOrderNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.projectNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.productionSeries || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.drawingNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.idNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.quantity || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.nomenclature || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Consumed in Drawing</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>IR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>MSN Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>MRIR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Disposition</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Username</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.consumedInDrawing || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          bgcolor: component?.qrCodeStatus === 'readyforconsumption' ? '#e8f5e8' : '#fff3cd',
                          color: component?.qrCodeStatus === 'readyforconsumption' ? '#2e7d32' : '#856404',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          display: 'inline-block',
                        }}
                      >
                        {component?.qrCodeStatus || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.irNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.msnNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.mrirNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.desposition || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.users || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const StoredInComponents: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Get data from Redux store
  const { storedComponents, loading, error } = useSelector((state: RootState) => state.qrcode);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter components based on search query
  const filteredComponents = React.useMemo(() => {
    if (!searchQuery.trim()) return storedComponents;
    
    const query = searchQuery.toLowerCase();
    return storedComponents.filter(component => 
      component.qrCodeNumber?.toLowerCase().includes(query) ||
      component.drawingNumber?.toLowerCase().includes(query) ||
      component.nomenclature?.toLowerCase().includes(query) ||
      component.productionSeries?.toLowerCase().includes(query) ||
      component.idNumber?.toLowerCase().includes(query)
    );
  }, [storedComponents, searchQuery]);

  // Paginated results
  const paginatedComponents = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredComponents.slice(startIndex, endIndex);
  }, [filteredComponents, page, rowsPerPage]);

  // Fetch stored components using Redux action
  const fetchStoredComponents = async (date: Date) => {
    try {
      // Format date as dd/MM/yyyy for display
      const formattedDate = format(date, 'dd/MM/yyyy');
      
      const result = await dispatch(getStoredComponentsByDate(formattedDate)).unwrap();
      
      setSnackbar({
        open: true,
        message: `Found ${result?.length || 0} stored components for ${formattedDate}`,
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err || 'Failed to fetch stored components',
        severity: 'error'
      });
    }
  };

  // Load data for current date on component mount
  useEffect(() => {
    if (selectedDate) {
      fetchStoredComponents(selectedDate);
    }
  }, []);

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
    if (newDate) {
      fetchStoredComponents(newDate);
    }
  };

  const handleSearch = () => {
    if (selectedDate) {
      fetchStoredComponents(selectedDate);
    }
  };

  const handleExport = () => {
    try {
      if (!filteredComponents.length) {
        setSnackbar({
          open: true,
          message: 'No data available to export',
          severity: 'error'
        });
        return;
      }

      // Prepare data for Excel
      const data = filteredComponents.map(component => ({
        'QR Code': component?.qrCodeNumber || 'N/A',
        'Production Series': component?.productionSeries || 'N/A',
        'Drawing Number': component?.drawingNumber || 'N/A',
        'Nomenclature': component?.nomenclature || 'N/A',
        'Component Type': component?.componentType || 'N/A',
        'Consumed In Drawing': component?.consumedInDrawing || 'N/A',
        'Assembly Number': component?.assemblyNumber || 'N/A',
        'ID Number': component?.idNumber || 'N/A',
        'Store In Date': (component?.modifiedDate || component?.createdDate) ? format(new Date(component.modifiedDate || component.createdDate), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Status': component?.qrCodeStatus || 'N/A',
        'IR Number': component?.irNumber || 'N/A',
        'MSN Number': component?.msnNumber || 'N/A',
        'MRIR Number': component?.mrirNumber || 'N/A',
        'Quantity': component?.quantity || 'N/A',
        'PO Number': component?.productionOrderNumber || 'N/A',
        'Project Number': component?.projectNumber || 'N/A',
        'Disposition': component?.desposition || 'N/A',
        'Rack Location': component?.rackLocation || 'N/A',
        'LN Item Code': component?.lnItemCode || 'N/A',
        'Username': component?.users || 'N/A',
        'Remarks': component?.remark || 'N/A',
        'Manufacturing Date': component?.manufacturingDate ? format(new Date(component.manufacturingDate), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Created Date': component?.createdDate ? format(new Date(component.createdDate), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Expiry Date': component?.expiryDate ? format(new Date(component.expiryDate), 'dd/MM/yyyy HH:mm') : 'N/A'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const columnWidths = Array(24).fill({ wch: 18 });
      ws['!cols'] = columnWidths;

      // Define styles
      const cellStyle = {
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true
        },
        font: {
          bold: false,
          sz: 11
        }
      };

      const headerStyle = {
        ...cellStyle,
        font: {
          bold: true,
          sz: 12
        },
        fill: {
          bgColor: { rgb: "C0C0C0" }
        }
      };

      // Apply styling
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:X2');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cell_address]) continue;
          
          ws[cell_address].s = R === 0 ? headerStyle : cellStyle;
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stored Components');

      // Generate filename with date
      const dateStr = selectedDate ? format(selectedDate, 'dd-MM-yyyy') : 'unknown-date';
      const filename = `Stored_Components_${dateStr}.xlsx`;
      
      XLSX.writeFile(wb, filename);

      setSnackbar({
        open: true,
        message: 'File exported successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export file',
        severity: 'error'
      });
      console.error('Export error:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 1 }}>
        <Typography variant="h4" gutterBottom color="primary.main" fontWeight={600}>
          Stored In Components
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          View and export components stored on specific dates
        </Typography>
        
        <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 3 }}>
          {/* Date Selection and Search Controls */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              width: '100%'
            }}
          >
            <DatePicker
              label="Select Store In Date"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: { xs: '100%', sm: '200px' } },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }
              }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={!selectedDate || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ minWidth: '120px', height: '40px' }}
            >
              {loading ? 'Loading...' : 'Search'}
            </Button>

            <TextField
              size="small"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                width: { xs: '100%', sm: '250px' }
              }}
            />

            <Button
              variant="contained"
              color="success"
              onClick={handleExport}
              disabled={!filteredComponents.length}
              startIcon={<DownloadIcon />}
              sx={{ minWidth: '120px', height: '40px' }}
            >
              Export Excel
            </Button>
          </Box>

          {/* Results Summary */}
          {selectedDate && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredComponents.length} stored components for {format(selectedDate, 'dd/MM/yyyy')}
              {searchQuery && ` (filtered by "${searchQuery}")`}
            </Typography>
          )}

          {/* Data Table */}
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
                              <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      QRCode ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      PO Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      Project Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      Prod Series
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      Drawing Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      Nomenclature
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                      Details
                    </TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading stored components...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="error">
                        {error}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedComponents.length > 0 ? (
                  paginatedComponents.map((component, index) => (
                    <Row key={`${component.qrCodeNumber}-${index}`} component={component} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No stored components found for the selected date
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredComponents.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredComponents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #e0e0e0',
                '& .MuiTablePagination-toolbar': {
                  minHeight: 40,
                },
              }}
            />
          )}
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default StoredInComponents; 