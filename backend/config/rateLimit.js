
const rateLimit = require('express-rate-limit');

const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,

    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },

    standardHeaders: 'draft-8',
    legacyHeaders: false
});

module.exports = Limiter;
