var debug = require('debug')('x-code:v1:policies:decode'),
    jwt = require('jsonwebtoken'),

    // Driver = require('../models/driver'),

    config = rootRequire('config/global'),
    AESCrypt = rootRequire('services/aes');

module.exports = function (req, res, next) {

    // debug('Body:', req.body, req.query, req.sourceOfRequest);

    // skip request
    if (req.url.indexOf('/verify/') > -1 && req.method == 'GET') {
        return next();
    } else if (req.url.indexOf('/reset/') > -1 && (req.method == 'GET' || req.method == 'POST')) {
        return next();
    } else if (req.url.indexOf('/setpassword/') > -1 && (req.method == 'GET' || req.method == 'POST')) {
        return next();
    } else if (req.method == 'POST' && req.headers && req.headers['content-type'] && req.headers['content-type'].indexOf('multipart') > -1) {
        return next();
    }

    // skip to decode code for web request for development
    if (req.sourceOfRequest == 'web') {
        return next();
    }

    // skip to decode code
    if (!config.cryptoEnable) {
        return next();
    }

    if (req.body.encoded) {
        try {
            var dec = AESCrypt.decrypt(req.body.encoded);
            req.body = JSON.parse(dec);
        } catch (err) {
            return res.status(400).json({ status: 0, message: 'Failed to decode data.' });
        }

        next();
    } else if (req.query.encoded) {

        try {
            var dec = AESCrypt.decrypt(req.query.encoded);
        } catch (err) {
            return res.status(400).json({ status: 0, message: 'Failed to decode data.' });
        }
        req.query = JSON.parse(dec);

        next();
    }
    else {
        // next();
        res.status(400).json({ status: 0, message: 'Request is not autherized.' });
    }

};
