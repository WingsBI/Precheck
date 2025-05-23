import React, { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
  FormLabel,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { RootState } from '../../store/store';

// Validation schema
const schema = yup.object().shape({
  drawingNumber: yup.string().required('Drawing Number is required'),
  productionSeries: yup.string().required('Production Series is required'),
  documentType: yup.string().required('Document Type is required'),
  stage: yup.string().required('Stage is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  idRange: yup.string().required('ID Range is required'),
  poNumber: yup.string().required('PO Number is required'),
  projectNumber: yup.string().required('Project Number is required'),
});

interface FormData {
  drawingNumber: string;
  productionSeries: string;
  documentType: 'IR' | 'MSN';
  stage: string;
  quantity: number;
  idRange: string;
  poNumber: string;
  projectNumber: string;
  supplier?: string;
  remark?: string;
}

export default function GenerateIRMSN() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  // State
  const [drawingNumbers, setDrawingNumbers] = useState<any[]>([]);
  const [productionSeries, setProductionSeries] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState([
    { id: 1, documentType: 'IR' },
    { id: 2, documentType: 'MSN' }
  ]);
  const [stages, setStages] = useState<string[]>([]);
  const [generatedNumber, setGeneratedNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Stage options based on document type
  const IRStages = [
    "Before Testing", "After Testing", "Final", "T04 Cavity",
    "Intermediate", "Flower Test", "WPS", "Other"
  ];
  
  const MSNStages = [
    "Testing", "Final", "QT", "Intermediate",
    "Precheck & Final", "Other"
  ];

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      documentType: 'IR',
      quantity: 1,
    }
  });

  const documentType = watch('documentType');

  // Update stages when document type changes
  useEffect(() => {
    setStages(documentType === 'IR' ? IRStages : MSNStages);
    setValue('stage', ''); // Reset stage when document type changes
  }, [documentType, setValue]);

  // Mock data loading functions
  const loadDrawingNumbers = useCallback(async (searchText: string) => {
    if (searchText.length < 3) {
      setDrawingNumbers([]);
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = [
        { id: 1, drawingNumber: `DWG-${searchText}-001`, nomenclature: 'Test Component 1' },
        { id: 2, drawingNumber: `DWG-${searchText}-002`, nomenclature: 'Test Component 2' },
        { id: 3, drawingNumber: `DWG-${searchText}-003`, nomenclature: 'Test Component 3' },
      ];
      setDrawingNumbers(mockData);
    } catch (error) {
      console.error('Error loading drawing numbers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProductionSeries = useCallback(async () => {
    try {
      const mockData = [
        { id: 1, productionSeries: 'PS-2024-A' },
        { id: 2, productionSeries: 'PS-2024-B' },
        { id: 3, productionSeries: 'PS-2024-C' },
      ];
      setProductionSeries(mockData);
    } catch (error) {
      console.error('Error loading production series:', error);
    }
  }, []);

  useEffect(() => {
    loadProductionSeries();
  }, [loadProductionSeries]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Simulate API call for generating IR/MSN number
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const prefix = data.documentType === 'IR' ? 'IR' : 'MSN';
      const timestamp = Date.now().toString().slice(-6);
      const generated = `${prefix}-${data.productionSeries}-${timestamp}`;
      
      setGeneratedNumber(generated);
    } catch (error) {
      console.error('Error generating number:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNumber);
  };

  const handleReset = () => {
    reset();
    setGeneratedNumber('');
    setDrawingNumbers([]);
  };

  const ResponsiveFormGrid = ({ children }: { children: React.ReactNode }) => (
    <Grid container spacing={isMobile ? 2 : 3}>
      {children}
    </Grid>
  );

  const FormField = ({ 
    children, 
    xs = 12, 
    sm = 6, 
    md = 4 
  }: { 
    children: React.ReactNode;
    xs?: number;
    sm?: number;
    md?: number;
  }) => (
    <Grid item xs={xs} sm={sm} md={md}>
      {children}
    </Grid>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: 3, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
          Generate IR/MSN Numbers
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Create unique IR (Inspection Report) or MSN (Material Serial Number) identifiers for your components
        </Typography>
      </Paper>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              Basic Information
            </Typography>
            
            <ResponsiveFormGrid>
              {/* Document Type */}
              <FormField xs={12} sm={6} md={4}>
                <FormControl fullWidth error={!!errors.documentType}>
                  <FormLabel component="legend" sx={{ mb: 1, color: 'text.primary' }}>
                    Document Type *
                  </FormLabel>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field} row>
                        <FormControlLabel 
                          value="IR" 
                          control={<Radio size={isMobile ? "small" : "medium"} />} 
                          label="IR Number" 
                        />
                        <FormControlLabel 
                          value="MSN" 
                          control={<Radio size={isMobile ? "small" : "medium"} />} 
                          label="MSN Number" 
                        />
                      </RadioGroup>
                    )}
                  />
                  {errors.documentType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.documentType.message}
                    </Typography>
                  )}
                </FormControl>
              </FormField>

              {/* Drawing Number */}
              <FormField xs={12} sm={6} md={4}>
                <Controller
                  name="drawingNumber"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={drawingNumbers}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option.drawingNumber}
                      loading={isLoading}
                      onInputChange={(_, value) => {
                        setSearchTerm(value);
                        loadDrawingNumbers(value);
                      }}
                      onChange={(_, value) => {
                        field.onChange(value?.drawingNumber || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Drawing Number *"
                          error={!!errors.drawingNumber}
                          helperText={errors.drawingNumber?.message}
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {option.drawingNumber}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {option.nomenclature}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                />
              </FormField>

              {/* Production Series */}
              <FormField xs={12} sm={6} md={4}>
                <Controller
                  name="productionSeries"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.productionSeries}>
                      <InputLabel size={isMobile ? "small" : "normal"}>Production Series *</InputLabel>
                      <Select {...field} label="Production Series *" size={isMobile ? "small" : "medium"}>
                        {productionSeries.map((item) => (
                          <MenuItem key={item.id} value={item.productionSeries}>
                            {item.productionSeries}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.productionSeries && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.productionSeries.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </FormField>

              {/* Stage */}
              <FormField xs={12} sm={6} md={4}>
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.stage}>
                      <InputLabel size={isMobile ? "small" : "normal"}>Stage *</InputLabel>
                      <Select {...field} label="Stage *" size={isMobile ? "small" : "medium"}>
                        {stages.map((stage) => (
                          <MenuItem key={stage} value={stage}>
                            {stage}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.stage && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.stage.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </FormField>

              {/* Quantity */}
              <FormField xs={12} sm={6} md={4}>
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
                      size={isMobile ? "small" : "medium"}
                      inputProps={{ min: 1 }}
                    />
                  )}
                />
              </FormField>

              {/* ID Range */}
              <FormField xs={12} sm={6} md={4}>
                <Controller
                  name="idRange"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ID Range *"
                      fullWidth
                      error={!!errors.idRange}
                      helperText={errors.idRange?.message || "e.g., 1-100 or 1,2,3"}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </FormField>
            </ResponsiveFormGrid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              Project Details
            </Typography>

            <ResponsiveFormGrid>
              {/* PO Number */}
              <FormField xs={12} sm={6} md={6}>
                <Controller
                  name="poNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="PO Number *"
                      fullWidth
                      error={!!errors.poNumber}
                      helperText={errors.poNumber?.message}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </FormField>

              {/* Project Number */}
              <FormField xs={12} sm={6} md={6}>
                <Controller
                  name="projectNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Project Number *"
                      fullWidth
                      error={!!errors.projectNumber}
                      helperText={errors.projectNumber?.message}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </FormField>

              {/* Supplier */}
              <FormField xs={12} sm={6} md={6}>
                <Controller
                  name="supplier"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Supplier"
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </FormField>

              {/* Remark */}
              <FormField xs={12} sm={6} md={6}>
                <Controller
                  name="remark"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Remark"
                      fullWidth
                      multiline
                      rows={isMobile ? 2 : 1}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </FormField>
            </ResponsiveFormGrid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={2} 
            justifyContent="center"
          >
            <Button
              type="submit"
              variant="contained"
              size={isMobile ? "medium" : "large"}
              disabled={isLoading}
              startIcon={isLoading ? <RefreshIcon className="animate-spin" /> : <AddIcon />}
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
            >
              {isLoading ? 'Generating...' : `Generate ${documentType} Number`}
            </Button>
            
            <Button
              type="button"
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              onClick={handleReset}
              startIcon={<RefreshIcon />}
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
            >
              Reset
            </Button>
          </Stack>
        </Paper>

        {/* Generated Result */}
        {generatedNumber && (
          <Card elevation={2} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} justifyContent="center">
                <CheckIcon color="success" />
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  Generated {documentType} Number:
                </Typography>
              </Stack>
              
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'white', 
                borderRadius: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: isMobile ? 'wrap' : 'nowrap'
              }}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  fontFamily="monospace" 
                  fontWeight="bold"
                  sx={{ 
                    wordBreak: 'break-all',
                    flex: 1,
                    mr: 2
                  }}
                >
                  {generatedNumber}
                </Typography>
                
                <Tooltip title="Copy to clipboard">
                  <IconButton 
                    onClick={handleCopy}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  >
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        )}
      </form>
    </Box>
  );
} 