import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { RootState } from '../../store/store';
import type { Assembly, SopStep } from '../../store/types';
import {
  getAllAssemblies,
  getSopForAssembly,
  exportSopForAssembly,
} from '../../store/slices/sopSlice';

export default function SOP() {
  const dispatch = useDispatch();
  const { assemblies, sopDetails, isLoading, error } = useSelector(
    (state: RootState) => state.sop
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssemblies, setFilteredAssemblies] = useState<any[]>([]);

  useEffect(() => {
    dispatch(getAllAssemblies() as any);
  }, [dispatch]);

  useEffect(() => {
    if (assemblies) {
      setFilteredAssemblies(
        assemblies.filter((assembly: any) =>
          assembly.assemblyNumber.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, assemblies]);

  const handleViewSOP = async (assembly: any) => {
    try {
      await dispatch(getSopForAssembly({ assemblyNumber: assembly.assemblyNumber }) as any);
    } catch (err) {
      // Error handling is managed by the Redux slice
    }
  };

  const handleExportSOP = async (assembly: any) => {
    try {
      const response = await dispatch(
        exportSopForAssembly({ assemblyNumber: assembly.assemblyNumber }) as any
      );
      
      // Handle blob response
      if (response.payload) {
        const blob = new Blob([response.payload], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SOP_${assembly.assemblyNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      // Error handling is managed by the Redux slice
    }
  };

  const handleRefresh = () => {
    dispatch(getAllAssemblies() as any);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="h2">
        SOP Management
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
              label="Search Assembly"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter assembly number"
            />
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

      {/* Assemblies Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {isLoading ? (
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <CircularProgress />
          </Grid>
        ) : filteredAssemblies.length > 0 ? (
          filteredAssemblies.map((assembly: any) => (
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
                    onClick={() => handleViewSOP(assembly)}
                  >
                    View SOP
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportSOP(assembly)}
                  >
                    Export
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">No assemblies found</Alert>
          </Grid>
        )}
      </Grid>

      {/* SOP Details */}
      {sopDetails && sopDetails.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            SOP Details
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Step</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Components</TableCell>
                  <TableCell>Tools Required</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sopDetails.map((step: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{step.stepNumber}</TableCell>
                    <TableCell>{step.description}</TableCell>
                    <TableCell>{step.components?.join(', ')}</TableCell>
                    <TableCell>{step.tools?.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
} 