var debug = require('debug')('x-code:v1:policies'),
    PassengerSchema = require('../models/passenger'),
    mongoose = require('mongoose'),
    config = rootRequire('config/global');

module.exports = function (req, res, next) {
    if (!config.jwtTokenVerificationEnable) { // skip user verification
        next();
    }

    // if id not found
    if (!req.user || (req.user && !req.user._id)) {
        return res.status(401).json({
            status: 0,
            message: "Invalid user."
        }); // send unauthorized response
    }

    // check into db user exists or not
    PassengerSchema
        .findOne({
            _id: mongoose.Types.ObjectId(req.user._id)
        })
        .lean()
        .exec(function (err, user) {
            if (err) {
                return res.status(500).json({
                    status: 0,
                    message: "Server error"
                }); // send server error
            }
            if (!user) { // if not found user for this id
                return res.status(401).json({
                    status: 0,
                    message: "Invalid user."
                }); // send unauthorized response
            }
            req.user = user; // store user in request parameter
        });
    // OR
    next();
};