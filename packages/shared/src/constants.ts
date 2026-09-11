/**
 * Constants shared across all services and clients.
 */

/** Minimum OCR confidence before flagging REVIEW_REQUIRED */
export const MIN_CONFIDENCE_THRESHOLD = 0.75;

/** Maximum image upload size in bytes (10 MB) */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed image formats */
export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Sync retry settings */
export const SYNC_RETRY_MAX = 5;
export const SYNC_RETRY_DELAY_MS = 5000;

/** Token expiration */
export const ACCESS_TOKEN_EXPIRY_SEC = 3600;      // 1 hour
export const REFRESH_TOKEN_EXPIRY_SEC = 604800;    // 7 days

/** App version string for device metadata */
export const APP_VERSION = '0.1.0';
