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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Description as SOPIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { RootState } from '../../store/store';

// Validation schema
const schema = yup.object().shape({
  sopTitle: yup.string().required('SOP Title is required'),
  sopNumber: yup.string().required('SOP Number is required'),
  version: yup.string().required('Version is required'),
  department: yup.string().required('Department is required'),
  processType: yup.string().required('Process Type is required'),
  description: yup.string().required('Description is required'),
  purpose: yup.string().required('Purpose is required'),
  scope: yup.string().required('Scope is required'),
  responsibility: yup.string().required('Responsibility is required'),
});

interface SOPStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  duration: number; // in minutes
  isRequired: boolean;
  safetyNotes?: string;
  tools?: string[];
  materials?: string[];
  checkpoints?: string[];
  images?: string[];
}

interface SOPDocument {
  id: number;
  sopNumber: string;
  sopTitle: string;
  version: string;
  department: string;
  processType: string;
  description: string;
  purpose: string;
  scope: string;
  responsibility: string;
  approvedBy?: string;
  approvedDate?: string;
  effectiveDate?: string;
  reviewDate?: string;
  status: 'draft' | 'review' | 'approved' | 'active' | 'obsolete';
  steps: SOPStep[];
  createdBy: string;
  createdDate: string;
  lastModified: string;
  totalDuration: number;
}

interface SOPFormData {
  sopTitle: string;
  sopNumber: string;
  version: string;
  department: string;
  processType: string;
  description: string;
  purpose: string;
  scope: string;
  responsibility: string;
  approvedBy?: string;
  effectiveDate?: string;
  reviewDate?: string;
}

