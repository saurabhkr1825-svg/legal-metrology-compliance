import { InspectionStatus, VALID_STATUS_TRANSITIONS } from '@slm/shared';

describe('Inspection State Machine Validation', () => {
  function isValidTransition(from: InspectionStatus, to: InspectionStatus): boolean {
    const allowed = VALID_STATUS_TRANSITIONS[from];
    return allowed.includes(to);
  }

  describe('Allowed Transitions', () => {
    it('should allow DRAFT -> PENDING_UPLOAD', () => {
      expect(isValidTransition(InspectionStatus.DRAFT, InspectionStatus.PENDING_UPLOAD)).toBe(true);
    });

    it('should allow PENDING_UPLOAD -> QUEUED', () => {
      expect(isValidTransition(InspectionStatus.PENDING_UPLOAD, InspectionStatus.QUEUED)).toBe(true);
    });

    it('should allow QUEUED -> PROCESSING', () => {
      expect(isValidTransition(InspectionStatus.QUEUED, InspectionStatus.PROCESSING)).toBe(true);
    });

    it('should allow PROCESSING -> REVIEW_REQUIRED', () => {
      expect(isValidTransition(InspectionStatus.PROCESSING, InspectionStatus.REVIEW_REQUIRED)).toBe(true);
    });

    it('should allow PROCESSING -> COMPLETED', () => {
      expect(isValidTransition(InspectionStatus.PROCESSING, InspectionStatus.COMPLETED)).toBe(true);
    });

    it('should allow REVIEW_REQUIRED -> COMPLETED', () => {
      expect(isValidTransition(InspectionStatus.REVIEW_REQUIRED, InspectionStatus.COMPLETED)).toBe(true);
    });

    it('should allow COMPLETED -> SYNCED', () => {
      expect(isValidTransition(InspectionStatus.COMPLETED, InspectionStatus.SYNCED)).toBe(true);
    });
  });

  describe('Forbidden Transitions', () => {
    it('should reject DRAFT -> COMPLETED (cannot skip processing)', () => {
      expect(isValidTransition(InspectionStatus.DRAFT, InspectionStatus.COMPLETED)).toBe(false);
    });

    it('should reject DRAFT -> PROCESSING', () => {
      expect(isValidTransition(InspectionStatus.DRAFT, InspectionStatus.PROCESSING)).toBe(false);
    });

    it('should reject SYNCED -> any status (terminal state)', () => {
      for (const status of Object.values(InspectionStatus)) {
        expect(isValidTransition(InspectionStatus.SYNCED, status)).toBe(false);
      }
    });

    it('should reject COMPLETED -> PROCESSING (cannot go backward)', () => {
      expect(isValidTransition(InspectionStatus.COMPLETED, InspectionStatus.PROCESSING)).toBe(false);
    });
  });
});
