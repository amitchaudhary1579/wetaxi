var debug = require("debug")("x-code:v1:controllers:driver"),
  moment = require("moment"),
  jwt = require("jsonwebtoken"),
  async = require("async"),
  path = require("path"),
  _ = require("underscore"),
  config = rootRequire("config/global"),
  /** Database Connections */
  //Mongoose library for query purose in MogoDB
  mongoose = require("mongoose"),
  // Custom services/helpers
  DS = rootRequire("services/date"),
  ED = rootRequire("services/encry_decry"),
  CONSTANTS = rootRequire("config/constant"),
  redisClient = rootRequire("support/redis"),
  //Database Schemas (MongoDB)
  AdminSchema = require("../../" + CONSTANTS.API_VERSION + "/models/admin"),
  PassengerSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/passenger"),
  DriverSchema = require("../../" + CONSTANTS.API_VERSION + "/models/driver"),
  SystemSettingsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/systemSettings"),
  VehicleTypeSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/vehicleType"),
  VehicleColorSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/vehicleColor"),
  HelpCenterSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/helpCenter"),
  BillingPlansSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/billingPlan"),
  WalletLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/walletLogs"),
  CountiesSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/countries"),
  EmergencySchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/emergency"),
  UniqueCodeSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/uniqueCode"),
  LanguageSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/language"),
  RewardSchema = require("../../" + CONSTANTS.API_VERSION + "/models/reward"),
  RideSchema = require("../../" + CONSTANTS.API_VERSION + "/models/ride"),
  NotificationSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notification"),
  DriverReferralSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/driverReferrals"),
  DriverRefEarningLogSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/driverReferralEarningLogs"),
  PassengerReferralEarningLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/passengerReferralEarningLogs"),
  PassengerReferralSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/passengerReferrals"),
  DriverRideRequestSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/driverRideRequest"),
  CMSSchema = require("../../" + CONSTANTS.API_VERSION + "/models/cms"),
  WithdrawsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/withdraws"),
  ActionLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/action_logs"),
  NotificationLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationLogs"),
  //Push notification
  pn = require("../../../support/push-notifications/pn"),
  //Supports
  Uploader = rootRequire("support/uploader"),
  /**
   * languages
   */
  message = rootRequire("config/messages/en"),
  COMBODIA_MESSAGES = rootRequire("config/messages/km"),
  CHINESE_MESSAGES = rootRequire("config/messages/zh"),
  log_message = rootRequire("config/log_messages");

// Create indexs required in HelpCenterSchema
HelpCenterSchema.collection.createIndex(
  {
    location: "2dsphere"
  },
  function(err, resp) {}
);

// Create indexs required in HelpCenterSchema
EmergencySchema.collection.createIndex(
  {
    location: "2dsphere"
  },
  function(err, resp) {}
);