export default function SOPGeneration() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  // State
  const [sopDocuments, setSOPDocuments] = useState<SOPDocument[]>([]);
  const [selectedSOP, setSelectedSOP] = useState<SOPDocument | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [sopDialogOpen, setSOPDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [stepsDialogOpen, setStepsDialogOpen] = useState(false);

  // Departments and Process Types
  const departments = [
    "Production", "Quality Control", "Assembly", 
    "Testing", "Finishing", "Packaging", "Maintenance"
  ];

  const processTypes = [
    "Manufacturing", "Assembly", "Testing", "Quality Check",
    "Maintenance", "Calibration", "Safety", "Training"
  ];

  const sopStatuses = [
    { value: 'draft', label: 'Draft', color: 'default' },
    { value: 'review', label: 'Under Review', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'info' },
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'obsolete', label: 'Obsolete', color: 'error' },
  ];

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<SOPFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      version: '1.0',
    }
  });

  const onSubmit = async (data: SOPFormData) => {
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSOP: SOPDocument = {
        id: Date.now(),
        ...data,
        status: 'draft',
        steps: [],
        createdBy: 'Current User', // Should come from auth
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalDuration: 0,
      };
      
      setSOPDocuments(prev => [...prev, newSOP]);
      setSelectedSOP(newSOP);
      setSuccessMessage('SOP document created successfully!');
      setActiveStep(1);
      reset();
    } catch (error) {
      console.error('Error creating SOP:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const addStep = () => {
    if (!selectedSOP) return;
    
    const newStep: SOPStep = {
      id: Date.now(),
      stepNumber: selectedSOP.steps.length + 1,
      title: '',
      description: '',
      duration: 0,
      isRequired: true,
      tools: [],
      materials: [],
      checkpoints: [],
      images: [],
    };
    
    setSelectedSOP({
      ...selectedSOP,
      steps: [...selectedSOP.steps, newStep],
    });
  };

  const updateStep = (stepId: number, updates: Partial<SOPStep>) => {
    if (!selectedSOP) return;
    
    setSelectedSOP({
      ...selectedSOP,
      steps: selectedSOP.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
      totalDuration: selectedSOP.steps.reduce((total, step) => 
        total + (step.id === stepId ? (updates.duration || step.duration) : step.duration), 0
      ),
    });
  };

  const deleteStep = (stepId: number) => {
    if (!selectedSOP) return;
    
    const updatedSteps = selectedSOP.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, stepNumber: index + 1 }));
    
    setSelectedSOP({
      ...selectedSOP,
      steps: updatedSteps,
      totalDuration: updatedSteps.reduce((total, step) => total + step.duration, 0),
    });
  };

  const saveSOP = async () => {
    if (!selectedSOP) return;
    
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSOPDocuments(prev => prev.map(sop => 
        sop.id === selectedSOP.id 
          ? { ...selectedSOP, lastModified: new Date().toISOString() }
          : sop
      ));
      
      setSuccessMessage('SOP saved successfully!');
    } catch (error) {
      console.error('Error saving SOP:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSOPStatus = (sopId: number, status: SOPDocument['status']) => {
    setSOPDocuments(prev => prev.map(sop => 
      sop.id === sopId 
        ? { ...sop, status, lastModified: new Date().toISOString() }
        : sop
    ));
    setSuccessMessage(`SOP status updated to ${status}!`);
  };

  const exportSOP = (sop: SOPDocument) => {
    // Create a simple text format export
    const sopContent = [
      `SOP Document: ${sop.sopTitle}`,
      `SOP Number: ${sop.sopNumber}`,
      `Version: ${sop.version}`,
      `Department: ${sop.department}`,
      `Process Type: ${sop.processType}`,
      '',
      'PURPOSE:',
      sop.purpose,
      '',
      'SCOPE:',
      sop.scope,
      '',
      'RESPONSIBILITY:',
      sop.responsibility,
      '',
      'DESCRIPTION:',
      sop.description,
      '',
      'PROCEDURE STEPS:',
      ...sop.steps.map(step => [
        `Step ${step.stepNumber}: ${step.title}`,
        `Duration: ${step.duration} minutes`,
        `Required: ${step.isRequired ? 'Yes' : 'No'}`,
        `Description: ${step.description}`,
        step.safetyNotes ? `Safety Notes: ${step.safetyNotes}` : '',
        step.tools?.length ? `Tools: ${step.tools.join(', ')}` : '',
        step.materials?.length ? `Materials: ${step.materials.join(', ')}` : '',
        step.checkpoints?.length ? `Checkpoints: ${step.checkpoints.join(', ')}` : '',
        '',
      ]).flat(),
      '',
      `Created By: ${sop.createdBy}`,
      `Created Date: ${new Date(sop.createdDate).toLocaleDateString()}`,
      `Total Duration: ${sop.totalDuration} minutes`,
    ].join('\n');
    
    const blob = new Blob([sopContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOP_${sop.sopNumber}_v${sop.version}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSuccessMessage('SOP exported successfully!');
  };

  const getStatusColor = (status: SOPDocument['status']) => {
    const statusObj = sopStatuses.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const SOPCard = ({ sop }: { sop: SOPDocument }) => (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 2,
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
          <Stack direction="row" justifyContent="space-between" alignItems="start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {sop.sopTitle}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {sop.sopNumber} - v{sop.version}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {sop.description}
              </Typography>
            </Box>
            <Stack spacing={1} alignItems="flex-end">
              <Chip 
                label={sopStatuses.find(s => s.value === sop.status)?.label}
                color={getStatusColor(sop.status) as any}
                size="small"
              />
              <Typography variant="caption" color="textSecondary">
                {sop.steps.length} steps • {sop.totalDuration}min
              </Typography>
            </Stack>
          </Stack>

          {/* Details */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography variant="body2" fontWeight="medium">{sop.department}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="textSecondary">Process Type</Typography>
              <Typography variant="body2" fontWeight="medium">{sop.processType}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="textSecondary">Created By</Typography>
              <Typography variant="body2" fontWeight="medium">{sop.createdBy}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="textSecondary">Last Modified</Typography>
              <Typography variant="body2" fontWeight="medium">
                {new Date(sop.lastModified).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="View">
              <IconButton 
                size="small" 
                onClick={() => {
                  setSelectedSOP(sop);
                  setPreviewDialogOpen(true);
                }}
                color="primary"
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Steps">
              <IconButton 
                size="small"
                onClick={() => {
                  setSelectedSOP(sop);
                  setStepsDialogOpen(true);
                }}
                color="secondary"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton 
                size="small"
                onClick={() => exportSOP(sop)}
                color="info"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            {/* Status Change Menu */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={sop.status}
                onChange={(e) => updateSOPStatus(sop.id, e.target.value as SOPDocument['status'])}
                size="small"
              >
                {sopStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  const StepEditor = ({ step, onUpdate, onDelete }: { 
    step: SOPStep; 
    onUpdate: (updates: Partial<SOPStep>) => void;
    onDelete: () => void;
  }) => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <Typography variant="h6">
            Step {step.stepNumber}: {step.title || 'Untitled Step'}
          </Typography>
          <Chip 
            label={`${step.duration}min`}
            size="small"
            color={step.isRequired ? 'primary' : 'default'}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              label="Step Title"
              fullWidth
              value={step.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Duration (minutes)"
              type="number"
              fullWidth
              value={step.duration}
              onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0 }}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Step Description"
              fullWidth
              multiline
              rows={3}
              value={step.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Safety Notes (Optional)"
              fullWidth
              multiline
              rows={2}
              value={step.safetyNotes || ''}
              onChange={(e) => onUpdate({ safetyNotes: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Tools Required (comma separated)"
              fullWidth
              value={(step.tools || []).join(', ')}
              onChange={(e) => onUpdate({ 
                tools: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Materials Required (comma separated)"
              fullWidth
              value={(step.materials || []).join(', ')}
              onChange={(e) => onUpdate({ 
                materials: e.target.value.split(',').map(m => m.trim()).filter(m => m)
              })}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Checkpoints (comma separated)"
              fullWidth
              value={(step.checkpoints || []).join(', ')}
              onChange={(e) => onUpdate({ 
                checkpoints: e.target.value.split(',').map(c => c.trim()).filter(c => c)
              })}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={step.isRequired}
                    onChange={(e) => onUpdate({ isRequired: e.target.checked })}
                  />
                }
                label="Required Step"
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >
                Delete Step
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const steps = [
    {
      label: 'Create SOP Document',
      content: (
        <Card elevation={1}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* SOP Title */}
                <Grid item xs={12} md={8}>
                  <Controller
                    name="sopTitle"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="SOP Title *"
                        fullWidth
                        error={!!errors.sopTitle}
                        helperText={errors.sopTitle?.message}
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>

                {/* SOP Number */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="sopNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="SOP Number *"
                        fullWidth
                        error={!!errors.sopNumber}
                        helperText={errors.sopNumber?.message}
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>

                {/* Version */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="version"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Version *"
                        fullWidth
                        error={!!errors.version}
                        helperText={errors.version?.message}
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>

                {/* Department */}
                <Grid item xs={12} md={4}>
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

                {/* Process Type */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="processType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.processType} size={isMobile ? "small" : "medium"}>
                        <InputLabel>Process Type *</InputLabel>
                        <Select {...field} label="Process Type *">
                          {processTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.processType && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            {errors.processType.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description *"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>

                {/* Purpose */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="purpose"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Purpose *"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.purpose}
                        helperText={errors.purpose?.message}
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>

                {/* Scope */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="scope"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Scope *"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.scope}
                        helperText={errors.scope?.message}
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>

                {/* Responsibility */}
                <Grid item xs={12}>
                  <Controller
                    name="responsibility"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Responsibility *"
                        fullWidth
                        multiline
                        rows={2}
                        error={!!errors.responsibility}
                        helperText={errors.responsibility?.message}
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
                    startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : <SOPIcon />}
                    fullWidth
                  >
                    {isCreating ? 'Creating...' : 'Create SOP Document'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Manage SOP Documents',
      content: (
        <Stack spacing={2}>
          {sopDocuments.map((sop) => (
            <SOPCard key={sop.id} sop={sop} />
          ))}
          
          {sopDocuments.length === 0 && (
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
              <SOPIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No SOP documents created yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complete Step 1 to create your first SOP document
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
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          borderRadius: 2
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <SOPIcon sx={{ fontSize: { xs: 32, md: 40 } }} />
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
              SOP Generation
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Create and manage Standard Operating Procedures
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

      {/* Steps Editor Dialog */}
      <Dialog 
        open={stepsDialogOpen} 
        onClose={() => setStepsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">
              Edit Steps: {selectedSOP?.sopTitle}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedSOP?.steps.map((step) => (
              <StepEditor
                key={step.id}
                step={step}
                onUpdate={(updates) => updateStep(step.id, updates)}
                onDelete={() => deleteStep(step.id)}
              />
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addStep}
              fullWidth
            >
              Add New Step
            </Button>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setStepsDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              saveSOP();
              setStepsDialogOpen(false);
            }}
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ViewIcon color="primary" />
            <Typography variant="h6">
              SOP Preview: {selectedSOP?.sopTitle}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedSOP && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Header Info */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">SOP Number</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedSOP.sopNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Version</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedSOP.version}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Department</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedSOP.department}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Process Type</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedSOP.processType}</Typography>
                </Grid>
              </Grid>

              <Divider />

              {/* Content Sections */}
              <Box>
                <Typography variant="h6" gutterBottom>Purpose</Typography>
                <Typography variant="body2">{selectedSOP.purpose}</Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>Scope</Typography>
                <Typography variant="body2">{selectedSOP.scope}</Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>Responsibility</Typography>
                <Typography variant="body2">{selectedSOP.responsibility}</Typography>
              </Box>

              {/* Steps */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Procedure Steps ({selectedSOP.steps.length})
                </Typography>
                <Stack spacing={2}>
                  {selectedSOP.steps.map((step) => (
                    <Card key={step.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight="bold">
                              Step {step.stepNumber}: {step.title}
                            </Typography>
                            <Chip 
                              label={`${step.duration}min`}
                              size="small"
                              color={step.isRequired ? 'primary' : 'default'}
                            />
                          </Stack>
                          <Typography variant="body2">{step.description}</Typography>
                          {step.safetyNotes && (
                            <Alert severity="warning" size="small">
                              <Typography variant="caption">
                                <strong>Safety:</strong> {step.safetyNotes}
                              </Typography>
                            </Alert>
                          )}
                          {(step.tools?.length || step.materials?.length || step.checkpoints?.length) && (
                            <Grid container spacing={1}>
                              {step.tools?.length && (
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="textSecondary">Tools</Typography>
                                  <Typography variant="body2">{step.tools.join(', ')}</Typography>
                                </Grid>
                              )}
                              {step.materials?.length && (
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="textSecondary">Materials</Typography>
                                  <Typography variant="body2">{step.materials.join(', ')}</Typography>
                                </Grid>
                              )}
                              {step.checkpoints?.length && (
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="textSecondary">Checkpoints</Typography>
                                  <Typography variant="body2">{step.checkpoints.join(', ')}</Typography>
                                </Grid>
                              )}
                            </Grid>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Summary */}
              <Box>
                <Typography variant="h6" gutterBottom>Summary</Typography>
                <Typography variant="body2">
                  Total Steps: {selectedSOP.steps.length} | 
                  Total Duration: {selectedSOP.totalDuration} minutes |
                  Required Steps: {selectedSOP.steps.filter(s => s.isRequired).length}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => selectedSOP && exportSOP(selectedSOP)}
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
          <Button 
            onClick={() => setPreviewDialogOpen(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
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