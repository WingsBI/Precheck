import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
  FormLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TablePagination,
  Fab,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import QRCode from 'qrcode';
import type { RootState } from '../../store/store';

// Validation schema
const schema = yup.object().shape({
  drawingNumber: yup.string().required('Drawing Number is required'),
  nomenclature: yup.string().required('Nomenclature is required'),
  productionSeries: yup.string().required('Production Series is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  startRange: yup.number().min(1, 'Start range is required').required('Start range is required'),
  endRange: yup.number().min(1, 'End range is required').required('End range is required'),
  barcodeType: yup.string().required('Barcode type is required'),
  printFormat: yup.string().required('Print format is required'),
});

interface BarcodeItem {
  id: number;
  serialNumber: string;
  qrCodeData: string;
  qrCodeImage: string;
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  createdDate: string;
  isSelected: boolean;
  status: 'pending' | 'printed' | 'used';
}

interface BarcodeFormData {
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  quantity: number;
  startRange: number;
  endRange: number;
  barcodeType: 'QR' | 'CODE128' | 'CODE39';
  printFormat: 'A4' | 'A5' | 'LABEL' | 'STICKER';
  includeText: boolean;
  includeDate: boolean;
  customText?: string;
}

export default function BarcodeGeneration() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const printRef = useRef<HTMLDivElement>(null);
  
  // State
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [selectedBarcodes, setSelectedBarcodes] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeItem | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<BarcodeFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      quantity: 1,
      startRange: 1,
      endRange: 1,
      barcodeType: 'QR',
      printFormat: 'A4',
      includeText: true,
      includeDate: true,
    }
  });

  const watchQuantity = watch('quantity');
  const watchStartRange = watch('startRange');
  const watchBarcodeType = watch('barcodeType');

  // Auto-update end range when quantity or start range changes
  useEffect(() => {
    if (watchQuantity && watchStartRange) {
      const endRange = watchStartRange + watchQuantity - 1;
      setValue('endRange', endRange);
    }
  }, [watchQuantity, watchStartRange, setValue]);

  // Generate QR Code
  const generateQRCode = async (data: string): Promise<string> => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const onSubmit = async (data: BarcodeFormData) => {
    setIsGenerating(true);
    try {
      const newBarcodes: BarcodeItem[] = [];
      
      for (let i = 0; i < data.quantity; i++) {
        const serialNumber = `${data.drawingNumber}-${String(data.startRange + i).padStart(4, '0')}`;
        
        // Create QR code data
        const qrData = JSON.stringify({
          serialNumber,
          drawingNumber: data.drawingNumber,
          nomenclature: data.nomenclature,
          productionSeries: data.productionSeries,
          createdDate: new Date().toISOString().split('T')[0],
          customText: data.customText || '',
        });
        
        const qrCodeImage = await generateQRCode(qrData);
        
        newBarcodes.push({
          id: Date.now() + i,
          serialNumber,
          qrCodeData: qrData,
          qrCodeImage,
          drawingNumber: data.drawingNumber,
          nomenclature: data.nomenclature,
          productionSeries: data.productionSeries,
          createdDate: new Date().toISOString().split('T')[0],
          isSelected: false,
          status: 'pending',
        });
      }
      
      setBarcodes(prev => [...prev, ...newBarcodes]);
      setSuccessMessage(`Successfully generated ${data.quantity} barcodes!`);
    } catch (error) {
      console.error('Error generating barcodes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(barcodes.map(b => b.id));
    } else {
      setSelectedBarcodes([]);
    }
  };

  const handleSelectBarcode = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(prev => [...prev, id]);
    } else {
      setSelectedBarcodes(prev => prev.filter(bId => bId !== id));
    }
  };

  const handlePreview = (barcode: BarcodeItem) => {
    setSelectedBarcode(barcode);
    setPreviewDialogOpen(true);
  };

  const handlePrint = async () => {
    if (selectedBarcodes.length === 0) return;
    
    setIsPrinting(true);
    try {
      // Simulate printing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark selected barcodes as printed
      setBarcodes(prev => prev.map(barcode => 
        selectedBarcodes.includes(barcode.id)
          ? { ...barcode, status: 'printed' as const }
          : barcode
      ));
      
      setSuccessMessage(`Successfully printed ${selectedBarcodes.length} barcodes!`);
      setSelectedBarcodes([]);
    } catch (error) {
      console.error('Error printing barcodes:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (selectedBarcodes.length === 0) return;
    
    try {
      // Create a downloadable file with selected barcodes
      const selectedBarcodesData = barcodes.filter(b => selectedBarcodes.includes(b.id));
      const csvContent = [
        'Serial Number,Drawing Number,Nomenclature,Production Series,QR Data,Created Date',
        ...selectedBarcodesData.map(b => 
          `${b.serialNumber},${b.drawingNumber},${b.nomenclature},${b.productionSeries},"${b.qrCodeData}",${b.createdDate}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcodes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Barcodes downloaded successfully!');
    } catch (error) {
      console.error('Error downloading barcodes:', error);
    }
  };

  const handleDelete = () => {
    if (selectedBarcodes.length === 0) return;
    
    setBarcodes(prev => prev.filter(b => !selectedBarcodes.includes(b.id)));
    setSelectedBarcodes([]);
    setSuccessMessage(`Successfully deleted ${selectedBarcodes.length} barcodes!`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard!');
  };

  const getStatusColor = (status: BarcodeItem['status']) => {
    switch (status) {
      case 'printed': return 'success';
      case 'used': return 'info';
      default: return 'default';
    }
  };

  const BarcodeCard = ({ barcode }: { barcode: BarcodeItem }) => (
    <Card 
      elevation={1} 
      sx={{ 
        position: 'relative',
        '&:hover': { 
          elevation: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent>
        <Stack spacing={2} alignItems="center">
          {/* QR Code */}
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={barcode.qrCodeImage}
              alt={`QR Code for ${barcode.serialNumber}`}
              style={{ width: 120, height: 120 }}
            />
          </Box>
          
          {/* Details */}
          <Stack spacing={1} sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {barcode.serialNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {barcode.nomenclature}
            </Typography>
            <Chip 
              label={barcode.status.toUpperCase()}
              color={getStatusColor(barcode.status)}
              size="small"
            />
          </Stack>
          
          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Preview">
              <IconButton 
                size="small" 
                onClick={() => handlePreview(barcode)}
                color="primary"
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy Data">
              <IconButton 
                size="small"
                onClick={() => copyToClipboard(barcode.qrCodeData)}
                color="secondary"
              >
                <CopyIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
      
      {/* Selection Checkbox */}
      <Checkbox
        checked={selectedBarcodes.includes(barcode.id)}
        onChange={(e) => handleSelectBarcode(barcode.id, e.target.checked)}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'background.paper',
          borderRadius: '50%',
        }}
      />
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: 3, 
          background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          color: 'white',
          borderRadius: 2
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <QrCodeIcon sx={{ fontSize: { xs: 32, md: 40 } }} />
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
              Barcode Generation
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Generate QR codes and barcodes for production items
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Success Message */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      {/* Generation Form */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Generate New Barcodes
          </Typography>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Drawing Number */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="drawingNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Drawing Number *"
                      fullWidth
                      error={!!errors.drawingNumber}
                      helperText={errors.drawingNumber?.message}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* Nomenclature */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="nomenclature"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nomenclature *"
                      fullWidth
                      error={!!errors.nomenclature}
                      helperText={errors.nomenclature?.message}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* Production Series */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="productionSeries"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Production Series *"
                      fullWidth
                      error={!!errors.productionSeries}
                      helperText={errors.productionSeries?.message}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* Barcode Type */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="barcodeType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Barcode Type *</InputLabel>
                      <Select {...field} label="Barcode Type *">
                        <MenuItem value="QR">QR Code</MenuItem>
                        <MenuItem value="CODE128">Code 128</MenuItem>
                        <MenuItem value="CODE39">Code 39</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Print Format */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="printFormat"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Print Format *</InputLabel>
                      <Select {...field} label="Print Format *">
                        <MenuItem value="A4">A4 Paper</MenuItem>
                        <MenuItem value="A5">A5 Paper</MenuItem>
                        <MenuItem value="LABEL">Label Sheet</MenuItem>
                        <MenuItem value="STICKER">Sticker Roll</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity *"
                      type="number"
                      fullWidth
                      error={!!errors.quantity}
                      helperText={errors.quantity?.message}
                      inputProps={{ min: 1 }}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* Start Range */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="startRange"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Range *"
                      type="number"
                      fullWidth
                      error={!!errors.startRange}
                      helperText={errors.startRange?.message}
                      inputProps={{ min: 1 }}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* End Range */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="endRange"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Range *"
                      type="number"
                      fullWidth
                      error={!!errors.endRange}
                      helperText={errors.endRange?.message}
                      inputProps={{ min: 1 }}
                      size={isMobile ? "small" : "medium"}
                      InputProps={{ readOnly: true }}
                    />
                  )}
                />
              </Grid>

              {/* Options */}
              <Grid item xs={12}>
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  <Controller
                    name="includeText"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Include Text Below Barcode"
                      />
                    )}
                  />
                  <Controller
                    name="includeDate"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Include Creation Date"
                      />
                    )}
                  />
                </Stack>
              </Grid>

              {/* Custom Text */}
              <Grid item xs={12}>
                <Controller
                  name="customText"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Custom Text (Optional)"
                      fullWidth
                      multiline
                      rows={2}
                      size={isMobile ? "small" : "medium"}
                      helperText="This text will be included in the QR code data"
                    />
                  )}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size={isMobile ? "medium" : "large"}
                  disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <QrCodeIcon />}
                  fullWidth
                >
                  {isGenerating ? 'Generating...' : 'Generate Barcodes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Barcode List */}
      {barcodes.length > 0 && (
        <Card elevation={1}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header with actions */}
            <Stack 
              direction={isMobile ? "column" : "row"} 
              justifyContent="space-between" 
              alignItems={isMobile ? "stretch" : "center"}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Generated Barcodes ({barcodes.length})
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Checkbox
                  checked={selectedBarcodes.length === barcodes.length && barcodes.length > 0}
                  indeterminate={selectedBarcodes.length > 0 && selectedBarcodes.length < barcodes.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={isPrinting ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
                  onClick={handlePrint}
                  disabled={selectedBarcodes.length === 0 || isPrinting}
                >
                  Print ({selectedBarcodes.length})
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={selectedBarcodes.length === 0}
                >
                  Download
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  disabled={selectedBarcodes.length === 0}
                >
                  Delete
                </Button>
              </Stack>
            </Stack>

            {/* Barcode Grid */}
            <Grid container spacing={2}>
              {barcodes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((barcode) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={barcode.id}>
                    <BarcodeCard barcode={barcode} />
                  </Grid>
                ))}
            </Grid>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={barcodes.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <QrCodeIcon color="primary" />
            <Typography variant="h6">
              Barcode Preview: {selectedBarcode?.serialNumber}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedBarcode && (
            <Stack spacing={3} alignItems="center" sx={{ p: 2 }}>
              {/* QR Code */}
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={selectedBarcode.qrCodeImage}
                  alt={`QR Code for ${selectedBarcode.serialNumber}`}
                  style={{ width: 200, height: 200, border: '1px solid #ddd' }}
                />
              </Box>
              
              {/* Details */}
              <Stack spacing={2} sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Serial Number</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedBarcode.serialNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Drawing Number</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedBarcode.drawingNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Nomenclature</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedBarcode.nomenclature}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Production Series</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedBarcode.productionSeries}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">QR Code Data</Typography>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1 
                      }}
                    >
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {selectedBarcode.qrCodeData}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => selectedBarcode && copyToClipboard(selectedBarcode.qrCodeData)}
            startIcon={<CopyIcon />}
          >
            Copy Data
          </Button>
          <Button 
            onClick={() => setPreviewDialogOpen(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Generate */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
        }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
} 