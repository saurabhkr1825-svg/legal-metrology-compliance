import {
  InspectionStatus,
  VALID_STATUS_TRANSITIONS,
  UserRole,
  InspectionResult,
  Severity,
  AuditAction,
} from '@slm/shared';

describe('Domain Contracts', () => {
  describe('InspectionStatus', () => {
    it('should define all required statuses', () => {
      const statuses = Object.values(InspectionStatus);
      expect(statuses).toContain('DRAFT');
      expect(statuses).toContain('PENDING_UPLOAD');
      expect(statuses).toContain('QUEUED');
      expect(statuses).toContain('PROCESSING');
      expect(statuses).toContain('REVIEW_REQUIRED');
      expect(statuses).toContain('COMPLETED');
      expect(statuses).toContain('SYNCED');
      expect(statuses).toHaveLength(7);
    });

    it('should define valid transitions from DRAFT', () => {
      expect(VALID_STATUS_TRANSITIONS[InspectionStatus.DRAFT]).toEqual([
        InspectionStatus.PENDING_UPLOAD,
      ]);
    });

    it('should define valid transitions from PENDING_UPLOAD', () => {
      expect(VALID_STATUS_TRANSITIONS[InspectionStatus.PENDING_UPLOAD]).toEqual([
        InspectionStatus.QUEUED,
        InspectionStatus.DRAFT,
      ]);
    });

    it('should define valid transitions from PROCESSING', () => {
      expect(VALID_STATUS_TRANSITIONS[InspectionStatus.PROCESSING]).toEqual([
        InspectionStatus.REVIEW_REQUIRED,
        InspectionStatus.COMPLETED,
      ]);
    });

    it('should define SYNCED as terminal (no outgoing transitions)', () => {
      expect(VALID_STATUS_TRANSITIONS[InspectionStatus.SYNCED]).toEqual([]);
    });

    it('should have a transition entry for every status', () => {
      for (const status of Object.values(InspectionStatus)) {
        expect(VALID_STATUS_TRANSITIONS).toHaveProperty(status);
      }
    });
  });

  describe('UserRole', () => {
    it('should define FIELD_OFFICER, SUPERVISOR, ADMIN', () => {
      expect(Object.values(UserRole)).toEqual([
        'FIELD_OFFICER',
        'SUPERVISOR',
        'ADMIN',
      ]);
    });
  });

  describe('InspectionResult', () => {
    it('should define PASS, FAIL, REVIEW', () => {
      expect(Object.values(InspectionResult)).toEqual([
        'PASS',
        'FAIL',
        'REVIEW',
      ]);
    });
  });

  describe('Severity', () => {
    it('should define CRITICAL, HIGH, MEDIUM, LOW', () => {
      expect(Object.values(Severity)).toEqual([
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW',
      ]);
    });
  });

  describe('AuditAction', () => {
    it('should cover all core audit events', () => {
      const actions = Object.values(AuditAction);
      expect(actions).toContain('USER_LOGIN');
      expect(actions).toContain('INSPECTION_CREATED');
      expect(actions).toContain('INSPECTION_REVIEWED');
      expect(actions).toContain('RULE_UPDATED');
      expect(actions.length).toBeGreaterThanOrEqual(10);
    });
  });
});
