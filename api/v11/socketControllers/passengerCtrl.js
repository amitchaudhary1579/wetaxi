// var util = require('util');
// var debug = require('debug')('x-code:v1:socket:socketControllers:passengerCtrl');

var moment = require('moment'),
  async = require('async'),
  // path = require('path'),
  _ = require('underscore'),
  mongoose = require('mongoose'),
  // Push notification
  pn = require('../../../support/push-notifications/pn'),
  CONSTANTS = rootRequire('config/constant'),
  EmergencySchema = require('../models/emergency'),
  /** languages */
  ENGLISH_MESSAGES = rootRequire('config/messages/en'),
  COMBODIA_MESSAGES = rootRequire('config/messages/km'),
  CHINESE_MESSAGES = rootRequire('config/messages/zh'),
  redisClient = rootRequire('support/redis');

const PassengerSchema = require('../models/passenger');
const DriverSchema = require('../models/driver');
const RideSchema = require('../models/ride');
const VehicleTypeSchema = require('../models/vehicleType');
const VehicleSchema = require('../models/vehicle');
const DriverRideRequestSchema = require('../models/driverRideRequest');
const SystemSettingsSchema = require('../models/systemSettings');
const NotificationSchema = require('../models/notification');
const SocketIO = rootRequire('support/socket.io');
const ReasonSchema = require('../models/reason');
const PassengerReferralSchema = require('../models/passengerReferrals');
const commonHelper = require('../policies/commonHelper');

const CAR_MAX_ROWS = 100;
const DRIVER_MIN_BALANCE = 0;
const MAX_SEARCH_RADIUS = 400 * 1000; // In km 400
const RIDE_REQUEST_TIMEOUT = 20 * 1000; // In seconds 20

// Create indexs required in DriverSchema
PassengerSchema.collection.createIndex({
  location: "2dsphere"
}, function (err, resp) { });

DriverSchema.collection.createIndex({
  location: "2dsphere"
}, function (err, resp) { });

