// backend/utils/validators.js
// Reusable validation helpers used by route handlers and tested directly.

/**
 * Returns true if value is a non-empty string (after trimming).
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Returns true if value is a finite number greater than zero.
 */
function isPositiveNumber(value) {
  return typeof value === 'number' && isFinite(value) && value > 0;
}

/**
 * Returns true if value is within the allowed string maxLength.
 */
function isWithinLength(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength;
}

/**
 * Returns true if value is one of the allowed priority strings.
 */
function isValidPriority(value) {
  return ['low', 'medium', 'high'].includes(value);
}

/**
 * Returns true if value is a non-empty string AND within maxLength.
 */
function isValidName(value, maxLength = 100) {
  return isNonEmptyString(value) && isWithinLength(value, maxLength);
}

module.exports = {
  isNonEmptyString,
  isPositiveNumber,
  isWithinLength,
  isValidPriority,
  isValidName,
};