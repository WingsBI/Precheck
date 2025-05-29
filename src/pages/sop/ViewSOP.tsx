import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Backdrop,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Container,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  GetApp as ExportIcon,
  Refresh as ResetIcon,
  TableChart as TableIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as TreeIcon,
  ViewList as ListIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { debounce } from "lodash";
import type { RootState } from "../../store/store";
import {
  getSopAssemblyData,
  exportSopAssemblyData,
  clearAssemblyData,
  clearError,
  setSearchCriteria,
} from "../../store/slices/sopSlice";
import {
  getAllProductionSeries,
  getDrawingNumbers,
} from "../../store/slices/commonSlice";
import TreeTable from "../../components/TreeTable/TreeTable";

interface FormData {
  prodSeriesId: number;
  drawingNumberId: number;
  assemblyNumber: string;
}

const ViewSOP: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Redux state
  const { assemblyData, isLoading, isExporting, error } = useSelector(
    (state: RootState) => state.sop
  );

  const {
    productionSeries,
    drawingNumbers,
    isLoading: commonLoading,
  } = useSelector((state: RootState) => state.common);

  // Local state matching ViewModel
  const [drwDisplayText, setDrwDisplayText] = useState("");
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [isDRWDropDownOpen, setIsDRWDropDownOpen] = useState(false);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  // Tree table columns configuration
  const treeColumns = [
    {
      id: 'drawingNumber',
      label: 'Drawing Number',
      minWidth: 160,
      format: (value: any, row: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
              color: row.level === 0 ? '#1976d2' : row.level === 1 ? '#2e7d32' : '#424242',
              fontSize: { xs: '0.7rem', md: '0.8rem' }
            }}
          >
            {value}
          </Typography>
          {row.level === 0 && (
            <Chip 
              label="Main" 
              size="small" 
              sx={{ 
                backgroundColor: '#e3f2fd', 
                color: '#1976d2',
                fontSize: '0.6rem',
                height: 16,
                fontWeight: 500,
                '& .MuiChip-label': { px: 0.5 }
              }} 
            />
          )}
          {row.level === 1 && (
            <Chip 
              label="Sub" 
              size="small" 
              sx={{ 
                backgroundColor: '#e8f5e8', 
                color: '#2e7d32',
                fontSize: '0.6rem',
                height: 16,
                fontWeight: 500,
                '& .MuiChip-label': { px: 0.5 }
              }} 
            />
          )}
          {row.level > 1 && (
            <Chip 
              label={`L${row.level}`}
              size="small" 
              sx={{ 
                backgroundColor: '#f5f5f5', 
                color: '#757575',
                fontSize: '0.6rem',
                height: 16,
                fontWeight: 500,
                '& .MuiChip-label': { px: 0.5 }
              }} 
            />
          )}
        </Box>
      ),
    },
    {
      id: 'nomenclature',
      label: 'Nomenclature',
      minWidth: 120,
      format: (value: any, row: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontWeight: row.level === 0 ? 500 : 400,
            color: row.level === 0 ? '#1e293b' : '#374151',
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'idNumber',
      label: 'ID No',
      minWidth: 80,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace',
            backgroundColor: row.level === 0 ? '#f8fafc' : 'transparent',
            px: row.level === 0 ? 0.5 : 0,
            py: row.level === 0 ? 0.25 : 0,
            borderRadius: 0.5,
            fontWeight: row.level === 0 ? 500 : 400
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'quantity',
      label: 'Qty',
      minWidth: 60,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            color: row.level === 0 ? '#1976d2' : '#059669',
            fontSize: { xs: '0.7rem', md: '0.8rem' }
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'irNumber',
      label: 'IR Number',
      minWidth: 100,
      align: 'center' as const,
      format: (value: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace'
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'msnNumber',
      label: 'MSN Number',
      minWidth: 100,
      align: 'center' as const,
      format: (value: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace'
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'remarks',
      label: 'Remarks',
      minWidth: 80,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontStyle: !value ? 'italic' : 'normal',
            color: !value ? '#9ca3af' : row.level === 0 ? '#374151' : '#6b7280'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'assemblyNumber',
      label: 'Assembly No',
      minWidth: 100,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace',
            fontWeight: row.level === 0 ? 500 : 400,
            color: row.level === 0 ? '#1976d2' : '#374151'
          }}
        >
          {value}
        </Typography>
      ),
    },
  ];

  // Form setup
  const { control, handleSubmit, reset, watch, setValue, getValues } =
    useForm<FormData>({
      defaultValues: {
        prodSeriesId: 0,
        drawingNumberId: 0,
        assemblyNumber: "",
      },
    });

  const watchedValues = watch();

  // Transform flat data to tree structure
  const transformToTreeData = useCallback((data: any[]) => {
    if (!data || data.length === 0) return [];

    // Create a more sophisticated hierarchy based on multiple criteria
    const processedData = data.map((item, index) => {
      // Method 1: Use existing parent-child relationships from API
      let parentId = item.parentId || item.parentAssemblyId || null;
      let level = item.level || 0;
      
      // Method 2: Infer hierarchy from drawing number patterns
      if (!parentId && item.drawingNumber) {
        const drawingParts = item.drawingNumber.split('-');
        if (drawingParts.length > 1) {
          // Look for parent assembly with shorter drawing number
          const parentDrawingNumber = drawingParts.slice(0, -1).join('-');
          const parentItem = data.find(d => d.drawingNumber === parentDrawingNumber);
          if (parentItem) {
            parentId = parentItem.id || parentItem.serialNumber;
          }
          level = Math.min(drawingParts.length - 1, 3); // Limit depth to 3 levels
        }
      }

      // Method 3: Use assembly number relationships
      if (!parentId && item.assemblyNumber && item.assemblyNumber !== item.drawingNumber) {
        const parentItem = data.find(d => 
          d.drawingNumber === item.assemblyNumber || 
          d.idNumber === item.assemblyNumber
        );
        if (parentItem) {
          parentId = parentItem.id || parentItem.serialNumber;
          level = Math.min((parentItem.level || 0) + 1, 3);
        }
      }

      // Method 4: Group by nomenclature patterns for similar components
      if (!parentId && level === 0 && item.nomenclature) {
        const nomenclatureParts = item.nomenclature.toLowerCase().split(' ');
        if (nomenclatureParts.length > 2) {
          const baseNomenclature = nomenclatureParts.slice(0, 2).join(' ');
          const parentItem = data.find((d, idx) => 
            idx < index && 
            d.nomenclature?.toLowerCase().includes(baseNomenclature) &&
            d.drawingNumber !== item.drawingNumber
          );
          if (parentItem) {
            parentId = parentItem.id || parentItem.serialNumber;
            level = 1;
          }
        }
      }

      // Determine if this item has children
      const hasChildren = data.some(otherItem => 
        (otherItem.parentId === (item.id || item.serialNumber)) ||
        (otherItem.parentAssemblyId === (item.id || item.serialNumber)) ||
        (otherItem.assemblyNumber === item.drawingNumber) ||
        (otherItem.drawingNumber?.startsWith(item.drawingNumber + '-')) ||
        (otherItem.nomenclature?.toLowerCase().includes(item.nomenclature?.toLowerCase().split(' ')[0] || ''))
      );

      return {
        ...item,
        id: item.id || item.serialNumber || index + 1,
        parentId: parentId,
        level: Math.max(0, Math.min(level, 3)), // Ensure level is between 0-3
        hasChildren: hasChildren,
        isExpanded: level === 0, // Auto-expand top level items
        // Additional metadata for tree visualization
        nodeType: level === 0 ? 'assembly' : level === 1 ? 'subassembly' : 'component',
        depth: level,
        childCount: data.filter(d => 
          d.parentId === (item.id || item.serialNumber) ||
          d.assemblyNumber === item.drawingNumber
        ).length,
      };
    });

    // Sort by hierarchy and drawing number for better tree structure
    return processedData.sort((a, b) => {
      // First sort by level (assemblies first)
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      // Then sort by drawing number within the same level
      const aDrawing = a.drawingNumber || '';
      const bDrawing = b.drawingNumber || '';
      return aDrawing.localeCompare(bDrawing);
    });
  }, []);

  // Get tree data
  const treeData = useMemo(() => {
    return transformToTreeData(assemblyData);
  }, [assemblyData, transformToTreeData]);

  // Debounced drawing number search - matches LoadDRWNumbers logic
  const loadDRWNumbers = useCallback(
    debounce(async (searchText: string) => {
      if (!searchText || searchText.length < 3) {
        setIsDRWDropDownOpen(false);
        return;
      }

      try {
        const result = await dispatch(
          getDrawingNumbers({ search: searchText }) as any
        );
        if (result.payload && result.payload.length > 0) {
          setIsDRWDropDownOpen(true);
        } else {
          setIsDRWDropDownOpen(false);
        }
      } catch (error) {
        console.error("Error loading drawing numbers:", error);
        setIsDRWDropDownOpen(false);
      }
    }, 300),
    [dispatch]
  );

  // Initialize data - matches InitializeAsync
  useEffect(() => {
    const initializeAsync = async () => {
      try {
        await dispatch(getAllProductionSeries() as any);
      } catch (error) {
        console.error("Initialization failed:", error);
      }
    };

    initializeAsync();
  }, [dispatch]);

  // Handle DRW display text changes
  useEffect(() => {
    if (!isSelectingItem) {
      loadDRWNumbers(drwDisplayText);
    }
  }, [drwDisplayText, isSelectingItem, loadDRWNumbers]);

  // Clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Validate required fields - matches ValidateRequiredFields
  const validateRequiredFields = useCallback((): string[] => {
    const values = getValues();
    const missingFields: string[] = [];

    if (!values.drawingNumberId || values.drawingNumberId <= 0) {
      missingFields.push("Drawing Number");
    }

    if (!values.prodSeriesId || values.prodSeriesId <= 0) {
      missingFields.push("Series Number");
    }

    return missingFields;
  }, [getValues]);

  // Handle search - matches ExecuteSearch
  const executeSearch = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(
          `Please fill the following required fields: ${missingFields.join(
            ", "
          )}`
        );
        return;
      }

      const values = getValues();
      const request = {
        assemblyDrawingId: values.drawingNumberId || 0,
        serielNumberId: parseInt(values.assemblyNumber || "0") || 0,
        prodSeriesId: values.prodSeriesId || 0,
      };

      dispatch(setSearchCriteria(request));
      const result = await dispatch(getSopAssemblyData(request) as any);

      if (result.payload && result.payload.length > 0) {
        setSuccessMessage(
          `Found ${result.payload.length} records matching your criteria.`
        );
      } else {
        setSuccessMessage("No records found matching your criteria.");
      }
    } catch (error) {
      console.error("Error during search:", error);
      setSuccessMessage("Error during search");
    }
  }, [dispatch, validateRequiredFields, getValues]);

  // Handle export - matches ExecuteExport
  const executeExport = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(
          `Please fill the following required fields before exporting: ${missingFields.join(
            ", "
          )}`
        );
        return;
      }

      if (!assemblyData || assemblyData.length === 0) {
        setSuccessMessage(
          "No data available to export. Please perform a search first."
        );
        return;
      }

      const values = getValues();
      const request = {
        assemblyDrawingId: values.drawingNumberId || 0,
        serielNumberId: parseInt(values.assemblyNumber || "0") || 0,
        prodSeriesId: values.prodSeriesId || 0,
      };

      await dispatch(exportSopAssemblyData(request) as any);
      setSuccessMessage("Export completed successfully!");
    } catch (error) {
      console.error("Error during export:", error);
      setSuccessMessage("Error during export");
    }
  }, [dispatch, validateRequiredFields, assemblyData, getValues]);

  // Handle reset - matches ExecuteReset
  const executeReset = useCallback(() => {
    // Clear all form values
    reset({
      prodSeriesId: 0,
      drawingNumberId: 0,
      assemblyNumber: "",
    });

    // Clear local state
    setDrwDisplayText("");
    setSelectedDrawingNumber(null);
    setIsDRWDropDownOpen(false);
    setIsSelectingItem(false);
    setSuccessMessage("");
    setViewMode('table');

    // Clear Redux state
    dispatch(clearAssemblyData());
  }, [reset, dispatch]);

  // Handle drawing number selection
  const handleDrawingNumberChange = useCallback(
    (newValue: any) => {
      if (newValue) {
        setIsSelectingItem(true);
        try {
          setSelectedDrawingNumber(newValue);
          setDrwDisplayText(newValue.drawingNumber || "");
          setValue("drawingNumberId", newValue.id || 0);
        } finally {
          setIsSelectingItem(false);
        }
      } else {
        setSelectedDrawingNumber(null);
        setValue("drawingNumberId", 0);
      }
    },
    [setValue]
  );

  // Handle tree node click to expand/collapse
  const handleTreeNodeClick = useCallback((row: any) => {
    console.log('Tree node clicked:', row);
    
    // You can add custom logic here for node interaction
    if (row.hasChildren) {
      // Toggle expansion state
      const updatedData = treeData.map(item => 
        item.id === row.id 
          ? { ...item, isExpanded: !item.isExpanded }
          : item
      );
      // Note: This would require state management to persist the expansion
      console.log('Toggling expansion for:', row.drawingNumber);
    }
    
    // Add any additional click functionality here
    // For example: show details modal, highlight related items, etc.
  }, [treeData]);

  return (
    
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
        p: 1,
        
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
      sx={{ 
          color: "primary.main",
          fontWeight: 600,
        mb: 1,
        }}
      >
        View SOP
            </Typography>


      <Container maxWidth="xl" sx={{ py: { xs: 2, md:1} }}>
        {/* Success/Error Messages */}
        <Fade in={!!(successMessage || error)}>
          <Box sx={{ mb: 2 }}>
            {successMessage && (
              <Alert
                severity={
                  successMessage.includes("Error") ||
                  successMessage.includes("Please fill")
                    ? "error"
                    : "success"
                }
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    fontSize: { xs: "0.875rem", md: "1rem" },
                  },
                }}
                onClose={() => setSuccessMessage("")}
              >
                {successMessage}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    fontSize: { xs: "0.875rem", md: "1rem" },
                  },
                }}
                onClose={() => dispatch(clearError())}
              >
                {error}
              </Alert>
            )}
          </Box>
        </Fade>
        {/* Search Filters Card */}
        <Card
          elevation={0}
          sx={{
            mb: 2,
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            overflow: "hidden",
            background: "white",
          }}
        >
          <Accordion
            expanded={showFilters || !isMobile}
            onChange={() => isMobile && setShowFilters(!showFilters)}
            sx={{
              boxShadow: "none",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={isMobile ? <ExpandMoreIcon /> : null}
              sx={{
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                py: { xs: 1, md: 1.5 },
                minHeight: { xs: 40, md: 30 },
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                  margin: "8px 0",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <FilterIcon sx={{ color: "#A8005A", fontSize: 20 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "0.9rem", md: "1rem" },
                    fontWeight: 500,
                    color: "#1e293b",
                    
                  }}
                >
                  Search Filters
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={1} alignItems="end">
                {/* Production Series */}
                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name="prodSeriesId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Production Series *</InputLabel>
                        <Select
                          {...field}
                          label="Production Series *"
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#d1d5db",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#A8005A",
                            },
                          }}
                        >
                          <MenuItem value={0}>
                            <em>Select Production Series</em>
                          </MenuItem>
                          {productionSeries.map((series: any) => (
                            <MenuItem key={series.id} value={series.id}>
                              {series.productionSeries}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Drawing Number */}
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={drawingNumbers || []}
                    getOptionLabel={(option: any) => option.drawingNumber || ""}
                    value={selectedDrawingNumber}
                    onChange={(_, newValue) =>
                      handleDrawingNumberChange(newValue)
                    }
                    inputValue={drwDisplayText}
                    onInputChange={(_, newInputValue) => {
                      if (!isSelectingItem) {
                        setDrwDisplayText(newInputValue);
                      }
                    }}
                    open={isDRWDropDownOpen}
                    onOpen={() => setIsDRWDropDownOpen(true)}
                    onClose={() => setIsDRWDropDownOpen(false)}
                    loading={commonLoading}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Drawing Number *"
                        placeholder="Type 3+ characters..."
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#A8005A",
                          },
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {commonLoading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option: any) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
                          <Typography variant="body1">
                            {option.drawingNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.nomenclature}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText={
                      drwDisplayText.length < 3
                        ? "Type 3+ characters"
                        : "No drawing numbers found"
                    }
                  />
                </Grid>

                {/* Assembly ID Number */}
                <Grid item xs={12} sm={6} md={2}>
                  <Controller
                    name="assemblyNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Assembly ID Number"
                        placeholder="Enter assembly ID..."
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#A8005A",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: { xs: "center", md: "flex-start" },
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ResetIcon />}
                      onClick={executeReset}
                      size="small"
                      sx={{
                        minWidth: { xs: 80, md: 90 },
                        py: 0.75,
                        px: 1.5,
                        borderColor: "#6b7280",
                        color: "#6b7280",
                        fontSize: "0.75rem",
                        "&:hover": {
                          borderColor: "#374151",
                          backgroundColor: "#f9fafb",
                          color: "#374151",
                        },
                      }}
                    >
                      Reset
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={executeSearch}
                      disabled={isLoading}
                      size="small"
                      sx={{
                        minWidth: { xs: 90, md: 100 },
                        py: 0.75,
                        px: 1.5,
                        fontSize: "0.75rem",
                        backgroundColor: "#2563eb",
                        "&:hover": { backgroundColor: "#1d4ed8" },
                        boxShadow: "0 1px 4px rgba(37, 99, 235, 0.3)",
                      }}
                    >
                      {isLoading ? "Searching..." : "Search"}
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<ExportIcon />}
                      onClick={executeExport}
                      disabled={
                        isExporting ||
                        !assemblyData ||
                        assemblyData.length === 0
                      }
                      size="small"
                      sx={{
                        minWidth: { xs: 90, md: 100 },
                        py: 0.75,
                        px: 1.5,
                        fontSize: "0.75rem",
                        backgroundColor: "#A8005A",
                        "&:hover": { backgroundColor: "#920050" },
                        boxShadow: "0 1px 4px rgba(168, 0, 90, 0.3)",
                      }}
                    >
                      {isExporting ? "Exporting..." : "Export"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Results Section */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            background: "white",
          }}
        >
          <CardHeader
            avatar={<TableIcon sx={{ color: "#A8005A" }} />}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1rem", md: "1.125rem" },
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Assembly Data Results
                </Typography>
                {assemblyData && assemblyData.length > 0 && (
                  <>
                    <Chip
                      label={`${assemblyData.length} records`}
                      size="small"
                      sx={{
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontWeight: 600,
                      }}
                    />
                    {viewMode === 'tree' && (
                      <Chip
                        label={`${treeData.filter(item => item.level === 0).length} assemblies`}
                        size="small"
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
            }
            action={
              assemblyData && assemblyData.length > 0 && (
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: { xs: 1, md: 1.5 },
                      py: 0.5,
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      color: '#6b7280',
                      fontWeight: 500,
                      minWidth: { xs: 60, md: 70 },
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        borderColor: '#A8005A',
                        color: '#A8005A',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#A8005A',
                        color: 'white',
                        borderColor: '#A8005A',
                        '&:hover': {
                          backgroundColor: '#920050',
                          borderColor: '#920050',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="table">
                    <Tooltip title="Table View - Flat list of all items">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ListIcon sx={{ fontSize: { xs: 14, md: 16 } }} />
                        <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                          Table
                        </Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="tree">
                    <Tooltip title="Tree View - Hierarchical structure with expand/collapse">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TreeIcon sx={{ fontSize: { xs: 14, md: 16 } }} />
                        <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                          Tree
                        </Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              )
            }
            sx={{
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              py: { xs: 1.5, md: 2 },
            }}
          />

          <Box sx={{ position: "relative" }}>
            {viewMode === 'table' ? (
              <TableContainer
                sx={{
                  maxHeight: { xs: 350, sm: 450, md: 500, lg: 550 },
                  overflow: 'auto',
                  "&::-webkit-scrollbar": {
                    width: 6,
                    height: 6,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "#f1f5f9",
                    borderRadius: 3,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#cbd5e1",
                    borderRadius: 3,
                    "&:hover": {
                      backgroundColor: "#94a3b8",
                    },
                  },
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 50, md: 60 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        Sr No.
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 100, md: 120 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        Drawing Number
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 80, md: 100 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        Nomenclature
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 60, md: 80 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        ID No
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 50, md: 70 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        Qty
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 80, md: 100 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        IR Number
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 80, md: 100 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        MSN Number
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 60, md: 80 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        Remarks
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: { xs: "0.7rem", md: "0.8rem" },
                          py: { xs: 0.5, md: 1 },
                          px: { xs: 0.5, md: 1 },
                          minWidth: { xs: 80, md: 100 },
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        Assembly No
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assemblyData && assemblyData.length > 0 ? (
                      assemblyData.map((item, index) => (
                        <TableRow
                          key={item.serialNumber || index}
                          sx={{
                            backgroundColor:
                              index % 2 === 1 ? "#f8fafc" : "white",
                            "&:hover": {
                              backgroundColor: "#f1f5f9",
                            },
                            transition: "background-color 0.2s ease",
                            height: { xs: 36, md: 42 },
                          }}
                        >
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {item.serialNumber}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#1e293b",
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.drawingNumber}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#1e293b",
                            }}
                          >
                            {item.nomenclature}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#1e293b",
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.idNumber}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              fontWeight: 600,
                              color: "#059669",
                            }}
                          >
                            {item.quantity}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#1e293b",
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.irNumber}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#1e293b",
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.msnNumber}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#6b7280",
                              fontStyle: !item.remarks ? 'italic' : 'normal',
                            }}
                          >
                            {item.remarks || "-"}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              py: { xs: 0.5, md: 1 },
                              px: { xs: 0.5, md: 1 },
                              color: "#1e293b",
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.assemblyNumber}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          align="center"
                          sx={{
                            py: { xs: 3, md: 4 },
                            color: "#6b7280",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <TableIcon sx={{ fontSize: 40, color: "#d1d5db" }} />
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "0.8rem", md: "0.9rem" },
                                fontWeight: 500,
                              }}
                            >
                              {isLoading
                                ? "Loading assembly data..."
                                : "No data available. Please perform a search to view results."}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // Tree View
              <Box sx={{ 
                maxHeight: { xs: 350, sm: 450, md: 500, lg: 550 },
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                borderRadius: 1,
              }}>
                {assemblyData && assemblyData.length > 0 ? (
                  <TreeTable
                    data={treeData}
                    columns={treeColumns}
                    idField="id"
                    parentIdField="parentId"
                    height={isMobile ? 350 : isTablet ? 450 : 500}
                    rowHeight={isMobile ? 40 : 44}
                    enableVirtualization={assemblyData.length > 50}
                    onRowClick={(row) => {
                      handleTreeNodeClick(row);
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1.5,
                      py: { xs: 3, md: 4 },
                      color: "#6b7280",
                    }}
                  >
                    <TreeIcon sx={{ fontSize: 40, color: "#d1d5db" }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.8rem", md: "0.9rem" },
                        fontWeight: 500,
                        textAlign: 'center',
                      }}
                    >
                      {isLoading
                        ? "Loading tree structure..."
                        : "No hierarchical data available. Please perform a search to view tree structure."}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Card>
      </Container>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: theme.zIndex.modal + 1,
          backdropFilter: "blur(4px)",
        }}
        open={isExporting}
      >
        <Card
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            minWidth: { xs: 280, md: 350 },
            maxWidth: 400,
            mx: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <CircularProgress
              size={60}
              sx={{
                color: "#A8005A",
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", md: "1.125rem" },
                  fontWeight: 600,
                  mb: 1,
                  color: "#1e293b",
                }}
              >
                Exporting SOP Data
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: { xs: "0.875rem", md: "0.9rem" },
                }}
              >
                Please wait while we prepare your export...
              </Typography>
            </Box>
          </Box>
        </Card>
      </Backdrop>
    </Box>
  );
};

export default ViewSOP;
