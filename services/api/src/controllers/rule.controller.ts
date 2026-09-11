import { Request, Response } from 'express';
import { z } from 'zod';
import { Severity } from '@slm/shared';
import { createRule, getRuleByIdAndVersion, listRules } from '../services/rule.service';
import { sendSuccess, sendError } from '../middleware/response';

const CreateRuleSchema = z.object({
  ruleId: z.string().min(1, 'Rule ID is required'),
  version: z.string().min(1, 'Version is required'),
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.nativeEnum(Severity),
  enabled: z.boolean().default(true),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum([
      'exists',
      'missing',
      'equals',
      'not_equals',
      'contains',
      'regex',
      'less_than',
      'greater_than',
      'length_less_than',
      'length_greater_than',
    ]),
    value: z.any().optional(),
    message: z.string(),
  })),
});

export async function createRuleHandler(req: Request, res: Response): Promise<void> {
  const parseResult = CreateRuleSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid rule definition', 400, {
      errors: parseResult.error.issues,
    });
    return;
  }

  try {
    const rule = await createRule(parseResult.data);
    sendSuccess(res, { rule }, 201);
  } catch (err: any) {
    console.error('[RULE] Error creating rule:', err);
    sendError(res, 'INTERNAL_ERROR', 'Failed to create rule', 500);
  }
}

export async function getRuleByIdAndVersionHandler(req: Request, res: Response): Promise<void> {
  const { ruleId, version } = req.params;
  const rule = await getRuleByIdAndVersion(ruleId, version);
  if (!rule) {
    sendError(res, 'NOT_FOUND', 'Rule not found', 404);
    return;
  }
  sendSuccess(res, { rule });
}

export async function listRulesHandler(req: Request, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const enabledOnly = req.query.all === 'true' ? false : true;

  const rules = await listRules(category, enabledOnly);
  sendSuccess(res, { rules });
}
