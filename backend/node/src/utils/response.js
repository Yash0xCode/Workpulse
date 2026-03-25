/**
 * Standard API Response Wrapper
 * Follows enterprise HRMS patterns (Frappe, OrangeHRM)
 */

export class ApiResponse {
  static success(data, meta = {}) {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        ...meta,
      },
    };
  }

  static error(code, message, details = {}, statusCode = 400) {
    return {
      statusCode,
      response: {
        success: false,
        error: {
          code,
          message,
          details,
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      },
    };
  }

  static paginated(data, page, limit, total) {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}

export const sendSuccess = (res, data, meta = {}, statusCode = 200) => {
  res.status(statusCode).json(ApiResponse.success(data, meta));
};

export const sendError = (res, code, message, details = {}, statusCode = 400) => {
  const error = ApiResponse.error(code, message, details, statusCode);
  res.status(error.statusCode).json(error.response);
};

export const sendPaginated = (res, data, page, limit, total, statusCode = 200) => {
  res.status(statusCode).json(ApiResponse.paginated(data, page, limit, total));
};
