/**
 * SMART LEGAL METROLOGY — Shared Domain Contracts
 * Phase 0 — FROZEN after approval
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export enum UserRole {
  FIELD_OFFICER = 'FIELD_OFFICER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  region?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================================
// INSPECTION WORKFLOW
// ============================================================================

export enum InspectionStatus {
  // Mobile-only statuses
  DRAFT = 'DRAFT',                       // Initial capture, not yet uploaded
  PENDING_UPLOAD = 'PENDING_UPLOAD',     // Image ready, waiting for network

  // Backend statuses
  QUEUED = 'QUEUED',                     // Uploaded, in processing queue
  PROCESSING = 'PROCESSING',             // OCR/CV in progress
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',   // Low confidence or ambiguous
  COMPLETED = 'COMPLETED',               // Human review done
  SYNCED = 'SYNCED',                     // Report generated and synced
}

export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  REVIEW = 'REVIEW',
}

export interface Inspection {
  id: string;
  clientUuid: string;                    // Mobile-generated UUID for idempotency
  officerId: string;
  status: InspectionStatus;
  result?: InspectionResult;

  // Evidence
  imageUrl: string;                      // Original image (immutable)
  imageMetadata: ImageMetadata;

  // Extracted data
  rawOcrData?: OcrResult;                // Raw OCR output
  declaration?: Declaration;             // Structured extraction
  reviewedDeclaration?: Declaration;     // Human-reviewed values

  // Evaluation
  violations: Violation[];
  ruleVersion: string;                   // Rule set version used

  // Timestamps
  capturedAt: Date;
  uploadedAt?: Date;
  processedAt?: Date;
  reviewedAt?: Date;
  completedAt?: Date;

  // Metadata
  location?: GeoLocation;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  captureMode: 'camera' | 'upload';
  deviceInfo?: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
  exif?: Record<string, any>;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

// ============================================================================
// OCR & EXTRACTION
// ============================================================================

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
  confidence: number;
  processingTimeMs: number;
  engineVersion: string;
}

export interface OcrBlock {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
  fieldType?: string;                    // Detected field category
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// PRODUCT DECLARATION
// ============================================================================

export interface Declaration {
  // Manufacturer details
  manufacturerName?: FieldValue;
  manufacturerAddress?: FieldValue;
  packerName?: FieldValue;
  packerAddress?: FieldValue;
  importerName?: FieldValue;
  importerAddress?: FieldValue;

  // Product details
  commodityName?: FieldValue;
  brandName?: FieldValue;

  // Quantity & Pricing
  netQuantity?: FieldValue;
  netQuantityUnit?: FieldValue;
  mrp?: FieldValue;
  unitSalePrice?: FieldValue;

  // Dates
  manufactureDate?: FieldValue;
  bestBefore?: FieldValue;
  useBy?: FieldValue;

  // Contact
  consumerCare?: FieldValue;
  consumerCarePhone?: FieldValue;
  consumerCareEmail?: FieldValue;

  // Regulatory
  fssaiLicense?: FieldValue;

  // Font size measurements (physical, not pixel)
  mrpFontSizeMm?: number;
  manufacturerFontSizeMm?: number;
}

export interface FieldValue {
  value: string;
  confidence: number;
  boundingBox?: BoundingBox;
  source: 'ocr' | 'manual' | 'corrected';
}

// ============================================================================
// RULES & VIOLATIONS
// ============================================================================

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface Rule {
  ruleId: string;
  version: string;
  category: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  conditions: RuleCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: string;
  operator: 'exists' | 'missing' | 'equals' | 'not_equals' | 'contains' | 'regex' | 'less_than' | 'greater_than' | 'length_less_than' | 'length_greater_than';
  value?: any;
  message: string;
}

export interface Violation {
  id: string;
  ruleId: string;
  ruleVersion: string;
  ruleName: string;
  severity: Severity;
  field?: string;
  expectedValue?: string;
  actualValue?: string;
  message: string;
  requiresReview: boolean;
}

// ============================================================================
// PRODUCT (OPTIONAL REFERENCE DATA)
// ============================================================================

export interface Product {
  id: string;
  barcode?: string;
  commodityName: string;
  brandName?: string;
  category?: string;
  lastInspectionId?: string;
  violationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  INSPECTION_CREATED = 'INSPECTION_CREATED',
  INSPECTION_UPLOADED = 'INSPECTION_UPLOADED',
  INSPECTION_REVIEWED = 'INSPECTION_REVIEWED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  RULE_CREATED = 'RULE_CREATED',
  RULE_UPDATED = 'RULE_UPDATED',
  RULE_DELETED = 'RULE_DELETED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// REPORT
// ============================================================================

export interface Report {
  id: string;
  inspectionId: string;
  pdfUrl: string;
  generatedAt: Date;
  generatedBy: string;
}

// ============================================================================
// API CONTRACTS
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SyncRequest {
  clientUuid: string;
  inspection: Partial<Inspection>;
  imageData?: string;                    // Base64 or multipart
}

export interface SyncResponse {
  inspectionId: string;
  status: InspectionStatus;
  syncedAt: string;
}

// ============================================================================
// STATUS TRANSITION MAP
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  [InspectionStatus.DRAFT]: [InspectionStatus.PENDING_UPLOAD],
  [InspectionStatus.PENDING_UPLOAD]: [InspectionStatus.QUEUED, InspectionStatus.DRAFT],
  [InspectionStatus.QUEUED]: [InspectionStatus.PROCESSING],
  [InspectionStatus.PROCESSING]: [InspectionStatus.REVIEW_REQUIRED, InspectionStatus.COMPLETED],
  [InspectionStatus.REVIEW_REQUIRED]: [InspectionStatus.COMPLETED],
  [InspectionStatus.COMPLETED]: [InspectionStatus.SYNCED],
  [InspectionStatus.SYNCED]: [],
};
