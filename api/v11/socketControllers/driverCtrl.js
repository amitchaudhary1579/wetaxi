var util = require('util');
var debug = require('debug')('x-code:v1:socket:socketControllers:driverCtrl'),
    moment = require('moment'),
    async = require('async'),
    _ = require('underscore'),
    CONSTANTS = rootRequire('config/constant'),
    redisClient = rootRequire('support/redis'),
    Request = require("request"),
    DS = rootRequire('services/date'), // date services
    AESCrypt = rootRequire('services/aes'),
    mongoose = require('mongoose');

const dbConnection = require('../db/connection');
const orderCollection =  dbConnection.collection('order');
                           
var DriverSchema = require('../models/driver'),
    DriverReferralSchema = require('../models/driverReferrals'),
    DriverRefEarningLogSchema = require('../models/driverReferralEarningLogs'),
    PassengerSchema = require('../models/passenger'),
    PassengerReferralSchema = require('../models/passengerReferrals'),
    PassengerReferralEarningLogs = require('../models/passengerReferralEarningLogs'),
    RideSchema = require('../models/ride'),
    RideLogsSchema = require('../models/rideLogs'),
    DriverRideRequestSchema = require('../models/driverRideRequest'),
    AppInfoSchema = require('../models/appInfo'),
    NotificationSchema = require('../models/notification'),
    SystemSettingsSchema = require('../models/systemSettings'),
    VehicleTypeSchema = require('../models/vehicleType'),
    VehicleSchema = require('../models/vehicle'),
    EmergencySchema = require('../models/emergency'),
    AdminSchema = require('../models/admin'),
    /** languages */
    ENGLISH_MESSAGES = rootRequire('config/messages/en'),
    COMBODIA_MESSAGES = rootRequire('config/messages/km'),
    CHINESE_MESSAGES = rootRequire('config/messages/zh'),
    callHistorySchema = require('../models/call_history');

//Push notification
pn = require('../../../support/push-notifications/pn'),
    passengerCtrl = require('../socketControllers/passengerCtrl');

const commonHelper = require('../policies/commonHelper');

const RIDE_REQUEST_TIMEOUT = 20;
const DRIVER_MIN_BALANCE = 10000;

// Create indexs required in DriverSchema
DriverSchema.collection.createIndex({
    location: "2dsphere"
}, function (err, resp) { });

RideSchema.collection.createIndex({
    pickupLocation: "2dsphere"
}, function (err, resp) { });


