/**
 * Generic request body validation middleware factory.
 * @param {string[]} requiredFields — array of field names that must be present in req.body
 */
const validate = (requiredFields) => {
    return (req, res, next) => {
        const missing = requiredFields.filter((field) => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missing.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                fields: missing,
            });
        }

        next();
    };
};

export default validate;
