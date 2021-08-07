var debug = require("debug")("x-code:v1:controllers:driver"),
  moment = require("moment"),
//   jwt = require("jsonwebtoken"),
  async = require("async"),
//   path = require("path"),
  _ = require("underscore"),
//   config = rootRequire("config/global"),
  /** Database Connections */
  //Mongoose library for query purose in MogoDB
  mongoose = require("mongoose"),
  // Custom services/helpers
  DS = rootRequire("services/date"),
  ED = rootRequire("services/encry_decry"),
  CONSTANTS = rootRequire("config/constant"),
  redisClient = rootRequire("support/redis"),
//   Database Schemas (MongoDB)
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
  NotificationNewSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationNew"),
  NotificationLogsNewSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationLogsNew"),
  RewardSchema = require("../../" + CONSTANTS.API_VERSION + "/models/reward"),
  RewardNewSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/rewardNew"),
  RewardLogsNewSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/rewardLogsNew"),
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
  CallCenterSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/callCenter"),
  WithdrawsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/withdraws"),
  ActionLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/action_logs"),
  NotificationLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationLogs"),
  PromoCodeSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/promotionCode"),
  PagesSchema = require("../../" + CONSTANTS.API_VERSION + "/models/pages"),
  // PositionSchema = require("../../" +
  //   CONSTANTS.API_VERSION +
  //   "/models/position"),
  PositionSchemaNew = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/positionNew"),
  UserGroupSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/userGroup"),
  RecycleBinSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/recycleBin"),
  //Push notification
  pn = require("../../../support/push-notifications/pn"),
//   //Supports
//   Uploader = rootRequire("support/uploader"),
  /**
   * languages
   */
  message = rootRequire("config/messages/en");
//   COMBODIA_MESSAGES = rootRequire("config/messages/km"),
//   CHINESE_MESSAGES = rootRequire("config/messages/zh"),
//   log_message = rootRequire("config/log_messages");

// var nodeExcel = require("excel-export");
// var stringify = require("csv-stringify");
// var fs = require("fs");
// var phantom = require("phantom");
// var htmlToPdf = require("html-to-pdf");
// const convertHTMLToPDF = require("pdf-puppeteer");/
// const puppeteer = require("puppeteer");
// const browser = puppeteer.launch({ args: ["--no-sandbox"] });

// var htmltopdf1 = require("htmltopdf");

var FileCleaner = require("cron-file-cleaner").FileCleaner;

// var fileWatcher = new FileCleaner("./uploads/pdf/", 120000, "* */10 * * * *", {
//   start: true,
// });

// var API_URL = "http://3.25.2.201:7025/";

var ObjectId = mongoose.Types.ObjectId;

// Create indexs required in HelpCenterSchema
HelpCenterSchema.collection.createIndex(
  {
    location: "2dsphere",
  },
  function (err, resp) {}
);
async function vehicleOwnerAndPromoterCount(type) {
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
          type: type
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
          type: type
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
          type: type
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
          type: type
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
          type: type
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
          type: type
        });
        responseData.lastYearCount = lastYearCount;
      /** get total passenger count */
      let totalCount = await AdminSchema.count({
          type: type,
          isDeleted: false
        });

        responseData.totalCount = totalCount;
        return responseData;
      };
