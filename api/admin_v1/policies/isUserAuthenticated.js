var debug = require('debug')('x-code:v1:policies'),
    jwt = require('jsonwebtoken'),
    mongoose = require('mongoose'),
    CONSTANTS = rootRequire('config/constant'),
    AdmminSchema = require('../../' + CONSTANTS.API_VERSION + '/models/admin'),
    config = rootRequire('config/global');

module.exports = function (req, res, next) {

    if (!config.jwtTokenVerificationEnable) { // skip token verification
        return next();
    }

    if (!req.headers || !req.headers['authorization']) {

        // Send Unauthorized response
        res.status(406).json({
            status_code: 406,
            message: 'Access Token Required!'
        });
    }

    // Get token from headers
    var reqToken = req.headers ? req.headers['authorization'] : '';

    // verify a token symmetric
    jwt.verify(reqToken, config.secret, function (err, decoded) {

        if (err) {
            // Send Unauthorized response
            return res.status(401).json({
                status_code: 401,
                message: "Your session has expired. Please login again."
            });
        } else if (decoded) { // user data
            if (!decoded._id) {
                return res.status(403).json({
                    status_code: 403,
                    message: "Invalid access token."
                });
            }

            //Store user in request (user)
            // req.user = decoded;
            AdmminSchema.findOne({
                "_id": mongoose.Types.ObjectId(decoded._id)
            }, function (err, adminData) {
                if (err) {
                    next();
                }
                if (!adminData) {
                    return res.status(403).json({
                        status_code: 403,
                        message: "Session Expired! Please login again."
                    });
                }
                req.user = adminData;
                next();
            });
        } else {
            //Send Unauthorized response
            return res.status(401).json({
                status_code: 0,
                message: 'something wrong.'
            });
        }
    });
};