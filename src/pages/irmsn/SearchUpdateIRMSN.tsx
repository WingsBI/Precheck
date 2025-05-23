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
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { RootState } from '../../store/store';

interface IRMSNItem {
  id: number;
  irNumber?: string;
  msnNumber?: string;
  drawingNumber: string;
  productionSeries: string;
  nomenclature: string;
  idNumberRange: string;
  quantity: number;
  projectNumber: string;
  poNumber: string;
  stage: string;
  supplier?: string;
  remark?: string;
  createdDate: string;
  userName: string;
}

interface SearchFormData {
  documentType: 'IR' | 'MSN';
  searchTerm: string;
}

interface UpdateFormData {
  stage: string;
  quantity: number;
  idNumberRange: string;
  supplier?: string;
  remark?: string;
}

export default function SearchUpdateIRMSN() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  // State
  const [searchResults, setSearchResults] = useState<IRMSNItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IRMSNItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Search form state
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    documentType: 'IR',
    searchTerm: '',
  });

  // Update form state
  const [updateForm, setUpdateForm] = useState<UpdateFormData>({
    stage: '',
    quantity: 0,
    idNumberRange: '',
    supplier: '',
    remark: '',
  });

  // Stage options based on document type
  const IRStages = [
    "Before Testing", "After Testing", "Final", "T04 Cavity",
    "Intermediate", "Flower Test", "WPS", "Other"
  ];
  
  const MSNStages = [
    "Testing", "Final", "QT", "Intermediate",
    "Precheck & Final", "Other"
  ];

  const stages = searchForm.documentType === 'IR' ? IRStages : MSNStages;

  // Mock search function
  const onSearch = async () => {
    if (!searchForm.searchTerm.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSuccessMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults: IRMSNItem[] = [
        {
          id: 1,
          irNumber: searchForm.documentType === 'IR' ? `IR-2024-001-${searchForm.searchTerm}` : undefined,
          msnNumber: searchForm.documentType === 'MSN' ? `MSN-2024-001-${searchForm.searchTerm}` : undefined,
          drawingNumber: `DWG-${searchForm.searchTerm}-001`,
          productionSeries: 'PS-2024-A',
          nomenclature: 'Test Component 1',
          idNumberRange: '1-10',
          quantity: 10,
          projectNumber: 'PRJ-2024-001',
          poNumber: 'PO-2024-001',
          stage: searchForm.documentType === 'IR' ? 'Before Testing' : 'Testing',
          supplier: 'Test Supplier',
          remark: 'Test remark',
          createdDate: '2024-01-15',
          userName: 'TestUser',
        },
        {
          id: 2,
          irNumber: searchForm.documentType === 'IR' ? `IR-2024-002-${searchForm.searchTerm}` : undefined,
          msnNumber: searchForm.documentType === 'MSN' ? `MSN-2024-002-${searchForm.searchTerm}` : undefined,
          drawingNumber: `DWG-${searchForm.searchTerm}-002`,
          productionSeries: 'PS-2024-B',
          nomenclature: 'Test Component 2',
          idNumberRange: '11-20',
          quantity: 10,
          projectNumber: 'PRJ-2024-002',
          poNumber: 'PO-2024-002',
          stage: searchForm.documentType === 'IR' ? 'Final' : 'Final',
          supplier: 'Test Supplier 2',
          remark: 'Test remark 2',
          createdDate: '2024-01-16',
          userName: 'TestUser2',
        },
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEdit = (item: IRMSNItem) => {
    setSelectedItem(item);
    setUpdateForm({
      stage: item.stage,
      quantity: item.quantity,
      idNumberRange: item.idNumberRange,
      supplier: item.supplier || '',
      remark: item.remark || '',
    });
    setEditDialogOpen(true);
  };

  const onUpdate = async () => {
    if (!selectedItem) return;
    
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the item in search results
      setSearchResults(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...updateForm }
          : item
      ));
      
      setSuccessMessage(`${searchForm.documentType} Number updated successfully!`);
      setEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setUpdateForm({
      stage: '',
      quantity: 0,
      idNumberRange: '',
      supplier: '',
      remark: '',
    });
  };

  const ResultCard = ({ item }: { item: IRMSNItem }) => (
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
          {/* Header with number and edit button */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="primary" fontWeight="bold">
              {item.irNumber || item.msnNumber}
            </Typography>
            <Tooltip title="Edit">
              <IconButton 
                onClick={() => handleEdit(item)}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Details Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Drawing Number</Typography>
              <Typography variant="body2" fontWeight="medium">{item.drawingNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Production Series</Typography>
              <Typography variant="body2" fontWeight="medium">{item.productionSeries}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Nomenclature</Typography>
              <Typography variant="body2" fontWeight="medium">{item.nomenclature}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">ID Range</Typography>
              <Typography variant="body2" fontWeight="medium">{item.idNumberRange}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Quantity</Typography>
              <Typography variant="body2" fontWeight="medium">{item.quantity}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Stage</Typography>
              <Chip 
                label={item.stage} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">PO Number</Typography>
              <Typography variant="body2" fontWeight="medium">{item.poNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Project Number</Typography>
              <Typography variant="body2" fontWeight="medium">{item.projectNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">Created Date</Typography>
              <Typography variant="body2" fontWeight="medium">{item.createdDate}</Typography>
            </Grid>
          </Grid>

          {(item.supplier || item.remark) && (
            <Stack spacing={1}>
              {item.supplier && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Supplier</Typography>
                  <Typography variant="body2">{item.supplier}</Typography>
                </Box>
              )}
              {item.remark && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Remark</Typography>
                  <Typography variant="body2">{item.remark}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
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
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
          Search & Update IR/MSN Numbers
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Search for existing IR/MSN numbers and update their details
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

      {/* Search Form */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Search Criteria
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            {/* Document Type */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel component="legend" sx={{ mb: 1, color: 'text.primary' }}>
                  Document Type *
                </FormLabel>
                <RadioGroup 
                  value={searchForm.documentType}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, documentType: e.target.value as 'IR' | 'MSN' }))}
                  row
                >
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
              </FormControl>
            </Grid>

            {/* Search Term */}
            <Grid item xs={12} md={4}>
              <TextField
                label={`Search ${searchForm.documentType} Number *`}
                fullWidth
                value={searchForm.searchTerm}
                onChange={(e) => setSearchForm(prev => ({ ...prev, searchTerm: e.target.value }))}
                size={isMobile ? "small" : "medium"}
                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              />
            </Grid>

            {/* Search Button */}
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                size={isMobile ? "medium" : "large"}
                disabled={isSearching || !searchForm.searchTerm.trim()}
                startIcon={isSearching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                fullWidth
                onClick={onSearch}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Search Results ({searchResults.length} found)
          </Typography>
          
          <Stack spacing={2}>
            {searchResults.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </Stack>
        </Paper>
      )}

      {/* No Results */}
      {!isSearching && searchResults.length === 0 && searchForm.searchTerm && (
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
          <SearchIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No results found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No {searchForm.documentType} numbers found matching "{searchForm.searchTerm}"
          </Typography>
        </Paper>
      )}

      {/* Initial State */}
      {!searchForm.searchTerm && searchResults.length === 0 && (
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
          <SearchIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Search IR/MSN Numbers
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Enter search criteria and click "Search" to find {searchForm.documentType} numbers
          </Typography>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon color="primary" />
            <Typography variant="h6">
              Update {selectedItem?.irNumber || selectedItem?.msnNumber}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Stage */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Stage *</InputLabel>
                <Select 
                  value={updateForm.stage}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, stage: e.target.value as string }))}
                  label="Stage *"
                >
                  {stages.map((stage) => (
                    <MenuItem key={stage} value={stage}>
                      {stage}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity *"
                type="number"
                fullWidth
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* ID Range */}
            <Grid item xs={12}>
              <TextField
                label="ID Number Range"
                fullWidth
                value={updateForm.idNumberRange}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, idNumberRange: e.target.value }))}
                helperText="e.g., 1-100 or 1,2,3"
              />
            </Grid>

            {/* Supplier */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supplier"
                fullWidth
                value={updateForm.supplier}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </Grid>

            {/* Remark */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Remark"
                fullWidth
                multiline
                rows={2}
                value={updateForm.remark}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, remark: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCancelEdit}
            startIcon={<CancelIcon />}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            onClick={onUpdate}
            variant="contained"
            startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={isUpdating || !updateForm.stage}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 