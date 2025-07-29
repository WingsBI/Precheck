import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  FormControl,
  Autocomplete,
  CircularProgress,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Chip,
  Collapse,
  TablePagination,
  DialogContentText,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
  QrCode as QrCodeIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import {
  viewPrecheckDetails,
  getAvailableComponents,
  makePrecheck,
  clearPrecheckData,
} from "../../store/slices/precheckSlice";
import { getBarcodeDetails } from "../../store/slices/qrcodeSlice";
import {
  getAllProductionSeries,
  getDrawingNumbers,
} from "../../store/slices/commonSlice";
import type { RootState, AppDispatch } from "../../store/store";
import debounce from "lodash.debounce";
import { useLocation, useNavigate } from "react-router-dom";

interface BarcodeDetails {
  qrCodeStatusId: number;
  drawingNumberId: number;
  drawingNumber: string;
  idNumber: string;
  quantity: number;
  irNumber: string;
  msnNumber: string;
  irNumberId: number;
  msnNumberId: number;
  idNumbers: number;
  productionSeriesId: number;
  componentType: string;
  mrirNumber: string;
  remark: string;
}

interface GridItem {
  sr: number;
  drawingNumber: string;
  nomenclature: string;
  quantity: number;
  idNumber: string;
  ir: string;
  msn: string;
  mrirNumber: string;
  drawingNumberId: number;
  prodSeriesId: number;
  isPrecheckComplete: boolean;
  isUpdated: boolean;
  isSubmitted?: boolean;
  qrCode?: string;
  componentType?: string;
  username?: string;
  modifiedDate?: string;
  remarks?: string;
  expanded?: boolean;
  productionOrderNumber?: string;
  projectNumber?: string;
  disposition?: string;
  unit?: string;
}

