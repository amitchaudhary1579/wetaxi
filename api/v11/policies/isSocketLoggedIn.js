var debug = require('debug')('x-code:v1:policies'),
    DriverSchema = require('../models/driver'),
    PassengerSchema = require('../models/passenger'),
    mongoose = require('mongoose');

module.exports = function (socket, nsp, io) {
    return (data, CB) => {
        if (socket.userInfo && socket.userInfo.type == 'driver') {
            DriverSchema.findOne({
                "_id": mongoose.Types.ObjectId(socket.userInfo._id),
                "deviceDetail.token": socket.userInfo.deviceToken
            }, function (err, user) {
                if (err) {
                    //Send Unauthorized response
                    return CB({
                        status: 403,
                        message: (err && err.message) || 'Something went wrong. Try again later.'
                    })
                }
                if (!user) {
                    return CB({
                        status: 401,
                        message: (err && err.message) || 'Session Expired!'
                    })
                } else {
                    next();
                }
            });
        } else if (socket.userInfo && socket.userInfo.type == 'passenger') {
            PassengerSchema.findOne({
                "_id": mongoose.Types.ObjectId(socket.userInfo._id),
                "deviceDetail.token": socket.userInfo.deviceToken
            }, function (err, user) {
                if (err) {
                    //Send Unauthorized response
                    return CB({
                        status: 401,
                        message: (err && err.message) || 'Something went wrong. Try again later.'
                    })
                }
                if (!user) {
                    return CB({
                        status: 401,
                        message: (err && err.message) || 'Session Expired!'
                    })
                } else {
                    next();
                }
            });
        } else {
            //Send Unauthorized response
            return CB({
                status: 401,
                message: (err && err.message) || 'Something went wrong. Try again later.'
            })
        }
    }

};