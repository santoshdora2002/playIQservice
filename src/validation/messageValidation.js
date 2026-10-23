function validateMessageInput(body) {
  const errors = [];
  const value = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      valid: false,
      errors: ['Request body must be a JSON object'],
      value,
    };
  }

  for (const field of ['phoneNumber', 'message']) {
    if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
      errors.push(`${field} must be a non-empty string`);
    } else {
      value[field] = body[field].trim();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    value,
  };
}

module.exports = {
  validateMessageInput,
};
