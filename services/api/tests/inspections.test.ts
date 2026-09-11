import * as db from '../src/db';
import { InspectionStatus, InspectionResult } from '@slm/shared';
import {
  createInspection,
  getInspectionById,
  getInspectionByClientUuid,
  listInspections,
  updateInspectionStatus,
  reviewInspection,
} from '../src/services/inspection.service';

describe('Inspection Workflow & Service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Inspection Creation & Idempotency', () => {
    it('should create an inspection record with clientUuid', async () => {
      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_uuid: '550e8400-e29b-41d4-a716-446655440000',
        officer_id: '123e4567-e89b-12d3-a456-426614174001',
        status: InspectionStatus.QUEUED,
        image_url: 'https://storage.example.com/evidence/test.jpg',
        image_metadata: { width: 1920, height: 1080, format: 'jpeg', sizeBytes: 1024, captureMode: 'camera' },
        violations: [],
        captured_at: new Date('2026-09-11T22:00:00.000Z'),
        location: { latitude: 28.6139, longitude: 77.209 },
        notes: 'Test inspection',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(db, 'query').mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      } as any);

      const inspection = await createInspection({
        clientUuid: '550e8400-e29b-41d4-a716-446655440000',
        officerId: '123e4567-e89b-12d3-a456-426614174001',
        status: InspectionStatus.QUEUED,
        imageUrl: 'https://storage.example.com/evidence/test.jpg',
        capturedAt: new Date('2026-09-11T22:00:00.000Z'),
        notes: 'Test inspection',
      });

      expect(inspection.id).toBe(mockRow.id);
      expect(inspection.clientUuid).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(inspection.status).toBe(InspectionStatus.QUEUED);
    });

    it('should find inspection by clientUuid for idempotency check', async () => {
      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_uuid: '550e8400-e29b-41d4-a716-446655440000',
        officer_id: '123e4567-e89b-12d3-a456-426614174001',
        status: InspectionStatus.QUEUED,
        violations: [],
        captured_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(db, 'query').mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      } as any);

      const found = await getInspectionByClientUuid('550e8400-e29b-41d4-a716-446655440000');
      expect(found).not.toBeNull();
      expect(found?.clientUuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Status Transitions & Review', () => {
    it('should update status when transition is valid (QUEUED -> PROCESSING)', async () => {
      const currentInspection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_uuid: '550e8400-e29b-41d4-a716-446655440000',
        officer_id: '123e4567-e89b-12d3-a456-426614174001',
        status: InspectionStatus.QUEUED,
        violations: [],
        captured_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedInspection = {
        ...currentInspection,
        status: InspectionStatus.PROCESSING,
        processed_at: new Date(),
      };

      jest.spyOn(db, 'query')
        .mockResolvedValueOnce({ rows: [currentInspection], rowCount: 1 } as any) // getInspectionById
        .mockResolvedValueOnce({ rows: [updatedInspection], rowCount: 1 } as any) // update query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // audit log

      const result = await updateInspectionStatus({
        inspectionId: currentInspection.id,
        newStatus: InspectionStatus.PROCESSING,
        userId: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(result?.status).toBe(InspectionStatus.PROCESSING);
    });

    it('should reject invalid status transition (DRAFT -> COMPLETED)', async () => {
      const currentInspection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_uuid: '550e8400-e29b-41d4-a716-446655440000',
        officer_id: '123e4567-e89b-12d3-a456-426614174001',
        status: InspectionStatus.DRAFT,
        violations: [],
        captured_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(db, 'query').mockResolvedValue({
        rows: [currentInspection],
        rowCount: 1,
      } as any);

      await expect(
        updateInspectionStatus({
          inspectionId: currentInspection.id,
          newStatus: InspectionStatus.COMPLETED,
          userId: '123e4567-e89b-12d3-a456-426614174001',
        })
      ).rejects.toThrow(/Invalid state transition/);
    });

    it('should complete inspection upon human supervisor review', async () => {
      const currentInspection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_uuid: '550e8400-e29b-41d4-a716-446655440000',
        officer_id: '123e4567-e89b-12d3-a456-426614174001',
        status: InspectionStatus.REVIEW_REQUIRED,
        violations: [],
        captured_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const completedInspection = {
        ...currentInspection,
        status: InspectionStatus.COMPLETED,
        result: InspectionResult.PASS,
        reviewed_declaration: { mrp: { value: '100', confidence: 1.0, source: 'corrected' } },
        reviewed_at: new Date(),
        completed_at: new Date(),
      };

      jest.spyOn(db, 'query')
        .mockResolvedValueOnce({ rows: [currentInspection], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [completedInspection], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // audit log

      const result = await reviewInspection({
        inspectionId: currentInspection.id,
        reviewerId: 'supervisor-uuid',
        reviewedDeclaration: { mrp: { value: '100', confidence: 1.0, source: 'corrected' } },
        result: InspectionResult.PASS,
        notes: 'Approved after verification',
      });

      expect(result?.status).toBe(InspectionStatus.COMPLETED);
      expect(result?.result).toBe(InspectionResult.PASS);
    });
  });

  describe('Inspection Querying & Filtering', () => {
    it('should query inspections with status and officerId filters', async () => {
      jest.spyOn(db, 'query')
        .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: '1',
              client_uuid: 'uuid-1',
              officer_id: 'officer-1',
              status: InspectionStatus.QUEUED,
              violations: [],
              captured_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
            {
              id: '2',
              client_uuid: 'uuid-2',
              officer_id: 'officer-1',
              status: InspectionStatus.QUEUED,
              violations: [],
              captured_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          rowCount: 2,
        } as any);

      const result = await listInspections({
        officerId: 'officer-1',
        status: InspectionStatus.QUEUED,
      });

      expect(result.total).toBe(2);
      expect(result.items.length).toBe(2);
    });
  });
});
