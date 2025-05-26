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