import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  organizationName: Joi.string().min(2).max(200).optional(),
  organizationType: Joi.string().valid('corporate', 'education').optional(),
  role: Joi.string()
    .valid(
      'super_admin', 'hr_manager', 'department_manager',
      'employee', 'recruiter', 'institute_admin', 'faculty',
      'student', 'placement_officer',
    )
    .optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
