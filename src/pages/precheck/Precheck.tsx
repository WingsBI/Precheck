import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { RootState } from '../../store/store';
import {
  getAssemblyDrawing,
  makePrecheck,
  viewPrecheckDetails,
  getPrecheckStatus,
  getAvailableComponents,
} from '../../store/slices/precheckSlice';

export default function Precheck() {
  const dispatch = useDispatch();
  const {
    assemblyDrawings,
    precheckDetails,
    precheckStatus,
    availableComponents,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.precheck);

  const [assemblyNumber, setAssemblyNumber] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState<any>(null);

  useEffect(() => {
    // Load initial precheck data
    dispatch(viewPrecheckDetails({}) as any);
  }, [dispatch]);

  const handleSearch = () => {
    if (assemblyNumber) {
      dispatch(getAssemblyDrawing(assemblyNumber) as any);
    }
  };

  const handleRefresh = () => {
    dispatch(viewPrecheckDetails({}) as any);
  };

  const handleMakePrecheck = async (assembly: any) => {
    try {
      await dispatch(makePrecheck([assembly]) as any);
      handleRefresh();
    } catch (err) {
      // Error handling is managed by the Redux slice
    }
  };

  const handleCheckStatus = async (assembly: any) => {
    try {
      await dispatch(getPrecheckStatus({ assemblyNumber: assembly.assemblyNumber }) as any);
    } catch (err) {
      // Error handling is managed by the Redux slice
    }
  };

  const handleCheckComponents = async (assembly: any) => {
    try {
      await dispatch(getAvailableComponents(assembly.qrCode) as any);
    } catch (err) {
      // Error handling is managed by the Redux slice
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="h2">
        Precheck Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Assembly Number"
              value={assemblyNumber}
              onChange={(e) => setAssemblyNumber(e.target.value)}
              placeholder="Enter assembly number"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={isLoading}
            >
              Search
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Assembly Drawings */}
      {assemblyDrawings && assemblyDrawings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Assembly Drawings
          </Typography>
          <Grid container spacing={2}>
            {assemblyDrawings.map((assembly: any) => (
              <Grid item xs={12} sm={6} md={4} key={assembly.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h3">
                      {assembly.assemblyNumber}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Drawing: {assembly.drawingNumber}
                    </Typography>
                    <Typography variant="body2">
                      Components: {assembly.components?.length || 0}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleMakePrecheck(assembly)}
                    >
                      Make Precheck
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleCheckComponents(assembly)}
                    >
                      Check Components
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Precheck List */}
      <Typography variant="h6" gutterBottom>
        Recent Prechecks
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Assembly Number</TableCell>
              <TableCell>Drawing Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : precheckDetails && precheckDetails.length > 0 ? (
              precheckDetails.map((precheck: any) => (
                <TableRow key={precheck.id}>
                  <TableCell>{precheck.assemblyNumber}</TableCell>
                  <TableCell>{precheck.drawingNumber}</TableCell>
                  <TableCell>
                    {precheck.status === 'Completed' ? (
                      <Tooltip title="Completed">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Pending">
                        <WarningIcon color="warning" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(precheck.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleCheckStatus(precheck)}
                      title="Check Status"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No precheck records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 