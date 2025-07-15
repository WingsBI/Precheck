import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Alert,
  FormHelperText,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TablePagination,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  GetApp as GetAppIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import type { RootState, AppDispatch } from "../../store/store";
import type { DrawingNumber, NewQRCodeFormData } from "../../types";
import {
  generateStandardFieldQRCode,
  fetchIRNumbers,
  clearError,
  clearGeneratedNumber,
  exportQRCode,
  exportBulkQRCodes,
} from "../../store/slices/qrcodeSlice";
import {
  getDrawingNumbers,
  getAllProductionSeries,
  getAllUnits,
} from "../../store/slices/commonSlice";
import debounce from "lodash/debounce";

const NewBarcodeGeneration: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { qrcodeList, loading } = useSelector(
    (state: RootState) => state.qrcode
  );

  const { drawingNumbers, productionSeries, units } = useSelector(
    (state: RootState) => state.common
  );

  // Local state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarcodes, setSelectedBarcodes] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Disposition options for dropdown
  const dispositionOptions = ["Accepted", "Rejected", "Used for QT"];

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NewQRCodeFormData>({
    defaultValues: {
      // Common fields from existing QR code page
      drawingNumber: "",
      nomenclature: "",
      productionSeries: "",
      unit: "",
      manufacturingDate: new Date(),
      expiryDate: new Date(),
      irNumber: "",
      poNumber: "",
      projectNumber: "",
      mrirNumber: "",
      quantity: 1,

      // New fields specific to this page
      project: "",
      partNo: "",
      size: "",
      shapes: "",
      customerIC: "",
      mrir: "",
      qty: 1,
      srNo: "",
      material: "",
      htLotNo: "",
      mfgDate: new Date(),
      expireDate: new Date(),
      tQty: 0,
      fan: "",
      gic: "",
      dtd: "",
      qc: "Accepted",
      pc: "",
      irNo: "",
      gfnNo: "",
      wc: "",
      desposition: "Accepted",
    },
  });

  // Load initial data
  useEffect(() => {
    dispatch(getAllProductionSeries());
    dispatch(getAllUnits());
    dispatch(fetchIRNumbers(undefined));
  }, [dispatch]);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((search: string) => {
        if (search.length >= 3) {
          dispatch(getDrawingNumbers({ search }));
        }
      }, 300),
    [dispatch]
  );

  // Handle selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(qrcodeList.map((item) => item.id));
    } else {
      setSelectedBarcodes([]);
    }
  };

  const handleSelectBarcode = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedBarcodes((prev) => [...prev, id]);
    } else {
      setSelectedBarcodes((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleDownload = async () => {
    if (selectedBarcodes.length > 0) {
      const selectedQRCodes = qrcodeList
        .filter((item) => selectedBarcodes.includes(item.id))
        .map((item) => item.qrCodeNumber || item.serialNumber);
      await dispatch(exportBulkQRCodes(selectedQRCodes));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  console.log("listqrcode", qrcodeList);
  // Form submission
  const onSubmit = async (data: NewQRCodeFormData) => {
    try {
      const payload = {
        productionSeriesId:
          productionSeries.find(
            (ps) => ps.productionSeries === data.productionSeries
          )?.id || 0,
        componentTypeId: selectedDrawing?.componentTypeId || 0,
        nomenclatureId: selectedDrawing?.nomenclatureId || 0,
        lnItemCodeId: selectedDrawing?.lnItemCodeId || 0,
        rackLocationId: selectedDrawing?.rackLocationId || 0,
        drawingNumberId: selectedDrawing?.id || 0,
        unitId: units.find((u) => u.unitName === data.unit)?.id || 0,
        quantity: data.qty,
        desposition: data.desposition,
        expiryDate: data.expireDate ? data.expireDate.toISOString() : "",
        manufacturingDate: data.mfgDate ? data.mfgDate.toISOString() : "",
        irNumber: data.irNumber,
        poNumber: data.poNumber,
        projectNumber: data.projectNumber,
        mrirNumber: data.mrir,
        partNo: data.partNo,
        size: data.size,
        shapes: data.shapes,
        customerIC: data.customerIC,
        material: data.material,
        htLotNo: data.htLotNo,
        fan: data.fan,
        gic: data.gic,
        dtd: data.dtd,
        pc: data.pc,
        irNo: data.irNo,
        gfnNo: data.gfnNo,
        srNo: data.srNo,
        tQty: data.tQty,
        wc: data.wc,
        project: data.project,
      };

      await dispatch(generateStandardFieldQRCode(payload)).unwrap();
      setSuccessMessage("QR Code generated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to generate QR code");
    }
  };

  // Handle form reset
  const handleReset = () => {
    reset();
    setSelectedDrawing(null);
    setSuccessMessage("");
    setErrorMessage("");
    setSelectedBarcodes([]);
    setPage(0);
    setRowsPerPage(10);
    dispatch(clearError());
    dispatch(clearGeneratedNumber());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "primary.main", mb: 3 }}
            >
              Generate Standard QR Code
            </Typography>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Row 1: Drawing Number, LN Item Code, Nomenclature - Common fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="drawingNumber"
                    control={control}
                    rules={{ required: "Drawing Number is required" }}
                    render={({ field: { onChange, ...field } }) => (
                      <Autocomplete
                        {...field}
                        options={drawingNumbers}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.drawingNumber;
                        }}
                        value={selectedDrawing}
                        loading={loading}
                        size="small"
                        onInputChange={(_, value) => {
                          setSearchTerm(value);
                          if (value.length >= 3) {
                            debouncedDrawingSearch(value);
                          }
                        }}
                        onChange={(_, value) => {
                          setSelectedDrawing(value);
                          onChange(value ? value.drawingNumber : "");
                          if (value) {
                            setValue("nomenclature", value.nomenclature);
                          }
                        }}
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
                                  {loading ? (
                                    <CircularProgress
                                      color="inherit"
                                      size={16}
                                    />
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
                  <TextField
                    label="LN Item Code"
                    value={selectedDrawing?.lnItemCode || ""}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "grey.50" }}
                  />
                </Grid>

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
                        sx={{ bgcolor: "grey.50" }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 2: Production Series, Available For, Component Type - Common fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="productionSeries"
                    control={control}
                    rules={{ required: "Production Series is required" }}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={!!errors.productionSeries}
                        size="small"
                      >
                        <InputLabel>Prod Series *</InputLabel>
                        <Select {...field} label="Prod Series *">
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

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Available For"
                    value={selectedDrawing?.availableFor || ""}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "grey.50" }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Component Type"
                    value={selectedDrawing?.componentType || ""}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "grey.50" }}
                  />
                </Grid>
              </Grid>

              {/* Row 3: Quantity, Unit, Manufacturing Date - Common fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="qty"
                    control={control}
                    rules={{ required: "Quantity is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Quantity *"
                        type="number"
                        fullWidth
                        size="small"
                        error={!!errors.qty}
                        helperText={errors.qty?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="unit"
                    control={control}
                    rules={{ required: "Unit is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.unit} size="small">
                        <InputLabel>Unit *</InputLabel>
                        <Select {...field} label="Unit *">
                          {units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.unitName}>
                              {unit.unitName}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.unit && (
                          <FormHelperText>{errors.unit.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="mfgDate"
                    control={control}
                    rules={{ required: "Manufacturing Date is required" }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="MFG Date *"
                        maxDate={new Date()}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            error: !!errors.mfgDate,
                            helperText: errors.mfgDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 4: Expiry Date, Project, Part No */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="expireDate"
                    control={control}
                    rules={{ required: "Expiry Date is required" }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Expire Date *"
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            error: !!errors.expireDate,
                            helperText: errors.expireDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="partNo"
                    control={control}
                    rules={{ required: "Part No is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Part No *"
                        fullWidth
                        size="small"
                        error={!!errors.partNo}
                        helperText={errors.partNo?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="wc"
                    control={control}
                    rules={{ required: "WC is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="WC *"
                        fullWidth
                        size="small"
                        error={!!errors.wc}
                        helperText={errors.wc?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 6: PO Number, Project Number, MRIR Number - Common fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="poNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="PO Number"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="projectNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Project Number"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="mrir"
                    control={control}
                    rules={{ required: "MRIR is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="MRIR *"
                        fullWidth
                        size="small"
                        error={!!errors.mrir}
                        helperText={errors.mrir?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 7: Size, Shapes, Customer IC */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="size"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Size"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="shapes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Shapes"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="customerIC"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Customer IC"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 8: Sr No, Material, HT/Lot No */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="srNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Sr No"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="material"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Material"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="htLotNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="HT/Lot No"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 9: T Qty, FAN, GIC */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="tQty"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="T Qty"
                        type="number"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="fan"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="FAN"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="gic"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="GIC"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 10: DTD, PC, IR No */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="dtd"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="DTD"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="pc"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="PC" fullWidth size="small" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="irNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="IR No"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 11: GFN No, Disposition */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="gfnNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="GFN No"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="desposition"
                    control={control}
                    rules={{ required: "Disposition is required" }}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={!!errors.desposition}
                        size="small"
                      >
                        <InputLabel>Disposition *</InputLabel>
                        <Select {...field} label="Disposition *">
                          {dispositionOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.desposition && (
                          <FormHelperText>
                            {errors.desposition.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

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
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 120, py: 1.5, height: 40 }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <QrCodeIcon />
                    )
                  }
                  sx={{ minWidth: 200, py: 1.5, height: 40 }}
                >
                  {loading ? "Generating..." : "Generate QR Code"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Generated QR Codes */}
        {qrcodeList.length > 0 && (
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack
                direction={isMobile ? "column" : "row"}
                justifyContent="space-between"
                alignItems={isMobile ? "stretch" : "center"}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "primary.main", fontWeight: 600 }}
                >
                  Generated QR Codes ({qrcodeList.length})
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Checkbox
                    checked={
                      selectedBarcodes.length === qrcodeList.length &&
                      qrcodeList.length > 0
                    }
                    indeterminate={
                      selectedBarcodes.length > 0 &&
                      selectedBarcodes.length < qrcodeList.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Select All
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    disabled={selectedBarcodes.length === 0}
                  >
                    Download ({selectedBarcodes.length})
                  </Button>
                </Stack>
              </Stack>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 500 }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            selectedBarcodes.length === qrcodeList.length &&
                            qrcodeList.length > 0
                          }
                          indeterminate={
                            selectedBarcodes.length > 0 &&
                            selectedBarcodes.length < qrcodeList.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>Sr. No</TableCell>
                      <TableCell>QR Code</TableCell>
                      <TableCell>ID Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qrcodeList
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedBarcodes.includes(item.id)}
                              onChange={(e) =>
                                handleSelectBarcode(item.id, e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {page * rowsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {item.qrCodeNumber || item.serialNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.idNumber || "-"}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.isNewQrCode ? "New" : "Existing"}
                              color={item.isNewQrCode ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="center"
                            >
                              <Tooltip title="Copy QR Code">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    copyToClipboard(
                                      item.qrCodeNumber || item.serialNumber
                                    )
                                  }
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    dispatch(
                                      exportQRCode(
                                        item.qrCodeNumber || item.serialNumber
                                      )
                                    )
                                  }
                                >
                                  <GetAppIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={qrcodeList.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default NewBarcodeGeneration;
