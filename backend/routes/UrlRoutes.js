const express = require('express');

const router = express.Router();
const Limiter = require('../config/rateLimit');

const {createShortUrl,redirectToOriginalUrl,getShortUrl} = require('../controllers/UrlController');

router.post('/shorten', Limiter, createShortUrl);
router.get('/:shortCode', redirectToOriginalUrl);
router.get('/shorturl/:shortCode', getShortUrl);

module.exports = router;