var _self = {

    // done
    connect: (socket, nsp, io) => {
        if (!socket.userInfo || (socket.userInfo && socket.userInfo.type !== 'driver')) {
            return
        }
        DriverSchema.findOne({
            "_id": socket.userInfo._id
        }, {
            socketId: 1
        })
            .lean()
            .then(driver => {
                if (!driver) {
                    return driver
                }
                return DriverSchema
                    .update({
                        _id: socket.userInfo._id
                    }, {
                        socketId: socket.id
                    }, {
                        new: true
                    })
                    .then(updated => {
                        return driver
                    })
            })
            .then(driver => {
                if (driver && driver.socketId && driver.socketId != socket.id) {
                    socket.to(driver.socket_id).emit('server-logout-forcefully', {
                        status: 403,
                        message: 'driver connected successfully.'
                    })
                }
            })
            .catch(e => {
                //     console.log('driver connected error:', e)
            })
    },

    // connect: (socket, nsp, io) => {
    //     return (data, CB) => {
    //         async.waterfall([
    //             (nextCall) => {
    //                 if (!socket.userInfo || (socket.userInfo && socket.userInfo.type !== 'driver')) {
    //                     return
    //                 }
    //                 DriverSchema.findOne({
    //                     "_id": socket.userInfo._id
    //                 }, {
    //                         socketId: 1
    //                     })
    //                     .lean()
    //                     .then(driver => {
    //                         if (!driver) {
    //                             return driver
    //                         }
    //                         return DriverSchema
    //                             .update({
    //                                 _id: socket.userInfo._id
    //                             }, {
    //                                     socketId: socket.id
    //                                 }, {
    //                                     new: true
    //                                 })
    //                             .then(updated => {
    //                                 return driver
    //                             })
    //                     })
    //                     .then(driver => {
    //                         if (driver && driver.socketId && driver.socketId != socket.id) {
    //                             socket.to(driver.socket_id).emit('server-logout-forcefully', {
    //                                 status: 403,
    //                                 message: data.languageMessage.DRIVER_LOGOUT_SUCC
    //                             })
    //                         }
    //                         nextCall(null, null)
    //                     })
    //                     .catch(e => {
    //                         console.log('driver connected error:', e)
    //                     })
    //             },
    //         ], (err, response) => {
    //             if (err) {
    //                 console.log('driver connected error:', e)
    //                 return CB({
    //                     status: 400,
    //                     message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
    //                 })
    //             }
    //             return CB({
    //                 status: 200,
    //                 message: data.languageMessage.DRIVER_CONNECT_SUCC,
    //                 data: {}
    //             })
    //         })
    //     }
    // },

    // done
    disconnect: (socket, nsp, io) => {
        return () => { }
    },

    updateLocation: (socket, nsp, io) => {
        console.log('driver update location');
        return (data, CB) => {
            async.waterfall([
                (nextCall) => {
                    if (!data || !data.lat || !data.long) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                (data, nextCall) => {
                    let coordinates = [Number(data.long), Number(data.lat)]; //<field>: [<longitude>, <latitude> ]
                    let dataToUpdate;
                    if (data.angle) {
                        dataToUpdate = {
                            "location.coordinates": coordinates,
                            "location.angle": Number(data.angle),
                            "isAvailableAt": DS.now(),
                            "speed": data.speed ? Number(data.speed) : 0
                        };
                    } else {
                        dataToUpdate = {
                            "location.coordinates": coordinates,
                            "isAvailableAt": DS.now(),
                            "speed": data.speed ? Number(data.speed) : 0
                        };
                    }
                    let condition = {
                        "_id": socket.userInfo._id
                    };
                    DriverSchema.findOneAndUpdate(
                        condition, {
                        $set: dataToUpdate
                    }, {
                        new: true
                    })
                        .lean()
                        .exec(function (err, driver) {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }
                            if (!driver) {
                                return nextCall({
                                    "message": data.languageMessage.NUMBER_NOT_REGISTERED
                                });
                            }

                            nextCall(null, data, driver);
                        });
                },
                /** get current ride of this driver from redis */
                (data, driver, nextCall) => {
                    // get call details 
                    redisClient.get(`ride.driver.${socket.userInfo._id.toString()}`, (err, rideId) => {
                        data.ride_id = rideId || ''
                        nextCall(null, data, driver)
                    })
                },
                (data, driver, nextCall) => {
                    if (!data.ride_id && data.ride_id != '') {
                        nextCall(null, data, driver)
                    }
                    redisClient.get(`ride.status.${data.ride_id.toString()}`, (err, lastStatus) => {
                        data.lastStatus = lastStatus;
                        if (lastStatus === 'onride') {
                            redisClient.rpush(`ride.location.${data.ride_id}`, `${data.long},${data.lat}`, (err, reply) => {
                                if (err) {
                                    // console.log('------------------------------------');
                                    // console.log('acceptOrPassRequest redis error:', err);
                                    // console.log('------------------------------------');
                                }
                                nextCall(null, data, driver)
                            })
                        } else {
                            nextCall(null, data, driver)
                        }
                    })
                },
                // (data, driver, nextCall) => {
                //     if (!socket.userInfo._id) {
                //         return nextCall(null, data, driver)
                //     }
                //     socket.to(socket.userInfo._id).emit('driver-location', {
                //         status: 200,
                //         message: data.languageMessage.driverlocation',
                //         data: _.pick(driver, ['lat', 'long', 'angle'])
                //     })
                //     nextCall(null, data, driver)
                // },
                (data, driver, nextCall) => {
                    if (data.rideId && data.rideId != '') {
                        RideSchema.aggregate([
                            {
                              '$match': {
                                '_id': data.rideId
                              }
                            },
                            {
                              '$lookup': {
                                'from': 'driver', 
                                'localField': 'driverId', 
                                'foreignField': '_id', 
                                'as': 'driverId'
                              }
                            }, {
                              '$unwind': {
                                'path': '$driverId', 
                                'preserveNullAndEmptyArrays': false
                              }
                            }, {
                              '$lookup': {
                                'from': 'passenger', 
                                'localField': 'passengerId', 
                                'foreignField': '_id', 
                                'as': 'passengerId'
                              }
                            }, {
                              '$unwind': {
                                'path': '$passengerId', 
                                'preserveNullAndEmptyArrays': false
                              }
                            }, {
                              '$lookup': {
                                'from': 'vehicle', 
                                'localField': 'vehicleId', 
                                'foreignField': '_id', 
                                'as': 'vehicle'
                              }
                            }, {
                              '$unwind': {
                                'path': '$vehicle', 
                                'preserveNullAndEmptyArrays': false
                              }
                            }, {
                              '$addFields': {
                                'driverId.vehicle': '$vehicle'
                              }
                            }, {
                              '$lookup': {
                                'from': 'vehicle_type', 
                                'localField': 'requestedVehicleTypeId', 
                                'foreignField': '_id', 
                                'as': 'requestedVehicleTypeId'
                              }
                            }, {
                              '$unwind': {
                                'path': '$requestedVehicleTypeId', 
                                'preserveNullAndEmptyArrays': false
                              }
                            }
                          ]).exec((err, responseRide) => {
                            if (err) {
                              return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                              });
                            } else if (responseRide.length == 0) {
                              return nextCall({
                                "message": data.languageMessage.RIDE_NOT_FOUND
                              });
                            } else {
                              var ride = responseRide[0];
              
                        // RideSchema.findOne({ '_id': data.rideId }).populate('passengerId').populate('driverId').populate('requestedVehicleTypeId').lean().exec((err, ride) => {
                        //     if (err) {
                        //         return nextCall({
                        //             "message": data.languageMessage.SOMETHING_WENT_WRONG,
                        //         });
                        //     } else if (!ride) {
                        //         return nextCall({
                        //             "message": data.languageMessage.RIDE_NOT_FOUND
                        //         });
                        //     } else {
                                redisClient.lrange(`ride.location.${ride._id}`, 0, -1, (err, reply) => {
                                    if (err) {
                                        // console.log('------------------------------------');
                                        // console.log('acceptOrPassRequest redis error:', err);
                                        // console.log('------------------------------------');
                                    }

                                    let locationRoute = JSON.parse(JSON.stringify(reply));
                                    async.map(locationRoute, function (location, callback) {
                                        let splitData = location.split(',');
                                        let RouteData = {
                                            coordinates: [Number(splitData[0]), Number(splitData[1])]
                                        };
                                        callback(null, RouteData);
                                    }, function (err, RouteData) {
                                        ride.locationRoute = RouteData;
                                        ride.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                                        ride.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                                        nextCall(null, ride)
                                    });
                                })
                            }
                        });
                    } else {
                        let ride = {};
                        ride.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                        ride.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                        ride.driverId = driver;
                        nextCall(null, ride)
                    }
                },

                //////// START ////////
                // on_ride_distance calculation
                (ride, nextCall) => {
                    if (ride.locationRoute) {
                        // console.log("======================================");
                        // console.log("ride.locationRoute", ride.locationRoute);
                        // console.log("======================================");
                        _self.getDistance(ride.locationRoute, function (err, on_ride_distance) {
                            if (err) {
                                nextCall({ "message": err })
                            }
                            else {
                                // console.log("on_ride_distance---->>>>", on_ride_distance);
                                ride.on_ride_distance = on_ride_distance;
                                nextCall(null, ride)
                            }
                        })
                    } else {
                        ride.on_ride_distance = "";
                        nextCall(null, ride)
                    }
                },

                // get adminfee 
                (ride, nextCall) => {
                    SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG
                            });
                        }
                        if (getSystemSettingData[0] && getSystemSettingData[0].adminFee) {
                            nextCall(null, ride, getSystemSettingData[0].adminFee)
                        } else {
                            nextCall(null, ride, Number(0))
                        }
                    })
                },

                // on_ride_total calculation
                (ride, adminFee, nextCall) => {
                    if (ride.locationRoute) {

                        //    console.log("ride.locationRoute%%%%%%%%%--------", ride.locationRoute);
                        if (ride.on_ride_distance <= 1) {
                            ride.on_ride_total = Number(ride.requestedVehicleTypeId.minFare)
                        } else {
                            ride.on_ride_distance = ride.on_ride_distance ? Number(ride.on_ride_distance) : 1;
                            //        console.log("ride.on_ride_distance===========", ride.on_ride_distance);
                            ride.on_ride_total = Math.round((((Number(ride.on_ride_distance) - 1) * Number(ride.requestedVehicleTypeId.feePerKM)) + Number(ride.requestedVehicleTypeId.minFare) + adminFee) * 100) / 100;
                        }
                        //     console.log("ride.on_ride_total==============", ride.on_ride_total);
                        nextCall(null, ride)
                    } else {
                        ride.on_ride_total = "";
                        nextCall(null, ride)
                    }
                },
                //////// END ////////

                (response, nextCall) => {
                    NotificationSchema.count({
                        "driverId": socket.userInfo._id,
                        "isRead": false
                    }).exec(function (err, result) {
                        if (err) {
                            // console.log('driver error ', err);
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG'
                            });
                        } else {
                            response.unreadNotification = result;

                            nextCall(null, response)
                        }
                    })
                },


                (response, nextCall) => {
                    let aggregateQuery = [];
                    // stage 1
                    aggregateQuery.push({
                        $match: {
                            "driverId": socket.userInfo._id,
                            "isRead": false
                        }
                    })
                    // stage 2
                    aggregateQuery.push({
                        $group: {
                            '_id': '$type',
                            'badgeCount': {
                                $sum: 1
                            }
                        }
                    })
                    NotificationSchema.aggregate(aggregateQuery, (err, notificationCounts) => {
                        if (err) {
                            console.log(err);
                            return nextCall({
                                "message": 'SOMETHING_WENT_WRONG',
                            });
                        } else {
                            let notificationBadgeCountData = {};
                            async.map(notificationCounts, function (notificationCount, callback) {
                                if (notificationCount._id == 'reward') {
                                    notificationBadgeCountData.reward = notificationCount.badgeCount;
                                } else if (notificationCount._id == 'billing_plan') {
                                    notificationBadgeCountData.billing_plan = notificationCount.badgeCount;
                                } else if (notificationCount._id == 'credit') {
                                    notificationBadgeCountData.credit = notificationCount.badgeCount;
                                } else if (notificationCount._id == 'recent_transaction') {
                                    notificationBadgeCountData.recent_transaction = notificationCount.badgeCount;
                                } else if (notificationCount._id == 'notification') {
                                    notificationBadgeCountData.notification = notificationCount.badgeCount;
                                }
                                callback(null);
                            }, function (err) {
                                response.notificationBadgeCountData = notificationBadgeCountData;
                                nextCall(null, response)
                            });

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
                                    "parentDriver": mongoose.Types.ObjectId(socket.userInfo._id)
                                },
                                {
                                    "grandParentDriver": mongoose.Types.ObjectId(socket.userInfo._id)
                                },
                                {
                                    "greatGrandParentDriver": mongoose.Types.ObjectId(socket.userInfo._id)
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
                    DriverReferralSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
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
            ], (err, response) => {
                if (err) {
                    //     console.log('updateDriverLocation Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.DRIVER_LOCATION_UPDATED_SUCC,
                    data: response
                })
            })

        }
    },

    acceptRide: (socket, nsp, io) => {
        console.log('accept ride');
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** get request timeout from app info schema */
                (data, nextCall) => {
                    AppInfoSchema.find({
                        type: 'driver'
                    }).exec((err, appInfo) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        data.ride_request_timeout = Number(appInfo && appInfo.ride_request_timeout) || RIDE_REQUEST_TIMEOUT;
                        nextCall(null, data)
                    });
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    DriverRideRequestSchema.findOne({
                        'rideId': data.rideId,
                        'driverId': socket.userInfo._id
                    }).exec((err, rideRequest) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!rideRequest) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data, rideRequest)
                        }
                    })
                },
                /** check ride status */
                (data, rideRequest, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'status': 'requested'
                    }).exec((err, rideStatus) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!rideStatus) {
                            return nextCall({
                                'message': data.languageMessage.DRIVER_CANT_ABLE_TO_ACCEPT_THIS_RIDE
                            })
                        } else {
                            nextCall(null, data, rideRequest)
                        }
                    })
                },
                // (data, rideRequest, nextCall) => {
                //     SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                //         if (err) {
                //             return nextCall({
                //                 "message": data.languageMessage.SOMETHING_WENT_WRONG,
                //             });
                //         }
                //         data.DRIVER_MIN_BALANCE = Number(getSystemSettingData[0].driverMinimumBalance);
                //         nextCall(null, data, rideRequest)
                //     })
                // },
                (data, rideRequest, nextCall) => {
                    VehicleSchema.findOne({currentDriverAssignId: socket.userInfo._id}, function (err, vehicleData) {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        console.log('vehicleData ', vehicleData);
                        data.vehicleId =  vehicleData._id;

                        nextCall(null, data, rideRequest)
                    })
                },
                /** check balance and driver is active and not busy flags */
                (data, rideRequest, nextCall) => {
                    DriverSchema.findOne({
                        _id: socket.userInfo._id,
                        isOnline: true,
                        isVerified: true,
                        isBusy: false,
                        isBlocked: false
                    }).exec((err, driver) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!driver) {
                            return nextCall({
                                "message": data.languageMessage.DRIVER_NOT_VALID
                            });
                        } else { //need to remove this condition
                            nextCall(null, data, rideRequest)
                            // if (driver.creditBalance >= data.DRIVER_MIN_BALANCE) {
                          
                            // } else {
                            //     return nextCall({
                            //         "message": data.languageMessage.DRIVER_NOT_MINIMUM_BALANCE
                            //     });
                            // }
                        }
                    });
                },
                
                /** check before ride some restrictions */
                (data, rideRequest, nextCall) => {
                    RideSchema.findOne({
                        'rideId': data.rideId
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        let requestStatus = rideRequest.status.find(log => log.type === 'sent');
                        let requestTime = moment().diff(requestStatus.created_at, 'seconds');
                        if (requestTime > data.RIDE_REQUEST_TIMEOUT) {
                            let rideRequestData = {
                                type: 'timeout',
                                created_at: new Date()
                            }
                            DriverRideRequestSchema.update({
                                rideId: data.rideId
                            }, {
                                $push: {
                                    status: rideRequestData
                                }
                            }).exec((err, up) => {
                                if (err) {
                                    return nextCall({
                                        status: 400,
                                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                                    })
                                }
                                return nextCall({
                                    status: 400,
                                    'message': data.languageMessage.REQUEST_TIMEOUT
                                });
                            })
                        } else {
                            /** update ride status and driver is in ride collection */
                            console.log('data on request accepted',data );
                            let condition = {
                                "_id": data.rideId,
                                "status": "requested"
                            };
                            let updateData = {
                                // here pass driver vehicle id 
                                "driverId": socket.userInfo._id,
                                'vehicleId': data.vehicleId,
                                
                                "status": "accepted",
                                "acceptedAt": DS.now()
                            }
                            RideSchema.findOneAndUpdate(condition, {
                                $set: updateData
                            }, {
                                new: true
                            }).exec((err, ride) => {
                                if (err) {
                                    return nextCall({
                                        "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                    });
                                }
                                nextCall(null, ride)
                            })
                        }
                    })
                },
                /** remove drivers from queue */
                (ride, nextCall) => {
                    console.log('---------------------remove driver ride request 2' )
                    // DriverRideRequestSchema.remove({ 'rideId': ride._id }, function (err, removeDriverQueue) {
                    //     if (err) {
                    //         return nextCall({
                    //             "message": data.languageMessage.SOMETHING_WENT_WRONG
                    //         })
                    //     } else {
                            nextCall(null, ride);
                    //     }
                    // });
                },
                /** set ride data in redis */
                (ride, nextCall) => {
                    /** set driver currrent active ride */
                    redisClient.set(`ride.driver.${socket.userInfo._id.toString()}`, ride._id, (err, reply) => { })
                    /** set driver currrent active ride */
                    redisClient.set(`ride.status.${ride._id}`, 'accepted', (err, reply) => {
                        if (err) {
                            // console.log('------------------------------------');
                            // console.log('acceptOrPassRequest redis error:', err);
                            // console.log('------------------------------------');
                        }
                        nextCall(null, ride)
                    })
                },
                /** make driver busy */
                (ride, nextCall) => {
                    DriverSchema.findOneAndUpdate({
                        _id: ride.driverId
                    }, {
                        isAvailable: true,
                        isBusy: true,
                        // isRideRequestSended: false
                    },
                        function (err, updateData) {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG
                                });
                            }
                            nextCall(null, ride)
                        });
                },
                /** send notification to passenger */
                (ride, nextCall) => {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'passengerId',
                            select: { 'phoneNumber': 1, 'countryCode': 1, 'onlyPhoneNumber': 1, 'uniqueID': 1, 'autoIncrementID': 1, 'createdAt': 1, 'updatedAt': 1, 'location': 1, 'deviceDetail': 1, 'totalPoints': 1, 'profilePhoto': 1, 'email': 1, 'name': 1, 'avgRating': 1 },
                            populate: { path: 'languageId' }
                        })
                        .populate('driverId').exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }

                            // changes for order 
                            if(ride && ride.isFoodOrder)
                            {
                                orderCollection.findOneAndUpdate({
                                    _id : mongoose.Types.ObjectId(ride.orderId)
                                },{
                                    $set : {
                                        status : 'OnTheWayToPickUp'
                                    }
                                });
                            }
                            let ACCEPT_RIDE;
                            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                                ACCEPT_RIDE = COMBODIA_MESSAGES['ACCEPT_RIDE'];
                            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                                ACCEPT_RIDE = CHINESE_MESSAGES['ACCEPT_RIDE'];
                            } else {
                                ACCEPT_RIDE = ENGLISH_MESSAGES['ACCEPT_RIDE'];
                            }

                            let pushNotificationData = {
                                to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                                type: 'passenger',
                                data: {
                                    title: '',
                                    type: 1,
                                    body: ride.driverId.name + ACCEPT_RIDE,
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                nextCall(null, ride)
                            })
                        })
                }
            ], (err, response) => {
                if (err) {
                    //    console.log('acceptRide Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                console.log('response from acceptRide', response);
                return CB({
                    status: 200,
                    message: data.languageMessage.RIDE_ACCEPT_SUCC,
                    data: response
                })
            })

        }
    },

    rejectRide: (socket, nsp, io) => {
        console.log('reject ride');
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    DriverRideRequestSchema.findOne({
                        'rideId': data.rideId,
                        'driverId': socket.userInfo._id
                    }).exec((err, rideRequest) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!rideRequest) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data)
                        }
                    })
                },
                /** check ride and driver is valid or not */
                // (data, nextCall) => {
                //     let condition = {
                //         "rideId": data.rideId,
                //         "driverId": {
                //             $ne: socket.userInfo._id
                //         },
                //         "status": {
                //             $elemMatch: {
                //                 "type": "open"
                //             }
                //         }
                //     }
                //     let updateData = {
                //         "status": {
                //             "type": "sent"
                //         }
                //     }
                //     DriverRideRequestSchema.findOneAndUpdate(condition, {
                //         $push: updateData
                //     }, {
                //         new: true
                //     }).sort('distance').exec((err, nextQueueDriver) => {
                //         if (err) {
                //             return nextCall({
                //                 "message": data.languageMessage.SOMETHING_WENT_WRONG,
                //             });
                //         }
                //         nextCall(null, data)
                //     })
                // },
                /** remove this driver from ride queue  */
                (data, nextCall) => {
                    console.log('---------------remove ride request 1 ');
                    DriverRideRequestSchema.remove({
                        "rideId": data.rideId,
                        "driverId": socket.userInfo._id
                    }).exec((err, removeDriver) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, data)
                    })
                },
                /** set isRideRequestSended true  */
                // (data, nextCall) => {
                //     DriverSchema.findOneAndUpdate({
                //         _id: socket.userInfo._id
                //     }, {
                //       isRideRequestSended: false,
                //         },
                //         function (err, updateData) {
                //             if (err) {
                //                 return nextCall({
                //                     "message": data.languageMessage.SOMETHING_WENT_WRONG
                //                 });
                //             }
                //             nextCall(null, data)
                //         });
                // },
                /** call send request to timer function so another driver will get ride request */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        passengerCtrl.sendNewRideRequest(socket, ride);
                        nextCall(null)
                    });
                }
            ], (err) => {
                if (err) {
                    //          console.log('rejectRide Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.RIDE_REJECT_SUCC
                })
            })

        }
    },

    cancelRide: (socket, nsp, io) => {
        console.log('cancel ride');

        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'driverId': socket.userInfo._id
                    }).populate('driverId').populate('passengerId').exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data, ride)
                        }
                    })
                },
                /** check ride and driver is valid or not */
                (data, ride, nextCall) => {
                    if (ride.status === 'requested' || ride.status === 'accepted') {
                        let condition = { '_id': data.rideId, 'status': 'accepted' }
                        let updateData = { 'status': 'cancelled' }

                        RideSchema.findOneAndUpdate(condition, { $set: updateData }).exec((err, updateRide) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            } else if (!updateRide) {
                                return nextCall({
                                    "message": data.languageMessage.CANT_ACCEPT_ABLE_TO_ACCEPT_THIS_RIDE_REQUEST,
                                });
                            } else {
                                redisClient.del(`ride.passenger.${ride.passengerId._id.toString()}`)
                                redisClient.del(`ride.status.${ride._id.toString()}`)
                                redisClient.del(`ride.driver.${ride.driverId._id.toString()}`)
                                nextCall(null, data, ride)
                            }
                        })
                    } else {
                        return nextCall({
                            "message": data.languageMessage.REQUEST_EXPIRE
                        });
                    }
                },
                /** set driver free */
                (data, ride, nextCall) => {
                    DriverSchema.findOneAndUpdate({
                        _id: ride.driverId._id
                    }, {
                        isAvailable: true,
                        isBusy: false
                    },
                        function (err, updateData) {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG
                                });
                            }
                            nextCall(null, data, ride)
                        });
                },

                /** Badge Count of notification */
                (data, ride, nextCall) => {
                    _self.badgeCount(ride.passengerId._id, isDriver = false, function (err, totalbadgeCount) {
                        if (err) {
                            nextCall({ "message": err })
                        }
                        else {
                            totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1
                            nextCall(null, data, ride, totalbadgeCount)
                        }
                    })
                },
                /** Badge Count of notification */
                (data, ride, totalbadgeCount, nextCall) => {
                    NotificationSchema.count({ passengerId: ride.passengerId._id, type: 'recent_transaction', isRead: false }, function (err, badgeCount) {
                        if (err) {
                            return nextCall({ "message": err })
                        }
                        else {
                            badgeCount = badgeCount ? badgeCount + 1 : 1;
                            return nextCall(null, data, ride, totalbadgeCount, badgeCount)
                        }
                    })
                },


                /** send notification to passemger */
                (data, ride, totalbadgeCount, badgeCount, nextCall) => {
                    let condition = {
                        '_id': data.rideId
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'passengerId',
                            select: { 'deviceDetail': 1 },
                            populate: { path: 'languageId' }
                        })
                        .populate('driverId').exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }

                            let DRIVER_CANCEL_RIDE;
                            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                                DRIVER_CANCEL_RIDE = COMBODIA_MESSAGES['DRIVER_CANCEL_RIDE'];
                            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                                DRIVER_CANCEL_RIDE = CHINESE_MESSAGES['DRIVER_CANCEL_RIDE'];
                            } else {
                                DRIVER_CANCEL_RIDE = ENGLISH_MESSAGES['DRIVER_CANCEL_RIDE'];
                            }

                            let pushNotificationData = {
                                to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                                type: 'passenger',
                                data: {
                                    title: '',
                                    type: 2,
                                    body: ride.driverId.name + DRIVER_CANCEL_RIDE,
                                    badge: totalbadgeCount,
                                    notificationBadgeCountData: {
                                        recent_transaction: badgeCount
                                    },
                                    tag: 'Ride',
                                    data: {
                                        rideId: data.rideId
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                // nextCall(null)
                                let notificationData = {
                                    title: pushNotificationData.data.body,
                                    receiver_type: 'passenger',
                                    passengerId: ride.passengerId._id,
                                    rideId: data.rideId,
                                    type: 'recent_transaction'
                                }
                                let Notification = new NotificationSchema(notificationData);
                                Notification.save((err, notification) => {
                                    if (err) {
                                        return nextCall({
                                            "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                        });
                                    }
                                    nextCall(null)
                                })
                            })
                        })
                }
            ], (err) => {
                if (err) {
                    //    console.log('cancelRide Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.RIDE_CANCEL_SUCC
                })
            })

        }
    },

    getNewRideRequest: (socket, nsp, io) => {
        console.log('getNewRideRequest');

        return (data, CB) => {
            async.waterfall([
                (nextCall) => {
                    if (!data && !data.rideId) {
                        return nextCall({ 'message': data.languageMessage.INVALID_PARAMS })
                    }
                    data.RIDE_REQUEST_TIMEOUT = RIDE_REQUEST_TIMEOUT;
                    nextCall(null, data)
                },
                // (data, nextCall) => {
                //   appInfoService
                //     .getAppInfoByQuery({ type: 'driver' })
                //     .select({ ride_request_timeout: 1 })
                //     .lean()
                //     .then(appInfo => {
                //       data.RIDE_REQUEST_TIMEOUT = Number(appInfo && appInfo.ride_request_timeout) || RIDE_REQUEST_TIMEOUT
                //       nextCall(null, data)
                //     })
                //     .catch(nextCall)
                // },
                (data, nextCall) => {
                    DriverRideRequestSchema.findOne({ rideId: data.rideId, driverId: socket.userInfo._id }).exec((err, driverRideRequest) => {
                        if (err) {
                            return CB({ status: 0, message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG })
                        }
                        //TODO
                        // let sent_time = driverRideRequest.status.find(log => log.type === 'sent')
                        // let timeout_time = moment().diff(sent_time.created_at, 'seconds')


                        // let timeout_time = 58*1000;

                        // if (timeout_time > data.RIDE_REQUEST_TIMEOUT) {
                        //   return nextCall({ status: 0, 'message': 'Request timeout' });
                        // }
                        // data.timeout_time = data.RIDE_REQUEST_TIMEOUT - timeout_time
                        nextCall(null, data)
                    });
                },
                (data, nextCall) => {

                    var condition = { '_id': data.rideId }

                    RideSchema.findOneAndUpdate(condition)
                        .populate('driverId')
                        .populate('passengerId')
                        .populate({ path: 'driverId', populate: { path: 'vehicle.typeId' } })
                        .lean()
                        .exec(function (err, ride) {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }
                            if (!ride) {
                                return nextCall({
                                    "message": data.languageMessage.RIDE_NOT_FOUND
                                });
                            } else {

                                d = {};
                                //Profile Photo
                                d.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                                d.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;

                                //ID Photo
                                d.idPhotosLarge = CONSTANTS.ID_PHOTO_LARGE_URL;
                                d.idPhotosThumb = CONSTANTS.ID_PHOTO_THUMB_URL;

                                //Vehicle Photos
                                d.vehiclePhotosUrlLarge = CONSTANTS.VEHICLE_PHOTO_LARGE_URL;
                                d.vehiclePhotosUrlThumb = CONSTANTS.VEHICLE_PHOTO_THUMB_URL;

                                //vehicle Id Photos
                                d.vehicleIdPhotosUrlLarge = CONSTANTS.VEHICLE_ID_PHOTO_LARGE_URL;
                                d.vehicleIdPhotosUrlThumb = CONSTANTS.VEHICLE_ID_PHOTO_THUMB_URL;

                                //Plate No Photo
                                d.plateNoPhotosUrlLarge = CONSTANTS.PLATE_NO_PHOTO_LARGE_URL;
                                d.plateNoPhotosUrlThumb = CONSTANTS.PLATE_NO_PHOTO_THUMB_URL;

                                ride.urls = d;
                                nextCall(null, ride);
                            }
                        });
                },

            ], (err, response) => {
                if (err) {
                    //        console.log('_----------------------------Fialed----------------------', err);
                    debug('getNewRideRequest Error:', err)
                    return CB({ status: (err && err.status) || 0, message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG })
                }
                return CB({ status: 1, message: data.languageMessage.GET_RIDE_REQUEST_SUCC, data: response })
            })
        }
    },

    arriveRide: (socket, nsp, io) => { // send otp to passanger 
        console.log('arriveRide');
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'driverId': socket.userInfo._id,
                        'status': 'accepted'
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data)
                        }
                    })
                },
                /** update status */
                (data, nextCall) => {
                    /** update ride status and driver is in ride collection */
                    let condition = {
                        "_id": data.rideId,
                        "status": "accepted"
                    };
                    let updateData = {
                        "status": "arrived",
                        "arrivedAt": DS.now()
                    }
                    RideSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }, {
                        new: true
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, ride)
                    })
                },
                /** update ride status in redis */
                (ride, nextCall) => {
                    redisClient.set(`ride.status.${ride._id}`, 'arrived', (err, reply) => {
                        if (err) {
                            // console.log('------------------------------------');
                            // console.log("acceptOrPassRequest redis error", err);
                            // console.log('------------------------------------');
                        }
                        nextCall(null, ride)
                    })
                },
                /** send notification to passenger */
                (ride, nextCall) => {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'passengerId',
                            select: { 'phoneNumber': 1, 'countryCode': 1, 'onlyPhoneNumber': 1, 'uniqueID': 1, 'autoIncrementID': 1, 'createdAt': 1, 'updatedAt': 1, 'location': 1, 'deviceDetail': 1, 'totalPoints': 1, 'profilePhoto': 1, 'email': 1, 'name': 1 },
                            populate: { path: 'languageId' }
                        })
                        .populate('driverId').exec(async (err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }
                            // console.log('phone number',ride.passengerId.phoneNumber );
                            // // send otp to userSide
                            // let otpSend;
                            // commonHelper.generateOTP((err, otp) => {
                            //     // otpSend.push(otp);
                            //     otpSend = otp;
                            //     message = 'you accept ride otp is ' + otp;
                            //   });
                            //   commonHelper.sendMessage(ride.passengerId.phoneNumber, message, (err, response) => {
                            //     if (err) {
                            //       return nextCall({
                            //         message: 'SOMETHING_WENT_WRONG'
                            //       });
                            //     }
                            // });
                            // console.log('otp is --- after accept ride', otpSend);
                            // await RideSchema.updateOne({ '_id': ride._id},{ activateRideOtp : otpSend });


                            // changes for order 
                            if(ride && ride.isFoodOrder)
                            {
                                 orderCollection.findOneAndUpdate({
                                    _id : mongoose.Types.ObjectId(ride.orderId)
                                },{
                                    $set : {
                                        status : 'PickedUp'
                                    }
                                });
                            }
                            let DRIVER_ARRIVE_AT_PICKUP_LOCATION;
                            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                                DRIVER_ARRIVE_AT_PICKUP_LOCATION = COMBODIA_MESSAGES['DRIVER_ARRIVE_AT_PICKUP_LOCATION'];
                            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                                DRIVER_ARRIVE_AT_PICKUP_LOCATION = CHINESE_MESSAGES['DRIVER_ARRIVE_AT_PICKUP_LOCATION'];
                            } else {
                                DRIVER_ARRIVE_AT_PICKUP_LOCATION = ENGLISH_MESSAGES['DRIVER_ARRIVE_AT_PICKUP_LOCATION'];
                            }

                            let pushNotificationData = {
                                to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                                type: 'passenger',
                                data: {
                                    title: '',
                                    type: 5,
                                    body: ride.driverId.name + DRIVER_ARRIVE_AT_PICKUP_LOCATION,
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                nextCall(null, ride)
                            })
                        })
                }
            ], (err, response) => {
                if (err) {
                    //      console.log('arriveRide Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.DRIVER_ARRIVE_SUCC,
                    data: response
                })
            })

        }
    },

    startRide: (socket, nsp, io) => {
        console.log('start ride'); // pass here otp then check this otp
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'driverId': socket.userInfo._id,
                        'status': 'arrived',
                        // 'activateRideOtp': data.otp
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data)
                        }
                    })
                },
                /** update status */
                (data, nextCall) => {
                    /** update ride status and driver is in ride collection */
                    let condition = {
                        "_id": data.rideId,
                        "status": "arrived"
                    };
                    let updateData = {
                        "status": "onride",
                        "startedAt": DS.now()
                    }
                    RideSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }, {
                        new: true
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, ride)
                    })
                },
                /** update ride status in redis */
                (ride, nextCall) => {
                    redisClient.set(`ride.status.${ride._id}`, 'onride', (err, reply) => {
                        if (err) {
                            // console.log('------------------------------------');
                            // console.log("driverStartedTrip redis error:", err);
                            // console.log('------------------------------------');
                        }
                        nextCall(null, ride)
                    })
                },
                /** send notification to passenger */
                (ride, nextCall) => {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition).populate('passengerId')
                        .populate('driverId').exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }

                            if(ride && ride.isFoodOrder)
                            {
                                orderCollection.findOneAndUpdate({
                                    _id : mongoose.Types.ObjectId(ride.orderId)
                                },{
                                    $set : {
                                        status : 'OnTheWayToDelivery'
                                
                                    }
                                });
                            }

                            let DRIVER_STARTED_RIDE;
                            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                                DRIVER_STARTED_RIDE = COMBODIA_MESSAGES['DRIVER_STARTED_RIDE'];
                            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                                DRIVER_STARTED_RIDE = CHINESE_MESSAGES['DRIVER_STARTED_RIDE'];
                            } else {
                                DRIVER_STARTED_RIDE = ENGLISH_MESSAGES['DRIVER_STARTED_RIDE'];
                            }

                            let pushNotificationData = {
                                to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                                type: 'passenger',
                                data: {
                                    title: '',
                                    type: 6,
                                    body: ride.driverId.name + DRIVER_STARTED_RIDE,
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                nextCall(null, ride)
                            })
                        })
                }
            ], (err, response) => {
                if (err) {
                    //   console.log('startRide Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.DRIVER_START_RIDE_SUCC,
                    data: response
                })
            })

        }
    },

    completeRide: (socket, nsp, io) => {
        console.log('complete ride');
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId || !data.lat || !data.long) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'driverId': socket.userInfo._id,
                        'status': 'onride'
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            console.log('lastDistance', ride.totalDistance);
                            nextCall(null, data, ride)
                        }
                    })
                },
                (data, ride, nextCall) => {
                    Request.get(
                        'https://maps.googleapis.com/maps/api/geocode/json?address=' + data.lat + ',' + data.long + '&key=' + CONSTANTS.GOOGLE_API_KEY,
                        (error, response, res) => {
                            if (error) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            } else {
                                let responseData = JSON.parse(res);
                                data.destinationAddress = responseData.results[0].formatted_address
                                nextCall(null, data, ride)
                            }
                        })
                },
                /** calculate total distance of ride into km */
                (data, ride, nextCall) => {
                    var aggregateQuery = [];
                    var matchQuery = {
                        _id: mongoose.Types.ObjectId(data.rideId)
                    };
                    aggregateQuery.push({
                        '$geoNear': {
                            'near': {
                                'type': 'Point',
                                'coordinates': [Number(data.long), Number(data.lat)]
                            },
                            'distanceField': 'distance',
                            'spherical': true,
                            'distanceMultiplier': 1 / 1000, // convert meters into miles
                            'query': matchQuery
                        }
                    });

                    RideSchema.aggregate(aggregateQuery, function (err, ride) {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }

                        data.totalDistance = Math.round(Number(ride[0].distance) * 100) / 100;
                        console.log('newDistance', data.totalDistance);
                        nextCall(null, data, ride)
                    });
                },
                /** get admin fee */
                (data, ride, nextCall) => {
                    SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG
                            });
                        }
                        if (getSystemSettingData[0] && getSystemSettingData[0].adminFee) {
                            nextCall(null, data, ride, getSystemSettingData[0].adminFee)
                        } else {
                            nextCall(null, data, ride, Number(0))
                        }
                    })
                },
                /** calculate total fare of ride */
                (data, ride, adminFee, nextCall) => {
                    RideSchema.findOne({
                        "_id": data.rideId
                    }).populate('requestedVehicleTypeId').exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        console.log(ride);
                        if (data.totalDistance <= 1) {
                            data.totalFare = Number(ride.requestedVehicleTypeId.minFare)
                        } else {
                            data.totalDistance = data.totalDistance ? Number(data.totalDistance) : 1;
                            // data.totalFare = ((Number(data.totalDistance) - 1) * Number(ride.requestedVehicleTypeId.feePerKM) / data.totalDistance) + Number(ride.requestedVehicleTypeId.minFare) + ADMIN_FEE
                            // data.totalFare = ((Number(data.totalDistance) - 1) * Number(ride.requestedVehicleTypeId.feePerKM)) + Number(ride.requestedVehicleTypeId.minFare) + ADMIN_FEE;
                            let totalFare= Math.round((((Number(data.totalDistance) - 1) * Number(ride.requestedVehicleTypeId.feePerKM)) + Number(ride.requestedVehicleTypeId.minFare)) * 100) / 100; //change by kush 
                            data.totalFare = totalFare + (totalFare/100) *totalFare; // change by kush 

                            // data.totalFare = Math.round((((Number(data.totalDistance) - 1) * Number(ride.requestedVehicleTypeId.feePerKM)) + Number(ride.requestedVehicleTypeId.minFare) + adminFee) * 100) / 100;
                        }
                        console.log('data.to', data.totalFare);
                        console.log('data.distance', data.distance);

                        // data.totalFare = (Number(data.totalDistance) * Number(ride.requestedVehicleTypeId.feePerKM)) + Number(ride.requestedVehicleTypeId.minFare);
                        /** if fare ride is less than of vehicle minimum fare than update minimum fare */
                        // if(data.totalFare < Number(ride.requestedVehicleTypeId.minFare)) {
                        //     data.totalFare = Number(ride.requestedVehicleTypeId.minFare);
                        // }
                        nextCall(null, data, ride)
                    })
                },
                /** store ride route location in ride logs table*/
                (data, ride, nextCall) => {
                    redisClient.lrange(`ride.location.${data.rideId}`, 0, -1, (err, reply) => {
                        if (err) {
                            // console.log('------------------------------------');
                            // console.log('acceptOrPassRequest redis error:', err);
                            // console.log('------------------------------------');
                        }

                        let locationRoute = JSON.parse(JSON.stringify(reply));
                        async.map(locationRoute, function (location, callback) {
                            let splitData = location.split(',');
                            let RouteData = {
                                rideId: data.rideId,
                                coordinates: [Number(splitData[0]), Number(splitData[1])]
                            };
                            callback(null, RouteData);
                        }, function (err, RouteData) {
                            RideLogsSchema.insertMany(RouteData, function (err, rideLogs) {
                                if (err) {
                                    return nextCall({
                                        "message": data.languageMessage.SOMETHING_WENT_WRONG
                                    })
                                } else {
                                    nextCall(null, data, ride);
                                }
                            });
                        });
                    })
                },
                /** update status */
                (data, ride, nextCall) => {
                    let coordinates = [Number(data.long), Number(data.lat)]; //<field>: [<longitude>, <latitude> ]
                    /** update ride status and driver is in ride collection */
                    let condition = {
                        "_id": data.rideId,
                        "status": "onride"
                    };
                    data.totalTime = moment(DS.now()).diff(moment(Number(ride.arrivedAt)), 'seconds');
                    let updateData = {
                        "status": "completed",
                        "endedAt": DS.now(),
                        "destinationLocation.coordinates": coordinates,
                        "destinationLocation.angle": data.angle ? Number(data.angle) : 0,
                        "destinationLocation.speed": data.speed ? Number(data.speed) : 0,
                        "destinationAddress": data.destinationAddress,
                        "totalDistance": data.totalDistance ? data.totalDistance : 0,
                        "tripType": data.TripType ? data.TripType : 'short',
                        "totalFare": data.totalFare,
                        "totalTime": data.totalTime
                    }

                    RideSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }, {
                        new: true
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        redisClient.del(`ride.passenger.${ride.passengerId.toString()}`)
                        redisClient.del(`ride.status.${ride._id.toString()}`)
                        redisClient.del(`ride.location.${ride._id.toString()}`)
                        redisClient.del(`ride.driver.${ride.driverId.toString()}`)
                        nextCall(null, ride)
                    })
                },
                /** set driver free */
                (ride, nextCall) => {
                    DriverSchema.findOneAndUpdate({
                        _id: ride.driverId
                    }, {
                        isAvailable: true,
                        isBusy: false
                    },
                        function (err, updateData) {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG
                                });
                            }
                            nextCall(null, ride)
                        });
                },

                /** Badge Count of notification */
                (ride, nextCall) => {
                    _self.badgeCount(ride.passengerId._id, isDriver = false, function (err, totalbadgeCount) {
                        if (err) {
                            nextCall({ "message": err })
                        }
                        else {
                            totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1
                            nextCall(null, ride, totalbadgeCount)
                        }
                    })
                },
                /** Badge Count of notification */
                (ride, totalbadgeCount, nextCall) => {
                    NotificationSchema.count({ passengerId: ride.passengerId._id, type: 'recent_transaction', isRead: false }, function (err, badgeCount) {
                        if (err) {
                            return nextCall({ "message": err })
                        }
                        else {
                            badgeCount = badgeCount ? badgeCount + 1 : 1;
                            return nextCall(null, ride, totalbadgeCount, badgeCount)
                        }
                    })
                },

                /** send notification to passenger */
                (ride, totalbadgeCount, badgeCount, nextCall) => {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'passengerId',
                            select: { 'deviceDetail': 1 },
                            populate: { path: 'languageId' }
                        })
                        .populate('driverId').exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }

                            let DRIVER_COMPLETE_RIDE;
                            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                                DRIVER_COMPLETE_RIDE = COMBODIA_MESSAGES['DRIVER_COMPLETE_RIDE'];
                            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                                DRIVER_COMPLETE_RIDE = CHINESE_MESSAGES['DRIVER_COMPLETE_RIDE'];
                            } else {
                                DRIVER_COMPLETE_RIDE = ENGLISH_MESSAGES['DRIVER_COMPLETE_RIDE'];
                            }

                            let pushNotificationData = {
                                to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                                type: 'passenger',
                                data: {
                                    title: '',
                                    type: 7,
                                    body: ride.driverId.name + DRIVER_COMPLETE_RIDE,
                                    badge: totalbadgeCount,
                                    notificationBadgeCountData: {
                                        recent_transaction: badgeCount
                                    },
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                let notificationData = {
                                    title: pushNotificationData.data.body,
                                    receiver_type: 'passenger',
                                    passengerId: ride.passengerId._id,
                                    rideId: ride._id,
                                    type: 'recent_transaction'
                                }
                                let Notification = new NotificationSchema(notificationData);
                                Notification.save((err, notification) => {
                                    if (err) {
                                        return nextCall({
                                            "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                        });
                                    }
                                    nextCall(null, ride)
                                })
                            })
                        })
                },

                /** Badge Count of notification */
                (ride, nextCall) => {
                    _self.badgeCount(ride.driverId._id, isDriver = true, function (err, totalbadgeCount) {
                        if (err) {
                            nextCall({ "message": err })
                        }
                        else {
                            totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1
                            nextCall(null, ride, totalbadgeCount)
                        }
                    })
                },
                /** Badge Count of notification */
                (ride, totalbadgeCount, nextCall) => {
                    NotificationSchema.count({ driverId: ride.driverId._id, type: 'recent_transaction', isRead: false }, function (err, badgeCount) {
                        if (err) {
                            return nextCall({ "message": err })
                        }
                        else {
                            badgeCount = badgeCount ? badgeCount + 1 : 1;
                            return nextCall(null, ride, totalbadgeCount, badgeCount)
                        }
                    })
                },

                /** send notification to driver */
                (ride, totalbadgeCount, badgeCount, nextCall) => {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'driverId',
                            select: { 'deviceDetail': 1 },
                            populate: { path: 'languageId' }
                        }).lean()
                        .populate('passengerId').exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }

                            if(ride && ride.isFoodOrder)
                            {
                                orderCollection.findOneAndUpdate({
                                    _id : mongoose.Types.ObjectId(ride.orderId)
                                },{
                                    $set : {
                                        status : 'Delivered'

                                    }
                                });
                            }


                            let COMPLETE_RIDE;
                            if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'km') {
                                COMPLETE_RIDE = COMBODIA_MESSAGES['COMPLETE_RIDE'];
                            } else if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'zh') {
                                COMPLETE_RIDE = CHINESE_MESSAGES['COMPLETE_RIDE'];
                            } else {
                                COMPLETE_RIDE = ENGLISH_MESSAGES['COMPLETE_RIDE'];
                            }

                            let pushNotificationData = {
                                to: (ride.driverId.deviceDetail && ride.driverId.deviceDetail.token) || '',
                                type: 'driver',
                                data: {
                                    title: '',
                                    type: 20,
                                    body: COMPLETE_RIDE,
                                    badge: totalbadgeCount,
                                    notificationBadgeCountData: {
                                        recent_transaction: badgeCount
                                    },
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                let notificationData = {
                                    title: pushNotificationData.data.body,
                                    receiver_type: 'driver',
                                    driverId: ride.driverId._id,
                                    rideId: ride._id,
                                    type: 'recent_transaction'
                                }
                                let Notification = new NotificationSchema(notificationData);
                                Notification.save((err, notification) => {
                                    if (err) {
                                        return nextCall({
                                            "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                        });
                                    }
                                    nextCall(null, ride)
                                })
                            })
                        })
                },
               (ride,nextCall)=>{
                let condition = {
                    "_id": ride.passengerId,
                };
                let updateData= {
                    $inc: { 
                      walletMoney: -Number(ride.totalFare)
                    }
                };
                  PassengerSchema.updateOne(condition, updateData).exec((err, passengerData) => {
                    if (err) {
                        return nextCall({
                            "message": data.languageMessage.SOMETHING_WENT_WRONG,
                        });
                    }      
                    let data={}; 
                    data.passengerId = ride.passengerId;
                    nextCall(null, ride, data);
                    })
               },
               (ride,data,nextCall)=>{
                let newRide = ride;
                SystemSettingsSchema.find({}).exec(async function (err, getSettingData) {
                    if (err) {
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                    if (getSettingData[0]) {
                        // console.log('here getSettingData ----', getSettingData);
                    newRide.adminPercentage =  getSettingData[0].adminFee;
                    // now find vehicle owner commission based on vehicle type
                    let vehicleTypeData =  await VehicleTypeSchema.findOne({_id:newRide.requestedVehicleTypeId});
                    if(vehicleTypeData){
                        newRide.vehicleOwnerPercentage = vehicleTypeData.commission;
                    }else {
                      console.log('unable to find vehicleType', newRide.requestedVehicleTypeId);
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                    // find driver refreal 
                    let isDriverAddedByPromoter = await DriverSchema.findOne({_id:newRide.driverId}).populate('addedBy','type userCommission _id');
                    if(isDriverAddedByPromoter && isDriverAddedByPromoter.addedBy && isDriverAddedByPromoter.addedBy.type=='promoter'){
                        newRide.promoterDriverReferal = true;
                        newRide.promoterDriverId = isDriverAddedByPromoter.addedBy._id;
                        newRide.promoterDriverPercentage= isDriverAddedByPromoter.addedBy.userCommission;
                    }else {
                        newRide.promoterDriverReferal = false;
                    }
                    // find vehicle addedBy data 
                    let getVehicleData = await VehicleSchema.findOne({ _id: newRide.vehicleId}).populate('addedBy', 'addedBy');
                    if(getVehicleData){
                        newRide.VoId = getVehicleData.addedBy;
                      let isVoAddedByPromoter = await AdminSchema.findOne({ _id: getVehicleData.addedBy.addedBy}, 'type vehicleOwnerCommission');
                      if(isVoAddedByPromoter && isVoAddedByPromoter.type=='promoter'){
                        newRide.promoterVoReferal = true;
                        newRide.promoterVehicleId = isVoAddedByPromoter.addedBy._id;
                        newRide.promoterVehiclePercentage = Number(isVoAddedByPromoter.vehicleOwnerCommission);
                      }else {
                        newRide.promoterVoReferal = false;
                      }
                    }else {
                      console.log('unable to find vehicle from ride', newRide._id);
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                    newRide.passengerId = data.passengerId;
                    console.log('data after getting data', data);
                      nextCall(null, newRide, data)
                    }
                  
                  })
               },
               (ride, data, nextCall) => {
                // console.log('rideData', ride);  
                console.log('data--- for calculation', data)
                console.log('adminPercentafe', ride.passengerId); 
                let totalFare = ride.totalFare;
                console.log('totalFare', ride.totalFare);
                let adminCommission = (totalFare/100) * ride.adminPercentage;
                let driverPromoterReferal=0;
                let promoterVoReferal=0;
                console.log('adminCommission', adminCommission);
                totalFare = totalFare - adminCommission;
                if(ride.promoterDriverReferal){
                  driverPromoterReferal = (totalFare/100) * ride.promoterDriverPercentage;
                  totalFare =  totalFare- driverPromoterReferal;
                 }
                 if(ride.promoterVoReferal){
                  promoterVoReferal = (totalFare/100) * ride.promoterVehiclePercentage;
                  totalFare =  totalFare - promoterVoReferal;
                 }
                 let vehicleOwnerCommission = (totalFare/100) * ride.vehicleOwnerPercentage;
                 totalFare =  totalFare - vehicleOwnerCommission;
                 console.log('vehicleOwnerCommission', vehicleOwnerCommission);
                //  nextCall(null, ride, data)
                 let driverCommission =totalFare;
            
                 // update commission to driver 
                 let updateData= { 
                  driverCommission: driverCommission,
                  promoterDriverCommission: driverPromoterReferal,
                  promoterVoCommission: promoterVoReferal,
                  voCommission:vehicleOwnerCommission 
                 }
                 RideSchema.updateOne({ _id: ride._id},updateData).exec(async function (err, ){
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  //  create transaction here 
                  // admin transaction 
                  console.log('passengerId',ride.passengerId)
                  let adminData= { 
                   roleForm: 'passenger',
                   from: ride.passengerId,
                   roleTo: 'admin',
                   to: mongoose.Types.ObjectId('5d3ee2c8f28cbd5d43b3793e'),// adminId
                   transferType:'rideTransfer',
                   rideId: ride._id,
                   createdBy: ride.passengerId,
                   amount:  adminCommission
                  }
                  await commonHelper.walletAccountLogs(adminData);
                  let driverData= { 
                    roleForm: 'passenger',
                    from: ride.passengerId,
                    roleTo: 'admin',
                    to: ride.driverId,// adminId
                    transferType:'rideTransfer',
                    rideId: ride._id,
                    createdBy: ride.passengerId,
                    amount:  driverCommission
                  }
                  await DriverSchema.updateOne({ _id : ride.driverId}, { $inc: {walletMoney : Number(driverCommission)}})
                  await commonHelper.walletAccountLogs(driverData);
                  
                  let VoData={
                    roleForm: 'passenger',
                    from: ride.passengerId,
                    roleTo: 'admin',
                    to: ride.VoId,// adminId
                    transferType:'rideTransfer',
                    rideId: ride._id,
                    createdBy: ride.passengerId,
                    amount:  vehicleOwnerCommission
                  }
                  await AdminSchema.updateOne({ _id : ride.VoId}, { $inc: {walletMoney : Number(vehicleOwnerCommission)}})
                  await commonHelper.walletAccountLogs(VoData);
                  if(ride.promoterDriverReferal){
                    let promoterDriverData={
                      roleForm: 'passenger',
                   from: ride.passengerId,
                   roleTo: 'admin',
                   to: ride.promoterDriverId,// adminId
                   transferType:'rideTransfer',
                   rideId: ride._id,
                   createdBy: ride.passengerId,
                   amount:  driverPromoterReferal
                    }
                    await AdminSchema.updateOne({ _id : ride.promoterDriverId}, { $inc: {walletMoney : Number(driverPromoterReferal)}})
                    await commonHelper.walletAccountLogs(promoterDriverData);
                  }
                  if(ride.promoterVoReferal){
                    let promoterVoData={
                    roleForm: 'passenger',
                   from: ride.passengerId,
                   roleTo: 'admin',
                   to: ride.promoterVehicleId,// adminId
                   transferType:'rideTransfer',
                   rideId: ride._id,
                   createdBy: ride.passengerId,
                   amount:  promoterVoReferal
                    }
                    await AdminSchema.updateOne({ _id : ride.promoterVehicleId}, { $inc: {walletMoney : Number(promoterVoReferal)}})
                    await commonHelper.walletAccountLogs(promoterVoData);
                    nextCall(null, ride)
                  }
                 })
                }
            ], (err, response) => {
                if (err) {
                    console.log('completeRide Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.DRIVER_COMPLETE_RIDE_SUCC,
                    data: response
                })
            })

        }
    },

    getReceipt: (socket, nsp, io) => {
        console.log('driver get getReceipt');
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'driverId': socket.userInfo._id,
                        'status': 'completed'
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data)
                        }
                    })
                },
                /** get ride */
                (data, nextCall) => {
                    let condition = {
                        "_id": data.rideId,
                        "status": "completed"
                    };
                    RideSchema.findOne(condition).populate('vehicleId').lean().exec((err, ride) => {
                        nextCall(null, ride)
                    });

                    // RideSchema.aggregate([
                    //     {
                    //         '$match': {
                    //             "_id": data.rideId,
                    //             'status': 'completed'
                    //         }
                    //     }, {
                    //         '$lookup': {
                    //             'from': 'driver',
                    //             'localField': 'driverId',
                    //             'foreignField': '_id',
                    //             'as': 'driverDetails'
                    //         }
                    //     }, {
                    //         '$unwind': {
                    //             'path': '$driverDetails',
                    //             'preserveNullAndEmptyArrays': false
                    //         }
                    //     }, {
                    //         '$lookup': {
                    //             'from': 'vehicle_type',
                    //             'localField': 'driverDetails.vehicle.typeId',
                    //             'foreignField': '_id',
                    //             'as': 'vehicleTypeDetails'
                    //         }
                    //     }, {
                    //         '$unwind': {
                    //             'path': '$vehicleTypeDetails'
                    //         }
                    //     }, {
                    //         '$lookup': {
                    //             'from': 'passenger',
                    //             'localField': 'passengerId',
                    //             'foreignField': '_id',
                    //             'as': 'passengerDetails'
                    //         }
                    //     }, {
                    //         '$unwind': {
                    //             'path': '$passengerDetails',
                    //             'preserveNullAndEmptyArrays': true
                    //         }
                    //     }
                    // ], function (err, ride) {
                    //     console.log(err);
                    //     console.log(ride);
                    //     if (err) {
                    //         return nextCall({
                    //             "message": data.languageMessage.SOMETHING_WENT_WRONG,
                    //         });
                    //     }
                    //     nextCall(null, ride)
                    // });
                },

                (ride, nextCall) => {
                    let condition = {
                        "_id": ride.driverId,
                    };
                    DriverSchema.findOne(condition).lean().exec((err, driver) => {
                        ride.driverDetails = driver;
                        ride.driverDetails.vehicle = ride.vehicleId;
                        nextCall(null, ride)
                    });
                },

                (ride, nextCall) => {
                    let condition = {
                        "_id": ride.passengerId,
                    };
                    PassengerSchema.findOne(condition).lean().exec((err, passenger) => {
                        ride.passengerId = passenger;
                        nextCall(null, ride)
                    });
                },

                (ride, nextCall) => {
                    let condition = {
                        "_id": ride.requestedVehicleTypeId,
                    };
                    VehicleTypeSchema.findOne(condition).lean().exec((err, passenger) => {
                        ride.vehicleDetails = passenger;
                        nextCall(null, ride)
                    });
                },
                (ride, nextCall) => {
                    EmergencySchema.find().lean().exec((err, emergency) => {
                        ride.emergencyDetails = emergency
                        nextCall(null, ride)
                    });
                },

            ], (err, response) => {
                if (err) {
                    console.log('getReceipt Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.GET_RECEIPT_SUCC,
                    data: response
                })
            })

        }
    },


    rideRate: (socket, nsp, io) => {
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                
                (nextCall) => {
                    console.log('rideId', data.rideId);
                    console.log('rate', data.rate);
                    console.log('passengerId', data.passengerId);
                    console.log('comment', data.comment);
                    if (!data || !data.rideId || !data.rate || !data.passengerId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'passengerId': data.passengerId,
                        "status": "completed",
                        "paymentStatus": true
                    }).exec((err, ride) => {
                        console.log('err', err);
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data)
                        }
                    })
                },
                /** gives rate to driver of ride */
                (data, nextCall) => {
                    /** update ride rate and driver is in ride collection */
                    let condition = {
                        "_id": data.rideId,
                        "status": "completed",
                        "paymentStatus": true
                    };
                    let updateData = {
                        "isPassengerRating": true,
                        "passengerRate": Number(data.rate),
                        "passengerComment": data.comment
                    }
                    RideSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }, {
                        new: true
                    }).populate('passengerId').exec((err, ride) => {
                        console.log('err1', err);
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, data, ride)
                    })
                },
                /** update driver rates */
                (data, ride, nextCall) => {
                    if (ride.passengerId.totalRating === undefined) {
                        ride.passengerId.totalRating = 0;
                    }
                    if (ride.passengerId.ratedCount === undefined) {
                        ride.passengerId.ratedCount = 0;
                    }
                    let totalRating = ride.passengerId.totalRating + Number(data.rate);
                    let ratedCount = ride.passengerId.ratedCount + 1;
                    let avgRating = Math.round(totalRating / ratedCount)

                    let condition = {
                        "_id": ride.passengerId._id
                    };
                    let updateData = {
                        'totalRating': ride.passengerId.totalRating + Number(data.rate),
                        'ratedCount': ride.passengerId.ratedCount + 1,
                        'avgRating': avgRating
                    }
                    PassengerSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }).exec((err, passenger) => {
                        console.log('err2', err);
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null)
                    })
                }
            ], (err, response) => {
                if (err) {
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.RIDE_RATE_SUCC,
                    data: response
                })
            })

        }
    },

    cashPaid: (socket, nsp, io) => { //  this need to be change 
        console.log('cash paid');
        return (data, CB) => {
            async.waterfall([
                /** check required parameters */
                (nextCall) => {
                    if (!data || !data.rideId) {
                        return nextCall({
                            'message': data.languageMessage.INVALID_PARAMS
                        })
                    }
                    nextCall(null, data)
                },
                /** check ride and driver is valid or not */
                (data, nextCall) => {
                    RideSchema.findOne({
                        '_id': data.rideId,
                        'driverId': socket.userInfo._id,
                        'status': 'completed',
                        'paymentStatus': false
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!ride) {
                            return nextCall({
                                'message': data.languageMessage.INVALID_PARAMS
                            })
                        } else {
                            nextCall(null, data)
                        }
                    })
                },
                /** get Ride */
                (data, nextCall) => {
                    let condition = {
                        "_id": data.rideId,
                        "status": "completed"
                    };
                    RideSchema.findOne(condition).populate('vehicleId').exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, ride, data)
                    })
                },
                /** deduct ride amount from drive credit balance */
                (ride, data, nextCall) => {
                    let condition = {
                        "_id": socket.userInfo._id,
                    }
                    DriverSchema.findOne(condition).populate('billingId').exec((err, driver) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!driver) {
                            return nextCall({
                                "message": data.languageMessage.DRIVER_NOT_FOUND
                            });
                        } else {
                            nextCall(null, ride, data, driver)
                        }
                    })
                },
                /** update status */
                (ride, data, driver, nextCall) => {
                    if (driver.billingId && driver.billingId != '' && driver.billingId.type == 'individual_plan') {
                        // if(driver.billingId.billingType == 'percentage') {
                        /** update ride status and driver is in ride collection */

                        // data.driverEarning = Number(ride.totalFare) * (1 - (Number(driver.billingId.chargeAmt) / 100)); // 21-11-2019
                        data.driverEarning = Number(ride.totalFare);
                        data.adminEarning = Number(ride.totalFare) * (Number(driver.billingId.chargeAmt) / 100);
                        // } else {
                        //     /** update ride status and driver is in ride collection */
                        //     data.driverEarning = Number(ride.totalFare) - Number(driver.billingId.chargeAmt);
                        //     data.adminEarning = Number(ride.totalFare) - (Number(ride.totalFare) - Number(driver.billingId.chargeAmt)); 
                        // }
                    } else {
                        /** update ride status and driver is in ride collection */
                        data.driverEarning = Number(ride.totalFare);
                        data.adminEarning = 0; // will change admin fees according to this 
                    }
                    let condition = {
                        "_id": data.rideId,
                        "status": "completed"
                    };
                    let updateData = {
                        "paymentStatus": true,
                        "paymentAt": DS.now(),
                        'driverEarning': data.driverEarning,
                        'adminEarning': data.adminEarning
                    }
                    RideSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }, {
                        new: true
                    }).exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, ride, driver)
                    })
                },
                /** deduct ride amount from drive credit balance */ 
                (ride, driver, nextCall) => {
                    if (driver.billingId && driver.billingId != '' && driver.billingId.type == 'individual_plan') {
                        let condition = {
                            "_id": socket.userInfo._id,
                        }
                        DriverSchema.findOneAndUpdate(condition, {
                            $inc: { creditBalance: -ride.adminEarning }
                        }, {
                            new: true
                        }).exec((err, updatedDriver) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }
                            nextCall(null, ride, driver)
                        })
                    } else {
                        nextCall(null, ride, driver)
                    }
                },
                /** add rides and point count to driver*/
                (ride, driver, nextCall) => {
                    let condition = {
                        "_id": socket.userInfo._id,
                    }
                    DriverSchema.findOneAndUpdate(condition, {
                        $inc: {
                            totalCompletedRides: 1,
                            earningFromRide: ride.driverEarning
                            // totalPoints: 1
                        }
                    }, {
                        new: true
                    }).exec((err, driver) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, ride, driver)
                    })
                },
                /** add rides and point count to passenger */
                (ride, driver, nextCall) => {
                    let condition = {
                        "_id": ride.passengerId,
                    }
                    PassengerSchema.findOneAndUpdate(condition, {
                        $inc: {
                            totalCompletedRides: 1,
                            earningFromRide: ride.totalFare
                            // totalPoints: 1
                        }
                    }).exec((err, passenger) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null, ride, driver)
                    })
                },
                /** get driver referral auto increment id */
                function (ride, driver, nextCall) {
                    _self.getReferralAutoIncrement(function (err, response) {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG
                            })
                        }
                        autoIncrementID = response.driverReferralAutoIncrement;
                        nextCall(null, ride, driver, autoIncrementID)
                    });
                },
                /** distributing referrals if driver has parents*/
                (ride, driver, autoIncrementID, nextCall) => {
                    if (driver.driverLevel > 0) {
                        let logData = [];
                        let condition = {
                            "driver": socket.userInfo._id
                        }
                        DriverReferralSchema.findOne(condition).exec((err, driverReferral) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            } else if (!driverReferral) {
                                return nextCall({
                                    "message": data.languageMessage.DRIVER_NOT_FOUND
                                });
                            } else if (driverReferral.driverLevel == 1) {
                                let refAmt = ride.totalFare * 0.02;
                                let condition = {
                                    "_id": driverReferral.parentDriver
                                }
                                DriverSchema.findOneAndUpdate(condition, {
                                    $inc: { earningFromReferral: refAmt }
                                }, {
                                    new: true
                                }).exec((err, updatedDriver) => {
                                    if (err) {
                                        return nextCall({
                                            "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                        });
                                    }
                                    autoIncrementID = autoIncrementID + 1;
                                    logData.push({
                                        rideId: ride._id,
                                        driverId: socket.userInfo._id,
                                        beneficiaryDriverId: driverReferral.parentDriver,
                                        referralAmount: refAmt,
                                        autoIncrementID: autoIncrementID,
                                    })
                                    nextCall(null, ride, logData, autoIncrementID)
                                })
                            } else if (driverReferral.driverLevel == 2) {
                                let refAmtP1 = ride.totalFare * 0.015
                                let refAmtP2 = ride.totalFare * 0.005
                                let driver1 = {
                                    condition: {
                                        "_id": driverReferral.parentDriver
                                    },
                                    amt: refAmtP1
                                }
                                let driver2 = {
                                    condition: {
                                        "_id": driverReferral.grandParentDriver
                                    },
                                    amt: refAmtP2
                                }
                                let drivers = [driver1, driver2];
                                async.each(drivers, function (driver, callback) {
                                    DriverSchema.findOneAndUpdate(driver.condition, {
                                        $inc: { earningFromReferral: driver.amt }
                                    }, {
                                        new: true
                                    }).exec((err, updatedDriver) => {
                                        if (err) {
                                            return nextCall({
                                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                            });
                                        }
                                        autoIncrementID = autoIncrementID + 1;
                                        logData.push({
                                            rideId: ride._id,
                                            driverId: socket.userInfo._id,
                                            beneficiaryDriverId: driver.condition._id,
                                            referralAmount: driver.amt,
                                            autoIncrementID: autoIncrementID,
                                        });
                                        callback();
                                    })
                                }, function (err) {
                                    nextCall(null, ride, logData, autoIncrementID);
                                })

                            } else if (driverReferral.driverLevel >= 3) {
                                let refAmtP1 = ride.totalFare * 0.01
                                let refAmtP2 = ride.totalFare * 0.005
                                let refAmtP3 = ride.totalFare * 0.005

                                let driver1 = {
                                    condition: {
                                        "_id": driverReferral.parentDriver
                                    },
                                    amt: refAmtP1
                                }
                                let driver2 = {
                                    condition: {
                                        "_id": driverReferral.grandParentDriver
                                    },
                                    amt: refAmtP2
                                }
                                let driver3 = {
                                    condition: {
                                        "_id": driverReferral.greatGrandParentDriver
                                    },
                                    amt: refAmtP3
                                }
                                let drivers = [driver1, driver2, driver3];
                                async.each(drivers, function (driver, callback) {
                                    DriverSchema.findOneAndUpdate(driver.condition, {
                                        $inc: { earningFromReferral: driver.amt }
                                    }, {
                                        new: true
                                    }).exec((err, updatedDriver) => {
                                        if (err) {
                                            return nextCall({
                                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                            });
                                        }
                                        autoIncrementID = autoIncrementID + 1;
                                        logData.push({
                                            rideId: ride._id,
                                            driverId: socket.userInfo._id,
                                            beneficiaryDriverId: driver.condition._id,
                                            referralAmount: driver.amt,
                                            autoIncrementID: autoIncrementID,
                                        });
                                        callback();
                                    })
                                }, function (err) {
                                    nextCall(null, ride, logData, autoIncrementID);
                                })
                            }
                        })
                    } else {
                        nextCall(null, ride, false, false)
                    }
                },
                /** update system setting auto increment */
                (ride, logData, autoIncrementID, nextCall) => {
                    if (logData && autoIncrementID) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $set: {
                                "driverReferralAutoIncrement": autoIncrementID
                            }
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": data.languageMessage.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, ride, logData);
                            });
                    } else {
                        nextCall(null, ride, false)
                    }
                },
                /** logData insert if not null */
                (ride, logData, nextCall) => {
                    if (logData) {
                        DriverRefEarningLogSchema.insertMany(logData)
                            .then(function (docs) {
                                nextCall(null, ride)
                            })
                            .catch(function (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            });
                    } else {
                        nextCall(null, ride)
                    }
                },

                // passenger referral distribution
                (ride, nextCall) => {
                    let condition = {
                        "_id": ride.passengerId,
                    }
                    PassengerSchema.findOne(condition).exec((err, passenger) => {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                            });
                        } else if (!passenger) {
                            return nextCall({
                                "message": data.languageMessage.DRIVER_NOT_FOUND
                            });
                        } else {
                            nextCall(null, ride, passenger)
                        }
                    })
                },
                /** get passenger referral auto increment id */
                function (ride, passenger, nextCall) {
                    _self.getReferralAutoIncrement(function (err, response) {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG
                            })
                        }
                        autoIncrementID = response.passengerReferralAutoIncrement;
                        nextCall(null, ride, passenger, autoIncrementID)
                    });
                },
                (ride, passenger, autoIncrementID, nextCall) => {
                    if (passenger.passengerLevel > 0) {
                        let logData = [];
                        let condition = {
                            "passenger": passenger._id
                        }
                        PassengerReferralSchema.findOne(condition).exec((err, passengerReferral) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            } else if (!passengerReferral) {
                                return nextCall({
                                    "message": data.languageMessage.PASSENGER_NOT_FOUND
                                });
                            } else if (passengerReferral.passengerLevel == 1) {
                                let refAmt = ride.totalFare * 0.03;
                                let condition = {
                                    "_id": passengerReferral.level1Passenger
                                }
                                PassengerSchema.findOneAndUpdate(condition, {
                                    $inc: { earningFromReferral: refAmt }
                                }, {
                                    new: true
                                }).exec((err, updatedDriver) => {
                                    if (err) {
                                        return nextCall({
                                            "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                        });
                                    }
                                    autoIncrementID = autoIncrementID + 1;
                                    logData.push({
                                        rideId: ride._id,
                                        passengerId: passenger._id,
                                        beneficiaryPassengerId: passengerReferral.level1Passenger,
                                        referralAmount: refAmt,
                                        autoIncrementID: autoIncrementID,
                                    })
                                    nextCall(null, ride, logData, autoIncrementID)
                                })
                            } else if (passengerReferral.passengerLevel == 2) {
                                let refAmtP1 = ride.totalFare * 0.025
                                let refAmtP2 = ride.totalFare * 0.005
                                let passenger1 = {
                                    condition: {
                                        "_id": passengerReferral.level1Passenger
                                    },
                                    amt: refAmtP1
                                }
                                let passenger2 = {
                                    condition: {
                                        "_id": passengerReferral.level2Passenger
                                    },
                                    amt: refAmtP2
                                }
                                let passengers = [passenger1, passenger2];
                                async.each(passengers, function (passengerTemp, callback) {
                                    PassengerSchema.findOneAndUpdate(passengerTemp.condition, {
                                        $inc: { earningFromReferral: passengerTemp.amt }
                                    }, {
                                        new: true
                                    }).exec((err, updatedDriver) => {
                                        if (err) {
                                            return nextCall({
                                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                            });
                                        }
                                        autoIncrementID = autoIncrementID + 1;
                                        logData.push({
                                            rideId: ride._id,
                                            passengerId: passenger._id,
                                            beneficiaryPassengerId: passengerTemp.condition._id,
                                            referralAmount: passengerTemp.amt,
                                            autoIncrementID: autoIncrementID,
                                        });
                                        callback();
                                    })
                                }, function (err) {
                                    nextCall(null, ride, logData, autoIncrementID)
                                })

                            } else if (passengerReferral.passengerLevel == 3) {
                                let refAmtP1 = ride.totalFare * 0.02
                                let refAmtP2 = ride.totalFare * 0.005
                                let refAmtP3 = ride.totalFare * 0.005

                                let passenger1 = {
                                    condition: {
                                        "_id": passengerReferral.level1Passenger
                                    },
                                    amt: refAmtP1
                                }
                                let passenger2 = {
                                    condition: {
                                        "_id": passengerReferral.level2Passenger
                                    },
                                    amt: refAmtP2
                                }
                                let passenger3 = {
                                    condition: {
                                        "_id": passengerReferral.level3Passenger
                                    },
                                    amt: refAmtP3
                                }
                                let passengers = [passenger1, passenger2, passenger3];
                                async.each(passengers, function (passengerTemp, callback) {
                                    PassengerSchema.findOneAndUpdate(passengerTemp.condition, {
                                        $inc: { earningFromReferral: passengerTemp.amt }
                                    }, {
                                        new: true
                                    }).exec((err, updatedDriver) => {
                                        if (err) {
                                            return nextCall({
                                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                            });
                                        }
                                        autoIncrementID = autoIncrementID + 1;
                                        logData.push({
                                            rideId: ride._id,
                                            passengerId: passenger._id,
                                            beneficiaryPassengerId: passengerTemp.condition._id,
                                            referralAmount: passengerTemp.amt,
                                            autoIncrementID: autoIncrementID,
                                        });
                                        callback();
                                    })
                                }, function (err) {
                                    nextCall(null, ride, logData, autoIncrementID)
                                })
                            } else if (passengerReferral.passengerLevel == 4) {
                                let refAmtP1 = ride.totalFare * 0.015
                                let refAmtP2 = ride.totalFare * 0.005
                                let refAmtP3 = ride.totalFare * 0.005
                                let refAmtP4 = ride.totalFare * 0.005

                                let passenger1 = {
                                    condition: {
                                        "_id": passengerReferral.level1Passenger
                                    },
                                    amt: refAmtP1
                                }
                                let passenger2 = {
                                    condition: {
                                        "_id": passengerReferral.level2Passenger
                                    },
                                    amt: refAmtP2
                                }
                                let passenger3 = {
                                    condition: {
                                        "_id": passengerReferral.level3Passenger
                                    },
                                    amt: refAmtP3
                                }
                                let passenger4 = {
                                    condition: {
                                        "_id": passengerReferral.level4Passenger
                                    },
                                    amt: refAmtP4
                                }
                                let passengers = [passenger1, passenger2, passenger3, passenger4];
                                async.each(passengers, function (passengerTemp, callback) {
                                    PassengerSchema.findOneAndUpdate(passengerTemp.condition, {
                                        $inc: { earningFromReferral: passengerTemp.amt }
                                    }, {
                                        new: true
                                    }).exec((err, updatedDriver) => {
                                        if (err) {
                                            return nextCall({
                                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                            });
                                        }
                                        autoIncrementID = autoIncrementID + 1;
                                        logData.push({
                                            rideId: ride._id,
                                            passengerId: passenger._id,
                                            beneficiaryPassengerId: passengerTemp.condition._id,
                                            referralAmount: passengerTemp.amt,
                                            autoIncrementID: autoIncrementID,
                                        });
                                        callback();
                                    })
                                }, function (err) {
                                    nextCall(null, ride, logData, autoIncrementID)
                                })
                            } else if (passengerReferral.passengerLevel >= 5) {
                                let refAmtP1 = ride.totalFare * 0.01
                                let refAmtP2 = ride.totalFare * 0.005
                                let refAmtP3 = ride.totalFare * 0.005
                                let refAmtP4 = ride.totalFare * 0.005
                                let refAmtP5 = ride.totalFare * 0.005

                                let passenger1 = {
                                    condition: {
                                        "_id": passengerReferral.level1Passenger
                                    },
                                    amt: refAmtP1
                                }
                                let passenger2 = {
                                    condition: {
                                        "_id": passengerReferral.level2Passenger
                                    },
                                    amt: refAmtP2
                                }
                                let passenger3 = {
                                    condition: {
                                        "_id": passengerReferral.level3Passenger
                                    },
                                    amt: refAmtP3
                                }
                                let passenger4 = {
                                    condition: {
                                        "_id": passengerReferral.level4Passenger
                                    },
                                    amt: refAmtP4
                                }
                                let passenger5 = {
                                    condition: {
                                        "_id": passengerReferral.level5Passenger
                                    },
                                    amt: refAmtP5
                                }
                                let passengers = [passenger1, passenger2, passenger3, passenger4, passenger5];
                                async.each(passengers, function (passengerTemp, callback) {
                                    PassengerSchema.findOneAndUpdate(passengerTemp.condition, {
                                        $inc: { earningFromReferral: passengerTemp.amt }
                                    }, {
                                        new: true
                                    }).exec((err, updatedDriver) => {
                                        if (err) {
                                            return nextCall({
                                                "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                            });
                                        }
                                        autoIncrementID = autoIncrementID + 1;
                                        logData.push({
                                            rideId: ride._id,
                                            passengerId: passenger._id,
                                            beneficiaryPassengerId: passengerTemp.condition._id,
                                            referralAmount: passengerTemp.amt,
                                            autoIncrementID: autoIncrementID,
                                        });
                                        callback();
                                    })
                                }, function (err) {
                                    nextCall(null, ride, logData, autoIncrementID)
                                })
                            }

                        })
                    } else {
                        nextCall(null, ride, false, false)
                    }
                },
                /** update system setting auto increment */
                (ride, logData, autoIncrementID, nextCall) => {
                    if (logData && autoIncrementID) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $set: {
                                "passengerReferralAutoIncrement": autoIncrementID
                            }
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": data.languageMessage.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, ride, logData);
                            });
                    } else {
                        nextCall(null, ride, false)
                    }
                },
                (ride, logData, nextCall) => {
                    if (logData) {
                        PassengerReferralEarningLogs.insertMany(logData)
                            .then(function (docs) {
                                nextCall(null, ride)
                            })
                            .catch(function (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            });
                    } else {
                        nextCall(null, ride)
                    }
                },


                /** send notification to passenger */
                (ride, nextCall) => {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'passengerId',
                            select: { 'deviceDetail': 1 },
                            populate: { path: 'languageId' }
                        })
                        .populate('driverId').exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                });
                            }

                            let DRIVER_GET_RIDE_PAYMENT_SUCC;
                            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                                DRIVER_GET_RIDE_PAYMENT_SUCC = COMBODIA_MESSAGES['DRIVER_GET_RIDE_PAYMENT_SUCC'];
                            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                                DRIVER_GET_RIDE_PAYMENT_SUCC = CHINESE_MESSAGES['DRIVER_GET_RIDE_PAYMENT_SUCC'];
                            } else {
                                DRIVER_GET_RIDE_PAYMENT_SUCC = ENGLISH_MESSAGES['DRIVER_GET_RIDE_PAYMENT_SUCC'];
                            }

                            let pushNotificationData = {
                                to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                                type: 'passenger',
                                data: {
                                    title: '',
                                    type: 8,
                                    body: ride.driverId.name + DRIVER_GET_RIDE_PAYMENT_SUCC,
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                nextCall(null, ride)
                                // let notificationData = {
                                //     title: pushNotificationData.data.body,
                                //     receiver_type: 'passenger',
                                //     passengerId: ride.passengerId._id,
                                //     rideId: ride._id
                                // }
                                // let Notification = new NotificationSchema(notificationData);
                                // Notification.save((err, notification) => {
                                //     if (err) {
                                //         return nextCall({
                                //             "message": data.languageMessage.SOMETHING_WENT_WRONG,
                                //         });
                                //     }
                                //     nextCall(null, ride)
                                // })
                            })
                        })
                }
            ], (err, response) => {
                if (err) {
                    console.log('cashPaid Error:', err)
                    return CB({
                        status: 400,
                        message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
                    })
                }
                return CB({
                    status: 200,
                    message: data.languageMessage.RIDE_PAYMENT_SUCC,
                    data: response
                })
            })

        }
    },

    getReferralAutoIncrement: function (callback) {
        console.log('getReferralAutoIncrement');
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": data.languageMessage.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        nextCall(null, getSystemSettingData[0])
                    } else {
                        if (err) {
                            return nextCall({
                                "message": data.languageMessage.SOMETHING_WENT_WRONG
                            })
                        }
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    badgeCount: function (id, isDriver, callback) {
        console.log('driver badge count');
        var matchObj = {}
        var response = {}
        if (isDriver) {
            matchObj = {
                driverId: id,
                isRead: false
            }
        } else {
            matchObj = {
                passengerId: id,
                isRead: false
            }
        }
        NotificationSchema.count(matchObj).exec(function (err, result) {
            if (err) {
                return callback({ err: err })
            }
            else {
                return callback(null, result)
            }
        })
        return response
    },

    // getDistance from lat long
    getDistance: function (wPoints, callback) {
        console.log(' driver get distance');
        var dist = 0;
        for (let i = 0; i < wPoints.length; i++) {
            if (i == wPoints.length - 1) {
            } else {
                dist =
                    dist +
                    _self.getDistanceFromLatLonInKm(
                        wPoints[i].coordinates[1],
                        wPoints[i].coordinates[0],
                        wPoints[i + 1].coordinates[1],
                        wPoints[i + 1].coordinates[0]
                    );
            }
        }
        return callback(null, dist)
    },

    getDistanceFromLatLonInKm: function (lat1, lon1, lat2, lon2, callback) {
        console.log('driver get distance from lat lan in km')
        var R = 6371; // Radius of the earth in km
        var dLat = _self.deg2rad(lat2 - lat1); // deg2rad below
        var dLon = _self.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(_self.deg2rad(lat1)) *
            Math.cos(_self.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    },

    deg2rad: function (deg) {
        console.log('driver deg2rad');
        return deg * (Math.PI / 180);
    },
};

module.exports = _self;