var _self = {

  // done
  getUniqueId: function (callback) {
    async.waterfall([
      function (nextCall) {
        SystemSettingsSchema.findOneAndUpdate({}, {
          $inc: {
            "uniqueID": 1
          }
        }, {
          upsert: true,
          new: true,
        },
          function (err, updateData) {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG
              });
            }
            nextCall(null, updateData.uniqueID)
          });
      }
    ], function (err, response) {
      callback(err, response);
    })
  },

  // done
  connect: (socket, nsp, io) => {
    console.log('passenger socket connect')
    if (!socket.userInfo || (socket.userInfo && socket.userInfo.type !== 'passenger')) {
      return
    }
    PassengerSchema.findOne({
      "_id": socket.userInfo._id
    }, {
      socketId: 1
    })
      .lean()
      .then(passenger => {
        if (!passenger) {
          return passenger
        }
        return PassengerSchema
          .update({
            _id: socket.userInfo._id
          }, {
            socketId: socket.id
          }, {
            new: true
          })
          .then(updated => {
            return passenger
          })
      })
      .then(passenger => {
        if (passenger && passenger.socketId && passenger.socketId != socket.id) {
          socket.to(passenger.socket_id).emit('server-logout-forcefully', {
            status: 403,
            message: 'passenger logout successfully.'
          })
        }
      })
      .catch(e => {
        console.log('passenger connected error:', e)
      })
  },

  // connect: (socket, nsp, io) => {
  //   return (data, CB) => {
  //     async.waterfall([
  //       (nextCall) => {
  //         if (!socket.userInfo || (socket.userInfo && socket.userInfo.type !== 'passenger')) {
  //           return
  //         }
  //         PassengerSchema.findOne({
  //           "_id": socket.userInfo._id
  //         }, {
  //             socketId: 1
  //           })
  //           .lean()
  //           .then(passenger => {
  //             if (!passenger) {
  //               return passenger
  //             }
  //             return PassengerSchema
  //               .update({
  //                 _id: socket.userInfo._id
  //               }, {
  //                   socketId: socket.id
  //                 }, {
  //                   new: true
  //                 })
  //               .then(updated => {
  //                 return passenger
  //               })
  //           })
  //           .then(passenger => {
  //             if (passenger && passenger.socketId && passenger.socketId != socket.id) {
  //               socket.to(passenger.socket_id).emit('server-logout-forcefully', {
  //                 status: 403,
  //                 message: data.languageMessage.PASS_LOGOUT_SUCC
  //               })
  //             }
  //             nextCall(null, null)
  //           })
  //       },
  //     ], (err, response) => {
  //       if (err) {
  //         console.log('passenger connected error:', e)
  //         return CB({
  //           status: 400,
  //           message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
  //         })
  //       }
  //       return CB({
  //         status: 200,
  //         message: data.languageMessage.PASS_CONNECT_SUCC,
  //         data: {}
  //       })
  //     })
  //   }
  // },

  // done
  disconnect: (socket, nsp, io) => {
    return () => {
      // console.log('passenger disconnected:', socket.id, socket.userInfo)
    }
  },

  // done
  searchCars: (socket, nsp, io) => {
    return (data, CB) => {
      // /*
      async.waterfall([
        
        // check system settings and set max distance and minimum balance 
        (nextCall) => {
          console.log('in search car log', CB)
          SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
            if (err) {
              console.log(err);
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }
            data.maxDistance = MAX_SEARCH_RADIUS;
            data.DRIVER_MIN_BALANCE = Number(getSystemSettingData[0].driverMinimumBalance);
            nextCall(null, data)
          })
        },
        (data, nextCall) => {
          var aggregateQuery = [];

          // conditions
          var matchQuery = {
            isDeleted: false,
            isOnline: true,
            isVerified: true,
            isAvailable: true,
            isBusy: false,
            isBlocked: false,
            // billingId: { // later remove this code
            //   $exists: true,
            //   $ne: ""
            // },
            // isAvailableAt: {
            //   // $gt: new Date(moment().utc().subtract(5, "minutes").format()) // for testing its 5 minutes
            //   $gt: new Date(moment().utc().subtract(1, "hours").format()) // 1 Hour
            // },
            // creditBalance: {
            //   $gte: data.DRIVER_MIN_BALANCE
            // } //  remove creditBalance to compare
          };
          //    console.log(data);
          // check geo nearest
          aggregateQuery.push({
            '$geoNear': {
              'near': {
                'type': 'Point',
                'coordinates': [data.long, data.lat]
              },
              'distanceField': 'distance',
              'spherical': true,
              'distanceMultiplier': 1 / 1609.344, // convert meters into miles
              'maxDistance': data.maxDistance,
              //    'limit': data.limit || CAR_MAX_ROWS,
              'query': matchQuery
            }
          });
          aggregateQuery.push({
            "$limit": data.limit || CAR_MAX_ROWS,
          }); // lookup for driver id in vehicle and then we find vehicle type from there.  
          // new added 
          aggregateQuery.push({
            "$lookup": {
              "from": "vehicle",
              "localField": "_id",
              "foreignField": "currentDriverAssignId",
              "as": "assignVehicleData"
            }
          },
            {
              "$unwind": {
                "path": "$assignVehicleData",
                "preserveNullAndEmptyArrays": false
              }
            });

          // aggregateQuery.push({
          //   "$lookup": {
          //     "from": "vehicle_type",
          //     "localField": "vehicleData.typeId",
          //     "foreignField": "_id",
          //     "as": "vehicleData"
          //   }
          // });
          aggregateQuery.push({
            "$lookup": {
              "from": "vehicle_type",
              "localField": "assignVehicleData.typeId",
              "foreignField": "_id",
              "as": "vehicleData"
            }
          });
          aggregateQuery.push({
            "$unwind": {
              "path": "$vehicleData",
              "preserveNullAndEmptyArrays": false
            }
          });

          aggregateQuery.push({
            "$project": {
              "_id": 0,
              'location': 1,
              'autoIncrementID': 1,
              // 'driverVehicleColor': '$vehicle.color',// 
              'driverVehicleColor': '$assignVehicleData.color',// 
              "vehicleData.image": 1
            }
          });

          aggregateQuery.push({
            "$sort": {
              "distance": 1
            }
          });
          //  console.log('aggregateQuery', aggregateQuery);
          data.aggregateQuery = aggregateQuery;
          nextCall(null, data)
        },
        (data, nextCall) => {
          DriverSchema.aggregate(data.aggregateQuery, function (err, drivers) {
            if (err) {
              console.log('err', err);
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }
            var response = {
              vehicleTypeUrl: CONSTANTS.VEHICLE_TYPE_URL,
              vehicles: drivers
            }
            // drivers.vehicleTypeUrl = CONSTANTS.VEHICLE_TYPE_URL;
            nextCall(null, response);
          });
        },
      ], (err, response) => {
        if (err) {
          console.log(err);
          console.log('[SOCKET] searchCars Error', err)
          return CB({
            'status': 400,
            'message': (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
          })
        }

        CB({
          status: 200,
          message: data.languageMessage.SUCCESS,
          data: response
        })
      })
    }
  },

  // done live test remain
  updateLocation: (socket, nsp, io) => {
    return (data, CB) => {
      async.waterfall([
        (nextCall) => {
          console.log('herer in update passnger location');
          if (!data || !data.lat || !data.long) {
            return nextCall({
              'message': data.languageMessage.INVALID_PARAMS
            })
          }
          nextCall(null, data)
        },
        (data, nextCall) => {
          // get let long from request 
          let coordinates = [Number(data.long), Number(data.lat)]; //<field>: [<longitude>, <latitude> ]

          let dataToUpdate;
          if (data.angle) {
            dataToUpdate = {
              "location.coordinates": coordinates,
              "location.angle": Number(data.angle),
              "location.speed": data.speed ? Number(data.angle) : 0
            };
          } else {
            dataToUpdate = {
              "location.coordinates": coordinates,
              "location.speed": data.speed ? Number(data.angle) : 0
            };
          }

          let condition = {
            "_id": socket.userInfo._id
          };


          // update passenger details
          PassengerSchema.findOneAndUpdate(
            condition, {
            $set: dataToUpdate
          }, {
            new: true
          })
            .lean()
            .exec(function (err, passenger) {
              if (err) {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
              }
              if (!passenger) {
                return nextCall({
                  "message": data.languageMessage.NUMBER_NOT_REGISTERED
                });
              }
              nextCall(null, data, passenger);
            });
        },
        // check is passenger on ride then update ride location
        (data, passenger, nextCall) => {
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

            // RideSchema.findOne({
            //   '_id': data.rideId
            // }).populate('passengerId').populate('driverId').populate('requestedVehicleTypeId').lean().exec((err, ride) => {
              // if (err) {
              //   return nextCall({
              //     "message": data.languageMessage.SOMETHING_WENT_WRONG,
              //   });
              // } else if (!ride) {
              //   return nextCall({
              //     "message": data.languageMessage.RIDE_NOT_FOUND
              //   });
              // } else {
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
                    ride.locationRoute = RouteData;
                    ride.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                    ride.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                    // ride.driverVehicleColor = ride.driverId.vehicle.color;
                    nextCall(null, data, ride)
                  });
                })
              }
            });
          } else {
            let ride = {};
            ride.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
            ride.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
            ride.passengerId = passenger;
            nextCall(null, data, ride)
          }
        },

        //////// START ////////
        // on_ride_distance calculation
        (data, ride, nextCall) => {
          if (ride.locationRoute) {
            // console.log("======================================");
            // console.log("ride.locationRoute", ride.locationRoute);
            // console.log("======================================");
            _self.getDistance(ride.locationRoute, function (err, on_ride_distance) {
              if (err) {
                nextCall({
                  "message": err
                })
              } else {
                // console.log("on_ride_distance---->>>>", on_ride_distance);
                ride.on_ride_distance = on_ride_distance;
                nextCall(null, data, ride)
              }
            })
          } else {
            ride.on_ride_distance = "";
            nextCall(null, data, ride)
          }
        },

        // get adminfee 
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

        // on_ride_total calculation ride total calculation 
        (data, ride, adminFee, nextCall) => {
          if (ride.locationRoute) {

            console.log("ride.locationRoute%%%%%%%%%--------", ride.locationRoute);
            if (ride.on_ride_distance <= 1) {
              ride.on_ride_total = Number(ride.requestedVehicleTypeId.minFare)
            } else {
              ride.on_ride_distance = ride.on_ride_distance ? Number(ride.on_ride_distance) : 1;
              console.log("ride.on_ride_distance===========", ride.on_ride_distance);
              ride.on_ride_total = Math.round((((Number(ride.on_ride_distance) - 1) * Number(ride.requestedVehicleTypeId.feePerKM)) + Number(ride.requestedVehicleTypeId.minFare) + adminFee) * 100) / 100;
            }
            console.log("ride.on_ride_total==============", ride.on_ride_total);
            nextCall(null, data, ride)
          } else {
            ride.on_ride_total = "";
            nextCall(null, data, ride)
          }
        },
        //////// END ////////


        /** get distance of driver to pickeup passenger */
        (data, ride, nextCall) => {
          if (data.rideId && data.rideId != '' && ride.status == 'accepted') {
            var aggregateQuery = [];
            var matchQuery = {
              _id: mongoose.Types.ObjectId(data.rideId)
            };
            aggregateQuery.push({
              '$geoNear': {
                'near': {
                  'type': 'Point',
                  'coordinates': [Number(ride.driverId.location.coordinates[0]), Number(ride.driverId.location.coordinates[1])]
                },
                'distanceField': 'distance',
                'spherical': true,
                'distanceMultiplier': 1 / 1000, // convert meters into km
                'query': matchQuery
              }
            });
            RideSchema.aggregate(aggregateQuery, function (err, rideData) {
              if (err) {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
              }
              ride.distance = Math.round(Number(rideData[0].distance) * 100) / 100;
              nextCall(null, data, ride)
            });
          } else {
            nextCall(null, data, ride)
          }
        },
        (data, ride, nextCall) => {
          if (data.rideId && data.rideId != '') {
            DriverRideRequestSchema.aggregate([
              {
                '$match': {
                  'rideId': ride._id,
                  'status': {
                    '$elemMatch': {
                      'type': 'sent'
                    }
                  }
                }
              }, {
                '$sort': {
                  'sequence': -1
                }
              }, {
                '$lookup': {
                  'from': 'ride', 
                  'localField': 'rideId', 
                  'foreignField': '_id', 
                  'as': 'rideId'
                }
              }, {
                '$unwind': {
                  'path': '$rideId', 
                  'preserveNullAndEmptyArrays': false
                }
              }, {
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
                  'from': 'vehicle', 
                  'localField': 'driverId._id', 
                  'foreignField': 'currentDriverAssignId', 
                  'as': 'vehicle'
                }
              }, {
                '$unwind': {
                  'path': '$vehicle', 
                  'preserveNullAndEmptyArrays': false
                }
              }, {
                '$project': {
                  'driverId.location': 1, 
                  'vehicle.color': 1, 
                  'vehicle.typeId': 1
                }
              }
            ]).exec((err, rideData)=>{
              console.log('rideData------', rideData);
            // DriverRideRequestSchema.findOne({
            //   "rideId": ride._id,
            //   "status": {
            //     $elemMatch: {
            //       type: 'sent'
            //     }
            //   }
            // }).sort({
            //   sequence: -1
            // }).populate('rideId').populate('driverId').exec((err, rideData) => {
              if (err) {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
              } else if (rideData.length > 0) {
                nextCall(null, ride)
              } else {

                ride.driverLocation = rideData[0].driverId.location;
                ride.driverVehicleColor = rideData[0].vehicle.color;
                VehicleTypeSchema.findOne({
                  "_id": rideData.vehicle.typeId
                }).exec((err, vehicleDetails) => {
                  ride.driverVehicleDetails = vehicleDetails
                })
                console.log("---------------------------------------------------");
                console.log(ride.driverLocation);
                console.log(ride.driverVehicleColor);
                console.log('---------------------------------------------------------');
                nextCall(null, ride)
              }
            });
          } else {
            nextCall(null, ride)
          }
        },
        (response, nextCall) => {
          NotificationSchema.count({
            "passengerId": socket.userInfo._id,
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
        (response, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              "passengerId": socket.userInfo._id,
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
        (response, nextCall) => {
          let aggregateQuery = []
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                $gte: new Date(moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format())
              },
              $or: [{
                "level1Passenger": mongoose.Types.ObjectId(socket.userInfo._id)
              },
              {
                "level2Passenger": mongoose.Types.ObjectId(socket.userInfo._id)
              },
              {
                "level3Passenger": mongoose.Types.ObjectId(socket.userInfo._id)
              },
              {
                "level4Passenger": mongoose.Types.ObjectId(socket.userInfo._id)
              },
              {
                "level5Passenger": mongoose.Types.ObjectId(socket.userInfo._id)
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
      ], (err, res) => {
        if (err) {
          return CB({
            status: 400,
            message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
          })
        }
        // console.log('res from update location ',res);
        return CB({
          status: 200,
          message: data.languageMessage.PASS_LOCATION_UPDATE_SUCC,
          data: res
        })
      })
    }
  }, // test 

  searchCarOnRequestRide: (socket, nsp, io) => {
    return (data, CB) => {
      async.waterfall([

        // check params 
        (nextCall) => {
          // console.log('data',data);
          // console.log('in search car on request ride', data);
          if (!data || !data.lat || !data.long) {
            return nextCall({
              'message': data.languageMessage.INVALID_PARAMS
            })
          }
          nextCall(null, data)
        },
        (data, nextCall) => {
          if(!data.vehicleId)
          {
            data.vehicleId = "604b0b96e3fc954f80c7cec0";
          }
          SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }
            data.maxDistance = MAX_SEARCH_RADIUS;
            data.DRIVER_MIN_BALANCE = Number(getSystemSettingData[0].driverMinimumBalance);
            nextCall(null, data)
          })
        },
        (data, nextCall) => {
          var aggregateQuery = [];

          var matchQuery = {
            isDeleted: false,
            isOnline: true,
            isVerified: true,
            isAvailable: true,
            // isAvailableAt: {
            //   // $gt: new Date(moment().utc().subtract(5, "minutes").format()) // for testing its 5 minutes
            //   $gt: new Date(moment().utc().subtract(1, "hours").format()) // 1 Hour
            // },
            isBusy: false,
            isBlocked: false,
            // billingId: {
            //   $exists: true,
            //   $ne: ""
            // }, // remove billing id 
           // creditBalance: {
            //  $gte: data.DRIVER_MIN_BALANCE
           // }, // remove credit
            // "vehicle.typeId": mongoose.Types.ObjectId(data.vehicleId) // find this based on the vehicle driver has 
          };
          if(data.isWomanSend){
            matchQuery.gender = 'female';
          }
          aggregateQuery.push({
            '$geoNear': {
              'near': {
                'type': 'Point',
                'coordinates': [data.long, data.lat]
              },
              'distanceField': 'distance',
              'spherical': true,
              'distanceMultiplier': 1 / 1609.344, // convert meters into miles
              'maxDistance': data.maxDistance,
              // 'num': data.limit || CAR_MAX_ROWS,
              'query': matchQuery
            }
          });
          //  now add condition for vehicle and its type
          aggregateQuery.push({
            "$lookup": {
              "from": "vehicle",
              "localField": "_id",
              "foreignField": "currentDriverAssignId",
              "as": "assignVehicleData"
            }
          },
            {
              "$unwind": {
                "path": "$assignVehicleData",
                "preserveNullAndEmptyArrays": false
              }
          });
          aggregateQuery.push({
            '$match': { 
              'assignVehicleData.typeId': mongoose.Types.ObjectId(data.vehicleId)
            }
          });
          
          aggregateQuery.push({
            "$limit": data.limit || CAR_MAX_ROWS,
          });
          aggregateQuery.push({
            "$sort": {
              "distance": 1
            }
          });

          data.aggregateQuery = aggregateQuery;
          console.log('aggregation query', JSON.stringify(data.aggregateQuery));
          
          nextCall(null, data)
        },
        (data, nextCall) => {
          DriverSchema.aggregate(data.aggregateQuery, function (err, drivers) {
          
            if (err) {
              console.log('error from query',err);
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, data, drivers);
          });
        },
        (data, drivers, nextCall) => {

          if (!drivers.length) return nextCall({
            "message": data.languageMessage.NO_DRIVER_FOUND
          })
          let inRangeDrivers = _.filter(drivers, d => {
            return Number(d.radius) >= Number(d.distance)
          });
          if (!inRangeDrivers.length) return nextCall({
            "message": data.languageMessage.NO_DRIVER_FOUND
          })
          // let sortedDrivers = inRangeDrivers.sort((a,b) => (a.distance > b.distance) ? -1 : ((b.distance > a.distance) ? 1 : 0)); 
          console.log('inrange driver ',drivers);
          nextCall(null, data, inRangeDrivers);
        },
        /** get unique id */
        (data, drivers, nextCall) => {
          _self.getUniqueId(function (err, response) {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG
              })
            }
            data.uniqueID = response;
            nextCall(null, data, drivers)
          });
        },
        (data, drivers, nextCall) => {
          data.totalDistance = data.totalDistance.replace('km', '');
          console.log(data.totalDistance);
          let rideData = {
            rideId: data.uniqueID,
            passengerId: mongoose.Types.ObjectId(socket.userInfo._id),
            requestedVehicleTypeId: mongoose.Types.ObjectId(data.vehicleId),
            "pickupLocation.coordinates": [data.long, data.lat],
            "pickupLocation.angle": data.angle ? Number(data.angle) : 0,
            status: 'requested',
            pickupAddress: data.pickupAddress ? data.pickupAddress : '',
            paymentStatus: false,
            destinationAddress: data.destinationAddress,
            "destinationLocation.coordinates": [data.destinationLat, data.destinationLong],
            "totalDistance": Number(data.totalDistance),
            isFoodOrder : data.orderId ? true : false,
            orderId : data.orderId ? mongoose.Types.ObjectId(data.orderId) : null,
          };
          let ride = new RideSchema(rideData);
          ride.save(function (err, ride) {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG
              })
            } else {
              nextCall(null, ride, drivers);
            }
          });
        },
        (ride, drivers, nextCall) => {
          redisClient.set(`ride.passenger.${socket.userInfo._id.toString()}`, ride._id.toString(), (err, reply) => {
            if (err) {
              return ride.remove(removeErr => {
                nextCall(removeErr || err)
              })
            }
            nextCall(null, ride, drivers)
          })
        },
        (ride, drivers, nextCall) => {
          redisClient.set(`ride.status.${ride._id.toString()}`, 'requested', (err, reply) => {
            if (err) {
              return ride.remove(removeErr => {
                redisClient.del(`ride.passenger.${socket.userInfo._id.toString()}`)
                nextCall(removeErr || err)
              })
            }
            nextCall(null, ride, drivers)
          })
        },
        /** sort driver array by distance  */
        (ride, drivers, nextCall) => {
          var ascendingByDistanceDriver = drivers.sort((a, b) => Number(a.distance) - Number(b.distance));
          console.log('sortedDriver',drivers);
        
          nextCall(null, ride, ascendingByDistanceDriver)
        },
        (ride, drivers, nextCall) => {
          let index = 1;
          async.map(drivers, function (driver, callback) {
            let queueData = {
              rideId: ride._id,
              driverId: driver._id,
              distance: driver.distance,
              sequence: index,
              status: [{
                type: "open"
              }],
            };
            index++;
            callback(null, queueData);
          }, function (err, queueData) {
            console.log('queue Data',queueData);
            DriverRideRequestSchema.insertMany(queueData, function (err, docs) {
              if (err) {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG
                })
              } else {
                nextCall(null, ride, drivers);
              }
            });
          });
        },
        (ride, drivers, nextCall) => {
          console.log('drivers',drivers);
          _self.sendNewRideRequest(socket, ride)
          nextCall(null, {
            rideId: ride._id
          });
        }
      ], (err, response) => {
        if (err) {
          console.log('final error ',err);
          console.log('[SOCKET] searchCarOnRequestRide Error', err)
          return CB({
            'status': 400,
            'message': (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
          })
          // CB({
          //   status: 200,
          //   message: data.languageMessage.SUCCESS,
          //   data: response
          // })
        //   return {
        //     'status': 400,
        //     'message': (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
        // }
        }
        console.log('res from searchCarOnRequestRide ',response);
        return CB({
          status: 200,
          message: data.languageMessage.REQUEST_SEND_PLEASE_WAIT,
          data: response
        });
        // return {
        //   status: 200,
        //   message: data.languageMessage.REQUEST_SEND_PLEASE_WAIT,
        //   data: response
        // };
      })
    }
  },

  // searchCarOnRequestRide: (socket, nsp, io) => {
  //   return (data, CB) => {
  //     async.waterfall([

  //       // check params 
  //       (nextCall) => {

  //         if (!data || !data.lat || !data.long || !data.vehicleId) {
  //           return nextCall({
  //             'message': data.languageMessage.INVALID_PARAMS
  //           })
  //         }
  //         nextCall(null, data)
  //       },
  //       (data, nextCall) => {
  //         SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
  //           if (err) {
  //             return nextCall({
  //               "message": data.languageMessage.SOMETHING_WENT_WRONG,
  //             });
  //           }
  //           data.maxDistance = MAX_SEARCH_RADIUS;
  //           data.DRIVER_MIN_BALANCE = Number(getSystemSettingData[0].driverMinimumBalance);
  //           nextCall(null, data)
  //         })
  //       },
  //       (data, nextCall) => {
  //         var aggregateQuery = [];

  //         var matchQuery = {
  //           isDeleted: false,
  //           isOnline: true,
  //           isVerified: true,
  //           isAvailable: true,
  //           isAvailableAt: {
  //             // $gt: new Date(moment().utc().subtract(5, "minutes").format()) // for testing its 5 minutes
  //             $gt: new Date(moment().utc().subtract(1, "hours").format()) // 1 Hour
  //           },
  //           isBusy: false,
  //           isBlocked: false,
  //           billingId: {
  //             $exists: true,
  //             $ne: ""
  //           },
  //           creditBalance: {
  //             $gte: data.DRIVER_MIN_BALANCE
  //           },
  //           "vehicle.typeId": mongoose.Types.ObjectId(data.vehicleId)
  //         };

  //         aggregateQuery.push({
  //           '$geoNear': {
  //             'near': {
  //               'type': 'Point',
  //               'coordinates': [data.long, data.lat]
  //             },
  //             'distanceField': 'distance',
  //             'spherical': true,
  //             'distanceMultiplier': 1 / 1609.344, // convert meters into miles
  //             'maxDistance': data.maxDistance,
  //             // 'num': data.limit || CAR_MAX_ROWS,
  //             'query': matchQuery
  //           }
  //         });
  //         aggregateQuery.push({
  //           "$limit": data.limit || CAR_MAX_ROWS,
  //         });
  //         aggregateQuery.push({
  //           "$sort": {
  //             "distance": 1
  //           }
  //         });

  //         data.aggregateQuery = aggregateQuery;
  //         nextCall(null, data)
  //       },
  //       (data, nextCall) => {
  //         DriverSchema.aggregate(data.aggregateQuery, function (err, drivers) {
  //           if (err) {
  //             return nextCall({
  //               "message": data.languageMessage.SOMETHING_WENT_WRONG,
  //             });
  //           }
  //           console.log(drivers);
  //           nextCall(null, data, drivers);
  //         });
  //       },
  //       (data, drivers, nextCall) => {
  //         if (!drivers.length) return nextCall({
  //           "message": data.languageMessage.NO_DRIVER_FOUND
  //         })
  //         let inRangeDrivers = _.filter(drivers, d => {
  //           return Number(d.radius) >= Number(d.distance)
  //         });
  //         if (!inRangeDrivers.length) return nextCall({
  //           "message": data.languageMessage.NO_DRIVER_FOUND
  //         })
  //         console.log('inRangeDrivers', inRangeDrivers);

  //         // let sortedDrivers = inRangeDrivers.sort((a,b) => (a.distance > b.distance) ? -1 : ((b.distance > a.distance) ? 1 : 0)); 
  //         nextCall(null, data, inRangeDrivers);
  //       },
  //       /* get unique id */
  //       (data, drivers, nextCall) => {
  //         _self.getUniqueId(function (err, response) {
  //           if (err) {
  //             return nextCall({
  //               "message": data.languageMessage.SOMETHING_WENT_WRONG
  //             })
  //           }
  //           data.uniqueID = response;
  //           nextCall(null, data, drivers)
  //         });
  //       },
  //       (data, drivers, nextCall) => {
  //         data.totalDistance = data.totalDistance.replace('km', '');
  //         console.log(data.totalDistance);
  //         let rideData = {
  //           rideId: data.uniqueID,
  //           passengerId: mongoose.Types.ObjectId(socket.userInfo._id),
  //           requestedVehicleTypeId: mongoose.Types.ObjectId(data.vehicleId),
  //           // pickupAddress: "TO DO",
  //           "pickupLocation.coordinates": [data.long, data.lat],
  //           "pickupLocation.angle": data.angle ? Number(data.angle) : 0,
  //           status: 'requested',
  //           pickupAddress: data.pickupAddress ? data.pickupAddress : '',
  //           paymentStatus: false,
  //           destinationAddress: data.destinationAddress,
  //           "destinationLocation.coordinates": [data.destinationLat, data.destinationLong],
  //           "totalDistance": Number(data.totalDistance)

  //         };
  //         let ride = new RideSchema(rideData);
  //         ride.save(function (err, ride) {
  //           if (err) {
  //             console.log('err', err);
  //             return nextCall({
  //               "message": data.languageMessage.SOMETHING_WENT_WRONG
  //             })
  //           } else {
  //             nextCall(null, ride, drivers);
  //           }
  //         });
  //       },
  //       (ride, drivers, nextCall) => {
  //         redisClient.set(`ride.passenger.${socket.userInfo._id.toString()}`, ride._id.toString(), (err, reply) => {
  //           if (err) {
  //             return ride.remove(removeErr => {
  //               nextCall(removeErr || err)
  //             })
  //           }
  //           nextCall(null, ride, drivers)
  //         })
  //       },
  //       (ride, drivers, nextCall) => {
  //         redisClient.set(`ride.status.${ride._id.toString()}`, 'requested', (err, reply) => {
  //           if (err) {
  //             return ride.remove(removeErr => {
  //               redisClient.del(`ride.passenger.${socket.userInfo._id.toString()}`)
  //               nextCall(removeErr || err)
  //             })
  //           }
  //           nextCall(null, ride, drivers)
  //         })
  //       },
  //       /* sort driver array by distance  */
  //       (ride, drivers, nextCall) => {
  //         var ascendingByDistanceDriver = drivers.sort((a, b) => Number(a.distance) - Number(b.distance));
  //         nextCall(null, ride, ascendingByDistanceDriver)
  //       },
  //       (ride, drivers, nextCall) => {
  //         let index = 1;
  //         async.map(drivers, function (driver, callback) {
  //           let queueData = {
  //             rideId: ride._id,
  //             driverId: driver._id,
  //             distance: driver.distance,
  //             sequence: index,
  //             status: [{
  //               type: "open"
  //             }],
  //           };
  //           index++;
  //           callback(null, queueData);
  //         }, function (err, queueData) {
  //           DriverRideRequestSchema.insertMany(queueData, function (err, docs) {
  //             if (err) {
  //               return nextCall({
  //                 "message": data.languageMessage.SOMETHING_WENT_WRONG
  //               })
  //             } else {
  //               nextCall(null, ride, drivers);
  //             }
  //           });
  //         });
  //       },
  //       (ride, drivers, nextCall) => {
  //         _self.sendNewRideRequest(socket, ride)
  //         nextCall(null, {
  //           rideId: ride._id
  //         });
  //       }
  //     ], (err, response) => {
  //       if (err) {
  //         console.log(err);
  //         console.log('[SOCKET] searchCarOnRequestRide Error', err)
  //         return {
  //           'status': 400,
  //           'message': (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
  //         }
  //       }
  //       return {
  //         status: 200,
  //         message: data.languageMessage.REQUEST_SEND_PLEASE_WAIT,
  //         data: response
  //       }
  //     })
  //   }
  // },
  
  sendNewRideRequest: (socket, ride) => {
    console.log('sendNewRIde request socket-----------------------------------------------------', ride);
    ((ride) => {
      let userInfo = {
        _id: ride._id,
        type: 'passenger'
      }
      console.log('ride id----',ride);
      async.waterfall([
        (nextCall) => {
          if (_self[`timeout_${ride._id.toString()}`]) {
            clearTimeout(_self[`timeout_${ride._id.toString()}`])
            delete _self[`timeout_${ride._id.toString()}`]
          }

          nextCall()
        },
        (nextCall) => {
          redisClient.get(`ride.status.${ride._id.toString()}`, (err, reply) => {
            if (err) {
              console.log('sendNewRideRequest redis error', err)
            }
            if (reply === 'requested') {
              nextCall()
            } else {
              DriverRideRequestSchema
                .remove({
                  rideId: ride._id,
                  'status.type': {
                    $ne: 'sent'
                  }
                })
                .exec((err, removed) => {

                  nextCall({
                    message: 'request_in_process'
                  })
                })
            }
          })
        },
        (nextCall) => {
          console.log('in sec ------------------------------------------');
          DriverRideRequestSchema
            .findOne({
              rideId: ride._id,
              'status.type': 'sent'
            })
            .populate('driverId')
            .sort({
              sequence: 1
            })
            .exec((err, driverRideRequest) => {
              if (err) {
                console.log('sendNewRideRequest db error', err)
              } else if (!driverRideRequest) {
                console.log('driver not found');
                nextCall(null)
              } else {
                DriverRideRequestSchema
                  .find({
                    rideId: ride._id,
                    isDuplicate: false
                    //'status.type': 'sent'
                  })
                  .sort('sequence')
                  .exec((err, driverRideRequests) => {
                    if (err) {
                      console.log('sendNewRideRequest db error', err)
                    } else if (!driverRideRequests) {
                      console.log('driver ride request not found');
                      nextCall(null)
                    } else {
                      if (driverRideRequests && driverRideRequests.length > 1) {
                        if (driverRideRequests && driverRideRequests[0]) {
                          let queueData = {
                            rideId: driverRideRequests[0].rideId,
                            driverId: driverRideRequests[0].driverId,
                            distance: driverRideRequests[0].distance,
                            sequence: driverRideRequests[driverRideRequests.length - 1].sequence + 1,
                            status: [{
                              type: "open"
                            }],
                          };

                          let DriverRideRequest = new DriverRideRequestSchema(queueData);
                          DriverRideRequest.save((err, insertDriverRideRequest) => {
                            if (err) {
                              console.log('sendNewRideRequest db error', err)
                            } else {
                              console.log('insertDriverRideRequest', insertDriverRideRequest);
                              let updateData = {
                                isDuplicate: true
                              }
                              DriverRideRequestSchema
                                .update({
                                  _id: driverRideRequests[0]._id
                                }, updateData)
                                .exec((err, updated) => {
                                  nextCall(null)
                                })
                            }
                          })
                        } else {
                          nextCall(null)
                        }
                      } else {
                        nextCall(null)
                      }
                    }
                  })
              }
            })
        },
        (nextCall) => {
          DriverRideRequestSchema
            .findOne({
              rideId: ride._id,
              'status.type': {
                $ne: 'sent'
              }
            })
            // .populate('driverId')
            .populate({
              path: 'driverId',
              select: {
                'deviceDetail': 1
              },
              populate: {
                path: 'languageId'
              }
            })
            .sort({
              sequence: 1
            })
            .exec((err, driverRideRequest) => {
              if (err) {
                console.log('sendNewRideRequest db error', err)
              }
              nextCall(null, driverRideRequest)
            })
        },
        (driverRideRequest, nextCall) => {
          console.log('driverRideRequest-------------------------',driverRideRequest);
          if (!driverRideRequest) {
            return nextCall(null, driverRideRequest)
          }
          DriverSchema
            .findOne({
              _id: driverRideRequest.driverId._id,
              isOnline: true,
              isAvailable: true,
              isBusy: false,
              isVerified: true,
              isBlocked: false,
              // isRideRequestSended: false
            })
            .select({
              _id: 1
            })
            .lean()
            .exec((err, driver) => {
              if (err || !driver) {
                console.log('sendNewRideRequest driver db error', err, driver)
                DriverRideRequestSchema
                  .remove({
                    _id: driverRideRequest._id
                  })
                  .exec((err, removed) => {
                    nextCall({
                      message: 'send_next_driver'
                    })
                  })
              } else {
                nextCall(null, driverRideRequest)
              }
            })
        },
        (driverRideRequest, nextCall) => {
          if (driverRideRequest) {
            redisClient.get(`ride.driver.${driverRideRequest.driverId._id.toString()}`, (err, reply) => {
              if (reply) {

                // remove ride request if driver accepted another ride
                DriverRideRequestSchema
                  .remove({
                    _id: driverRideRequest._id
                  })
                  .exec((err, removed) => {
                    nextCall({
                      message: 'send_next_driver'
                    })
                  })
              } else {
                nextCall(null, driverRideRequest)
              }
            })
          } else {
            nextCall(null, driverRideRequest)
          }
        },
        (driverRideRequest, nextCall) => {
          if (driverRideRequest) {
            // find driver with assigned any new request
            DriverRideRequestSchema
              .findOne({
                rideId: {
                  $ne: ride._id
                },
                driverId: driverRideRequest.driverId._id,
                status: {
                  $elemMatch: {
                    type: 'sent',
                    createdAt: {
                      $gt: moment().subtract(Number(RIDE_REQUEST_TIMEOUT) / 1000, 'seconds').toISOString()
                    }
                  }
                }
              })
              .lean()
              .exec((err, assignDriverRideRequest) => {
                if (err) {
                  console.log('sendNewRideRequest db error', err)
                }

                if (assignDriverRideRequest) {
                  DriverRideRequestSchema
                    .remove({
                      _id: driverRideRequest._id
                    })
                    .exec((err, removed) => {
                      nextCall({
                        message: 'send_next_driver'
                      })
                    })
                } else {
                  nextCall(null, driverRideRequest)
                }
              })
          } else {
            nextCall(null, driverRideRequest)
          }
        },
        (driverRideRequest, nextCall) => {
          if (!driverRideRequest) {
            RideSchema.findOne({
              _id: ride._id,
              status: 'requested'
            }).exec((err, rideData) => {
              if (rideData) {
                let upData = {
                  status: 'request_expired'
                }

                _self.resetRideStatusForPassengerOrDriver(userInfo, ride) // clear data from redis db
                RideSchema.update({
                  _id: ride._id
                }, upData).exec((err, updated) => { })
                nextCall({
                  message: 'sent_to_all'
                })
              } else {
                nextCall({
                  message: 'complete_process'
                })
              }
            })
          } else {
            nextCall(null, driverRideRequest)
          }
        },
        (driverRideRequest, nextCall) => {
          if (driverRideRequest) {
            RideSchema
              .findOne({
                _id: ride._id
              })
              .populate('passengerId')
              .exec((err, ride) => {
                if (err) {
                  console.log('sendNewRideRequest db error', err)
                }
                // set passenger location in ride
                driverRideRequest.passengerLocation = ride.passengerId.location;
                driverRideRequest.passengerSocketId = ride.passengerId.socketId;
                nextCall(null, driverRideRequest)
              })
          } else {
            nextCall(null, driverRideRequest)
          }
        },
        (driverRideRequest, nextCall) => {
          let NEW_RIDE_REQUEST;
          if (driverRideRequest.driverId && driverRideRequest.driverId.languageId && driverRideRequest.driverId.languageId.code == 'km') {
            NEW_RIDE_REQUEST = COMBODIA_MESSAGES['NEW_RIDE_REQUEST'];
          } else if (driverRideRequest.driverId && driverRideRequest.driverId.languageId && driverRideRequest.driverId.languageId.code == 'zh') {
            NEW_RIDE_REQUEST = CHINESE_MESSAGES['NEW_RIDE_REQUEST'];
          } else {
            NEW_RIDE_REQUEST = ENGLISH_MESSAGES['NEW_RIDE_REQUEST'];
          }
          //   if (driverRideRequest.driverId.deviceDetail.os != 'ios') {
          let pushNotificationData = {
            to: (driverRideRequest.driverId.deviceDetail && driverRideRequest.driverId.deviceDetail.token) || '',
            type: 'driver',
            os: driverRideRequest.driverId.deviceDetail.os,
            data: {
              title: '',
              type: 4,
              body: NEW_RIDE_REQUEST,
              android_channel_id: "customChannel",
              tag: 'Ride',
              data: {
                rideId: driverRideRequest.rideId,
                location: driverRideRequest.passengerLocation,
                timer: RIDE_REQUEST_TIMEOUT
              },
              notification: {
                title: 'Incoming ride request ',
                body: 'Tap to answer the request'
              }
            }
          }
          console.log('push notification', pushNotificationData);

          // select audio file
          if (driverRideRequest.driverId.deviceDetail && driverRideRequest.driverId.deviceDetail.os == 'android') {
            pushNotificationData.data.sound = 'driver_ride_request_repeat.mp3';
          } else {
            pushNotificationData.data.sound = 'driver_ride_request_repeat.caf'
          }

          // send ride notification
          pn.fcm(pushNotificationData, function (err, Success) {
            if (err) {
              console.log('error in send notifincation ', err);
            }
            redisClient.del(`ride.requested.driver.${ride._id.toString()}`)
            redisClient.set(`ride.requested.driver.${ride._id.toString()}`, driverRideRequest.driverId._id.toString());
            nextCall(null, driverRideRequest)
          })

          // } else {

          //   let pushNotificationData = {
          //     to: (driverRideRequest.driverId.deviceDetail && driverRideRequest.driverId.deviceDetail.token) || '',
          //     type: 'driver',
          //     os: driverRideRequest.driverId.deviceDetail.os,
          //     data: {
          //       title: '',
          //       type: 4,
          //       body: NEW_RIDE_REQUEST,
          //       android_channel_id: "customChannel",
          //       tag: 'Ride',
          //       data: {
          //         rideId: driverRideRequest.rideId,
          //         location: driverRideRequest.passengerLocation,
          //         timer: RIDE_REQUEST_TIMEOUT
          //       },
          //       notification: {
          //         title: 'Incoming ride request ',
          //         body: 'Tap to answer the request'
          //       }
          //     }
          //   }

          //   // select audio file
          //   if (driverRideRequest.driverId.deviceDetail && driverRideRequest.driverId.deviceDetail.os == 'android') {
          //     pushNotificationData.data.sound = 'driver_ride_request_repeat.mp3';
          //   } else {
          //     pushNotificationData.data.sound = 'driver_ride_request_repeat.caf'
          //   }

          //   // send ride notification
          //   pn.apn(pushNotificationData, function (err, Success) {
          //     if (err) {
          //       console.log('error in send notifincation ', err);
          //     }
          //     redisClient.del(`ride.requested.driver.${ride._id.toString()}`)
          //     redisClient.set(`ride.requested.driver.${ride._id.toString()}`, driverRideRequest.driverId._id.toString());
          //     nextCall(null, driverRideRequest)
          //   })
          // }

        },
        (driverRideRequest, nextCall) => {
          let upData = {
            $push: {
              status: {
                type: 'sent',
                createdAt: moment().toISOString()
              }
            }
          }
          // update ride request to sent request
          DriverRideRequestSchema
            .update({
              _id: driverRideRequest._id
            }, upData)
            .exec((err, updated) => {
              nextCall()
            })
        },
      ], (err) => {

        if (err && err.message === 'sent_to_all') {
          console.log('no driver around to location pass data')
          _self.sendNoOneAcceptRideRequestNotificationToRider(userInfo, ride)
        } else if (err && err.message === 'send_next_driver') {
        } else if (err) {
          return console.log('SendNewRideRequest End:', err)
        } else if (err && err.message === 'complete_process') {
          return console.log('SendNewRideRequest End:', err)
        }

        ((ride) => {
          if (err && err.message === 'send_next_driver') {
            _self[`timeout_${ride._id.toString()}`] = setTimeout(() => {
              _self.sendNewRideRequest(socket, ride)
            }, 350)
          } else {
            let timeout = RIDE_REQUEST_TIMEOUT

            _self[`timeout_${ride._id.toString()}`] = setTimeout(() => {
              _self.sendNewRideRequest(socket, ride)
            }, timeout)

          }
        })(ride)

      })
    })(ride)
  },// need to test

  sendNoOneAcceptRideRequestNotificationToRider: (userInfo, ride) => {

    async.waterfall([
      function (nextCall) {
        let condition = {
          '_id': ride._id
        };
        RideSchema.findOne(condition)
          .populate({
            path: 'passengerId',
            select: {
              'deviceDetail': 1
            },
            populate: {
              path: 'languageId'
            }
          })
          .populate('driverId').exec((err, ride) => {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }

            let NO_DRIVER_AVAILABLE;
            if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
              NO_DRIVER_AVAILABLE = COMBODIA_MESSAGES['NO_DRIVER_AVAILABLE'];
            } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
              NO_DRIVER_AVAILABLE = CHINESE_MESSAGES['NO_DRIVER_AVAILABLE'];
            } else {
              NO_DRIVER_AVAILABLE = ENGLISH_MESSAGES['NO_DRIVER_AVAILABLE'];
            }

            let pushNotificationData = {
              to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
              type: 'passenger',
              data: {
                title: '',
                type: 9,
                body: NO_DRIVER_AVAILABLE,
                tag: 'Ride',
                data: {
                  rideId: ride._id
                }
              }
            }

            pn.fcm(pushNotificationData, function (err, Success) {
              nextCall(null)
            })
          })

      }
    ], function (err, response) {
      // callback(null);
    })
  },

  cancelRide: (socket, nsp, io) => {
    return (data, CB) => {
      async.waterfall([
        (nextCall) => {
          if (!data || !data.rideId || !data.cancelReason) {
            return nextCall({
              'message': data.languageMessage.INVALID_PARAMS
            })
          }
          nextCall(null, data)
        },
        // (data, nextCall) => {
        //   redisClient.get(`ride.passenger.${socket.userInfo._id.toString()}`, (err, rideId) => {
        //     if (err) {
        //       return nextCall({ message: 'Your ride has been already in progress' })
        //     }
        //     if (!rideId || rideId !== data.ride_id) {
        //       return nextCall({ message: 'Invalid parameter' })
        //     }
        //     nextCall(null, data)  
        //   })
        // },
        (data, nextCall) => {
          RideSchema.findOne({
            _id: data.rideId,
            passengerId: socket.userInfo._id
          })
            .lean()
            .populate('passengerId')
            // .populate('driverId')
            .populate({
              path: 'driverId',
              select: {
                '_id': 1,
                'deviceDetail': 1,
                'socketId': 1
              },
              populate: {
                path: 'languageId'
              }
            })
            .exec((err, ride) => {
              if (err) {
                return nextCall({
                  message: data.languageMessage.INVALID_RIDE
                })
              }
              nextCall(null, data, ride)
            })
        },
        /** get cancel reason */
        (data, ride, nextCall) => {
          ReasonSchema.findOne({
            '_id': data.cancelReason
          }).exec(function (err, reason) {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG
              })
            } else if (!reason) {
              return nextCall({
                "message": data.languageMessage.REASON_NOT_FOUND
              })
            } else {
              data.reasonText = reason.name
              nextCall(null, data, ride)
            }
          });
        },

        (data, ride, nextCall) => {
          if (ride.status === 'requested' || ride.status === 'accepted') {
            let upateData = {
              status: "cancelled",
              cancelReason: data.cancelReason,
              cancelBy: "passenger",
              reasonText: data.reasonText
            }

            RideSchema.findOneAndUpdate({
              _id: data.rideId
            }, {
              $set: upateData
            }, {
              new: true
            },
              function (err, updateData) {
                if (err) {
                  return nextCall({
                    "message": data.languageMessage.SOMETHING_WENT_WRONG
                  });
                } else {
                  nextCall(null, data, ride)
                }
              });
          } else {
            return nextCall({
              "message": data.languageMessage.REQUEST_EXPIRE
            });
          }
        },

        /** Badge Count of notification */
        (data, ride, nextCall) => {
          if (ride.driverId) {
            _self.badgeCount(ride.driverId._id, isDriver = true, function (err, totalbadgeCount) {
              if (err) {
                nextCall({
                  "message": err
                })
              } else {
                totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1
                nextCall(null, data, ride, totalbadgeCount)
              }
            })
          } else {
            totalbadgeCount = 0;
            nextCall(null, data, ride, totalbadgeCount)
          }
        },
        /** Badge Count of notification */
        (data, ride, totalbadgeCount, nextCall) => {
          if (ride.driverId) {
            NotificationSchema.count({
              driverId: ride.driverId._id,
              type: 'recent_transaction',
              isRead: false
            }, function (err, badgeCount) {
              if (err) {
                return nextCall({
                  "message": err
                })
              } else {
                badgeCount = badgeCount ? badgeCount + 1 : 1;
                return nextCall(null, data, ride, totalbadgeCount, badgeCount)
              }
            })
          } else {
            badgeCount = 0;
            return nextCall(null, data, ride, totalbadgeCount, badgeCount)
          }
        },

        (data, ride, totalbadgeCount, badgeCount, nextCall) => {
          _self.resetRideStatusForPassengerOrDriver(socket.userInfo, ride)

          if (ride.driverId) {

            if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'km') {
              PASSENGER_CANCEL_RIDE_REQUEST = COMBODIA_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
            } else if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'zh') {
              PASSENGER_CANCEL_RIDE_REQUEST = CHINESE_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
            } else {
              PASSENGER_CANCEL_RIDE_REQUEST = ENGLISH_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
            }

            if (ride.driverId && ride.driverId.socketId) {
              socket.to(ride.driverId.socketId).emit('cancel-ride', {
                status: 200,
                message: data.languageMessage.PASS_LOGOUT_SUCC,
                data: {
                  rideId: ride._id
                }
              })
            }

            _self.sendCancelRideRequestNotificationToDriver(ride, totalbadgeCount, badgeCount)
            _self.setDriverFree(ride)
            nextCall(null, data, ride)
          } else {
            DriverRideRequestSchema.findOne({
              rideId: mongoose.Types.ObjectId(ride._id),
              'status.type': {
                $eq: 'sent'
              }
            }).populate('driverId').sort({
              sequence: -1
            }).exec((err, driverRideRequest) => {
              if (err) {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
              }
              if (driverRideRequest && driverRideRequest.driverId && driverRideRequest.driverId._id) {
                ride.driverId = driverRideRequest.driverId;

                if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'km') {
                  PASSENGER_CANCEL_RIDE_REQUEST = COMBODIA_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
                } else if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'zh') {
                  PASSENGER_CANCEL_RIDE_REQUEST = CHINESE_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
                } else {
                  PASSENGER_CANCEL_RIDE_REQUEST = ENGLISH_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
                }

                if (ride.driverId.socketId) {
                  socket.to(ride.driverId.socketId).emit('cancel-ride', {
                    status: 200,
                    message: data.languageMessage.PASS_LOGOUT_SUCC,
                    data: {
                      rideId: ride._id
                    }
                  })
                }

                _self.sendCancelRideRequestNotificationToDriver(ride, totalbadgeCount, badgeCount)
                nextCall(null, data, ride)
              } else {
                nextCall(null, data, ride)
              }
            });
          }
        },
        (data, ride, nextCall) => {
          /** Clear redis ride data**/
          redisClient.del(`ride.passenger.${ride.passengerId._id.toString()}`)
          redisClient.del(`ride.status.${ride._id.toString()}`)
          if (ride.driverId && ride.driverId._id) {
            redisClient.del(`ride.driver.${ride.driverId._id.toString()}`)
          }
          nextCall(null, data, ride)
        },
        (data, ride, nextCall) => {
          console.log('-------------remove ride request 3')
          DriverRideRequestSchema.remove({
            'rideId': ride._id
          }).exec((err, remveDriverRideRequest) => {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null)
          })
        },
      ], (err) => {
        if (err) {
          console.log("[SOCKET] passengerCancelRide Error', err", err);
          return CB({
            'status': 400,
            'message': (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
          })
        }

        CB({
          status: 200,
          message: data.languageMessage.RIDE_CANCELLED_SUCC,
          data: {}
        })
      })
    }
  },

  resetRideStatusForPassengerOrDriver: (userInfo, ride) => {
    if (!userInfo || !ride) {
      return
    }
    // ['requested', 'cancelled', 'accepted', 'arrived', 'onride', 'completed']
    if (ride.status == 'requested') { // when rider cancel ride
      redisClient.del(`ride.passenger.${ride.passengerId.toString()}`)
      redisClient.del(`ride.status.${ride._id.toString()}`)

    } else if (ride.status == 'accepted') {
      redisClient.del(`ride.passenger.${ride.passengerId._id.toString()}`)
      redisClient.del(`ride.status.${ride._id.toString()}`)
      if (ride.driverId && ride.driverId._id) {
        redisClient.del(`ride.driver.${ride.driverId._id.toString()}`)
      }
    } else { }
  }, 

  sendCancelRideRequestNotificationToDriver: (ride, totalbadgeCount, badgeCount) => {
    async.waterfall([
      function (nextCall) {
        let PASSENGER_CANCEL_RIDE_REQUEST;
        if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'km') {
          PASSENGER_CANCEL_RIDE_REQUEST = COMBODIA_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
        } else if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'zh') {
          PASSENGER_CANCEL_RIDE_REQUEST = CHINESE_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
        } else {
          PASSENGER_CANCEL_RIDE_REQUEST = ENGLISH_MESSAGES['PASSENGER_CANCEL_RIDE_REQUEST'];
        }

        let pushNotificationData = {
          to: (ride.driverId.deviceDetail && ride.driverId.deviceDetail.token) || '',
          type: 'driver',
          data: {
            title: '',
            type: 3,
            body: ride.passengerId.name + PASSENGER_CANCEL_RIDE_REQUEST,
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
          // nextCall(null)
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
            nextCall(null)
          })
        })
      }
    ], function (err, response) {
      // callback(null);
    })
  },

  setDriverFree: (ride) => {
    async.waterfall([
      function (nextCall) {
        DriverSchema.findOneAndUpdate({
          _id: ride.driverId._id
        }, {
          isAvailable: true,
          isBusy: false
          // isRideRequestSended: false
        }, {
          new: true
        },
          function (err, updateData) {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG
              });
            }
            nextCall(null, updateData.uniqueID)
          });
      }
    ], function (err, response) {
      // callback(err, response);
    })
  }, 

  getReceipt: (socket, nsp, io) => {
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
            'passengerId': socket.userInfo._id,
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
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, ride)
          })
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
            "_id": ride.requestedVehicleTypeId //ride.driverDetails.vehicle.typeId,
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
        /** calculation of receipt */
        // (ride, nextCall) => {
        //   ride.time = moment(Number(ride.endedAt)).diff(moment(Number(ride.arrivedAt)), 'seconds');
        //   nextCall(null, ride)
        // },
      ], (err, response) => {
        if (err) {
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
          if (!data || !data.rideId || !data.rate) {
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
            'passengerId': socket.userInfo._id,
            "status": "completed",
            "paymentStatus": true
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
        /** gives rate to driver of ride */
        (data, nextCall) => {
          /** update ride rate and driver is in ride collection */
          let condition = {
            "_id": data.rideId,
            "status": "completed",
            "paymentStatus": true
          };
          let updateData = {
            "isRating": true,
            "rate": Number(data.rate),
            "comment": data.comment
          }
          RideSchema.findOneAndUpdate(condition, {
            $set: updateData
          }, {
            new: true
          }).populate('driverId').exec((err, ride) => {
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
          let totalRating = ride.driverId.totalRating + Number(data.rate);
          let ratedCount = ride.driverId.ratedCount + 1;
          let avgRating = Math.round(totalRating / ratedCount)

          let condition = {
            "_id": ride.driverId._id
          };
          let updateData = {
            'totalRating': ride.driverId.totalRating + Number(data.rate),
            'ratedCount': ride.driverId.ratedCount + 1,
            'avgRating': avgRating
          }
          DriverSchema.findOneAndUpdate(condition, {
            $set: updateData
          }).exec((err, driver) => {
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

  badgeCount: function (id, isDriver, callback) {
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
        return callback({
          err: err
        })
      } else {
        return callback(null, result)
      }
    })
    return response
  },

  // getDistance from lat long
  getDistance: function (wPoints, callback) {
    var dist = 0;
    for (let i = 0; i < wPoints.length; i++) {
      if (i == wPoints.length - 1) { } else {
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
    console.log('deg2rad');
    return deg * (Math.PI / 180);
  },

  checkCurrentRideRequest: function (socket, nsp, io) {
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
          redisClient.get(`ride.requested.driver.${ride._id.toString()}`, (err, reply) => {
            if (err) {
              return nextCall({
                "message": data.languageMessage.SOMETHING_WENT_WRONG,
              });
            }


            DriverSchema.findOne({
              '_id': mongoose.Types.ObjectId()
            }).exec((err, driver) => {
              if (err) {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
              }
              if (driver) {
                let responseData = {
                  'driverId': driver._id,
                  'location': driver.location
                }
                return nextCall(null, responseData)
              } else {
                return nextCall({
                  "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
              }
            })
          });
        },
      ], (err, response) => {
        if (err) {
          return CB({
            status: 400,
            message: (err && err.message) || data.languageMessage.SOMETHING_WENT_WRONG
          })
        }
        return CB({
          status: 200,
          message: data.languageMessage.DRIVER_FOUND,
          data: response
        })
      })

    }
  }, 
  // need to test 
  paidCash: function(socket, nsp, id){
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
        (data, nextCall) => {
          RideSchema.findOne({
              '_id': data.rideId,
              passengerId: socket.userInfo._id,
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
      (ride, data, nextCall) => {
        let condition = {
            "_id": socket.userInfo._id,
        };
          PassengerSchema.findOne(condition).exec((err, passengerData) => {
            if (err) {
                return nextCall({
                    "message": data.languageMessage.SOMETHING_WENT_WRONG,
                });
            }
            if(ride.totalFare > passengerData.walletMoney){
              return nextCall({
                "message": 'Insufficient Funds in your wallet please recharge',
            });
            }
            data.passengerData = passengerData;
            nextCall(null, ride, data)
            })   
    },
    // update passenger wallet and add transaction 
    (ride, data, nextCall) => {
      let condition = {
          "_id": socket.userInfo._id,
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
          data.passengerData = passengerData;
          nextCall(null, ride, data)
          })   
  },
  (ride, data, nextCall) => {
    SystemSettingsSchema.find({}).exec(async function (err, getSettingData) {
      if (err) {
        return nextCall({
          message: message.SOMETHING_WENT_WRONG,
        });
      }
      if (getSettingData[0]) {
      ride.adminPercentage =  getSettingData[0].adminFee
      // now find vehicle owner commission based on vehicle type
      let vehicleTypeData =  await VehicleTypeSchema.findOne({_id:ride.requestedVehicleTypeId});
      if(vehicleTypeData){
        ride.vehicleOwnerPercentage = vehicleTypeData.commission;
      }else {
        console.log('unable to find vehicleType', ride.requestedVehicleTypeId);
        return nextCall({
          message: message.SOMETHING_WENT_WRONG,
        });
      }
      // find driver refreal 
      let isDriverAddedByPromoter = await DriverSchema.findOne({_id:ride.driverId}).populate('addedBy','type userCommission _id');
      if(isDriverAddedByPromoter.addedBy.type=='promoter'){
        ride.promoterDriverReferal = true;
        ride.promoterDriverId = isDriverAddedByPromoter.addedBy._id;
        ride.promoterDriverPercentage= isDriverAddedByPromoter.addedBy.userCommission;
      }else {
        ride.promoterDriverReferal = false;
      }
      // find vehicle addedBy data 
      let getVehicleData = await VehicleSchema.findOne({ _id: ride.vehicleId}).populate('addedBy', 'addedBy');
      if(getVehicleData){
        ride.VoId = getVehicleData.addedBy;
        let isVoAddedByPromoter = await adminSchema.findOne({ _id: getVehicleData.addedBy.addedBy}, 'type vehicleOwnerCommission');
        if(isVoAddedByPromoter.type=='promoter'){
          ride.promoterVoReferal = true;
          ride.promoterVehicleId = isVoAddedByPromoter.addedBy._id;
          ride.promoterVehiclePercentage = Number(isVoAddedByPromoter.vehicleOwnerCommission);
        }else {
          ride.promoterVoReferal = false;
        }
      }else {
        console.log('unable to find vehicle from ride', ride._id);
        return nextCall({
          message: message.SOMETHING_WENT_WRONG,
        });
      }
      }
    })
      nextCall(null, ride, data)
  },
  // now divide percentage and add transaction for ride and update commission into ride
  (ride, data, nextCall) => {
    let totalFare = ride.totalFare;
    let adminCommission = (totalFare/100) * ride.adminFee;
    let driverPromoterReferal=0;
    let promoterVoRefera=0;
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
     nextCall(null, ride, data)
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
      let adminData= { 
       roleForm: 'passenger',
       from: data.passengerData._id,
       roleTo: 'admin',
       to: mongoose.Types.ObjectId('5d3ee2c8f28cbd5d43b3793e'),// adminId
       transferType:'rideTransfer',
       rideId: ride._id,
       createdBy: data.passengerData._id,
       amount:  adminCommission
      }
      await commonHelper.walletAccountLogs(adminData);
      let driverData= { 
        roleForm: 'passenger',
        from: data.passengerData._id,
        roleTo: 'admin',
        to: ride.driverId,// adminId
        transferType:'rideTransfer',
        rideId: ride._id,
        createdBy: data.passengerData._id,
        amount:  driverCommission
      }
      await commonHelper.walletAccountLogs(driverData);
      let VoData={
        roleForm: 'passenger',
        from: data.passengerData._id,
        roleTo: 'admin',
        to: ride.VoId,// adminId
        transferType:'rideTransfer',
        rideId: ride._id,
        createdBy: data.passengerData._id,
        amount:  vehicleOwnerCommission
      }
      await commonHelper.walletAccountLogs(VoData);
      if(ride.promoterDriverReferal){
        let promoterDriverData={
          roleForm: 'passenger',
       from: data.passengerData._id,
       roleTo: 'admin',
       to: ride.promoterDriverId,// adminId
       transferType:'rideTransfer',
       rideId: ride._id,
       createdBy: data.passengerData._id,
       amount:  driverPromoterReferal
        }
        await commonHelper.walletAccountLogs(promoterDriverData);
      }
      if(ride.promoterVoReferal){
        let promoterVoData={
        roleForm: 'passenger',
       from: data.passengerData._id,
       roleTo: 'admin',
       to: ride.promoterVehicleId,// adminId
       transferType:'rideTransfer',
       rideId: ride._id,
       createdBy: data.passengerData._id,
       amount:  promoterVoRefera
        }
        await commonHelper.walletAccountLogs(promoterVoData);
      }
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
  }
}

module.exports = _self;