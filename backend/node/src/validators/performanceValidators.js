import Joi from 'joi';

export const createGoalSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'deferred').optional().default('planned'),
  weight: Joi.number().min(0).max(10).optional().default(1),
});

export const updateGoalSchema = Joi.object({
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'deferred').optional(),
  progress: Joi.number().min(0).max(100).optional(),
}).min(1);

export const createReviewSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  periodStart: Joi.date().iso().optional(),
  periodEnd: Joi.date().iso().optional(),
  overallRating: Joi.number().min(0).max(5).optional().default(0),
  summary: Joi.string().max(2000).optional().allow(''),
  status: Joi.string().valid('draft', 'submitted', 'acknowledged').optional().default('draft'),
});

export const addFeedbackSchema = Joi.object({
  comment: Joi.string().min(1).max(2000).required(),
  sentiment: Joi.string().valid('positive', 'neutral', 'negative').optional(),
});
