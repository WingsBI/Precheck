import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Collapse,
  TablePagination,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ClearIcon from '@mui/icons-material/Clear';
import { fetchAllDrawingNumbers } from '../../store/slices/commonSlice';
import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from '../../store/store';

interface DrawingNumberRow {
  id: number;
  drawingNumber: string;
  nomenclature: string;
  componentType: string;
  componentCode: string;
  lnItemCode: string;
  availableFor: string;
  isExpiry: boolean;
  location?: string;
  assemblyNumber?: string;
  createdDate?: string;
  modifiedDate?: string;
  isActive?: boolean;
}

const DrawingNumberRowComponent = ({ drawingData }: { drawingData: DrawingNumberRow }) => {
  const [open, setOpen] = useState(false);

  // Format date
  const formatDate = (dateString?: string) => {
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
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ textAlign: 'center', width: '60px' }}>{drawingData?.id || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', width: '180px', wordBreak: 'break-word' }}>{drawingData?.drawingNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', width: '200px', wordBreak: 'break-word' }}>{drawingData?.nomenclature || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', width: '120px' }}>{drawingData?.componentType || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', width: '120px' }}>{drawingData?.componentCode || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', width: '140px' }}>{drawingData?.availableFor || 'N/A'}</TableCell>
        
        <TableCell sx={{ textAlign: 'center', width: '60px' }}>
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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, overflow: 'hidden' }}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '14%' }}>LN Item Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '14%' }}>Assembly Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '14%' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '12%' }}>Has Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '12%' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '17%' }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '17%' }}>Modified Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', wordBreak: 'break-word', width: '14%' }}>{drawingData?.lnItemCode || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', wordBreak: 'break-word', width: '14%' }}>{drawingData?.assemblyNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', wordBreak: 'break-word', width: '14%' }}>{drawingData?.location || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '12%' }}>{drawingData?.isExpiry ? 'Yes' : 'No'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '12%' }}>{drawingData?.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.875rem', width: '17%' }}>{formatDate(drawingData?.createdDate)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.875rem', width: '17%' }}>{formatDate(drawingData?.modifiedDate)}</TableCell>
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

const Components: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Get data from redux store
  const { allDrawingNumbers, isLoading, error } = useSelector((state: RootState) => state.common);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchAllDrawingNumbers());
  }, [dispatch]);

  // Filter and search functionality
  const filteredDrawingNumbers = useMemo(() => {
    if (!Array.isArray(allDrawingNumbers)) return [];
    
    return allDrawingNumbers.filter(drawing => {
      const searchLower = searchQuery.toLowerCase();
      return (
        drawing?.drawingNumber?.toLowerCase().includes(searchLower) ||
        drawing?.nomenclature?.toLowerCase().includes(searchLower) ||
        drawing?.componentType?.toLowerCase().includes(searchLower) ||
        drawing?.componentCode?.toLowerCase().includes(searchLower) ||
        drawing?.availableFor?.toLowerCase().includes(searchLower) ||
        drawing?.lnItemCode?.toLowerCase().includes(searchLower)
      );
    });
  }, [allDrawingNumbers, searchQuery]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredDrawingNumbers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredDrawingNumbers, page, rowsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(0);
    setSnackbar({
      open: true,
      message: 'Search cleared successfully',
      severity: 'success'
    });
  };



  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading drawing numbers: {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => dispatch(fetchAllDrawingNumbers())}
          startIcon={<ClearIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#A8005A' }}>
        Components - All Drawing Numbers
      </Typography>

      <Paper sx={{ p: 3, mb: 3, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search Drawing Numbers"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ minWidth: 550, maxWidth: 400, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Search by drawing number, nomenclature, component type..."
          />
          
          <Button
            variant="outlined"
            onClick={handleClearSearch}
            startIcon={<ClearIcon />}
            disabled={!searchQuery}
          >
            Clear Search
          </Button>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Total Records: {filteredDrawingNumbers.length} | 
            Showing: {Math.min((page * rowsPerPage) + 1, filteredDrawingNumbers.length)}-{Math.min((page + 1) * rowsPerPage, filteredDrawingNumbers.length)}
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ maxHeight: 600, overflowY: 'auto', overflowX: 'hidden', width: '100%' }}>
              <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '60px' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '180px' }}>Drawing Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '200px' }}>Nomenclature</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '120px' }}>Component Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '120px' }}>Component Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '140px' }}>Available For</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f5f5', width: '60px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', p: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {searchQuery ? 'No drawing numbers match your search criteria' : 'No drawing numbers found'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((drawing) => (
                      <DrawingNumberRowComponent 
                        key={drawing.id} 
                        drawingData={drawing} 
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredDrawingNumbers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Components; 