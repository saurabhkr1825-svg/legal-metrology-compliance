import pool from '../index';
import { Severity } from '@slm/shared';
import { createRule, getRuleByIdAndVersion } from '../../services/rule.service';

/**
 * Standard Legal Metrology compliance rules seed data.
 * Run: npm run seed:rules (or ts-node src/db/seeds/default-rules.ts)
 */

export const DEFAULT_RULES = [
  {
    ruleId: 'LM-001',
    version: '1.0',
    category: 'Mandatory Declarations',
    name: 'Maximum Retail Price (MRP) Declaration',
    description: 'Packaged commodity must prominently display Maximum Retail Price inclusive of all taxes.',
    severity: Severity.CRITICAL,
    enabled: true,
    conditions: [
      {
        field: 'mrp',
        operator: 'exists' as const,
        message: 'MRP declaration is missing from package.',
      },
    ],
  },
  {
    ruleId: 'LM-002',
    version: '1.0',
    category: 'Mandatory Declarations',
    name: 'Net Quantity Declaration',
    description: 'Net quantity must be declared with standard metric units.',
    severity: Severity.CRITICAL,
    enabled: true,
    conditions: [
      {
        field: 'netQuantity',
        operator: 'exists' as const,
        message: 'Net quantity declaration is missing.',
      },
      {
        field: 'netQuantityUnit',
        operator: 'exists' as const,
        message: 'Standard metric unit for net quantity is missing.',
      },
    ],
  },
  {
    ruleId: 'LM-003',
    version: '1.0',
    category: 'Manufacturer & Packer Information',
    name: 'Name and Address of Manufacturer/Packer',
    description: 'Name and complete address of the manufacturer or packer must be stated clearly.',
    severity: Severity.HIGH,
    enabled: true,
    conditions: [
      {
        field: 'manufacturerName',
        operator: 'exists' as const,
        message: 'Manufacturer name is missing.',
      },
      {
        field: 'manufacturerAddress',
        operator: 'exists' as const,
        message: 'Manufacturer address is missing.',
      },
    ],
  },
  {
    ruleId: 'LM-004',
    version: '1.0',
    category: 'Date Declarations',
    name: 'Month and Year of Manufacture/Packing',
    description: 'Month and year of manufacture or packing must be declared.',
    severity: Severity.HIGH,
    enabled: true,
    conditions: [
      {
        field: 'manufactureDate',
        operator: 'exists' as const,
        message: 'Date of manufacture or packing is missing.',
      },
    ],
  },
  {
    ruleId: 'LM-005',
    version: '1.0',
    category: 'Consumer Redressal',
    name: 'Consumer Care Contact Details',
    description: 'Contact details (phone, email, or postal address) for consumer grievance redressal.',
    severity: Severity.HIGH,
    enabled: true,
    conditions: [
      {
        field: 'consumerCare',
        operator: 'exists' as const,
        message: 'Consumer care contact information is missing.',
      },
    ],
  },
  {
    ruleId: 'LM-006',
    version: '1.0',
    category: 'Pricing Transparency',
    name: 'Unit Sale Price Declaration',
    description: 'Unit sale price (price per gram/kg/ml/litre/number) must be declared where applicable.',
    severity: Severity.MEDIUM,
    enabled: true,
    conditions: [
      {
        field: 'unitSalePrice',
        operator: 'exists' as const,
        message: 'Unit sale price declaration is missing.',
      },
    ],
  },
];

export async function seedDefaultRules() {
  console.log('[SEED] Seeding default Legal Metrology compliance rules...');

  for (const ruleData of DEFAULT_RULES) {
    try {
      const existing = await getRuleByIdAndVersion(ruleData.ruleId, ruleData.version);
      if (existing) {
        console.log(`[SEED] Rule ${ruleData.ruleId} v${ruleData.version} already exists, skipping.`);
        continue;
      }

      const rule = await createRule(ruleData);
      console.log(`[SEED] Created rule: ${rule.ruleId} v${rule.version} - ${rule.name}`);
    } catch (err) {
      console.error(`[SEED] Failed to create rule ${ruleData.ruleId}:`, err);
    }
  }

  console.log('[SEED] Default rules seeding completed.');
}

if (require.main === module) {
  seedDefaultRules()
    .then(() => {
      console.log('[SEED] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED] Error:', err);
      process.exit(1);
    });
}