var _self = {
    getDashboardProvinceData: function(req, res) {
        console.log(req.header);
        async.waterfall(
          [
            /** get all country */
            function(nextCall) {
              CountiesSchema.find({})
                .select("name code")
                .exec(function(err, country) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG
                    });
                  } else {
                    nextCall(null, country);
                  }
                });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
      getDashboardCustomerData: function(req, res) {
        console.log(req.header);
        async.waterfall(
          [
            /** get this year passenger count */
            function(nextCall) {
              PassengerSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("year")
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .endOf("year")
                          .hours(23)
                          .minutes(59)
                          .seconds(59)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                isDeleted: false
              }).exec(function(err, thisYearPassengers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.thisYearPassengers = thisYearPassengers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this month passenger count */
            function(responseData, nextCall) {
              PassengerSchema.count({
                $and: [
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("month")
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                isDeleted: false
              }).exec(function(err, thisMonthPassengers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.thisMonthPassengers = thisMonthPassengers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this last month passenger count */
            function(responseData, nextCall) {
              PassengerSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("month")
                          .month(new Date().getMonth() - 1)
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .endOf("month")
                          .month(new Date().getMonth() - 1)
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                isDeleted: false
              }).exec(function(err, lastMonthPassengers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.lastMonthPassengers = lastMonthPassengers;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            if (response.lastMonthPassengers == 0) {
              response.increase = true;
              response.percentage = 100;
            } else if (response.thisMonthPassengers == 0) {
              response.increase = false;
              response.percentage = 0;
            } else {
              if (
                response.lastMonthPassengers - response.thisMonthPassengers >=
                0
              ) {
                response.increase = false;
              } else {
                response.increase = true;
              }
              var diff = Math.abs(
                response.lastMonthPassengers - response.thisMonthPassengers
              );
              response.percentage = (diff * 100) / response.lastMonthPassengers;
            }
    
            delete response.lastMonthPassengers;
            delete response.thisMonthPassengers;
    
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
      getDashboardDriversData: function(req, res) {
        console.log(req.header);
        async.waterfall(
          [
            /** get this year driver count */
            function(nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("year")
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .endOf("year")
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                isDeleted: false
              }).exec(function(err, thisYearDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.thisYearDrivers = thisYearDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this month driver count */
            function(responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("month")
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                isDeleted: false
              }).exec(function(err, thisMonthDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.thisMonthDrivers = thisMonthDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this last month driver count */
            function(responseData, nextCall) {
              DriverSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("month")
                          .month(new Date().getMonth() - 1)
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .endOf("month")
                          .month(new Date().getMonth() - 1)
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                isDeleted: false
              }).exec(function(err, lastMonthDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.lastMonthDrivers = lastMonthDrivers;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            if (response.lastMonthDrivers == 0) {
              response.increase = true;
              response.percentage = 100;
            } else if (response.thisMonthDrivers == 0) {
              response.increase = false;
              response.percentage = 0;
            } else {
              if (response.lastMonthDrivers - response.thisMonthDrivers >= 0) {
                response.increase = false;
              } else {
                response.increase = true;
              }
              var diff = Math.abs(
                response.lastMonthDrivers - response.thisMonthDrivers
              );
              response.percentage = (diff * 100) / response.lastMonthDrivers;
            }
    
            delete response.lastMonthDrivers;
            delete response.thisMonthDrivers;
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
      getDashboardTripsData: function(req, res) {
        async.waterfall(
          [
            /** get this year trip count */
            function(nextCall) {
              RideSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("year")
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .endOf("year")
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                status: "completed"
              }).exec(function(err, thisYearTripsCount) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.thisYearTripsCount = thisYearTripsCount;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this month trips count */
            function(responseData, nextCall) {
              RideSchema.count({
                $and: [
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("month")
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                status: "completed"
              }).exec(function(err, thisMonthTrips) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.thisMonthTrips = thisMonthTrips;
                  nextCall(null, responseData);
                }
              });
            },
            /** get this last month trips count */
            function(responseData, nextCall) {
              RideSchema.count({
                $and: [
                  {
                    createdAt: {
                      $gte: new Date(
                        moment()
                          .startOf("month")
                          .month(new Date().getMonth() - 1)
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  },
                  {
                    createdAt: {
                      $lte: new Date(
                        moment()
                          .endOf("month")
                          .month(new Date().getMonth() - 1)
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      )
                    }
                  }
                ],
                status: "completed"
              }).exec(function(err, lastMonthTrips) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.lastMonthTrips = lastMonthTrips;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            if (response.lastMonthTrips == 0) {
              response.increase = true;
              response.percentage = 100;
            } else if (response.thisMonthTrips == 0) {
              response.increase = false;
              response.percentage = 0;
            } else {
              if (response.lastMonthTrips - response.thisMonthTrips >= 0) {
                response.increase = false;
              } else {
                response.increase = true;
              }
              var diff = Math.abs(
                response.lastMonthTrips - response.thisMonthTrips
              );
              response.percentage = (diff * 100) / response.lastMonthTrips;
            }
    
            delete response.lastMonthTrips;
            delete response.thisMonthTrips;
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
      getDashboardNetSalesData: function(req, res) {
        async.waterfall(
          [
            /** this Year Net Sales */
            function(nextCall) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  $and: [
                    {
                      createdAt: {
                        $gte: new Date(
                          moment()
                            .startOf("year")
                            .hours(23)
                            .minutes(59)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    },
                    {
                      createdAt: {
                        $lte: new Date(
                          moment()
                            .endOf("year")
                            .hours(23)
                            .minutes(59)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    }
                  ],
                  status: "completed",
                  paymentStatus: true
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalIncome: {
                    $sum: "$toatlFare"
                  }
                }
              });
              RideSchema.aggregate(aggregateQuery, (err, thisYearNetSales) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.thisYearNetSales =
                    thisYearNetSales.length !== 0
                      ? thisYearNetSales[0].totalIncome
                      : 0;
                  nextCall(null, responseData);
                }
              });
            },
            /** this Month Net Sales */
            function(responseData, nextCall) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  $and: [
                    {
                      createdAt: {
                        $lte: new Date(
                          moment()
                            .hours(23)
                            .minutes(59)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    },
                    {
                      createdAt: {
                        $gte: new Date(
                          moment()
                            .startOf("month")
                            .hours(0)
                            .minutes(0)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    }
                  ],
                  status: "completed",
                  paymentStatus: true
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalIncome: {
                    $sum: "$toatlFare"
                  }
                }
              });
              RideSchema.aggregate(aggregateQuery, (err, thisMonthNetSales) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.thisMonthNetSales =
                    thisMonthNetSales.length !== 0
                      ? thisMonthNetSales[0].totalIncome
                      : 0;
                  nextCall(null, responseData);
                }
              });
            },
            /** last Month Net Sales */
            function(responseData, nextCall) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  $and: [
                    {
                      createdAt: {
                        $gte: new Date(
                          moment()
                            .startOf("month")
                            .month(new Date().getMonth() - 1)
                            .hours(0)
                            .minutes(0)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    },
                    {
                      createdAt: {
                        $lte: new Date(
                          moment()
                            .endOf("month")
                            .month(new Date().getMonth() - 1)
                            .hours(0)
                            .minutes(0)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    }
                  ],
                  status: "completed",
                  paymentStatus: true
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalIncome: {
                    $sum: "$toatlFare"
                  }
                }
              });
              RideSchema.aggregate(aggregateQuery, (err, lastMonthNetSales) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.lastMonthNetSales =
                    lastMonthNetSales.length !== 0
                      ? lastMonthNetSales[0].totalIncome
                      : 0;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            if (response.lastMonthNetSales == 0) {
              response.increase = true;
              response.percentage = 100;
            } else if (response.thisMonthNetSales == 0) {
              response.increase = false;
              response.percentage = 0;
            } else {
              if (response.lastMonthNetSales - response.thisMonthNetSales >= 0) {
                response.increase = false;
              } else {
                response.increase = true;
              }
              var diff = Math.abs(
                response.lastMonthNetSales - response.thisMonthNetSales
              );
              response.percentage = (diff * 100) / response.lastMonthNetSales;
            }
    
            delete response.lastMonthNetSales;
            delete response.thisMonthNetSales;
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
      getDashboardSaleRevenueData: function(req, res) {
        async.waterfall(
          [
            /** this Year Sales Revenue*/
            function(nextCall) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  $and: [
                    {
                      createdAt: {
                        $gte: new Date(
                          moment()
                            .startOf("year")
                            .hours(0)
                            .minutes(0)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    },
                    {
                      createdAt: {
                        $lte: new Date(
                          moment()
                            .endOf("year")
                            .hours(23)
                            .minutes(59)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      }
                    }
                  ],
                  isDeleted: false
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalSaleRevenue: {
                    $sum: "$creditBalance"
                  }
                }
              });
              DriverSchema.aggregate(
                aggregateQuery,
                (err, thisYearSalesRevenue) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG
                    });
                  } else {
                    let responseData = {};
                    responseData.thisYearSalesRevenue =
                      thisYearSalesRevenue.length !== 0
                        ? thisYearSalesRevenue[0].totalSaleRevenue
                        : 0;
                    nextCall(null, responseData);
                  }
                }
              );
            },
            /** this Month Sales Revenue */
            function(responseData, nextCall) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  $and: [
                    {
                      createdAt: {
                        $lte: moment()
                          .hours(23)
                          .minutes(59)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      }
                    },
                    {
                      createdAt: {
                        $gte: moment()
                          .startOf("month")
                          .hours(0)
                          .minutes(0)
                          .seconds(0)
                          .milliseconds(0)
                          .format()
                      }
                    }
                  ],
                  isDeleted: false
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalSaleRevenue: {
                    $sum: "$creditBalance"
                  }
                }
              });
              DriverSchema.aggregate(
                aggregateQuery,
                (err, thisMonthSalesRevenue) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG
                    });
                  } else {
                    responseData.thisMonthSalesRevenue =
                      thisMonthSalesRevenue.length !== 0
                        ? thisMonthSalesRevenue[0].totalSaleRevenue
                        : 0;
                    nextCall(null, responseData);
                  }
                }
              );
            },
            /** last Month Sales Revenue */
            function(responseData, nextCall) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
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
                          .format()
                      }
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
                          .format()
                      }
                    }
                  ],
                  isDeleted: false
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalSaleRevenue: {
                    $sum: "$creditBalance"
                  }
                }
              });
              DriverSchema.aggregate(
                aggregateQuery,
                (err, lastMonthSalesRevenue) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG
                    });
                  } else {
                    responseData.lastMonthSalesRevenue =
                      lastMonthSalesRevenue.length !== 0
                        ? lastMonthSalesRevenue[0].totalSaleRevenue
                        : 0;
                    nextCall(null, responseData);
                  }
                }
              );
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            if (response.lastMonthSalesRevenue == 0) {
              response.increase = true;
              response.percentage = 100;
            } else if (response.thisMonthSalesRevenue == 0) {
              response.increase = false;
              response.percentage = 0;
            } else {
              if (
                response.lastMonthSalesRevenue - response.thisMonthSalesRevenue >=
                0
              ) {
                response.increase = false;
              } else {
                response.increase = true;
              }
              var diff = Math.abs(
                response.lastMonthSalesRevenue - response.thisMonthSalesRevenue
              );
              response.percentage = (diff * 100) / response.lastMonthSalesRevenue;
            }
    
            delete response.lastMonthSalesRevenue;
            delete response.thisMonthSalesRevenue;
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
    
      getDashboardCancleReasonData: function(req, res) {
        async.waterfall(
          [
            /** this month ride cancle reason count*/
            function(nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "cancelled" } });
    
              aggregateQuery.push({
                $match: {
                  createdAt: {
                    $gte: new Date(
                      moment()
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    ),
                    $lt: new Date(
                      moment()
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    )
                  }
                }
              });
    
              aggregateQuery.push({
                $project: {
                  createdAt: 1,
                  reasonText: 1
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: {
                    month: { $substr: ["$createdAt", 5, 2] },
                    reasonText: "$reasonText.en"
                  },
                  count: { $sum: 1 }
                }
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, thisMonthCancelledRideCount) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG
                    });
                  } else {
                    let responseData = {};
                    responseData.thisMonthCancelledRideCount = thisMonthCancelledRideCount;
                    nextCall(null, responseData);
                  }
                }
              );
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
    
      getDashboardCancleReasonWeeklyData: function(req, res) {
        async.waterfall(
          [
            /** this month ride cancle reason count*/
            function(nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "cancelled" } });
    
              aggregateQuery.push({
                $match: {
                  createdAt: {
                    $gte: new Date(
                      moment()
                        .startOf("year")
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    ),
                    $lt: new Date(
                      moment()
                        .endOf("year")
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    )
                  }
                }
              });
    
              aggregateQuery.push({
                $project: {
                  createdAt: 1,
                  reasonText: 1
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: {
                    week: { $week: "$createdAt" },
                    reasonText: "$reasonText.en"
                  },
                  count: { $sum: 1 }
                }
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, thisMonthCancelledRideCount) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG
                    });
                  } else {
                    let responseData = {};
                    responseData.thisMonthCancelledRideCount = thisMonthCancelledRideCount;
                    nextCall(null, responseData);
                  }
                }
              );
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
    
      getDashboardMonthlyLiveTripData: function(req, res) {
        async.waterfall(
          [
            /** this daily live ride count*/
            function(nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "completed" } });
    
              aggregateQuery.push({
                $match: {
                  createdAt: {
                    $gte: new Date(
                      moment()
                        .startOf("year")
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    ),
                    $lt: new Date(
                      moment()
                        .endOf("year")
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    )
                  }
                }
              });
    
              aggregateQuery.push({
                $project: {
                  createdAt: 1
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: {
                    month: { $substr: ["$createdAt", 5, 2] }
                  },
                  count: { $sum: 1 }
                }
              });
    
              RideSchema.aggregate(aggregateQuery, (err, monthlyLiveTripsCount) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.monthlyLiveTripsCount = monthlyLiveTripsCount;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
    
      getDashboardWeeklyLiveTripData: function(req, res) {
        async.waterfall(
          [
            /** this weekly live ride count*/
            function(nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "completed" } });
    
              aggregateQuery.push({
                $match: {
                  createdAt: {
                    $gte: new Date(
                      moment()
                        .startOf("year")
                        .hours(0)
                        .minutes(0)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    ),
                    $lt: new Date(
                      moment()
                        .endOf("year")
                        .hours(23)
                        .minutes(59)
                        .seconds(0)
                        .milliseconds(0)
                        .format()
                    )
                  }
                }
              });
    
              aggregateQuery.push({
                $project: {
                  createdAt: 1
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: { $week: "$createdAt" },
                  count: { $sum: 1 }
                }
              });
    
              RideSchema.aggregate(aggregateQuery, (err, weeklyLiveTripsCount) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.weeklyLiveTripsCount = weeklyLiveTripsCount;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },
    
      getDashboardDailyLiveDrivers: function(req, res) {
        async.waterfall(
          [
            /** get total driver count */
            function(nextCall) {
              DriverSchema.count({
                isDeleted: false
              }).exec(function(err, totalDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  let responseData = {};
                  responseData.totalDrivers = totalDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get total online driver count */
            function(responseData, nextCall) {
              DriverSchema.count({
                isDeleted: false,
                isOnline: true
              }).exec(function(err, totalOnlineDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.totalOnlineDrivers = totalOnlineDrivers;
                  nextCall(null, responseData);
                }
              });
            },
            /** get total offline driver count */
            function(responseData, nextCall) {
              DriverSchema.count({
                isDeleted: false,
                isOnline: false
              }).exec(function(err, totalOfflineDrivers) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG
                  });
                } else {
                  responseData.totalOfflineDrivers = totalOfflineDrivers;
                  nextCall(null, responseData);
                }
              });
            }
          ],
          function(err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG
              });
            }
    
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_DASHBOARD_DATA_SUCC,
              data: response
            });
          }
        );
      },

};
module.exports = _self;
