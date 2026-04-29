import Joi from 'joi';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional().allow(''),
  assignee: Joi.string().max(255).optional().allow(''),
  assignedToEmployeeId: Joi.number().integer().optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional().default('Medium'),
  status: Joi.string().valid('backlog', 'in-progress', 'review', 'done').optional().default('backlog'),
  dueDate: Joi.date().iso().optional().allow(null),
  department: Joi.string().max(120).optional().allow(''),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  assignee: Joi.string().max(255).optional().allow(''),
  assignedToEmployeeId: Joi.number().integer().optional().allow(null),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  status: Joi.string().valid('backlog', 'in-progress', 'review', 'done').optional(),
  dueDate: Joi.date().iso().optional().allow(null),
  department: Joi.string().max(120).optional().allow(''),
}).min(1);
