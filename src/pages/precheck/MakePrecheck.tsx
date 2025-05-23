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
  IconButton,
  Tooltip,
  Skeleton,
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  FormControlLabel as MuiFormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { RootState } from '../../store/store';

// Validation schema
const schema = yup.object().shape({
  drawingNumber: yup.string().required('Drawing Number is required'),
  nomenclature: yup.string().required('Nomenclature is required'),
  productionSeries: yup.string().required('Production Series is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  poNumber: yup.string().required('PO Number is required'),
  projectNumber: yup.string().required('Project Number is required'),
  startRange: yup.number().min(1, 'Start range is required').required('Start range is required'),
  endRange: yup.number().min(1, 'End range is required').required('End range is required'),
  department: yup.string().required('Department is required'),
  stage: yup.string().required('Stage is required'),
});

interface PrecheckItem {
  id: number;
  serialNumber: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  checkpoints: PrecheckCheckpoint[];
  startTime?: string;
  endTime?: string;
  remarks?: string;
}

interface PrecheckCheckpoint {
  id: number;
  name: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  result?: 'pass' | 'fail' | 'na';
  remarks?: string;
}

interface PrecheckFormData {
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  quantity: number;
  poNumber: string;
  projectNumber: string;
  startRange: number;
  endRange: number;
  department: string;
  stage: string;
  remarks?: string;
}

export default function MakePrecheck() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  // State
  const [precheckItems, setPrecheckItems] = useState<PrecheckItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PrecheckItem | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [precheckDialogOpen, setPrecheckDialogOpen] = useState(false);

  // Stage options
  const stages = [
    "Initial Check", "In-Process Check", "Final Check", 
    "Quality Check", "Assembly Check", "Testing Check"
  ];

  // Departments
  const departments = [
    "Production", "Quality Control", "Assembly", 
    "Testing", "Finishing", "Packaging"
  ];

  // Standard checkpoints
  const standardCheckpoints: Omit<PrecheckCheckpoint, 'id'>[] = [
    { name: "Visual Inspection", description: "Check for visual defects and damages", isCompleted: false, isRequired: true },
    { name: "Dimensional Check", description: "Verify dimensions according to drawing", isCompleted: false, isRequired: true },
    { name: "Material Verification", description: "Confirm material specifications", isCompleted: false, isRequired: true },
    { name: "Surface Finish", description: "Check surface finish quality", isCompleted: false, isRequired: false },
    { name: "Functionality Test", description: "Test basic functionality", isCompleted: false, isRequired: true },
    { name: "Documentation", description: "Verify all required documentation", isCompleted: false, isRequired: true },
  ];

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<PrecheckFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      quantity: 1,
      startRange: 1,
      endRange: 1,
    }
  });

  const watchQuantity = watch('quantity');
  const watchStartRange = watch('startRange');

  // Auto-update end range when quantity or start range changes
  useEffect(() => {
    if (watchQuantity && watchStartRange) {
      const endRange = watchStartRange + watchQuantity - 1;
      // Use setValue to update endRange
    }
  }, [watchQuantity, watchStartRange]);

  const onSubmit = async (data: PrecheckFormData) => {
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newItems: PrecheckItem[] = [];
      for (let i = 0; i < data.quantity; i++) {
        const serialNumber = `${data.drawingNumber}-${String(data.startRange + i).padStart(4, '0')}`;
        newItems.push({
          id: Date.now() + i,
          serialNumber,
          status: 'pending',
          checkpoints: standardCheckpoints.map((cp, index) => ({
            ...cp,
            id: index + 1,
          })),
        });
      }
      
      setPrecheckItems(newItems);
      setSuccessMessage(`Successfully created ${data.quantity} precheck items!`);
      setActiveStep(1);
    } catch (error) {
      console.error('Error creating precheck:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const startPrecheck = (item: PrecheckItem) => {
    setSelectedItem({
      ...item,
      status: 'in-progress',
      startTime: new Date().toISOString(),
    });
    setPrecheckDialogOpen(true);
  };

  const updateCheckpoint = (checkpointId: number, updates: Partial<PrecheckCheckpoint>) => {
    if (!selectedItem) return;
    
    setSelectedItem({
      ...selectedItem,
      checkpoints: selectedItem.checkpoints.map(cp =>
        cp.id === checkpointId ? { ...cp, ...updates } : cp
      ),
    });
  };

  const completePrecheck = async () => {
    if (!selectedItem) return;
    
    setIsProcessing(true);
    try {
      const allRequiredCompleted = selectedItem.checkpoints
        .filter(cp => cp.isRequired)
        .every(cp => cp.isCompleted);
      
      const updatedItem = {
        ...selectedItem,
        status: allRequiredCompleted ? 'completed' : 'failed',
        endTime: new Date().toISOString(),
      } as PrecheckItem;
      
      setPrecheckItems(prev => prev.map(item => 
        item.id === selectedItem.id ? updatedItem : item
      ));
      
      setPrecheckDialogOpen(false);
      setSelectedItem(null);
      setSuccessMessage(`Precheck ${allRequiredCompleted ? 'completed' : 'failed'}!`);
    } catch (error) {
      console.error('Error completing precheck:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: PrecheckItem['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: PrecheckItem['status']) => {
    switch (status) {
      case 'completed': return <CheckIcon />;
      case 'failed': return <WarningIcon />;
      case 'in-progress': return <PlayIcon />;
      default: return <StopIcon />;
    }
  };

  const PrecheckItemCard = ({ item }: { item: PrecheckItem }) => (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 2,
        border: item.status === 'in-progress' ? 2 : 1,
        borderColor: item.status === 'in-progress' ? 'warning.main' : 'divider',
        '&:hover': { 
          elevation: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="primary" fontWeight="bold">
              {item.serialNumber}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={item.status.replace('-', ' ').toUpperCase()}
                color={getStatusColor(item.status)}
                icon={getStatusIcon(item.status)}
                size="small"
              />
              {item.status === 'pending' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={() => startPrecheck(item)}
                >
                  Start
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Progress */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.checkpoints.filter(cp => cp.isCompleted).length} / {item.checkpoints.length}
              </Typography>
            </Stack>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: 'grey.200', 
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              <Box sx={{
                width: `${(item.checkpoints.filter(cp => cp.isCompleted).length / item.checkpoints.length) * 100}%`,
                height: '100%',
                bgcolor: getStatusColor(item.status) + '.main',
                transition: 'width 0.3s ease'
              }} />
            </Box>
          </Box>

          {/* Timing */}
          {(item.startTime || item.endTime) && (
            <Grid container spacing={2}>
              {item.startTime && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Start Time</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(item.startTime).toLocaleTimeString()}
                  </Typography>
                </Grid>
              )}
              {item.endTime && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">End Time</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(item.endTime).toLocaleTimeString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const steps = [
    {
      label: 'Create Precheck',
      content: (
        <Card elevation={1}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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

                {/* Department */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.department} size={isMobile ? "small" : "medium"}>
                        <InputLabel>Department *</InputLabel>
                        <Select {...field} label="Department *">
                          {departments.map((dept) => (
                            <MenuItem key={dept} value={dept}>
                              {dept}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.department && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            {errors.department.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Stage */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="stage"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.stage} size={isMobile ? "small" : "medium"}>
                        <InputLabel>Stage *</InputLabel>
                        <Select {...field} label="Stage *">
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
                </Grid>

                {/* PO Number */}
                <Grid item xs={12} md={6}>
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
                </Grid>

                {/* Project Number */}
                <Grid item xs={12} md={6}>
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
                      />
                    )}
                  />
                </Grid>

                {/* Remarks */}
                <Grid item xs={12}>
                  <Controller
                    name="remarks"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Remarks"
                        fullWidth
                        multiline
                        rows={3}
                        size={isMobile ? "small" : "medium"}
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
                    disabled={isCreating}
                    startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                    fullWidth
                  >
                    {isCreating ? 'Creating...' : 'Create Precheck Items'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Execute Precheck',
      content: (
        <Stack spacing={2}>
          {precheckItems.map((item) => (
            <PrecheckItemCard key={item.id} item={item} />
          ))}
          
          {precheckItems.length === 0 && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300'
              }}
            >
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No precheck items created yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complete Step 1 to create precheck items
              </Typography>
            </Paper>
          )}
        </Stack>
      ),
    },
  ];

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
          Make Precheck
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Create and execute precheck procedures for production items
        </Typography>
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

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation={isMobile ? "vertical" : "horizontal"}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              onClick={() => setActiveStep(index)}
              sx={{ cursor: 'pointer' }}
            >
              {step.label}
            </StepLabel>
            {isMobile && (
              <StepContent>
                {step.content}
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>

      {/* Step Content for Desktop */}
      {!isMobile && (
        <Box sx={{ mt: 3 }}>
          {steps[activeStep].content}
        </Box>
      )}

      {/* Precheck Dialog */}
      <Dialog 
        open={precheckDialogOpen} 
        onClose={() => setPrecheckDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckIcon color="primary" />
            <Typography variant="h6">
              Precheck: {selectedItem?.serialNumber}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedItem?.checkpoints.map((checkpoint) => (
              <Card key={checkpoint.id} elevation={1}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight="medium">
                        {checkpoint.name}
                        {checkpoint.isRequired && (
                          <Chip label="Required" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Checkbox
                        checked={checkpoint.isCompleted}
                        onChange={(e) => updateCheckpoint(checkpoint.id, { isCompleted: e.target.checked })}
                        color="primary"
                      />
                    </Stack>
                    
                    <Typography variant="body2" color="textSecondary">
                      {checkpoint.description}
                    </Typography>
                    
                    {checkpoint.isCompleted && (
                      <Stack spacing={2}>
                        <FormControl size="small">
                          <InputLabel>Result</InputLabel>
                          <Select
                            value={checkpoint.result || ''}
                            onChange={(e) => updateCheckpoint(checkpoint.id, { result: e.target.value as any })}
                            label="Result"
                          >
                            <MenuItem value="pass">Pass</MenuItem>
                            <MenuItem value="fail">Fail</MenuItem>
                            <MenuItem value="na">N/A</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <TextField
                          label="Remarks"
                          value={checkpoint.remarks || ''}
                          onChange={(e) => updateCheckpoint(checkpoint.id, { remarks: e.target.value })}
                          multiline
                          rows={2}
                          size="small"
                        />
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setPrecheckDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={completePrecheck}
            variant="contained"
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            disabled={isProcessing}
          >
            {isProcessing ? 'Completing...' : 'Complete Precheck'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 