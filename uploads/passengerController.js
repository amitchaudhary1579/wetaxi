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
    DriverRideRequestSchema = require('../models/driverRideRequest'),
    PassengerReferralSchema = require('../models/passengerReferrals'),
    PassengerReferralEarningLogs = require('../models/passengerReferralEarningLogs'),
    SystemSettingsSchema = require('../models/systemSettings'),
    LanguageSchema = require('../models/language'),
    WithdrawsSchema = require('../models/withdraws'),
    RewardSchema = require('../models/reward'),
    UniqueCodeSchema = require('../models/uniqueCode'),
    RideSchema = require('../models/ride'),
    ReasonSchema = require('../models/reason'),
    NotificationSchema = require('../models/notification'),
    RideLogsSchema = require('../models/rideLogs'),
    PassengerReferralSchema = require('../models/passengerReferrals'),

    // Custom services/helpers
    DS = rootRequire('services/date'),
    ED = rootRequire('services/encry_decry'),
    CONSTANTS = rootRequire('config/constant'),
    redisClient = rootRequire('support/redis'),

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
const RIDE_REQUEST_TIMEOUT = 20;
//Node.js Function to save image from External URL.

// PassengerSchema.collection.createIndex({
//     location: "2dsphere"
// }, function(err, resp) {});

