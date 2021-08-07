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
  // AdminSchema = require("../../" + CONSTANTS.API_VERSION + "/models/users"),
  RecycleBinSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/recycleBin"),
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

var nodeExcel = require("excel-export");
var stringify = require("csv-stringify");
var fs = require("fs");
// var phantom = require("phantom");
// var htmlToPdf = require("html-to-pdf");
// const convertHTMLToPDF = require("pdf-puppeteer");/
// const puppeteer = require("puppeteer");
// const browser = puppeteer.launch({ args: ["--no-sandbox"] });

// var htmltopdf1 = require("htmltopdf");

var FileCleaner = require("cron-file-cleaner").FileCleaner;

var fileWatcher = new FileCleaner("./uploads/pdf/", 120000, "* */10 * * * *", {
  start: true,
});

var API_URL = "http://3.21.49.79:6025/";

var ObjectId = mongoose.Types.ObjectId;


var _self = {
    getAllReceivedBookingsDispacter: function (req, res) {
        async.waterfall(
          [
            /** get All Received Bookings Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "received" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                  createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt" } },
                  toatlFare: { $convert: { input: "$totalFare", to: "string", onError: "Error", onNull:"0" }},
                  rideId: { $toInt: "$rideId" }
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              var columnName = req.query.columnName ? req.query.columnName : "_id";
              var orderBy = req.query.orderBy == "asc" ? 1 : -1;
              var search = req.query.search ? req.query.search : false;
              if(search){
                const re = new RegExp(`${search}`, "i");
                aggregateQuery.push({
                  $match: {
                    $or: [{ passengerName: re }, { passengerPhone: re }, { pickupAddress: re },{ destinationAddress: re}, 
                      { driverName: re }, { createdAt: re }, {driverPhone: re}, { toatlFare: re}, { rideId: re}],
                  },
                });
              }
              aggregateQuery.push({
                $sort: { [columnName]: orderBy },
              });
    
              aggregateQuery.push({
                $skip: Number(req.query.skip) || 0,
              });
    
              aggregateQuery.push({
                $limit: Number(req.query.limit) || 10,
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllReceivedBookingsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllReceivedBookingsDispacter = AllReceivedBookingsDispacter;
                    responseData.recordsTotal = AllReceivedBookingsDispacter.length;
                    responseData.recordsFiltered =
                      AllReceivedBookingsDispacter.length;
                    nextCall(null, responseData);
                  }
                }
              );
            },
            function (response, nextCall) {
              RideSchema.count({ status: "received" }, function (err, count) {
                if (err) {
                  return nextCall({
                    code: 400,
                    status: 0,
                    message: message.NO_DATA_FOUND,
                  });
                }
                response.recordsTotal = count;
                response.recordsFiltered = count;
                nextCall(null, response);
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
              message: message.GET_RECEIVED_BOOKING_DISPACTER_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getAllAcceptedBookingdDispacter: function (req, res) {
        async.waterfall(
          [
            /** get All Accepted Bookingd Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "accepted" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                  createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt" } },
                  toatlFare: { $convert: { input: "$totalFare", to: "string", onError: "Error", onNull:"0" }},
                  rideId: { $toInt: "$rideId" }
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              var columnName = req.query.columnName ? req.query.columnName : "_id";
              var orderBy = req.query.orderBy == "asc" ? 1 : -1;
              var search = req.query.search ? req.query.search : false;
              if(search){
                const re = new RegExp(`${search}`, "i");
                aggregateQuery.push({
                  $match: {
                    $or: [{ passengerName: re }, { passengerPhone: re }, { pickupAddress: re },{ destinationAddress: re}, 
                      { driverName: re }, { createdAt: re }, {driverPhone: re}, {rideId: re}, { toatlFare: re}],
                  },
                });
              }
              aggregateQuery.push({
                $sort: { [columnName]: orderBy },
              });
    
              aggregateQuery.push({
                $skip: Number(req.query.skip) || 0,
              });
    
              aggregateQuery.push({
                $limit: Number(req.query.limit) || 10,
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllAcceptedBookingdDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllAcceptedBookingdDispacter = AllAcceptedBookingdDispacter;
                    nextCall(null, responseData);
                  }
                }
              );
            },
            function (response, nextCall) {
              RideSchema.count({ status: "accepted" }, function (err, count) {
                if (err) {
                  return nextCall({
                    code: 400,
                    status: 0,
                    message: message.NO_DATA_FOUND,
                  });
                }
                response.recordsTotal = count;
                response.recordsFiltered = count;
                nextCall(null, response);
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
              message: message.GET_ACCEPTED_BOOKING_DISPACTER_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getAllOnRideDispacter: function (req, res) {
        async.waterfall(
          [
            /** get All OnRide Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "onRide" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                  createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt" } },
                  toatlFare: { $convert: { input: "$totalFare", to: "string", onError: "Error", onNull:"0" }},
                  rideId: { $toInt: "$rideId" }
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              var columnName = req.query.columnName ? req.query.columnName : "_id";
              var orderBy = req.query.orderBy == "asc" ? 1 : -1;
              var search = req.query.search ? req.query.search : false;
              if(search){
                const re = new RegExp(`${search}`, "i");
                aggregateQuery.push({
                  $match: {
                    $or: [{ passengerName: re }, { passengerPhone: re }, { pickupAddress: re },{ destinationAddress: re}, 
                      { driverName: re }, { createdAt: re }, {driverPhone: re}, { toatlFare: re},{rideId: re} ],
                  },
                });
              }
              aggregateQuery.push({
                $sort: { [columnName]: orderBy },
              });
    
              aggregateQuery.push({
                $skip: Number(req.query.skip) || 0,
              });
    
              aggregateQuery.push({
                $limit: Number(req.query.limit) || 10,
              });
    
              RideSchema.aggregate(aggregateQuery, (err, AllOnRideDispacter) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  let responseData = {};
                  responseData.AllOnRideDispacter = AllOnRideDispacter;
                  responseData.recordsTotal = AllOnRideDispacter.length;
                  responseData.recordsFiltered = AllOnRideDispacter.length;
                  nextCall(null, responseData);
                }
              });
            },
            function (response, nextCall) {
              RideSchema.count({ status: "onRide" }, function (err, count) {
                if (err) {
                  return nextCall({
                    code: 400,
                    status: 0,
                    message: message.NO_DATA_FOUND,
                  });
                }
                response.recordsTotal = count;
                response.recordsFiltered = count;
                nextCall(null, response);
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
              message: message.GET_ON_RIDE_DISPACTER_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getMonthlyAcceptedOnRideDispacterCount: function (req, res) {
        async.waterfall(
          [
            /** get Monthly Accepted OnRide Dispacter Count*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "onRide" } });
    
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
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, MonthlyAcceptedOnRideDispacterCount) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.MonthlyAcceptedOnRideDispacterCount = MonthlyAcceptedOnRideDispacterCount;
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
              message: message.GET_MONTHLY_ON_RIDE_COUNT_DATA_SUCC,
              data: response,
            });
          }
        );
      },getWeeklyAcceptedOnRideDispacterCount: function (req, res) {
        async.waterfall(
          [
            /** get Weekly Accepted OnRide Dispacter Count */
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "onRide" } });
    
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
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, WeeklyAcceptedOnRideDispacterCount) => {
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
    
                    for (
                      var i = 0;
                      i < WeeklyAcceptedOnRideDispacterCount.length;
                      i++
                    ) {
                      for (var j = 0; j < perWeek.length; j++) {
                        if (
                          perWeek[j].week ==
                          WeeklyAcceptedOnRideDispacterCount[i]._id
                        ) {
                          perWeek[j].count =
                            WeeklyAcceptedOnRideDispacterCount[i].count;
                        }
                      }
                    }
    
                    var weeks = [];
                    for (var i = 0; i < perWeek.length; i++) {
                      weeks.push({ week: i + 1, count: perWeek[i].count });
                    }
                    responseData.WeeklyAcceptedOnRideDispacterCount = weeks;
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
              message: message.GET_WEEKLY_ON_RIDE_COUNT_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getAllSuccessfulTripsDispacter: function (req, res) {
        async.waterfall(
          [
            /** get All Successful Trips Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "completed" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                  createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt" } },
                  toatlFare: { $convert: { input: "$totalFare", to: "string", onError: "Error", onNull:"1" }},
                  rideId: { $toInt: "$rideId" }
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              var columnName = req.query.columnName ? req.query.columnName : "_id";
              var orderBy = req.query.orderBy == "asc" ? 1 : -1;

              var search = req.query.search ? req.query.search : false;
              if(search){
                const re = new RegExp(`${search}`, "i");
                aggregateQuery.push({
                  $match: {
                    $or: [{ passengerName: re }, { passengerPhone: re }, { pickupAddress: re },{ destinationAddress: re}, 
                      { driverName: re }, { createdAt: re }, {driverPhone: re}, { toatlFare: re},],
                  },
                });
              }
              aggregateQuery.push({
                $sort: { [columnName]: orderBy },
              });
    
              aggregateQuery.push({
                $skip: Number(req.query.skip) || 0,
              });
    
              aggregateQuery.push({
                $limit: Number(req.query.limit) || 10,
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllSuccessfulTripsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllSuccessfulTripsDispacter = AllSuccessfulTripsDispacter;
                    responseData.recordsTotal = AllSuccessfulTripsDispacter.length;
                    responseData.recordsFiltered =
                      AllSuccessfulTripsDispacter.length;
                    nextCall(null, responseData);
                  }
                }
              );
            },
            function (response, nextCall) {
              RideSchema.count({ status: "completed" }, function (err, count) {
                if (err) {
                  return nextCall({
                    code: 400,
                    status: 0,
                    message: message.NO_DATA_FOUND,
                  });
                }
                response.recordsTotal = count;
                response.recordsFiltered = count;
                nextCall(null, response);
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
              message: message.GET_SUCCESSFUL_TRIP_DISPACTER_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getAllCancleBookingsDispacter: function (req, res) {
        async.waterfall(
          [
            /** get All Cancle Bookings Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "cancelled" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                  createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt" } },
                  toatlFare: { $convert: { input: "$totalFare", to: "string", onError: "Error", onNull:"0" }},
                  rideId: { $toInt: "$rideId" }
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                },
              });
    
              var columnName = req.query.columnName ? req.query.columnName : "_id";
              var orderBy = req.query.orderBy == "asc" ? 1 : -1;
              var search = req.query.search ? req.query.search : false;
              if(search){
                const re = new RegExp(`${search}`, "i");
                aggregateQuery.push({
                  $match: {
                    $or: [{ passengerName: re }, { passengerPhone: re }, { pickupAddress: re },{ destinationAddress: re}, 
                      { driverName: re }, { createdAt: re }, {driverPhone: re}, { toatlFare: re}],
                  },
                });
              }
              aggregateQuery.push({
                $sort: { [columnName]: orderBy },
              });
    
              aggregateQuery.push({
                $skip: Number(req.query.skip) || 0,
              });
    
              aggregateQuery.push({
                $limit: Number(req.query.limit) || 10,
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllCancleBookingsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllCancleBookingsDispacter = AllCancleBookingsDispacter;
                    responseData.recordsTotal = AllCancleBookingsDispacter.length;
                    responseData.recordsFiltered =
                      AllCancleBookingsDispacter.length;
                    nextCall(null, responseData);
                  }
                }
              );
            },
            function (response, nextCall) {
              RideSchema.count({ status: "cancelled" }, function (err, count) {
                if (err) {
                  return nextCall({
                    code: 400,
                    status: 0,
                    message: message.NO_DATA_FOUND,
                  });
                }
                response.recordsTotal = count;
                response.recordsFiltered = count;
                nextCall(null, response);
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
            console.log('response---',response);
            return res.sendToEncode({
              status_code: 200,
              message: message.GET_CANCLE_BOOKING_DISPACTER_DATA_SUCC,
              data: response,
            });
          }
        );
      },
      getDispacterDetailsById: function (req, res) {
        async.waterfall(
          [
            /** get Dispacter details by id */
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({
                $match: {
                  _id: ObjectId(req.body.id),
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "vehicle_type",
                  localField: "requestedVehicleTypeId",
                  foreignField: "_id",
                  as: "vehicleTypeData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$vehicleTypeData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "reason",
                  localField: "cancelReason",
                  foreignField: "_id",
                  as: "reasonData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$reasonData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              RideSchema.aggregate(aggregateQuery, (err, RideDetail) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  let responseData = {};
                  responseData.RideDetail = RideDetail;
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
              message: message.GET_RIDE_DETAILS_SUCC,
              data: response,
            });
          }
        );
      },
      getAllReceivedBookingsDispacterExcel: function (req, res) {
        async.waterfall(
          [
            /** get All Received Bookings Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "received" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllReceivedBookingsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllReceivedBookingsDispacter = AllReceivedBookingsDispacter;
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
    
            // create and save excel and send excel file name with path in response
            var conf = {};
            conf.name = "Received Bookings Dispacter";
            conf.cols = [
              {
                caption: "SR.NO.",
                type: "number",
              },
              {
                caption: "Ride ID",
                type: "number",
              },
              {
                caption: "Customer",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "From",
                type: "string",
              },
              {
                caption: "To",
                type: "string",
              },
              {
                caption: "Driver",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "Amount",
                type: "number",
              },
              {
                caption: "Date",
                type: "string",
              },
            ];
            conf.rows = [];
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            for (var i = 0; i < jsonObj.AllReceivedBookingsDispacter.length; i++) {
              conf.rows.push([
                i + 1,
                jsonObj.AllReceivedBookingsDispacter[i].rideId,
                jsonObj.AllReceivedBookingsDispacter[i].passengerName,
                jsonObj.AllReceivedBookingsDispacter[i].passengerPhone,
                jsonObj.AllReceivedBookingsDispacter[i].pickupAddress,
                jsonObj.AllReceivedBookingsDispacter[i].destinationAddress,
                jsonObj.AllReceivedBookingsDispacter[i].driverName,
                jsonObj.AllReceivedBookingsDispacter[i].driverPhone,
                jsonObj.AllReceivedBookingsDispacter[i].totalFare,
                jsonObj.AllReceivedBookingsDispacter[i].createdAt,
              ]);
            }
    
            var result = nodeExcel.execute(conf);
            res.setHeader("Content-Type", "application/vnd.openxmlformats");
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "Received_Bookings_Dispacter.xlsx"
            );
            res.writeHead(200);
            res.end(result, "binary");
          }
        );
      },
      getAllAcceptedBookingdDispacterExcel: function (req, res) {
        async.waterfall(
          [
            /** get All Accepted Bookingd Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "accepted" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllAcceptedBookingdDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllAcceptedBookingdDispacter = AllAcceptedBookingdDispacter;
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
    
            // create and save excel and send excel file name with path in response
            var conf = {};
            conf.name = "Accepted Booking Dispacter";
            conf.cols = [
              {
                caption: "SR.NO.",
                type: "number",
              },
              {
                caption: "Ride ID",
                type: "number",
              },
              {
                caption: "Customer",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "From",
                type: "string",
              },
              {
                caption: "To",
                type: "string",
              },
              {
                caption: "Driver",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "Amount",
                type: "number",
              },
              {
                caption: "Date",
                type: "string",
              },
            ];
            conf.rows = [];
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            for (var i = 0; i < jsonObj.AllAcceptedBookingdDispacter.length; i++) {
              conf.rows.push([
                i + 1,
                jsonObj.AllAcceptedBookingdDispacter[i].rideId,
                jsonObj.AllAcceptedBookingdDispacter[i].passengerName,
                jsonObj.AllAcceptedBookingdDispacter[i].passengerPhone,
                jsonObj.AllAcceptedBookingdDispacter[i].pickupAddress,
                jsonObj.AllAcceptedBookingdDispacter[i].destinationAddress,
                jsonObj.AllAcceptedBookingdDispacter[i].driverName,
                jsonObj.AllAcceptedBookingdDispacter[i].driverPhone,
                jsonObj.AllAcceptedBookingdDispacter[i].totalFare,
                jsonObj.AllAcceptedBookingdDispacter[i].createdAt,
              ]);
            }
    
            var result = nodeExcel.execute(conf);
            res.setHeader("Content-Type", "application/vnd.openxmlformats");
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "Accepted_Booking_Dispacter.xlsx"
            );
            res.writeHead(200);
            res.end(result, "binary");
          }
        );
      },
      getAllOnRideDispacterExcel: function (req, res) {
        async.waterfall(
          [
            /** get All OnRide Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "onRide" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(aggregateQuery, (err, AllOnRideDispacter) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  let responseData = {};
                  responseData.AllOnRideDispacter = AllOnRideDispacter;
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
    
            // create and save excel and send excel file name with path in response
            var conf = {};
            conf.name = "OnRide Dispacter";
            conf.cols = [
              {
                caption: "SR.NO.",
                type: "number",
              },
              {
                caption: "Ride ID",
                type: "number",
              },
              {
                caption: "Customer",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "From",
                type: "string",
              },
              {
                caption: "To",
                type: "string",
              },
              {
                caption: "Driver",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "Amount",
                type: "number",
              },
              {
                caption: "Date",
                type: "string",
              },
            ];
            conf.rows = [];
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            for (var i = 0; i < jsonObj.AllOnRideDispacter.length; i++) {
              conf.rows.push([
                i + 1,
                jsonObj.AllOnRideDispacter[i].rideId,
                jsonObj.AllOnRideDispacter[i].passengerName,
                jsonObj.AllOnRideDispacter[i].passengerPhone,
                jsonObj.AllOnRideDispacter[i].pickupAddress,
                jsonObj.AllOnRideDispacter[i].destinationAddress,
                jsonObj.AllOnRideDispacter[i].driverName,
                jsonObj.AllOnRideDispacter[i].driverPhone,
                jsonObj.AllOnRideDispacter[i].totalFare,
                jsonObj.AllOnRideDispacter[i].createdAt,
              ]);
            }
    
            var result = nodeExcel.execute(conf);
            res.setHeader("Content-Type", "application/vnd.openxmlformats");
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "OnRide_Dispacter.xlsx"
            );
            res.writeHead(200);
            res.end(result, "binary");
          }
        );
      },
      getAllSuccessfulTripsDispacterExcel: function (req, res) {
        async.waterfall(
          [
            /** get All Successful Trips Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "completed" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllSuccessfulTripsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllSuccessfulTripsDispacter = AllSuccessfulTripsDispacter;
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
    
            // create and save excel and send excel file name with path in response
            var conf = {};
            conf.name = "Successful Trips Dispacter";
            conf.cols = [
              {
                caption: "SR.NO.",
                type: "number",
              },
              {
                caption: "Ride ID",
                type: "number",
              },
              {
                caption: "Customer",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "From",
                type: "string",
              },
              {
                caption: "To",
                type: "string",
              },
              {
                caption: "Driver",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "Amount",
                type: "number",
              },
              {
                caption: "Date",
                type: "string",
              },
            ];
            conf.rows = [];
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            for (var i = 0; i < jsonObj.AllSuccessfulTripsDispacter.length; i++) {
              conf.rows.push([
                i + 1,
                jsonObj.AllSuccessfulTripsDispacter[i].rideId,
                jsonObj.AllSuccessfulTripsDispacter[i].passengerName,
                jsonObj.AllSuccessfulTripsDispacter[i].passengerPhone,
                jsonObj.AllSuccessfulTripsDispacter[i].pickupAddress,
                jsonObj.AllSuccessfulTripsDispacter[i].destinationAddress,
                jsonObj.AllSuccessfulTripsDispacter[i].driverName,
                jsonObj.AllSuccessfulTripsDispacter[i].driverPhone,
                jsonObj.AllSuccessfulTripsDispacter[i].totalFare,
                jsonObj.AllSuccessfulTripsDispacter[i].createdAt,
              ]);
            }
    
            var result = nodeExcel.execute(conf);
            res.setHeader("Content-Type", "application/vnd.openxmlformats");
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "Successful_Trips_Dispacter.xlsx"
            );
            res.writeHead(200);
            res.end(result, "binary");
          }
        );
      },
      getAllCancleBookingsDispacterExcel: function (req, res) {
        async.waterfall(
          [
            /** get All Cancle Bookings Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "cancelled" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllCancleBookingsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllCancleBookingsDispacter = AllCancleBookingsDispacter;
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
    
            // create and save excel and send excel file name with path in response
            var conf = {};
            conf.name = "Cancle Booking Dispacter";
            conf.cols = [
              {
                caption: "SR.NO.",
                type: "number",
              },
              {
                caption: "Ride ID",
                type: "number",
              },
              {
                caption: "Customer",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "From",
                type: "string",
              },
              {
                caption: "To",
                type: "string",
              },
              {
                caption: "Driver",
                type: "string",
              },
              {
                caption: "Phone",
                type: "string",
              },
              {
                caption: "Amount",
                type: "number",
              },
              {
                caption: "Date",
                type: "string",
              },
            ];
            conf.rows = [];
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            for (var i = 0; i < jsonObj.AllCancleBookingsDispacter.length; i++) {
              conf.rows.push([
                i + 1,
                jsonObj.AllCancleBookingsDispacter[i].rideId,
                jsonObj.AllCancleBookingsDispacter[i].passengerName,
                jsonObj.AllCancleBookingsDispacter[i].passengerPhone,
                jsonObj.AllCancleBookingsDispacter[i].pickupAddress,
                jsonObj.AllCancleBookingsDispacter[i].destinationAddress,
                jsonObj.AllCancleBookingsDispacter[i].driverName,
                jsonObj.AllCancleBookingsDispacter[i].driverPhone,
                jsonObj.AllCancleBookingsDispacter[i].totalFare,
                jsonObj.AllCancleBookingsDispacter[i].createdAt,
              ]);
            }
    
            var result = nodeExcel.execute(conf);
            res.setHeader("Content-Type", "application/vnd.openxmlformats");
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "Cancle_Booking_Dispacter.xlsx"
            );
            res.writeHead(200);
            res.end(result, "binary");
          }
        );
      },
      getAllReceivedBookingsDispacterPDF: function (req, res) {
        async.waterfall(
          [
            /** get All Received Bookings Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "received" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllReceivedBookingsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllReceivedBookingsDispacter = AllReceivedBookingsDispacter;
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
              message: message.SUCCESS,
              data: response,
            });
            // create and save excel and send excel file name with path in response
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            var html =
              "<html>" +
              "<head>" +
              "</head>" +
              "<body>" +
              "<center><h1>Received Bookings Dispacter</h1></center>" +
              '<center><table border="1">' +
              "  <tr>" +
              "    <th>SR.NO.</th>" +
              "    <th>Ride ID</th>" +
              "    <th>Customer</th>" +
              "    <th>Phone</th>" +
              "    <th>From</th>" +
              "    <th>To</th>" +
              "    <th>Driver</th>" +
              "    <th>Phone</th>" +
              "    <th>Amount</th>" +
              "    <th>Date</th>" +
              "  </tr>";
    
            for (var i = 0; i < jsonObj.AllReceivedBookingsDispacter.length; i++) {
              html +=
                "  <tr>" +
                "    <td>" +
                i +
                1 +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].rideId +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].passengerName +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].passengerPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].pickupAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].destinationAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].driverName +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].driverPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].toatlFare +
                "</td>" +
                "    <td>" +
                jsonObj.AllReceivedBookingsDispacter[i].createdAt +
                "</td>" +
                "  </tr>";
            }
    
            html += "</table></center>" + "</body>" + "</html>";
    
            convertHTMLToPDF(html, function (pdf) {
              // do something with the PDF like send it as the response
              fs.writeFileSync(
                "./uploads/pdf/Received_Bookings_Dispacter.pdf",
                pdf
              );
    
              fs.writeFileSync(
                "/home/ubuntu/gogotaxi/uploads/pdf/Received_Bookings_Dispacter.pdf",
                pdf
              );
    
              return res.sendToEncode({
                status_code: 200,
                message: message.SUCCESS,
                URL: API_URL + "uploads/pdf/Received_Bookings_Dispacter.pdf",
              });
            });
    
            // htmlToPdf.convertHTMLString(
            //   html,
            //   "/home/ubuntu/gogotaxi/uploads/pdf/Received_Bookings_Dispacter.pdf",
            //   function (err, success) {
            //     if (err) {
            //       console.log("err ", err);
            //       return res.sendToEncode({
            //         status: 400,
            //         message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            //       });
            //     } else {
            //       return res.sendToEncode({
            //         status_code: 200,
            //         message: message.SUCCESS,
            //         URL: API_URL + "uploads/pdf/Received_Bookings_Dispacter.pdf",
            //       });
            //     }
            //   }
            // );
          }
        );
      },
      getAllAcceptedBookingdDispacterPDF: function (req, res) {
        async.waterfall(
          [
            /** get All Accepted Bookingd Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "accepted" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllAcceptedBookingdDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllAcceptedBookingdDispacter = AllAcceptedBookingdDispacter;
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
              message: message.SUCCESS,
              data: response,
            });
    
            // create and save excel and send excel file name with path in response
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            var html =
              "<html>" +
              "<head>" +
              "</head>" +
              "<body>" +
              "<center><h1>Accepted Booking Dispacter</h1></center>" +
              '<center><table border="1">' +
              "  <tr>" +
              "    <th>SR.NO.</th>" +
              "    <th>Ride ID</th>" +
              "    <th>Customer</th>" +
              "    <th>Phone</th>" +
              "    <th>From</th>" +
              "    <th>To</th>" +
              "    <th>Driver</th>" +
              "    <th>Phone</th>" +
              "    <th>Amount</th>" +
              "    <th>Date</th>" +
              "  </tr>";
    
            for (var i = 0; i < jsonObj.AllAcceptedBookingdDispacter.length; i++) {
              html +=
                "  <tr>" +
                "    <td>" +
                i +
                1 +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].rideId +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].passengerName +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].passengerPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].pickupAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].destinationAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].driverName +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].driverPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].toatlFare +
                "</td>" +
                "    <td>" +
                jsonObj.AllAcceptedBookingdDispacter[i].createdAt +
                "</td>" +
                "  </tr>";
            }
    
            html += "</table></center>" + "</body>" + "</html>";
    
            htmlToPdf.convertHTMLString(
              html,
              "Accepted_Booking_Dispacter.pdf",
              function (err, success) {
                console.log("err : ", err);
                console.log("success : ", success);
                if (err) {
                  return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  return res.sendToEncode({
                    status_code: 200,
                    message: message.SUCCESS,
                    URL: API_URL + "uploads/pdf/Accepted_Booking_Dispacter.pdf",
                  });
                }
              }
            );
          }
        );
      },
      getAllOnRideDispacterPDF: function (req, res) {
        async.waterfall(
          [
            /** get All OnRide Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "onRide" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(aggregateQuery, (err, AllOnRideDispacter) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  let responseData = {};
                  responseData.AllOnRideDispacter = AllOnRideDispacter;
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
              message: message.SUCCESS,
              data: response,
            });
    
            // create and save excel and send excel file name with path in response
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            var html =
              "<html>" +
              "<head>" +
              "</head>" +
              "<body>" +
              "<center><h1>OnRide Dispacter</h1></center>" +
              '<center><table border="1">' +
              "  <tr>" +
              "    <th>SR.NO.</th>" +
              "    <th>Ride ID</th>" +
              "    <th>Customer</th>" +
              "    <th>Phone</th>" +
              "    <th>From</th>" +
              "    <th>To</th>" +
              "    <th>Driver</th>" +
              "    <th>Phone</th>" +
              "    <th>Amount</th>" +
              "    <th>Date</th>" +
              "  </tr>";
    
            for (var i = 0; i < jsonObj.AllOnRideDispacter.length; i++) {
              html +=
                "  <tr>" +
                "    <td>" +
                i +
                1 +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].rideId +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].passengerName +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].passengerPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].pickupAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].destinationAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].driverName +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].driverPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].toatlFare +
                "</td>" +
                "    <td>" +
                jsonObj.AllOnRideDispacter[i].createdAt +
                "</td>" +
                "  </tr>";
            }
    
            html += "</table></center>" + "</body>" + "</html>";
    
            htmltopdf1.createFromHtml(
              "<html><h1>html</h1></html>",
              "pdfName.pdf",
              function (err, success) {
                console.log("err 1 : ", err);
                console.log("Success 1 : ", success);
              }
            );
    
            // htmlToPdf.convertHTMLString(
            //   html,
            //   "./uploads/pdf/OnRide_Dispacter.pdf",
            //   function (err, success) {
            //     if (err) {
            //       return res.sendToEncode({
            //         status: 400,
            //         message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            //       });
            //     } else {
            //       return res.sendToEncode({
            //         status_code: 200,
            //         message: message.SUCCESS,
            //         URL: API_URL + "uploads/pdf/OnRide_Dispacter.pdf",
            //       });
            //     }
            //   }
            // );
          }
        );
      },
      getAllSuccessfulTripsDispacterPDF: function (req, res) {
        async.waterfall(
          [
            /** get All Successful Trips Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "completed" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                  passengerId: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllSuccessfulTripsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllSuccessfulTripsDispacter = AllSuccessfulTripsDispacter;
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
              message: message.SUCCESS,
              data: response,
            });
    
            // create and save excel and send excel file name with path in response
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            var html =
              "<html>" +
              "<head>" +
              "</head>" +
              "<body>" +
              "<center><h1>Successful Trips Dispacter</h1></center>" +
              '<center><table border="1">' +
              "  <tr>" +
              "    <th>SR.NO.</th>" +
              "    <th>Ride ID</th>" +
              "    <th>Customer</th>" +
              "    <th>Phone</th>" +
              "    <th>From</th>" +
              "    <th>To</th>" +
              "    <th>Driver</th>" +
              "    <th>Phone</th>" +
              "    <th>Amount</th>" +
              "    <th>Date</th>" +
              "  </tr>";
    
            for (var i = 0; i < jsonObj.AllSuccessfulTripsDispacter.length; i++) {
              html +=
                "  <tr>" +
                "    <td>" +
                i +
                1 +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].rideId +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].passengerName +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].passengerPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].pickupAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].destinationAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].driverName +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].driverPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].toatlFare +
                "</td>" +
                "    <td>" +
                jsonObj.AllSuccessfulTripsDispacter[i].createdAt +
                "</td>" +
                "  </tr>";
            }
    
            html += "</table></center>" + "</body>" + "</html>";
    
            htmlToPdf.convertHTMLString(
              html,
              "./uploads/pdf/Successful_Trips_Dispacter.pdf",
              function (err, success) {
                if (err) {
                  return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  return res.sendToEncode({
                    status_code: 200,
                    message: message.SUCCESS,
                    URL: API_URL + "uploads/pdf/Successful_Trips_Dispacter.pdf",
                  });
                }
              }
            );
          }
        );
      },
      getAllCancleBookingsDispacterPDF: function (req, res) {
        async.waterfall(
          [
            /** get All Cancle Bookings Dispacter*/
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "cancelled" } });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  driverId: 1,
                  destinationAddress: 1,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "driverId",
                  foreignField: "_id",
                  as: "driverData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$driverData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  "driverData.phoneNumber": 1,
                  "driverData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  driverName: "$driverData.name",
                  driverPhone: "$driverData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  driverData: 0,
                },
              });
    
              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "passengerId",
                  foreignField: "_id",
                  as: "passengerData",
                },
              });
    
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerData",
                  preserveNullAndEmptyArrays: true,
                },
              });
    
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  rideId: 1,
                  passengerId: 1,
                  pickupAddress: 1,
                  createdAt: 1,
                  totalFare: 1,
                  destinationAddress: 1,
                  driverName: 1,
                  driverPhone: 1,
                  "passengerData.phoneNumber": 1,
                  "passengerData.name": 1,
                },
              });
    
              aggregateQuery.push({
                $addFields: {
                  passengerName: "$passengerData.name",
                  passengerPhone: "$passengerData.phoneNumber",
                },
              });
    
              aggregateQuery.push({
                $project: {
                  passengerData: 0,
                },
              });
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, AllCancleBookingsDispacter) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let responseData = {};
                    responseData.AllCancleBookingsDispacter = AllCancleBookingsDispacter;
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
              message: message.SUCCESS,
              data: response,
            });
    
            // create and save excel and send excel file name with path in response
    
            var data = JSON.stringify(response);
            var jsonObj = JSON.parse(data);
    
            var html =
              "<html>" +
              "<head>" +
              "</head>" +
              "<body>" +
              "<center><h1>Cancle Bookings Dispacter</h1></center>" +
              '<center><table border="1">' +
              "  <tr>" +
              "    <th>SR.NO.</th>" +
              "    <th>Ride ID</th>" +
              "    <th>Customer</th>" +
              "    <th>Phone</th>" +
              "    <th>From</th>" +
              "    <th>To</th>" +
              "    <th>Driver</th>" +
              "    <th>Phone</th>" +
              "    <th>Amount</th>" +
              "    <th>Date</th>" +
              "  </tr>";
    
            for (var i = 0; i < jsonObj.AllCancleBookingsDispacter.length; i++) {
              html +=
                "  <tr>" +
                "    <td>" +
                i +
                1 +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].rideId +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].passengerName +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].passengerPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].pickupAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].destinationAddress +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].driverName +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].driverPhone +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].toatlFare +
                "</td>" +
                "    <td>" +
                jsonObj.AllCancleBookingsDispacter[i].createdAt +
                "</td>" +
                "  </tr>";
            }
    
            html += "</table></center>" + "</body>" + "</html>";
    
            htmlToPdf.convertHTMLString(
              html,
              "./uploads/pdf/Cancle_Bookings_Dispacter.pdf",
              function (err, success) {
                if (err) {
                  return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  return res.sendToEncode({
                    status_code: 200,
                    message: message.SUCCESS,
                    URL: API_URL + "uploads/pdf/Cancle_Bookings_Dispacter.pdf",
                  });
                }
              }
            );
          }
        );
      }, 
      getWeeklyReceivedBookingsCount: function (req, res) {
        async.waterfall(
          [
            /** get Weekly Received Bookings Count */
            function (nextCall) {
              let aggregateQuery = [];
    
              aggregateQuery.push({ $match: { status: "received" } });
    
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
    
              RideSchema.aggregate(
                aggregateQuery,
                (err, WeeklyReceivedBookingsCount) => {
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
    
                    for (var i = 0; i < WeeklyReceivedBookingsCount.length; i++) {
                      for (var j = 0; j < perWeek.length; j++) {
                        if (perWeek[j].week == WeeklyReceivedBookingsCount[i]._id) {
                          perWeek[j].count = WeeklyReceivedBookingsCount[i].count;
                        }
                      }
                    }
    
                    var weeks = [];
                    for (var i = 0; i < perWeek.length; i++) {
                      weeks.push({ week: i + 1, count: perWeek[i].count });
                    }
                    responseData.WeeklyReceivedBookingsCount = weeks;
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
              message: message.GET_WEEKLY_RECEIVED_BOOKING_COUNT_DATA_SUCC,
              data: response,
            });
          }
        );
      },
       getMonthlyAcceptedBookingsCount: function (req, res) {
    async.waterfall(
      [
        /** get Monthly Accepted Bookings Count*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { status: "accepted" } });

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

          RideSchema.aggregate(
            aggregateQuery,
            (err, MonthlyAcceptedBookingsCount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.MonthlyAcceptedBookingsCount = MonthlyAcceptedBookingsCount;
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
          message: message.GET_MONTHLY_ACCEPTED_BOOKING_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  },

  getWeeklyAcceptedBookingsCount: function (req, res) {
    async.waterfall(
      [
        /** get Weekly Accepted Bookings Count */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { status: "accepted" } });

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

          RideSchema.aggregate(
            aggregateQuery,
            (err, WeeklyAcceptedBookingsCount) => {
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

                for (var i = 0; i < WeeklyAcceptedBookingsCount.length; i++) {
                  for (var j = 0; j < perWeek.length; j++) {
                    if (perWeek[j].week == WeeklyAcceptedBookingsCount[i]._id) {
                      perWeek[j].count = WeeklyAcceptedBookingsCount[i].count;
                    }
                  }
                }

                var weeks = [];
                for (var i = 0; i < perWeek.length; i++) {
                  weeks.push({ week: i + 1, count: perWeek[i].count });
                }
                responseData.WeeklyAcceptedBookingsCount = weeks;
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
          message: message.GET_WEEKLY_ACCEPTED_BOOKING_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  },   
  getMonthlySuccessfulTripsCount: function (req, res) {
    async.waterfall(
      [
        /** get Monthly Successful Trips Count*/
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

          RideSchema.aggregate(
            aggregateQuery,
            (err, MonthlySuccessfulTripsCount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.MonthlySuccessfulTripsCount = MonthlySuccessfulTripsCount;
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
          message: message.GET_MONTHLY_SUCCESSFUL_TRIP_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  },

  getWeeklySuccessfulTripsCount: function (req, res) {
    async.waterfall(
      [
        /** get Weekly Successful Trips Count */
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

          RideSchema.aggregate(
            aggregateQuery,
            (err, WeeklySuccessfulTripsCount) => {
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

                for (var i = 0; i < WeeklySuccessfulTripsCount.length; i++) {
                  for (var j = 0; j < perWeek.length; j++) {
                    if (perWeek[j].week == WeeklySuccessfulTripsCount[i]._id) {
                      perWeek[j].count = WeeklySuccessfulTripsCount[i].count;
                    }
                  }
                }

                var weeks = [];
                for (var i = 0; i < perWeek.length; i++) {
                  weeks.push({ week: i + 1, count: perWeek[i].count });
                }
                responseData.WeeklySuccessfulTripsCount = weeks;
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
          message: message.GET_WEEKLY_SUCCESSFUL_TRIP_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  },
getMonthlyCancleBookingsCount: function (req, res) {
    async.waterfall(
      [
        /** get Monthly Cancle Bookings Count */
        function (nextCall) {
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

          RideSchema.aggregate(
            aggregateQuery,
            (err, MonthlyCancleBookingsCount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.MonthlyCancleBookingsCount = MonthlyCancleBookingsCount;
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
          message: message.GET_MONTHLY_CANCLE_BOOKING_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  },

  getweeklyCancleBookingsCount: function (req, res) {
    async.waterfall(
      [
        /** get weekly Cancle Bookings Count */
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
            },
          });
          aggregateQuery.push({
            $group: {
              _id: { $week: "$createdAt" },
              count: { $sum: 1 },
            },
          });

          RideSchema.aggregate(
            aggregateQuery,
            (err, weeklyCancleBookingsCount) => {
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

                for (var i = 0; i < weeklyCancleBookingsCount.length; i++) {
                  for (var j = 0; j < perWeek.length; j++) {
                    if (perWeek[j].week == weeklyCancleBookingsCount[i]._id) {
                      perWeek[j].count = weeklyCancleBookingsCount[i].count;
                    }
                  }
                }

                var weeks = [];
                for (var i = 0; i < perWeek.length; i++) {
                  weeks.push({ week: i + 1, count: perWeek[i].count });
                }
                responseData.weeklyCancleBookingsCount = weeks;
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
          message: message.GET_WEEKLY_CANCLE_BOOKING_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  },
  getMonthlyReceivedBookingsCount: function (req, res) {
    async.waterfall(
      [
        /** get Monthly Received Bookings Count*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { status: "received" } });

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

          RideSchema.aggregate(
            aggregateQuery,
            (err, MonthlyReceivedBookingsCount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.MonthlyReceivedBookingsCount = MonthlyReceivedBookingsCount;
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
          message: message.GET_MONTHLY_RECEIVED_BOOKING_COUNT_DATA_SUCC,
          data: response,
        });
      }
    );
  }
};
module.exports = _self;
