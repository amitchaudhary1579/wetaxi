var debug = require('debug')('x-code:v1:policies'),
    jwt = require('jsonwebtoken'),
    DriverSchema = require('../models/driver'),
    mongoose = require('mongoose'),
    config = rootRequire('config/global');

module.exports = function (req, res, next) {
    if (!config.jwtTokenVerificationEnable) {
        // skip user verification
        console.log('here');
        return next();
    }

    if (!req.headers || !req.headers['access-token']) {
        //Send Unauthorized response
        return res.status(401).json({
            status_code: 401,
            message: 'Invalid Access!'
        });
    }

    // Get token from headers
    var reqToken = req.headers ? req.headers['access-token'] : '';
    // verify a token symmetric

    jwt.verify(reqToken, config.secret, function (err, decoded) {
        if (err) {
            //Send Unauthorized response
            return res.status(406).json({
                status_code: 406,
                message: err.message
            });
        } else if (decoded && decoded._id) { // user data
            DriverSchema.findOne({
                "_id": mongoose.Types.ObjectId(decoded._id),
                "deviceDetail.token": decoded.deviceToken
            }, function (err, user) {
                if (err) {
                    next();
                }
                if (!user) {
                    return res.status(401).json({
                        status_code: 401,
                        message: "Session Expired!"
                    });
                } else {
                    req.user = user;
                }
                console.log('here');
                next();
            });
        } else {
            //Send Unauthorized response
            return res.status(401).json({
                status_code: 403,
                message: 'Something went wrong. Try again later.'
            });
        }
    });
};