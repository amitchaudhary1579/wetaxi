var debug = require('debug')('x-code:v1:controllers:driver'),
    moment = require('moment'),
    jwt = require('jsonwebtoken'),
    async = require('async'),
    path = require('path'),
    shortid = require('shortid'),
    _ = require('underscore'),
    config = rootRequire('config/global'),

    /** Database Connections */
    //Mongoose library for query purose in MogoDB
    mongoose = require('mongoose'),

    //Redis
    // redis = require('redis'),
    // rdsServer = redis.createClient(config.redis),
    // geo = require('georedis').initialize(rdsServer),

    //Database Schemas (MongoDB)
    // DriverSchema = require('../models/driver'),
    PassengerSchema = require('../models/passenger'),
    SystemSettingsSchema = require('../models/systemSettings'),
    LanguageSchema = require('../models/language'),

    // Custom services/helpers
    DS = rootRequire('services/date'),
    ED = rootRequire('services/encry_decry'),
    CONSTANTS = rootRequire('config/constant'),

    //Cron Scheduler
    schedule = require('node-schedule'),

    //Push notification
    pn = require('../../../support/push-notifications/pn'),

    //Supports
    Uploader = rootRequire('support/uploader'),
    Mailer = rootRequire('support/mailer'); // date services

var message = rootRequire('config/messages/en');

var fs = require('fs');
var https = require('https');
//Node.js Function to save image from External URL.

var _self = {

    /************************************************
     * ::: Passanger APIs :::
     * all apis related to mostly users are placd here
     *************************************************/
    /**
     * Common functions
     */
    test: function(req, res) {

        return res.sendToEncode({
            status_code: 200,
            message: "Success!",
            data: {
                "Test": process.env.MONGO_URL
            }
        });
    },
    getUniqueId: function(callback) {
        async.waterfall([
            function(nextCall) {
                SystemSettingsSchema.findOneAndUpdate({}, {
                        $inc: {
                            "uniqueID": 1
                        }
                    }, {
                        upsert: true,
                        new: true,
                    },
                    function(err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG'
                            });
                        }
                        nextCall(null, updateData.uniqueID)
                    });
            }
        ], function(err, response) {
            callback(err, response);
        })
    },
    saveImageToDisk: function(url, localPath) {

        var file = fs.createWriteStream(localPath);
        var request = https.get(url, function(response) {
            response.pipe(file);
        });
    },
    bookRequest: function(req, res) {
        async.waterfall([
                /** get formData */
                function(nextCall) {
                    req.checkBody('latitude', 'LATITUDE_REQUIRED').notEmpty();
                    req.checkBody('longitude', 'LONGITUDE_REQUIRED').notEmpty();
                    req.checkBody('requestedVehicleTypeId', 'VEHICLE_ID_REQUIRED').notEmpty();

                    var error = req.validationErrors();

                    if (error && error.length) {
                        return nextCall({
                            code: 401,
                            message: error[0].msg
                        });
                    }
                    nextCall(null, req.body);
                },

                /** get passenger details */
                function(body, nextCall) {
                    PassengerSchema.findOne({
                        _id: req.user._id
                    }).exec(function(err, passenger) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG'
                            })
                        } else if (!passenger) {
                            return nextCall({
                                "message": 'PASSENGER_NOT_FOUND'
                            })
                        } else {
                            nextCall(null, body, passenger)
                        }
                    })
                },
            ],
            function(err, response) {
                if (err) {
                    return res.sendToEncode({
                        status_code: err.code ? err.code : 400,
                        message: (err && err.message) || 'SOMETHING_WENT_WRONG',
                        data: {}
                    });
                }
                return res.sendToEncode({
                    status_code: 200,
                    message: 'SUCCESS',
                    data: response
                });
            });
    },


};
module.exports = _self;