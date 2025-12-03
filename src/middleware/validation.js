const { AppError } = require('./errorHandler');

// Validate Ethereum address
const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate Ethereum private key
const isValidPrivateKey = (key) => {
    return /^(0x)?[a-fA-F0-9]{64}$/.test(key);
};

// Validate transaction hash
const isValidTxHash = (hash) => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

// Sanitize string input
const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

// Validate and sanitize address
const validateAddress = (req, res, next) => {
    const { address } = req.body;

    if (!address) {
        throw new AppError('Address is required', 400);
    }

    if (!isValidAddress(address)) {
        throw new AppError('Invalid Ethereum address format', 400);
    }

    req.body.address = address.toLowerCase();
    next();
};

// Validate transaction data
const validateTransaction = (req, res, next) => {
    const { to, value, data } = req.body;

    if (!to) {
        throw new AppError('Recipient address (to) is required', 400);
    }

    if (!isValidAddress(to)) {
        throw new AppError('Invalid recipient address format', 400);
    }

    if (value !== undefined) {
        const valueNum = parseFloat(value);
        if (isNaN(valueNum) || valueNum < 0) {
            throw new AppError('Invalid transaction value', 400);
        }
    }

    if (data && typeof data !== 'string') {
        throw new AppError('Transaction data must be a string', 400);
    }

    req.body.to = to.toLowerCase();
    next();
};

// Validate contract deployment
const validateContractDeploy = (req, res, next) => {
    const { abi, bytecode } = req.body;

    if (!abi) {
        throw new AppError('Contract ABI is required', 400);
    }

    if (!bytecode) {
        throw new AppError('Contract bytecode is required', 400);
    }

    try {
        JSON.parse(typeof abi === 'string' ? abi : JSON.stringify(abi));
    } catch (error) {
        throw new AppError('Invalid ABI format', 400);
    }

    if (typeof bytecode !== 'string' || !bytecode.startsWith('0x')) {
        throw new AppError('Invalid bytecode format', 400);
    }

    next();
};

// Validate query parameters
const validateQueryParams = (allowedParams) => {
    return (req, res, next) => {
        const queryKeys = Object.keys(req.query);
        const invalidParams = queryKeys.filter(key => !allowedParams.includes(key));

        if (invalidParams.length > 0) {
            throw new AppError(`Invalid query parameters: ${invalidParams.join(', ')}`, 400);
        }

        next();
    };
};

// Validate request body fields
const validateFields = (requiredFields, optionalFields = []) => {
    return (req, res, next) => {
        const bodyKeys = Object.keys(req.body);
        const allowedFields = [...requiredFields, ...optionalFields];

        // Check for missing required fields
        const missingFields = requiredFields.filter(field => !bodyKeys.includes(field));
        if (missingFields.length > 0) {
            throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
        }

        // Check for unexpected fields
        const unexpectedFields = bodyKeys.filter(key => !allowedFields.includes(key));
        if (unexpectedFields.length > 0) {
            throw new AppError(`Unexpected fields: ${unexpectedFields.join(', ')}`, 400);
        }

        next();
    };
};

// Type validation
const validateTypes = (schema) => {
    return (req, res, next) => {
        for (const [field, expectedType] of Object.entries(schema)) {
            const value = req.body[field];

            if (value === undefined) continue;

            const actualType = typeof value;

            if (expectedType === 'array' && !Array.isArray(value)) {
                throw new AppError(`Field '${field}' must be an array`, 400);
            } else if (expectedType !== 'array' && actualType !== expectedType) {
                throw new AppError(`Field '${field}' must be of type ${expectedType}`, 400);
            }
        }

        next();
    };
};

module.exports = {
    isValidAddress,
    isValidPrivateKey,
    isValidTxHash,
    sanitizeString,
    validateAddress,
    validateTransaction,
    validateContractDeploy,
    validateQueryParams,
    validateFields,
    validateTypes
};
