import { query } from '../db';
import { Rule, Severity, RuleCondition } from '@slm/shared';

export interface CreateRuleData {
  ruleId: string;
  version: string;
  category: string;
  name: string;
  description: string;
  severity: Severity;
  enabled?: boolean;
  conditions: RuleCondition[];
}

function mapRowToRule(row: any): Rule {
  return {
    ruleId: row.rule_id,
    version: row.version,
    category: row.category,
    name: row.name,
    description: row.description,
    severity: row.severity as Severity,
    enabled: row.enabled,
    conditions: row.conditions || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRule(data: CreateRuleData): Promise<Rule> {
  const res = await query(
    `INSERT INTO rules (rule_id, version, category, name, description, severity, enabled, conditions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.ruleId.trim(),
      data.version.trim(),
      data.category.trim(),
      data.name.trim(),
      data.description.trim(),
      data.severity,
      data.enabled ?? true,
      JSON.stringify(data.conditions),
    ]
  );

  return mapRowToRule(res.rows[0]);
}

export async function getRuleByIdAndVersion(ruleId: string, version: string): Promise<Rule | null> {
  const res = await query('SELECT * FROM rules WHERE rule_id = $1 AND version = $2', [ruleId, version]);
  if (res.rows.length === 0) return null;
  return mapRowToRule(res.rows[0]);
}

export async function listRules(category?: string, enabledOnly: boolean = true): Promise<Rule[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (enabledOnly) {
    conditions.push('enabled = true');
  }

  if (category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(category);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await query(`SELECT * FROM rules ${whereClause} ORDER BY category ASC, rule_id ASC`, params);

  return res.rows.map(mapRowToRule);
}
