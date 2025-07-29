import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import debounce from "lodash/debounce";

interface IRMSNItem {
  id: number;
  irNumber?: string;
  msnNumber?: string;
  drawingNumberId: number | null;
  productionSeriesName: string | null;
  stage: string;
  productionOrderNumber: string | null;
  nomenclatureId: number | null;
  componentTypeId: number | null;
  quantity: number;
  remark: string | null;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number | null;
  modifiedDate: string | null;
  projectNumber: string;
  supplier: string | null;
  isActive: boolean | null;
  drawingNumberIdName: string | null;
  nomenclature: string;
  componentType: string | null;
  prodSeriesId: number;
  idNumberStart: number | null;
  idNumberEnd: number | null;
  userName: string | null;
  departmentId: number;
  idNumberRange: string | null;
  sequenceNo: number;
  generatedBy: string | null;
}

interface SearchFormData {
  documentType: "IR" | "MSN";
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get current user from auth state
  const currentUser = useSelector((state: any) => state.auth.user);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IRMSNItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [numbers, setNumbers] = useState<IRMSNItem[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>("");

  // Search form state
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    documentType: "IR",
    searchTerm: "",
  });

  // Update form state
  const [updateForm, setUpdateForm] = useState<UpdateFormData>({
    stage: "",
    quantity: 0,
    idNumberRange: "",
    supplier: "",
    remark: "",
  });

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

  const stages = searchForm.documentType === "IR" ? IRStages : MSNStages;

  // Fetch numbers based on document type
  const fetchNumbers = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) return;

        setIsLoading(true);
        try {
          const endpoint =
            searchForm.documentType === "IR"
              ? "/api/reports/GetAllIRNumber"
              : "/api/reports/GetAllMSNNumber";

          // Try both id and userid fields from token
          const userIdFromToken = currentUser?.id || currentUser?.userid;
          const deptIdFromToken = currentUser?.deptid;

          const userId =
            userIdFromToken && !isNaN(Number(userIdFromToken))
              ? Number(userIdFromToken)
              : undefined;
          const departmentId =
            deptIdFromToken && !isNaN(Number(deptIdFromToken))
              ? Number(deptIdFromToken)
              : undefined;

          const response = await api.get(endpoint, {
            params: {
              query,
              userId,
              departmentId,
            },
          });

          setNumbers(response.data);
        } catch (error) {
          // Handle error silently or show user-friendly message
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [searchForm.documentType, currentUser?.userid, currentUser?.deptid]
  );

  // Handle number selection
  const handleNumberSelect = (selectedNumber: string) => {
    if (!selectedNumber) {
      setSelectedItem(null);
      return;
    }

    const selectedData = numbers.find(
      (item) => (item.irNumber || item.msnNumber) === selectedNumber
    );

    if (selectedData) {
      // Handle ID Number Range - check all possible field names
      let idNumberRange = "";

      // Priority 1: Direct idNumberRange field
      if (selectedData.idNumberRange && selectedData.idNumberRange.trim()) {
        idNumberRange = selectedData.idNumberRange.trim();
      }
      // Priority 2: Construct from start/end numbers
      else if (
        selectedData.idNumberStart !== null &&
        selectedData.idNumberStart !== undefined &&
        selectedData.idNumberEnd !== null &&
        selectedData.idNumberEnd !== undefined
      ) {
        if (selectedData.idNumberStart === selectedData.idNumberEnd) {
          idNumberRange = selectedData.idNumberStart.toString();
        } else {
          idNumberRange = `${selectedData.idNumberStart}-${selectedData.idNumberEnd}`;
        }
      }
      // Priority 3: Create default range based on quantity if no ID data exists
      else if (selectedData.quantity && selectedData.quantity > 0) {
        // If we have quantity but no ID range, create a reasonable default
        if (selectedData.quantity === 1) {
          idNumberRange = "1";
        } else {
          idNumberRange = `1-${selectedData.quantity}`;
        }
      }

      const formData = {
        stage: selectedData.stage || "",
        quantity: selectedData.quantity || 0,
        idNumberRange: idNumberRange,
        supplier: selectedData.supplier || "",
        remark: selectedData.remark || "",
      };

      setSelectedItem(selectedData);
      setUpdateForm(formData);
    }
  };

  // Update function with immediate UI refresh
  const onUpdate = async () => {
    if (!selectedItem) return;

    setIsLoading(true);
    try {
      const endpoint =
        searchForm.documentType === "IR"
          ? "/api/reports/UpdateIRNumber"
          : "/api/reports/UpdateMSNNumber";

      const payload = {
        [searchForm.documentType === "IR" ? "irNumber" : "msnNumber"]:
          searchForm.documentType === "IR"
            ? selectedItem.irNumber
            : selectedItem.msnNumber,
        idNumberRange: updateForm.idNumberRange,
        quantity: updateForm.quantity,
        remark: updateForm.remark || null,
        stage: updateForm.stage,
        supplier: updateForm.supplier || null,
        modifiedBy: selectedItem.createdBy,
      };

      await api.post(endpoint, payload);

      // Create updated item with new values
      const updatedItem: IRMSNItem = {
        ...selectedItem,
        stage: updateForm.stage,
        quantity: updateForm.quantity,
        idNumberRange: updateForm.idNumberRange,
        supplier: updateForm.supplier || null,
        remark: updateForm.remark || null,
        modifiedDate: new Date().toISOString(), // Add current timestamp
      };

      // Update the numbers array immediately
      setNumbers((prevNumbers) =>
        prevNumbers.map((item) =>
          item.id === selectedItem.id ? updatedItem : item
        )
      );

      // Update the selected item immediately to reflect changes in the UI
      setSelectedItem(updatedItem);

      setSuccessMessage(
        `${searchForm.documentType} Number updated successfully!`
      );
      setEditDialogOpen(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setSuccessMessage("Failed to update. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Add the calculateQuantity function
  const calculateQuantity = (range: string) => {
    if (!range) return 0;

    const parts = range.split(",").map((part) => part.trim());
    let total = 0;

    parts.forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          total += end - start + 1;
        }
      } else if (!isNaN(Number(part))) {
        total += 1;
      }
    });

    return total;
  };



  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 1 },
        maxWidth: "100%",
        mx: "auto",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.25rem" },
        }}
      >
        Search/Update IR/MSN
      </Typography>

      {successMessage && (
        <Alert
          severity={successMessage.includes("Failed") ? "error" : "success"}
          sx={{ mb: 1.5 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {/* Search Form */}
      <Card elevation={2} sx={{ mb: 1.5 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            {/* Document Type */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel
                  component="legend"
                  sx={{
                    mb: 0.5,
                    color: "text.primary",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Document Type *
                </FormLabel>
                <RadioGroup
                  value={searchForm.documentType}
                  onChange={(e) => {
                    setSearchForm((prev) => ({
                      ...prev,
                      documentType: e.target.value as "IR" | "MSN",
                    }));
                    setSelectedItem(null);
                    setNumbers([]);
                    setSelectedNumber("");
                  }}
                  row
                >
                  <FormControlLabel
                    value="IR"
                    control={<Radio size="small" />}
                    label="IR Number"
                    sx={{
                      "& .MuiFormControlLabel-label": { fontSize: "0.875rem" },
                    }}
                  />
                  <FormControlLabel
                    value="MSN"
                    control={<Radio size="small" />}
                    label="MSN Number"
                    sx={{
                      "& .MuiFormControlLabel-label": { fontSize: "0.875rem" },
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Number Selection */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={numbers}
                loading={isLoading}
                size="small"
                value={
                  numbers.find(
                    (n) => (n.irNumber || n.msnNumber) === selectedNumber
                  ) || null
                }
                getOptionLabel={(option) =>
                  option.irNumber || option.msnNumber || ""
                }
                onInputChange={(_, value) => {
                  if (value) fetchNumbers(value);
                }}
                onChange={(_, value) => {
                  const number = value?.irNumber || value?.msnNumber || "";
                  setSelectedNumber(number);
                  if (value) {
                    handleNumberSelect(number);
                  } else {
                    setUpdateForm({
                      stage: "",
                      quantity: 0,
                      idNumberRange: "",
                      supplier: "",
                      remark: "",
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`IR/MSN *`}
                    placeholder={`Select ${searchForm.documentType} Number`}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Reset Button */}
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchForm({
                    documentType: "IR",
                    searchTerm: "",
                  });
                  setSelectedItem(null);
                  setNumbers([]);
                  setSelectedNumber("");
                  setUpdateForm({
                    stage: "",
                    quantity: 0,
                    idNumberRange: "",
                    supplier: "",
                    remark: "",
                  });
                  setSuccessMessage("");
                }}
                sx={{ width: "100%", height: 40 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search Results */}
      {selectedItem && (
        <Card
          elevation={2}
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CardContent
            sx={{ p: { xs: 1.5, md: 2 }, flex: 1, overflow: "auto" }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1.5}
            >
              <Typography variant="h6" color="primary" fontWeight="bold">
                {selectedItem.irNumber || selectedItem.msnNumber}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setEditDialogOpen(true);
                  }}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: "primary.main",
                    color: "white",
                  }}
                >
                  Edit
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={1.5}>
              {/* First Row */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Drawing Number"
                  value={selectedItem.drawingNumberIdName}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Document Type"
                  value={searchForm.documentType}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Prod Series"
                  value={selectedItem.productionSeriesName}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>

              {/* Second Row */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Nomenclature"
                  value={selectedItem.nomenclature || ""}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: { fontSize: "0.875rem" },
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ID Nos"
                  value={
                    selectedItem.idNumberRange ||
                    (selectedItem.idNumberStart && selectedItem.idNumberEnd
                      ? selectedItem.idNumberStart === selectedItem.idNumberEnd
                        ? selectedItem.idNumberStart.toString()
                        : `${selectedItem.idNumberStart}-${selectedItem.idNumberEnd}`
                      : "")
                  }
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity"
                  value={selectedItem.quantity}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>

              {/* Third Row */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Project Number"
                  value={selectedItem.projectNumber}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="PO Number"
                  value={selectedItem.productionOrderNumber}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Stage"
                  value={selectedItem.stage || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>

              {/* Fourth Row */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Generated By"
                  value={selectedItem.generatedBy || "N/A"}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Supplier"
                  value={selectedItem.supplier || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Remark"
                  value={selectedItem.remark || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "grey.50",
                    },
                  }}
                />
              </Grid>

              {/* Generated IR/MSN Number Display */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: "primary.50",
                    border: "1px solid",
                    borderColor: "primary.200",
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      IR/MSN Number
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        p: 1,
                        backgroundColor: "white",
                        border: "1px solid",
                        borderColor: "grey.300",
                        borderRadius: 1,
                        fontFamily: "monospace",
                        fontSize: "0.95rem",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedItem.irNumber || selectedItem.msnNumber}
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && !selectedItem && searchForm.searchTerm && (
        <Card
          elevation={0}
          sx={{
            p: 2,
            textAlign: "center",
            bgcolor: "grey.50",
            border: "2px dashed",
            borderColor: "grey.300",
          }}
        >
          <CardContent>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              No results found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No {searchForm.documentType} numbers found matching your search
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchForm.searchTerm && !selectedItem && (
        <Card
          elevation={0}
          sx={{
            p: 2,
            textAlign: "center",
            bgcolor: "grey.50",
            border: "2px dashed",
            borderColor: "grey.300",
          }}
        >
          <CardContent>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Search IR/MSN Numbers
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Enter search criteria to find {searchForm.documentType} numbers
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
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
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Stage */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Stage *</InputLabel>
                <Select
                  value={updateForm.stage}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      stage: e.target.value as string,
                    }))
                  }
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

            {/* Supplier */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supplier"
                fullWidth
                size="small"
                value={updateForm.supplier}
                onChange={(e) =>
                  setUpdateForm((prev) => ({
                    ...prev,
                    supplier: e.target.value,
                  }))
                }
              />
            </Grid>

            {/* ID Number Range */}
            <Grid item xs={12} sm={8}>
              <TextField
                label="ID Number Range *"
                fullWidth
                size="small"
                value={updateForm.idNumberRange}
                onChange={(e) => {
                  const range = e.target.value;
                  const calculatedQuantity = calculateQuantity(range);
                  console.log('ID Range changed:', range, 'Calculated quantity:', calculatedQuantity);
                  setUpdateForm((prev) => ({
                    ...prev,
                    idNumberRange: range,
                    quantity: calculatedQuantity,
                  }));
                }}
                helperText="e.g., 1-100 or 1,2,3"
                placeholder="Enter ID number range"
              />
            </Grid>

            {/* Quantity (Read-only) */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Quantity"
                fullWidth
                size="small"
                value={updateForm.quantity}
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiInputBase-input": {
                    backgroundColor: "grey.50",
                  },
                }}
                helperText={`Current quantity: ${updateForm.quantity}`}
              />
            </Grid>

            {/* Remark */}
            <Grid item xs={12}>
              <TextField
                label="Remark"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={updateForm.remark}
                onChange={(e) =>
                  setUpdateForm((prev) => ({ ...prev, remark: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={isLoading}
            variant="outlined"
            size="medium"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Reset form to original values
              if (selectedItem) {
                let idNumberRange = "";
                if (selectedItem.idNumberRange && selectedItem.idNumberRange.trim()) {
                  idNumberRange = selectedItem.idNumberRange.trim();
                } else if (
                  selectedItem.idNumberStart !== null &&
                  selectedItem.idNumberStart !== undefined &&
                  selectedItem.idNumberEnd !== null &&
                  selectedItem.idNumberEnd !== undefined
                ) {
                  if (selectedItem.idNumberStart === selectedItem.idNumberEnd) {
                    idNumberRange = selectedItem.idNumberStart.toString();
                  } else {
                    idNumberRange = `${selectedItem.idNumberStart}-${selectedItem.idNumberEnd}`;
                  }
                } else if (selectedItem.quantity && selectedItem.quantity > 0) {
                  if (selectedItem.quantity === 1) {
                    idNumberRange = "1";
                  } else {
                    idNumberRange = `1-${selectedItem.quantity}`;
                  }
                }

                setUpdateForm({
                  stage: selectedItem.stage || "",
                  quantity: selectedItem.quantity || 0,
                  idNumberRange: idNumberRange,
                  supplier: selectedItem.supplier || "",
                  remark: selectedItem.remark || "",
                });
              }
            }}
            startIcon={<CancelIcon />}
            disabled={isLoading}
            variant="outlined"
            size="medium"
          >
            Reset
          </Button>
          <Button
            onClick={onUpdate}
            variant="contained"
            startIcon={
              isLoading ? <CircularProgress size={16} /> : <SaveIcon />
            }
            disabled={isLoading || !updateForm.stage}
            size="medium"
            sx={{
              backgroundColor: "purple",
              "&:hover": {
                backgroundColor: "darkpurple",
              },
            }}
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
