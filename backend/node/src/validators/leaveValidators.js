import Joi from 'joi';

export const createLeaveSchema = Joi.object({
  leaveType: Joi.string().min(2).max(40).required(),
  fromDate: Joi.date().iso().required(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
  reason: Joi.string().max(500).optional(),
});

export const approveLeaveSchema = Joi.object({
  comments: Joi.string().max(500).optional(),
});

export const rejectLeaveSchema = Joi.object({
  comments: Joi.string().min(1).max(500).required(),
});
