var async = require("async"),
path = require("path"),
_ = require("underscore"),
config = rootRequire("config/global"),
/** Database Connections */
//Mongoose library for query purose in MogoDB
mongoose = require("mongoose"),
moment = require('moment'),
// Custom services/helpers
DS = rootRequire("services/date"),
ED = rootRequire("services/encry_decry"),
CONSTANTS = rootRequire("config/constant"),
redisClient = rootRequire("support/redis"),
//Database Schemas (MongoDB)
AdminSchema = require("../../" + CONSTANTS.API_VERSION + "/models/admin"),
VehicleSchema = require("../../" + CONSTANTS.API_VERSION + "/models/vehicle"),
RideSchema = require("../../" + CONSTANTS.API_VERSION + "/models/ride"),
SystemSettingsSchema = require("../../" +
  CONSTANTS.API_VERSION +
  "/models/systemSettings"),
Uploader = rootRequire("support/uploader"),
message = rootRequire("config/messages/en"),
log_message = rootRequire("config/log_messages");

var ObjectId = mongoose.Types.ObjectId;

async function vehicleOwnerAndPromoterCount(type, id) {
  let responseData = {};

  let todayCount = await AdminSchema.count({
          $and: [
            {
              created_at: {
                $gte: moment()
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
          ],
          isDeleted: false,
          type: type,
          addedBy : ObjectId(id)
        });
        responseData.todayCount = todayCount;

        // .exec(function (err, todayPassengers) {
        //   if (err) {
        //     return nextCall({
        //       message: message.SOMETHING_WENT_WRONG,
        //     });
        //   } else {
        //    
        //   }
        // }); 
               /** get yesterday passenger count */
        let yesterDayCount = await AdminSchema.count({
          $and: [
            {
              created_at: {
                $lte: moment()
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
            {
              created_at: {
                $gte: moment()
                  .subtract(1, "days")
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
          ],
          isDeleted: false,
          type: type,
          addedBy : ObjectId(id)
        });
        responseData.yesterDayCount = yesterDayCount;
        // .exec(function (err, yesterdayPassengers) {
        //   if (err) {
        //     return nextCall({
        //       message: message.SOMETHING_WENT_WRONG,
        //     });
        //   } else {
            
          // }
        // });


      /** get this month passenger count */
     let thisMonthCount = await  AdminSchema.count({
          $and: [
            {
              created_at: {
                $lte: moment()
                  .hours(23)
                  .minutes(59)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
            {
              created_at: {
                $gte: moment()
                  .startOf("month")
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
          ],
          isDeleted: false,
          type: type,
          addedBy : ObjectId(id)
        });
        responseData.thisMonthCount = thisMonthCount;

        // .exec(function (err, thisMonthPassengers) {
        //   if (err) {
        //     return nextCall({
        //       message: message.SOMETHING_WENT_WRONG,
        //     });
        //   } else {
        //     re
        // responseData.thisMonthPassengers = thisMonthPassengers;
        //   }
        // });
      /** get this last month passenger count */
      let lastMonthData = await AdminSchema.count({
          $and: [
            {
              created_at: {
                $gte: moment()
                  .startOf("month")
                  .month(new Date().getMonth() - 1)
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
            {
              created_at: {
                $lte: moment()
                  .endOf("month")
                  .month(new Date().getMonth() - 1)
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
          ],
          isDeleted: false,
          type: type,
          addedBy : ObjectId(id)
        });
        responseData.lastMonthCount = lastMonthData;
        // .exec(function (err, lastMonthPassengers) {
        //   if (err) {
        //     return nextCall({
        //       message: message.SOMETHING_WENT_WRONG,
        //     });
        //   } else {
        
        //   }
        // });
        let thisYearCount = await AdminSchema.count({
          $and: [
            {
              created_at: {
                $gte: moment()
                  .startOf("year")
                  .hours(23)
                  .minutes(59)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
            {
              created_at: {
                $lte: moment()
                  .endOf("year")
                  .hours(23)
                  .minutes(59)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
          ],
          isDeleted: false,
          type: type,
          addedBy : ObjectId(id)
        })
        responseData.thisYearCount = thisYearCount;

        let  lastYearCount = await AdminSchema.count({
          $and: [
            {
              created_at: {
                $gte: moment()
                  .startOf("year")
                  .year(new Date().getFullYear() - 1)
                  .hours(23)
                  .minutes(59)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
            {
              created_at: {
                $lte: moment()
                  .endOf("year")
                  .year(new Date().getFullYear() - 1)
                  .hours(23)
                  .minutes(59)
                  .seconds(0)
                  .milliseconds(0)
                  .format(),
              },
            },
          ],
          isDeleted: false,
          type: type,
          addedBy : ObjectId(id)
        });
        responseData.lastYearCount = lastYearCount;
      /** get total passenger count */
      let totalCount = await AdminSchema.count({
          type: type,
          addedBy : ObjectId(id),
          isDeleted: false
        });

        responseData.totalCount = totalCount;
        return responseData;
      };
  var _self = {
    addActionLog: (reqUser, section, action) => {
        async.waterfall(
          [
            function (nextCall) {
              let insertData = [];
              insertData.section = section;
              insertData.action = action;
              insertData.actionAt = DS.now();
              insertData.userType = reqUser.type;
              insertData.userName = reqUser.email;
              insertData.userId = mongoose.Types.ObjectId(reqUser._id);
              nextCall(null, insertData);
            },
            /** get emergency auto increment id */
            function (insertData, nextCall) {
              _self.getLogAutoIncrement(function (err, response) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                insertData.autoIncrementID = response.logAutoIncrement;
                nextCall(null, insertData);
              });
            },
            /** register emergency */
            function (insertData, nextCall) {
              let actionLogs = new ActionLogsSchema(insertData);
              actionLogs.save(function (err, insertData) {
                if (err) {
                  return nextCall({
                    message: message.OOPS_SOMETHING_WRONG,
                  });
                }
                nextCall(null);
              });
            },
          ],
          function (err, response) {
            // callback(null);
          }
        );
      },
      getLogAutoIncrement: function (callback) {
        async.waterfall(
          [
            function (nextCall) {
              SystemSettingsSchema.find({}).exec(function (
                err,
                getSystemSettingData
              ) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                if (getSystemSettingData[0]) {
                  SystemSettingsSchema.findOneAndUpdate(
                    {},
                    {
                      $inc: {
                        logAutoIncrement: Number(1),
                      },
                    },
                    {
                      new: true,
                    },
                    function (err, updateData) {
                      if (err) {
                        return nextCall({
                          message: message.SOMETHING_WENT_WRONG,
                        });
                      }
                      nextCall(null, updateData);
                    }
                  );
                } else {
                  _self.getLogAutoIncrement(function (err, response) {
                    if (err) {
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                  });
                }
              });
            },
          ],
          function (err, response) {
            callback(err, response);
          }
        );
      },
      getPromoterAutoIncrement: function (callback) {
        async.waterfall(
          [
            function (nextCall) {
              SystemSettingsSchema.find({}).exec(function (
                err,
                getSystemSettingData
              ) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                if (getSystemSettingData[0]) {
                  SystemSettingsSchema.findOneAndUpdate(
                    {},
                    {
                      $inc: {
                        promoterAutoIncrement: Number(1),
                      },
                    },
                    {
                      new: true,
                    },
                    function (err, updateData) {
                      if (err) {
                        return nextCall({
                          message: message.SOMETHING_WENT_WRONG,
                        });
                      }
                      nextCall(null, updateData);
                    }
                  );
                } else {
                  _self.getPromoterAutoIncrement(function (err, response) {
                    if (err) {
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                  });
                }
              });
            },
          ],
          function (err, response) {
            callback(err, response);
          }
        );
      },
      deactivatePromoter: async function(req,res){
        async.waterfall(
            [
              /** get form data */
              function (nextCall) {
                Uploader.getFormFields(req, nextCall);
              },
              function (fields, nextCall) {
                fields.userId = fields.id;
                AdminSchema.findOne({
                  _id: fields.userId
                })
                  .lean()
                  .exec(function (err, promoterData) {
                    if (err) {
                      return nextCall({
                        message: 'SOMETHING_WENT_WRONG'
                      });
                    } else if (!promoterData) {
                      return nextCall({
                        message: 'DRIVER_NOT_FOUND'
                      });
                    } else {
                      nextCall(null, fields,promoterData);
                    }
                  });
              },
              function (fields,promoterData, nextCall){
                AdminSchema.updateOne({
                  _id: promoterData._id
                },{
                  deactivate: promoterData.deactivate ? false: true
                })
                  .lean()
                  .exec(function (err, promoterData) {
                    if (err) {
                      return nextCall({
                        message: 'SOMETHING_WENT_WRONG'
                      });
                    } else if (!promoterData) {
                      return nextCall({
                        message: 'DRIVER_NOT_FOUND'
                      });
                    } else {
                      _self.addActionLog(
                        req.user,
                        log_message.SECTION.DRIVER,
                        log_message.ACTION.UPDATE_DRIVER +
                          ", DriverId: " +
                          updateData.autoIncrementID +
                          ",  Name: " +
                          updateData.name
                      );
                      nextCall(null);                      
                    }
                  });
              }
            ],
            function (err,data) {
              console.log('data---',data);
              if (err) {
                return res.sendToEncode({
                  status: 400,
                  message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                });
              }
                return res.sendToEncode({
                  status_code: 200,
                  message: message.DRIVER_UPDATE_SUCC,
                  data: data,
                });
            }
      )},
      getDashboardData: function (req, res) {
        async.waterfall(
          [
            /** get today passenger count */
            // function (nextCall) {
            //   PassengerSchema.count({
            //     $and: [
            //       {
            //         createdAt: {
            //           $gte: moment()
            //             .hours(0)
            //             .minutes(0)
            //             .seconds(0)
            //             .milliseconds(0)
            //             .format(),
            //         },
            //       },
            //     ],
            //     isDeleted: false,
            //   }).exec(function (err, todayPassengers) {
            //     if (err) {
            //       return nextCall({
            //         message: message.SOMETHING_WENT_WRONG,
            //       });
            //     } else {
            //       let responseData = {};
            //       responseData.todayPassengers = todayPassengers;
            //       nextCall(null, responseData);
            //     }
            //   });
            // },
                    /** get today driver count */
            function (nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: moment()
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                ],
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, todayDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  let responseData = {};
                  responseData.todayDrivers = todayDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get yesterday driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $lte: moment()
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                  {
                    createdAt: {
                      $gte: moment()
                        .subtract(1, "days")
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                ],
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, yesterdayDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.yesterdayDrivers = yesterdayDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this month driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $lte: moment()
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                  {
                    createdAt: {
                      $gte: moment()
                        .startOf("month")
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                ],
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, thisMonthDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.thisMonthDrivers = thisMonthDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this last month driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: moment()
                        .startOf("month")
                        .month(new Date().getMonth() - 1)
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                  {
                    createdAt: {
                      $lte: moment()
                        .endOf("month")
                        .month(new Date().getMonth() - 1)
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                ],
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, lastMonthDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.lastMonthDrivers = lastMonthDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this year driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: moment()
                        .startOf("year")
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                  {
                    createdAt: {
                      $lte: moment()
                        .endOf("year")
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                ],
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, thisYearDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.thisYearDrivers = thisYearDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get last year driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: moment()
                        .startOf("year")
                        .year(new Date().getFullYear() - 1)
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                  {
                    createdAt: {
                      $lte: moment()
                        .endOf("year")
                        .year(new Date().getFullYear() - 1)
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format(),
                    },
                  },
                ],
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, lastYearDrivers) {
                if (err) {
                  console.log(err);
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.lastYearDrivers = lastYearDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get total driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, totalDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.totalDrivers = totalDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get total unverified driver count */
            function (responseData, nextCall) {
              DriverSchema.count({
                isVerified: false,
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, totalUnverifiedDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.totalUnverifiedDrivers = totalUnverifiedDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get online vehicles count */
            function (responseData, nextCall) {
              DriverSchema.count({
                isAvailable: true,
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, onlineVehicles) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.onlineVehicles = onlineVehicles;
                  nextCall(null, responseData);
                }
              });
            },
            /** get vehicleOwner and promoterData */
            async function(responseData , nextCall){
              let vehicleOwnerData  = await vehicleOwnerAndPromoterCount('vehicleOwner', req.user._id);
              responseData.vehicleOwnerCount =  vehicleOwnerData;
              return responseData;
            },
            /** get offline vehicles count */
            function (responseData, nextCall) {
              DriverSchema.count({
                isAvailable: false,
                isDeleted: false,
                addedBy: req.user._id
              }).exec(function (err, offlineVehicles) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.offlineVehicles = offlineVehicles;
                  nextCall(null, responseData);
                }
              });
            },
            /** get total trip count */
            function (responseData, nextCall) {
              RideSchema.aggregate(
                {
                  $match: {
                    status: "completed",
                  }, 
                },
                {
                  '$lookup': {
                    'from': 'driver', 
                    'localField': 'driverId', 
                    'foreignField': '_id', 
                    'as': 'driverData'
                  }
                }, {
                  '$unwind': {
                    'path': '$driverData', 
                    'preserveNullAndEmptyArrays': false
                  }
                }, {
                  '$match': {
                    'driverData.addedBy': ObjectId(req.user._id)
                  }
                },
                {
                  $count: "status",
                }
              ).exec(function (err, tripCount) {
                if (err) {
                  console.log(err);
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  responseData.tripCount = tripCount;
                  nextCall(null, responseData);
                }
              });
            },
          ],
          function (err, response) {
            if (err) {
              console.log(err);
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG,
              });
            }
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getReferral: async function (req,res){

        var columnName = req.query.columnName ? req.query.columnName : "_id";
        var orderBy = req.query.orderBy == "asc" ? 1 : -1;
        let aggregateQuery = [];
        aggregateQuery.push({
          '$sort': {
            'createdAt': -1
          }
        }, {
          '$match': {
            'status': 'completed'
          }
        }, {
          '$lookup': {
            'from': 'driver', 
            'localField': 'driverId', 
            'foreignField': '_id', 
            'as': 'driverData'
          }
        }, {
          '$unwind': {
            'path': '$driverData', 
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$lookup': {
            'from': 'vehicle', 
            'localField': 'vehicleId', 
            'foreignField': '_id', 
            'as': 'vehicleData'
          }
        }, {
          '$unwind': {
            'path': '$vehicleData', 
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$lookup': {
            'from': 'admin', 
            'localField': 'vehicleData.addedBy', 
            'foreignField': '_id', 
            'as': 'vehicleOwnerData'
          }
        }, {
          '$unwind': {
            'path': '$vehicleOwnerData', 
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$addFields': {
            'isDriverAdded': {
              '$cond': {
                'if': {
                  '$eq': [
                    '$driverData.addedBy', mongoose.Types.ObjectId(req.user._id)
                  ]
                }, 
                'then': true, 
                'else': false
              }
            }, 
            'isVehicleAdded': {
              '$cond': {
                'if': {
                  '$eq': [
                    '$vehicleOwnerData.addedBy', mongoose.Types.ObjectId(req.user._id)
                  ]
                }, 
                'then': true, 
                'else': false
              }
            }
          }
        }, {
          '$match': {
            '$or': [
              {
                'isDriverAdded': true
              }, {
                'isVehicleAdded': true
              }
            ]
          }
        }, {
          '$project': {
            'rideId': 1, 
            'isDriverAdded': 1, 
            'createdAt': 1, 
            'isVehicleAdded': 1, 
            'vehicleOwnerData': {
              '$cond': {
                'if': {
                  '$eq': [
                    '$isVehicleAdded', true
                  ]
                }, 
                'then': '$vehicleOwnerData', 
                'else': null
              }
            }, 
            'totalTime': 1, 
            'totalDistance': 1, 
            'pickupAddress': 1, 
            'destinationAddress': 1, 
            'promoterDriverCommission':1,
            'promoterVoCommission':1,
            'driverData': {
              '$cond': {
                'if': {
                  '$eq': [
                    '$isDriverAdded', true
                  ]
                }, 
                'then': '$driverData', 
                'else': null
              }
            }
          }
        });
        aggregateQuery.push({
          $sort: { [columnName]: orderBy },
        });
        aggregateQuery.push({
          $skip: Number(req.query.skip) || 0,
        });
        aggregateQuery.push({
          $limit: Number(req.query.limit) || 10,
        });
      
        let referralRide = await RideSchema.aggregate(aggregateQuery);
        if(referralRide.length > 0 ){
          return res.sendToEncode({
            status_code: 200,
            message: '',
            data: referralRide
          });
        }else {
          return res.sendToEncode({
            status: 400,
            message: 'SOMETHING_WENT_WRONG'
          });
        }
      }      
      }
module.exports = _self;