var _self = {

    /************************************************
     * ::: Passanger APIs :::
     * all apis related to mostly users are placd here
     *************************************************/
    /**
     * Common functions
     */
    test: function (req, res) {
        return res.sendToEncode({
            status_code: 200,
            message: "Success!",
            data: {
                "Test": process.env.MONGO_URL
            }
        });
    },

    getUniqueId: function (callback) {
        async.waterfall([
            function (nextCall) {
                let randomString = Math.random().toString(36).substr(2, 5).toUpperCase();
                UniqueCodeSchema.find({}).exec(function (err, getUniqueData) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        });
                    }
                    if (getUniqueData[0].uniqueID.indexOf(randomString) === -1) {
                        let getUniqueArrayData = getUniqueData[0].uniqueID.push(randomString);
                        let updateData = {
                            "uniqueID": getUniqueData[0].uniqueID
                        }
                        UniqueCodeSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": 'SOMETHING_WENT_WRONG'
                                    });
                                }
                                nextCall(null, randomString)
                            });
                    } else {
                        _self.getUniqueId(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": 'SOMETHING_WENT_WRONG'
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    saveImageToDisk: function (url, localPath) {

        var file = fs.createWriteStream(localPath);
        var request = https.get(url, function (response) {
            response.pipe(file);
        });
    },

    getPassengerAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                passengerAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": 'SOMETHING_WENT_WRONG'
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getPassengerAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": 'SOMETHING_WENT_WRONG'
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    /* --------------------------------------------------\*
     * Check Number   
     * ------------------------------------------------ */
    checkNumber: function (req, res) {
        async.waterfall([
            // Check required params
            function (nextCall) {
                req.checkBody('phoneNumber', 'PHONE_REQUIRED').notEmpty();
                var error = req.validationErrors();

                if (error && error.length) {
                    return nextCall({
                        code: 401,
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            function (body, nextCall) {
                //Check and Update Passenger

                var condition = {
                    "phoneNumber": body.phoneNumber,
                    "isDeleted": false
                };

                PassengerSchema.findOne(condition).lean().exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    }
                    if (!passenger) {
                        return nextCall({
                            "message": 'NUMBER_NOT_REGISTERED'
                        });
                    } else {
                        nextCall(null, passenger);
                    }

                });
            },
            function (passenger, nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        });
                    }
                    if (getSettingData[0]) {
                        passenger.passengerVersionUpdate = getSettingData[0].passengerVersionUpdate
                        nextCall(null, passenger)
                    } else {
                        return nextCall({
                            "message": 'SYSTEM_SETTINGS_NOT_FOUND'
                        })
                    }
                })
            }
        ],
            function (err, response) {
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

    /* --------------------------------------------------\*
     * Login   
     * ------------------------------------------------ */
    login: function (req, res) {
        async.waterfall([
            // Check required params
            function (nextCall) {
                req.checkBody('phoneNumber', 'PHONE_REQUIRED').notEmpty();
                req.checkBody('deviceOs', 'DEVICE_OS_REQUIRED').notEmpty();
                req.checkBody('deviceToken', 'DEVICE_TOKEN_REQUIRED').notEmpty();

                var error = req.validationErrors();

                if (error && error.length) {
                    return nextCall({
                        code: 401,
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            function (body, nextCall) {
                // Check and Update Passenger
                var condition = {
                    "phoneNumber": body.phoneNumber,
                    "isDeleted": false,
                };

                var dataToUpdate = {
                    isOnline: true,
                    deviceDetail: {
                        os: body.deviceOs,
                        token: body.deviceToken
                    }
                };

                if (body.longitude && body.latitude) {
                    dataToUpdate["location.coordinates"] = [Number(body.longitude), Number(body.latitude)];
                }
                if (body.angle) {
                    dataToUpdate["location.angle"] = body.angle ? Number(body.angle) : 0;
                }

                PassengerSchema.findOneAndUpdate(condition, dataToUpdate, {
                    new: true
                })
                    .populate('languageId').exec(function (err, passenger) {
                        if (err) {
                            return nextCall({
                                // "message": 'SOMETHING_WENT_WRONG',
                                "message": err.message,
                            });
                        }
                        if (!passenger) {
                            return nextCall({
                                "message": 'NUMBER_NOT_REGISTERED'
                            });
                        } else {
                            var jwtData = {
                                _id: passenger._id,
                                email: passenger.email,
                                deviceToken: passenger.deviceDetail.token,
                                type: 'passenger'
                            };
                            // create a token
                            var p = passenger.toObject();
                            p.access_token = jwt.sign(jwtData, config.secret, {
                                // expiresIn: config.jwtTokenExpiryTime
                            });
                            p.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                            p.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                            nextCall(null, p);
                        }

                    });
            }
        ],
            function (err, response) {
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

    /* --------------------------------------------------\*
     * Sign UP 
     * ------------------------------------------------ */
    add: function (req, res) {
        async.waterfall([
            /** get formData */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall);
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.name) || (!fields.phoneNumber) || (!fields.dob) || (!fields.deviceOs) || (!fields.deviceToken) || (!fields.language_code)) {
                    return nextCall({
                        "message": 'INVALID_PARAMS'
                    });
                } else {
                    fields.deviceDetail = {
                        os: fields.deviceOs,
                        token: fields.deviceToken
                    };
                    nextCall(null, fields, files);
                }
            },
            /** check email and mobile no already registered or not */
            function (fields, files, nextCall) {
                PassengerSchema.findOne({
                    phoneNumber: fields.phoneNumber,
                    isDeleted: false
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        })
                    } else if (passenger) {
                        return nextCall({
                            "message": 'PASSENGER_ALREADY_REGISTERED'
                        })
                    } else {
                        nextCall(null, fields, files)
                    }
                })
            },

            /** get unique id */
            // function (fields, files, nextCall) {
            //     _self.getUniqueId(function (err, response) {
            //         if (err) {
            //             return nextCall({
            //                 "message": 'SOMETHING_WENT_WRONG'
            //             })
            //         }
            //         fields.uniqueID = 'P-' + response;
            //         nextCall(null, fields, files)
            //     });
            // },


            /** check fb already registered or not */
            function (fields, files, nextCall) {

                if (fields.fbId && fields.isFbLogin && fields.isFbLogin == 'true' && fields.fbImageUrl) {
                    PassengerSchema.findOne({
                        fbId: fields.fbId
                    }).exec(function (err, passenger) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG'
                            })
                        } else if (passenger) {
                            return nextCall({
                                "message": 'PASSENGER_ALREADY_REGISTERED'
                            })
                        } else {
                            var url = fields.fbImageUrl;
                            var filename = DS.getTime() + '.jpg';
                            var thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                            var large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                            _self.saveImageToDisk(url, large_image);
                            _self.saveImageToDisk(url, thumb_image);

                            fields.profilePhoto = filename;
                            nextCall(null, fields, files)
                        }
                    })
                } else {
                    nextCall(null, fields, files)
                }
            },
            /** upload profile picture */
            function (fields, files, nextCall) {
                if (files.profilePhoto) {
                    // skip files except image files
                    if (files.profilePhoto.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.profilePhoto.name);
                    var filename = DS.getTime() + extension;
                    let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                    async.series([
                        function (nextProc) {
                            Uploader.thumbUpload({ // upload thumb file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + thumb_image,
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.profilePhoto.path
                            }, nextProc);
                        }
                    ], function (err) {
                        if (err) {
                            return nextCall(err, fields);
                        }
                        fields.profilePhoto = filename;
                        nextCall(null, fields)
                    });
                } else {
                    nextCall(null, fields)
                }

            },
            /** get language id */
            function (fields, nextCall) {
                LanguageSchema.findOne({
                    "code": fields.language_code
                }).lean().exec(function (err, language) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else if (!language) {
                        return nextCall({
                            "message": 'LANGUAGE_NOT_FOUND',
                        });
                    } else {
                        fields.languageId = language._id;
                        nextCall(null, fields);
                    }
                });
            },
            /** get passenger auto increment id */
            function (fields, nextCall) {
                _self.getPassengerAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        })
                    }
                    if (response.passengerAutoIncrement > 999999) {
                        fields.uniqueID = 'P-' + response.passengerAutoIncrement;
                    } else {
                        fields.uniqueID = 'P-' + ('00000' + response.passengerAutoIncrement).slice(-6);
                    }
                    fields.autoIncrementID = response.passengerAutoIncrement;
                    nextCall(null, fields)
                });
            },
            /** add point count  */
            function (fields, nextCall) {
                if (fields.inviteCode != undefined && fields.inviteCode != null && fields.inviteCode != "") {
                    PassengerReferralSchema.findOne({
                        "referralCode": fields.inviteCode
                    }).lean().exec(function (err, passengerReferral) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else if (!passengerReferral) {
                            nextCall(null, fields)
                        } else {
                            PassengerSchema.findOneAndUpdate({
                                "referralCode": fields.inviteCode
                            }, {
                                    $inc: {
                                        totalPoints: 1
                                    }
                                }).exec((err, passenger) => {
                                    if (err) {
                                        return nextCall({
                                            "message": 'SOMETHING_WENT_WRONG',
                                        });
                                    }
                                    nextCall(null, fields)
                                })
                        }
                    });
                } else {
                    nextCall(null, fields)
                }
            },
            /** inviteCode start */
            function (fields, nextCall) {
                if (fields.inviteCode != undefined && fields.inviteCode != null && fields.inviteCode != "") {
                    PassengerReferralSchema.findOne({
                        "referralCode": fields.inviteCode
                    }).lean().exec(function (err, passengerReferral) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else if (!passengerReferral) {
                            return nextCall({
                                "message": 'INVALID_REFERRAL_CODE',
                            });
                        } else {
                            /*
                             * Discontinued due to nth child logic
                            if (passengerReferral.passengerLevel < 4) {
                                fields.referralCode = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
                                nextCall(null, fields, passengerReferral);
                            } else {
                                fields.referralCode = "";
                                nextCall(null, fields, passengerReferral);
                            }*/
                            fields.referralCode = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
                            nextCall(null, fields, passengerReferral);
                        }
                    });
                } else {
                    fields.referralCode = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
                    nextCall(null, fields, false);
                }
            },
            function (fields, passengerReferral, nextCall) {
                if (fields.longitude && fields.latitude) {
                    if (fields.angle) {
                        fields.location = {
                            'type': 'Point',
                            "index": "2dsphere",
                            'coordinates': [Number(fields.longitude), Number(fields.latitude)],
                            'angle': Number(fields.angle)
                        }
                    } else {
                        fields.location = {
                            'type': 'Point',
                            "index": "2dsphere",
                            'coordinates': [Number(fields.longitude), Number(fields.latitude)]
                        }
                    }
                }

                fields.passengerLevel = passengerReferral ? passengerReferral.passengerLevel + 1 : 0;

                delete fields.deviceOs;
                delete fields.deviceToken;

                let passenger = new PassengerSchema(fields);
                passenger.save(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'OOPS_SOMETHING_WRONG'
                        })
                    } else {
                        nextCall(null, fields, passenger, passengerReferral);
                    }
                });
            },
            function (fields, passenger, passengerReferral, nextCall) {
                PassengerSchema.findOne({
                    "_id": passenger._id
                }).populate('languageId').lean().exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else {
                        var jwtData = {
                            _id: passenger._id,
                            email: passenger.email,
                            deviceToken: fields.deviceDetail.token,
                            type: 'passenger'
                        };
                        // create a token
                        // var p = passenger.toObject();
                        passenger.access_token = jwt.sign(jwtData, config.secret, {
                            // expiresIn: config.jwtTokenExpiryTime
                        });
                        passenger.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                        passenger.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                        nextCall(null, passenger, passengerReferral);
                    }
                });
            },
            /** passengerReferral find parent passenger */
            function (passenger, passengerReferral, nextCall) {
                let referralData;
                if (passengerReferral && passengerReferral.passengerLevel == 0) {
                    referralData = {
                        passenger: passenger._id,
                        level1Passenger: passengerReferral.passenger,
                        referralCode: passenger.referralCode,
                        inviteCode: passenger.inviteCode,
                        passengerLevel: passengerReferral.passengerLevel + 1,
                    }
                    nextCall(null, passenger, referralData);
                } else if (passengerReferral && passengerReferral.passengerLevel == 1) {
                    referralData = {
                        passenger: passenger._id,
                        level1Passenger: passengerReferral.passenger,
                        level2Passenger: passengerReferral.level1Passenger,
                        referralCode: passenger.referralCode,
                        inviteCode: passenger.inviteCode,
                        passengerLevel: passengerReferral.passengerLevel + 1,
                    }
                    nextCall(null, passenger, referralData);
                } else if (passengerReferral && passengerReferral.passengerLevel == 2) {
                    referralData = {
                        passenger: passenger._id,
                        level1Passenger: passengerReferral.passenger,
                        level2Passenger: passengerReferral.level1Passenger,
                        level3Passenger: passengerReferral.level2Passenger,
                        referralCode: passenger.referralCode,
                        inviteCode: passenger.inviteCode,
                        passengerLevel: passengerReferral.passengerLevel + 1,
                    }
                    nextCall(null, passenger, referralData);
                } else if (passengerReferral && passengerReferral.passengerLevel == 3) {
                    referralData = {
                        passenger: passenger._id,
                        level1Passenger: passengerReferral.passenger,
                        level2Passenger: passengerReferral.level1Passenger,
                        level3Passenger: passengerReferral.level2Passenger,
                        level4Passenger: passengerReferral.level3Passenger,
                        referralCode: passenger.referralCode,
                        inviteCode: passenger.inviteCode,
                        passengerLevel: passengerReferral.passengerLevel + 1,
                    }
                    nextCall(null, passenger, referralData);
                } else if (passengerReferral && passengerReferral.passengerLevel >= 4) {
                    referralData = {
                        passenger: passenger._id,
                        level1Passenger: passengerReferral.passenger,
                        level2Passenger: passengerReferral.level1Passenger,
                        level3Passenger: passengerReferral.level2Passenger,
                        level4Passenger: passengerReferral.level3Passenger,
                        level5Passenger: passengerReferral.level4Passenger,
                        referralCode: passenger.referralCode,
                        inviteCode: passenger.inviteCode,
                        passengerLevel: passengerReferral.passengerLevel + 1,
                    }
                    nextCall(null, passenger, referralData);
                } else {
                    referralData = {
                        passenger: passenger._id,
                        referralCode: passenger.referralCode,
                        inviteCode: "",
                        passengerLevel: 0
                    }
                    nextCall(null, passenger, referralData);
                }
            },
            function (passenger, referralData, nextCall) {
                let passengerRefData = new PassengerReferralSchema(referralData);
                passengerRefData.save(function (err, driverData) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        })
                    } else {
                        nextCall(null, passenger);
                    }
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: err.code ? err.code : 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: 'CREATE_PASSANGER_SUCC',
                data: response
            });

        });

    },

    /* --------------------------------------------------\*
     * Edit 
     * ------------------------------------------------ */
    edit: function (req, res) {
        async.waterfall([
            /** get formData */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall);
            },
            /** check required parameters */
            // function(fields, files, nextCall) {
            //     if (fields && (!fields.passenger_id)) {
            //         return nextCall({
            //             "message": 'INVALID_PARAMS'
            //         });
            //     }
            //     nextCall(null, fields, files);
            // },
            /** get passenger details */
            function (fields, files, nextCall) {
                PassengerSchema.findOne({
                    _id: req.user._id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": 'PASSENGER_NOT_FOUND'
                        })
                    } else {
                        nextCall(null, fields, files, passenger)
                    }
                })
            },
            /** check email and mobile no already registered or not */
            function (fields, files, passenger, nextCall) {

                var userExistCondition = [];
                if (fields.email && fields.email != req.user.email) {
                    userExistCondition.push({
                        email: fields.email
                    });
                }
                if (fields.phoneNumber && fields.phoneNumber != req.user.phoneNumber) {
                    userExistCondition.push({
                        phoneNumber: fields.phoneNumber,
                        isDeleted: false
                    });
                }
                if (userExistCondition.length) {
                    PassengerSchema.findOne({
                        $or: userExistCondition
                    }).exec(function (err, passengerData) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG'
                            })
                        } else if (passengerData) {
                            return nextCall({
                                "message": 'PASSENGER_ALREADY_REGISTERED'
                            })
                        } else {
                            nextCall(null, fields, files, passenger)
                        }
                    })
                } else {
                    nextCall(null, fields, files, passenger)
                }
            },

            /** remove profile photo  photos */
            function (fields, files, passenger, nextCall) {
                if (fields.removeProfilePhotos && fields.removeProfilePhotos == 1) {

                    /** remove image from server */
                    if (passenger.profilePhoto && passenger.profilePhoto != '') {
                        Uploader.remove({
                            filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
                        });

                        Uploader.remove({
                            filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
                        });
                    }
                    passenger.profilePhoto = "";
                    nextCall(null, fields, files, passenger);

                } else {
                    nextCall(null, fields, files, passenger);
                }
            },
            /** upload profile picture */
            function (fields, files, passenger, nextCall) {
                if (files.profilePhoto) {
                    // skip files except image files
                    if (files.profilePhoto.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.profilePhoto.name);
                    let filename = DS.getTime() + extension;
                    let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                    async.series([
                        function (nextProc) {
                            Uploader.thumbUpload({ // upload thumb file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + thumb_image,

                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.profilePhoto.path
                            }, nextProc);
                        },
                        function (nextProc) { // remove old large image
                            if (passenger.profilePhoto != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
                                }, nextProc);
                            } else {
                                nextProc();
                            }
                        },
                        function (nextProc) { // remove old thumb image
                            if (passenger.profilePhoto != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
                                }, nextProc);
                            } else {
                                nextProc();
                            }
                        }
                    ], function (err) {
                        if (err) {
                            nextCall(err, fields);
                        }
                        fields.profilePhoto = filename;
                        nextCall(null, fields, passenger)
                    });
                } else {
                    fields.profilePhoto = passenger.profilePhoto;
                    nextCall(null, fields, passenger)
                }
            },
            /** update passenger data */
            function (fields, passenger, nextCall) {
                let updateData = {
                    'name': fields.name ? fields.name : passenger.name,
                    'email': fields.email ? fields.email : passenger.email,
                    'phoneNumber': fields.phoneNumber ? fields.phoneNumber : passenger.phoneNumber,

                    'countryCode': fields.countryCode ? fields.countryCode : passenger.countryCode,
                    'onlyPhoneNumber': fields.onlyPhoneNumber ? fields.onlyPhoneNumber : passenger.onlyPhoneNumber,

                    'dob': fields.dob ? fields.dob : passenger.dob,
                    'profilePhoto': fields.profilePhoto
                }

                PassengerSchema.findOneAndUpdate({
                    "_id": passenger._id
                }, {
                        $set: updateData
                    }, {
                        new: true,
                        lean: true
                    },
                    function (err, r) {

                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG'
                            });
                        }
                        r.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                        r.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                        nextCall(null, r);
                    });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: 'PASSENGER_UPDATE_SUCC',
                data: response
            });
        })
    },


    /* --------------------------------------------------\*
     * My Profile 
     * ------------------------------------------------ */
    detail: function (req, res) {
        async.waterfall([
            function (nextCall) {
                PassengerSchema.findOne({
                    _id: req.user._id
                }).populate('languageId').exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": 'PASSENGER_NOT_FOUND'
                        })
                    } else {
                        p = passenger.toObject();
                        p.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                        p.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                        nextCall(null, p)
                    }
                })
            },
            function (response, nextCall) {
                NotificationSchema.count({
                    "passengerId": req.user._id,
                    "isRead": false
                }).exec(function (err, result) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        });
                    } else {
                        response.unreadNotification = result;

                        nextCall(null, response)
                    }
                })
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: response
            });
        })
    },

    /* --------------------------------------------------\*
     * Get My Language
     * ------------------------------------------------ */
    getMyLanguage: function (req, res) {
        async.waterfall([
            function (nextCall) {
                LanguageSchema.find({}).lean().exec(function (err, v) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    }
                    if (v.length) {
                        _.map(v, function (lang, i) {
                            v[i].isDefault = lang._id.toString() == req.user.languageId.toString() ? true : false;
                            v[i].languagePhotoUrl = CONSTANTS.COUNTRY_FLAGS_URL;
                        });
                    }
                    nextCall(null, v);
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: response
            });
        })
    },

    /* --------------------------------------------------\*
     * Logout
     * ------------------------------------------------ */
    logout: function (req, res) {
        async.waterfall([
            function (nextCall) {
                let updateData = {
                    isOnline: false,
                    deviceDetail: {}
                };
                PassengerSchema.findOneAndUpdate({
                    "_id": req.user._id
                }, {
                        $set: updateData
                    }, {
                        new: true
                    })
                    .exec(function (err, passenger) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        }
                        if (!passenger) {
                            return nextCall({
                                "message": 'PASSENGER_NOT_FOUND'
                            });
                        } else {
                            nextCall(null, {});
                        }
                    });
            },
        ], function (err, r) {

            if (err) {
                return res.sendToEncode({
                    status: err.code ? err.code : 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: r
            });
        })
    },

    /* --------------------------------------------------\*
     * My Wallet
     * ------------------------------------------------ */
    myWallet: function (req, res) {
        var walletData = {
            todayEarnings: 0,
            referralEarnings: 0,
            referralWithdraws: 0,
        }
        async.waterfall([
            function (nextCall) {
                PassengerSchema.findOne({
                    '_id': req.user._id
                }).exec(function (err, passengerData) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    }
                    walletData.referralEarnings = passengerData.earningFromReferral;
                    nextCall(null, walletData)
                })
            },
            /** get referral withdraws amount */
            function (walletData, nextCall) {
                let aggregateQuery = [];
                // stage 1
                aggregateQuery.push({
                    $match: {
                        beneficiaryPassengerId: req.user._id,
                        isWithdrawed: true
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $group: {
                        '_id': 1,
                        'referralWithdraws': {
                            $sum: '$referralAmount'
                        }
                    }
                })
                PassengerReferralEarningLogs.aggregate(aggregateQuery, (err, passengerRefEarningLogs) => {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else {
                        if (passengerRefEarningLogs.length > 0) {
                            walletData.referralWithdraws = passengerRefEarningLogs[0].referralWithdraws;
                        } else {
                            walletData.referralWithdraws = 0;
                        }
                        walletData.referralEarnings = walletData.referralEarnings - walletData.referralWithdraws;
                        nextCall(null, walletData)
                    }
                })
            }
        ], function (err, r) {

            if (err) {
                return res.sendToEncode({
                    status: err.code ? err.code : 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: r
            });
        })
    },

    /* --------------------------------------------------\*
     * Get Withdraws
     * ------------------------------------------------ */
    getWithdraws: function (req, res) {
        async.waterfall([
            function (nextCall) {
                var limit = (req.body.limit && req.body.limit > 0) ? Number(req.body.limit) : 10;
                var page = (req.body.page && req.body.page > 0) ? Number(req.body.page) : 1;
                var offset = (page - 1) * limit;
                var hasMore = false;

                offset = Number(offset);

                WithdrawsSchema.find({
                    "passengerId": req.user._id
                })
                    .populate('passengerId')
                    .populate('driverId')
                    .sort({
                        _id: -1
                    })
                    .limit(limit)
                    .skip(offset)
                    .lean()
                    .exec(function (err, withdraws) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else {
                            hasMore = withdraws.length && withdraws.length == limit ? true : false;
                            nextCall(null, {
                                withdraws,
                                page,
                                hasMore
                            });
                        }
                    });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: response
            });
        })
    },

    /* --------------------------------------------------\*
     * Get Rewards
     * ------------------------------------------------ */
    getRewards: function (req, res) {
        async.waterfall([
            function (nextCall) {
                var limit = (req.body.limit && req.body.limit > 0) ? Number(req.body.limit) : 10;
                var page = (req.body.page && req.body.page > 0) ? Number(req.body.page) : 1;
                var offset = (page - 1) * limit;
                var hasMore = false;

                offset = Number(offset);

                RewardSchema.find({
                    "passengerId": req.user._id
                })
                    .sort({
                        _id: -1
                    })
                    .limit(limit)
                    .skip(offset)
                    .lean()
                    .exec(function (err, rewards) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else {
                            hasMore = rewards.length && rewards.length == limit ? true : false;
                            nextCall(null, {
                                rewards,
                                page,
                                hasMore
                            });
                        }
                    });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: response
            });
        })
    },

    /* --------------------------------------------------\*
     * Update Language
     * ------------------------------------------------ */
    updateLanguage: function (req, res) {
        async.waterfall([
            // Check required params
            function (nextCall) {
                req.checkBody('languageId', 'LANGUAGE_REQUIRED').notEmpty();

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
            function (body, nextCall) {
                PassengerSchema.findOneAndUpdate({
                    "_id": req.user._id
                }, {
                        $set: {
                            'languageId': body.languageId
                        }
                    }, {
                        new: true
                    })
                    .exec(function (err, passenger) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        }
                        if (!passenger) {
                            return nextCall({
                                "message": 'PASSENGER_NOT_FOUND'
                            });
                        } else {
                            nextCall(null, {});
                        }
                    });
            },
        ], function (err, r) {

            if (err) {
                return res.sendToEncode({
                    status: err.code ? err.code : 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: 'LANGUAGE_UPDATE_SUCC',
                data: r
            });
        })
    },

    /* --------------------------------------------------\*
     * Get Status
     * ------------------------------------------------ */
    getStatus: function (req, res) {
        var response = {
            user: {},
            ride: {}
        }
        async.waterfall([
            function (nextCall) {
                PassengerSchema.findOne({
                    "_id": req.user._id
                })
                    .populate('languageId')
                    .lean()
                    .exec(function (err, passenger) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        }
                        if (!passenger) {
                            return nextCall({
                                "message": 'NUMBER_NOT_REGISTERED'
                            });
                        } else {
                            response.user = passenger;
                            response.user.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                            response.user.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                            response.user.badge = "silver";
                            nextCall(null, response)
                        }
                    });
            },
            function (response, nextCall) {
                RideSchema.findOne({
                    "passengerId": response.user._id,
                    "status": {
                        // 'completed'
                        $in: ['requested', 'accepted', 'arrived', 'onride']
                    },
                    // "paymentStatus": false
                }).populate('driverId').populate('requestedVehicleTypeId').sort('createdAt').lean().exec((err, ride) => {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else if (!ride) {
                        response.ride = {};
                        nextCall(null, response)
                    } else {
                        response.ride = ride;
                        /** get driver from Queue */
                        DriverRideRequestSchema
                            .findOne({
                                rideId: ride._id,
                                status: {
                                    $elemMatch: {
                                        type: 'sent',
                                        createdAt: {
                                            $gt: moment().subtract(Number(RIDE_REQUEST_TIMEOUT), 'seconds').toISOString()
                                        }
                                    }
                                }
                            })
                            .populate('driverId')
                            .exec((err, driverRideRequest) => {
                                if (err) {
                                    return nextCall({
                                        "message": 'SOMETHING_WENT_WRONG',
                                    });
                                }
                                if (driverRideRequest) {
                                    response.ride.driverId = driverRideRequest.driverId;
                                    response.ride.driverLocation = driverRideRequest.driverId.location;
                                    response.ride.driverVehicleColor = driverRideRequest.driverId.vehicle.color;
                                    response.ride.status = ride.status;
                                }
                                redisClient.lrange(`ride.location.${ride._id}`, 0, -1, (err, reply) => {
                                    if (err) {
                                        console.log('------------------------------------');
                                        console.log('acceptOrPassRequest redis error:', err);
                                        console.log('------------------------------------');
                                    }

                                    let locationRoute = JSON.parse(JSON.stringify(reply));
                                    async.map(locationRoute, function (location, callback) {
                                        let splitData = location.split(',');
                                        let RouteData = {
                                            coordinates: [Number(splitData[0]), Number(splitData[1])]
                                        };
                                        callback(null, RouteData);
                                    }, function (err, RouteData) {
                                        response.ride.locationRoute = RouteData;
                                        nextCall(null, response)
                                    });
                                })
                            })
                    }
                });
            },
            function (response, nextCall) {
                ReasonSchema.find({}).exec((err, reasons) => {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else if (!reasons) {
                        response.reasons = [];
                    } else {
                        response.reasons = reasons;
                    }
                    nextCall(null, response)
                })
            },
            function (response, nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        });
                    }
                    if (getSettingData[0]) {
                        response.passengerVersionUpdate = getSettingData[0].passengerVersionUpdate
                        nextCall(null, response)
                    } else {
                        return nextCall({
                            "message": 'SYSTEM_SETTINGS_NOT_FOUND'
                        })
                    }
                })
            },
            function (response, nextCall) {
                NotificationSchema.count({
                    "passengerId": req.user._id,
                    "isRead": false
                }).exec(function (err, result) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG'
                        });
                    } else {
                        response.unreadNotification = result;

                        nextCall(null, response)
                    }
                })
            },
            /* For totalReferralCount */
            function (response, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        $or: [
                            {
                                "level1Passenger": mongoose.Types.ObjectId(req.user._id)
                            },
                            {
                                "level2Passenger": mongoose.Types.ObjectId(req.user._id)
                            },
                            {
                                "level3Passenger": mongoose.Types.ObjectId(req.user._id)
                            },
                            {
                                "level4Passenger": mongoose.Types.ObjectId(req.user._id)
                            },
                            {
                                "level5Passenger": mongoose.Types.ObjectId(req.user._id)
                            }
                        ]
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': null,
                        'totalInvitedCount': {
                            $sum: 1
                        }
                    }
                })
                PassengerReferralSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        if (totalInvitedCountData && totalInvitedCountData.length > 0) {
                            response.totalReferralCount = totalInvitedCountData[0].totalInvitedCount;
                            nextCall(null, response)
                        } else {
                            response.totalReferralCount = 0;
                            nextCall(null, response)
                        }
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: response
            });
        })
    },

    /* --------------------------------------------------\*
     * getTransactionHistory
     * ------------------------------------------------ */
    getTransactionHistory: function (req, res) {
        async.waterfall([
            function (nextCall) {
                var limit = (req.body.limit && req.body.limit > 0) ? Number(req.body.limit) : 10;
                var page = (req.body.page && req.body.page > 0) ? Number(req.body.page) : 1;
                var offset = (page - 1) * limit;
                var hasMore = false;

                offset = Number(offset);
                RideSchema.find({
                    "passengerId": req.user._id,
                    "status": {
                        $ne: 'request_expired'
                    },
                    "acceptedAt": {
                        $lte: new Date(moment().format())
                    }
                })
                    .populate('driverId')
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .skip(offset)
                    .exec(function (err, rides) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else if (rides.length) {
                            hasMore = rides.length == limit ? true : false;
                            nextCall(null, {
                                rides,
                                page,
                                hasMore
                            });
                        } else {
                            nextCall(null, {
                                rides,
                                page,
                                hasMore
                            });
                        }
                    });
            }
        ], function (err, response) {

            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "",
                data: response
            });
        })
    },
    
    /* --------------------------------------------------\*
     * getTransactionHistory
     * ------------------------------------------------ */
    getNotificationData: function (req, res) {
        async.waterfall([
            function (nextCall) {
                var limit = (req.body.limit && req.body.limit > 0) ? Number(req.body.limit) : 10;
                var page = (req.body.page && req.body.page > 0) ? Number(req.body.page) : 1;
                var offset = (page - 1) * limit;
                var hasMore = false;

                offset = Number(offset);
                NotificationSchema.find({
                    "passengerId": req.user._id
                })
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .skip(offset)
                    .exec(function (err, notifications) {
                        if (err) {
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else if (notifications.length) {
                            hasMore = notifications.length == limit ? true : false;
                            nextCall(null, {
                                notifications,
                                page,
                                hasMore
                            });
                        } else {
                            nextCall(null, {
                                notifications,
                                page,
                                hasMore
                            });
                        }
                    });
            }, function (body, nextCall) {
                NotificationSchema.update({
                    "passengerId": req.user._id,
                    "isRead": false
                }, { isRead: true }, { multi: true }, function (err, result) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else {
                        nextCall(null, body)
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "Get notification data successfully.",
                data: response
            });
        })
    },


    /* --------------------------------------------------\*
     * Renew Token
     * ------------------------------------------------ */
    renewToken: function (req, res) {
        async.waterfall([
            // Check required params
            function (nextCall) {
                req.checkBody('phoneNumber', 'PHONE_REQUIRED').notEmpty();

                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        code: 401,
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            function (body, nextCall) {
                PassengerSchema.findOne({
                    phoneNumber: body.phoneNumber,
                    isDeleted: false
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else if (!passenger) {
                        return nextCall({
                            "message": 'PASSENGER_NOT_FOUND',
                        });
                    } else {
                        var jwtData = {
                            _id: passenger._id,
                            email: passenger.email,
                            deviceToken: passenger.deviceDetail.token,
                            type: 'passenger'
                        };
                        // create a token
                        var p = passenger.toObject();
                        p.access_token = jwt.sign(jwtData, config.secret, {
                            // expiresIn: config.jwtTokenExpiryTime
                        });
                        p.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                        p.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                        nextCall(null, p)
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "Renew token successfully.",
                data: response
            });
        })
    },

    sum: function(items, prop){
        return items.reduce( function(a, b){
            return a + b[prop];
        }, 0);
    },

    inviteAndEarn: function (req, res) {
        async.waterfall([
            (nextCall) => {
                let aggregateQuery = [];
                var userLevel = req.user.passengerLevel;
                aggregateQuery.push({
                    $match: {
                        $or: [{
                            "level1Passenger": mongoose.Types.ObjectId(req.user._id)
                        },
                        {
                            "level2Passenger": mongoose.Types.ObjectId(req.user._id)
                        },
                        {
                            "level3Passenger": mongoose.Types.ObjectId(req.user._id)
                        },
                        {
                            "level4Passenger": mongoose.Types.ObjectId(req.user._id)
                        },
                        {
                            "level5Passenger": mongoose.Types.ObjectId(req.user._id)
                        },
                        ]
                    }
                })
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger",
                        "localField": "passenger",
                        "foreignField": "_id",
                        "as": "passengerRef"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$passengerRef",
                        includeArrayIndex: "true"
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': "$passengerLevel",
                        'totalEarning': {
                            $sum: '$passengerRef.earningFromReferral'
                        },
                        'count': {
                            $sum: 1
                        }
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "level": "$_id",
                        "invited": "$count",
                        "earning": "$totalEarning"
                    }
                })
                aggregateQuery.push({
                    $sort: {
                        level: 1
                    }
                })

                PassengerReferralSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else {
                        let totalInvited = _self.sum(totalRefEarning, 'invited');
                        let totalEarning = _self.sum(totalRefEarning, 'earning') + req.user.earningFromReferral;
                        // let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;
                        // for (let index = 0; index < totalRefEarning.length - 1; index++) {
                        //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
                        // }
                        nextCall(null, totalRefEarning, userLevel, totalInvited, totalEarning)
                    }
                })
            },
            (totalRefEarning, level, totalInvited, totalEarning, nextCall) => {
                // if (level == 0) {
                //     if (totalRefEarning.length < 5) {
                //         for (let index = totalRefEarning.length - 1; index < 5; index++) {
                //             totalRefEarning[index] = {
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             }
                //         }
                //     }
                //     totalRefEarning[4] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // } else if (level == 1) {
                //     if (totalRefEarning.length < 4) {
                //         for (let index = totalRefEarning.length - 1; index < 4; index++) {
                //             totalRefEarning[index] = {
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             }
                //         }
                //     }
                //     totalRefEarning[3] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // } else if (level == 2) {
                //     if (totalRefEarning.length < 3) {
                //         for (let index = totalRefEarning.length - 1; index < 3; index++) {
                //             totalRefEarning[index] = {
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             }
                //         }
                //     }
                //     totalRefEarning[2] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // } else if (level == 3) {
                //     if (totalRefEarning.length < 2) {
                //         for (let index = totalRefEarning.length - 1; index < 2; index++) {
                //             totalRefEarning[index] = {
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             }
                //         }
                //     }
                //     totalRefEarning[1] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // } else if (level == 4) {
                //     totalRefEarning[0] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // }
                if (totalRefEarning.length < 5) {
                    for (let i = totalRefEarning.length; i < 5; i++) {
                        totalRefEarning.push({
                            level: null,
                            invited: null,
                            earning: null
                        })
                    }
                }
                nextCall(null, totalRefEarning, level, totalInvited, totalEarning)
            },
            (totalRefEarning, level, totalInvited, totalEarning, nextCall) => {
                var realResponse = {
                    status_code: 200,
                    message: "",
                    data: {
                        profilePhotoUrlLarge: CONSTANTS.PROFILE_PHOTO_LARGE_URL,
                        profilePhotoUrlThumb: CONSTANTS.PROFILE_PHOTO_THUMB_URL,
                        profilePhoto: req.user.profilePhoto,
                        invited: totalInvited,
                        earning: totalEarning,
                        user_level: level,
                        levels: totalRefEarning
                    }
                }
                return res.status(200).send(realResponse)
            }
        ], (err, response) => {
            if (err) {
                return CB({
                    status: 400,
                    message: (err && err.message) || 'Server internal error'
                })
            }
            return CB({
                status: 200,
                message: 'Ride payment successfully.',
                data: response
            })
        })
    },

    earningFromReferral: function (req, res) {

        var limit = (req.body.limit && req.body.limit > 0) ? Number(req.body.limit) : 10;
        var page = (req.body.page && req.body.page > 0) ? Number(req.body.page) : 1;
        var offset = (page - 1) * limit;
        var hasMore = false;
        offset = Number(offset);

        PassengerReferralEarningLogs.find({
            beneficiaryPassengerId: mongoose.Types.ObjectId(req.user._id)
        }).populate([{
            path: 'passengerId',
            select: 'name uniqueID'
        },
        {
            path: 'rideId',
            select: 'rideId paymentAt pickupAddress destinationAddress'
        }
        ]).sort({
            _id: -1
        })
            .limit(limit)
            .skip(offset)
            .exec(function (err, referrals) {
                if (err) {
                    console.log({
                        "message": 'SOMETHING_WENT_WRONG',
                    });
                } else {
                    var response = {
                        status_code: 200,
                        message: "",
                        data: referrals,
                        page: page,
                        hasMore: referrals.length && referrals.length == limit ? true : false
                    }
                    return res.status(200).send(response)
                }
            });
    },

    getInviteAndEarnDetailsOfLevel: function (req, res) {
        async.waterfall([
            // Check required params
            function (nextCall) {
                req.checkBody('level', 'LEVEL_REQUIRED').notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        code: 401,
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            function (body, nextCall) {
                var limit = (req.body.limit && req.body.limit > 0) ? Number(req.body.limit) : 10;
                var page = (req.body.page && req.body.page > 0) ? Number(req.body.page) : 1;
                var offset = (page - 1) * limit;

                let aggregateQuery = [];

                if (req.body.level == '-1') {
                    aggregateQuery.push({
                        $match: {
                            $or: [
                                { 'level1Passenger': mongoose.Types.ObjectId(req.user._id) },
                                { 'level2Passenger': mongoose.Types.ObjectId(req.user._id) },
                                { 'level3Passenger': mongoose.Types.ObjectId(req.user._id) },
                                { 'level4Passenger': mongoose.Types.ObjectId(req.user._id) },
                                { 'level5Passenger': mongoose.Types.ObjectId(req.user._id) }
                            ]
                        }
                    })
                } else if (req.body.level == '0') {
                    aggregateQuery.push({
                        $match: {
                            'level1Passenger': mongoose.Types.ObjectId(req.user._id)
                        }
                    })
                } else if (req.body.level == '1') {
                    aggregateQuery.push({
                        $match: {
                            'level2Passenger': mongoose.Types.ObjectId(req.user._id)
                        }
                    })
                } else if (req.body.level == '2') {
                    aggregateQuery.push({
                        $match: {
                            'level3Passenger': mongoose.Types.ObjectId(req.user._id)
                        }
                    })
                } else if (req.body.level == '3') {
                    aggregateQuery.push({
                        $match: {
                            'level4Passenger': mongoose.Types.ObjectId(req.user._id)
                        }
                    })
                } else if (req.body.level == '4') {
                    aggregateQuery.push({
                        $match: {
                            'level5Passenger': mongoose.Types.ObjectId(req.user._id)
                        }
                    })
                } else {
                    return nextCall({
                        "message": 'LEVEL_NOT_VALID'
                    });
                }

                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger_referral_earning_logs",
                        "localField": "passenger",
                        "foreignField": "beneficiaryPassengerId",
                        "as": "passengerbenefite"
                    }
                })

                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger",
                        "localField": "passenger",
                        "foreignField": "_id",
                        "as": "passengerDetails"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$passengerDetails",
                        preserveNullAndEmptyArrays: true
                    }
                })

                aggregateQuery.push({
                    $unwind: {
                        path: "$passengerbenefite",
                        preserveNullAndEmptyArrays: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        "passenger_id": {
                            "$first": "$passengerDetails._id"
                        },
                        "uniqueID": {
                            "$first": "$passengerDetails.uniqueID"
                        },
                        "name": {
                            "$first": "$passengerDetails.name"
                        },
                        "passengerLevel": {
                            "$first": "$passengerDetails.passengerLevel"
                        },
                        "countryCode": {
                            "$first": "$passengerDetails.countryCode"
                        },
                        "onlyPhoneNumber": {
                            "$first": "$passengerDetails.onlyPhoneNumber"
                        },
                        "phoneNumber": {
                            "$first": "$passengerDetails.phoneNumber"
                        },
                        "createdAt": {
                            "$first": "$passengerDetails.createdAt"
                        },
                        "profilePhoto": {
                            "$first": "$passengerDetails.profilePhoto"
                        },
                        "isDeleted": {
                            "$first": "$passengerDetails.isDeleted"
                        },
                        'earningAmount': {
                            $sum: '$passengerbenefite.referralAmount'
                        }
                    }
                })
                aggregateQuery.push({
                    $sort: {
                        createdAt: -1
                    }
                })
                aggregateQuery.push({
                    $skip: offset
                })
                aggregateQuery.push({
                    $limit: limit
                })
                PassengerReferralSchema.aggregate(aggregateQuery, (err, getInviteAndEarnDetailsOfLevel) => {
                    if (err) {
                        return nextCall({
                            "message": 'SOMETHING_WENT_WRONG',
                        });
                    } else {
                        let data = {};
                        data.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                        data.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                        data.users = getInviteAndEarnDetailsOfLevel;
                        data.page = page;
                        data.hasMore = getInviteAndEarnDetailsOfLevel.length == limit ? true : false;
                        nextCall(null, data)
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || 'SOMETHING_WENT_WRONG'
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "Get invite and earn details of level successfully.",
                data: response
            });
        })
    }
};
module.exports = _self;