var _self = {
  
  getDashboardData: function (req, res) {
    async.waterfall(
      [
        /** get today passenger count */
        function (nextCall) {
          PassengerSchema.count({
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
          }).exec(function (err, todayPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.todayPassengers = todayPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get yesterday passenger count */
        function (responseData, nextCall) {
          PassengerSchema.count({
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
          }).exec(function (err, yesterdayPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.yesterdayPassengers = yesterdayPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this month passenger count */
        function (responseData, nextCall) {
          PassengerSchema.count({
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
          }).exec(function (err, thisMonthPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisMonthPassengers = thisMonthPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this last month passenger count */
        function (responseData, nextCall) {
          PassengerSchema.count({
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
          }).exec(function (err, lastMonthPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastMonthPassengers = lastMonthPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this year passenger count */
        function (responseData, nextCall) {
          PassengerSchema.count({
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
          }).exec(function (err, thisYearPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisYearPassengers = thisYearPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get last year passenger count */
        function (responseData, nextCall) {
          PassengerSchema.count({
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
          }).exec(function (err, lastYearPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastYearPassengers = lastYearPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get total passenger count */
        function (responseData, nextCall) {
          PassengerSchema.count({
            isDeleted: false,
          }).exec(function (err, totalPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.totalPassengers = totalPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get today driver count */
        function (responseData, nextCall) {
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
          }).exec(function (err, todayDrivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
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
          let vehicleOwnerData  = await vehicleOwnerAndPromoterCount('vehicleOwner');
          let promoterCount = await vehicleOwnerAndPromoterCount('promoter');
          responseData.vehicleOwnerCount =  vehicleOwnerData;
          responseData.promoterCount= promoterCount;
          return responseData;
        },
        /** get offline vehicles count */
        function (responseData, nextCall) {
          DriverSchema.count({
            isAvailable: false,
            isDeleted: false,
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
        /** get daily income */
        function (responseData, nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              paymentAt: {
                $exists: true,
                $ne: null,
              },
            },
          });
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .startOf("month")
                    .hours(00)
                    .minutes(00)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .utc()
                    .endOf("month")
                    .hours(23)
                    .minutes(57)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });

          aggregateQuery.push({
            $group: {
              _id: {
                day: {
                  $dayOfMonth: "$paymentAt",
                },
                month: {
                  $month: "$paymentAt",
                },
                year: {
                  $year: "$paymentAt",
                },
              },
              totalEarning: {
                $sum: "$adminEarning",
              },
              count: {
                $sum: 1,
              },
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$totalEarning",
              includeArrayIndex: "arrayIndex",
            },
          });
          aggregateQuery.push({
            $project: {
              _id: 0,
              date: "$_id.day",
              month: "$_id.month",
              year: "$_id.year",
              totalEarning: "$totalEarning",
              // totalEarning: {
              //   $toInt: "$totalEarning"
              // }
              // "totalEarning": {
              //     $divide: [{
              //             $subtract: [{
              //                     $multiply: ['$totalEarning', 100]
              //                 },
              //                 {
              //                     $mod: [{
              //                         $multiply: ['$totalEarning', 100]
              //                     }, 1]
              //                 }
              //             ]
              //         },
              //         100
              //     ]
              // }
            },
          });
          aggregateQuery.push({
            $sort: {
              date: 1,
            },
          });

          RideSchema.aggregate(aggregateQuery, (err, dailyEarning) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.dailyEarning = dailyEarning;
              nextCall(null, responseData);
            }
          });
        },
        /** get monthly income */
        // function (responseData, nextCall) {
        //     let aggregateQuery = [];

        //     aggregateQuery.push({
        //         $match: {
        //             "paymentAt": {
        //                 "$exists": true,
        //                 "$ne": null
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $match: {
        //             'createdAt': {
        //                 $gte: new Date(moment().utc().startOf('year').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
        //                 $lte: new Date(moment().utc().endOf('year').hours(23).minutes(57).seconds(0).milliseconds(0).format())
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $group: {
        //             '_id': {
        //                 month: {
        //                     $month: "$paymentAt"
        //                 },
        //                 year: {
        //                     $year: "$paymentAt"
        //                 }
        //             },
        //             'totalEarning': {
        //                 $sum: '$adminEarning'
        //             },
        //             count: {
        //                 $sum: 1
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $unwind: {
        //             path: "$totalEarning",
        //             includeArrayIndex: "arrayIndex"
        //         }
        //     })
        //     aggregateQuery.push({
        //         $project: {
        //             "_id": 0,
        //             "month": "$_id.month",
        //             "year": "$_id.year",
        //             "totalEarning": {
        //                 $toInt: "$totalEarning"
        //             }
        //             // "totalEarning": {
        //             //     $divide: [{
        //             //             $subtract: [{
        //             //                     $multiply: ['$totalEarning', 100]
        //             //                 },
        //             //                 {
        //             //                     $mod: [{
        //             //                         $multiply: ['$totalEarning', 100]
        //             //                     }, 1]
        //             //                 }
        //             //             ]
        //             //         },
        //             //         100
        //             //     ]
        //             // }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $sort: {
        //             "month": 1
        //         }
        //     })

        //     RideSchema.aggregate(aggregateQuery, (err, monthlyEarning) => {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.SOMETHING_WENT_WRONG,
        //             });
        //         } else {
        //             responseData.monthlyEarning = monthlyEarning;
        //             nextCall(null, responseData)
        //         }
        //     })
        // },
        /** get yearly income */
        // function (responseData, nextCall) {
        //     let aggregateQuery = [];

        //     aggregateQuery.push({
        //         $match: {
        //             "paymentAt": {
        //                 "$exists": true,
        //                 "$ne": null
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $group: {
        //             '_id': {
        //                 year: {
        //                     $year: "$paymentAt"
        //                 }
        //             },
        //             'totalEarning': {
        //                 $sum: '$adminEarning'
        //             },
        //             count: {
        //                 $sum: 1
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $unwind: {
        //             path: "$totalEarning",
        //             includeArrayIndex: "arrayIndex"
        //         }
        //     })
        //     aggregateQuery.push({
        //         $project: {
        //             "_id": 0,
        //             "year": "$_id.year",
        //             "totalEarning": {
        //                 $toInt: "$totalEarning"
        //             }
        //             // "totalEarning": {
        //             //     $divide: [{
        //             //             $subtract: [{
        //             //                     $multiply: ['$totalEarning', 100]
        //             //                 },
        //             //                 {
        //             //                     $mod: [{
        //             //                         $multiply: ['$totalEarning', 100]
        //             //                     }, 1]
        //             //                 }
        //             //             ]
        //             //         },
        //             //         100
        //             //     ]
        //             // }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $sort: {
        //             "year": 1
        //         }
        //     })

        //     RideSchema.aggregate(aggregateQuery, (err, yearlyEarning) => {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.SOMETHING_WENT_WRONG,
        //             });
        //         } else {
        //             responseData.yearlyEarning = yearlyEarning;
        //             nextCall(null, responseData)
        //         }
        //     })
        // },
        /** get total income */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $group: {
              _id: null,
              totalEarning: {
                $sum: "$adminEarning",
              },
              count: {
                $sum: 1,
              },
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$totalEarning",
              includeArrayIndex: "arrayIndex",
            },
          });
          aggregateQuery.push({
            $project: {
              _id: 0,
              totalEarning: "$totalEarning",
              // totalEarning: {
              //   $toInt: "$totalEarning"
              // }
              // "totalEarning": {
              //     $divide: [{
              //             $subtract: [{
              //                     $multiply: ['$totalEarning', 100]
              //                 },
              //                 {
              //                     $mod: [{
              //                         $multiply: ['$totalEarning', 100]
              //                     }, 1]
              //                 }
              //             ]
              //         },
              //         100
              //     ]
              // }
            },
          });

          RideSchema.aggregate(aggregateQuery, (err, totalEarning) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (totalEarning[0]) {
              responseData.totalEarning = totalEarning[0].totalEarning;
              nextCall(null, responseData);
            } else {
              responseData.totalEarning = totalEarning;
              nextCall(null, responseData);
            }
          });
        },
        /** get last year total income */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          // $gte: moment().startOf('year').year(new Date().getFullYear() - 1).hours(00).minutes(00).seconds(0).milliseconds(0).format(),
          // $lte: moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .startOf("year")
                    .subtract(1, "years")
                    .hours(00)
                    .minutes(00)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .utc()
                    .endOf("year")
                    .subtract(1, "years")
                    .hours(23)
                    .minutes(57)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalEarning: {
                $sum: "$adminEarning",
              },
              count: {
                $sum: 1,
              },
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$totalEarning",
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 0,
              totalEarning: "$totalEarning",
              // totalEarning: {
              //   $toInt: "$totalEarning"
              // }
              // "totalEarning": {
              //     $divide: [{
              //             $subtract: [{
              //                     $multiply: ['$totalEarning', 100]
              //                 },
              //                 {
              //                     $mod: [{
              //                         $multiply: ['$totalEarning', 100]
              //                     }, 1]
              //                 }
              //             ]
              //         },
              //         100
              //     ]
              // }
            },
          });

          RideSchema.aggregate(aggregateQuery, (err, totalEarning) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (totalEarning[0]) {
              responseData.lastYearTotalIncome = totalEarning[0].totalEarning;
              nextCall(null, responseData);
            } else {
              responseData.lastYearTotalIncome = totalEarning;
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
        /** get current year total income */
        // function (responseData, nextCall) {
        //     let aggregateQuery = [];

        //     aggregateQuery.push({
        //         $match: {
        //             "paymentAt": {
        //                 "$exists": true,
        //                 "$ne": null
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $match: {
        //             'createdAt': {
        //                 $gte: new Date(moment().utc().startOf('year').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
        //                 $lte: new Date(moment().utc().endOf('year').hours(23).minutes(57).seconds(0).milliseconds(0).format())
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $group: {
        //             '_id': {
        //                 month: {
        //                     $month: "$paymentAt"
        //                 },
        //                 year: {
        //                     $year: "$paymentAt"
        //                 }
        //             },
        //             'totalEarning': {
        //                 $sum: '$adminEarning'
        //             },
        //             count: {
        //                 $sum: 1
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $unwind: {
        //             path: "$totalEarning",
        //             includeArrayIndex: "arrayIndex"
        //         }
        //     })
        //     aggregateQuery.push({
        //         $project: {
        //             "_id": 0,
        //             "month": "$_id.month",
        //             "year": "$_id.year",
        //             "totalEarning": {
        //                 $toInt: "$totalEarning"
        //             }
        //             // "totalEarning": {
        //             //     $divide: [{
        //             //             $subtract: [{
        //             //                     $multiply: ['$totalEarning', 100]
        //             //                 },
        //             //                 {
        //             //                     $mod: [{
        //             //                         $multiply: ['$totalEarning', 100]
        //             //                     }, 1]
        //             //                 }
        //             //             ]
        //             //         },
        //             //         100
        //             //     ]
        //             // }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $sort: {
        //             "month": 1
        //         }
        //     })

        //     RideSchema.aggregate(aggregateQuery, (err, currentYearTotalEarning) => {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.SOMETHING_WENT_WRONG,
        //             });
        //         } else {
        //             responseData.currentYearTotalEarning = currentYearTotalEarning;
        //             nextCall(null, responseData)
        //         }
        //     })
        // },
        /** get total vehicle type */
        function (responseData, nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $lookup: {
              from: "driver",
              localField: "_id",
              foreignField: "vehicle.typeId",
              as: "driverRef",
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$driverRef",
            },
          });

          aggregateQuery.push({
            $match: {
              "driverRef.isDeleted": false,
            },
          });

          aggregateQuery.push({
            $group: {
              _id: "$_id",
              type: {
                $first: "$type",
              },
              count: {
                $sum: 1,
              },
            },
          });
          aggregateQuery.push({
            $project: {
              _id: 0,
              type: 1,
              count: 1,
            },
          });

          VehicleTypeSchema.aggregate(
            aggregateQuery,
            (err, totalVehicleType) => {
              if (err) {
                console.log(err);
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.totalVehicleType = totalVehicleType;
                nextCall(null, responseData);
              }
            }
          );
        },
        /** get active ride details */
        function (responseData, nextCall) {
          RideSchema.count(
            {
              status: {
                $in: ["accepted", "arrived", "onride"],
              },
            },
            function (err, activeRideCount) {
              if (err) {
                console.log(err);
                return nextCall({
                  code: 400,
                  status: 0,
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              responseData.activeRideCount = activeRideCount;
              nextCall(null, responseData);
            }
          );
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
  getDashboardMapData: function (req, res) {
    console.log(req.header);
    async.waterfall(
      [
        /** get all drivers */
        function (nextCall) {
          DriverSchema.find({
            isDeleted: false,
          })
            .select(
              "name location uniqueID vehicle isAvailable isBusy isOnline"
            )
            .populate("vehicle.typeId")
            .exec(function (err, drivers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                nextCall(null, drivers);
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
  getDashboardProvinceData: function (req, res) {
    console.log(req.header);
    async.waterfall(
      [
        /** get all country */
        function (nextCall) {
          CountiesSchema.find({})
            .select("name code")
            .exec(function (err, country) {
              if (err) {
                console.log(err);
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                nextCall(null, country);
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
  getDashboardCustomerData: function (req, res) {
    async.waterfall(
      [
        /** get this year passenger count */
        function (nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
          }).exec(function (err, thisYearPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.thisYearPassengers = thisYearPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this month passenger count */
        function (responseData, nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
          }).exec(function (err, thisMonthPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisMonthPassengers = thisMonthPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this last month passenger count */
        function (responseData, nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
          }).exec(function (err, lastMonthPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastMonthPassengers = lastMonthPassengers;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
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
          data: response,
        });
      }
    );
  },
  getDashboardVehicleOwnerData: function (req, res) {
    async.waterfall(
      [
        /** get this year passenger count */
        function (nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
          }).exec(function (err, thisYearPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.thisYearPassengers = thisYearPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this month passenger count */
        function (responseData, nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
          }).exec(function (err, thisMonthPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisMonthPassengers = thisMonthPassengers;
              nextCall(null, responseData);
            }
          });
        },
        /** get this last month passenger count */
        function (responseData, nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
          }).exec(function (err, lastMonthPassengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastMonthPassengers = lastMonthPassengers;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
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
          data: response,
        });
      }
    );
  },

  getDashboardDriversData: function (req, res) {
    console.log(req.header);
    async.waterfall(
      [
        /** get this year driver count */
        function (nextCall) {
          // use promoter as a role
          let promoterCondition = { };
          if(req.user.type=='promoter'){
          promoterCondition= { 
            addedBy: req.user._id
          };
          }
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
                  ),
                },
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
                  ),
                },
              },
              promoterCondition
            ],
            isDeleted: false,
          }).exec(function (err, thisYearDrivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.thisYearDrivers = thisYearDrivers;
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
                  $lte: new Date(
                    moment()
                      .hours(23)
                      .minutes(59)
                      .seconds(0)
                      .milliseconds(0)
                      .format()
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
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
                  $gte: new Date(
                    moment()
                      .startOf("month")
                      .month(new Date().getMonth() - 1)
                      .hours(0)
                      .minutes(0)
                      .seconds(0)
                      .milliseconds(0)
                      .format()
                  ),
                },
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
                  ),
                },
              },
            ],
            isDeleted: false,
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
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
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
        console.log('response', response);
        delete response.lastMonthDrivers;
        delete response.thisMonthDrivers;
        return res.sendToEncode({
          status_code: 200,
          message: message.GET_DASHBOARD_DATA_SUCC,
          data: response,
        });
      }
    );
  },
  getDashboardTripsData: function (req, res) {
    async.waterfall(
      [
        /** get this year trip count */
        function (nextCall) {
          RideSchema.count({
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
                  ),
                },
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
                  ),
                },
              },
            ],
            status: "completed",
          }).exec(function (err, thisYearTripsCount) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.thisYearTripsCount = thisYearTripsCount;
              nextCall(null, responseData);
            }
          });
        },
        /** get this month trips count */
        function (responseData, nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            status: "completed",
          }).exec(function (err, thisMonthTrips) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisMonthTrips = thisMonthTrips;
              nextCall(null, responseData);
            }
          });
        },
        /** get this last month trips count */
        function (responseData, nextCall) {
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
                  ),
                },
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
                  ),
                },
              },
            ],
            status: "completed",
          }).exec(function (err, lastMonthTrips) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastMonthTrips = lastMonthTrips;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
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
          data: response,
        });
      }
    );
  },
  getDashboardNetSalesData: function (req, res) {
    async.waterfall(
      [
        /** this Year Net Sales */
        function (nextCall) {
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
                    ),
                  },
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
                    ),
                  },
                },
              ],
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, thisYearNetSales) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
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
        function (responseData, nextCall) {
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
                    ),
                  },
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
                    ),
                  },
                },
              ],
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, thisMonthNetSales) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
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
        function (responseData, nextCall) {
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
                    ),
                  },
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
                    ),
                  },
                },
              ],
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, lastMonthNetSales) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastMonthNetSales =
                lastMonthNetSales.length !== 0
                  ? lastMonthNetSales[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
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
          data: response,
        });
      }
    );
  },
  getDashboardSaleRevenueData: function (req, res) {
    async.waterfall(
      [
        /** this Year Sales Revenue*/
        function (nextCall) {
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
                    ),
                  },
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
                    ),
                  },
                },
              ],
              isDeleted: false,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalSaleRevenue: {
                $sum: "$creditBalance",
              },
            },
          });
          DriverSchema.aggregate(
            aggregateQuery,
            (err, thisYearSalesRevenue) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
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
        function (responseData, nextCall) {
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
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalSaleRevenue: {
                $sum: "$creditBalance",
              },
            },
          });
          DriverSchema.aggregate(
            aggregateQuery,
            (err, thisMonthSalesRevenue) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
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
        function (responseData, nextCall) {
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
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalSaleRevenue: {
                $sum: "$creditBalance",
              },
            },
          });
          DriverSchema.aggregate(
            aggregateQuery,
            (err, lastMonthSalesRevenue) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
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
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
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
          data: response,
        });
      }
    );
  },

  getDashboardCancleReasonData: function (req, res) {
    async.waterfall(
      [
        /** this month ride cancle reason count*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { status: "cancelled" } });

          // aggregateQuery.push({
          //   $match: {
          //     createdAt: {
          //       $gte: new Date(
          //         moment()
          //           .hours(0)
          //           .minutes(0)
          //           .seconds(0)
          //           .milliseconds(0)
          //           .format()
          //       ),
          //       $lt: new Date(
          //         moment()
          //           .hours(23)
          //           .minutes(59)
          //           .seconds(0)
          //           .milliseconds(0)
          //           .format()
          //       ),
          //     },
          //   },
          // });

          aggregateQuery.push({
            $project: {
              createdAt: 1,
              reasonText: 1,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: {
                month: { $substr: ["$createdAt", 5, 2] },
                reasonText: "$reasonText.en",
              },
              count: { $sum: 1 },
            },
          });
          console.log('query test', JSON.stringify(aggregateQuery));
          RideSchema.aggregate(
            aggregateQuery,
            (err, thisMonthCancelledRideCount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.thisMonthCancelledRideCount = thisMonthCancelledRideCount;
                nextCall(null, responseData);
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
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

  getDashboardCancleReasonWeeklyData: function (req, res) {
    async.waterfall(
      [
        /** this month ride cancle reason count*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { status: "cancelled" } });

          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("month")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lt: new Date(
                  moment()
                    .endOf("month")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });

          aggregateQuery.push({
            $project: {
              createdAt: 1,
              reasonText: 1,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: {
                week: { $week: "$createdAt" },
                reasonText: "$reasonText.en",
              },
              count: { $sum: 1 },
            },
          });

          RideSchema.aggregate(
            aggregateQuery,
            (err, thisMonthCancelledRideCount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                // console.log(
                //   "thisMonthCancelledRideCount",
                //   thisMonthCancelledRideCount
                // );

                // let data = [];

                // var firstWeekOfMonth = moment(
                //   moment()
                //     .startOf("month")
                //     .hours(0)
                //     .minutes(0)
                //     .seconds(0)
                //     .milliseconds(0)
                //     .format()
                // ).week();
                // var lastWeekOfMonth = moment(
                //   moment()
                //     .endOf("month")
                //     .hours(23)
                //     .minutes(23)
                //     .seconds(0)
                //     .milliseconds(0)
                //     .format()
                // ).week();

                // for (var i = firstWeekOfMonth; i <= lastWeekOfMonth; i++) {
                //   data.push({ week: i });
                // }

                // var seriesName = [];

                // for (let i = 0; i < thisMonthCancelledRideCount.length; i++) {
                //   if (
                //     seriesName.indexOf(
                //       thisMonthCancelledRideCount[i]._id.reasonText.replace(
                //         / /g,
                //         "_"
                //       )
                //     ) !== -1
                //   ) {
                //     console.log("Value exists!");
                //   } else {
                //     seriesName.push(
                //       thisMonthCancelledRideCount[i]._id.reasonText.replace(
                //         / /g,
                //         "_"
                //       )
                //     );
                //   }
                // }

                // console.log("seriesName", seriesName);

                // for (let i = 0; i < seriesName.length; i++) {
                //   var name = seriesName[i];
                //   for (let j = 0; j < data.length; j++) {
                //     data[j][name] = 0;
                //   }
                // }

                // console.log("data", data);

                // console.log("data", data);

                let responseData = {};
                // first week of current month
                // var firstWeekOfMonth = moment(
                //   moment()
                //     .startOf("month")
                //     .hours(0)
                //     .minutes(0)
                //     .seconds(0)
                //     .milliseconds(0)
                //     .format()
                // ).week();
                // var lastWeekOfMonth = moment(
                //   moment()
                //     .endOf("month")
                //     .hours(23)
                //     .minutes(23)
                //     .seconds(0)
                //     .milliseconds(0)
                //     .format()
                // ).week();

                // var perWeek = [];
                // for (var i = firstWeekOfMonth; i <= lastWeekOfMonth; i++) {
                //   perWeek.push({ week: i, count: 0 });
                // }

                // for (var i = 0; i < thisMonthCancelledRideCount.length; i++) {
                //   for (var j = 0; j < perWeek.length; j++) {
                //     if (perWeek[j].week == thisMonthCancelledRideCount[i]._id) {
                //       perWeek[j].count = thisMonthCancelledRideCount[i].count;
                //     }
                //   }
                // }

                // responseData.thisMonthCancelledRideCount = weeks;
                responseData.thisMonthCancelledRideCount = thisMonthCancelledRideCount;
                nextCall(null, responseData);
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
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

  getDashboardMonthlyLiveTripData: function (req, res) {
    async.waterfall(
      [
        /** this daily live ride count*/
        function (nextCall) {
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
                ),
              },
            },
          });

          aggregateQuery.push({
            $project: {
              createdAt: 1,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: {
                month: { $substr: ["$createdAt", 5, 2] },
              },
              count: { $sum: 1 },
            },
          });

          RideSchema.aggregate(aggregateQuery, (err, monthlyLiveTripsCount) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.monthlyLiveTripsCount = monthlyLiveTripsCount;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.GET_MONTHLY_LIVE_TRIP_DATA_SUCC,
          data: response,
        });
      }
    );
  },

  getDashboardWeeklyLiveTripData: function (req, res) {
    async.waterfall(
      [
        /** this weekly live ride count*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { status: "completed" } });

          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("month")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lt: new Date(
                  moment()
                    .endOf("month")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });

          aggregateQuery.push({
            $project: {
              createdAt: 1,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: { $week: "$createdAt" },
              count: { $sum: 1 },
            },
          });

          RideSchema.aggregate(aggregateQuery, (err, weeklyLiveTripsCount) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              // first week of current month
              var firstWeekOfMonth = moment(
                moment()
                  .startOf("month")
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .format()
              ).week();
              var lastWeekOfMonth = moment(
                moment()
                  .endOf("month")
                  .hours(23)
                  .minutes(23)
                  .seconds(0)
                  .milliseconds(0)
                  .format()
              ).week();

              var perWeek = [];
              for (var i = firstWeekOfMonth; i <= lastWeekOfMonth; i++) {
                perWeek.push({ week: i, count: 0 });
              }

              for (var i = 0; i < weeklyLiveTripsCount.length; i++) {
                for (var j = 0; j < perWeek.length; j++) {
                  if (perWeek[j].week == weeklyLiveTripsCount[i]._id) {
                    perWeek[j].count = weeklyLiveTripsCount[i].count;
                  }
                }
              }

              var weeks = [];
              for (var i = 0; i < perWeek.length; i++) {
                weeks.push({ week: i + 1, count: perWeek[i].count });
              }
              responseData.weeklyLiveTripsCount = weeks;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.GET_WEEKLY_LIVE_TRIP_DATA_SUCC,
          data: response,
        });
      }
    );
  },

  getDashboardDailyLiveDrivers: function (req, res) {
    async.waterfall(
      [
        /** get total driver count */
        function (nextCall) {
          DriverSchema.count({
            isDeleted: false,
          }).exec(function (err, totalDrivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.totalDrivers = totalDrivers;
              nextCall(null, responseData);
            }
          });
        },
        /** get total online driver count */
        function (responseData, nextCall) {
          DriverSchema.count({
            isDeleted: false,
            isOnline: true,
          }).exec(function (err, totalOnlineDrivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.totalOnlineDrivers = totalOnlineDrivers;
              nextCall(null, responseData);
            }
          });
        },
        /** get total offline driver count */
        function (responseData, nextCall) {
          DriverSchema.count({
            isDeleted: false,
            isOnline: false,
          }).exec(function (err, totalOfflineDrivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.totalOfflineDrivers = totalOfflineDrivers;
              nextCall(null, responseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.GET_DAILY_LIVE_DRIVER_DATA_SUCC,
          data: response,
        });
      }
    );
  },
  getTopTenDriverAndPassengerData: function (req, res) {
    async.waterfall(
      [
        //  /** get top ten driver by referral money and ride money */
        // function (nextCall) {
        //     let aggregateQuery = [];

        //     aggregateQuery.push({
        //         $lookup: {
        //             "from": "ride",
        //             "localField": "_id",
        //             "foreignField": "driverId",
        //             "as": "rideRef"
        //         }
        //     })
        //     aggregateQuery.push({
        //         $unwind: {
        //             path: "$rideRef"
        //         }
        //     })
        //     // aggregateQuery.push({
        //     //     $match: {
        //     //         'rideRef.createdAt': {
        //     //             $gte: new Date(moment().utc().startOf('month').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
        //     //             $lte: new Date(moment().utc().endOf('month').hours(23).minutes(57).seconds(0).milliseconds(0).format())
        //     //         }
        //     //     }
        //     // })
        //     aggregateQuery.push({
        //         $group: {
        //             '_id': "$_id",
        //             'driverEarning': {
        //                 $sum: '$rideRef.driverEarning'
        //             },
        //             'name': {
        //                 $first: '$name'
        //             },
        //             'autoIncrementID': {
        //                 $first: '$autoIncrementID'
        //             },
        //             'avgRating': {
        //                 $first: '$avgRating'
        //             },
        //             'countryCode': {
        //                 $first: '$countryCode'
        //             },
        //             'createdAt': {
        //                 $first: '$createdAt'
        //             },
        //             'creditBalance': {
        //                 $first: '$creditBalance'
        //             },
        //             'dob': {
        //                 $first: '$dob'
        //             },
        //             'driverLevel': {
        //                 $first: '$driverLevel'
        //             },
        //             'email': {
        //                 $first: '$email'
        //             },
        //             'isBlocked': {
        //                 $first: '$isBlocked'
        //             },
        //             'isVerified': {
        //                 $first: '$isVerified'
        //             },
        //             'onlyPhoneNumber': {
        //                 $first: '$onlyPhoneNumber'
        //             },
        //             'phoneNumber': {
        //                 $first: '$phoneNumber'
        //             },
        //             'profilePhoto': {
        //                 $first: '$profilePhoto'
        //             },
        //             'uniqueID': {
        //                 $first: '$uniqueID'
        //             }
        //         }
        //     })

        //     aggregateQuery.push({
        //         $lookup: {
        //             "from": "driver_referral_earning_logs",
        //             "localField": "_id",
        //             "foreignField": "beneficiaryDriverId",
        //             "as": "driverReferral"
        //         }
        //     })
        //     aggregateQuery.push({
        //         $unwind: {
        //             path: "$driverReferral",
        //             preserveNullAndEmptyArrays: true
        //         }
        //     })
        //     // aggregateQuery.push({
        //     //     $match: {
        //     //         'driverReferral.createdAt': {
        //     //             $exists: false
        //     //         }
        //     //     }
        //     //     // 'driverReferral.createdAt': {
        //     //     //     $gte: new Date(moment().utc().startOf('month').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
        //     //     //     $lte: new Date(moment().utc().endOf('month').hours(23).minutes(57).seconds(0).milliseconds(0).format())
        //     //     // }
        //     //     // }
        //     // })

        //     // Sum
        //     aggregateQuery.push({
        //         $group: {
        //             '_id': "$_id",
        //             'referralAmount': {
        //                 $sum: '$driverReferral.referralAmount'
        //             },
        //             'driverEarning': {
        //                 $first: '$driverEarning'
        //             },
        //             'name': {
        //                 $first: '$name'
        //             },
        //             'autoIncrementID': {
        //                 $first: '$autoIncrementID'
        //             },
        //             'avgRating': {
        //                 $first: '$avgRating'
        //             },
        //             'countryCode': {
        //                 $first: '$countryCode'
        //             },
        //             'createdAt': {
        //                 $first: '$createdAt'
        //             },
        //             'creditBalance': {
        //                 $first: '$creditBalance'
        //             },
        //             'dob': {
        //                 $first: '$dob'
        //             },
        //             'driverLevel': {
        //                 $first: '$driverLevel'
        //             },
        //             'email': {
        //                 $first: '$email'
        //             },
        //             'isBlocked': {
        //                 $first: '$isBlocked'
        //             },
        //             'isVerified': {
        //                 $first: '$isVerified'
        //             },
        //             'onlyPhoneNumber': {
        //                 $first: '$onlyPhoneNumber'
        //             },
        //             'phoneNumber': {
        //                 $first: '$phoneNumber'
        //             },
        //             'profilePhoto': {
        //                 $first: '$profilePhoto'
        //             },
        //             'uniqueID': {
        //                 $first: '$uniqueID'
        //             }
        //         }
        //     })

        //     aggregateQuery.push({
        //         $project: {
        //             "_id": "$_id",
        //             "name": "$name",
        //             "autoIncrementID": 1,
        //             "avgRating": 1,
        //             "countryCode": 1,
        //             "createdAt": 1,
        //             "creditBalance": 1,
        //             "dob": 1,
        //             "driverLevel": 1,
        //             "email": 1,
        //             "isBlocked": 1,
        //             "isVerified": 1,
        //             "onlyPhoneNumber": 1,
        //             "phoneNumber": 1,
        //             "profilePhoto": 1,
        //             "uniqueID": 1,
        //             'driverEarning': {
        //                 $divide: [{
        //                         $subtract: [{
        //                                 $multiply: [{
        //                                     '$add': ['$driverEarning', '$referralAmount']
        //                                 }, 100]
        //                             },
        //                             {
        //                                 $mod: [{
        //                                     $multiply: [{
        //                                         '$add': ['$driverEarning', '$referralAmount']
        //                                     }, 100]
        //                                 }, 1]
        //                             }
        //                         ]
        //                     },
        //                     100
        //                 ]
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $sort: {
        //             "driverEarning": -1
        //         }
        //     })
        //     aggregateQuery.push({
        //         $limit: 10
        //     })

        //     DriverSchema.aggregate(aggregateQuery, (err, driverEarning) => {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.SOMETHING_WENT_WRONG,
        //             });
        //         } else {
        //             let responseData = {};
        //             responseData.topTenDriver = driverEarning;
        //             nextCall(null, responseData)
        //         }
        //     })
        // },
        // /** get top ten passenger by referral money */
        // function (responseData, nextCall) {
        //     let aggregateQuery = [];

        //     aggregateQuery.push({
        //         $lookup: {
        //             "from": "passenger_referral_earning_logs",
        //             "localField": "_id",
        //             "foreignField": "beneficiaryPassengerId",
        //             "as": "passengerReferral"
        //         }
        //     })
        //     aggregateQuery.push({
        //         $unwind: {
        //             path: "$passengerReferral"
        //         }
        //     })

        //     aggregateQuery.push({
        //         $group: {
        //             '_id': "$_id",
        //             'passengerEarning': {
        //                 $sum: '$passengerReferral.referralAmount'
        //             },
        //             'name': {
        //                 $first: '$name'
        //             },
        //             'autoIncrementID': {
        //                 $first: '$autoIncrementID'
        //             },
        //             'countryCode': {
        //                 $first: '$countryCode'
        //             },
        //             'createdAt': {
        //                 $first: '$createdAt'
        //             },
        //             'dob': {
        //                 $first: '$dob'
        //             },
        //             'name': {
        //                 $first: '$name'
        //             },
        //             'email': {
        //                 $first: '$email'
        //             },
        //             'isBlocked': {
        //                 $first: '$isBlocked'
        //             },
        //             'onlyPhoneNumber': {
        //                 $first: '$onlyPhoneNumber'
        //             },
        //             'passengerLevel': {
        //                 $first: '$passengerLevel'
        //             },
        //             'phoneNumber': {
        //                 $first: '$phoneNumber'
        //             },
        //             'profilePhoto': {
        //                 $first: '$profilePhoto'
        //             },
        //             'uniqueID': {
        //                 $first: '$uniqueID'
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $project: {
        //             "_id": "$_id",
        //             "name": 1,
        //             'autoIncrementID': 1,
        //             'countryCode': 1,
        //             'createdAt': 1,
        //             'dob': 1,
        //             'name': 1,
        //             'email': 1,
        //             'isBlocked': 1,
        //             'onlyPhoneNumber': 1,
        //             'passengerLevel': 1,
        //             'phoneNumber': 1,
        //             'profilePhoto': 1,
        //             'uniqueID':1,
        //             'passengerEarning': {
        //                 $divide: [{
        //                         $subtract: [{
        //                                 $multiply: ['$passengerEarning', 100]
        //                             },
        //                             {
        //                                 $mod: [{
        //                                     $multiply: ['$passengerEarning', 100]
        //                                 }, 1]
        //                             }
        //                         ]
        //                     },
        //                     100
        //                 ]
        //             }
        //         }
        //     })
        //     aggregateQuery.push({
        //         $sort: {
        //             "passengerEarning": -1
        //         }
        //     })
        //     aggregateQuery.push({
        //         $limit: 10
        //     })

        //     PassengerSchema.aggregate(aggregateQuery, (err, passengerEarning) => {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.SOMETHING_WENT_WRONG,
        //             });
        //         } else {
        //             responseData.topTenPassenger = passengerEarning;
        //             nextCall(null, responseData)
        //         }
        //     })
        // },
        /** get top ten driver by driver earning in ride */
        function (nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              isDeleted: false,
            },
          });
          // stage 1
          // aggregateQuery.push({
          //     $lookup: {
          //         "from": "ride",
          //         "localField": "_id",
          //         "foreignField": "driverId",
          //         "as": "rideRef"
          //     }
          // })
          // // stage 2
          // aggregateQuery.push({
          //     $unwind: {
          //         path: "$rideRef",
          //         preserveNullAndEmptyArrays: true
          //     }
          // })
          // // stage 3
          // aggregateQuery.push({
          //     $match: {
          //         "rideRef.status": "completed",
          //         "rideRef.paymentStatus": true
          //     }
          // })
          // stage 4
          aggregateQuery.push({
            $group: {
              _id: "$_id",
              // 'driverEarning': {
              //     $sum: '$rideRef.driverEarning'
              // },
              driverEarning: {
                $first: "$earningFromRide",
              },
              name: {
                $first: "$name",
              },
              autoIncrementID: {
                $first: "$autoIncrementID",
              },
              avgRating: {
                $first: "$avgRating",
              },
              countryCode: {
                $first: "$countryCode",
              },
              createdAt: {
                $first: "$createdAt",
              },
              creditBalance: {
                $first: "$creditBalance",
              },
              dob: {
                $first: "$dob",
              },
              driverLevel: {
                $first: "$driverLevel",
              },
              email: {
                $first: "$email",
              },
              isBlocked: {
                $first: "$isBlocked",
              },
              isVerified: {
                $first: "$isVerified",
              },
              onlyPhoneNumber: {
                $first: "$onlyPhoneNumber",
              },
              phoneNumber: {
                $first: "$phoneNumber",
              },
              profilePhoto: {
                $first: "$profilePhoto",
              },
              uniqueID: {
                $first: "$uniqueID",
              },
            },
          });
          // stage 5
          aggregateQuery.push({
            $project: {
              _id: "$_id",
              name: "$name",
              autoIncrementID: 1,
              avgRating: 1,
              countryCode: 1,
              createdAt: 1,
              creditBalance: 1,
              dob: 1,
              driverLevel: 1,
              email: 1,
              isBlocked: 1,
              isVerified: 1,
              onlyPhoneNumber: 1,
              phoneNumber: 1,
              profilePhoto: 1,
              uniqueID: 1,
              driverEarning: 1,
            },
          });
          // stage 6
          aggregateQuery.push({
            $sort: {
              driverEarning: -1,
            },
          });
          // stage 7
          aggregateQuery.push({
            $limit: 10,
          });

          DriverSchema.aggregate(aggregateQuery, (err, driverEarning) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.topTenDriverByDrivingMoney = driverEarning;
              nextCall(null, responseData);
            }
          });
        },
        /** get top ten passenger by spent total ride amount */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              isDeleted: false,
            },
          });
          // stage 1
          // aggregateQuery.push({
          //     $lookup: {
          //         "from": "ride",
          //         "localField": "_id",
          //         "foreignField": "passengerId",
          //         "as": "rideRef"
          //     }
          // })
          // // stage 2
          // aggregateQuery.push({
          //     $unwind: {
          //         path: "$rideRef"
          //     }
          // })
          // // stage 3
          // aggregateQuery.push({
          //     $match: {
          //         "rideRef.status": "completed",
          //         "rideRef.paymentStatus": true
          //     }
          // })
          // stage 4
          aggregateQuery.push({
            $group: {
              _id: "$_id",
              // 'passengerEarning': {
              //     $sum: '$rideRef.toatlFare'
              // },
              passengerEarning: {
                $first: "$earningFromRide",
              },
              name: {
                $first: "$name",
              },
              autoIncrementID: {
                $first: "$autoIncrementID",
              },
              countryCode: {
                $first: "$countryCode",
              },
              createdAt: {
                $first: "$createdAt",
              },
              dob: {
                $first: "$dob",
              },
              name: {
                $first: "$name",
              },
              email: {
                $first: "$email",
              },
              isBlocked: {
                $first: "$isBlocked",
              },
              onlyPhoneNumber: {
                $first: "$onlyPhoneNumber",
              },
              passengerLevel: {
                $first: "$passengerLevel",
              },
              phoneNumber: {
                $first: "$phoneNumber",
              },
              profilePhoto: {
                $first: "$profilePhoto",
              },
              uniqueID: {
                $first: "$uniqueID",
              },
            },
          });
          // stage 5
          aggregateQuery.push({
            $project: {
              _id: "$_id",
              name: 1,
              autoIncrementID: 1,
              countryCode: 1,
              createdAt: 1,
              dob: 1,
              name: 1,
              email: 1,
              isBlocked: 1,
              onlyPhoneNumber: 1,
              passengerLevel: 1,
              phoneNumber: 1,
              profilePhoto: 1,
              uniqueID: 1,
              passengerEarning: 1,
            },
          });
          // stage 6
          aggregateQuery.push({
            $sort: {
              passengerEarning: -1,
            },
          });
          // stage 7
          aggregateQuery.push({
            $limit: 10,
          });

          PassengerSchema.aggregate(aggregateQuery, (err, passengerEarning) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.topTenPassengerByRideSpentMoney = passengerEarning;
              nextCall(null, responseData);
            }
          });
        },
        /** get top ten driver by Number of completed rides */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              isDeleted: false,
            },
          });
          // stage 1
          // aggregateQuery.push({
          //     $lookup: {
          //         "from": "ride",
          //         "localField": "_id",
          //         "foreignField": "driverId",
          //         "as": "rideRef"
          //     }
          // })
          // // stage 2
          // aggregateQuery.push({
          //     $unwind: {
          //         path: "$rideRef",
          //         preserveNullAndEmptyArrays: true
          //     }
          // })
          // // stage 3
          // aggregateQuery.push({
          //     $match: {
          //         "rideRef.status": "completed",
          //         "rideRef.paymentStatus": true
          //     }
          // })
          // stage 4
          aggregateQuery.push({
            $group: {
              _id: "$_id",
              // 'totalCompletedRide': {
              //     $sum: 1
              // },
              totalCompletedRide: {
                $first: "$totalCompletedRides",
              },
              name: {
                $first: "$name",
              },
              autoIncrementID: {
                $first: "$autoIncrementID",
              },
              avgRating: {
                $first: "$avgRating",
              },
              countryCode: {
                $first: "$countryCode",
              },
              createdAt: {
                $first: "$createdAt",
              },
              creditBalance: {
                $first: "$creditBalance",
              },
              dob: {
                $first: "$dob",
              },
              driverLevel: {
                $first: "$driverLevel",
              },
              email: {
                $first: "$email",
              },
              isBlocked: {
                $first: "$isBlocked",
              },
              isVerified: {
                $first: "$isVerified",
              },
              onlyPhoneNumber: {
                $first: "$onlyPhoneNumber",
              },
              phoneNumber: {
                $first: "$phoneNumber",
              },
              profilePhoto: {
                $first: "$profilePhoto",
              },
              uniqueID: {
                $first: "$uniqueID",
              },
            },
          });
          // stage 5
          aggregateQuery.push({
            $project: {
              _id: "$_id",
              name: "$name",
              autoIncrementID: 1,
              avgRating: 1,
              countryCode: 1,
              createdAt: 1,
              creditBalance: 1,
              dob: 1,
              driverLevel: 1,
              email: 1,
              isBlocked: 1,
              isVerified: 1,
              onlyPhoneNumber: 1,
              phoneNumber: 1,
              profilePhoto: 1,
              uniqueID: 1,
              totalCompletedRide: 1,
            },
          });
          // stage 6
          aggregateQuery.push({
            $sort: {
              totalCompletedRide: -1,
            },
          });
          // stage 7
          aggregateQuery.push({
            $limit: 10,
          });

          DriverSchema.aggregate(
            aggregateQuery,
            (err, totalCompletedRideData) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.topTenDriverByCompletedRide = totalCompletedRideData;
                nextCall(null, responseData);
              }
            }
          );
        },
        /** get top ten passenger by Number of completed rides */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              isDeleted: false,
            },
          });
          // stage 1
          // aggregateQuery.push({
          //     $lookup: {
          //         "from": "ride",
          //         "localField": "_id",
          //         "foreignField": "passengerId",
          //         "as": "rideRef"
          //     }
          // })
          // // stage 2
          // aggregateQuery.push({
          //     $unwind: {
          //         path: "$rideRef"
          //     }
          // })
          // // stage 3
          // aggregateQuery.push({
          //     $match: {
          //         "rideRef.status": "completed",
          //         "rideRef.paymentStatus": true
          //     }
          // })
          // stage 4
          aggregateQuery.push({
            $group: {
              _id: "$_id",
              // 'totalCompletedRide': {
              //     $sum: 1
              // },
              totalCompletedRide: {
                $first: "$totalCompletedRides",
              },
              name: {
                $first: "$name",
              },
              autoIncrementID: {
                $first: "$autoIncrementID",
              },
              countryCode: {
                $first: "$countryCode",
              },
              createdAt: {
                $first: "$createdAt",
              },
              dob: {
                $first: "$dob",
              },
              name: {
                $first: "$name",
              },
              email: {
                $first: "$email",
              },
              isBlocked: {
                $first: "$isBlocked",
              },
              onlyPhoneNumber: {
                $first: "$onlyPhoneNumber",
              },
              passengerLevel: {
                $first: "$passengerLevel",
              },
              phoneNumber: {
                $first: "$phoneNumber",
              },
              profilePhoto: {
                $first: "$profilePhoto",
              },
              uniqueID: {
                $first: "$uniqueID",
              },
            },
          });
          // stage 5
          aggregateQuery.push({
            $project: {
              _id: "$_id",
              name: 1,
              autoIncrementID: 1,
              countryCode: 1,
              createdAt: 1,
              dob: 1,
              name: 1,
              email: 1,
              isBlocked: 1,
              onlyPhoneNumber: 1,
              passengerLevel: 1,
              phoneNumber: 1,
              profilePhoto: 1,
              uniqueID: 1,
              totalCompletedRide: 1,
            },
          });
          // stage 6
          aggregateQuery.push({
            $sort: {
              totalCompletedRide: -1,
            },
          });
          // stage 7
          aggregateQuery.push({
            $limit: 10,
          });

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, totalCompletedRideData) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.topTenPassengerByCompletedRide = totalCompletedRideData;
                nextCall(null, responseData);
              }
            }
          );
        },
        /** get top ten driver by Number of referral people count */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              isDeleted: false,
            },
          });
          aggregateQuery.push({
            $project: {
              _id: "$_id",
              name: "$name",
              autoIncrementID: 1,
              avgRating: 1,
              countryCode: 1,
              createdAt: 1,
              creditBalance: 1,
              dob: 1,
              driverLevel: 1,
              email: 1,
              isBlocked: 1,
              isVerified: 1,
              onlyPhoneNumber: 1,
              phoneNumber: 1,
              profilePhoto: 1,
              uniqueID: 1,
              // "totalInvitedCount": {
              //     $add: ["$parentDriverReferralsCount", "$grandParentReferralsCount", '$greatGrandParentDriverReferralsCount']
              // }
              totalInvitedCount: "$totalInvited",
            },
          });
          // stage 10
          aggregateQuery.push({
            $sort: {
              totalInvitedCount: -1,
            },
          });
          // stage 11
          aggregateQuery.push({
            $limit: 10,
          });

          DriverSchema.aggregate(aggregateQuery, (err, totalInvitedDrivers) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.topTenDriverByTotalInvited = totalInvitedDrivers;
              nextCall(null, responseData);
            }
          });
        },
        /** get top ten passenger by Number of referral people count */
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              isDeleted: false,
            },
          });
        
          aggregateQuery.push({
            $project: {
              _id: "$_id",
              name: 1,
              autoIncrementID: 1,
              countryCode: 1,
              createdAt: 1,
              dob: 1,
              name: 1,
              email: 1,
              isBlocked: 1,
              onlyPhoneNumber: 1,
              passengerLevel: 1,
              phoneNumber: 1,
              profilePhoto: 1,
              uniqueID: 1,
              // "totalInvitedCount": {
              //     $add: ["$level1PassengerReferralsCount", "$level2PassengerReferralsCount", '$level3PassengerReferralsCount', '$level4PassengerReferralsCount', '$level5PassengerReferralsCount']
              // }
              totalInvitedCount: "$totalInvited",
            },
          });
          // stage 17
          aggregateQuery.push({
            $sort: {
              totalInvitedCount: -1,
            },
          });
          // stage 18
          aggregateQuery.push({
            $limit: 10,
          });

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, totalPassengerInviteData) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.topTenPassengerByTotalInvited = totalPassengerInviteData;
                nextCall(null, responseData);
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
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


  getIncomeRelatedData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let aggregateQuery = [];
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
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, todaysDriverIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.todaysDriverIncome =
                todaysDriverIncome.length !== 0
                  ? todaysDriverIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .subtract(1, "days")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(
            aggregateQuery,
            (err, yesterdaysDriverIncome) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.yesterdaysDriverIncome =
                  yesterdaysDriverIncome.length !== 0
                    ? yesterdaysDriverIncome[0].totalIncome
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .startOf("month")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(
            aggregateQuery,
            (err, thisMonthsDriverIncome) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.thisMonthsDriverIncome =
                  thisMonthsDriverIncome.length !== 0
                    ? thisMonthsDriverIncome[0].totalIncome
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
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
                ),
                $lte: new Date(
                  moment()
                    .endOf("month")
                    .month(new Date().getMonth() - 1)
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(
            aggregateQuery,
            (err, lastMonthsDriverIncome) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.lastMonthsDriverIncome =
                  lastMonthsDriverIncome.length !== 0
                    ? lastMonthsDriverIncome[0].totalIncome
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, thisYearsDriverIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisYearsDriverIncome =
                thisYearsDriverIncome.length !== 0
                  ? thisYearsDriverIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$toatlFare",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, lastYearsDriverIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastYearsDriverIncome =
                lastYearsDriverIncome.length !== 0
                  ? lastYearsDriverIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
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
              },
              type: "credit",
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalCredit: {
                $sum: "$amount",
              },
            },
          });
          WalletLogsSchema.aggregate(
            aggregateQuery,
            (err, todaysDriverCredit) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.todaysDriverCredit =
                  todaysDriverCredit.length !== 0
                    ? todaysDriverCredit[0].totalCredit
                    : 0;
                return nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .subtract(1, "days")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              type: "credit",
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalCredit: {
                $sum: "$amount",
              },
            },
          });
          WalletLogsSchema.aggregate(
            aggregateQuery,
            (err, yesterdaysDriverCredit) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.yesterdaysDriverCredit =
                  yesterdaysDriverCredit.length !== 0
                    ? yesterdaysDriverCredit[0].totalCredit
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .startOf("month")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              type: "credit",
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalCredit: {
                $sum: "$amount",
              },
            },
          });
          WalletLogsSchema.aggregate(
            aggregateQuery,
            (err, thisMonthsDriverCredit) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.thisMonthsDriverCredit =
                  thisMonthsDriverCredit.length !== 0
                    ? thisMonthsDriverCredit[0].totalCredit
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
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
                ),
                $lte: new Date(
                  moment()
                    .endOf("month")
                    .month(new Date().getMonth() - 1)
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              type: "credit",
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalCredit: {
                $sum: "$amount",
              },
            },
          });
          RideSchema.aggregate(
            aggregateQuery,
            (err, lastMonthsDriverCredit) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.lastMonthsDriverCredit =
                  lastMonthsDriverCredit.length !== 0
                    ? lastMonthsDriverCredit[0].totalCredit
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              type: "credit",
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalCredit: {
                $sum: "$amount",
              },
            },
          });
          WalletLogsSchema.aggregate(
            aggregateQuery,
            (err, thisYearsDriverCredit) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.thisYearsDriverCredit =
                  thisYearsDriverCredit.length !== 0
                    ? thisYearsDriverCredit[0].totalCredit
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              type: "credit",
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalCredit: {
                $sum: "$amount",
              },
            },
          });
          WalletLogsSchema.aggregate(
            aggregateQuery,
            (err, lastYearsDriverCredit) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.lastYearsDriverCredit =
                  lastYearsDriverCredit.length !== 0
                    ? lastYearsDriverCredit[0].totalCredit
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
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
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$adminEarning",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, todaysAdminIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.todaysAdminIncome =
                todaysAdminIncome.length !== 0
                  ? todaysAdminIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .subtract(1, "days")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$adminEarning",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, yesterdaysAdminIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.yesterdaysAdminIncome =
                yesterdaysAdminIncome.length !== 0
                  ? yesterdaysAdminIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .startOf("month")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$adminEarning",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, thisMonthsAdminIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisMonthsAdminIncome =
                thisMonthsAdminIncome.length !== 0
                  ? thisMonthsAdminIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
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
                ),
                $lte: new Date(
                  moment()
                    .endOf("month")
                    .month(new Date().getMonth() - 1)
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$adminEarning",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, lastMonthsAdminIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastMonthsAdminIncome =
                lastMonthsAdminIncome.length !== 0
                  ? lastMonthsAdminIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$adminEarning",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, thisYearsAdminIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.thisYearsAdminIncome =
                thisYearsAdminIncome.length !== 0
                  ? thisYearsAdminIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
              status: "completed",
              paymentStatus: true,
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalIncome: {
                $sum: "$adminEarning",
              },
            },
          });
          RideSchema.aggregate(aggregateQuery, (err, lastYearsAdminIncome) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              responseData.lastYearsAdminIncome =
                lastYearsAdminIncome.length !== 0
                  ? lastYearsAdminIncome[0].totalIncome
                  : 0;
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
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
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalRef: {
                $sum: "$referralAmount",
              },
            },
          });
          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, todayDriversRefEarn) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.todayDriversRefEarn =
                  todayDriversRefEarn.length !== 0
                    ? todayDriversRefEarn[0].totalRef
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .subtract(1, "days")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalRef: {
                $sum: "$referralAmount",
              },
            },
          });
          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, yesterdaysDriverRefEarn) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.yesterdaysDriverRefEarn =
                  yesterdaysDriverRefEarn.length !== 0
                    ? yesterdaysDriverRefEarn[0].totalRef
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $lte: new Date(
                  moment()
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $gte: new Date(
                  moment()
                    .startOf("month")
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalRef: {
                $sum: "$referralAmount",
              },
            },
          });
          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, thisMonthsDriverRefEarn) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.thisMonthsDriverRefEarn =
                  thisMonthsDriverRefEarn.length !== 0
                    ? thisMonthsDriverRefEarn[0].totalRef
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
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
                ),
                $lte: new Date(
                  moment()
                    .endOf("month")
                    .month(new Date().getMonth() - 1)
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalRef: {
                $sum: "$referralAmount",
              },
            },
          });
          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, lastMonthsDriverRefEarn) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.lastMonthsDriverRefEarn =
                  lastMonthsDriverRefEarn.length !== 0
                    ? lastMonthsDriverRefEarn[0].totalRef
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalRef: {
                $sum: "$referralAmount",
              },
            },
          });
          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, thisYearsDriverRefEarn) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.thisYearsDriverRefEarn =
                  thisYearsDriverRefEarn.length !== 0
                    ? thisYearsDriverRefEarn[0].totalRef
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
        function (responseData, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              createdAt: {
                $gte: new Date(
                  moment()
                    .startOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .endOf("year")
                    .year(new Date().getFullYear() - 1)
                    .hours(23)
                    .minutes(59)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
              },
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalRef: {
                $sum: "$referralAmount",
              },
            },
          });
          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, lastYearsDriverRefEarn) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                responseData.lastYearsDriverRefEarn =
                  lastYearsDriverRefEarn.length !== 0
                    ? lastYearsDriverRefEarn[0].totalRef
                    : 0;
                nextCall(null, responseData);
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.GET_DASHBOARD_DATA_SUCC,
          data: {
            DriverIncome: {
              todays: response.todaysDriverIncome,
              yesterDays: response.yesterdaysDriverIncome,
              thisMonths: response.thisMonthsDriverIncome,
              lastMonths: response.lastMonthsDriverIncome,
              thisYears: response.thisYearsDriverIncome,
              lastYears: response.lastYearsDriverIncome,
            },
            AdminIncome: {
              todays: response.todaysAdminIncome,
              yesterDays: response.yesterdaysAdminIncome,
              thisMonths: response.thisMonthsAdminIncome,
              lastMonths: response.lastMonthsAdminIncome,
              thisYears: response.thisYearsAdminIncome,
              lastYears: response.lastYearsAdminIncome,
            },
            DriverCredit: {
              todays: response.todaysDriverCredit,
              yesterDays: response.yesterdaysDriverCredit,
              thisMonths: response.thisMonthsDriverCredit,
              lastMonths: response.lastMonthsDriverCredit,
              thisYears: response.thisYearsDriverCredit,
              lastYears: response.lastYearsDriverCredit,
            },
            DriverRefEarn: {
              todays: response.todayDriversRefEarn,
              yesterDays: response.yesterdaysDriverRefEarn,
              thisMonths: response.thisMonthsDriverRefEarn,
              lastMonths: response.lastMonthsDriverRefEarn,
              thisYears: response.thisYearsDriverRefEarn,
              lastYears: response.lastYearsDriverRefEarn,
            },
          },
        });
      }
    );
  },
}
module.exports = _self;
