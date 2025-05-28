export interface ProductionSeries {
  id: number;
  productionSeries: string;
  rcColour: string | null;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
}

export interface DocumentType {
  id: number;
  documentType: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
}

export interface DrawingNumber {
  id: number;
  drawingNumber: string;
  componentCode: string | null;
  lnItemCode: string | null;
  nomenclature: string;
  componentType: string;
  availableSeries: string[];
  availableSeriesId: number[];
  availableFor: string;
  isExpiry: boolean;
  location?: string;
  rackLocationId?: number;
  nomenclatureId?: number;
  componentTypeId?: number;
  lnItemCodeId?: number;
  assemblyId?: number;
  assemblyNumber?: string;
}

export interface FormData {
  drawingNumber: string;
  productionSeries: string;
  documentType: 'IR' | 'MSN';
  stage: string;
  quantity: number;
  idRange: string;
  poNumber: string;
  projectNumber: string;
  supplier?: string;
  remark?: string;
  nomenclature?: string;
}

export interface Unit {
  id: number;
  unitName: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
}

export interface IRNumber {
  id: number;
  irNumber: string;
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
  productionSeriesName?: string;
}

export interface MSNNumber {
  id: number;
  msnNumber: string;
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
  productionSeriesName?: string;
}

export interface BatchInfo {
  quantity: number;
  batchQuantity: number;
  assemblyDrawingId: number;
  assemblyNumber?: string;
}

export interface QRCodePayload {
  productionSeriesId: number;
  componentTypeId: number;
  nomenclatureId: number;
  lnItemCodeId: number;
  rackLocationId: number;
  irNumberId: number;
  msnNumberId: number;
  disposition: string;
  productionOrderNumber: string;
  projectNumber: string;
  expiryDate: string;
  manufacturingDate: string;
  drawingNumberId: number;
  unitId: number;
  mrirNumber: string;
  remark: string;
  quantity: number;
  ids: number[];
  idNumber?: string;
  batchIds: BatchInfo[];
}

export interface QRCodeItem {
  id: number;
  serialNumber: string;
  qrCodeData: string;
  qrCodeImage: string;
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  createdDate: string;
  isSelected: boolean;
  status: 'pending' | 'printed' | 'used';
  qrCodeNumber?: string;
  idNumber?: string;
  isNewQrCode?: boolean;
}

export interface BarcodeDetails {
  qrCodeNumber: string;
  productionSeriesId: number;
  drawingNumber: string;
  nomenclature: string;
  consumedInDrawing: string;
  qrCodeStatus: string;
  irNumber: string;
  msnNumber: string;
  mrirNumber: string;
  quantity: number;
  disposition: string;
  users: string;
}

export interface QRCodeFormData {
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  componentType: 'ID' | 'BATCH' | 'FIM' | 'SI';
  idType: 'series' | 'random';
  startRange: number;
  endRange: number;
  quantity: number;
  randomIds: string[];
  batchId: string;
  unit: string;
  manufacturingDate: Date;
  expiryDate?: Date;
  irNumber: string;
  msnNumber: string;
  poNumber: string;
  projectNumber: string;
  mrirNumber: string;
  disposition: 'Accepted' | 'Rejected' | 'Used for QT';
  location: string;
  remark: string;
} 