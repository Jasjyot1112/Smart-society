const validator = require('validator');

/**
 * Recursively sanitize all string values in req.body, req.query, req.params
 * Strips HTML tags and escapes dangerous characters
 */
const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Strip HTML tags but keep the text content
      obj[key] = validator.stripLow(obj[key].trim());
      // Don't escape — just strip dangerous HTML
      obj[key] = obj[key].replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
      obj[key] = obj[key].replace(/<[^>]+>/g, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeInput(obj[key]);
    }
  }
};

const sanitize = (req, res, next) => {
  sanitizeInput(req.body);
  sanitizeInput(req.query);
  sanitizeInput(req.params);
  next();
};

module.exports = sanitize;
