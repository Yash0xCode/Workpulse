import Joi from 'joi';

export const createEmployeeSchema = Joi.object({
  userId: Joi.number().integer().optional(),
  employeeCode: Joi.string().max(50).optional(),
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().optional(),
  department: Joi.string().max(120).optional(),
  designation: Joi.string().max(120).optional(),
  role: Joi.string().max(120).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  joiningDate: Joi.date().iso().optional(),
  salary: Joi.number().min(0).optional(),
  managerId: Joi.number().integer().optional(),
  location: Joi.string().max(255).optional(),
  phone: Joi.string().max(50).optional(),
  status: Joi.string().valid('Active', 'Inactive', 'On Leave').optional(),
});

export const updateEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  department: Joi.string().max(120).optional(),
  designation: Joi.string().max(120).optional(),
  role: Joi.string().max(120).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  salary: Joi.number().min(0).optional(),
  managerId: Joi.number().integer().allow(null).optional(),
  location: Joi.string().max(255).optional(),
  phone: Joi.string().max(50).optional(),
  status: Joi.string().valid('Active', 'Inactive', 'On Leave').optional(),
  productivity: Joi.number().min(0).max(100).optional(),
}).min(1);
