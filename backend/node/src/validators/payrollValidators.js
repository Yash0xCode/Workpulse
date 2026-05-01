import Joi from 'joi';

export const createRunSchema = Joi.object({
  periodYear: Joi.number().integer().min(2000).max(2100).required(),
  periodMonth: Joi.number().integer().min(1).max(12).required(),
  payDate: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional(),
});

export const upsertEntrySchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  employeeName: Joi.string().max(255).optional(),
  department: Joi.string().max(120).optional(),
  grossPay: Joi.number().min(0).required(),
  deductions: Joi.number().min(0).optional().default(0),
  components: Joi.object().optional(),
});

export const salaryStructureSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  effectiveDate: Joi.date().iso().optional(),
  basic: Joi.number().min(0).required(),
  hra: Joi.number().min(0).optional().default(0),
  transportAllowance: Joi.number().min(0).optional().default(0),
  medicalAllowance: Joi.number().min(0).optional().default(0),
  otherAllowances: Joi.number().min(0).optional().default(0),
  pfDeduction: Joi.number().min(0).optional().default(0),
  taxDeduction: Joi.number().min(0).optional().default(0),
  otherDeductions: Joi.number().min(0).optional().default(0),
});
