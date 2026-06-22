/**
 * Map backend validation errors to human-readable messages
 */
const errorMessageMap = {
  idProofType: {
    'enum': 'Please select a valid ID proof type (Aadhaar, PAN, Passport, or Other)',
    'required': 'ID proof type is required',
  },
  idProofNumber: {
    'required': 'ID number is required when ID proof type is selected',
  },
  name: {
    'required': 'Full name is required',
  },
  phone: {
    'required': 'Phone number is required',
    'pattern': 'Phone number must be valid',
  },
  email: {
    'format': 'Please enter a valid email address',
  },
  planId: {
    'required': 'Please select a plan',
  },
  expiryDate: {
    'format': 'Please select a valid date',
  },
};

/**
 * Parse backend validation error and return human-readable message
 * Handles both single errors and validation errors from Mongoose
 */
export function parseError(error) {
  const response = error?.response?.data;

  // Handle validation errors with field details
  if (response?.errors && typeof response.errors === 'object') {
    const fieldErrors = Object.entries(response.errors)
      .map(([field, details]) => {
        if (typeof details === 'string') {
          // Direct error message
          return `${formatFieldName(field)}: ${details}`;
        }
        if (details?.message) {
          // Mongoose validation error
          return formatValidationError(field, details.message);
        }
        return null;
      })
      .filter(Boolean);

    if (fieldErrors.length > 0) {
      return fieldErrors.join('. ');
    }
  }

  // Handle generic Mongoose validation errors
  if (response?.message) {
    const msg = response.message;
    
    // Pattern: "`` is not a valid enum value for path `fieldName`"
    const enumMatch = msg.match(/is not a valid enum value for path `(\w+)`/);
    if (enumMatch) {
      const fieldName = enumMatch[1];
      return errorMessageMap[fieldName]?.enum || 
             `Invalid value for ${formatFieldName(fieldName)}. Please select a valid option.`;
    }

    // Pattern: "Path `fieldName` is required"
    const requiredMatch = msg.match(/Path `(\w+)` is required/);
    if (requiredMatch) {
      const fieldName = requiredMatch[1];
      return errorMessageMap[fieldName]?.required || 
             `${formatFieldName(fieldName)} is required.`;
    }

    // Return the original message if it's user-friendly
    if (!msg.includes('Cast to') && !msg.includes('ObjectId')) {
      return msg;
    }
  }

  // Fallback
  return error?.message || 'Failed to save member';
}

/**
 * Format validation error message
 */
function formatValidationError(field, message) {
  const fieldName = formatFieldName(field);
  
  // Extract error type from message like "enum: ..." or "required: ..."
  const errorType = message.split(':')[0]?.toLowerCase() || 'unknown';
  const customMessage = errorMessageMap[field]?.[errorType];
  
  if (customMessage) {
    return customMessage;
  }

  return `${fieldName}: ${message}`;
}

/**
 * Convert camelCase field names to readable labels
 */
function formatFieldName(field) {
  return field
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}
