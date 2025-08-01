import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import {
  Box,
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
  Autocomplete,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import type { RootState, AppDispatch } from "../../store/store";
import type { DrawingNumber, FormData as BaseFormData } from "../../types";
import {
  getAllDocumentTypes,
  getAllProductionSeries,
} from "../../store/slices/commonSlice";
import debounce from "lodash/debounce";
import api from "../../services/api";
import { generateIRMSN, clearGeneratedNumber } from "../../store/slices/irmsnSlice";

// Create typed versions of the hooks
const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Extend the base FormData interface with additional fields
interface FormData extends BaseFormData {
  ProdSeriesId?: number;
  DrawingNumberId?: number;
  ComponentTypeId?: number;
  NomenclatureId?: number;
  GeneratedBy?: string;
}

export default function GenerateIRMSN() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const [localLoading, setLocalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("N/A");

  // Update selectors
  const { loading: isLoading, generatedNumber, error } = useSelector((state: RootState) => state.irmsn);
  const documentTypes = useSelector((state: RootState) => state.common.documentTypes);
  const productionSeries = useSelector((state: RootState) => state.common.productionSeries);
  const currentAuthUser = useSelector((state: RootState) => state.auth.user);

  // Local state
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<DrawingNumber[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load initial data and set current user
  useEffect(() => {
    dispatch(getAllDocumentTypes());
    dispatch(getAllProductionSeries());
  }, [dispatch]);

  // Update current user when auth state changes
  useEffect(() => {
    if (currentAuthUser?.username) {
      setCurrentUser(currentAuthUser.username);
    } else {
      setCurrentUser("N/A");
    }
  }, [currentAuthUser]);

  // Debounced search function with local state
  const debouncedSearch = useMemo(
    () =>
      debounce(async (search: string) => {
        if (search.length < 3) {
          setSearchResults([]);
          return;
        }
        setLocalLoading(true);
        try {
          const response = await api.get("/api/Common/GetAllDrawingNumber", {
            params: {
              ComponentType: "",
              search,
              pageSize: 10, // Limit results for better performance
            },
          });
          setSearchResults(response.data);
        } catch (error) {
          console.error("Error fetching drawing numbers:", error);
          setSearchResults([]);
        } finally {
          setLocalLoading(false);
        }
      }, 300), // Reduced debounce time for better responsiveness
    []
  );

  // Calculate quantity from ID range
  const calculateQuantityFromRange = (range: string): number => {
    let quantity = 0;
    const parts = range.split(",").map((part) => part.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        quantity += end - start + 1;
      } else {
        quantity += 1;
      }
    }

    return quantity;
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      documentType: "IR",
      quantity: 1,
    },
  });

  const documentType = watch("documentType");

  // Update stages when document type changes
  useEffect(() => {
    const newStages = documentType === "IR" ? IRStages : MSNStages;
    setStages(newStages);
    
    // Only reset stage if current stage doesn't exist in new stage list
    // This preserves the stage value when switching between document types
    const currentStage = watch("stage");
    if (currentStage && !newStages.includes(currentStage)) {
      setValue("stage", "");
    }
    // If current stage exists in new stage list, keep it as is
  }, [documentType, setValue]);

  // Watch for ID range changes
  const idRange = watch("idRange");
  useEffect(() => {
    if (idRange && /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/.test(idRange)) {
      const quantity = calculateQuantityFromRange(idRange);
      setValue("quantity", quantity);
    }
  }, [idRange, setValue]);

  const handleProductionSeriesChange = (event: any) => {
    const selectedSeries = productionSeries.find(
      (series) => series.productionSeries === event.target.value
    );
    if (selectedSeries) {
      setValue("productionSeries", selectedSeries.productionSeries);
      setValue("ProdSeriesId", selectedSeries.id);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Add user context like C# controller does automatically
      const userEnhancedData = {
        ...data,
        // Add user context from auth state (like C# adds from JWT)
        createdBy: currentAuthUser?.id || currentAuthUser?.userid ? 
          Number(currentAuthUser.id || currentAuthUser.userid) : undefined,
        departmentId: currentAuthUser?.deptid ? 
          Number(currentAuthUser.deptid) : undefined,
        departmentName: currentAuthUser?.department || '',
        // Add drawing number related fields if selected
        drawingNumberId: selectedDrawing?.id || undefined,
        nomenclatureId: selectedDrawing?.nomenclatureId || undefined,
        componentTypeId: selectedDrawing?.componentTypeId || undefined,
        // 🔧 CRITICAL FIX: Map idRange to the correct API field name
        idNumberRange: data.idRange || "", // Map form idRange to API idNumberRange
        // Also send idRange for backwards compatibility
        idRange: data.idRange || "",
      };
      
      console.log('Generation payload with user context:', userEnhancedData);
      const result = await dispatch(generateIRMSN(userEnhancedData)).unwrap();
      
      // After successful generation, test if the record is immediately searchable
      if (result && (result.irNumber || result.msnNumber)) {
        console.log('Successfully generated number:', result);
        
        // Test if the newly generated number can be found in search
        const generatedNumberValue = result.irNumber || result.msnNumber;
        const documentTypeValue = result.irNumber ? 'IR' : 'MSN';
        
        console.log(`Testing search for newly generated ${documentTypeValue} number:`, generatedNumberValue);
        
        // Add a delay then test search
        setTimeout(async () => {
          try {
            const searchEndpoint = documentTypeValue === 'IR' 
              ? '/api/reports/GetAllIRNumber' 
              : '/api/reports/GetAllMSNNumber';
              
            const searchResponse = await api.get(searchEndpoint, {
              params: {
                query: generatedNumberValue,
                userId: currentAuthUser?.id || currentAuthUser?.userid ? 
                  Number(currentAuthUser.id || currentAuthUser.userid) : undefined,
                departmentId: currentAuthUser?.deptid ? 
                  Number(currentAuthUser.deptid) : undefined
              }
            });
            
            console.log(`Search test result for ${generatedNumberValue}:`, searchResponse.data);
            
                         if (searchResponse.data && searchResponse.data.length > 0) {
               console.log('✅ Newly generated number is searchable!');
               // Show success message to user
               const successMsg = `${documentTypeValue} number ${generatedNumberValue} has been generated and is now searchable!`;
               console.log(successMsg);
             } else {
               console.log('❌ Newly generated number not found in search - there may be a timing or parameter issue');
               console.log('💡 Note: It may take a few moments for the database to sync. Try refreshing the Search/Update page.');
             }
          } catch (error) {
            console.error('❌ Error testing search for newly generated number:', error);
          }
        }, 2000); // 2 second delay to allow database commit
      }
    } catch (error) {
      console.error("Error generating number:", error);
    }
  };

  const handleCopy = async () => {
    if (!generatedNumber) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback method for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = generatedNumber;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Show user-friendly error message
      alert(`Failed to copy automatically. Please manually copy: ${generatedNumber}`);
    }
  };

  const handleReset = () => {
    // Reset form to default values
    reset({
      documentType: "IR",
      quantity: 1,
      drawingNumber: "",
      productionSeries: "",
      nomenclature: "",
      idRange: "",
      projectNumber: "",
      poNumber: "",
      stage: "",
      supplier: "",
      remark: "",
    });
    
    // Clear generated number from store
    dispatch(clearGeneratedNumber());
    
    // Clear local state
    setSearchResults([]);
    setSelectedDrawing(null);
    setSearchTerm("");
    setCopied(false);
    
    // Reset stages to IR stages (default)
    setStages(IRStages);
  };

  // Stage options based on document type
  const IRStages = [
    "Before Testing",
    "After Testing",
    "Final",
    "T04 Cavity",
    "Intermediate",
    "Flower Test",
    "WPS",
    "Other",
  ];

  const MSNStages = [
    "Testing",
    "Final",
    "QT",
    "Intermediate",
    "Precheck & Final",
    "Other",
  ];

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 1 },
        maxWidth: "100%",
        mx: "auto",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.25rem' }
        }}
      >
        Generate IR/MSN Number
      </Typography>

      {/* Main Form */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Row 1: Drawing Number, Document Type, Production Series */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="drawingNumber"
                  control={control}
                  rules={{ required: "Drawing number is required" }}
                  render={({ field: { onChange, ...field } }) => (
                    <Autocomplete
                      {...field}
                      options={searchResults}
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option.drawingNumber;
                      }}
                      value={selectedDrawing}
                      loading={localLoading}
                      size="small"
                      onInputChange={(_, value) => {
                        setSearchTerm(value);
                        if (value.length >= 3) {
                          debouncedSearch(value);
                        }
                      }}
                      onChange={(_, value) => {
                        setSelectedDrawing(value);
                        onChange(value ? value.drawingNumber : "");
                        if (value) {
                          setValue("nomenclature", value.nomenclature || "");
                          // Set hidden form fields like C# version does
                          setValue("DrawingNumberId", value.id);
                          setValue("NomenclatureId", value.nomenclatureId);
                          setValue("ComponentTypeId", value.componentTypeId);
                        }
                      }}
                      isOptionEqualToValue={(option, value) =>
                        option.drawingNumber ===
                        (typeof value === "string"
                          ? value
                          : value.drawingNumber)
                      }
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              py: 1,
                            }}
                          >
                            <Typography variant="body1">
                              {option.drawingNumber}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.nomenclature} | {option.componentType}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Drawing Number *"
                          error={!!errors.drawingNumber}
                          helperText={errors.drawingNumber?.message}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {localLoading ? (
                                  <CircularProgress color="inherit" size={16} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="documentType"
                  control={control}
                  rules={{ required: "Document type is required" }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.documentType}
                      size="small"
                    >
                      <InputLabel>Document Type *</InputLabel>
                      <Select {...field} label="Document Type *">
                        {documentTypes.map((type) => (
                          <MenuItem key={type.id} value={type.documentType}>
                            {type.documentType}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.documentType && (
                        <FormHelperText>
                          {errors.documentType.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="productionSeries"
                  control={control}
                  rules={{ required: "Production series is required" }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.productionSeries}
                      size="small"
                    >
                      <InputLabel>Prod Series *</InputLabel>
                      <Select
                        {...field}
                        label="Prod Series *"
                        onChange={(e) => {
                          field.onChange(e);
                          handleProductionSeriesChange(e);
                        }}
                      >
                        {productionSeries.map((series) => (
                          <MenuItem
                            key={series.id}
                            value={series.productionSeries}
                          >
                            {series.productionSeries}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.productionSeries && (
                        <FormHelperText>
                          {errors.productionSeries.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            {/* Row 2: Nomenclature, ID Range, Quantity */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="nomenclature"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nomenclature"
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ bgcolor: "grey.50" }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="idRange"
                  control={control}
                  rules={{ required: "ID Nos is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ID Nos *"
                      fullWidth
                      size="small"
                      error={!!errors.idRange}
                      helperText={errors.idRange?.message}
                      placeholder="e.g., 1,2,3-5"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="quantity"
                  control={control}
                  rules={{ required: "Quantity is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity *"
                      type="number"
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ bgcolor: "grey.50" }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Row 3: Project Number, PO Number, Stage */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="projectNumber"
                  control={control}
                  rules={{ required: "Project number is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Project Number *"
                      fullWidth
                      size="small"
                      error={!!errors.projectNumber}
                      helperText={errors.projectNumber?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="poNumber"
                  control={control}
                  rules={{ required: "PO number is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="PO Number *"
                      fullWidth
                      size="small"
                      error={!!errors.poNumber}
                      helperText={errors.poNumber?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Stage</InputLabel>
                      <Select {...field} label="Stage">
                        {stages.map((stage) => (
                          <MenuItem key={stage} value={stage}>
                            {stage}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            {/* Row 4: Generated By, Supplier, Remark */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Generated By"
                  value={currentUser}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: "grey.50" }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="supplier"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Supplier"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="remark"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Remark"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Generated IR/MSN Number Display */}
            {generatedNumber && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "primary.50",
                  border: "1px solid",
                  borderColor: "primary.200",
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: "primary.main" }}
                  >
                    Generated IR/MSN Number:
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      p: 1.5,
                      backgroundColor: "white",
                      border: "1px solid",
                      borderColor: "grey.300",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{generatedNumber}</span>
                    <Tooltip title={copied ? "Copied!" : "Copy"}>
                      <IconButton
                        onClick={handleCopy}
                        size="small"
                        sx={{
                          color: copied ? "success.main" : "primary.main",
                        }}
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
                
                {/* Help text for user */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    display: "block", 
                    color: "text.secondary",
                    fontStyle: "italic"
                  }}
                >
                  💡 Your number has been generated! It should now be searchable in the Search/Update page. 
                  If you don't see it immediately, wait a moment and try again.
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Button
                type="button"
                variant="outlined"
                size="medium"
                onClick={handleReset}
                startIcon={<RefreshIcon />}
                sx={{ minWidth: 120, py: 1.5 ,height: 40}}
              >
                Reset
              </Button>

              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AddIcon />
                  )
                }
                sx={{ minWidth: 200, py: 1.5,height: 40 }}
              >
                {isLoading ? "Generating..." : "Generate IR/MSN"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
