import * as db from '../src/db';
import { Severity } from '@slm/shared';
import { createRule, getRuleByIdAndVersion, listRules } from '../src/services/rule.service';

describe('Legal Metrology Rules Service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a compliance rule', async () => {
    const mockRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      rule_id: 'LM-001',
      version: '1.0',
      category: 'Mandatory Declarations',
      name: 'MRP Declaration',
      description: 'Must declare MRP',
      severity: 'CRITICAL',
      enabled: true,
      conditions: [{ field: 'mrp', operator: 'exists', message: 'MRP missing' }],
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [mockRow],
      rowCount: 1,
    } as any);

    const rule = await createRule({
      ruleId: 'LM-001',
      version: '1.0',
      category: 'Mandatory Declarations',
      name: 'MRP Declaration',
      description: 'Must declare MRP',
      severity: Severity.CRITICAL,
      conditions: [{ field: 'mrp', operator: 'exists', message: 'MRP missing' }],
    });

    expect(rule.ruleId).toBe('LM-001');
    expect(rule.severity).toBe(Severity.CRITICAL);
    expect(rule.conditions.length).toBe(1);
  });

  it('should retrieve a rule by ID and version', async () => {
    const mockRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      rule_id: 'LM-001',
      version: '1.0',
      category: 'Mandatory Declarations',
      name: 'MRP Declaration',
      description: 'Must declare MRP',
      severity: 'CRITICAL',
      enabled: true,
      conditions: [{ field: 'mrp', operator: 'exists', message: 'MRP missing' }],
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [mockRow],
      rowCount: 1,
    } as any);

    const rule = await getRuleByIdAndVersion('LM-001', '1.0');
    expect(rule).not.toBeNull();
    expect(rule?.ruleId).toBe('LM-001');
  });

  it('should list rules filtered by category', async () => {
    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [
        {
          rule_id: 'LM-001',
          version: '1.0',
          category: 'Mandatory Declarations',
          name: 'MRP Declaration',
          description: 'Must declare MRP',
          severity: 'CRITICAL',
          enabled: true,
          conditions: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      rowCount: 1,
    } as any);

    const rules = await listRules('Mandatory Declarations');
    expect(rules.length).toBe(1);
    expect(rules[0].ruleId).toBe('LM-001');
  });
});