interface QuantityDialogProps {
  open: boolean;
  maxQuantity: number;
  defaultQuantity: number;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const QuantityDialog: React.FC<QuantityDialogProps> = ({
  open,
  maxQuantity,
  defaultQuantity,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [error, setError] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(defaultQuantity);
      setError("");
    }
  }, [open, defaultQuantity]);

  const validateInput = (value: string) => {
    const numValue = parseInt(value);
    if (value === "") {
      setError("");
      return;
    }
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return;
    }
    if (numValue < 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (numValue > maxQuantity) {
      setError(`Quantity cannot exceed ${maxQuantity}`);
      return;
    }
    setError("");
    setQuantity(numValue);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    validateInput(value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    validateInput(pastedText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers, backspace, delete, and arrow keys
    if (
      !/^\d$/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
        e.key
      ) &&
      !(e.ctrlKey && e.key === "a")
    ) {
      e.preventDefault();
    }
  };

  const handleConfirm = () => {
    if (!error && quantity >= 0 && quantity <= maxQuantity) {
      onConfirm(quantity);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 400,
          p: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="div">
          Enter Quantity
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Maximum allowed quantity: {maxQuantity}
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Quantity"
          type="text"
          fullWidth
          value={quantity}
          onChange={handleQuantityChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error}
          inputProps={{
            inputMode: "numeric",
            pattern: "[0-9]*",
            min: 0,
            max: maxQuantity,
            style: { fontSize: "1rem" },
          }}
          SelectProps={{
            native: true,
          }}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: error ? "error.main" : "grey.400",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ minWidth: 100 }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!!error || quantity < 0 || quantity > maxQuantity}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MakePrecheck: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Redux state
  const { productionSeries, drawingNumbers } = useSelector(
    (state: RootState) => state.common
  );
  const { user } = useSelector((state: RootState) => state.auth);

  // Form state
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] =
    useState<any>(null);
  const [idNumber, setIdNumber] = useState("");
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // Track original values for validation
  const [originalDrawingNumber, setOriginalDrawingNumber] = useState<
    string | null
  >(null);
  const [originalProdSeries, setOriginalProdSeries] = useState<number | null>(
    null
  );
  const [originalAssemblyNumber, setOriginalAssemblyNumber] = useState<
    string | null
  >(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Loading states
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [prodSeriesLoading, setProdSeriesLoading] = useState(false);

  // Search results
  const [searchResults, setSearchResults] = useState<GridItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  // QR Code scanner state
  const [barcodeText, setBarcodeText] = useState("");
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);

  // Quantity dialog state
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [pendingBarcodeData, setPendingBarcodeData] = useState<any>(null);

  // Alert state
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("info");
  const [showAlert, setShowAlert] = useState(false);

  // Sorting state
  const [orderBy, setOrderBy] = useState<string>("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected row state
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Button states
  const [isMakePrecheckEnabled, setIsMakePrecheckEnabled] = useState(false);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingLoading(true);
        dispatch(getDrawingNumbers({ search: searchValue })).finally(() =>
          setDrawingLoading(false)
        );
      }, 300),
    [dispatch]
  );

  const debouncedProdSeriesSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setProdSeriesLoading(true);
        dispatch(getAllProductionSeries()).finally(() =>
          setProdSeriesLoading(false)
        );
      }, 300),
    [dispatch]
  );

  // Load initial data
  useEffect(() => {
    dispatch(getAllProductionSeries());
    dispatch(getDrawingNumbers({}));
  }, [dispatch]);

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const showAlertMessage = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };

  // Sorting functions
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedResults = useMemo(() => {
    if (!orderBy) return searchResults;

    return [...searchResults].sort((a, b) => {
      let aValue = a[orderBy as keyof GridItem];
      let bValue = b[orderBy as keyof GridItem];

      // Handle numeric values
      if (orderBy === "sr" || orderBy === "quantity") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        // Handle string values
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (order === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [searchResults, orderBy, order]);

  // Validate fields whenever relevant properties change
  useEffect(() => {
    validateFields();
  }, [selectedDrawing, selectedProductionSeries, idNumber]);

  const validateFields = () => {
    // Check if mandatory fields are filled
    const mandatoryFieldsFilled =
      selectedDrawing?.drawingNumber &&
      selectedProductionSeries?.id &&
      idNumber;

    // Check if the current combination is different from the previously loaded one
    const hasDifferentCombination =
      !hasLoadedData ||
      selectedDrawing?.drawingNumber !== originalDrawingNumber ||
      selectedProductionSeries?.id !== originalProdSeries ||
      idNumber !== originalAssemblyNumber;

    // Enable button only if mandatory fields are filled AND
    // either we haven't loaded data yet OR the combination is different
    setIsMakePrecheckEnabled(mandatoryFieldsFilled && hasDifferentCombination);
  };

  const handleMakePrecheck = async () => {
    if (!validateInputs()) return;

    try {
      setIsLoadingLocal(true);
      // Disable the button immediately
      setHasLoadedData(true);
      setOriginalDrawingNumber(selectedDrawing?.drawingNumber);
      setOriginalProdSeries(selectedProductionSeries?.id);
      setOriginalAssemblyNumber(idNumber);

      setIsMakePrecheckEnabled(false);

      const payload = {
        DrawingNumberId: selectedDrawing?.id,
        ProductionSeriesId: selectedProductionSeries?.id,
        Id: idNumber ? parseInt(idNumber) : undefined,
      };

      const response = await dispatch(viewPrecheckDetails(payload)).unwrap();
      await updateGridItems(response);

      setIsSubmitEnabled(true);
      setShowResults(true);
    } catch (error) {
      console.error("Error in LoadGridData:", error);
      showAlertMessage(
        "Error loading data: " + (error as Error).message,
        "error"
      );
    } finally {
      setIsLoadingLocal(false);
      setIsMakePrecheckEnabled(false);
    }
  };

  const validateInputs = () => {
    const missingFields = [];

    if (!selectedDrawing) missingFields.push("Drawing Number");
    if (!selectedProductionSeries) missingFields.push("Production Series");
    if (!idNumber) missingFields.push("Assembly Number");

    if (missingFields.length > 0) {
      showAlertMessage(
        `Please fill the following required fields:\n${missingFields.join(
          ", "
        )}`,
        "error"
      );
      return false;
    }

    return true;
  };

  const handleSubmitPrecheck = async () => {
    try {
      setIsLoadingLocal(true);
      setIsSubmitEnabled(false);

      const componentsToSubmit = searchResults
        .filter(
          (item) =>
            item.isUpdated && !item.isSubmitted && !item.isPrecheckComplete
        )
        .map((item) => ({
          ConsumedDrawingNo: `${selectedProductionSeries?.productionSeries}/${selectedDrawing?.drawingNumber}/${idNumber}`,
          ConsumedInDrawingNumberID: selectedDrawing?.id || 0,
          ConsumedInProdSeriesID: selectedProductionSeries?.id || 0,
          ConsumedInId: parseInt(idNumber) || 0,
          QrCodeNumber: item.qrCode || "",
          Quantity: item.quantity || 0,
          DrawingNumberId: item.drawingNumberId || 0,
          Id: 0,
          ProductionSeriesId: item.prodSeriesId || 0,
          Remarks: item.remarks || "",
          Unit: item.unit || "1", // Use item unit if available, otherwise default to "1"
          IrNumber: item.ir || "",
          MsnNumber: item.msn || "",
          MrirNumber: item.mrirNumber || "",
          IdNumbers: item.idNumber || "",
          ComponentType: item.componentType || "",
          ProductionOrderNumber: item.productionOrderNumber || "NA",
          CreatedBy: Number(user?.id) || 0, // Use logged-in user's ID
        }));

      if (!componentsToSubmit.length) {
        showAlertMessage("No new components to submit", "info");
        return;
      }

      console.log("Submitting components:", componentsToSubmit);

      const response = await dispatch(
        makePrecheck(componentsToSubmit)
      ).unwrap();
      console.log("Response maake precheck:", response);
      if (response?.length) {
        // Update grid items as submitted
        const updatedResults = searchResults.map((item) => {
          if (item.isUpdated && !item.isSubmitted) {
            const responseItem = response.find(
              (x: any) => x.DrawingNumberId === item.drawingNumberId
            );
            if (responseItem) {
              return {
                ...item,
                isSubmitted: true,
                isUpdated: false,
                isPrecheckComplete: true,
                mrirNumber: responseItem.MrirNumber,
                quantity: responseItem.Quantity,
                remarks: responseItem.Remarks,
                ir: responseItem.IrNumber,
                msn: responseItem.MsnNumber,
                modifiedDate: responseItem.ModifiedDate,
              };
            }
          }
          return item;
        });

        setSearchResults(updatedResults);
        showAlertMessage("Precheck submitted successfully!", "success");
      } else {
        showAlertMessage("No data submitted.", "info");
        setIsSubmitEnabled(true);
      }
    } catch (error) {
      console.error("Error submitting precheck:", error);
      showAlertMessage(
        `Error submitting precheck: ${(error as Error).message}`,
        "error"
      );
      setIsSubmitEnabled(true);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Cleanup function
  const resetAllData = useCallback(() => {
    // Clear form fields
    setHasLoadedData(false);
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setIdNumber("");
    setBarcodeText("");

    // Clear original values
    setOriginalDrawingNumber(null);
    setOriginalProdSeries(null);
    setOriginalAssemblyNumber(null);

    // Clear grid data
    setSearchResults([]);
    setShowResults(false);

    // Reset button states
    setIsMakePrecheckEnabled(false);
    setIsSubmitEnabled(false);

    // Clear alerts
    setAlertMessage("");
    setShowAlert(false);

    // Reset dialog states
    setQuantityDialogOpen(false);
    setPendingBarcodeData(null);

    // Reset pagination
    setPage(0);
    setSelectedRow(null);

    // Reset expanded rows
    setExpandedRows(new Set());

    // Clear Redux state
    dispatch(clearPrecheckData());

    // Re-validate fields
    validateFields();
  }, [dispatch]);

  // Handle the reset button click
  const handleReset = () => {
    resetAllData();
  };

  const handleBarcodeChange = (value: string) => {
    setBarcodeText(value);

    // Auto-process when barcode length is 12 or 15 digits
    if ((value.length === 12 || value.length === 15) && /^\d+$/.test(value)) {
      processBarcodeAsync(value);
      setBarcodeText(""); // Clear after processing
    }
  };

  const processBarcodeAsync = async (barcode: string) => {
    try {
      // Call the getBarcodeDetails API
      const qrCodeDetails = await dispatch(getBarcodeDetails(barcode)).unwrap();

      if (!qrCodeDetails) {
        showAlertMessage("Invalid QR code or no data found", "error");
        return;
      }

      console.log("QR Code Details:", qrCodeDetails);

      // Check QR code status first - using the statusId from API
      if (
        qrCodeDetails.qrCodeStatusId === 3 ||
        qrCodeDetails.qrCodeStatus?.toLowerCase() === "qrcodegenerated"
      ) {
        showAlertMessage(
          "Component not stored in. QR code is generated but not ready for consumption.",
          "warning"
        );
        return;
      }

      if (
        qrCodeDetails.qrCodeStatusId === 2 ||
        qrCodeDetails.qrCodeStatus?.toLowerCase() === "consumed"
      ) {
        showAlertMessage(
          "This QR code has already been consumed and cannot be used again.",
          "error"
        );
        return;
      }

      // Only proceed if status is 1 (Available)
      if (
        qrCodeDetails.qrCodeStatusId !== 1 &&
        qrCodeDetails.qrCodeStatus?.toLowerCase() !== "available"
      ) {
        showAlertMessage("Invalid QR code status.", "error");
        return;
      }

      // Find potential matches with the same DrawingNumberId
      const potentialMatches = searchResults
        .map((item, index) => ({ item, index }))
        .filter(
          (x) => x.item.drawingNumberId === qrCodeDetails.drawingNumberId
        );

      console.log("Potential Matches:", potentialMatches);

      // If no matching DrawingNumberId found, show message and return
      if (!potentialMatches.length) {
        showAlertMessage(
          `No components found with drawing number ${qrCodeDetails.drawingNumber}.`,
          "info"
        );
        return;
      }

      // Check for ID component type
      if (
        potentialMatches.some(
          (x) => x.item.componentType?.toUpperCase() === "ID"
        )
      ) {
        const idAlreadyAssigned = searchResults.some(
          (item) =>
            item.idNumber === qrCodeDetails.idNumber &&
            item.drawingNumberId === qrCodeDetails.drawingNumberId
        );

        if (idAlreadyAssigned) {
          showAlertMessage(
            `ID ${qrCodeDetails.idNumber} has already been assigned to a component with drawing number ${qrCodeDetails.drawingNumber}.`,
            "warning"
          );
          return;
        }
      }

      // Find the first unprocessed item from potential matches
      const matchingItem = potentialMatches.find(
        (x) =>
          !x.item.isPrecheckComplete && !x.item.isUpdated && !x.item.idNumber
      );

      if (matchingItem) {
        // Determine quantity based on component type
        if (qrCodeDetails.componentType?.toUpperCase() !== "ID") {
          const maxQty = matchingItem.item.quantity || 0;
          setMaxQuantity(maxQty);
          setSelectedQuantity(maxQty);
          setPendingBarcodeData({ qrCodeDetails, matchingItem });
          setQuantityDialogOpen(true);
        } else {
          // For ID type, use the quantity from qrCodeDetails
          updateGridItem(
            qrCodeDetails,
            matchingItem,
            qrCodeDetails.quantity || 0
          );
          showAlertMessage(
            "Component details updated successfully.",
            "success"
          );
        }
      } else {
        // No unprocessed row found
        const totalMatchingItems = potentialMatches.length;
        const processedMatchingItems = potentialMatches.filter(
          (x) =>
            x.item.isPrecheckComplete || x.item.isUpdated || x.item.idNumber
        ).length;

        if (
          totalMatchingItems > 0 &&
          processedMatchingItems === totalMatchingItems
        ) {
          showAlertMessage(
            `All components with drawing number ${qrCodeDetails.drawingNumber} have already been processed.`,
            "info"
          );
        } else {
          showAlertMessage(
            "No matching unprocessed component found for the scanned barcode.",
            "info"
          );
        }
      }
    } catch (error: any) {
      console.error("Error processing barcode:", error);
      
      // Extract user-friendly error message from API response
      let errorMessage = "Error processing QR code";
      
      if (error?.payload) {
        // Redux rejected action with payload
        errorMessage = error.payload;
      } else if (error?.response?.data?.message) {
        // API returned a structured error response
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        // Standard error object
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        // String error
        errorMessage = error;
      }
      
      showAlertMessage(
        `Error processing QR Code ${barcode}: ${errorMessage}`,
        "error"
      );
    }
  };

  const updateGridItem = (
    qrCodeDetails: any,
    matchingItem: any,
    quantity: number
  ) => {
    const updatedResults = [...searchResults];
    const item = updatedResults[matchingItem.index];

    // Get username from Redux auth state (which comes from JWT token)
    const currentUsername = user?.username || "Current User";

    // Update the item with all fields from QR code details
    item.qrCode = qrCodeDetails.qrCodeNumber;
    item.isPrecheckComplete = false;
    item.isUpdated = true;
    item.ir = qrCodeDetails.irNumber;
    item.msn = qrCodeDetails.msnNumber;
    item.idNumber = qrCodeDetails.idNumber;
    item.quantity = quantity;
    item.componentType = qrCodeDetails.componentType;
    item.mrirNumber = qrCodeDetails.mrirNumber;
    item.remarks = qrCodeDetails.remark;
    item.username = currentUsername;
    item.modifiedDate = new Date().toISOString();
    item.productionOrderNumber = qrCodeDetails.productionOrderNumber || "NA";
    item.projectNumber = qrCodeDetails.projectNumber || "NA";
    item.disposition = qrCodeDetails.desposition || "NA";
    item.unit = qrCodeDetails.unit || item.unit || "1"; // Use QR code unit if available

    console.log("Updated Grid Item:", item);
    setSearchResults(updatedResults);

    // Enable submit button
    setIsSubmitEnabled(true);

    // Show success message with scan time
    const scanTime = formatDate(new Date().toISOString());
    showAlertMessage(`QR Code scanned successfully at ${scanTime}!`, "success");

    // Check if all items are processed
    const unprocessedItems = updatedResults.filter(
      (item) => !item.isPrecheckComplete && !item.isUpdated
    );

    if (unprocessedItems.length === 0) {
      showAlertMessage("All components have been pre-checked!", "info");
    }
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (pendingBarcodeData) {
      updateGridItem(
        pendingBarcodeData.qrCodeDetails,
        pendingBarcodeData.matchingItem,
        quantity
      );
      setPendingBarcodeData(null);
    }
    setQuantityDialogOpen(false);
  };

  // Helper function to get component type icon and color
  const getComponentTypeChip = (componentType: string) => {
    const type = componentType?.toUpperCase();
    switch (type) {
      case "ID":
        return (
          <Chip
            icon={<QrCodeIcon />}
            label="ID"
            size="small"
            color="primary"
            variant="outlined"
          />
        );
      case "BATCH":
        return (
          <Chip
            icon={<InventoryIcon />}
            label="BATCH"
            size="small"
            color="secondary"
            variant="outlined"
          />
        );
      case "FIM":
        return (
          <Chip
            icon={<CategoryIcon />}
            label="FIM"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      case "SI":
        return (
          <Chip
            icon={<SettingsIcon />}
            label="SI"
            size="small"
            color="warning"
            variant="outlined"
          />
        );
      default:
        return <Chip label={type || "N/A"} size="small" variant="outlined" />;
    }
  };

  // Handle row expansion
  const handleRowExpand = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle row selection on double-click
  const handleRowDoubleClick = (index: number) => {
    const actualIndex = page * rowsPerPage + index;
    setSelectedRow(selectedRow === actualIndex ? null : actualIndex);
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, page, rowsPerPage]);

  const updateGridItems = async (response: any[]) => {
    if (!response?.length) return;

    const newItems = response.map((item, index) => ({
      sr: index + 1,
      drawingNumber: item.drawingNumber,
      nomenclature: item.nomenclature,
      quantity: item.quantity,
      idNumber: item.idNumber,
      ir: item.irNumber,
      msn: item.msnNumber,
      mrirNumber: item.mrirNumber,
      drawingNumberId: item.drawingNumberId,
      prodSeriesId: item.prodSeriesId,
      isPrecheckComplete: item.isPrecheckComplete,
      isUpdated: item.isUpdated,
      isSubmitted: false,
      componentType: item.componentType,
      username: item.username,
      modifiedDate: item.modifiedDate,
      remarks: item.remarks,
      productionOrderNumber: item.productionOrderNumber,
      projectNumber: item.projectNumber,
      disposition: item.disposition,
      unit: item.unit || "1", // Include unit field from API response
    }));

    setSearchResults(newItems);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 2,
        }}
      >
        Make Precheck
      </Typography>

      {/* Alert */}
      {showAlert && (
        <Alert
          severity={alertSeverity}
          sx={{ mb: 2 }}
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Form Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          gap: 1.5,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <FormControl
          sx={{
            minWidth: { xs: "100%", sm: 250 },
            flex: { xs: "1 1 100%", sm: "0 1 auto" },
          }}
          size="small"
        >
          <Autocomplete
            size="small"
            options={drawingNumbers}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.drawingNumber || "";
            }}
            value={selectedDrawing}
            loading={drawingLoading}
            onInputChange={(_: any, value: string) => {
              if (value.length >= 3) {
                debouncedDrawingSearch(value);
              }
            }}
            onChange={(_: any, value: any) => {
              setSelectedDrawing(value);
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === (value?.id || "")
            }
            renderOption={(props: any, option: any) => (
              <li {...props}>
                <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                  <Typography variant="body2">
                    {option.drawingNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.nomenclature || ""} | {option.componentType || ""}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="Drawing Number *"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {drawingLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </FormControl>

        <FormControl
          sx={{
            minWidth: { xs: "100%", sm: 145 },
            flex: { xs: "1 1 100%", sm: "0 1 auto" },
          }}
          size="small"
        >
          <Autocomplete
            size="small"
            options={productionSeries}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.productionSeries || "";
            }}
            value={selectedProductionSeries}
            loading={prodSeriesLoading}
            onInputChange={(_, value) => {
              if (value.length >= 1) {
                debouncedProdSeriesSearch(value);
              }
            }}
            onChange={(_, value) => {
              setSelectedProductionSeries(value);
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === (value?.id || "")
            }
            renderOption={(props, option) => (
              <li {...props}>
                <Typography variant="body2">
                  {option.productionSeries}
                </Typography>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Prod Series *"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {prodSeriesLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </FormControl>

        <FormControl
          sx={{
            minWidth: { xs: "50%", sm: 100 },
            flex: { xs: "1 1 50%", sm: "0 1" },
          }}
          size="small"
        >
          <TextField
            size="small"
            label="ID Num *"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            variant="outlined"
          />
        </FormControl>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            width: { xs: "100%", sm: "auto" },
            mt: { xs: 1, sm: 0 },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{
              minWidth: { xs: "100%", sm: 160 },
              height: 32,
              flex: { xs: "1 1 100%", sm: "0 1 auto" },
            }}
            size="small"
            onClick={handleMakePrecheck}
            disabled={!isMakePrecheckEnabled}
          >
            <QrCodeScannerIcon sx={{ mr: 1 }} />
            Make Precheck
          </Button>

          <Button
            variant="contained"
            color="error"
            sx={{
              minWidth: { xs: "100%", sm: 160 },
              height: 32,
              flex: { xs: "1 1 100%", sm: "0 1 auto" },
            }}
            size="small"
            onClick={handleReset}
          >
            <RefreshIcon sx={{ mr: 1 }} />
            Reset
          </Button>

          <Button
            variant="contained"
            color="success"
            sx={{
              minWidth: { xs: "100%", sm: 160 },
              height: 32,
              flex: { xs: "1 1 100%", sm: "0 1 auto" },
            }}
            size="small"
            onClick={handleSubmitPrecheck}
            // disabled={!isSubmitEnabled}
          >
            <SendIcon sx={{ mr: 1 }} />
            Submit
          </Button>
        </Box>
      </Box>

      {/* QR Code Scanner Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          gap: 1.5,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            fontSize: "0.875rem",
            minWidth: "auto",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Scan Qr Code:
        </Typography>
        <TextField
          size="small"
          value={barcodeText}
          onChange={(e) => handleBarcodeChange(e.target.value)}
          placeholder="Scan or enter QR code (12 or 15 digits)"
          sx={{
            width: { xs: "100%", sm: 300 },
            flex: { xs: "1 1 100%", sm: "0 1 auto" },
          }}
          disabled={!showResults || searchResults.length === 0}
          autoFocus={showResults && searchResults.length > 0}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            fontSize: "0.875rem",
            ml: { xs: 0, sm: 2 },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <span>BOM Details of </span>
          <span style={{ color: "#1976d2" }}>
            {selectedDrawing?.drawingNumber || ""}
          </span>
        </Typography>
      </Box>

      {/* Results Display */}
      {showResults && (
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: "medium",
            width: "100%",
            overflowWrap: "break-word",
          }}
        >
          Showing results for{" "}
          {selectedProductionSeries?.productionSeries || "A"} /{" "}
          {selectedDrawing?.drawingNumber || ""} / {idNumber || ""}
        </Typography>
      )}

      {/* BOM Details Table */}
      <Paper
        sx={{
          mt: 1,
          mb: 1,
          p: 0.5,
          boxShadow: 2,
          width: "100%",
          overflow: "hidden",
        }}
      >
        <TableContainer
          sx={{
            maxHeight: { xs: 400, sm: 500 },
            overflow: "auto",
            width: "100%",
          }}
        >
          <Table stickyHeader sx={{ minWidth: 1000 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5", height: 24 }}>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 20,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "sr"}
                    direction={orderBy === "sr" ? order : "asc"}
                    onClick={() => handleRequestSort("sr")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    SR
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 80,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "drawingNumber"}
                    direction={orderBy === "drawingNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("drawingNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 100,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "nomenclature"}
                    direction={orderBy === "nomenclature" ? order : "asc"}
                    onClick={() => handleRequestSort("nomenclature")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Nomenclature
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 40,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "quantity"}
                    direction={orderBy === "quantity" ? order : "asc"}
                    onClick={() => handleRequestSort("quantity")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Qty
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 80,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "idNumber"}
                    direction={orderBy === "idNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("idNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 60,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "ir"}
                    direction={orderBy === "ir" ? order : "asc"}
                    onClick={() => handleRequestSort("ir")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    IR
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 60,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "msn"}
                    direction={orderBy === "msn" ? order : "asc"}
                    onClick={() => handleRequestSort("msn")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    MSN
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 80,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "mrirNumber"}
                    direction={orderBy === "mrirNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("mrirNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    MRIR Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 80,
                  }}
                >
                  Type
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                    minWidth: 40,
                  }}
                >
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingLocal ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ height: 150 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item, index) => (
                  <React.Fragment key={index}>
                    <TableRow
                      hover
                      onDoubleClick={() => handleRowDoubleClick(index)}
                      sx={{
                        backgroundColor: item.isPrecheckComplete
                          ? "#f0f0f0"
                          : selectedRow === page * rowsPerPage + index
                          ? "#e3f2fd"
                          : "inherit",
                        opacity: item.isPrecheckComplete ? 0.7 : 1,
                        height: 36,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: item.isPrecheckComplete
                            ? "#f0f0f0"
                            : selectedRow === page * rowsPerPage + index
                            ? "#bbdefb"
                            : "#f5f5f5",
                        },
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.sr}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.drawingNumber}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.nomenclature}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.quantity}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.idNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.ir || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.msn || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.mrirNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {getComponentTypeChip(item.componentType || "")}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(index)}
                          sx={{ p: 0.2 }}
                        >
                          {expandedRows.has(index) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={10}
                      >
                        <Collapse
                          in={expandedRows.has(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 0.5 }}>
                            <Table size="small" aria-label="additional-details">
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    Remarks
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    User
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    Date
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    Status
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {item.remarks || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {item.username || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {formatDate(item.modifiedDate || "")}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    <Chip
                                      label={
                                        item.isPrecheckComplete
                                          ? "Completed"
                                          : item.isUpdated
                                          ? "Updated"
                                          : "Pending"
                                      }
                                      size="small"
                                      color={
                                        item.isPrecheckComplete
                                          ? "success"
                                          : item.isUpdated
                                          ? "warning"
                                          : "default"
                                      }
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : showResults ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ height: 150 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{ height: 150, color: "text.secondary" }}
                  >
                    Enter search criteria and click "Make Precheck" to see BOM
                    details
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {searchResults.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={searchResults.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: "1px solid #e0e0e0",
              "& .MuiTablePagination-toolbar": {
                minHeight: 48,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontSize: "0.8rem",
                },
            }}
          />
        )}
      </Paper>

      {/* Quantity Selection Dialog */}
      <QuantityDialog
        open={quantityDialogOpen}
        maxQuantity={maxQuantity}
        defaultQuantity={selectedQuantity}
        onClose={() => setQuantityDialogOpen(false)}
        onConfirm={handleQuantityConfirm}
      />
    </Box>
  );
};

export default MakePrecheck;
