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

  // Update selectors
  const { loading: isLoading, generatedNumber, error } = useSelector((state: RootState) => state.irmsn);
  const documentTypes = useSelector((state: RootState) => state.common.documentTypes);
  const productionSeries = useSelector((state: RootState) => state.common.productionSeries);

  // Local state
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<DrawingNumber[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load initial data
  useEffect(() => {
    dispatch(getAllDocumentTypes());
    dispatch(getAllProductionSeries());
  }, [dispatch]);

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
    setStages(documentType === "IR" ? IRStages : MSNStages);
    setValue("stage", ""); // Reset stage when document type changes
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
      await dispatch(generateIRMSN(data)).unwrap();
    } catch (error) {
      console.error("Error generating number:", error);
    }
  };

  const handleCopy = () => {
    if (generatedNumber) {
      navigator.clipboard.writeText(generatedNumber);
    }
  };

  const handleReset = () => {
    reset();
    dispatch(clearGeneratedNumber());
    setSearchResults([]);
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
        width: "98%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // marginLeft: "-3%",
        mx: "auto",
        p: { xs: 2, md: 1 },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 2 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: "primary.main",
                fontWeight: 600,
                mb: 2,
              }}
            >
              Generate IR/MSN Number
            </Typography>

            <Grid container spacing={3}>
              {/* First Row */}
              <Grid item xs={12} md={3.5}>
                <Controller
                  name="documentType"
                  control={control}
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

              <Grid item xs={12} md={5}>
                <Controller
                  name="drawingNumber"
                  control={control}
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

              <Grid item xs={12} md={3}>
                <Controller
                  name="productionSeries"
                  control={control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.productionSeries}
                      size="small"
                    >
                      <InputLabel>Production Series *</InputLabel>
                      <Select
                        {...field}
                        label="Production Series *"
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

              {/* Second Row */}
              <Grid item xs={12} md={3.5}>
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.stage} size="small">
                      <InputLabel>Stage *</InputLabel>
                      <Select {...field} label="Stage *">
                        {stages.map((stage) => (
                          <MenuItem key={stage} value={stage}>
                            {stage}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.stage && (
                        <FormHelperText>{errors.stage.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <Controller
                  name="idRange"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ID Range *"
                      fullWidth
                      size="small"
                      error={!!errors.idRange}
                      helperText={errors.idRange?.message || "Format: 1,2,3-5"}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity"
                      type="number"
                      fullWidth
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Third Row */}
              <Grid item xs={12} md={3.5}>
                <Controller
                  name="poNumber"
                  control={control}
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

              <Grid item xs={12} md={5}>
                <Controller
                  name="projectNumber"
                  control={control}
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

              <Grid item xs={12} md={3}>
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

              {/* Fourth Row - Remarks */}
              <Grid item xs={11.5}>
                <Controller
                  name="remark"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Remark"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ mt: 1.8, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={localLoading}
            startIcon={
              localLoading ? (
                <RefreshIcon className="animate-spin" />
              ) : (
                <AddIcon />
              )
            }
            sx={{ minWidth: 120 }}
          >
            {localLoading ? "Generating..." : "Generate Number"}
          </Button>

          <Button
            type="button"
            variant="outlined"
            size="small"
            onClick={handleReset}
            startIcon={<RefreshIcon />}
            sx={{ minWidth: 100 }}
          >
            Reset
          </Button>
        </Box>

        {/* Generated Result */}
        {generatedNumber && (
          <Card
            sx={{
              mt: 1.8,
              width: "100%",
              bgcolor: "success.50",
              border: "1px solid",
              borderColor: "success.200",
              px: 1,
              py: 0.5,
            }}
          >
            <CardContent sx={{ py: 0.5, "&:last-child": { pb: 0.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckIcon color="success" fontSize="small" />
                <Typography
                  color="success.main"
                  fontSize="0.85rem"
                  fontWeight={500}
                >
                  Generated:
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  fontWeight="bold"
                  sx={{ flex: 1 }}
                >
                  {generatedNumber}
                </Typography>
                <Tooltip title="Copy">
                  <IconButton onClick={handleCopy} size="small">
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        )}
      </form>
    </Box>
  );
}
