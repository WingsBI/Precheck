import React, { useState, useMemo } from "react";
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
  stage: string | null;
  productionOrderNumber: string;
  nomenclatureId: number | null;
  componentTypeId: number | null;
  quantity: number;
  remark: string | null;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string | null;
  projectNumber: string;
  supplier: string | null;
  isActive: boolean;
  drawingNumberIdName: string;
  productionSeriesName: string;
  nomenclature: string | null;
  componentType: string;
  prodSeriesId: number | null;
  idNumberStart: number | null;
  idNumberEnd: number | null;
  userName: string | null;
  departmentId: number | null;
  idNumberRange: string;
  sequenceNo: number | null;
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

          const response = await api.get(endpoint, {
            params: { query },
          });
          setNumbers(response.data);
        } catch (error) {
          console.error("Error fetching numbers:", error);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [searchForm.documentType]
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
      setSelectedItem(selectedData);
      setUpdateForm({
        stage: selectedData.stage || "",
        quantity: selectedData.quantity,
        idNumberRange: selectedData.idNumberRange || "",
        supplier: selectedData.supplier || "",
        remark: selectedData.remark || "",
      });
    }
  };

  // Update function
  const onUpdate = async () => {
    if (!selectedItem) return;
    
    setIsLoading(true);
    try {
      const endpoint = searchForm.documentType === "IR"
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

      // Update the selected item with new values
      const updatedItem: IRMSNItem = {
        ...selectedItem,
        stage: updateForm.stage,
        quantity: updateForm.quantity,
        idNumberRange: updateForm.idNumberRange,
        supplier: updateForm.supplier || null,
        remark: updateForm.remark || null,
      };

      // Update both the numbers array and selected item
      setNumbers(prevNumbers => 
        prevNumbers.map(item => 
          item.id === selectedItem.id 
            ? updatedItem
            : item
        )
      );
      setSelectedItem(updatedItem);

      setSuccessMessage(
        `${searchForm.documentType} Number updated successfully!`
      );
      setEditDialogOpen(false);

      // Refresh the search results to show updated data
      if (selectedNumber) {
        handleNumberSelect(selectedNumber);
      }
    } catch (error) {
      console.error("Error updating:", error);
      setSuccessMessage("Failed to update. Please try again.");
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

  const ResultCard = ({ item }: { item: IRMSNItem }) => (
    <Card
      elevation={1}
      sx={{
        mb: 2,
        "&:hover": {
          elevation: 3,
          transform: "translateY(-2px)",
          transition: "all 0.2s ease-in-out",
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header with number and edit button */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" color="primary" fontWeight="bold">
              {item.irNumber || item.msnNumber}
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              variant="outlined"
              size="small"
            >
              Edit
            </Button>
          </Stack>

          {/* Details Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Drawing Number
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.drawingNumberIdName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Production Series
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.productionSeriesName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Nomenclature
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.nomenclature || ""}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                ID Range
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.idNumberRange}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Quantity
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.quantity}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Stage
              </Typography>
              <Chip
                label={item.stage}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                PO Number
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.productionOrderNumber}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Project Number
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.projectNumber}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="textSecondary">
                Created Date
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.createdDate}
              </Typography>
            </Grid>
          </Grid>

          {(item.supplier || item.remark) && (
            <Stack spacing={1}>
              {item.supplier && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Supplier
                  </Typography>
                  <Typography variant="body2">{item.supplier}</Typography>
                </Box>
              )}
              {item.remark && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Remark
                  </Typography>
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
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {/* Search Form */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Search {searchForm.documentType} Number
          </Typography>

          <Grid container spacing={3} alignItems="center">
            {/* Document Type */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ mb: 1, color: "text.primary" }}
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

            {/* Number Selection */}
            <Grid item xs={12} md={5}>
              <Autocomplete
                options={numbers}
                loading={isLoading}
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
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Select ${searchForm.documentType} Number`}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleNumberSelect(selectedNumber)}
                disabled={!selectedNumber || isLoading}
              >
                View Details
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search Results */}
      {selectedItem && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" color="primary">
                {selectedItem.irNumber || selectedItem.msnNumber}
              </Typography>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
                variant="outlined"
                size="small"
              >
                Edit
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {/* Read-only fields */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Drawing Number"
                  value={selectedItem.drawingNumberIdName}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Production Series"
                  value={selectedItem.productionSeriesName}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Nomenclature"
                  value={selectedItem.nomenclature || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Project Number"
                  value={selectedItem.projectNumber}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="PO Number"
                  value={selectedItem.productionOrderNumber}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Created Date"
                  value={selectedItem.createdDate}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Component Type"
                  value={selectedItem.componentType}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ID Range"
                  value={selectedItem.idNumberRange}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity"
                  value={selectedItem.quantity}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
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
            p: 4,
            textAlign: "center",
            bgcolor: "grey.50",
            border: "2px dashed",
            borderColor: "grey.300",
          }}
        >
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
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
            p: 4,
            textAlign: "center",
            bgcolor: "grey.50",
            border: "2px dashed",
            borderColor: "grey.300",
          }}
        >
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
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

            {/* ID Number Range */}
            <Grid item xs={12}>
              <TextField
                label="ID Number Range"
                fullWidth
                value={updateForm.idNumberRange}
                onChange={(e) => {
                  const range = e.target.value;
                  const quantity = calculateQuantity(range);
                  setUpdateForm((prev) => ({
                    ...prev,
                    idNumberRange: range,
                    quantity: quantity,
                  }));
                }}
                helperText="e.g., 1-100 or 1,2,3"
              />
            </Grid>

            {/* Quantity (Read-only) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                fullWidth
                value={updateForm.quantity}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Supplier */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supplier"
                fullWidth
                value={updateForm.supplier}
                onChange={(e) =>
                  setUpdateForm((prev) => ({
                    ...prev,
                    supplier: e.target.value,
                  }))
                }
              />
            </Grid>

            {/* Remark */}
            <Grid item xs={12}>
              <TextField
                label="Remark"
                fullWidth
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

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onUpdate}
            variant="contained"
            startIcon={
              isLoading ? <CircularProgress size={20} /> : <SaveIcon />
            }
            disabled={isLoading || !updateForm.stage}
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
