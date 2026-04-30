import { ValidationError } from '../utils/errors.js';

/**
 * Factory that returns Express middleware which validates req.body against a Joi schema.
 * Usage: router.post('/', validateRequest(mySchema), controller)
 */
export const validateRequest = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = {};
    error.details.forEach((d) => {
      const key = d.path.join('.');
      details[key] = d.message.replace(/['"]/g, '');
    });
    return next(new ValidationError('Validation failed', details));
  }

  req.body = value;
  return next();
};
