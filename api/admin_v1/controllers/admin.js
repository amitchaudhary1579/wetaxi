var debug = require("debug")("x-code:v1:controllers:driver"),
  moment = require("moment"),
  jwt = require("jsonwebtoken"),
  async = require("async"),
  path = require("path"),
  _ = require("underscore"),
  config = rootRequire("config/global"),
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

// Create indexs required in HelpCenterSchema
HelpCenterSchema.collection.createIndex(
  {
    location: "2dsphere",
  },
  function (err, resp) {}
);

// Create indexs required in HelpCenterSchema
EmergencySchema.collection.createIndex(
  {
    location: "2dsphere",
  },
  function (err, resp) {}
);

var _self = {
  /**
   * :::Test Zone:::
   * all apis and function to test are placd here
   */
  test: function (req, res) {
    return res.sendToEncode({
      status_code: 200,
      message: "Success!",
      data: {
        Test: process.env.MONGO_URL,
      },
    });
  },

  /**
   * Common functions
   */
  getUniqueId: function (callback) {
    async.waterfall(
      [
        function (nextCall) {
          let randomString = Math.random()
            .toString(36)
            .substr(2, 5)
            .toUpperCase();
          UniqueCodeSchema.find({}).exec(function (err, getUniqueData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getUniqueData[0].uniqueID.indexOf(randomString) === -1) {
              let getUniqueArrayData = getUniqueData[0].uniqueID.push(
                randomString
              );
              let updateData = {
                uniqueID: getUniqueData[0].uniqueID,
              };
              UniqueCodeSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  nextCall(null, randomString);
                }
              );
            } else {
              _self.getUniqueId(function (err, response) {
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

  getPassengerAutoIncrement: function (callback) {
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
                    passengerAutoIncrement: Number(1),
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
              _self.getPassengerAutoIncrement(function (err, response) {
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

  getDriverAutoIncrement: function (callback) {
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
                    driverAutoIncrement: Number(1),
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
              _self.getDriverAutoIncrement(function (err, response) {
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

  getOperatorAutoIncrement: function (callback) {
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
                    operatorAutoIncrement: Number(1),
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
              _self.getOperatorAutoIncrement(function (err, response) {
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

  getRewardAutoIncrement: function (callback) {
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
                    rewardAutoIncrement: Number(1),
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
              _self.getRewardAutoIncrement(function (err, response) {
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

  getVehicleAutoIncrement: function (callback) {
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
                    vehicleAutoIncrement: Number(1),
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
              _self.getVehicleAutoIncrement(function (err, response) {
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

  getEmergencyAutoIncrement: function (callback) {
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
                    emergencyAutoIncrement: Number(1),
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
              _self.getEmergencyAutoIncrement(function (err, response) {
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

  getHelpCenterAutoIncrement: function (callback) {
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
                    helpCenterAutoIncrement: Number(1),
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
              _self.getHelpCenterAutoIncrement(function (err, response) {
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

  getNotificationLogsAutoIncrement: function (callback) {
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
                    notificationLogsAutoIncrement: Number(1),
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
              _self.getNotificationLogsAutoIncrement(function (err, response) {
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

  sendCancelRideRequestNotificationToDriver: (ride) => {
    async.waterfall(
      [
        function (nextCall) {
          _self.badgeCount(ride.driverId._id, (isDriver = true), function (
            err,
            badgeCount
          ) {
            if (err) {
              nextCall({ message: err });
            } else {
              badgeCount = badgeCount ? badgeCount + 1 : 1;
              nextCall(null, badgeCount);
            }
          });
        },
        function (badgeCount, nextCall) {
          let pushNotificationData = {
            to:
              (ride.driverId.deviceDetail &&
                ride.driverId.deviceDetail.token) ||
              "",
            type: "driver",
            data: {
              title: "",
              type: 3,
              body:
                ride.reasonText.en ||
                "This ride has been cancelled by the system.",
              badge: badgeCount,
              tag: "Ride",
              data: {
                rideId: ride._id,
              },
            },
          };

          pn.fcm(pushNotificationData, function (err, Success) {
            nextCall(null);
            // let notificationData = {
            //     title: pushNotificationData.data.body,
            //     receiver_type: 'driver',
            //     driverId: ride.driverId._id,
            //     rideId: ride._id
            // }
            // let Notification = new NotificationSchema(notificationData);
            // Notification.save((err, notification) => {
            //     if (err) {
            //         return nextCall({
            //             "message": message.SOMETHING_WENT_WRONG,
            //         });
            //     }
            //     nextCall(null)
            // })
          });
        },
      ],
      function (err, response) {
        // callback(null);
      }
    );
  },

  setDriverFree: (ride) => {
    async.waterfall(
      [
        function (nextCall) {
          DriverSchema.findOneAndUpdate(
            {
              _id: ride.driverId,
            },
            {
              isAvailable: true,
              isBusy: false,
              // isRideRequestSended: false
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
              nextCall(null, updateData.uniqueID);
            }
          );
        },
      ],
      function (err, response) {
        // callback(err, response);
      }
    );
  },

  decrypt: function (req, res) {
    res.send(ED.decrypt(req.body.text));
  },
  /**
   * Authentication apis
   */
  login: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          console.log("neW{Ass", ED.encrypt("12345678"));

          req.checkBody("email", message.EMAIL_REQUIRED).notEmpty();
          req.checkBody("email", message.EMAIL_NOT_VALID).isEmail();
          req.checkBody("password", message.PASSWORD_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** check credential is valid or not */
        function (body, nextCall) {
          AdminSchema.findOne({
            email: body.email,
            password: ED.encrypt(body.password),
          })
            .lean()
            .exec(function (err, admin) {
              console.log(admin);

              if (err) {
                return nextCall({
                  message: message.OOPS_SOMETHING_WRONG,
                });
              } else if (!admin) {
                return nextCall({
                  message: message.INVALID_CREDENTIALS,
                });
              } else {
                if (admin.isActive) {
                  nextCall(null, admin);
                } else {
                  return nextCall({
                    message: message.INACTIVE_ACCOUNT,
                  });
                }
              }
            });
        },
        /** create Access token for authorition of api after login */
        function (admin, nextCall) {
          var jwtData = {
            _id: admin._id,
            email: admin.email,
          };
          // create a token
          admin.access_token = jwt.sign(jwtData, config.secret, {
            expiresIn: 60 * 60 * 24, // expires in 24 hours
          });
          delete admin.password;
          _self.addActionLog(
            admin,
            log_message.SECTION.LOGIN,
            log_message.ACTION.LOGIN_ACTION +
              " " +
              admin.first_name +
              " " +
              admin.last_name
          );
          nextCall(null, admin);
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
          message: message.ADMIN_LOGIN_SUCCESS,
          data: response,
        });
      }
    );
  },

  /****************************
   * Change status of change password
   */
  changePasswordStatus: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          if (req.user.type !== "admin") {
            return nextCall({
              message:
                "Sorry!!! You don't have permission to update the status.",
            });
          } else {
            req.checkBody("operator_id", "Operator id is required.").notEmpty();
            req
              .checkBody(
                "change_password",
                "Can change password status is required."
              )
              .notEmpty();
            var error = req.validationErrors();
            if (error && error.length) {
              return nextCall({ message: error[0].msg });
            } else {
              nextCall(null, req.body);
            }
          }
        },
        function (body, nextCall) {
          AdminSchema.update(
            { _id: body.operator_id },
            { $set: { canChangePassword: body.change_password } },
            function (error, results) {
              if (error) {
                nextCall({ message: "Something went wrong." });
              } else {
                nextCall(null, {
                  status: 200,
                  message: "Change password status updated successfully.",
                });
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: (err && err.message) || "Oops! You could not be update.",
          });
        }
        res.status(200).sendToEncode(response);
      }
    );
  },

  /*************************
   * Change Password
   */
  changePassword: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req.checkBody("old_password", message.OLD_PASSWORD).notEmpty();
          req.checkBody("new_password", message.NEW_PASSWORD).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }

          var password = ED.encrypt(req.body.old_password);
          AdminSchema.findOne(
            { _id: req.user._id, canChangePassword: true },
            function (err, admin) {
              if (err) {
                return nextCall({
                  message:
                    "Sorry!!! Unable to update password please try again.",
                });
              }
              if (admin) {
                if (admin.password == password) {
                  return nextCall(null, admin);
                } else {
                  return nextCall({ message: "Incorrect password." });
                }
              } else {
                return nextCall({
                  message:
                    "Sorry!!! You don't have a permission for change password.",
                });
              }
            }
          );
        },
        function (admin, nextCall) {
          var newPassword = ED.encrypt(req.body.new_password);
          AdminSchema.update(
            { _id: admin._id },
            { $set: { password: newPassword } },
            { new: true },
            function (err, result) {
              if (err) {
                return nextCall({
                  message:
                    "Sorry!!! Unable to update password please try again.",
                });
              } else {
                nextCall(null, result);
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
          message: message.CHANGE_PASSWORD_SUCCESS,
        });
      }
    );
  },

  getAllCountries: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          var resopnseData = {};
          resopnseData.countryFlagUrl = CONSTANTS.COUNTRY_FLAGS_URL;
          // resopnseData.countries = CONSTANTS.COUNTRIES;
          CountiesSchema.find({}, function (err, countries) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (countries && countries.length) {
              resopnseData.countries = countries;
              nextCall(null, resopnseData);
            } else {
              resopnseData.countries = [];
              nextCall(null, resopnseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status_code: err.code ? err.code : 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            data: {},
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response,
        });
      }
    );
  },

  /**
   * Passenger Module
   */
  ListOfAllPassengers: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
          };
          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.order && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                uniqueID: regex,
              },
              {
                name: regex,
              },
              {
                email: regex,
              },
              {
                onlyPhoneNumber: regex,
              },
              {
                countryCode: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          PassengerSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          PassengerSchema.find(
            matchObj,
            {
              _id: 1,
              uniqueID: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              dob: 1,
              profilePhoto: 1,
              isBlocked: 1,
              createdAt: 1,
              autoIncrementID: 1,
              passengerLevel: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                // _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.LIST_ALL_PASSENGER)
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                passengerId: mongoose.Types.ObjectId(passenger._id),
                paymentStatus: true
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: "$passengerId",
                  passenger_id: {
                    $first: "$passenger_id",
                  },
                  totalRideEarning: {
                    $sum: "$totalFare"
                      },
                  tripCount: { 
                    $sum:1
                  }
                },
              });
              // stage 7
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  passenger_id: 1,
                  totalRideEarning: 1,
                  tripCount: 1
                },
              });
              // stage 8
              // aggregateQuery.push({
              //   $lookup: {
              //     from: "passenger_referral_earning_logs",
              //     localField: "passenger_id",
              //     foreignField: "beneficiaryPassengerId",
              //     as: "totalReferralEarning",
              //   },
              // });
              // // stage 9
              // aggregateQuery.push({
              //   $unwind: {
              //     path: "$totalReferralEarning",
              //     preserveNullAndEmptyArrays: true,
              //   },
              // });
              // // stage 10
              // aggregateQuery.push({
              //   $group: {
              //     _id: "$_id",
              //     passenger_id: {
              //       $first: "$passenger_id",
              //     },
              //     totalReferralEarning: {
              //       $sum: "$totalReferralEarning.referralAmount",
              //     },
              //     totalInvitedCount: {
              //       $first: "$totalInvitedCount",
              //     },
              //     totalRideEarning: {
              //       $sum: "$passengerCompletedRides.toatlFare",
              //     },
              //   },
              // });
              // // stage 11
              // aggregateQuery.push({
              //   $project: {
              //     _id: 1,
              //     passenger_id: 1,
              //     totalReferralEarning: 1,
              //     totalInvitedCount: 1,
              //     totalRideEarning: 1,
              //   },
              // });
              console.log('query', aggregateQuery);
              RideSchema.aggregate(
                aggregateQuery,
                (err, totalRefEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (totalRefEarning && totalRefEarning.length > 0) {
                      // passenger.totalReferralEarning =
                      //   totalRefEarning[0].totalReferralEarning;
                      // passenger.totalInvitedCount =
                      //   totalRefEarning[0].totalInvitedCount;
                      passenger.totalRideEarning =
                        totalRefEarning[0].totalRideEarning;
                        passenger.totalTripCount =
                        totalRefEarning[0].tripCount;  
                    } else {
                      passenger.totalTripCount=0;
                      passenger.totalRideEarning = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = passengers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },
  ListOfAllPassengersPDF: function (req, res) {
    var response = {
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
          };

          nextCall(null, matchObj);
        },
        function (matchObj, nextCall) {
          PassengerSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            nextCall(null, matchObj);
          });
        },
        function (matchObj, nextCall) {
          PassengerSchema.find(matchObj, {
            _id: 1,
            uniqueID: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            countryCode: 1,
            onlyPhoneNumber: 1,
            dob: 1,
            profilePhoto: 1,
            isBlocked: 1,
            createdAt: 1,
            autoIncrementID: 1,
            passengerLevel: 1,
          })
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                // _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.LIST_ALL_PASSENGER)
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  $or: [
                    {
                      level1Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level2Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level3Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level4Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level5Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                  ],
                },
              });
              // stage 2
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalInvitedCount: {
                    $sum: 1,
                  },
                },
              });
              // stage 3
              aggregateQuery.push({
                $addFields: {
                  passenger_id: mongoose.Types.ObjectId(passenger._id),
                },
              });
              // stage 4
              aggregateQuery.push({
                $lookup: {
                  from: "ride",
                  localField: "passenger_id",
                  foreignField: "passengerId",
                  as: "passengerCompletedRides",
                },
              });
              // stage 5
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerCompletedRides",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 6
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  passenger_id: {
                    $first: "$passenger_id",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $sum: {
                      $cond: {
                        if: {
                          $eq: ["passengerCompletedRides.paymentStatus", true],
                        },
                        then: "$passengerCompletedRides.toatlFare",
                        else: 0,
                      },
                    },
                  },
                },
              });
              // stage 7
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  passenger_id: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              // stage 8
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referral_earning_logs",
                  localField: "passenger_id",
                  foreignField: "beneficiaryPassengerId",
                  as: "totalReferralEarning",
                },
              });
              // stage 9
              aggregateQuery.push({
                $unwind: {
                  path: "$totalReferralEarning",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 10
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  passenger_id: {
                    $first: "$passenger_id",
                  },
                  totalReferralEarning: {
                    $sum: "$totalReferralEarning.referralAmount",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $sum: "$passengerCompletedRides.toatlFare",
                  },
                },
              });
              // stage 11
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  passenger_id: 1,
                  totalReferralEarning: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              PassengerReferralSchema.aggregate(
                aggregateQuery,
                (err, totalRefEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (totalRefEarning && totalRefEarning.length > 0) {
                      passenger.totalReferralEarning =
                        totalRefEarning[0].totalReferralEarning;
                      passenger.totalInvitedCount =
                        totalRefEarning[0].totalInvitedCount;
                      passenger.totalRideEarning =
                        totalRefEarning[0].totalRideEarning;
                    } else {
                      passenger.totalReferralEarning = 0;
                      passenger.totalInvitedCount = 0;
                      passenger.totalRideEarning = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = passengers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response.data,
        });

        var data = JSON.stringify(response.data);
        var jsonObj = JSON.parse(data);

        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>Passenger List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>uniqueID</th>" +
          "    <th>name</th>" +
          "    <th>phoneNumber</th>" +
          "    <th>onlyPhoneNumber</th>" +
          "    <th>email</th>" +
          "    <th>dob</th>" +
          "    <th>createdAt</th>" +
          "    <th>totalReferralEarning</th>" +
          "    <th>totalInvitedCount</th>" +
          "    <th>totalRideEarning</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].uniqueID +
            "</td>" +
            "    <td>" +
            jsonObj[i].name +
            "</td>" +
            "    <td>" +
            jsonObj[i].phoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj[i].onlyPhoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj[i].email +
            "</td>" +
            "    <td>" +
            jsonObj[i].dob +
            "</td>" +
            "    <td>" +
            jsonObj[i].createdAt +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalReferralEarning +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalInvitedCount +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalRideEarning +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Passenger.pdf",
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
                URL: API_URL + "uploads/pdf/Passenger.pdf",
              });
            }
          }
        );
      }
    );
  },
  ListOfAllPassengersExcel: function (req, res) {
    var response = {
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
          };

          nextCall(null, matchObj);
        },
        function (matchObj, nextCall) {
          PassengerSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            nextCall(null, matchObj);
          });
        },
        function (matchObj, nextCall) {
          PassengerSchema.find(matchObj, {
            _id: 1,
            uniqueID: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            countryCode: 1,
            onlyPhoneNumber: 1,
            dob: 1,
            profilePhoto: 1,
            isBlocked: 1,
            createdAt: 1,
            autoIncrementID: 1,
            passengerLevel: 1,
          })
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                // _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.LIST_ALL_PASSENGER)
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  $or: [
                    {
                      level1Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level2Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level3Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level4Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level5Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                  ],
                },
              });
              // stage 2
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalInvitedCount: {
                    $sum: 1,
                  },
                },
              });
              // stage 3
              aggregateQuery.push({
                $addFields: {
                  passenger_id: mongoose.Types.ObjectId(passenger._id),
                },
              });
              // stage 4
              aggregateQuery.push({
                $lookup: {
                  from: "ride",
                  localField: "passenger_id",
                  foreignField: "passengerId",
                  as: "passengerCompletedRides",
                },
              });
              // stage 5
              aggregateQuery.push({
                $unwind: {
                  path: "$passengerCompletedRides",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 6
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  passenger_id: {
                    $first: "$passenger_id",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $sum: {
                      $cond: {
                        if: {
                          $eq: ["passengerCompletedRides.paymentStatus", true],
                        },
                        then: "$passengerCompletedRides.toatlFare",
                        else: 0,
                      },
                    },
                  },
                },
              });
              // stage 7
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  passenger_id: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              // stage 8
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referral_earning_logs",
                  localField: "passenger_id",
                  foreignField: "beneficiaryPassengerId",
                  as: "totalReferralEarning",
                },
              });
              // stage 9
              aggregateQuery.push({
                $unwind: {
                  path: "$totalReferralEarning",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 10
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  passenger_id: {
                    $first: "$passenger_id",
                  },
                  totalReferralEarning: {
                    $sum: "$totalReferralEarning.referralAmount",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $sum: "$passengerCompletedRides.toatlFare",
                  },
                },
              });
              // stage 11
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  passenger_id: 1,
                  totalReferralEarning: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              PassengerReferralSchema.aggregate(
                aggregateQuery,
                (err, totalRefEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (totalRefEarning && totalRefEarning.length > 0) {
                      passenger.totalReferralEarning =
                        totalRefEarning[0].totalReferralEarning;
                      passenger.totalInvitedCount =
                        totalRefEarning[0].totalInvitedCount;
                      passenger.totalRideEarning =
                        totalRefEarning[0].totalRideEarning;
                    } else {
                      passenger.totalReferralEarning = 0;
                      passenger.totalInvitedCount = 0;
                      passenger.totalRideEarning = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = passengers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "Passenger List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "uniqueID",
            type: "string",
          },
          {
            caption: "name",
            type: "string",
          },
          {
            caption: "phoneNumber",
            type: "string",
          },
          {
            caption: "onlyPhoneNumber",
            type: "string",
          },
          {
            caption: "email",
            type: "string",
          },
          {
            caption: "dob",
            type: "date",
          },
          {
            caption: "createdAt",
            type: "date",
          },
          {
            caption: "totalReferralEarning",
            type: "number",
          },
          {
            caption: "totalInvitedCount",
            type: "number",
          },
          {
            caption: "totalRideEarning",
            type: "number",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response.data);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].uniqueID,
            jsonObj[i].name,
            jsonObj[i].phoneNumber,
            jsonObj[i].onlyPhoneNumber,
            jsonObj[i].email,
            jsonObj[i].dob,
            jsonObj[i].createdAt,
            jsonObj[i].totalReferralEarning,
            jsonObj[i].totalInvitedCount,
            jsonObj[i].totalRideEarning,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "PassengerList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  addPassenger: function (req, res) {
    async.waterfall(
      [
        /** get formData */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          if (
            (fields && !fields.name) ||
            !fields.phoneNumber ||
            !fields.countryCode ||
            !fields.onlyPhoneNumber ||
            !fields.dob
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        /** check email and mobile no already registered or not */
        function (fields, files, nextCall) {
          PassengerSchema.findOne({
            phoneNumber: fields.phoneNumber,
            isDeleted: false,
            // $or: [{
            //     email: fields.email
            // }, {
            //     phoneNumber: fields.phoneNumber
            // }]
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (passenger) {
              return nextCall({
                message: message.PASSENGER_ALREADY_REGISTERED,
              });
            } else {
              nextCall(null, fields, files);
            }
          });
        },
        /** upload profile picture */
        function (fields, files, nextCall) {
          if (files.profilePhoto) {
            // skip files except image files
            if (files.profilePhoto.type.indexOf("image") === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.profilePhoto.name);
            var filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + thumb_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.profilePhoto.path,
                    },
                    nextProc
                  );
                },
              ],
              function (err) {
                if (err) {
                  nextCall(err, fields);
                }
                fields.profilePhoto = filename;
                nextCall(null, fields);
              }
            );
          } else {
            fields.profilePhoto = "";
            nextCall(null, fields);
          }
        },
        /** get unique id */
        // function (fields, nextCall) {
        //     _self.getUniqueId(function (err, response) {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.SOMETHING_WENT_WRONG
        //             })
        //         }
        //         fields.uniqueID = 'P-' + response;
        //         nextCall(null, fields)
        //     });
        // },
        /** get passenger auto increment id */
        function (fields, nextCall) {
          _self.getPassengerAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }

            if (response.passengerAutoIncrement > 999999) {
              fields.uniqueID = "P-" + response.passengerAutoIncrement;
            } else {
              fields.uniqueID =
                "P-" + ("00000" + response.passengerAutoIncrement).slice(-6);
            }
            fields.autoIncrementID = response.passengerAutoIncrement;
            nextCall(null, fields);
          });
        },
        /** get language id */
        function (fields, nextCall) {
          LanguageSchema.findOne({
            code: CONSTANTS.DEFAULT_LANGUAGE,
          })
            .lean()
            .exec(function (err, language) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (!language) {
                return nextCall({
                  message: message.LANGUAGE_NOT_FOUND,
                });
              } else {
                fields.languageId = language._id;
                nextCall(null, fields);
              }
            });
        },
        function (fields, nextCall) {
          fields.referral_code = Math.random().toString(36).substring(8);
          let passenger = new PassengerSchema(fields);
          passenger.save(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.OOPS_SOMETHING_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.PASSENGER,
              log_message.ACTION.ADD_PASSENGER +
                ", PassengerId: " +
                passenger.autoIncrementID +
                ",  Name: " +
                passenger.name
            );
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.CREATE_PASSANGER_SUCC,
          data: {},
        });
      }
    );
  },

  getPassengerDetails: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.PASSENGER,
                log_message.ACTION.VIEW_PASSENGER +
                  ", PassengerId: " +
                  passenger.autoIncrementID +
                  ",  Name: " +
                  passenger.name
              );
              nextCall(null, passenger);
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
          message: message.GET_PASSENGER_DETAILS_SUCC,
          data: response,
        });
      }
    );
  },

  blockUnblockPassenger: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, passenger);
            }
          });
        },
        /** update user block status */
        function (body, passenger, nextCall) {
          PassengerSchema.update(
            {
              _id: mongoose.Types.ObjectId(body.passenger_id),
            },
            {
              $set: {
                isBlocked: passenger.isBlocked ? false : true,
              },
            },
            function (err, updateData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.PASSENGER,
                log_message.ACTION.BLOCK_UNBLOCK_PASSENGER
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.PASSENGER_ACTION_SUCC,
          data: {},
        });
      }
    );
  },

  editPassenger: function (req, res) {
    async.waterfall(
      [
        /** get formData */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          if (fields && !fields.passenger_id) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        /** get passenger details */
        function (fields, files, nextCall) {
          PassengerSchema.findOne({
            _id: fields.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              nextCall(null, fields, files, passenger);
            }
          });
        },
        /** check email and mobile no already registered or not */
        function (fields, files, passenger, nextCall) {
          PassengerSchema.findOne({
            _id: {
              $ne: fields.passenger_id,
            },
            phoneNumber: fields.phoneNumber,
            isDeleted: false,
            // $or: [{
            //     email: fields.email
            // }, {
            //     phoneNumber: fields.phoneNumber
            // }, ]
          }).exec(function (err, passengerData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (passengerData) {
              return nextCall({
                message: message.PASSENGER_ALREADY_REGISTERED,
              });
            } else {
              nextCall(null, fields, files, passenger);
            }
          });
        },
        /** upload profile picture */
        function (fields, files, passenger, nextCall) {
          if (files.profilePhoto) {
            // skip files except image files
            if (files.profilePhoto.type.indexOf("image") === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.profilePhoto.name);
            let filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + thumb_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.profilePhoto.path,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  // remove old large image\
                  if (passenger.profilePhoto != "") {
                    Uploader.remove(
                      {
                        filepath:
                          rootPath +
                          "/" +
                          CONSTANTS.PROFILE_PATH_LARGE +
                          passenger.profilePhoto,
                      },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
                function (nextProc) {
                  // remove old thumb image
                  if (passenger.profilePhoto != "") {
                    Uploader.remove(
                      {
                        filepath:
                          rootPath +
                          "/" +
                          CONSTANTS.PROFILE_PATH_THUMB +
                          passenger.profilePhoto,
                      },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
              ],
              function (err) {
                if (err) {
                  nextCall(err, fields);
                }
                fields.profilePhoto = filename;
                nextCall(null, fields, passenger);
              }
            );
          } else {
            fields.profilePhoto = passenger.profilePhoto;
            nextCall(null, fields, passenger);
          }
        },
        /** update passenger data */
        function (fields, passenger, nextCall) {
          let updateData = {
            name: fields.name ? fields.name : passenger.name,
            email: fields.email,
            phoneNumber: fields.phoneNumber
              ? fields.phoneNumber
              : passenger.phoneNumber,
            countryCode: fields.countryCode
              ? fields.countryCode
              : passenger.countryCode,
            onlyPhoneNumber: fields.onlyPhoneNumber
              ? fields.onlyPhoneNumber
              : passenger.onlyPhoneNumber,
            dob: fields.dob ? fields.dob : passenger.dob,
            currentLocation : fields.currentLocation,
            profilePhoto: fields.profilePhoto,
            gender: fields.gender ? fields.gender : passenger.gender
          };

          PassengerSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(fields.passenger_id),
            },
            {
              $set: updateData,
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
              _self.addActionLog(
                req.user,
                log_message.SECTION.PASSENGER,
                log_message.ACTION.UPDATE_PASSENGER +
                  ", PassengerId: " +
                  updateData.autoIncrementID +
                  ",  Name: " +
                  updateData.name
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.PASSENGER_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  deletePassenger: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              PassengerSchema.findOne({
                _id: mongoose.Types.ObjectId(body.id),
              }).exec(function (err, data) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                // saveRecycle(subject, token, tableName, recordId)
                saveRecycle(
                  "Delete: Passenger, Name : " + data._doc.name,
                  req.headers["authorization"],
                  "passenger",
                  data._doc._id
                );
              });
              nextCall(null, body, passenger);
            }
          });
        },
        /** update user delete status */
        function (body, passenger, nextCall) {
          PassengerSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.passenger_id),
            },
            {
              $set: {
                isDeleted: true,
              },
            },
            function (err, deleteData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              // if (passenger.profilePhoto != '') {
              //     /** remove passenger profile photo */
              //     Uploader.remove({
              //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
              //     });

              //     Uploader.remove({
              //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
              //     });
              // }
              _self.addActionLog(
                req.user,
                log_message.SECTION.PASSENGER,
                log_message.ACTION.DELETE_PASSENGER +
                  ", Passenger Id: " +
                  passenger.autoIncrementID +
                  ",  Name: " +
                  passenger.name
              );
              nextCall(null);
            }
          );
        },
        /** update user delete status */
        // function (body, passenger, nextCall) {
        //     PassengerSchema.remove({
        //         "_id": mongoose.Types.ObjectId(body.passenger_id)
        //     },
        //         function (err, deleteData) {
        //             if (err) {
        //                 return nextCall({
        //                     "message": message.SOMETHING_WENT_WRONG
        //                 });
        //             }
        //             if (passenger.profilePhoto != '') {
        //                 /** remove passenger profile photo */
        //                 Uploader.remove({
        //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
        //                 });

        //                 Uploader.remove({
        //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
        //                 });
        //             }
        //             _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.DELETE_PASSENGER + ", Passenger Id: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
        //             nextCall(null);
        //         });
        // }
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.PASSENGER_DELETED_SUCC,
          data: {},
        });
      }
    );
  },

  /**
   * Driver Module
   */
  getAllVehicleTypes: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let resopnseData = {};
          resopnseData.vehicleTypeUrl = CONSTANTS.VEHICLE_TYPE_URL;
          VehicleTypeSchema.find({}, function (err, v) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (v && v.length) {
              resopnseData.vehicleType = v;
              nextCall(null, resopnseData);
            } else {
              resopnseData.vehicleType = [];
              nextCall(null, resopnseData);
            }
          });
        },
        function (resopnseData, nextCall) {
          VehicleColorSchema.find({}, function (err, c) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (c && c.length) {
              resopnseData.colors = c;
              nextCall(null, resopnseData);
            } else {
              resopnseData.colors = [];
              nextCall(null, resopnseData);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status_code: err.code ? err.code : 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            data: {},
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response,
        });
      }
    );
  },

  ListOfAllDrivers: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
          };
          // first check that user is promoter if it is promoter then add match conditon
          if(req.user.type=='promoter'){
            matchObj.addedBy = ObjectId(req.user._id); 
          } else if(req.body.promoterId && req.body.promoterId!= null && req.body.promoterId!= undefined){
            matchObj.addedBy = ObjectId(req.body.promoterId); 
          }  
          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }
          if (req.body.isVerified) {
            matchObj.isVerified = true;
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                uniqueID: regex,
              },
              {
                phoneNumber: regex,
              },
              {
                email: regex,
              },
              {
                name: regex,
              },
              {
                countryCode: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          console.log(matchObj);
          DriverSchema.find(
            matchObj,
            {
              _id: 1,
              uniqueID: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              dob: 1,
              isBlocked: 1,
              isVerified: 1,
              profilePhoto: 1,
              createdAt: 1,
              verifiedDate: 1,
              autoIncrementID: 1,
              creditBalance: 1,
              avgRating: 1,
              verifiedBy: 1,
              driverLevel: 1,
              status: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .populate("verifiedBy")
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                driverId: mongoose.Types.ObjectId(driver._id),
                paymentStatus: true
                }
              });
              aggregateQuery.push({
                $group: {
                  _id: "$driverId",
                  driverId: {
                    $first: "$driverId",
                  },
                  totalRideEarning: {
                    $sum: "$driverCommission"
                      },
                  tripCount: { 
                    $sum:1
                  }
                },
              });
              // stage 7
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  driverId: 1,
                  totalRideEarning: 1,
                  tripCount: 1
                },
              });
              RideSchema.aggregate(
                aggregateQuery,
                (err, totalRefEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (totalRefEarning && totalRefEarning.length > 0) {
                      driver.totalTripCount =
                        totalRefEarning[0].tripCount;
                      driver.totalRideEarning =
                        totalRefEarning[0].totalRideEarning;
                    } else {
                      driver.totalTripCount = 0;
                      driver.totalRideEarning = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = drivers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },
// need to change add drivers
  addDriver: function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          fields.creditBy = req.user._id;
          if (
            (fields && !fields.name) ||
            !fields.phoneNumber ||
            !fields.dob ||
            !fields.drivingNumber 
            // !fields.typeId ||
            // !fields.year ||
            // !fields.seats ||
            // !fields.color ||
            // !fields.model ||
            // !fields.isAcAvailable ||
            // !fields.isSmokingAllowed ||
            // !fields.platNumber
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        /** check email and mobile no already registered or not */
        function (fields, files, nextCall) {
          console.log('herer in chck number', fields);
          DriverSchema.findOne({
            phoneNumber: fields.phoneNumber,
            isDeleted: false,
            // $or: [{
            //     email: fields.email
            // }, {
            //     phoneNumber: fields.phoneNumber
            // }]
          }).exec(function (err, driver) {
            console.log('err 1',err);
            if (err) {
            
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (driver) {
              return nextCall({
                message: message.DRIVER_ALREADY_REGISTERED,
              });
            } else {
              nextCall(null, fields, files);
            }
          });
        },
        /** upload profile picture */
        function (fields, files, nextCall) {
          if (files.profilePhoto) {
            // skip files except image files
            if (files.profilePhoto.type.indexOf("image") === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.profilePhoto.name);
            var filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + thumb_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.profilePhoto.path,
                    },
                    nextProc
                  );
                },
              ],
              function (err) {
                if (err) {
                  nextCall(err, fields, files);
                }
                fields.profilePhoto = filename;
                nextCall(null, fields, files);
              }
            );
          } else {
            fields.profilePhoto = "";
            nextCall(null, fields, files);
          }
        },
        /** upload id photos */
        function (fields, files, nextCall) {
          if (files.idPhotos) {
            if (!(files.idPhotos.length > 0)) {
              let a = [];
              a.push(files.idPhotos);
              files.idPhotos = a;
            }
            async.mapSeries(
              Object.keys(files.idPhotos),
              function (k, nextFile) {
                // skip files except image files
                if (files.idPhotos[k].type.indexOf("image") === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.idPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload(
                        {
                          // upload thumb file
                          src: files.idPhotos[k].path,
                          dst: rootPath + "/" + thumb_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload(
                        {
                          // upload large file
                          src: files.idPhotos[k].path,
                          dst: rootPath + "/" + large_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove(
                        {
                          filepath: files.idPhotos[k].path,
                        },
                        nextProc
                      );
                    },
                  ],
                  function (err) {
                    if (err) {
                      nextFile(err, filename);
                    }
                    nextFile(null, filename);
                  }
                );
              },
              function (err, idPhotosName) {
                fields.idPhotos = idPhotosName;
                nextCall(null, fields, files);
              }
            );
          } else {
            fields.idPhotos = [];
            nextCall(null, fields, files);
          }
        },
        /** upload vehicle photos */
        // function(fields, files, nextCall) {
        //   if (files.vehiclePhotos) {
        //     if (!(files.vehiclePhotos.length > 0)) {
        //       let a = [];
        //       a.push(files.vehiclePhotos);
        //       files.vehiclePhotos = a;
        //     }
        //     async.mapSeries(
        //       Object.keys(files.vehiclePhotos),
        //       function(k, nextFile) {
        //         // skip files except image files
        //         if (files.vehiclePhotos[k].type.indexOf("image") === -1) {
        //           return nextFile(null, null);
        //         }

        //         var extension = path.extname(files.vehiclePhotos[k].name);
        //         var filename = DS.getTime() + extension;
        //         let thumb_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
        //         let large_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

        //         async.series(
        //           [
        //             function(nextProc) {
        //               Uploader.thumbUpload(
        //                 {
        //                   // upload thumb file
        //                   src: files.vehiclePhotos[k].path,
        //                   dst: rootPath + "/" + thumb_image
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function(nextProc) {
        //               Uploader.largeUpload(
        //                 {
        //                   // upload large file
        //                   src: files.vehiclePhotos[k].path,
        //                   dst: rootPath + "/" + large_image
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function(nextProc) {
        //               Uploader.remove(
        //                 {
        //                   filepath: files.vehiclePhotos[k].path
        //                 },
        //                 nextProc
        //               );
        //             }
        //           ],
        //           function(err) {
        //             if (err) {
        //               nextFile(err, filename);
        //             }
        //             nextFile(null, filename);
        //           }
        //         );
        //       },
        //       function(err, vehiclePhotosName) {
        //         fields.vehiclePhotos = vehiclePhotosName;
        //         nextCall(null, fields, files);
        //       }
        //     );
        //   } else {
        //     fields.vehiclePhotos = [];
        //     nextCall(null, fields, files);
        //   }
        // },
        /** upload vehicle id photos */
        function (fields, files, nextCall) {
          if (files.vehicleIdPhotos) {
            if (!(files.vehicleIdPhotos.length > 0)) {
              let a = [];
              a.push(files.vehicleIdPhotos);
              files.vehicleIdPhotos = a;
            }
            async.mapSeries(
              Object.keys(files.vehicleIdPhotos),
              function (k, nextFile) {
                // skip files except image files
                if (files.vehicleIdPhotos[k].type.indexOf("image") === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.vehicleIdPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image =
                  CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                let large_image =
                  CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload(
                        {
                          // upload thumb file
                          src: files.vehicleIdPhotos[k].path,
                          dst: rootPath + "/" + thumb_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload(
                        {
                          // upload large file
                          src: files.vehicleIdPhotos[k].path,
                          dst: rootPath + "/" + large_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove(
                        {
                          filepath: files.vehicleIdPhotos[k].path,
                        },
                        nextProc
                      );
                    },
                  ],
                  function (err) {
                    if (err) {
                      nextFile(err, filename);
                    }
                    nextFile(null, filename);
                  }
                );
              },
              function (err, vehicleIdPhotosName) {
                fields.vehicleIdPhotos = vehicleIdPhotosName;
                nextCall(null, fields, files);
              }
            );
          } else {
            fields.vehicleIdPhotos = [];
            nextCall(null, fields, files);
          }
        },
        /** upload plate number photos */
        function (fields, files, nextCall) {
          if (files.plateNoPhotos) {
            if (!(files.plateNoPhotos.length > 0)) {
              let a = [];
              a.push(files.plateNoPhotos);
              files.plateNoPhotos = a;
            }
            async.mapSeries(
              Object.keys(files.plateNoPhotos),
              function (k, nextFile) {
                // skip files except image files
                if (files.plateNoPhotos[k].type.indexOf("image") === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.plateNoPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image =
                  CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                let large_image =
                  CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload(
                        {
                          // upload thumb file
                          src: files.plateNoPhotos[k].path,
                          dst: rootPath + "/" + thumb_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload(
                        {
                          // upload large file
                          src: files.plateNoPhotos[k].path,
                          dst: rootPath + "/" + large_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove(
                        {
                          filepath: files.plateNoPhotos[k].path,
                        },
                        nextProc
                      );
                    },
                  ],
                  function (err) {
                    if (err) {
                      nextFile(err, filename);
                    }
                    nextFile(null, filename);
                  }
                );
              },
              function (err, plateNumberPhotosName) {
                fields.plateNoPhotos = plateNumberPhotosName;
                nextCall(null, fields);
              }
            );
          } else {
            fields.plateNoPhotos = [];
            nextCall(null, fields);
          }
        },
        /** get vehicle type */
        // function (fields, nextCall) {
        //   VehicleTypeSchema.findOne({
        //     _id: fields.typeId,
        //   }).exec(function (err, vehicleType) {
        //     if (err) {
        //       return nextCall({
        //         message: message.SOMETHING_WENT_WRONG,
        //       });
        //     } else if (!vehicleType) {
        //       return nextCall({
        //         message: message.VEHICLE_NOT_FOUND,
        //       });
        //     } else {
        //       fields.vehicleType = vehicleType.type.en.charAt(0);
        //       nextCall(null, fields);
        //     }
        //   });
        // },
        /** get driver auto increment id */
        function (fields, nextCall) {
          _self.getDriverAutoIncrement(function (err, response) {
            if (err) {
              console.log('err 2',err);
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            fields.autoIncrementID = response.driverAutoIncrement;
            nextCall(null, fields);
          });
        },
        /** unique id for driver */
        function (fields, nextCall) {
          // _self.getUniqueId(function (err, response) {
          //     if (err) {
          //         return nextCall({
          //             "message": message.SOMETHING_WENT_WRONG
          //         })
          //     }
          //     fields.uniqueID = fields.vehicleType + '-' + response;
          //     nextCall(null, fields)
          // });

          var year = new Date().getFullYear().toString().substr(-2);
          var newuniqueId = year + "0000" + fields.autoIncrementID;
          fields.uniqueID = newuniqueId;

          UniqueCodeSchema.find({}).exec(function (err, getUniqueData) {
            console.log('err 3',err);
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getUniqueData[0].uniqueID.indexOf(newuniqueId) === -1) {
              let getUniqueArrayData = getUniqueData[0].uniqueID.push(
                newuniqueId
              );
              let updateData = {
                uniqueID: getUniqueData[0].uniqueID,
              };
              UniqueCodeSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  nextCall(null, fields);
                }
              );
            } else {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
          });
        },
        /** get language id */
        function (fields, nextCall) {
          LanguageSchema.findOne({
            code: CONSTANTS.DEFAULT_LANGUAGE,
          })
            .lean()
            .exec(function (err, language) {
              console.log('err 1',err);
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (!language) {
                return nextCall({
                  message: message.LANGUAGE_NOT_FOUND,
                });
              } else {
                fields.languageId = language._id;
                nextCall(null, fields);
              }
            });
        },
        /** insert data into driver collection */
        function (fields, nextCall) {
          // let vehicleData = {
          //   typeId: fields.typeId,
          //   year: fields.year,
          //   seats: fields.seats,
          //   color: fields.color,
          //   model: fields.model,
          //   isAcAvailable: fields.isAcAvailable,
          //   isSmokingAllowed: fields.isSmokingAllowed,
          //   // vehiclePhotos: fields.vehiclePhotos,
          //   vehicleIdPhotos: fields.vehicleIdPhotos,
          //   plateNoPhotos: fields.plateNoPhotos,
          //   platNumber: fields.platNumber,
          // };

          let driverData = {
            uniqueID: fields.uniqueID,
            name: fields.name,
            email: fields.email,
            dob: fields.dob,
            gender: fields.gender,
            currentLocation: fields.currentLocation,
            uplineCode: fields.uplineCode,
            phoneNumber: fields.phoneNumber,
            countryCode: fields.countryCode,
            onlyPhoneNumber: fields.onlyPhoneNumber,
            profilePhoto: fields.profilePhoto,
            idPhotos: fields.idPhotos,
            drivingLicence: fields.drivingNumber,  // new
            addedBy: req.user._id, // new
            // vehicle: vehicleData,
            referralCode: Math.random().toString(36).substring(8),
            languageId: fields.languageId,
            autoIncrementID: fields.autoIncrementID,
          };
          let driver = new DriverSchema(driverData);
          driver.save(function (err, driverData) {
            if (err) {
              console.log('err 1',err);
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.DRIVER,
              log_message.ACTION.ADD_DRIVER +
                ", DriverId: " +
                driverData.autoIncrementID +
                ",  Name: " +
                driverData.name
            );
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_CREATE_SUCCESS,
          data: {},
        });
      }
    );
  },

  getDriverDetails: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          })
            // .populate("vehicle.typeId")
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (!driver) {
                return nextCall({
                  message: message.DRIVER_NOT_FOUND,
                });
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.DRIVER,
                  log_message.ACTION.VIEW_DRIVER +
                    ", DriverId: " +
                    driver.autoIncrementID +
                    ",  Name: " +
                    driver.name
                );
                nextCall(null, driver);
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
          message: message.GET_DRIVER_DETAILS_SUCC,
          data: response,
        });
      }
    );
  },

  blockUnblockDriver: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, driver);
            }
          });
        },
        /** update user block status */
        function (body, driver, nextCall) {
          DriverSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.driver_id),
            },
            {
              $set: {
                isBlocked: driver.isBlocked ? false : true,
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
              let action = "unblocked";
              if (updateData.isBlocked) {
                action = "blocked";
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.DRIVER,
                log_message.ACTION.BLOCK_UNBLOCK_DRIVER +
                  action +
                  ", DriverId: " +
                  updateData.autoIncrementID +
                  ",  Name: " +
                  updateData.name
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_ACTION_SUCC,
          data: {},
        });
      }
    );
  },

  editDriver: function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          if (fields && !fields.driver_id) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        /** get driver details */
        function (fields, files, nextCall) {
          DriverSchema.findOne({
            _id: fields.driver_id,
          })
            .lean()
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (!driver) {
                return nextCall({
                  message: message.DRIVER_NOT_FOUND,
                });
              } else {
                nextCall(null, fields, files, driver);
              }
            });
        },
        /** check email and mobile no already registered or not */
        function (fields, files, driver, nextCall) {
          DriverSchema.findOne({
            _id: {
              $ne: fields.driver_id,
            },
            phoneNumber: fields.phoneNumber,
            isDeleted: false,
            // $or: [{
            //     email: fields.email
            // }, {
            //     phoneNumber: fields.phoneNumber
            // }]
          }).exec(function (err, driverData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (driverData) {
              return nextCall({
                message: message.DRIVER_ALREADY_REGISTERED,
              });
            } else {
              nextCall(null, fields, files, driver);
            }
          });
        },
        /** upload profile picture */
        function (fields, files, driver, nextCall) {
          if (files.profilePhoto) {
            // skip files except image files
            if (files.profilePhoto.type.indexOf("image") === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.profilePhoto.name);
            var filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + thumb_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.profilePhoto.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      // remove tmp image
                      filepath: files.profilePhoto.path,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  // remove old large image
                  if (driver.profilePhoto && driver.profilePhoto != "") {
                    Uploader.remove(
                      {
                        filepath:
                          rootPath +
                          "/" +
                          CONSTANTS.PROFILE_PATH_LARGE +
                          driver.profilePhoto,
                      },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
                function (nextProc) {
                  // remove old thumb image
                  if (driver.profilePhoto && driver.profilePhoto != "") {
                    Uploader.remove(
                      {
                        filepath:
                          rootPath +
                          "/" +
                          CONSTANTS.PROFILE_PATH_THUMB +
                          driver.profilePhoto,
                      },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
              ],
              function (err) {
                if (err) {
                  nextCall(err, fields, files, driver);
                }
                fields.profilePhoto = filename;
                nextCall(null, fields, files, driver);
              }
            );
          } else {
            fields.profilePhoto = driver.profilePhoto;
            nextCall(null, fields, files, driver);
          }
        },
        /** remove id photos */
        function (fields, files, driver, nextCall) {

          if (fields.removeIdPhotos) {
            if (
              fields.removeIdPhotos &&
              typeof fields.removeIdPhotos == "string"
            ) {
              fields.removeIdPhotos = JSON.parse(fields.removeIdPhotos);
            }
            async.mapSeries(
              fields.removeIdPhotos,
              function (k, nextFile) {
                if (k && k != "") {
                  /** remove image from server */
                  Uploader.remove({
                    filepath: rootPath + "/" + CONSTANTS.PROFILE_PATH_LARGE + k,
                  });

                  Uploader.remove({
                    filepath: rootPath + "/" + CONSTANTS.PROFILE_PATH_THUMB + k,
                  });
                }

                /** remove image name from id photos array */
                driver.idPhotos = driver.idPhotos.filter((item) => item !== k);
                nextFile(null);
              },
              function (err) {
                nextCall(null, fields, files, driver);
              }
            );
          } else {
            driver.idPhotos = driver.idPhotos;
            nextCall(null, fields, files, driver);
          }
        },
        /** upload id photos */
        function (fields, files, driver, nextCall) {
          if (files.idPhotos) {
            if (!(files.idPhotos.length > 0)) {
              let a = [];
              a.push(files.idPhotos);
              files.idPhotos = a;
            }
            async.mapSeries(
              Object.keys(files.idPhotos),
              function (k, nextFile) {
                // skip files except image files
                if (files.idPhotos[k].type.indexOf("image") === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.idPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload(
                        {
                          // upload thumb file
                          src: files.idPhotos[k].path,
                          dst: rootPath + "/" + thumb_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload(
                        {
                          // upload large file
                          src: files.idPhotos[k].path,
                          dst: rootPath + "/" + large_image,
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove(
                        {
                          filepath: files.idPhotos[k].path,
                        },
                        nextProc
                      );
                    },
                  ],
                  function (err) {
                    if (err) {
                      nextFile(err, filename);
                    }
                    nextFile(null, filename);
                  }
                );
              },
              function (err, idPhotosName) {
                driver.idPhotos = Object.assign(
                  driver.idPhotos.concat(idPhotosName)
                );
                nextCall(null, fields, driver);
              }
            );
          } else {
            nextCall(null, fields, driver);
          }
        },
        /** remove vehicle photos */
        // function(fields, files, driver, nextCall) {
        //   if (fields.removeVehiclePhotos.length > 0) {
        //     if (
        //       fields.removeVehiclePhotos &&
        //       typeof fields.removeVehiclePhotos == "string"
        //     ) {
        //       fields.removeVehiclePhotos = JSON.parse(
        //         fields.removeVehiclePhotos
        //       );
        //     }
        //     async.mapSeries(
        //       fields.removeVehiclePhotos,
        //       function(k, nextFile) {
        //         if (k && k != "") {
        //           /** remove image from server */
        //           Uploader.remove({
        //             filepath:
        //               rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //           });

        //           Uploader.remove({
        //             filepath:
        //               rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k
        //           });
        //         }

        //         /** remove image name from id photos array */
        //         driver.vehicle.vehiclePhotos = driver.vehicle.vehiclePhotos.filter(
        //           item => item !== k
        //         );
        //         nextFile(null);
        //       },
        //       function(err) {
        //         nextCall(null, fields, files, driver);
        //       }
        //     );
        //   } else {
        //     driver.vehicle.vehiclePhotos = driver.vehicle.vehiclePhotos;
        //     nextCall(null, fields, files, driver);
        //   }
        // },
        /** upload vehicle photos */
        // function(fields, files, driver, nextCall) {
        //   if (files.vehiclePhotos) {
        //     if (!(files.vehiclePhotos.length > 0)) {
        //       let a = [];
        //       a.push(files.vehiclePhotos);
        //       files.vehiclePhotos = a;
        //     }
        //     async.mapSeries(
        //       Object.keys(files.vehiclePhotos),
        //       function(k, nextFile) {
        //         // skip files except image files
        //         if (files.vehiclePhotos[k].type.indexOf("image") === -1) {
        //           return nextFile(null, null);
        //         }

        //         var extension = path.extname(files.vehiclePhotos[k].name);
        //         var filename = DS.getTime() + extension;
        //         let thumb_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
        //         let large_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

        //         async.series(
        //           [
        //             function(nextProc) {
        //               Uploader.thumbUpload(
        //                 {
        //                   // upload thumb file
        //                   src: files.vehiclePhotos[k].path,
        //                   dst: rootPath + "/" + thumb_image
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function(nextProc) {
        //               Uploader.largeUpload(
        //                 {
        //                   // upload large file
        //                   src: files.vehiclePhotos[k].path,
        //                   dst: rootPath + "/" + large_image
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function(nextProc) {
        //               Uploader.remove(
        //                 {
        //                   filepath: files.vehiclePhotos[k].path
        //                 },
        //                 nextProc
        //               );
        //             }
        //           ],
        //           function(err) {
        //             if (err) {
        //               nextFile(err, filename);
        //             }
        //             nextFile(null, filename);
        //           }
        //         );
        //       },
        //       function(err, vehiclePhotosName) {
        //         driver.vehicle.vehiclePhotos = Object.assign(
        //           driver.vehicle.vehiclePhotos.concat(vehiclePhotosName)
        //         );
        //         nextCall(null, fields, files, driver);
        //       }
        //     );
        //   } else {
        //     nextCall(null, fields, files, driver);
        //   }
        // },
        /** remove vehicle id photos */
        // function (fields, files, driver, nextCall) {
        //   if (fields.removeVehicleIdPhotos) {
        //     if (
        //       fields.removeVehicleIdPhotos &&
        //       typeof fields.removeVehicleIdPhotos == "string"
        //     ) {
        //       fields.removeVehicleIdPhotos = JSON.parse(
        //         fields.removeVehicleIdPhotos
        //       );
        //     }
        //     async.mapSeries(
        //       fields.removeVehicleIdPhotos,
        //       function (k, nextFile) {
        //         if (k && k != "") {
        //           /** remove image from server */
        //           Uploader.remove({
        //             filepath:
        //               rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
        //           });

        //           Uploader.remove({
        //             filepath:
        //               rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k,
        //           });
        //         }

        //         /** remove image name from id photos array */
        //         driver.vehicle.vehicleIdPhotos = driver.vehicle.vehicleIdPhotos.filter(
        //           (item) => item !== k
        //         );
        //         nextFile(null);
        //       },
        //       function (err) {
        //         nextCall(null, fields, files, driver);
        //       }
        //     );
        //   } else {
        //     driver.vehicle.vehicleIdPhotos = driver.vehicle.vehicleIdPhotos;
        //     nextCall(null, fields, files, driver);
        //   }
        // },
        /** upload vehicle id photos */
        // function (fields, files, driver, nextCall) {
        //   if (files.vehicleIdPhotos) {
        //     if (!(files.vehicleIdPhotos.length > 0)) {
        //       let a = [];
        //       a.push(files.vehicleIdPhotos);
        //       files.vehicleIdPhotos = a;
        //     }
        //     async.mapSeries(
        //       Object.keys(files.vehicleIdPhotos),
        //       function (k, nextFile) {
        //         // skip files except image files
        //         if (files.vehicleIdPhotos[k].type.indexOf("image") === -1) {
        //           return nextFile(null, null);
        //         }

        //         var extension = path.extname(files.vehicleIdPhotos[k].name);
        //         var filename = DS.getTime() + extension;
        //         let thumb_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
        //         let large_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

        //         async.series(
        //           [
        //             function (nextProc) {
        //               Uploader.thumbUpload(
        //                 {
        //                   // upload thumb file
        //                   src: files.vehicleIdPhotos[k].path,
        //                   dst: rootPath + "/" + thumb_image,
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function (nextProc) {
        //               Uploader.largeUpload(
        //                 {
        //                   // upload large file
        //                   src: files.vehicleIdPhotos[k].path,
        //                   dst: rootPath + "/" + large_image,
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function (nextProc) {
        //               Uploader.remove(
        //                 {
        //                   filepath: files.vehicleIdPhotos[k].path,
        //                 },
        //                 nextProc
        //               );
        //             },
        //           ],
        //           function (err) {
        //             if (err) {
        //               nextFile(err, filename);
        //             }
        //             nextFile(null, filename);
        //           }
        //         );
        //       },
        //       function (err, vehicleIdPhotosName) {
        //         driver.vehicle.vehicleIdPhotos = Object.assign(
        //           driver.vehicle.vehicleIdPhotos.concat(vehicleIdPhotosName)
        //         );
        //         nextCall(null, fields, files, driver);
        //       }
        //     );
        //   } else {
        //     nextCall(null, fields, files, driver);
        //   }
        // },
        /** remove plate number photos */
        // function (fields, files, driver, nextCall) {
        //   if (
        //     fields.removePlateNoPhotos &&
        //     fields.removePlateNoPhotos.length > 0
        //   ) {
        //     if (
        //       fields.removePlateNoPhotos &&
        //       typeof fields.removePlateNoPhotos == "string"
        //     ) {
        //       fields.removePlateNoPhotos = JSON.parse(
        //         fields.removePlateNoPhotos
        //       );
        //     }
        //     async.mapSeries(
        //       fields.removePlateNoPhotos,
        //       function (k, nextFile) {
        //         if (k && k != "") {
        //           /** remove image from server */
        //           Uploader.remove({
        //             filepath:
        //               rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
        //           });

        //           Uploader.remove({
        //             filepath:
        //               rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k,
        //           });
        //         }

        //         /** remove image name from id photos array */
        //         driver.vehicle.plateNoPhotos = driver.vehicle.plateNoPhotos.filter(
        //           (item) => item !== k
        //         );
        //         nextFile(null);
        //       },
        //       function (err) {
        //         nextCall(null, fields, files, driver);
        //       }
        //     );
        //   } else {
        //     driver.vehicle.plateNoPhotos = driver.vehicle.plateNoPhotos;
        //     nextCall(null, fields, files, driver);
        //   }
        // },
        // /** upload plate number photos */
        // function (fields, files, driver, nextCall) {
        //   if (files.plateNoPhotos) {
        //     if (!(files.plateNoPhotos.length > 0)) {
        //       let a = [];
        //       a.push(files.plateNoPhotos);
        //       files.plateNoPhotos = a;
        //     }
        //     async.mapSeries(
        //       Object.keys(files.plateNoPhotos),
        //       function (k, nextFile) {
        //         // skip files except image files
        //         if (files.plateNoPhotos[k].type.indexOf("image") === -1) {
        //           return nextFile(null, null);
        //         }

        //         var extension = path.extname(files.plateNoPhotos[k].name);
        //         var filename = DS.getTime() + extension;
        //         let thumb_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
        //         let large_image =
        //           CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

        //         async.series(
        //           [
        //             function (nextProc) {
        //               Uploader.thumbUpload(
        //                 {
        //                   // upload thumb file
        //                   src: files.plateNoPhotos[k].path,
        //                   dst: rootPath + "/" + thumb_image,
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function (nextProc) {
        //               Uploader.largeUpload(
        //                 {
        //                   // upload large file
        //                   src: files.plateNoPhotos[k].path,
        //                   dst: rootPath + "/" + large_image,
        //                 },
        //                 nextProc
        //               );
        //             },
        //             function (nextProc) {
        //               Uploader.remove(
        //                 {
        //                   filepath: files.plateNoPhotos[k].path,
        //                 },
        //                 nextProc
        //               );
        //             },
        //           ],
        //           function (err) {
        //             if (err) {
        //               nextFile(err, filename);
        //             }
        //             nextFile(null, filename);
        //           }
        //         );
        //       },
        //       function (err, plateNumberPhotosName) {
        //         driver.vehicle.plateNoPhotos = Object.assign(
        //           driver.vehicle.plateNoPhotos.concat(plateNumberPhotosName)
        //         );
        //         nextCall(null, fields, driver);
        //       }
        //     );
        //   } else {
        //     nextCall(null, fields, driver);
        //   }
        // },
        /** get vehicle type */
        // function (fields, driver, nextCall) {
        //   VehicleTypeSchema.findOne({
        //     _id: fields.typeId,
        //   }).exec(function (err, vehicleType) {
        //     if (err) {
        //       return nextCall({
        //         message: message.SOMETHING_WENT_WRONG,
        //       });
        //     } else if (!vehicleType) {
        //       return nextCall({
        //         message: message.VEHICLE_NOT_FOUND,
        //       });
        //     } else {
        //       let vehicleTypeChar = driver.uniqueID.split("-");
        //       fields.uniqueID =
        //         vehicleType.type.en.charAt(0) + "-" + vehicleTypeChar[1];
        //       nextCall(null, fields, driver);
        //     }
        //   });
        // },
        /** update data into driver collection */
        function (fields, driver, nextCall) {
          // let vehicleData = {
          //   typeId: fields.typeId ? fields.typeId : driver.vehicle.typeId,
          //   year: fields.year ? fields.year : driver.vehicle.year,
          //   seats: fields.seats ? fields.seats : driver.vehicle.seats,
          //   color: fields.color ? fields.color : driver.vehicle.color,
          //   model: fields.model ? fields.model : driver.vehicle.model,
          //   isAcAvailable: fields.isAcAvailable
          //     ? fields.isAcAvailable
          //     : driver.vehicle.isAcAvailable,
          //   isSmokingAllowed: fields.isSmokingAllowed
          //     ? fields.isSmokingAllowed
          //     : driver.vehicle.isSmokingAllowed,
          //   // vehiclePhotos: driver.vehicle.vehiclePhotos,
          //   vehicleIdPhotos: driver.vehicle.vehicleIdPhotos,
          //   plateNoPhotos: driver.vehicle.plateNoPhotos,
          //   platNumber: fields.platNumber
          //     ? fields.platNumber
          //     : driver.vehicle.platNumber,
          // };

          let updateDriverData = {
            // uniqueID: fields.uniqueID,
            name: fields.name ? fields.name : driver.name,
            email: fields.email,
            dob: fields.dob ? fields.dob : driver.dob,
            gender: fields.gender ? fields.gender : driver.gender,
            phoneNumber: fields.phoneNumber
              ? fields.phoneNumber
              : driver.phoneNumber,
            countryCode: fields.countryCode
              ? fields.countryCode
              : driver.countryCode,
            onlyPhoneNumber: fields.onlyPhoneNumber
              ? fields.onlyPhoneNumber
              : driver.onlyPhoneNumber,
            profilePhoto: fields.profilePhoto
              ? fields.profilePhoto
              : driver.profilePhoto,
            idPhotos: driver.idPhotos,
            drivingLicence: fields.drivingNumber ? fields.drivingNumber : driver.drivingLicence,  
            // vehicle: vehicleData,
          };

          DriverSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(fields.driver_id),
            },
            {
              $set: updateDriverData,
            },
            {
              new: true,
            },
            function (err, updateData) {
              if (err) {
                console.log(err); 
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
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
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  verifyUnverifyDriver: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          req.checkBody("admin_id", message.ADMIN_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get admin details */
        function (body, nextCall) {
          AdminSchema.findOne({
            _id: body.admin_id,
          }).exec(function (err, admin) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!admin) {
              return nextCall({
                message: message.ADMIN_NOT_FOUND,
              });
            } else {
              nextCall(null, body);
            }
          });
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, driver);
            }
          });
        },
        /** update user block status */
        function (body, driver, nextCall) {
          DriverSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.driver_id),
            },
            {
              $set: {
                isVerified: driver.isVerified ? false : true,
                verifiedBy: body.admin_id,
                verifiedDate: DS.now(),
              },
            },
            {
              new: true,
            }
          )
            .populate("languageId")
            .exec((err, driverUpdateData) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              nextCall(null, driverUpdateData);
            });
        },
        /** Badge Count of notification */
        function (driverUpdateData, nextCall) {
          _self.badgeCount(driverUpdateData._id, (isDriver = true), function (
            err,
            totalBadgeCount
          ) {
            if (err) {
              nextCall({ message: err });
            } else {
              totalBadgeCount = totalBadgeCount ? totalBadgeCount + 1 : 1;
              nextCall(null, driverUpdateData, totalBadgeCount);
            }
          });
        },
        function (driverUpdateData, totalBadgeCount, nextCall) {
          NotificationSchema.count(
            {
              driverId: driverUpdateData._id,
              type: "notification",
              isRead: false,
            },
            function (err, badgeCount) {
              if (err) {
                return nextCall({ message: err });
              } else {
                badgeCount = badgeCount ? badgeCount + 1 : 1;
                return nextCall(
                  null,
                  driverUpdateData,
                  totalBadgeCount,
                  badgeCount
                );
              }
            }
          );
        },
        /** Send notification */
        function (driverUpdateData, totalBadgeCount, badgeCount, nextCall) {
          if (driverUpdateData && driverUpdateData.isVerified) {
            let ADMIN_VERIFY_PROFILE;
            if (
              driverUpdateData &&
              driverUpdateData.languageId &&
              driverUpdateData.languageId.code == "km"
            ) {
              ADMIN_VERIFY_PROFILE = COMBODIA_MESSAGES["ADMIN_VERIFY_PROFILE"];
            } else if (
              driverUpdateData &&
              driverUpdateData.languageId &&
              driverUpdateData.languageId.code == "zh"
            ) {
              ADMIN_VERIFY_PROFILE = CHINESE_MESSAGES["ADMIN_VERIFY_PROFILE"];
            } else {
              ADMIN_VERIFY_PROFILE = message["ADMIN_VERIFY_PROFILE"];
            }

            let pushNotificationData = {
              to:
                (driverUpdateData.deviceDetail &&
                  driverUpdateData.deviceDetail.token) ||
                "",
              type: "driver",
              data: {
                title: "",
                type: 11,
                body: ADMIN_VERIFY_PROFILE,
                badge: totalBadgeCount,
                notificationBadgeCountData: {
                  notification: badgeCount,
                },
                tag: "Admin Verify",
                data: {},
              },
            };

            pn.fcm(pushNotificationData, function (err, Success) {
              let notificationData = {
                title: pushNotificationData.data.body,
                receiver_type: "driver",
                driverId: driverUpdateData._id,
              };
              let Notification = new NotificationSchema(notificationData);
              Notification.save((err, notification) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.DRIVER,
                  log_message.ACTION.VERIFY_DRIVER +
                    ", DriverId: " +
                    driverUpdateData.autoIncrementID +
                    ",  Name: " +
                    driverUpdateData.name
                );
                nextCall(null);
              });
            });
          } else {
            _self.addActionLog(
              req.user,
              log_message.SECTION.DRIVER,
              log_message.ACTION.UNVERIFY_DRIVER +
                ", DriverId: " +
                driverUpdateData.autoIncrementID +
                ",  Name: " +
                driverUpdateData.name
            );
            nextCall(null);
          }
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_ACTION_SUCC,
          data: {},
        });
      }
    );
  },

  deleteDriver: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              DriverSchema.findOne({
                _id: mongoose.Types.ObjectId(body.id),
              }).exec(function (err, data) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                // saveRecycle(subject, token, tableName, recordId)
                saveRecycle(
                  "Delete: Driver, Name : " + data._doc.name,
                  req.headers["authorization"],
                  "driver",
                  data._doc._id
                );
              });
              nextCall(null, body, driver);
            }
          });
        },
        /** update user delete status */
        function (body, driver, nextCall) {
          DriverSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.driver_id),
            },
            {
              $set: {
                isDeleted: true,
              },
            },
            function (err, deleteData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }

              // if (driver.profilePhoto && driver.profilePhoto != '') {
              //     /** delete driver profile image */
              //     Uploader.remove({
              //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
              //     });
              //     Uploader.remove({
              //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
              //     });
              // }

              /** remove id Photos */
              async.mapSeries(driver.idPhotos, function (k, nextFile) {
                if (k && k != "") {
                  /** remove image from server */
                  Uploader.remove({
                    filepath: rootPath + "/" + CONSTANTS.PROFILE_PATH_LARGE + k,
                  });

                  Uploader.remove({
                    filepath: rootPath + "/" + CONSTANTS.PROFILE_PATH_THUMB + k,
                  });
                }
                nextFile(null);
              });

              /** remove vehicle Photos */
              // async.mapSeries(driver.vehicle.vehiclePhotos, function(
              //   k,
              //   nextFile
              // ) {
              //   if (k && k != "") {
              //     /** remove image from server */
              //     Uploader.remove({
              //       filepath:
              //         rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
              //     });

              //     Uploader.remove({
              //       filepath:
              //         rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
              //     });
              //   }
              //   nextFile(null);
              // });

              /** remove vehicle id Photos */
              async.mapSeries(driver.vehicle.vehicleIdPhotos, function (
                k,
                nextFile
              ) {
                if (k && k != "") {
                  /** remove image from server */
                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
                  });

                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
                  });
                }

                nextFile(null);
              });

              /** remove plate number Photos */
              async.mapSeries(driver.vehicle.plateNoPhotos, function (
                k,
                nextFile
              ) {
                if (k && k != "") {
                  /** remove image from server */
                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
                  });

                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
                  });
                }
                nextFile(null);
              });

              _self.addActionLog(
                req.user,
                log_message.SECTION.DRIVER,
                log_message.ACTION.DELETE_DRIVER +
                  ", DriverId: " +
                  driver.autoIncrementID +
                  ",  Name: " +
                  driver.name
              );
              nextCall(null);
            }
          );
        },
        /** update user block status */
        // function (body, driver, nextCall) {
        //     DriverSchema.remove({
        //         "_id": mongoose.Types.ObjectId(body.driver_id)
        //     },
        //         function (err, deleteData) {
        //             if (err) {
        //                 return nextCall({
        //                     "message": message.SOMETHING_WENT_WRONG
        //                 });
        //             }

        //             if (driver.profilePhoto && driver.profilePhoto != '') {
        //                 /** delete driver profile image */
        //                 Uploader.remove({
        //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
        //                 });
        //                 Uploader.remove({
        //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
        //                 });
        //             }

        //             /** remove id Photos */
        //             async.mapSeries(driver.idPhotos, function (k, nextFile) {
        //                 if (k && k != '') {
        //                     /** remove image from server */
        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + k
        //                     });

        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + k
        //                     });
        //                 }
        //                 nextFile(null)
        //             });

        //             /** remove vehicle Photos */
        //             async.mapSeries(driver.vehicle.vehiclePhotos, function (k, nextFile) {
        //                 if (k && k != '') {
        //                     /** remove image from server */
        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //                     });

        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //                     });
        //                 }
        //                 nextFile(null)
        //             });

        //             /** remove vehicle id Photos */
        //             async.mapSeries(driver.vehicle.vehicleIdPhotos, function (k, nextFile) {
        //                 if (k && k != '') {
        //                     /** remove image from server */
        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //                     });

        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //                     });
        //                 }

        //                 nextFile(null)
        //             });

        //             /** remove plate number Photos */
        //             async.mapSeries(driver.vehicle.plateNoPhotos, function (k, nextFile) {
        //                 if (k && k != '') {
        //                     /** remove image from server */
        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //                     });

        //                     Uploader.remove({
        //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
        //                     });
        //                 }
        //                 nextFile(null)
        //             });

        //             _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.DELETE_DRIVER + ", DriverId: " + driver.autoIncrementID + ",  Name: " + driver.name)
        //             nextCall(null);
        //         });
        // }
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_DELETED_SUCC,
          data: {},
        });
      }
    );
  },

  updateBillingPlan: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          req.checkBody("billingId", message.BILLING_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              nextCall(null, body);
            }
          });
        },
        /** get billing plan details */
        function (body, nextCall) {
          BillingPlansSchema.findOne({
            _id: body.billingId,
          }).exec(function (err, billingPlan) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!billingPlan) {
              return nextCall({
                message: message.BILLING_PLAN_NOT_FOUND,
              });
            } else {
              nextCall(null, body, billingPlan);
            }
          });
        },

        /** update driver billing plan */
        function (body, billingPlan, nextCall) {
          let updateData;
          if (billingPlan && billingPlan.type == "commercial_plan") {
            updateData = {
              $set: {
                billingId: billingPlan._id,
              },
              $inc: {
                creditBalance: -Number(billingPlan.chargeAmt),
              },
            };
          } else {
            updateData = {
              $set: {
                billingId: billingPlan._id,
              },
            };
          }
          DriverSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.driver_id),
            },
            updateData,
            {
              new: true,
            }
          )
            .populate("billingId")
            .populate("languageId")
            .exec(function (err, driverUpdateData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              nextCall(null, driverUpdateData, billingPlan);
            });
        },
        /** insert data into wallet logs */
        function (driverUpdateData, billingPlan, nextCall) {
          if (billingPlan && billingPlan.type == "commercial_plan") {
            let insertData = {
              driverId: driverUpdateData._id,
              type: "billing_plan_withdraw",
              amount: Number(billingPlan.chargeAmt),
              creditBy: req.user._id,
            };

            let wallet = new WalletLogsSchema(insertData);
            wallet.save(function (err, insertedData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              nextCall(null, driverUpdateData);
            });
          } else {
            nextCall(null, driverUpdateData);
          }
        },
        /** Badge Count of notification */
        function (driverUpdateData, nextCall) {
          _self.badgeCount(driverUpdateData._id, (isDriver = true), function (
            err,
            totalBadgeCount
          ) {
            if (err) {
              nextCall({ message: err });
            } else {
              totalBadgeCount = totalBadgeCount ? totalBadgeCount + 1 : 1;
              nextCall(null, driverUpdateData, totalBadgeCount);
            }
          });
        },
        /** Badge Count of notification */
        function (driverUpdateData, totalBadgeCount, nextCall) {
          NotificationSchema.count(
            {
              driverId: driverUpdateData._id,
              type: "billing_plan",
              isRead: false,
            },
            function (err, badgeCount) {
              if (err) {
                return nextCall({ message: err });
              } else {
                badgeCount = badgeCount ? badgeCount + 1 : 1;
                return nextCall(
                  null,
                  driverUpdateData,
                  totalBadgeCount,
                  badgeCount
                );
              }
            }
          );
        },
        /** Send notification */
        function (driverUpdateData, totalBadgeCount, badgeCount, nextCall) {
          let BILLING_PLAN_UPDATE_SUCC;
          if (
            driverUpdateData &&
            driverUpdateData.languageId &&
            driverUpdateData.languageId.code == "km"
          ) {
            BILLING_PLAN_UPDATE_SUCC =
              COMBODIA_MESSAGES["BILLING_PLAN_UPDATE_SUCC"];
          } else if (
            driverUpdateData &&
            driverUpdateData.languageId &&
            driverUpdateData.languageId.code == "zh"
          ) {
            BILLING_PLAN_UPDATE_SUCC =
              CHINESE_MESSAGES["BILLING_PLAN_UPDATE_SUCC"];
          } else {
            BILLING_PLAN_UPDATE_SUCC = message["BILLING_PLAN_UPDATE_SUCC"];
          }

          let pushNotificationData = {
            to:
              (driverUpdateData.deviceDetail &&
                driverUpdateData.deviceDetail.token) ||
              "",
            type: "driver",
            data: {
              title: "",
              type: 12,
              body: BILLING_PLAN_UPDATE_SUCC,
              badge: totalBadgeCount,
              notificationBadgeCountData: {
                billing_plan: badgeCount,
              },
              tag: "Billing Plan",
              data: {},
            },
          };

          pn.fcm(pushNotificationData, function (err, Success) {
            let notificationData = {
              title: pushNotificationData.data.body,
              receiver_type: "driver",
              type: "billing_plan",
              driverId: driverUpdateData._id,
              billingId: driverUpdateData.billingId._id,
              bilingAmount: driverUpdateData.billingId.chargeAmt,
            };
            let Notification = new NotificationSchema(notificationData);
            Notification.save((err, notification) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.DRIVER,
                log_message.ACTION.UPDATE_BILLING_PLAN +
                  ", DriverId: " +
                  driverUpdateData.autoIncrementID +
                  ",  Name: " +
                  driverUpdateData.name
              );
              nextCall(null);
            });
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_BILLING_PLAN_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  // help center module start
  ListOfAllHelpCenters: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                email: regex,
              },
              {
                phoneNumber: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          HelpCenterSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          HelpCenterSchema.find(
            matchObj,
            {
              _id: 1,
              email: 1,
              phoneNumber: 1,
              autoIncrementID: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                response.data = poiUsers;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  getHelpCenterDetails: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody("help_center_id", message.HELP_CENTER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** check help center exist or not */
        function (body, nextCall) {
          HelpCenterSchema.findOne({
            _id: body.help_center_id,
          }).exec(function (err, helpCenter) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!helpCenter) {
              return nextCall({
                message: message.HELP_CENTER_NOT_FOUND,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.HELP_CENTER,
                log_message.ACTION.VIEW_HELP_CENTER + helpCenter.email
              );
              nextCall(null, helpCenter);
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
          message: message.GET_HELP_CENTER_SUCC,
          data: response,
        });
      }
    );
  },

  addHelpCenter: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req.checkBody("phoneNumber", message.PHONE_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        // /** check phone number is already exist or not */
        // function (body, nextCall) {
        //     HelpCenterSchema.findOne({
        //         phoneNumber: body.phoneNumber
        //     }).lean().exec(function (err, emergency) {
        //         if (err) {
        //             return nextCall({
        //                 "message": message.OOPS_SOMETHING_WRONG
        //             })
        //         } else if (emergency) {
        //             return nextCall({
        //                 "message": message.HELP_CENTER_ALREADY_REGISTERED
        //             })
        //         } else {
        //             nextCall(null, body)
        //         }
        //     });
        // },
        /** get emergency auto increment id */
        function (body, nextCall) {
          _self.getHelpCenterAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            body.autoIncrementID = response.helpCenterAutoIncrement;
            nextCall(null, body);
          });
        },
        /** register helpCenter */
        function (body, nextCall) {
          let helpCenter = new HelpCenterSchema(body);
          helpCenter.save(function (err, insertData) {
            if (err) {
              return nextCall({
                message: message.OOPS_SOMETHING_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.HELP_CENTER,
              log_message.ACTION.ADD_HELP_CENTER +
                ", HelpCenterId: " +
                insertData.autoIncrementID +
                ", Number: " +
                insertData.phoneNumber
            );
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.HELP_CENTER_ADD_SUCC,
          data: {},
        });
      }
    );
  },

  editHelpCenter: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody("help_center_id", message.HELP_CENTER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get help center details */
        function (body, nextCall) {
          HelpCenterSchema.findOne({
            _id: body.help_center_id,
          }).exec(function (err, helpCenter) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!helpCenter) {
              return nextCall({
                message: message.HELP_CENTER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, helpCenter);
            }
          });
        },
        /** update help center data */
        function (body, helpCenter, nextCall) {
          let updateData = {
            email: body.email ? body.email : helpCenter.email,
            phoneNumber: body.phoneNumber
              ? body.phoneNumber
              : helpCenter.phoneNumber,
          };
          HelpCenterSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.help_center_id),
            },
            {
              $set: updateData,
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
              _self.addActionLog(
                req.user,
                log_message.SECTION.HELP_CENTER,
                log_message.ACTION.UPDATE_HELP_CENTER + updateData.email
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.HELP_CENTER_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  deleteHelpCenter: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody("help_center_id", message.HELP_CENTER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get help center details */
        function (body, nextCall) {
          HelpCenterSchema.findOne({
            _id: body.help_center_id,
          }).exec(function (err, helpCenter) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!helpCenter) {
              return nextCall({
                message: message.HELP_CENTER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, helpCenter);
            }
          });
        },
        /** delete help center */
        function (body, helpCenter, nextCall) {
          HelpCenterSchema.remove(
            {
              _id: mongoose.Types.ObjectId(body.help_center_id),
            },
            function (err, deleteData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.HELP_CENTER,
                log_message.ACTION.DELETE_HELP_CENTER + helpCenter.phoneNumber
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.HELP_CENTER_DELETE_SUCC,
          data: {},
        });
      }
    );
  },
// help center module end 
 // emergency module start
 ListOfAllEmergencies: function (req, res) {
  var response = {
    draw: req.body.draw,
    recordsTotal: 0,
    recordsFiltered: 0,
    data: [],
  };
  async.waterfall(
    [
      function (nextCall) {
        var matchObj = {};
        var sort = {};
        if (req.body.order && req.body.order.length > 0) {
          req.body.order = req.body.order[0];
          sort[req.body.columns[req.body.order.column].data] =
            req.body.order.dir === "asc" ? 1 : -1;
        }
        if (req.body.search && req.body.search.value) {
          var search_value = req.body.search.value;
          var regex = new RegExp(search_value, "i");
          var or = [
            {
              phoneNumber: regex,
            },
          ];
          matchObj.$or = or;
        }
        nextCall(null, matchObj, sort);
      },
      function (matchObj, sort, nextCall) {
        EmergencySchema.count(matchObj, function (err, count) {
          if (err) {
            return nextCall({
              code: 400,
              status: 0,
              message: message.NO_DATA_FOUND,
            });
          }
          response.recordsTotal = count;
          response.recordsFiltered = count;
          nextCall(null, matchObj, sort);
        });
      },
      function (matchObj, sort, nextCall) {
        EmergencySchema.find(
          matchObj,
          {
            _id: 1,
            phoneNumber: 1,
            autoIncrementID: 1,
          },
          {
            limit: Number(req.body.length),
            skip: Number(req.body.start),
          }
        )
          .sort(sort)
          .lean()
          .exec(function (err, poiUsers) {
            if (err) {
              return nextCall({
                error: err,
                status_code: 0,
                message: message.SOMETHING_WENT_WRONG,
                error: err,
              });
            } else if (poiUsers.length > 0) {
              response.data = poiUsers;
              nextCall();
            } else {
              nextCall();
            }
          });
      },
    ],
    function (err) {
      if (err) {
        return res.sendToEncode(err);
      }
      res.sendToEncode(response);
    }
  );
},

addEmergency: function (req, res) {
  async.waterfall(
    [
      /** chek required parameters */
      function (nextCall) {
        req.checkBody("phoneNumber", message.PHONE_REQUIRED).notEmpty();
        var error = req.validationErrors();
        if (error && error.length) {
          return nextCall({
            message: error[0].msg,
          });
        }
        nextCall(null, req.body);
      },
      /** check phone number is already exist or not */
      // function (body, nextCall) {
      //     EmergencySchema.findOne({
      //         phoneNumber: body.phoneNumber
      //     }).lean().exec(function (err, emergency) {
      //         if (err) {
      //             return nextCall({
      //                 "message": message.OOPS_SOMETHING_WRONG
      //             })
      //         } else if (emergency) {
      //             return nextCall({
      //                 "message": message.EMERGENCY_ALREADY_EXIST
      //             })
      //         } else {
      //             nextCall(null, body)
      //         }
      //     });
      // },
      /** get emergency auto increment id */
      function (body, nextCall) {
        _self.getEmergencyAutoIncrement(function (err, response) {
          if (err) {
            return nextCall({
              message: message.SOMETHING_WENT_WRONG,
            });
          }
          body.autoIncrementID = response.emergencyAutoIncrement;
          nextCall(null, body);
        });
      },
      /** register emergency */
      function (body, nextCall) {
        body.location = {};
        body.location.index = "2dsphere";
        body.location.type = "Point";
        body.location.coordinates = [
          Number(body.longitude),
          Number(body.latitude),
        ];
        let emergency = new EmergencySchema(body);
        emergency.save(function (err, insertData) {
          if (err) {
            return nextCall({
              message: message.OOPS_SOMETHING_WRONG,
            });
          }
          _self.addActionLog(
            req.user,
            log_message.SECTION.EMERGENCY,
            log_message.ACTION.ADD_EMERGENCY +
              ", EmergencyId: " +
              insertData.autoIncrementID +
              ", Number: " +
              insertData.phoneNumber
          );
          nextCall(null);
        });
      },
    ],
    function (err) {
      if (err) {
        return res.sendToEncode({
          status: 400,
          message: (err && err.message) || message.SOMETHING_WENT_WRONG,
        });
      }

      return res.sendToEncode({
        status_code: 200,
        message: message.EMERGENCY_CREATE_SUCCESS,
        data: {},
      });
    }
  );
},

getEmergencyDetails: function (req, res) {
  async.waterfall(
    [
      /** chek required parameters */
      function (nextCall) {
        req
          .checkBody("emergency_id", message.EMERGENCY_ID_REQUIRED)
          .notEmpty();
        var error = req.validationErrors();
        if (error && error.length) {
          return nextCall({
            message: error[0].msg,
          });
        }
        nextCall(null, req.body);
      },
      /** check emergency exist or not */
      function (body, nextCall) {
        EmergencySchema.findOne({
          _id: body.emergency_id,
        }).exec(function (err, emergency) {
          if (err) {
            return nextCall({
              message: message.SOMETHING_WENT_WRONG,
            });
          } else if (!emergency) {
            return nextCall({
              message: message.EMERGENCY_NOT_FOUND,
            });
          } else {
            _self.addActionLog(
              req.user,
              log_message.SECTION.EMERGENCY,
              log_message.ACTION.VIEW_EMERGENCY +
                ", EmergencyId: " +
                emergency.autoIncrementID +
                ", Number: " +
                emergency.phoneNumber
            );
            nextCall(null, emergency);
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
        message: message.GET_EMERGENCY_SUCC,
        data: response,
      });
    }
  );
},

editEmergency: function (req, res) {
  async.waterfall(
    [
      /** chek required parameters */
      function (nextCall) {
        req
          .checkBody("emergency_id", message.EMERGENCY_ID_REQUIRED)
          .notEmpty();
        var error = req.validationErrors();
        if (error && error.length) {
          return nextCall({
            message: error[0].msg,
          });
        }
        nextCall(null, req.body);
      },
      // /** check mobile no already registered or not */
      // function (body, nextCall) {
      //     EmergencySchema.findOne({
      //         _id: {
      //             $ne: body.emergency_id
      //         },
      //         phoneNumber: body.phoneNumber
      //     }).exec(function (err, emergencyData) {
      //         if (err) {
      //             return nextCall({
      //                 "message": message.SOMETHING_WENT_WRONG
      //             })
      //         } else if (emergencyData) {
      //             return nextCall({
      //                 "message": message.EMERGENCY_ALREADY_EXIST
      //             })
      //         } else {
      //             nextCall(null, body)
      //         }
      //     })
      // },
      /** get emergency details */
      function (body, nextCall) {
        EmergencySchema.findOne({
          _id: body.emergency_id,
        }).exec(function (err, emergency) {
          if (err) {
            return nextCall({
              message: message.SOMETHING_WENT_WRONG,
            });
          } else if (!emergency) {
            return nextCall({
              message: message.EMERGENCY_NOT_FOUND,
            });
          } else {
            nextCall(null, body, emergency);
          }
        });
      },
      /** update emergency data */
      function (body, emergency, nextCall) {
        let updateData = {
          phoneNumber: body.phoneNumber
            ? body.phoneNumber
            : emergency.phoneNumber,
        };

        if (body.latitude && body.longitude) {
          updateData.location = {};
          updateData.location.index = "2dsphere";
          updateData.location.type = "Point";
          updateData.location.coordinates = [
            Number(body.longitude) || Number(emergency.longitude),
            Number(body.latitude) || Number(emergency.latitude),
          ];
        }
        EmergencySchema.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(body.emergency_id),
          },
          {
            $set: updateData,
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
            _self.addActionLog(
              req.user,
              log_message.SECTION.EMERGENCY,
              log_message.ACTION.UPDATE_EMERGENCY +
                ", EmergencyId: " +
                updateData.autoIncrementID +
                ", Number: " +
                updateData.phoneNumber
            );
            nextCall(null);
          }
        );
      },
    ],
    function (err) {
      if (err) {
        return res.sendToEncode({
          status: 400,
          message: (err && err.message) || message.SOMETHING_WENT_WRONG,
        });
      }

      return res.sendToEncode({
        status_code: 200,
        message: message.EMERGENCY_UPDATE_SUCC,
        data: {},
      });
    }
  );
},

deleteEmergency: function (req, res) {
  async.waterfall(
    [
      /** check required paremeters */
      function (nextCall) {
        req
          .checkBody("emergency_id", message.EMERGENCY_ID_REQUIRED)
          .notEmpty();
        var error = req.validationErrors();
        if (error && error.length) {
          return nextCall({
            message: error[0].msg,
          });
        }
        nextCall(null, req.body);
      },
      /** get emergency details */
      function (body, nextCall) {
        EmergencySchema.findOne({
          _id: body.emergency_id,
        }).exec(function (err, emergency) {
          if (err) {
            return nextCall({
              message: message.SOMETHING_WENT_WRONG,
            });
          } else if (!emergency) {
            return nextCall({
              message: message.EMERGENCY_NOT_FOUND,
            });
          } else {
            nextCall(null, body, emergency);
          }
        });
      },
      /** remove emergency */
      function (body, emergency, nextCall) {
        EmergencySchema.remove(
          {
            _id: mongoose.Types.ObjectId(body.emergency_id),
          },
          function (err, deleteData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.EMERGENCY,
              log_message.ACTION.DELETE_EMERGENCY +
                ", EmergencyId: " +
                emergency.autoIncrementID +
                ", Number: " +
                emergency.phoneNumber
            );
            nextCall(null);
          }
        );
      },
    ],
    function (err) {
      if (err) {
        return res.sendToEncode({
          status: 400,
          message: (err && err.message) || message.SOMETHING_WENT_WRONG,
        });
      }
      return res.sendToEncode({
        status_code: 200,
        message: message.EMERGENCY_DELETE_SUCC,
        data: {},
      });
    }
  );
},

  // Promocode API Start
  getPromotionList: function (req, res) {
    var matchObj = {};
    async.waterfall(
      [
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false } });
          matchObj.isDeleted = false;

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ promotionCodeType: re }, { code: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          PromoCodeSchema.aggregate(aggregateQuery, (err, AllPromocode) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllPromocode = AllPromocode;
              nextCall(null, responseData);
            }
          });
        },
        function (response, nextCall) {
          PromoCodeSchema.count(matchObj, function (err, count) {
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
          message: message.PROMOTION_CODE_SUCC,
          data: response,
        });
      }
    );
  },
  savePromoCode: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("type", message.PROMOTION_TYPE_REQUIRED).notEmpty();
          req
            .checkBody("startDate", message.PROMOTION_STARTDATE_REQUIRED)
            .notEmpty();
          req
            .checkBody("expireDate", message.PROMOTION_STARTDATE_REQUIRED)
            .notEmpty();
          req
            .checkBody("discount", message.ROMOTION_DISCOUNT_REQUIRED)
            .notEmpty();
          req
            .checkBody("promoCode", message.PROMOTION_CODE_REQUIRED)
            .notEmpty();
          req
            .checkBody("isActive", message.PROMOTION_ISACTIVE_REQUIRED)
            .notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          let newData = {};
          let saveNewPromoCode = {
            code: body.promoCode,
            promotionCodeType: body.type,
            startDate: new Date(
              body.startDate.year,
              body.startDate.day,
              body.startDate.month
            ),
            expireDate: new Date(
              body.expireDate.year,
              body.expireDate.day,
              body.expireDate.month
            ),
            discount: Number(body.discount),
            isActive: body.isActive,
          };

          let savePromoCode = new PromoCodeSchema(saveNewPromoCode);

          savePromoCode.save(function (err, insertedData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.PROMOTION_CODE,
              log_message.ACTION.ADD_PROMOCODE +
                ", Promocode Name : " +
                saveNewPromoCode.code
            );
            // Action end
            newData = {
              data: insertedData,
            };
            nextCall(null, newData);
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
          data: response,
          message: message.PROMOTIONCODE_ADDED,
        });
      }
    );
  },
  generatePromoCode: function (req, res) {
    async.waterfall([
      function (nextCall) {
        nextCall(null, req.body);
      },
      function (err, response) {
        if (err && err.length > 0) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        var result = "";
        var characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < 6; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
          );
        }
        var response = {
          promoCode: result,
        };
        console.log(response);
        return res.sendToEncode({
          status_code: 200,
          data: response,
        });
      },
    ]);
  },
  editPromotionCode: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req
            .checkBody("couponId", message.PROMOTION_COUPONID_REQUIRED)
            .notEmpty();
          req.checkBody("type", message.PROMOTION_TYPE_REQUIRED).notEmpty();
          req
            .checkBody("startDate", message.PROMOTION_STARTDATE_REQUIRED)
            .notEmpty();
          req
            .checkBody("expireDate", message.PROMOTION_STARTDATE_REQUIRED)
            .notEmpty();
          req
            .checkBody("discount", message.PROMOTION_DISCOUNT_REQUIRED)
            .notEmpty();
          req
            .checkBody("promoCode", message.PROMOTION_CODE_REQUIRED)
            .notEmpty();
          req
            .checkBody("isActive", message.PROMOTION_ISACTIVE_REQUIRED)
            .notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          var newData = {};
          PromoCodeSchema.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(body.couponId) },
            {
              promotionCodeType: body.type,
              code: body.promoCode,
              startDate: new Date(
                body.startDate.year,
                body.startDate.day,
                body.startDate.month
              ),
              expireDate: new Date(
                body.expireDate.year,
                body.expireDate.day,
                body.expireDate.month
              ),
              discount: Number(body.discount),
              isActive: body.isActive,
            },
            { new: true }
          ).exec(function (err, updatePromocode) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.PROMOTION_CODE,
              log_message.ACTION.EDIT_PROMOCODE +
                ", Promocode Name : " +
                body.promoCode
            );
            // Action end
            newData = {
              status_code: 200,
              message: message.PROMOTION_CODE_UPDATED,
              data: updatePromocode,
            };
            return nextCall(null, newData);
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
          data: response,
          message: message.PROMOTION_CODE_UPDATED,
        });
      }
    );
  },
  getPromoCodeDetailsById: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.query);
        },
        function (body, nextCall) {
          PromoCodeSchema.findOne({
            _id: mongoose.Types.ObjectId(body.id),
          }).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.PROMOTION_CODE,
              log_message.ACTION.VIEW_PROMOCODE + ", Promocode Id : " + body.id
            );
            // Action end
            return nextCall(null, data);
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
          data: response,
        });
      }
    );
  },
  deletePromotionCode: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req
            .checkBody("couponId", message.PROMOTION_COUPONID_REQUIRED)
            .notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          PromoCodeSchema.updateOne(
            { _id: mongoose.Types.ObjectId(body.couponId) },
            { isDeleted: true },
            { new: true }
          ).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.PROMOTION_CODE,
              log_message.ACTION.DELETE_PROMOCODE +
                ", Promocode Id : " +
                body.couponId
            );
            // Action end
            // saveRecycle(subject, token, tableName, recordId)

            saveRecycle(
              "Delete: Promotion Code",
              req.headers["authorization"],
              "promotionCode",
              body.couponId
            );

            return nextCall(null, data);
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
          data: response,
          message: message.PROMOTION_CODE_DELETED,
        });
      }
    );
  },
  getAllPages: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          if (body)
            PagesSchema.find(
              { isDeleted: false, isActive: true },
              { updatedAt: 0, createdAt: 0, isActive: 0, isDeleted: 0 }
            ).exec((err, pageList) => {
              if (err) {
                return res.sendToEncode({
                  status: 400,
                  message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                });
              }
              return nextCall(null, pageList);
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
          data: response,
          message: message.GET_PAGES_SUCC,
        });
      }
    );
  },
  getAllPosition1: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          if (body)
            PositionSchemaNew.find(
              { isDeleted: false, isActive: true },
              { updatedAt: 0, createdAt: 0, isActive: 0, isDeleted: 0 }
            ).exec((err, postionList) => {
              if (err) {
                return res.sendToEncode({
                  status: 400,
                  message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                });
              }
              return nextCall(null, postionList);
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
          data: response,
          message: "Get Position List successfully.",
        });
      }
    );
  },

  changeDriverStatus: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("id", "Driver id is required.").notEmpty();
          req.checkBody("status", "Driver Status is required.").notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({ message: error[0].msg });
          } else {
            nextCall(null, req.body);
          }
        },
        function (body, nextCall) {
          DriverSchema.update(
            { _id: body.id },
            { $set: { status: body.status } },
            function (error, results) {
              if (error) {
                nextCall({ message: message.SOMETHING_WENT_WRONG });
              } else {
                // Add Action
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.DRIVER,
                  log_message.ACTION.STATUS_CHANGE + ", Driver Id : " + body.id
                );
                // Action end
                nextCall(null, {
                  status: 200,
                  message: "Driver Status updated Successfully.",
                });
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: (err && err.message) || "Oops! You could not be update.",
          });
        }
        res.status(200).sendToEncode(response);
      }
    );
  },
  deleteUser: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("id", message.USER_ID_REQUIRED).notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          AdminSchema.updateOne(
            { _id: mongoose.Types.ObjectId(body.id), type: "user" },
            { isDeleted: true },
            { new: true }
          ).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }

            AdminSchema.findOne({ _id: mongoose.Types.ObjectId(body.id) }).exec(
              function (err, userData) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                // saveRecycle(subject, token, tableName, recordId)
                saveRecycle(
                  "Delete: User, Name : " + userData._doc.userName,
                  req.headers["authorization"],
                  "admin",
                  userData._doc._id
                );

                // Add Action
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.USER,
                  log_message.ACTION.DELETE_USER +
                    ", Username : " +
                    userData._doc.userName
                );
                // Action end
              }
            );
            return nextCall(null, data);
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
          data: response,
          message: message.USER_DELETE_SUCC,
        });
      }
    );
  },
  getUserById: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.query);
        },
        function (body, nextCall) {
          AdminSchema.findOne(
            {
              _id: mongoose.Types.ObjectId(body.id),
              type: "user",
            },
            { password: 0 }
          ).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.USER,
              log_message.ACTION.VIEW_USER + ", User Id : " + body.id
            );
            // Action end

            return nextCall(null, data);
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
          data: response,
          message: message.GET_USER_DETAIL_SUCC,
        });
      }
    );
  },
  getAllDriversLocation: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.query.provonce !== "" && req.query.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          // if (req.query.startDate !== "" && req.query.startDate !== null &&
          // req.query.startDate !== undefined) {
          //   var tempDate = req.query.startDate
          //     .split("-")
          //     .reverse()
          //     .join("-");
          //   aggregateQuery.push({
          //     $match: {
          //       createdAt: { $gte: new Date(tempDate) }
          //     }
          //   });
          // }

          // if (
          //   req.query.endDate !== "" &&
          //   req.query.endDate !== null &&
          //   req.query.endDate !== undefined
          // ){
          //   var tempDate = req.query.endDate
          //     .split("-")
          //     .reverse()
          //     .join("-");
          //   aggregateQuery.push({
          //     $match: {
          //       createdAt: { $lt: new Date(tempDate) }
          //     }
          //   });
          // }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { name: re },
                  { "vehicle.platNumber": re },
                  { phoneNumber: re },
                ],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          DriverSchema.aggregate(aggregateQuery, (err, AllDriverLocation) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllDriverLocation = AllDriverLocation;
              responseData.recordsTotal = AllDriverLocation.length;
              responseData.recordsFiltered = AllDriverLocation.length;
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
          message: message.GET_DRIVER_LOCATION_DATA_SUCC,
          data: response,
        });
      }
    );
  },
  getDriverLocationById: function (req, res) {
    async.waterfall(
      [
        /** get Driver Location By Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              _id: ObjectId(req.query.id),
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "admin",
              localField: "addedBy",
              foreignField: "_id",
              as: "addedByData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$addedByData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              phoneNumber: 1,
              onlyPhoneNumber: 1,
              "deviceDetail.os": 1,
              updatedAt: 1,
              createdAt: 1,
              creditBalance: 1,
              inviteCode: 1,
              profilePhoto: 1,
              name: 1,
              "addedByData.name": 1,
              dob: 1,
              verifiedDate: 1,
            },
          });

          // aggregateQuery.push({
          //   $lookup: {
          //     from: "driver",
          //     localField: "driver_referrals.parentDriver",
          //     foreignField: "_id",
          //     as: "driverData",
          //   },
          // });

          // aggregateQuery.push({
          //   $unwind: {
          //     path: "$driverData",
          //     preserveNullAndEmptyArrays: true,
          //   },
          // });

          // aggregateQuery.push({
          //   $project: {
          //     _id: 1,
          //     phoneNumber: 1,
          //     onlyPhoneNumber: 1,
          //     "vehicle.platNumber": 1,
          //     "deviceDetail.os": 1,
          //     updatedAt: 1,
          //     createdAt: 1,
          //     creditBalance: 1,
          //     inviteCode: 1,
          //     profilePhoto: 1,
          //     name: 1,
          //     "driver_referrals.driver": 1,
          //     dob: 1,
          //     verifiedDate: 1,
          //     "driverData.name": 1,
          //   },
          // });

          // aggregateQuery.push({
          //   $addFields: {
          //     addedBy: "$driverData.name",
          //   },
          // });

          // aggregateQuery.push({
          //   $project: {
          //     driver_referrals: 0,
          //     driverData: 0,
          //   },
          // });

          DriverSchema.aggregate(
            aggregateQuery,
            (err, DriverLocationDetail) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.DriverLocationDetail = DriverLocationDetail;
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
          message: message.GET_DRIVER_LOCATION_DETAIL_SUCC,
          data: response,
        });
      }
    );
  },
  getAllPassengersLocation: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.query.provonce !== "" && req.query.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ name: re }, { phoneNumber: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, AllPassengerLocation) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.AllPassengerLocation = AllPassengerLocation;
                responseData.recordsTotal = AllPassengerLocation.length;
                responseData.recordsFiltered = AllPassengerLocation.length;
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
          message: message.GET_PASSENGER_LOCATION_DATA_SUCC,
          data: response,
        });
      }
    );
  },
  getAllPassengersLocationPOST: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.body.provonce !== "" && req.body.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          if (
            req.body.startDate !== "" &&
            req.body.startDate !== null &&
            req.body.startDate !== undefined
          ) {
            var tempDate = req.body.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.body.endDate !== "" &&
            req.body.endDate !== null &&
            req.body.endDate !== undefined
          ) {
            var tempDate = req.body.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.body.search !== undefined && req.body.search.length > 0) {
            const re = new RegExp(`${req.body.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ name: re }, { phoneNumber: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: req.body.skip || 0,
          });

          aggregateQuery.push({
            $limit: req.body.limit || 10,
          });

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, AllPassengerLocation) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.AllPassengerLocation = AllPassengerLocation;
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
          message: message.GET_PASSENGER_LOCATION_DATA_SUCC,
          data: response,
        });
      }
    );
  },
  getPassengersLocationById: function (req, res) {
    async.waterfall(
      [
        /** get Passengers Location By Passenger id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              _id: ObjectId(req.query.id),
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "passenger_referrals",
              localField: "_id",
              foreignField: "passenger",
              as: "passenger_referrals",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$passenger_referrals",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "passenger",
              localField: "passenger_referrals.passenger",
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
              phoneNumber: 1,
              onlyPhoneNumber: 1,
              updatedAt: 1,
              createdAt: 1,
              inviteCode: 1,
              profilePhoto: 1,
              name: 1,
              passenger_referrals: 1,
              dob: 1,
              verifiedDate: 1,
              "passengerData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              InvitedBy: "$passengerData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              passenger_referrals: 0,
              passengerData: 0,
            },
          });

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, PassengerLocationDetail) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.PassengerLocationDetail = PassengerLocationDetail;
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
          message: message.GET_PASSENGER_LOCATION_DETAIL_SUCC,
          data: response,
        });
      }
    );
  },
  getAllDriverProvince: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          if (body)
            DriverSchema.distinct("phoneNumber").exec(
              (err, driverProvinceList) => {
                if (err) {
                  return res.sendToEncode({
                    status: 400,
                    message:
                      (err && err.message) || message.SOMETHING_WENT_WRONG,
                  });
                }
                return nextCall(null, driverProvinceList);
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
          data: response,
          message: message.GET_DRIVER_PROVINCE_DATA_SUCC,
        });
      }
    );
  },

  getAllPassengerProvince: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          if (body)
            PassengerSchema.distinct("phoneNumber").exec(
              (err, passengerProvinceList) => {
                if (err) {
                  return res.sendToEncode({
                    status: 400,
                    message:
                      (err && err.message) || message.SOMETHING_WENT_WRONG,
                  });
                }
                return nextCall(null, passengerProvinceList);
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
          data: response,
          message: message.GET_PASSENGER_PROVINCE_DATA_SUCC,
        });
      }
    );
  },
  recoverRecycle: function (req, res) {
    var body_id = req.query.id;
    async.waterfall(
      [
        function (nextCall) {
          if (body_id == null || body_id == undefined || body_id == "") {
            nextCall({ message: message.RECYCLE_RECORD_ID_REQUIRED });
          }
          nextCall(null, req.query);
        },
        function (body, nextCall) {
          RecycleBinSchema.findOne({ _id: body_id }, function (error, results) {
            if (error) {
              nextCall({ message: message.SOMETHING_WENT_WRONG + "_1" });
            } else {
              nextCall(null, results);
            }
          });
        },
        function (response, nextCall) {
          var tempSchema = null;
          if (response._doc.tableName == "admin") {
            tempSchema = AdminSchema;
          } else if (response._doc.tableName == "driver") {
            tempSchema = DriverSchema;
          } else if (response._doc.tableName == "pages") {
            tempSchema = PagesSchema;
          } else if (response._doc.tableName == "passenger") {
            tempSchema = PassengerSchema;
          } else if (response._doc.tableName == "positionNew") {
            tempSchema = PositionSchemaNew;
          } else if (response._doc.tableName == "promotionCode") {
            tempSchema = PromoCodeSchema;
          } else if (response._doc.tableName == "userGroup") {
            tempSchema = UserGroupSchema;
          } else if (response._doc.tableName == "billing_plan") {
            tempSchema = BillingPlansSchema;
          } else {
            nextCall({ message: message.SOMETHING_WENT_WRONG + "_2" });
          }

          tempSchema.update(
            { _id: ObjectId(response._doc.recordId) },
            { $set: { isDeleted: false } },
            function (error, results) {
              if (error) {
                nextCall({ message: message.SOMETHING_WENT_WRONG + "_3" });
              } else {
                // Update recycle table start
                RecycleBinSchema.update(
                  { _id: ObjectId(body_id) },
                  { $set: { isResolved: true } },
                  function (error, results) {
                    if (error) {
                      nextCall({
                        message: message.SOMETHING_WENT_WRONG + "_4",
                      });
                    } else {
                      // Add Action
                      _self.addActionLog(
                        req.user,
                        log_message.SECTION.RECYCLE_BIN,
                        log_message.ACTION.RECOVER_RECYCLE +
                          ", Record ID : " +
                          body_id
                      );
                      // Action end
                      return nextCall(null, results);
                    }
                  }
                );
                // Update recycle table end
                return nextCall(null, results);
              }
            }
          );
        },
      ],
      function (err, response) {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: (err && err.message) || "Oops! You could not be update.",
          });
        }
        return res.sendToEncode({
          status_code: 200,
          data: response,
          message: message.RECYCLE_SUCC,
        });
      }
    );
  },
  recoverRecycleMultiple: function (req, res) {
    req.checkBody("ids", message.RECYCLE_RECORD_ID_REQUIRED).notEmpty();
    var error = req.validationErrors();
    if (error && error.length) {
      return res.sendToEncode({
        status: 400,
        message: error[0].msg || message.SOMETHING_WENT_WRONG,
      });
    }

    function recoverRecycleFN(i) {
      try {
        RecycleBinSchema.findOne({ _id: req.body.ids[i] }).exec(function (
          err,
          response
        ) {
          if (err) {
            return res.sendToEncode({
              status: 400,
              message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            });
          }

          var tempSchema = null;
          if (response._doc.tableName == "admin") {
            tempSchema = AdminSchema;
          } else if (response._doc.tableName == "driver") {
            tempSchema = DriverSchema;
          } else if (response._doc.tableName == "pages") {
            tempSchema = PagesSchema;
          } else if (response._doc.tableName == "passenger") {
            tempSchema = PassengerSchema;
          } else if (response._doc.tableName == "positionNew") {
            tempSchema = PositionSchemaNew;
          } else if (response._doc.tableName == "promotionCode") {
            tempSchema = PromoCodeSchema;
          } else if (response._doc.tableName == "userGroup") {
            tempSchema = UserGroupSchema;
          } else if (response._doc.tableName == "billing_plan") {
            tempSchema = BillingPlansSchema;
          } else {
            return res.sendToEncode({
              status: 400,
              message: (e && e.message) || message.SOMETHING_WENT_WRONG,
            });
          }

          tempSchema.update(
            { _id: response._doc.recordId },
            { $set: { isDeleted: false } },
            function (error, results) {
              if (error) {
                return res.sendToEncode({
                  status: 400,
                  message: (e && e.message) || message.SOMETHING_WENT_WRONG,
                });
              } else {
                // Update recycle table start
                RecycleBinSchema.update(
                  { _id: req.body.ids[i] },
                  { $set: { isResolved: true } },
                  function (error, results) {
                    if (error) {
                      return res.sendToEncode({
                        status: 400,
                        message:
                          (e && e.message) || message.SOMETHING_WENT_WRONG,
                      });
                    } else {
                      if (i < req.body.ids.length - 1) {
                        recoverRecycleFN(i + 1);
                      } else {
                        // Add Action
                        _self.addActionLog(
                          req.user,
                          log_message.SECTION.RECYCLE_BIN,
                          log_message.ACTION.MULTI_RECOVER_RECYCLE +
                            ", Record Ids : " +
                            req.body.ids.toString()
                        );
                        // Action end
                        return res.sendToEncode({
                          status_code: 200,
                          message: message.RECYCLE_SUCC,
                        });
                      }
                    }
                  }
                );
                // Update recycle table end
                return res.sendToEncode({
                  status_code: 200,
                  message: message.RECYCLE_SUCC,
                });
              }
            }
          );
        });
      } catch (e) {
        return res.sendToEncode({
          status: 400,
          message: (e && e.message) || message.SOMETHING_WENT_WRONG,
        });
      }
    }
    recoverRecycleFN(0);
  },
  deleteRecycle: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("id", message.RECYCLE_RECORD_ID_REQUIRED).notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          RecycleBinSchema.updateOne(
            { _id: mongoose.Types.ObjectId(body.id) },
            { isDeleted: true },
            { new: true }
          ).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.RECYCLE_BIN,
              log_message.ACTION.DELETE_RECYCLE + ", Record Id : " + body.id
            );
            // Action end
            return nextCall(null, data);
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
          data: response,
          message: message.RECYCLE_DEL_SUCC,
        });
      }
    );
  },
  deleteRecycleMultiple: function (req, res) {
    req.checkBody("ids", message.RECYCLE_RECORD_ID_REQUIRED).notEmpty();
    var error = req.validationErrors();
    if (error && error.length) {
      return res.sendToEncode({
        status: 400,
        message: error[0].msg || message.SOMETHING_WENT_WRONG,
      });
    }

    function deleteRecycleFN(i) {
      try {
        RecycleBinSchema.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.ids[i]) },
          { isDeleted: true },
          { new: true }
        ).exec(function (err, data) {
          if (err) {
            return res.sendToEncode({
              status: 400,
              message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            });
          }

          if (i < req.body.ids.length - 1) {
            deleteRecycleFN(i + 1);
          } else {
            // Add Action
            _self.addActionLog(
              req.user,
              log_message.SECTION.RECYCLE_BIN,
              log_message.ACTION.MULTI_DELETE_RECYCLE +
                ", Record Ids : " +
                req.body.ids.toString()
            );
            // Action end
            return res.sendToEncode({
              status_code: 200,
              message: message.RECYCLE_DEL_SUCC,
            });
          }
        });
      } catch (e) {
        return res.sendToEncode({
          status: 400,
          message: (e && e.message) || message.SOMETHING_WENT_WRONG,
        });
      }
    }
    deleteRecycleFN(0);
  },

  getAllRecycleBinList: function (req, res) {
    async.waterfall(
      [
        /** get All RecycleBin List */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isResolved: false },
          });

          aggregateQuery.push({
            $project: {
              tableName: 0,
              recordId: 0,
              isDeleted: 0,
              isResolved: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "admin",
              localField: "userId",
              foreignField: "_id",
              as: "userData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$userData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              subject: 1,
              updatedAt: 1,
              createdAt: 1,
              "userData.userName": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              Modified_by: "$userData.userName",
            },
          });

          aggregateQuery.push({
            $project: {
              userData: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          RecycleBinSchema.aggregate(aggregateQuery, (err, AllRecycleData) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllRecycleData = AllRecycleData;
              responseData.recordsTotal = AllRecycleData.length;
              responseData.recordsFiltered = AllRecycleData.length;
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
          message: message.GET_RECYCLE_SUCC,
          data: response,
        });
      }
    );
  },
  getPagesAccessByUserId: function (req, res) {
    var reqToken = req.headers ? req.headers["authorization"] : "";
    var data = [];

    jwt.verify(reqToken, config.secret, function (err, decoded) {
      if (err) {
        return res.status(401).json({
          status_code: 401,
          message: "Your session has expired. Please login again.",
        });
      } else if (decoded) {
        if (!decoded._id) {
          return res.status(403).json({
            status_code: 403,
            message: "Invalid access token.",
          });
        }

        var userPositionId, userGroupId, positionName, pageAccessData;
        AdminSchema.findOne({
          _id: decoded._id,
        }).exec(function (err, userData) {
          if (err) {
            return res.status(403).json({
              status_code: 403,
              message: "Invalid User.",
            });
          } else if (!userData) {
            return res.status(403).json({
              status_code: 403,
              message: "User is not registed.",
            });
          } else {
            userPositionId = userData._doc.positionId;
            userGroupId = userData._doc.groupId;

            // Get Postion data
            PositionSchemaNew.findOne({
              _id: userPositionId,
            }).exec(function (err, positionData) {
              if (err) {
                return res.status(403).json({
                  status_code: 403,
                  message: "Invalid user position",
                });
              } else if (!positionData) {
                return res.status(403).json({
                  status_code: 403,
                  message: "User has no position.",
                });
              } else {
                positionName = positionData._doc.name;

                // Get user group Data
                UserGroupSchema.findOne(
                  {
                    _id: userGroupId,
                  },
                  { pageAccess: 1 }
                ).exec(function (err, userGroupData) {
                  if (err) {
                    return res.status(403).json({
                      status_code: 403,
                      message: "Invalid user group.",
                    });
                  } else if (!userGroupData) {
                    return res.status(403).json({
                      status_code: 403,
                      message: "User has no group.",
                    });
                  } else {
                    pageAccessData = JSON.stringify(userGroupData);
                    var jsonObj = JSON.parse(pageAccessData);

                    for (var i = 0; i < jsonObj.pageAccess.length; i++) {
                      if (jsonObj.pageAccess[i].position == positionName) {
                        data.push(jsonObj.pageAccess[i].page);
                      }
                    }

                    return res.sendToEncode({
                      status_code: 200,
                      message: message.GET_USER_ACCESS_PAGE_SUCC,
                      data: data,
                    });
                  }
                });
              }
            });
            // Get user group Data
          }
        });
      } else {
        //Send Unauthorized response
        return res.status(401).json({
          status_code: 0,
          message: "something wrong.",
        });
      }
    });
  },

  // Pdf, CSV and Excel api start
  getAllUsersCSV: function (req, res) {
    async.waterfall(
      [
        /** get All User Excel*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false, type: "user" } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          aggregateQuery.push({
            $project: {
              password: 0,
              updatedAt: 0,
              isDeleted: 0,
              phone: 0,
              email: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "userGroup",
              localField: "groupId",
              foreignField: "_id",
              as: "userGroupData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$userGroupData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              createdAt: 1,
              userName: 1,
              isActive: 1,
              positionId: 1,
              "userGroupData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              group: "$userGroupData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              userGroupData: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "positionNew",
              localField: "positionId",
              foreignField: "_id",
              as: "positionData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$positionData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              createdAt: 1,
              userName: 1,
              isActive: 1,
              group: 1,
              "positionData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              position: "$positionData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              positionData: 0,
            },
          });

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { userName: re },
                  { phone: re },
                  { email: re },
                  { group: re },
                  { position: re },
                ],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          AdminSchema.aggregate(aggregateQuery, (err, AllUsers) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllUsers = AllUsers;
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

        let data = [];
        let columns = {
          id: "id",
          name: "Name",
        };

        for (var i = 0; i < 10; i++) {
          data.push([i, "Name " + i]);
        }

        stringify(data, { header: true, columns: columns }, (err, output) => {
          if (err) throw err;
          fs.writeFile("./uploads/pdf/UserList.csv", output, (err) => {
            if (err) throw err;
          });
        });
        // end
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
            jsonObj.AllReceivedBookingsDispacter[i].toatlFare,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
            jsonObj.AllAcceptedBookingdDispacter[i].toatlFare,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
            jsonObj.AllOnRideDispacter[i].toatlFare,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
            jsonObj.AllSuccessfulTripsDispacter[i].toatlFare,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
            jsonObj.AllCancleBookingsDispacter[i].toatlFare,
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
  getPromotionListExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User Group*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ promotionCodeType: re }, { code: re }],
              },
            });
          }

          PromoCodeSchema.aggregate(aggregateQuery, (err, AllPromocode) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllPromocode = AllPromocode;
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
        conf.name = "Promocode";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Code",
            type: "string",
          },
          {
            caption: "Promotion Type",
            type: "string",
          },
          {
            caption: "Discount",
            type: "string",
          },
          {
            caption: "Start Date",
            type: "string",
          },
          {
            caption: "Expiration",
            type: "string",
          },
          {
            caption: "Status",
            type: "bool",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.AllPromocode.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj.AllPromocode[i].code,
            jsonObj.AllPromocode[i].promotionCodeType,
            jsonObj.AllPromocode[i].discount,
            jsonObj.AllPromocode[i].startDate,
            jsonObj.AllPromocode[i].expireDate,
            jsonObj.AllPromocode[i].isActive,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "Promocode.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllUserGroupsExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User Group*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ name: re }, { description: re }],
              },
            });
          }

          UserGroupSchema.aggregate(aggregateQuery, (err, AllUserGroup) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllUserGroup = AllUserGroup;
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
        conf.name = "UserGroup List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Description",
            type: "string",
          },
          {
            caption: "Pages",
            type: "number",
          },
          {
            caption: "Create Date",
            type: "string",
          },
          {
            caption: "Status",
            type: "bool",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.AllUserGroup.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj.AllUserGroup[i].name,
            jsonObj.AllUserGroup[i].description,
            jsonObj.AllUserGroup[i].pageAccess.length,
            jsonObj.AllUserGroup[i].createdAt,
            jsonObj.AllUserGroup[i].status,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "UserGroupList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllUsersExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User Excel*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false, type: "user" } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          aggregateQuery.push({
            $project: {
              password: 0,
              updatedAt: 0,
              isDeleted: 0,
              phone: 0,
              email: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "userGroup",
              localField: "groupId",
              foreignField: "_id",
              as: "userGroupData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$userGroupData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              createdAt: 1,
              userName: 1,
              isActive: 1,
              positionId: 1,
              "userGroupData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              group: "$userGroupData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              userGroupData: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "positionNew",
              localField: "positionId",
              foreignField: "_id",
              as: "positionData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$positionData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              createdAt: 1,
              userName: 1,
              isActive: 1,
              group: 1,
              "positionData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              position: "$positionData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              positionData: 0,
            },
          });

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { userName: re },
                  { phone: re },
                  { email: re },
                  { group: re },
                  { position: re },
                ],
              },
            });
          }

          AdminSchema.aggregate(aggregateQuery, (err, AllUsers) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllUsers = AllUsers;
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
        conf.name = "User List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Position",
            type: "string",
          },
          {
            caption: "Group Name",
            type: "string",
          },
          {
            caption: "Create Date",
            type: "string",
          },
          {
            caption: "isActive",
            type: "bool",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.AllUsers.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj.AllUsers[i].userName,
            jsonObj.AllUsers[i].position,
            jsonObj.AllUsers[i].group,
            jsonObj.AllUsers[i].createdAt,
            jsonObj.AllUsers[i].isActive,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "UserList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllDriversLocationExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.query.provonce !== "" && req.query.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { name: re },
                  { "vehicle.platNumber": re },
                  { phoneNumber: re },
                ],
              },
            });
          }

          DriverSchema.aggregate(aggregateQuery, (err, AllDriverLocation) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllDriverLocation = AllDriverLocation;
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
        conf.name = "Driver Location";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Location Name",
            type: "string",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Vehicle ID",
            type: "string",
          },
          {
            caption: "Phone Number",
            type: "string",
          },
          {
            caption: "Register Date",
            type: "bool",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.AllDriverLocation.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj.AllDriverLocation[i].location.coordinates,
            jsonObj.AllDriverLocation[i].name,
            jsonObj.AllDriverLocation[i].vehicle.platNumber,
            jsonObj.AllDriverLocation[i].phoneNumber,
            jsonObj.AllDriverLocation[i].createdAt,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "Driver_Location.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllPassengersLocationExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.query.provonce !== "" && req.query.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ name: re }, { phoneNumber: re }],
              },
            });
          }

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, AllPassengerLocation) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.AllPassengerLocation = AllPassengerLocation;
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
        conf.name = "Passenger Location";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Location Name",
            type: "string",
          },
          {
            caption: "Passenger ID",
            type: "string",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Phone Number",
            type: "string",
          },
          {
            caption: "Register Date",
            type: "bool",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.AllPassengerLocation.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj.AllPassengerLocation[i].location.coordinates,
            jsonObj.AllPassengerLocation[i].uniqueID,
            jsonObj.AllPassengerLocation[i].name,
            jsonObj.AllPassengerLocation[i].phoneNumber,
            jsonObj.AllPassengerLocation[i].createdAt,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "Passenger_Location.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllBillingPlansExcel: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          var sort = {};
          matchObj.isDeleted = false;
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                "name.en": regex,
              },
              {
                "details.en": regex,
              },
              {
                billingType: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          BillingPlansSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          BillingPlansSchema.find(
            matchObj,
            {
              _id: 1,
              name: 1,
              details: 1,
              chargeAmt: 1,
              billingType: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              }
              nextCall(null, poiUsers);
            });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode(err);
        }

        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "Biling Plan";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Billing Type",
            type: "string",
          },
          {
            caption: "Charge Amount",
            type: "number",
          },
          {
            caption: "Details",
            type: "string",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].name,
            jsonObj[i].billingType,
            jsonObj[i].chargeAmt,
            jsonObj[i].details,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "BillingPlan.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },

  getAllDriverExcel: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
          };
          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }
          if (req.body.isVerified) {
            matchObj.isVerified = true;
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                uniqueID: regex,
              },
              {
                phoneNumber: regex,
              },
              {
                email: regex,
              },
              {
                name: regex,
              },
              {
                countryCode: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.find(
            matchObj,
            {
              _id: 1,
              uniqueID: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              dob: 1,
              isBlocked: 1,
              isVerified: 1,
              profilePhoto: 1,
              createdAt: 1,
              verifiedDate: 1,
              autoIncrementID: 1,
              creditBalance: 1,
              avgRating: 1,
              verifiedBy: 1,
              driverLevel: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .populate("verifiedBy")
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  $or: [
                    {
                      parentDriver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      grandParentDriver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      greatGrandParentDriver: mongoose.Types.ObjectId(
                        driver._id
                      ),
                    },
                  ],
                },
              });
              // stage 2
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalInvitedCount: {
                    $sum: 1,
                  },
                },
              });
              // stage 3
              aggregateQuery.push({
                $addFields: {
                  driver_id: mongoose.Types.ObjectId(driver._id),
                },
              });
              // stage 4
              aggregateQuery.push({
                $lookup: {
                  from: "ride",
                  localField: "driver_id",
                  foreignField: "driverId",
                  as: "driverCompletedRides",
                },
              });
              // stage 5
              aggregateQuery.push({
                $unwind: {
                  path: "$driverCompletedRides",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 6
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  driver_id: {
                    $first: "$driver_id",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $sum: {
                      $cond: {
                        if: {
                          $eq: ["driverCompletedRides.paymentStatus", true],
                        },
                        then: "$driverCompletedRides.driverEarning",
                        else: 0,
                      },
                    },
                  },
                },
              });
              // stage 7
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  driver_id: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              // stage 8
              aggregateQuery.push({
                $lookup: {
                  from: "driver_referral_earning_logs",
                  localField: "driver_id",
                  foreignField: "beneficiaryDriverId",
                  as: "totalReferralEarning",
                },
              });
              // stage 9
              aggregateQuery.push({
                $unwind: {
                  path: "$totalReferralEarning",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 10
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  driver_id: {
                    $first: "$driver_id",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $first: "$totalRideEarning",
                  },
                  totalReferralEarning: {
                    $sum: "$totalReferralEarning.referralAmount",
                  },
                },
              });
              // stage 11
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  driver_id: 1,
                  totalReferralEarning: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              DriverReferralSchema.aggregate(
                aggregateQuery,
                (err, totalRefEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (totalRefEarning && totalRefEarning.length > 0) {
                      driver.totalReferralEarning =
                        totalRefEarning[0].totalReferralEarning;
                      driver.totalInvitedCount =
                        totalRefEarning[0].totalInvitedCount;
                      driver.totalRideEarning =
                        totalRefEarning[0].totalRideEarning;
                    } else {
                      driver.totalReferralEarning = 0;
                      driver.totalInvitedCount = 0;
                      driver.totalRideEarning = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = drivers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }

        var data = JSON.stringify(response.data);
        var jsonObj = JSON.parse(data);

        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "Driver";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "uniqueID",
            type: "string",
          },
          {
            caption: "phoneNumber",
            type: "string",
          },
          {
            caption: "countryCode",
            type: "number",
          },
          {
            caption: "onlyPhoneNumber",
            type: "string",
          },
          {
            caption: "autoIncrementID",
            type: "number",
          },
          {
            caption: "createdAt",
            type: "date",
          },
          {
            caption: "creditBalance",
            type: "number",
          },
          {
            caption: "driverLevel",
            type: "number",
          },
          {
            caption: "avgRating",
            type: "number",
          },
          {
            caption: "isBlocked",
            type: "boolean",
          },
          {
            caption: "verifiedDate",
            type: "date",
          },
          {
            caption: "isVerified",
            type: "boolean",
          },
          {
            caption: "profilePhoto",
            type: "string",
          },
          {
            caption: "dob",
            type: "date",
          },
          {
            caption: "email",
            type: "string",
          },
          {
            caption: "name",
            type: "string",
          },
          {
            caption: "verifiedBy",
            type: "string",
          },
          {
            caption: "totalReferralEarning",
            type: "number",
          },
          {
            caption: "totalInvitedCount",
            type: "number",
          },
          {
            caption: "totalRideEarning",
            type: "number",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].uniqueID,
            jsonObj[i].phoneNumber,
            jsonObj[i].countryCode,
            jsonObj[i].onlyPhoneNumber,
            jsonObj[i].autoIncrementID,
            jsonObj[i].createdAt,
            jsonObj[i].creditBalance,
            jsonObj[i].driverLevel,
            jsonObj[i].avgRating,
            jsonObj[i].isBlocked,
            jsonObj[i].verifiedDate,
            jsonObj[i].isVerified,
            jsonObj[i].profilePhoto,
            jsonObj[i].dob,
            jsonObj[i].email,
            jsonObj[i].name,
            jsonObj[i].verifiedBy,
            jsonObj[i].totalReferralEarning,
            jsonObj[i].totalInvitedCount,
            jsonObj[i].totalRideEarning,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "Driver.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  // PDF api Start

  getAllDriverPDF: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
          };
          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }
          if (req.body.isVerified) {
            matchObj.isVerified = true;
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                uniqueID: regex,
              },
              {
                phoneNumber: regex,
              },
              {
                email: regex,
              },
              {
                name: regex,
              },
              {
                countryCode: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.find(
            matchObj,
            {
              _id: 1,
              uniqueID: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              dob: 1,
              isBlocked: 1,
              isVerified: 1,
              profilePhoto: 1,
              createdAt: 1,
              verifiedDate: 1,
              autoIncrementID: 1,
              creditBalance: 1,
              avgRating: 1,
              verifiedBy: 1,
              driverLevel: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .populate("verifiedBy")
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  $or: [
                    {
                      parentDriver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      grandParentDriver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      greatGrandParentDriver: mongoose.Types.ObjectId(
                        driver._id
                      ),
                    },
                  ],
                },
              });
              // stage 2
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalInvitedCount: {
                    $sum: 1,
                  },
                },
              });
              // stage 3
              aggregateQuery.push({
                $addFields: {
                  driver_id: mongoose.Types.ObjectId(driver._id),
                },
              });
              // stage 4
              aggregateQuery.push({
                $lookup: {
                  from: "ride",
                  localField: "driver_id",
                  foreignField: "driverId",
                  as: "driverCompletedRides",
                },
              });
              // stage 5
              aggregateQuery.push({
                $unwind: {
                  path: "$driverCompletedRides",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 6
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  driver_id: {
                    $first: "$driver_id",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $sum: {
                      $cond: {
                        if: {
                          $eq: ["driverCompletedRides.paymentStatus", true],
                        },
                        then: "$driverCompletedRides.driverEarning",
                        else: 0,
                      },
                    },
                  },
                },
              });
              // stage 7
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  driver_id: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              // stage 8
              aggregateQuery.push({
                $lookup: {
                  from: "driver_referral_earning_logs",
                  localField: "driver_id",
                  foreignField: "beneficiaryDriverId",
                  as: "totalReferralEarning",
                },
              });
              // stage 9
              aggregateQuery.push({
                $unwind: {
                  path: "$totalReferralEarning",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 10
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  driver_id: {
                    $first: "$driver_id",
                  },
                  totalInvitedCount: {
                    $first: "$totalInvitedCount",
                  },
                  totalRideEarning: {
                    $first: "$totalRideEarning",
                  },
                  totalReferralEarning: {
                    $sum: "$totalReferralEarning.referralAmount",
                  },
                },
              });
              // stage 11
              aggregateQuery.push({
                $project: {
                  _id: 1,
                  driver_id: 1,
                  totalReferralEarning: 1,
                  totalInvitedCount: 1,
                  totalRideEarning: 1,
                },
              });
              DriverReferralSchema.aggregate(
                aggregateQuery,
                (err, totalRefEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (totalRefEarning && totalRefEarning.length > 0) {
                      driver.totalReferralEarning =
                        totalRefEarning[0].totalReferralEarning;
                      driver.totalInvitedCount =
                        totalRefEarning[0].totalInvitedCount;
                      driver.totalRideEarning =
                        totalRefEarning[0].totalRideEarning;
                    } else {
                      driver.totalReferralEarning = 0;
                      driver.totalInvitedCount = 0;
                      driver.totalRideEarning = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = drivers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response.data,
        });

        var data = JSON.stringify(response.data);
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
          "    <th>uniqueID</th>" +
          "    <th>phoneNumber</th>" +
          "    <th>countryCode</th>" +
          "    <th>onlyPhoneNumber</th>" +
          "    <th>autoIncrementID</th>" +
          "    <th>createdAt</th>" +
          "    <th>creditBalance</th>" +
          "    <th>driverLevel</th>" +
          "    <th>avgRating</th>" +
          "    <th>isBlocked</th>" +
          "    <th>verifiedDate</th>" +
          "    <th>isVerified</th>" +
          "    <th>profilePhoto</th>" +
          "    <th>dob</th>" +
          "    <th>email</th>" +
          "    <th>name</th>" +
          "    <th>verifiedBy</th>" +
          "    <th>totalReferralEarning</th>" +
          "    <th>totalInvitedCount</th>" +
          "    <th>totalRideEarning</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].uniqueID +
            "</td>" +
            "    <td>" +
            jsonObj[i].phoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj[i].countryCode +
            "</td>" +
            "    <td>" +
            jsonObj[i].onlyPhoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj[i].autoIncrementID +
            "</td>" +
            "    <td>" +
            jsonObj[i].createdAt +
            "</td>" +
            "    <td>" +
            jsonObj[i].creditBalance +
            "</td>" +
            "    <td>" +
            jsonObj[i].driverLevel +
            "</td>" +
            "    <td>" +
            jsonObj[i].avgRating +
            "</td>" +
            "    <td>" +
            jsonObj[i].isBlocked +
            "</td>" +
            "    <td>" +
            jsonObj[i].verifiedDate +
            "</td>" +
            "    <td>" +
            jsonObj[i].isVerified +
            "</td>" +
            "    <td>" +
            jsonObj[i].profilePhoto +
            "</td>" +
            "    <td>" +
            jsonObj[i].dob +
            "</td>" +
            "    <td>" +
            jsonObj[i].email +
            "</td>" +
            "    <td>" +
            jsonObj[i].name +
            "</td>" +
            "    <td>" +
            jsonObj[i].verifiedBy +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalReferralEarning +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalInvitedCount +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalRideEarning +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(html, "./uploads/pdf/Driver.pdf", function (
          err,
          success
        ) {
          if (err) {
            return res.sendToEncode({
              status: 400,
              message: (err && err.message) || message.SOMETHING_WENT_WRONG,
            });
          } else {
            return res.sendToEncode({
              status_code: 200,
              message: message.SUCCESS,
              URL: API_URL + "uploads/pdf/Driver.pdf",
            });
          }
        });
      }
    );
  },

  getAllBillingPlansPDF: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          var sort = {};
          matchObj.isDeleted = false;
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                "name.en": regex,
              },
              {
                "details.en": regex,
              },
              {
                billingType: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          BillingPlansSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          BillingPlansSchema.find(
            matchObj,
            {
              _id: 1,
              name: 1,
              details: 1,
              chargeAmt: 1,
              billingType: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              }
              nextCall(null, poiUsers);
            });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode(err);
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response,
        });
        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);
        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>Billing Plan</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Name</th>" +
          "    <th>Billing Type</th>" +
          "    <th>Charge Amount</th>" +
          "    <th>Details</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].name +
            "</td>" +
            "    <td>" +
            jsonObj[i].billingType +
            "</td>" +
            "    <td>" +
            jsonObj[i].chargeAmt +
            "</td>" +
            "    <td>" +
            jsonObj[i].details +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Billing_Plan.pdf",
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
                URL: API_URL + "uploads/pdf/Billing_Plan.pdf",
              });
            }
          }
        );
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
              toatlFare: 1,
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
  getPromotionListPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User Group*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ promotionCodeType: re }, { code: re }],
              },
            });
          }

          PromoCodeSchema.aggregate(aggregateQuery, (err, AllPromocode) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllPromocode = AllPromocode;
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
          "<center><h1>Promocode</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Code</th>" +
          "    <th>Promotion Type</th>" +
          "    <th>Discount</th>" +
          "    <th>Start Date</th>" +
          "    <th>Expiration</th>" +
          "    <th>Status</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.AllPromocode.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj.AllPromocode[i].code +
            "</td>" +
            "    <td>" +
            jsonObj.AllPromocode[i].promotionCodeType +
            "</td>" +
            "    <td>" +
            jsonObj.AllPromocode[i].discount +
            "</td>" +
            "    <td>" +
            jsonObj.AllPromocode[i].startDate +
            "</td>" +
            "    <td>" +
            jsonObj.AllPromocode[i].expireDate +
            "</td>" +
            "    <td>" +
            jsonObj.AllPromocode[i].isActive +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Promocode.pdf",
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
                URL: API_URL + "uploads/pdf/Promocode.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllUserGroupsPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User Group*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ name: re }, { description: re }],
              },
            });
          }

          UserGroupSchema.aggregate(aggregateQuery, (err, AllUserGroup) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllUserGroup = AllUserGroup;
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
          "<center><h1>UserGroup List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Name</th>" +
          "    <th>Description</th>" +
          "    <th>Pages</th>" +
          "    <th>Create Date</th>" +
          "    <th>Status</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.AllUserGroup.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj.AllUserGroup[i].name +
            "</td>" +
            "    <td>" +
            jsonObj.AllUserGroup[i].description +
            "</td>" +
            "    <td>" +
            jsonObj.AllUserGroup[i].pageAccess.length +
            "</td>" +
            "    <td>" +
            jsonObj.AllUserGroup[i].createdAt +
            "</td>" +
            "    <td>" +
            jsonObj.AllUserGroup[i].status +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/UserGroupList.pdf",
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
                URL: API_URL + "uploads/pdf/UserGroupList.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllUsersPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User Excel*/
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({ $match: { isDeleted: false, type: "user" } });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          aggregateQuery.push({
            $project: {
              password: 0,
              updatedAt: 0,
              isDeleted: 0,
              phone: 0,
              email: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "userGroup",
              localField: "groupId",
              foreignField: "_id",
              as: "userGroupData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$userGroupData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              createdAt: 1,
              userName: 1,
              isActive: 1,
              positionId: 1,
              "userGroupData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              group: "$userGroupData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              userGroupData: 0,
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "positionNew",
              localField: "positionId",
              foreignField: "_id",
              as: "positionData",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$positionData",
              preserveNullAndEmptyArrays: true,
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 1,
              createdAt: 1,
              userName: 1,
              isActive: 1,
              group: 1,
              "positionData.name": 1,
            },
          });

          aggregateQuery.push({
            $addFields: {
              position: "$positionData.name",
            },
          });

          aggregateQuery.push({
            $project: {
              positionData: 0,
            },
          });

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { userName: re },
                  { phone: re },
                  { email: re },
                  { group: re },
                  { position: re },
                ],
              },
            });
          }

          AdminSchema.aggregate(aggregateQuery, (err, AllUsers) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllUsers = AllUsers;
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
          "<center><h1>User List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Name</th>" +
          "    <th>Position</th>" +
          "    <th>Group Name</th>" +
          "    <th>Create Date</th>" +
          "    <th>isActive</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.AllUsers.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj.AllUsers[i].userName +
            "</td>" +
            "    <td>" +
            jsonObj.AllUsers[i].position +
            "</td>" +
            "    <td>" +
            jsonObj.AllUsers[i].group +
            "</td>" +
            "    <td>" +
            jsonObj.AllUsers[i].createdAt +
            "</td>" +
            "    <td>" +
            jsonObj.AllUsers[i].isActive +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/UserList.pdf",
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
                URL: API_URL + "uploads/pdf/UserList.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllDriversLocationPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.query.provonce !== "" && req.query.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { name: re },
                  { "vehicle.platNumber": re },
                  { phoneNumber: re },
                ],
              },
            });
          }

          DriverSchema.aggregate(aggregateQuery, (err, AllDriverLocation) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllDriverLocation = AllDriverLocation;
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
          "<center><h1>Driver Location</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Location Name</th>" +
          "    <th>Name</th>" +
          "    <th>Vehicle ID</th>" +
          "    <th>Phone Number</th>" +
          "    <th>Register Date</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.AllDriverLocation.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj.AllDriverLocation[i].location.coordinates +
            "</td>" +
            "    <td>" +
            jsonObj.AllDriverLocation[i].name +
            "</td>" +
            "    <td>" +
            jsonObj.AllDriverLocation[i].vehicle.platNumber +
            "</td>" +
            "    <td>" +
            jsonObj.AllDriverLocation[i].phoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj.AllDriverLocation[i].createdAt +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Driver_Location.pdf",
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
                URL: API_URL + "uploads/pdf/Driver_Location.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllPassengersLocationPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: { isDeleted: false, isBlocked: false },
          });

          // if (req.query.provonce !== "" && req.query.provonce !== undefined) {
          //   // Match province
          //   // aggregateQuery.push({
          //   //   $match: { isDeleted: false, isBlocked: false }
          //   // });
          // }

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ name: re }, { phoneNumber: re }],
              },
            });
          }

          PassengerSchema.aggregate(
            aggregateQuery,
            (err, AllPassengerLocation) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                let responseData = {};
                responseData.AllPassengerLocation = AllPassengerLocation;
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
          "<center><h1>Passenger Location</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Location Name</th>" +
          "    <th>Passenger ID</th>" +
          "    <th>Name</th>" +
          "    <th>Phone Number</th>" +
          "    <th>Register Date</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.AllPassengerLocation.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj.AllPassengerLocation[i].location.coordinates +
            "</td>" +
            "    <td>" +
            jsonObj.AllPassengerLocation[i].uniqueID +
            "</td>" +
            "    <td>" +
            jsonObj.AllPassengerLocation[i].name +
            "</td>" +
            "    <td>" +
            jsonObj.AllPassengerLocation[i].phoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj.AllPassengerLocation[i].createdAt +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Passenger_Location.pdf",
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
                URL: API_URL + "uploads/pdf/Passenger_Location.pdf",
              });
            }
          }
        );
      }
    );
  },
  saveBillingPlan: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("name", message.BILLING_NAME_REQUIRED).notEmpty();
          req
            .checkBody("billingType", message.BILLING_TYPE_REQUIRED)
            .notEmpty();
          req.checkBody("chargeAmt", message.BILLING_TYPE_REQUIRED).notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }

          if (
            req.body.billingType != "percentage" &&
            req.body.billingType != "cash"
          ) {
            return nextCall({
              message: "Billing Type must be percentage or cash only",
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          let newData = {};
          let saveNewBilling = {
            name: body.name,
            billingType: body.billingType,
            chargeAmt: Number(body.chargeAmt),
            details: body.details,
          };

          let saveBill = new BillingPlansSchema(saveNewBilling);
          saveBill.save(function (err, insertedData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            newData = {
              data: insertedData,
            };
            nextCall(null, newData);
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
          data: response.saveUser,
          message: message.BILL_SAVE_SUCC,
        });
      }
    );
  },
  deleteBillingPlan: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("id", message.BILLING_PLAN_ID_REQUIRED).notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          BillingPlansSchema.updateOne(
            { _id: mongoose.Types.ObjectId(body.id) },
            { isDeleted: true },
            { new: true }
          ).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }

            BillingPlansSchema.findOne({
              _id: mongoose.Types.ObjectId(body.id),
            }).exec(function (err, billingData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              // saveRecycle(subject, token, tableName, recordId)
              saveRecycle(
                "Delete: Billing , Name : " + billingData._doc.name,
                req.headers["authorization"],
                "billing_plan",
                billingData._doc._id
              );
            });

            return nextCall(null, data);
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
          data: response,
          message: message.BILL_DEL_SUCC,
        });
      }
    );
  },
  getTripsByDriverId: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              driverId: ObjectId(req.query.driverId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

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

          if (
            req.query.driverLevel !== "" &&
            req.query.driverLevel !== null &&
            req.query.driverLevel !== undefined
          ) {
            aggregateQuery.push({
              $match: {
                "driverData.driverLevel": req.query.driverLevel,
              },
            });
          }

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

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ rideId: re }, { "driverData.name": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
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
          message: message.RIDE_LIST_BY_DRIVER_SUCC,
          data: response,
        });
      }
    );
  },
  getTripsByDriverIdPDF: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              driverId: ObjectId(req.query.driverId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

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

          if (
            req.query.driverLevel !== "" &&
            req.query.driverLevel !== null &&
            req.query.driverLevel !== undefined
          ) {
            aggregateQuery.push({
              $match: {
                "driverData.driverLevel": req.query.driverLevel,
              },
            });
          }

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

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ rideId: re }, { "driverData.name": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
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
          message: message.SUCCESS,
          data: response.RideDetail,
        });

        // create and save excel and send excel file name with path in response
        var data = JSON.stringify(response.RideDetail);
        var jsonObj = JSON.parse(data);

        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>Driver Trips List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Trip ID</th>" +
          "    <th>Name</th>" +
          "    <th>Phone Number</th>" +
          "    <th>Distance</th>" +
          "    <th>Duration</th>" +
          "    <th>Amount</th>" +
          "    <th>Driver Eearning</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].rideId +
            "</td>" +
            "    <td>" +
            jsonObj[i].passengerData.name +
            "</td>" +
            "    <td>" +
            jsonObj[i].passengerData.phoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj[i].toatlDistance +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalTime +
            "</td>" +
            "    <td>" +
            jsonObj[i].toatlFare +
            "</td>" +
            "    <td>" +
            jsonObj[i].driverEarning +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Driver_trips_list.pdf",
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
                URL: API_URL + "uploads/pdf/Driver_trips_list.pdf",
              });
            }
          }
        );
      }
    );
  },
  getTripsByDriverIdExcel: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              driverId: ObjectId(req.query.driverId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

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

          if (
            req.query.driverLevel !== "" &&
            req.query.driverLevel !== null &&
            req.query.driverLevel !== undefined
          ) {
            aggregateQuery.push({
              $match: {
                "driverData.driverLevel": req.query.driverLevel,
              },
            });
          }

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

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ rideId: re }, { "driverData.name": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
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

        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "Driver Trips List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Trip ID",
            type: "number",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Phone Number",
            type: "string",
          },
          {
            caption: "Distance",
            type: "number",
          },
          {
            caption: "Duration",
            type: "number",
          },
          {
            caption: "Amount",
            type: "number",
          },
          {
            caption: "Driver Eearning",
            type: "number",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].rideId,
            jsonObj[i].passengerData.name,
            jsonObj[i].passengerData.phoneNumber,
            jsonObj[i].toatlDistance,
            jsonObj[i].totalTime,
            jsonObj[i].toatlFare,
            jsonObj[i].driverEarning,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "DriversTripsList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getTripsByPassengerId: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              passengerId: ObjectId(req.query.passengerId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
            // matchObj.createdAt = { $gte: new Date(tempDate) };
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

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

          if (
            req.query.driverLevel !== "" &&
            req.query.driverLevel !== null &&
            req.query.driverLevel !== undefined
          ) {
            aggregateQuery.push({
              $match: {
                "driverData.driverLevel": req.query.driverLevel,
              },
            });
          }

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

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ rideId: re }, { "driverData.name": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
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
          message: message.RIDE_LIST_BY_DRIVER_SUCC,
          data: response,
        });
      }
    );
  },
  getTripsByPassengerIdPDF: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              passengerId: ObjectId(req.query.passengerId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
            // matchObj.createdAt = { $gte: new Date(tempDate) };
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

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

          if (
            req.query.driverLevel !== "" &&
            req.query.driverLevel !== null &&
            req.query.driverLevel !== undefined
          ) {
            aggregateQuery.push({
              $match: {
                "driverData.driverLevel": req.query.driverLevel,
              },
            });
          }

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

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ rideId: re }, { "driverData.name": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
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
          message: message.SUCCESS,
          data: response.RideDetail,
        });

        // create and save excel and send excel file name with path in response
        var data = JSON.stringify(response.RideDetail);
        var jsonObj = JSON.parse(data);

        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>Passenger Trips List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Trip ID</th>" +
          "    <th>Name</th>" +
          "    <th>Phone Number</th>" +
          "    <th>Distance</th>" +
          "    <th>Duration</th>" +
          "    <th>Amount</th>" +
          "    <th>Driver Eearning</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].rideId +
            "</td>" +
            "    <td>" +
            jsonObj[i].passengerData.name +
            "</td>" +
            "    <td>" +
            jsonObj[i].passengerData.phoneNumber +
            "</td>" +
            "    <td>" +
            jsonObj[i].toatlDistance +
            "</td>" +
            "    <td>" +
            jsonObj[i].totalTime +
            "</td>" +
            "    <td>" +
            jsonObj[i].toatlFare +
            "</td>" +
            "    <td>" +
            jsonObj[i].driverEarning +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/Passenger_trips_list.pdf",
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
                URL: API_URL + "uploads/pdf/Passenger_trips_list.pdf",
              });
            }
          }
        );
      }
    );
  },
  getTripsByPassengerIdExcel: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              passengerId: ObjectId(req.query.passengerId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
            // matchObj.createdAt = { $gte: new Date(tempDate) };
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

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

          if (
            req.query.driverLevel !== "" &&
            req.query.driverLevel !== null &&
            req.query.driverLevel !== undefined
          ) {
            aggregateQuery.push({
              $match: {
                "driverData.driverLevel": req.query.driverLevel,
              },
            });
          }

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

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ rideId: re }, { "driverData.name": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
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

        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "Passenger Trips List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Trip ID",
            type: "number",
          },
          {
            caption: "Name",
            type: "string",
          },
          {
            caption: "Phone Number",
            type: "string",
          },
          {
            caption: "Distance",
            type: "number",
          },
          {
            caption: "Duration",
            type: "number",
          },
          {
            caption: "Amount",
            type: "number",
          },
          {
            caption: "Driver Eearning",
            type: "number",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].rideId,
            jsonObj[i].passengerData.name,
            jsonObj[i].passengerData.phoneNumber,
            jsonObj[i].toatlDistance,
            jsonObj[i].totalTime,
            jsonObj[i].toatlFare,
            jsonObj[i].driverEarning,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "PassengerTripsList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getPassengerTransactionDetailByTripId: function (req, res) {
    async.waterfall(
      [
        /** get Trips by Driver id */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              _id: ObjectId(req.query.id),
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
          message: message.RIDE_LIST_BY_DRIVER_SUCC,
          data: response,
        });
      }
    );
  },
  saveReward: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("title", "Reward title is required.").notEmpty();
          req
            .checkBody("description", "Reward description is required.")
            .notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }

          if (
            req.body.type != "text" &&
            req.body.type != "image" &&
            req.body.type != "video"
          ) {
            return nextCall({
              message: "Reward type should be text, image or video.",
            });
          }
          nextCall(null, req.body);
        },
        /** get reward auto increment id */
        function (rewardData, nextCall) {
          _self.getRewardAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            rewardData.autoIncrementID = response.rewardAutoIncrement;
            nextCall(null, rewardData);
          });
        },
        function (body, nextCall) {
          let newData = {};
          let saveNewReward = {
            title: body.title,
            description: body.description,
            type: body.type,
            status: body.status,
            autoIncrementID: body.autoIncrementID,
          };

          let saveReward = new RewardNewSchema(saveNewReward);
          saveReward.save(function (err, insertedData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            newData = {
              data: insertedData,
            };
            nextCall(null, newData);
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
          data: response.saveUser,
          message: "Reward save succesfully.",
        });
      }
    );
  },
  getAllActionLog: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { section: re },
                  { action: re },
                  { userType: re },
                  { userName: re },
                ],
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllActions = AllActions;
              responseData.recordsTotal = AllActions.length;
              responseData.recordsFiltered = AllActions.length;
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
          message: message.ACTION_LIST_SUCC,
          data: response,
        });
      }
    );
  },
  getAllActionLogPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { section: re },
                  { action: re },
                  { userType: re },
                  { userName: re },
                ],
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllActions = AllActions;
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
          data: response.AllActions,
        });

        // create and save excel and send excel file name with path in response
        var data = JSON.stringify(response.AllActions);
        var jsonObj = JSON.parse(data);

        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>Action List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>User Name</th>" +
          "    <th>User Group</th>" +
          "    <th>Activities</th>" +
          "    <th>Open Last Date</th>" +
          "    <th>Opened Page</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].userName +
            "</td>" +
            "    <td>" +
            jsonObj[i].userGroup +
            "</td>" +
            "    <td>" +
            jsonObj[i].activities +
            "</td>" +
            "    <td>" +
            jsonObj[i].lastDate +
            "</td>" +
            "    <td>" +
            jsonObj[i].openedPage +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/ActionList.pdf",
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
                URL: API_URL + "uploads/pdf/ActionList.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllActionLogExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { section: re },
                  { action: re },
                  { userType: re },
                  { userName: re },
                ],
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllActions = AllActions;
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
        conf.name = "Action List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "User Name",
            type: "string",
          },
          {
            caption: "User Group",
            type: "string",
          },
          {
            caption: "Activities",
            type: "string",
          },
          {
            caption: "Open Last Date",
            type: "date",
          },
          {
            caption: "Opened Page",
            type: "string",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response.AllActions);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].userName,
            jsonObj[i].userGroup,
            jsonObj[i].activities,
            jsonObj[i].lastDate,
            jsonObj[i].openedPage,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "ActionList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllActionLogCSV: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  { section: re },
                  { action: re },
                  { userType: re },
                  { userName: re },
                ],
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllActions = AllActions;
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

        var dataTemp = JSON.stringify(response.AllActions);
        var jsonObj = JSON.parse(dataTemp);

        let data = [];
        let columns = {
          id: "SR.NO.",
          userName: "User Name",
          userGroup: "User Group",
          activities: "Activities",
          lastDate: "Open Last Date",
          openedPage: "Opened Page",
        };

        for (var i = 0; i < jsonObj.length; i++) {
          data.push([
            i + 1,
            jsonObj[i].userName,
            jsonObj[i].userGroup,
            jsonObj[i].activities,
            jsonObj[i].lastDate,
            jsonObj[i].openedPage,
          ]);
        }

        stringify(data, { header: true, columns: columns }, (err, output) => {
          if (err) throw err;
          fs.writeFile("./uploads/pdf/ActionList.csv", output, (err) => {
            if (err) throw err;
            // send csv file from here
            // var data = fs.readFileSync("./uploads/pdf/ActionList.csv");
            // res.contentType("application/csv");
            // res.send(data);

            // res.sendFile("./uploads/pdf/ActionList.csv", { root: "." });
            return res.sendToEncode({
              status_code: 200,
              message: message.SUCCESS,
              URL: API_URL + "uploads/pdf/ActionList.csv",
            });
          });
        });
        // end
      }
    );
  },
  getAllActionLogByUserId: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              userId: ObjectId(req.query.userId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              // Add Action
              _self.addActionLog(
                req.user,
                log_message.SECTION.ACTION,
                log_message.ACTION.VIEW_ACTION_LOG
              );
              // Action end

              let responseData = {};
              responseData.AllActions = AllActions;
              responseData.recordsTotal = AllActions.length;
              responseData.recordsFiltered = AllActions.length;
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
          message: message.ACTION_LIST_SUCC,
          data: response,
        });
      }
    );
  },
  getAllActionLogByUserIdPDF: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              userId: ObjectId(req.query.userId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllActions = AllActions;
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

        // Add Action
        _self.addActionLog(
          req.user,
          log_message.SECTION.ACTION,
          log_message.ACTION.ACTION_LOG_PDF_DONWLOAD
        );
        // Action end

        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response.AllActions,
        });

        // create and save excel and send excel file name with path in response
        var data = JSON.stringify(response.AllActions);
        var jsonObj = JSON.parse(data);

        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>User Action List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>User Name</th>" +
          "    <th>User Group</th>" +
          "    <th>Activities</th>" +
          "    <th>Open Last Date</th>" +
          "    <th>Opened Page</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].userName +
            "</td>" +
            "    <td>" +
            jsonObj[i].userGroup +
            "</td>" +
            "    <td>" +
            jsonObj[i].activities +
            "</td>" +
            "    <td>" +
            jsonObj[i].lastDate +
            "</td>" +
            "    <td>" +
            jsonObj[i].openedPage +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/UserActionList.pdf",
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
                URL: API_URL + "uploads/pdf/UserActionList.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllActionLogByUserIdExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          aggregateQuery.push({
            $match: {
              userId: ObjectId(req.query.userId),
            },
          });

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          aggregateQuery.push({
            $addFields: {
              userGroup: "$userType",
              activities: "$action",
              lastDate: "$actionAt",
              openedPage: "$section",
            },
          });

          aggregateQuery.push({
            $project: {
              userType: 0,
              action: 0,
              actionAt: 0,
              section: 0,
              autoIncrementID: 0,
              __v: 0,
            },
          });

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          ActionLogsSchema.aggregate(aggregateQuery, (err, AllActions) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllActions = AllActions;
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

        // Add Action
        _self.addActionLog(
          req.user,
          log_message.SECTION.ACTION,
          log_message.ACTION.ACTION_LOG_EXCEL_DONWLOAD
        );
        // Action end

        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "User Action List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "User Name",
            type: "string",
          },
          {
            caption: "User Group",
            type: "string",
          },
          {
            caption: "Activities",
            type: "string",
          },
          {
            caption: "Open Last Date",
            type: "date",
          },
          {
            caption: "Opened Page",
            type: "string",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response.AllActions);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].userName,
            jsonObj[i].userGroup,
            jsonObj[i].activities,
            jsonObj[i].lastDate,
            jsonObj[i].openedPage,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "UserActionList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  getAllVehicle: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ "type.en": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $skip: Number(req.query.skip) || 0,
          });

          aggregateQuery.push({
            $limit: Number(req.query.limit) || 10,
          });

          VehicleTypeSchema.aggregate(aggregateQuery, (err, AllVehicle) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              // Add Action
              _self.addActionLog(
                req.user,
                log_message.SECTION.VEHICLE,
                log_message.ACTION.LIST_ALL_VEHICLE
              );
              // Action end

              let responseData = {};
              responseData.AllVehicle = AllVehicle;
              responseData.recordsTotal = AllVehicle.length;
              responseData.recordsFiltered = AllVehicle.length;
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
          message: "Get all vehicle type successfully.",
          data: response,
        });
      }
    );
  },
  getAllVehiclePDF: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ "type.en": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          VehicleTypeSchema.aggregate(aggregateQuery, (err, AllVehicle) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllVehicle = AllVehicle;
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

        // Add Action
        _self.addActionLog(
          req.user,
          log_message.SECTION.VEHICLE,
          log_message.ACTION.VEHICLE_PDF_DOWNLOAD
        );
        // Action end

        return res.sendToEncode({
          status_code: 200,
          message: message.SUCCESS,
          data: response.AllVehicle,
        });

        // create and save excel and send excel file name with path in response
        var data = JSON.stringify(response.AllVehicle);
        var jsonObj = JSON.parse(data);

        var html =
          "<html>" +
          "<head>" +
          "</head>" +
          "<body>" +
          "<center><h1>Vehicle List</h1></center>" +
          '<center><table border="1">' +
          "  <tr>" +
          "    <th>SR.NO.</th>" +
          "    <th>Vehicle ID</th>" +
          "    <th>Name</th>" +
          "  </tr>";

        for (var i = 0; i < jsonObj.length; i++) {
          html +=
            "  <tr>" +
            "    <td>" +
            i +
            1 +
            "</td>" +
            "    <td>" +
            jsonObj[i].autoIncrementID +
            "</td>" +
            "    <td>" +
            jsonObj[i].type.en +
            "</td>" +
            "  </tr>";
        }

        html += "</table></center>" + "</body>" + "</html>";

        htmlToPdf.convertHTMLString(
          html,
          "./uploads/pdf/VehicleList.pdf",
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
                URL: API_URL + "uploads/pdf/VehicleList.pdf",
              });
            }
          }
        );
      }
    );
  },
  getAllVehicleExcel: function (req, res) {
    async.waterfall(
      [
        /** get All User */
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ "type.en": re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          VehicleTypeSchema.aggregate(aggregateQuery, (err, AllVehicle) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.AllVehicle = AllVehicle;
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

        // Add Action
        _self.addActionLog(
          req.user,
          log_message.SECTION.VEHICLE,
          log_message.ACTION.VEHICLE_EXCEL_DOWNLOAD
        );
        // Action end

        // create and save excel and send excel file name with path in response
        var conf = {};
        conf.name = "Vehicle List";
        conf.cols = [
          {
            caption: "SR.NO.",
            type: "number",
          },
          {
            caption: "Vehicle ID",
            type: "number",
          },
          {
            caption: "Name",
            type: "string",
          },
        ];
        conf.rows = [];

        var data = JSON.stringify(response.AllActions);
        var jsonObj = JSON.parse(data);

        for (var i = 0; i < jsonObj.length; i++) {
          conf.rows.push([
            i + 1,
            jsonObj[i].autoIncrementID,
            jsonObj[i].type.en,
          ]);
        }

        var result = nodeExcel.execute(conf);
        res.setHeader("Content-Type", "application/vnd.openxmlformats");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "VehicleList.xlsx"
        );
        res.writeHead(200);
        res.end(result, "binary");
      }
    );
  },
  // Promocode API End
  /**
   * Vehicle Module
   */
  ListOfAllVehicles: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                "type.en": regex,
              },
              // {
              //     'minFare': Number(search_value)
              // }, {
              //     'feePerKM': Number(search_value)
              // }
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          VehicleTypeSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          VehicleTypeSchema.find(
            matchObj,
            {
              _id: 1,
              type: 1,
              minFare: 1,
              feePerKM: 1,
              image: 1,
              commission: 1,
              isActive: 1,
              autoIncrementID: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                response.data = poiUsers;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  getVehicleTypeDetails: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("vehicle_id", message.VEHICLE_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get vehicle details */
        function (body, nextCall) {
          VehicleTypeSchema.findOne({
            _id: body.vehicle_id,
          }).exec(function (err, vehicle) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!vehicle) {
              return nextCall({
                message: message.VEHICLE_NOT_FOUND,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.VEHICLE,
                log_message.ACTION.VIEW_VEHICLE +
                  ", VehicleId: " +
                  vehicle.autoIncrementID +
                  ", Type: " +
                  vehicle.type.en
              );
              nextCall(null, vehicle);
            }
          });
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 0,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "", //Add Comment
          data: response,
        });
      }
    );
  },

  addVehicleType: function (req, res) {
    async.waterfall(
      [
        /** get formData */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          if (fields && !fields.type) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }

          nextCall(null, fields, files);
        },
        /** check email and mobile no already registered or not */
        function (fields, files, nextCall) {
          if (fields.type && typeof fields.type == "string") {
            let k = JSON.parse(fields.type);
            fields.type = k;
          }
          nextCall(null, fields, files);
          // VehicleTypeSchema.findOne({
          //     type: fields.type
          // }).exec(function(err, vehicle) {
          //     if (err) {
          //         return nextCall({
          //             "message": message.SOMETHING_WENT_WRONG
          //         })
          //     } else if (vehicle) {
          //         return nextCall({
          //             "message": message.VEHICLE_TYPE_ALREADY_REGISTERED
          //         })
          //     } else {
          //         nextCall(null, fields, files)
          //     }
          // })
        },
        /** upload profile picture */
        function (fields, files, nextCall) {
          if (files.image) {
            // skip files except image files
            if (files.image.type.indexOf("image") === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.image.name);
            var filename = DS.getTime() + extension;
            // let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.VEHICLE_TYPE_PATH + filename;

            async.series(
              [
                // function(nextProc) {
                //     Uploader.thumbUpload({ // upload thumb file
                //         src: files.image.path,
                //         dst: rootPath + '/' + thumb_image,

                //     }, nextProc);
                // },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.image.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.image.path,
                    },
                    nextProc
                  );
                },
              ],
              function (err) {
                if (err) {
                  nextCall(err, fields);
                }
                fields.image = filename;
                nextCall(null, fields);
              }
            );
          } else {
            fields.image = "";
            nextCall(null, fields);
          }
        },
        /** get vehicle auto increment id */
        function (fields, nextCall) {
          _self.getVehicleAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            fields.autoIncrementID = response.vehicleAutoIncrement;
            nextCall(null, fields);
          });
        },
        function (fields, nextCall) {
          console.log('fields',fields);
          let vehicle = new VehicleTypeSchema(fields);
          vehicle.save(function (err, vehicle) {
            if (err) {
              return nextCall({
                message: message.OOPS_SOMETHING_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.VEHICLE,
              log_message.ACTION.ADD_VEHICLE +
                ", VehicleId: " +
                vehicle.autoIncrementID +
                ", Type: " +
                vehicle.type.en
            );
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 0,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.CREATE_VEHICLE_SUCC,
          data: {},
        });
      }
    );
  },

  editVehicleType: function (req, res) {
    async.waterfall(
      [
        /** get formData */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          if (fields && !fields.vehicle_id) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        /** get vehicle details */
        function (fields, files, nextCall) {
          VehicleTypeSchema.findOne({
            _id: fields.vehicle_id,
          }).exec(function (err, vehicle) {
            if (err) {
              console.log('err 1',err );
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!vehicle) {
              return nextCall({
                message: message.VEHICLE_NOT_FOUND,
              });
            } else {
              nextCall(null, fields, files, vehicle);
            }
          });
        },
        /** upload vehicle image */
        function (fields, files, vehicle, nextCall) {
          if (files.image) {
            // skip files except image files
            if (files.image.type.indexOf("image") === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.image.name);
            let filename = DS.getTime() + extension;
            let large_image = CONSTANTS.VEHICLE_TYPE_PATH + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.image.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.image.path,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  // remove old large image
                  if (vehicle.image && vehicle.image != "") {
                    Uploader.remove(
                      {
                        filepath:
                          rootPath +
                          "/" +
                          CONSTANTS.VEHICLE_TYPE_PATH +
                          vehicle.image,
                      },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
              ],
              function (err) {
                if (err) {
                  console.log('err 2',err );
                  nextCall(err, fields);
                }
                fields.image = filename;
                nextCall(null, fields, vehicle);
              }
            );
          } else {
            fields.image = vehicle.image;
            nextCall(null, fields, vehicle);
          }
        },
        /** update vehicle data */
        function (fields, vehicle, nextCall) {
          let updateData = {
            type: fields.type ? JSON.parse(fields.type) : vehicle.type,
            minFare: fields.minFare ? fields.minFare : vehicle.minFare,
            commission: fields.commission ? fields.commission : vehicle.commission,
            feePerKM: fields.feePerKM ? fields.feePerKM : vehicle.feePerKM,
            image: fields.image,
          };
          VehicleTypeSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(fields.vehicle_id),
            },
            {
              $set: updateData,
            },
            {
              new: true,
            },
            function (err, updateData) {
              if (err) {
                console.log('err 3',err );
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.VEHICLE,
                log_message.ACTION.UPDATE_VEHICLE +
                  ", VehicleId: " +
                  updateData.autoIncrementID +
                  ", Type: " +
                  updateData.type.en
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          
          return res.sendToEncode({
            status: 0,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.VEHICLE_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  deleteVehicleType: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("vehicle_id", message.VEHICLE_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get vehicle details */
        function (body, nextCall) {
          VehicleTypeSchema.findOne({
            _id: body.vehicle_id,
          }).exec(function (err, vehicle) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!vehicle) {
              return nextCall({
                message: message.VEHICLE_NOT_FOUND,
              });
            } else {
              nextCall(null, body, vehicle);
            }
          });
        },
        /** update user block status */
        function (body, vehicle, nextCall) {
          VehicleTypeSchema.remove(
            {
              _id: mongoose.Types.ObjectId(body.vehicle_id),
            },
            function (err, deleteData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.VEHICLE,
                log_message.ACTION.DELETE_VEHICLE +
                  ", VehicleId: " +
                  vehicle.autoIncrementID +
                  ", Type: " +
                  vehicle.type.en
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 0,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.VEHICLE_DELETED_SUCC,
          data: {},
        });
      }
    );
  },

  activeInactiveVehicleType: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("vehicle_id", message.VEHICLE_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get vehicle details */
        function (body, nextCall) {
          VehicleTypeSchema.findOne({
            _id: body.vehicle_id,
          }).exec(function (err, vehicle) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!vehicle) {
              return nextCall({
                message: message.VEHICLE_NOT_FOUND,
              });
            } else {
              nextCall(null, body, vehicle);
            }
          });
        },
        /** update vehicle type active status */
        function (body, vehicle, nextCall) {
          VehicleTypeSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.vehicle_id),
            },
            {
              $set: {
                isActive: vehicle.isActive ? false : true,
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
              _self.addActionLog(
                req.user,
                log_message.SECTION.VEHICLE,
                log_message.ACTION.ACTIVE_INACTIVE_VEHICLE +
                  ", VehicleId: " +
                  updateData.autoIncrementID +
                  ", Type: " +
                  updateData.type.en
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.VEHICLE_STATUS_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  /**
   * Billing Plans Module
   */
  listAllBillingPlans: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          var sort = {};
          matchObj.isDeleted = false;
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                "name.en": regex,
              },
              {
                "details.en": regex,
              },
              {
                billingType: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          BillingPlansSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          BillingPlansSchema.find(
            matchObj,
            {
              _id: 1,
              name: 1,
              details: 1,
              chargeAmt: 1,
              billingType: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                response.data = poiUsers;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  getBillingPlanDetails: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody("billing_plan_id", message.BILLING_PLAN_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** check billing plan exist or not */
        function (body, nextCall) {
          BillingPlansSchema.findOne({
            _id: body.billing_plan_id,
          }).exec(function (err, billingPlan) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!billingPlan) {
              return nextCall({
                message: message.BILLING_PLAN_NOT_FOUND,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.BILLING_PLAN,
                log_message.ACTION.VIEW_BILLING_PLAN + billingPlan.name.en
              );
              nextCall(null, billingPlan);
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
          message: message.GET_BILLING_PLAN_SUCC,
          data: response,
        });
      }
    );
  },

  editBillingPlan: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody("billing_plan_id", message.BILLING_PLAN_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get billing plan details */
        function (body, nextCall) {
          BillingPlansSchema.findOne({
            _id: body.billing_plan_id,
          }).exec(function (err, billingPlan) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!billingPlan) {
              return nextCall({
                message: message.BILLING_PLAN_NOT_FOUND,
              });
            } else {
              nextCall(null, body, billingPlan);
            }
          });
        },
        /** update billing plan data */
        function (body, billingPlan, nextCall) {
          let updateData = {
            name: body.name ? body.name : billingPlan.name,
            details: body.details ? body.details : billingPlan.details,
            chargeAmt: body.chargeAmt ? body.chargeAmt : billingPlan.chargeAmt,
            billingType: body.billingType
              ? body.billingType
              : billingPlan.billingType,
          };
          BillingPlansSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.billing_plan_id),
            },
            {
              $set: updateData,
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
              _self.addActionLog(
                req.user,
                log_message.SECTION.BILLING_PLAN,
                log_message.ACTION.UPDATE_BILLING_PLAN + updateData.name.en
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.BILLING_PLAN_UPDATE_SUCC,
          data: {},
        });
      }
    );
  },

  /**
   * Operator Module
   */
  /**
   * Credit Module
   */
  listAllCredits: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          if (req.body.driverId) {
            matchObj.driverId = req.body.driverId;
            matchObj.type = "credit";
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [{}];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          WalletLogsSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          WalletLogsSchema.find(
            matchObj,
            {
              _id: 1,
              driverId: 1,
              amount: 1,
              createdAt: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .populate("creditBy", "first_name last_name type")
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                response.data = poiUsers;
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.CREDIT,
                  log_message.ACTION.LIST_ALL_DRIVER_CREDIT
                );
                nextCall();
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.CREDIT,
                  log_message.ACTION.LIST_ALL_DRIVER_CREDIT
                );
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  getDriverList: function (req, res) {
    //  getDriver list api change by kush

    async.waterfall(
      [
        function (nextCall) {
          DriverSchema.find({}).exec(function (err, drivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, drivers);
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
      }
    );
  },

  addCredit: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driverId", message.DRIVER_ID_REQUIRED).notEmpty();
          req.checkBody("amount", message.AMOUNT_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** insert data into credit logs */
        function (body, nextCall) {
          body.type = "credit";
          body.creditBy = req.user._id;
          let wallet = new WalletLogsSchema(body);
          wallet.save(function (err, insertData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, body);
          });
        },
        /** update driver wallet */
        function (body, nextCall) {
          DriverSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.driverId),
            },
            {
              $inc: {
                creditBalance: Number(body.amount),
              },
            },
            {
              new: true,
            }
          )
            .populate("languageId")
            .exec((err, driverUpdateData) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              nextCall(null, body, driverUpdateData);
            });
        },
        /** Badge Count of notification */
        function (body, driverUpdateData, nextCall) {
          _self.badgeCount(driverUpdateData._id, (isDriver = true), function (
            err,
            totalbadgeCount
          ) {
            if (err) {
              nextCall({ message: err });
            } else {
              totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1;
              nextCall(null, body, driverUpdateData, totalbadgeCount);
            }
          });
        },
        /** Badge Count of notification */
        function (body, driverUpdateData, totalbadgeCount, nextCall) {
          NotificationSchema.count(
            { driverId: driverUpdateData._id, type: "credit", isRead: false },
            function (err, badgeCount) {
              if (err) {
                return nextCall({ message: err });
              } else {
                badgeCount = badgeCount ? badgeCount + 1 : 1;
                return nextCall(
                  null,
                  body,
                  driverUpdateData,
                  totalbadgeCount,
                  badgeCount
                );
              }
            }
          );
        },
        /** Send notification */
        function (
          body,
          driverUpdateData,
          totalbadgeCount,
          badgeCount,
          nextCall
        ) {
          // amount formate in KHR
          const formatter = new Intl.NumberFormat("en-km", {
            style: "currency",
            currency: "KHR",
            minimumFractionDigits: 0,
          });
          try {
            body.amount = formatter.format(body.amount);
          } catch (error) {
            console.log(error);
          }

          let AMOUNT_CREDIT_SUCC;
          if (
            driverUpdateData &&
            driverUpdateData.languageId &&
            driverUpdateData.languageId.code == "km"
          ) {
            AMOUNT_CREDIT_SUCC = COMBODIA_MESSAGES["AMOUNT_CREDIT_SUCC"];
          } else if (
            driverUpdateData &&
            driverUpdateData.languageId &&
            driverUpdateData.languageId.code == "zh"
          ) {
            AMOUNT_CREDIT_SUCC = CHINESE_MESSAGES["AMOUNT_CREDIT_SUCC"];
          } else {
            AMOUNT_CREDIT_SUCC = message["AMOUNT_CREDIT_SUCC"];
          }

          let pushNotificationData = {
            to:
              (driverUpdateData.deviceDetail &&
                driverUpdateData.deviceDetail.token) ||
              "",
            type: "driver",
            data: {
              title: "",
              type: 13,
              body: body.amount + " " + AMOUNT_CREDIT_SUCC,
              badge: totalbadgeCount,
              notificationBadgeCountData: {
                credit: badgeCount,
              },
              tag: "Add Credit",
              data: {},
            },
          };

          pn.fcm(pushNotificationData, function (err, Success) {
            let notificationData = {
              title: pushNotificationData.data.body,
              receiver_type: "driver",
              type: "credit",
              driverId: driverUpdateData._id,
            };
            let Notification = new NotificationSchema(notificationData);
            Notification.save((err, notification) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.CREDIT,
                log_message.ACTION.ADD_CREDIT +
                  ", DriverId: " +
                  driverUpdateData.autoIncrementID +
                  ", Name: " +
                  driverUpdateData.name
              );
              nextCall(null);
            });
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        console.log(message.CREDIT_SUCC);
        return res.sendToEncode({
          status_code: 200,
          message: message.CREDIT_SUCC,
          data: {},
        });
      }
    );
  },

  getBillingPlanWithdraw: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          if (req.body && req.body.type) {
            matchObj.type = "billing_plan_withdraw";
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [{}];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          WalletLogsSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          WalletLogsSchema.find(
            matchObj,
            {
              _id: 1,
              driverId: 1,
              type: 1,
              amount: 1,
              createdAt: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .populate("driverId")
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                response.data = poiUsers;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  /**
   * Emergency Module
   */

  sendNotification: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          let pushNotificationData = {
            to: body.deviceToken,
            message: body.message,
            data: {},
          };
          pn.fcm(pushNotificationData, function (err, Success) {
            if (err) {
              return nextCall({
                message: message.OOPS_SOMETHING_WRONG,
              });
            }
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Notification send successfully.",
          data: {},
        });
      }
    );
  },

  /**
   * Rewards Module
   */
  ListAllRewards: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                phoneNumber: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          RewardSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          RewardSchema.find(
            matchObj,
            {
              // '_id': 1,
              // 'phoneNumber': 1
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                response.data = poiUsers;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  addReward: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          // req.checkBody('name', message.NAME_REQUIRED).notEmpty();
          // req.checkBody('amount', message.AMOUNT_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          } else if (
            (req.body.passengerId !== undefined &&
              req.body.passengerId != "" &&
              req.body.passengerId != null) ||
            (req.body.driverId !== undefined &&
              req.body.driverId != "" &&
              req.body.driverId != null)
          ) {
            nextCall(null, req.body);
          } else {
            return nextCall({
              message: message.USER_ID_REQUIRED,
            });
          }
        },
        /** register reward */
        function (body, nextCall) {
          let rewardData = {};
          if (typeof req.body.name == "string") {
            req.body.name = JSON.parse(req.body.name);
          }
          rewardData.name = req.body.name;

          if (typeof req.body.details == "string") {
            req.body.details = JSON.parse(req.body.details);
          }
          rewardData.details = req.body.details;
          rewardData.amount = req.body.amount;

          if (body.type && body.type == "birthday") {
            rewardData.type = req.body.type;
            rewardData.isExpandable = true;
            rewardData.giftType = req.body.giftType;
          } else {
            rewardData.type = req.body.type;
            rewardData.isExpandable = false;
            rewardData.giftType = req.body.giftType;
            // rewardData.giftName = req.body.giftName;
          }

          if (
            body.passengerId != "" &&
            body.passengerId != null &&
            body.passengerId != ""
          ) {
            rewardData.passengerId = body.passengerId;
            rewardData.isPassenger = true;
          } else if (
            body.driverId != "" &&
            body.driverId != null &&
            body.driverId != ""
          ) {
            rewardData.driverId = body.driverId;
            rewardData.isDriver = true;
          }

          nextCall(null, rewardData);
        },
        /** get reward auto increment id */
        function (rewardData, nextCall) {
          _self.getRewardAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            rewardData.autoIncrementID = response.rewardAutoIncrement;
            nextCall(null, rewardData);
          });
        },
        /** save reward data */
        function (rewardData, nextCall) {
          let reward = new RewardSchema(rewardData);
          reward.save(function (err, insertData) {
            if (err) {
              return nextCall({
                message: message.OOPS_SOMETHING_WRONG,
              });
            }
            nextCall(null, insertData);
          });
        },
        /** check reward cash or other */
        function (insertData, nextCall) {
          if (
            insertData.isDriver &&
            insertData.driverId != "" &&
            insertData.driverId != null
          ) {
            if (insertData.giftType && insertData.giftType == "wallet") {
              DriverSchema.findOneAndUpdate(
                {
                  _id: mongoose.Types.ObjectId(insertData.driverId),
                },
                {
                  $inc: {
                    creditBalance: Number(insertData.amount),
                  },
                }
              )
                .populate("languageId")
                .exec(function (err, driverUpdateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  nextCall(null, insertData, driverUpdateData);
                });
            } else {
              DriverSchema.findOne({
                _id: insertData.driverId,
              })
                .populate("languageId")
                .exec(function (err, driver) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else if (!driver) {
                    return nextCall({
                      message: message.DRIVER_NOT_FOUND,
                    });
                  } else {
                    nextCall(null, insertData, driver);
                  }
                });
            }
          } else if (
            insertData.isPassenger &&
            insertData.passengerId != null &&
            insertData.passengerId != ""
          ) {
            PassengerSchema.findOne({
              _id: insertData.passengerId,
            })
              .populate("languageId")
              .exec(function (err, passenger) {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else if (!passenger) {
                  return nextCall({
                    message: message.PASSENGER_NOT_FOUND,
                  });
                } else {
                  nextCall(null, insertData, passenger);
                }
              });
          } else {
            nextCall({
              message: message.INVALID_PARAMS,
            });
          }
        },
        /** Badge Count of notification */
        function (insertData, driverOrPassengerDetails, nextCall) {
          _self.badgeCount(
            driverOrPassengerDetails._id,
            insertData.isDriver,
            function (err, totalBadgeCount) {
              if (err) {
                nextCall({ message: err });
              } else {
                totalBadgeCount = totalBadgeCount ? totalBadgeCount + 1 : 1;
                nextCall(
                  null,
                  insertData,
                  driverOrPassengerDetails,
                  totalBadgeCount
                );
              }
            }
          );
        },
        function (
          insertData,
          driverOrPassengerDetails,
          totalBadgeCount,
          nextCall
        ) {
          let matchObj = {};
          if (insertData.isDriver) {
            matchObj = {
              driverId: driverOrPassengerDetails._id,
              type: "reward",
              isRead: false,
            };
          } else {
            matchObj = {
              passengerId: driverOrPassengerDetails._id,
              type: "reward",
              isRead: false,
            };
          }
          NotificationSchema.count(matchObj, function (err, badgeCount) {
            if (err) {
              return nextCall({ message: err });
            } else {
              badgeCount = badgeCount ? badgeCount + 1 : 1;
              return nextCall(
                null,
                insertData,
                driverOrPassengerDetails,
                totalBadgeCount,
                badgeCount
              );
            }
          });
        },
        /** Send notification */
        function (
          insertData,
          driverOrPassengerDetails,
          totalBadgeCount,
          badgeCount,
          nextCall
        ) {
          let ADMIN_SEND_REWARD_SUCC;
          if (
            driverOrPassengerDetails &&
            driverOrPassengerDetails.languageId &&
            driverOrPassengerDetails.languageId.code == "km"
          ) {
            ADMIN_SEND_REWARD_SUCC =
              COMBODIA_MESSAGES["ADMIN_SEND_REWARD_SUCC"];
          } else if (
            driverOrPassengerDetails &&
            driverOrPassengerDetails.languageId &&
            driverOrPassengerDetails.languageId.code == "zh"
          ) {
            ADMIN_SEND_REWARD_SUCC = CHINESE_MESSAGES["ADMIN_SEND_REWARD_SUCC"];
          } else {
            ADMIN_SEND_REWARD_SUCC = message["ADMIN_SEND_REWARD_SUCC"];
          }

          let pushNotificationData = {
            to:
              (driverOrPassengerDetails.deviceDetail &&
                driverOrPassengerDetails.deviceDetail.token) ||
              "",
            type: insertData.isDriver ? "driver" : "passenger",
            data: {
              title: "",
              type: insertData.isDriver ? 14 : 15,
              body: ADMIN_SEND_REWARD_SUCC,
              badge: totalBadgeCount,
              notificationBadgeCountData: {
                reward: badgeCount,
              },
              tag: "Reward Ponits",
              data: {},
            },
          };

          pn.fcm(pushNotificationData, function (err, Success) {
            let notificationData = {
              title: pushNotificationData.data.body,
              type: "reward",
              receiver_type: insertData.isDriver ? "driver" : "passenger",
            };
            if (insertData.isDriver) {
              notificationData.driverId = driverOrPassengerDetails._id;
            } else {
              notificationData.passengerId = driverOrPassengerDetails._id;
            }

            let Notification = new NotificationSchema(notificationData);
            Notification.save((err, notification) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              _self.addActionLog(
                req.user,
                log_message.SECTION.REWARD,
                insertData.isDriver
                  ? log_message.ACTION.ADD_REWARD_DRIVER +
                      ", DriverId: " +
                      driverOrPassengerDetails.autoIncrementID +
                      ", Name: " +
                      driverOrPassengerDetails.name
                  : log_message.ACTION.ADD_REWARD_PASSENGER +
                      ", PassengerId: " +
                      driverOrPassengerDetails.autoIncrementID +
                      ", Name: " +
                      driverOrPassengerDetails.name
              );
              nextCall(null);
            });
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.REWARD_CREATE_SUCCESS,
          data: {},
        });
      }
    );
  },

  receiveReward: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("rewardId", message.REWARD_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get reward details */
        function (body, nextCall) {
          RewardSchema.findOne({
            _id: body.rewardId,
          }).exec(function (err, reward) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!reward) {
              return nextCall({
                message: message.REWARD_NOT_FOUND,
              });
            } else if (reward && reward.isReceived) {
              return nextCall({
                message: message.REWARD_ALL_RECEIVED,
              });
            } else {
              nextCall(null, body, reward);
            }
          });
        },
        /** update reward recieve */
        function (body, reward, nextCall) {
          RewardSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.rewardId),
            },
            {
              $set: {
                isReceived: true,
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
              _self.addActionLog(
                req.user,
                log_message.SECTION.REWARD,
                reward.isDriver
                  ? log_message.ACTION.RECEIVE_REWARD_DRIVER +
                      ", RewardId: " +
                      updateData.autoIncrementID
                  : log_message.ACTION.RECEIVE_REWARD_PASSENGER +
                      ", RewardId: " +
                      updateData.autoIncrementID
              );
              nextCall(null);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.REWARD_ACTION_SUCC,
          data: {},
        });
      }
    );
  },

  listDriverReward: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, driver);
            }
          });
        },
        /** get driver reward list */
        function (body, driver, nextCall) {
          var matchObj = {
            driverId: body.driver_id,
          };

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                name: regex,
              },
              {
                details: regex,
              },
              {
                giftType: regex,
              },
              {
                isReceived: regex,
              },
              {
                type: regex,
              },
              {
                amount: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort, driver);
        },
        function (matchObj, sort, driver, nextCall) {
          RewardSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort, driver);
          });
        },
        function (matchObj, sort, driver, nextCall) {
          RewardSchema.find(
            matchObj,
            {
              _id: 1,
              name: 1,
              details: 1,
              giftType: 1,
              isReceived: 1,
              type: 1,
              isExpandable: 1,
              isDriver: 1,
              autoIncrementID: 1,
              createdAt: 1,
              amount: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, rewards) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (rewards.length > 0) {
                response.data = rewards;
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REWARD,
                  log_message.ACTION.VIEW_REWARD_DRIVER +
                    ", DriverId: " +
                    driver.autoIncrementID +
                    ", Name: " +
                    driver.name
                );
                nextCall();
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REWARD,
                  log_message.ACTION.VIEW_REWARD_DRIVER +
                    ", DriverId: " +
                    driver.autoIncrementID +
                    ", Name: " +
                    driver.name
                );
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  listPassengerReward: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, passenger);
            }
          });
        },
        /** get passenger reward list */
        function (body, passenger, nextCall) {
          var matchObj = {
            passengerId: body.passenger_id,
          };

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                name: regex,
              },
              {
                details: regex,
              },
              {
                giftType: regex,
              },
              {
                isReceived: regex,
              },
              {
                type: regex,
              },
              {
                amount: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort, passenger);
        },
        function (matchObj, sort, passenger, nextCall) {
          RewardSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort, passenger);
          });
        },
        function (matchObj, sort, passenger, nextCall) {
          RewardSchema.find(
            matchObj,
            {
              _id: 1,
              name: 1,
              details: 1,
              giftType: 1,
              isReceived: 1,
              type: 1,
              isExpandable: 1,
              isPassenger: 1,
              autoIncrementID: 1,
              createdAt: 1,
              amount: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, rewards) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (rewards.length > 0) {
                response.data = rewards;
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REWARD,
                  log_message.ACTION.VIEW_REWARD_PASSENGER +
                    ", PassengerId: " +
                    passenger.autoIncrementID +
                    ", Name: " +
                    passenger.name
                );
                nextCall();
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REWARD,
                  log_message.ACTION.VIEW_REWARD_PASSENGER +
                    ", PassengerId: " +
                    passenger.autoIncrementID +
                    ", Name: " +
                    passenger.name
                );
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  /** Ride History Module */
  ListAllRideHistory: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            status: {
              $in: ["cancelled", "accepted", "arrived", "onride", "completed"],
            },
          };

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          if (req.body && req.body.driverId) {
            matchObj.driverId = req.body.driverId;
          }
          if (req.body && req.body.passengerId) {
            matchObj.passengerId = req.body.passengerId;
          }

          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                pickupAddress: regex,
              },
              {
                destinationAddress: regex,
              },
              {
                "reasonText.en": regex,
              },
              {
                "reasonText.zh": regex,
              },
              {
                "reasonText.km": regex,
              },
            ];

            matchObj.$or = or;

            if (
              req.body.search &&
              req.body.search.value &&
              !isNaN(req.body.search.value)
            ) {
              matchObj.$or = [
                {
                  rideId: Number(req.body.search.value),
                },
                {
                  toatlFare: Number(req.body.search.value),
                },
                {
                  totalTime: Number(req.body.search.value),
                },
                {
                  toatlDistance: Number(req.body.search.value),
                },
              ];
            }

            if (
              (req.body.search && req.body.search.value == "active") ||
              req.body.search.value == "Active"
            ) {
              matchObj.$or = [
                {
                  status: "accepted",
                },
                {
                  status: "arrived",
                },
                {
                  status: "onride",
                },
              ];
            } else if (
              (req.body.search && req.body.search.value == "cancel") ||
              req.body.search.value == "cancelled"
            ) {
              matchObj.$or = [
                {
                  status: "cancelled",
                },
              ];
            } else if (
              (req.body.search && req.body.search.value == "finish") ||
              req.body.search.value == "finished"
            ) {
              matchObj.$or = [
                {
                  status: "completed",
                },
              ];
            }
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          RideSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          RideSchema.find(
            matchObj,
            {
              _id: 1,
              rideId: 1,
              totalTime: 1,
              status: 1,
              toatlFare: 1,
              toatlDistance: 1,
              pickupAddress: 1,
              destinationAddress: 1,
              createdAt: 1,
              acceptedAt: 1,
              cancelReason: 1,
              passengerId: 1,
              driverId: 1,
              paymentAt: 1,
              updatedAt: 1,
              reasonText: 1,
              cancelBy: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            // .populate('cancelReason')
            .exec(function (err, rideDetails) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (rideDetails.length > 0) {
                response.data = rideDetails;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  getRideDetails: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("ride_id", message.RIDE_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get ride details */
        function (body, nextCall) {
          RideSchema.findOne({
            _id: body.ride_id,
          })
            .populate("driverId")
            .populate("passengerId")
            .populate("requestedVehicleTypeId")
            .exec(function (err, ride) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (!ride) {
                return nextCall({
                  message: message.RIDE_NOT_FOUND,
                });
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.RIDE_HISTORY,
                  log_message.ACTION.VIEW_RIDE_HISTORY +
                    ", RideId: " +
                    ride.rideId
                );
                nextCall(null, ride);
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

  cancelRide: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("ride_id", message.RIDE_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** check ride details */
        function (body, nextCall) {
          RideSchema.findOne({
            _id: body.ride_id,
          }).exec((err, ride) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!ride) {
              return nextCall({
                message: message.RIDE_NOT_FOUND,
              });
            } else {
              nextCall(null, ride);
            }
          });
        },
        /** check ride and driver is valid or not */
        function (ride, nextCall) {
          if (
            ride.status === "requested" ||
            ride.status === "accepted" ||
            ride.status === "arrived" ||
            ride.status === "onride"
          ) {
            let condition = {
              _id: ride._id,
            };
            let reasonText = {
              en: message.RIDE_CANCEL_BY_SYSTEM,
              zh: CHINESE_MESSAGES.RIDE_CANCEL_BY_SYSTEM,
              km: COMBODIA_MESSAGES.RIDE_CANCEL_BY_SYSTEM,
            };
            let updateData = {
              status: "cancelled",
              cancelBy: "system",
              reasonText: reasonText,
            };
            RideSchema.findOneAndUpdate(
              condition,
              {
                $set: updateData,
              },
              {
                new: true,
              }
            ).exec((err, ride) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (!ride) {
                return nextCall({
                  message: message.CANT_ACCEPT_ABLE_TO_ACCEPT_THIS_RIDE_REQUEST,
                });
              } else {
                redisClient.del(
                  `ride.passenger.${ride.passengerId.toString()}`
                );
                redisClient.del(`ride.status.${ride._id.toString()}`);
                if (ride && ride.driverId) {
                  redisClient.del(`ride.driver.${ride.driverId.toString()}`);
                }
                nextCall(null, ride);
              }
            });
          } else {
            return nextCall({
              message: "Ride request has been expired.",
            });
          }
        },
        /** remove driver ride timer */
        function (ride, nextCall) {
          if (ride && !ride.driverId) {
            DriverRideRequestSchema.findOne({
              rideId: ride._id,
              "status.type": {
                $eq: "sent",
              },
            })
              .populate("driverId")
              .sort({
                distance: -1,
              })
              .exec((err, driverRideRequest) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }
                if (
                  driverRideRequest.driverId &&
                  driverRideRequest.driverId._id
                ) {
                  ride.driverId = driverRideRequest.driverId;
                  // _self.sendCancelRideRequestNotificationToDriver(ride)
                }
                nextCall(null, ride);
              });
          } else {
            _self.setDriverFree(ride);
            nextCall(null, ride);
          }
        },
        /** remove driver ride request */
        function (ride, nextCall) {
          DriverRideRequestSchema.remove({
            rideId: ride._id,
          }).exec((err, remveDriverRideRequest) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, ride);
          });
        },
        /** Badge Count of notification */
        function (ride, nextCall) {
          _self.badgeCount(ride.passengerId._id, (isDriver = false), function (
            err,
            totalbadgeCount
          ) {
            if (err) {
              nextCall({ message: err });
            } else {
              totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1;
              nextCall(null, ride, totalbadgeCount);
            }
          });
        },
        /** Badge Count of notification */
        function (ride, totalbadgeCount, nextCall) {
          NotificationSchema.count(
            {
              passengerId: ride.passengerId._id,
              type: "recent_transaction",
              isRead: false,
            },
            function (err, badgeCount) {
              if (err) {
                return nextCall({ message: err });
              } else {
                badgeCount = badgeCount ? badgeCount + 1 : 1;
                return nextCall(null, ride, totalbadgeCount, badgeCount);
              }
            }
          );
        },
        /** send notification to passenger */
        function (ride, totalbadgeCount, badgeCount, nextCall) {
          let condition = {
            _id: ride._id,
          };
          RideSchema.findOne(condition)
            .populate({
              path: "passengerId",
              select: {
                deviceDetail: 1,
              },
              populate: {
                path: "languageId",
              },
            })
            .exec((err, ride) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }

              let RIDE_CANCEL_BY_SYSTEM;
              if (
                ride.passengerId &&
                ride.passengerId.languageId &&
                ride.passengerId.languageId.code == "km"
              ) {
                RIDE_CANCEL_BY_SYSTEM =
                  COMBODIA_MESSAGES["RIDE_CANCEL_BY_SYSTEM"];
              } else if (
                ride.passengerId &&
                ride.passengerId.languageId &&
                ride.passengerId.languageId.code == "zh"
              ) {
                RIDE_CANCEL_BY_SYSTEM =
                  CHINESE_MESSAGES["RIDE_CANCEL_BY_SYSTEM"];
              } else {
                RIDE_CANCEL_BY_SYSTEM = message["RIDE_CANCEL_BY_SYSTEM"];
              }

              let pushNotificationData = {
                to:
                  (ride.passengerId.deviceDetail &&
                    ride.passengerId.deviceDetail.token) ||
                  "",
                type: "passenger",
                data: {
                  title: "",
                  type: 18,
                  body: RIDE_CANCEL_BY_SYSTEM,
                  badge: totalbadgeCount,
                  notificationBadgeCountData: {
                    recent_transaction: badgeCount,
                  },
                  tag: "Ride",
                  data: {
                    rideId: ride._id,
                  },
                },
              };

              pn.fcm(pushNotificationData, function (err, Success) {
                let notificationData = {
                  title: pushNotificationData.data.body,
                  receiver_type: "passenger",
                  passengerId: ride.passengerId._id,
                  rideId: ride._id,
                  type: "recent_transaction",
                };
                let Notification = new NotificationSchema(notificationData);
                Notification.save((err, notification) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  nextCall(null, ride);
                });
              });
            });
        },

        /** Badge Count of notification */
        function (ride, nextCall) {
          _self.badgeCount(ride.driverId._id, (isDriver = true), function (
            err,
            totalbadgeCount
          ) {
            if (err) {
              nextCall({ message: err });
            } else {
              totalbadgeCount = totalbadgeCount ? totalbadgeCount + 1 : 1;
              nextCall(null, ride, totalbadgeCount);
            }
          });
        },
        /** Badge Count of notification */
        function (ride, totalbadgeCount, nextCall) {
          NotificationSchema.count(
            {
              driverId: ride.driverId._id,
              type: "recent_transaction",
              isRead: false,
            },
            function (err, badgeCount) {
              if (err) {
                return nextCall({ message: err });
              } else {
                badgeCount = badgeCount ? badgeCount + 1 : 1;
                return nextCall(null, ride, totalbadgeCount, badgeCount);
              }
            }
          );
        },
        /** send notification to driver */
        function (ride, totalbadgeCount, badgeCount, nextCall) {
          if (ride && ride.driverId) {
            let condition = {
              _id: ride._id,
            };
            RideSchema.findOne(condition)
              .populate({
                path: "driverId",
                select: {
                  deviceDetail: 1,
                },
                populate: {
                  path: "languageId",
                },
              })
              .exec((err, ride) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                }

                let RIDE_CANCEL_BY_SYSTEM;
                if (
                  ride.driverId &&
                  ride.driverId.languageId &&
                  ride.driverId.languageId.code == "km"
                ) {
                  RIDE_CANCEL_BY_SYSTEM =
                    COMBODIA_MESSAGES["RIDE_CANCEL_BY_SYSTEM"];
                } else if (
                  ride.driverId &&
                  ride.driverId.languageId &&
                  ride.driverId.languageId.code == "zh"
                ) {
                  RIDE_CANCEL_BY_SYSTEM =
                    CHINESE_MESSAGES["RIDE_CANCEL_BY_SYSTEM"];
                } else {
                  RIDE_CANCEL_BY_SYSTEM = message["RIDE_CANCEL_BY_SYSTEM"];
                }

                let pushNotificationData = {
                  to:
                    (ride.driverId.deviceDetail &&
                      ride.driverId.deviceDetail.token) ||
                    "",
                  type: "driver",
                  data: {
                    title: "",
                    type: 19,
                    body: RIDE_CANCEL_BY_SYSTEM,
                    badge: totalbadgeCount,
                    notificationBadgeCountData: {
                      recent_transaction: badgeCount,
                    },
                    tag: "Ride",
                    data: {
                      rideId: ride._id,
                    },
                  },
                };

                pn.fcm(pushNotificationData, function (err, Success) {
                  let notificationData = {
                    title: pushNotificationData.data.body,
                    receiver_type: "driver",
                    driverId: ride.driverId._id,
                    rideId: ride._id,
                    type: "recent_transaction",
                  };
                  let Notification = new NotificationSchema(notificationData);
                  Notification.save((err, notification) => {
                    if (err) {
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                    _self.addActionLog(
                      req.user,
                      log_message.SECTION.RIDE_HISTORY,
                      log_message.ACTION.CANCEL_RIDE +
                        ", RideId: " +
                        ride.rideId +
                        ", Reason: " +
                        ride.reasonText.en
                    );
                    nextCall(null);
                  });
                });
              });
          } else {
            _self.addActionLog(
              req.user,
              log_message.SECTION.RIDE_HISTORY,
              log_message.ACTION.CANCEL_RIDE +
                ", RideId: " +
                ride.rideId +
                ", Reason: " +
                ride.reasonText.en
            );
            nextCall(null);
          }
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
          message: message.CANCEL_RIDE_ACTION_SUCC,
          // data: {}
        });
      }
    );
  },

  /** Referral Module Driver */
  listAllDriverReferral: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
            /* 'driverLevel': {
                        $in: [0, 1, 2]
                    } */
          };

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          if (req.body && req.body.isVerified) {
            matchObj.isVerified = true;
          }
          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                uniqueID: regex,
              },
              {
                phoneNumber: regex,
              },
              {
                email: regex,
              },
              {
                name: regex,
              },
              {
                countryCode: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          DriverSchema.find(
            matchObj,
            {
              _id: 1,
              uniqueID: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              dob: 1,
              isBlocked: 1,
              isVerified: 1,
              profilePhoto: 1,
              driverLevel: 1,
              createdAt: 1,
              verifiedDate: 1,
              autoIncrementID: 1,
              creditBalance: 1,
              avgRating: 1,
              verifiedBy: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .populate("verifiedBy")
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  $or: [
                    {
                      driver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      parentDriver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      grandParentDriver: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      greatGrandParentDriver: mongoose.Types.ObjectId(
                        driver._id
                      ),
                    },
                  ],
                },
              });
              // stage 2
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalInvitedCount: {
                    $sum: 1,
                  },
                },
              });
              DriverReferralSchema.aggregate(
                aggregateQuery,
                (err, totalInvitedCountData) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (
                      totalInvitedCountData &&
                      totalInvitedCountData.length > 0
                    ) {
                      driver.totalInvitedCount =
                        totalInvitedCountData[0].totalInvitedCount;
                    } else {
                      driver.totalInvitedCount = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              // response.data = drivers;
              nextCall(null, drivers);
            }
          );
        },
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  driver: mongoose.Types.ObjectId(driver._id),
                },
              });

              aggregateQuery.push({
                $lookup: {
                  from: "driver",
                  localField: "parentDriver",
                  foreignField: "_id",
                  as: "parentDriver",
                },
              });

              aggregateQuery.push({
                $unwind: {
                  path: "$parentDriver",
                  includeArrayIndex: "arrayIndex",
                },
              });
              aggregateQuery.push({
                $group: {
                  _id: null,
                  parentDriver: {
                    $first: "$parentDriver",
                  },
                },
              });
              DriverReferralSchema.aggregate(
                aggregateQuery,
                (err, parentDriver) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (parentDriver && parentDriver.length > 0) {
                      driver.parentDriver = parentDriver[0].parentDriver;
                    } else {
                      driver.parentDriver = {};
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = drivers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  sum: function (items, prop) {
    return items.reduce(function (a, b) {
      return a + b[prop];
    }, 0);
  },

  getDriverReferralDetails: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({ message: error[0].msg });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({ _id: body.driver_id }).exec(function (
            err,
            driver
          ) {
            if (err) {
              return nextCall({ message: message.SOMETHING_WENT_WRONG });
            } else if (!driver) {
              return nextCall({ message: message.DRIVER_NOT_FOUND });
            } else {
              nextCall(null, driver);
            }
          });
        },
        /** get driver referral details */
        function (driver, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              $or: [
                {
                  parentDriver: mongoose.Types.ObjectId(driver._id),
                },
                {
                  grandParentDriver: mongoose.Types.ObjectId(driver._id),
                },
                {
                  greatGrandParentDriver: mongoose.Types.ObjectId(driver._id),
                },
              ],
            },
          });
          aggregateQuery.push({
            $lookup: {
              from: "driver",
              localField: "driver",
              foreignField: "_id",
              as: "driverRef",
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$driverRef",
              includeArrayIndex: "arrayIndex",
            },
          });

          // myEarning, this is the amount that user has earned from the ride that downline user hase done.
          aggregateQuery.push({
            $lookup: {
              from: "driver_referral_earning_logs",
              let: {
                ownUserId: mongoose.Types.ObjectId(driver._id),
                otherDriverId: "$driverRef._id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$beneficiaryDriverId", "$$ownUserId"],
                        },
                        {
                          $eq: ["$driverId", "$$otherDriverId"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "myEarning",
            },
          });

          // aggregateQuery.push({
          //   $group: {
          //     _id: "$driverLevel",
          //     grandParentDriver: {
          //       $first: "$grandParentDriver"
          //     },
          //     referralCode: {
          //       $push: "$referralCode"
          //     },
          //     totalEarning: {
          //       $sum: "$driverRef.earningFromReferral"
          //     },
          //     count: {
          //       $sum: 1
          //     },
          //     myEarning: {
          //       $push: {
          //         $sum: "$myEarning.referralAmount"
          //       }
          //     }
          //   }
          // });
          // aggregateQuery.push({
          //   $project: {
          //     _id: 0,
          //     grandParentDriver: 1,
          //     referralCode: 1,
          //     level: "$_id",
          //     invited: "$count",
          //     earning: "$totalEarning",
          //     myEarning: {
          //       $reduce: {
          //         input: "$myEarning",
          //         initialValue: { sum: 0 },
          //         in: {
          //           sum: { $add: ["$$value.sum", "$$this"] }
          //         }
          //       }
          //     }
          //   }
          // });

          // aggregateQuery.push({
          //     $project: {
          //       _id: 0,
          //       grandParentDriver: 1,
          //       referralCode: 1,
          //       level: 1,
          //       invited: 1,
          //       earning: 1,
          //       myEarning: "$myEarning.sum"
          //     }
          // });

          // aggregateQuery.push({
          //   $sort: {
          //     level: 1
          //   }
          // });

          DriverReferralSchema.aggregate(
            aggregateQuery,
            (err, totalRefEarning) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                // let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;
                let totalInvited = _self.sum(totalRefEarning, "invited");
                // let totalEarning = _self.sum(totalRefEarning, 'earning') + driver.earningFromReferral;
                let totalEarning = driver.earningFromReferral; // 4th nov 19, for now need only user's referral earning to be display

                nextCall(
                  null,
                  driver,
                  totalInvited,
                  totalRefEarning,
                  totalEarning
                );
                // if (driver.driverLevel == 0) {
                //     if (totalRefEarning.length == 1) {
                //         totalRefEarning[0] = {
                //             "level": null,
                //             "invited": null,
                //             "earning": null
                //         }
                //     }
                //     if (totalRefEarning.length == 2) {
                //         // totalRefEarning[1] = {
                //         //     "level": null,
                //         //     "invited": null,
                //         //     "earning": null
                //         // }
                //     }
                //     if (totalRefEarning.length < 3) {
                //         for (let index = totalRefEarning.length; index < 3; index++) {
                //             totalRefEarning.push({
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             })
                //         }
                //     }
                //     // totalRefEarning[2] = {
                //     //     "level": null,
                //     //     "invited": null,
                //     //     "earning": null
                //     // }
                // } else if (driver.driverLevel == 1) {
                //     if (totalRefEarning.length == 1) {
                //         totalRefEarning[0] = {
                //             "level": null,
                //             "invited": null,
                //             "earning": null
                //         }
                //     }
                //     if (totalRefEarning.length < 2) {
                //         for (let index = totalRefEarning.length; index < 2; index++) {
                //             totalRefEarning.push({
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             })
                //         }
                //     }
                //     totalRefEarning[1] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // } else if (driver.driverLevel == 2) {
                //     if (totalRefEarning.length < 1) {
                //         for (let index = totalRefEarning.length; index < 1; index++) {
                //             totalRefEarning.push({
                //                 "level": null,
                //                 "invited": null,
                //                 "earning": null
                //             })
                //         }
                //     }
                //     totalRefEarning[0] = {
                //         "level": null,
                //         "invited": null,
                //         "earning": null
                //     }
                // }

                // var realResponse = {
                //     driver: driver,
                //     invited: totalInvited,
                //     earning: driver.earningFromReferral,
                //     levels: totalRefEarning
                // }
                // _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_DRIVER_REFERRAL_HIERARCY + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                // nextCall(null, realResponse)
              }
            }
          );
        },
        function (
          driver,
          totalInvited,
          totalRefEarning,
          totalEarning,
          nextCall
        ) {
          if (totalRefEarning.length <= 3) {
            nextCall(null, driver, totalInvited, totalRefEarning, totalEarning);
          } else {
            let aggregateQueryInside = [];
            aggregateQueryInside.push({
              $match: {
                greatGrandParentDriver: totalRefEarning[2].grandParentDriver,
                // $or: totalRefEarning[2].referralCode.map((e) => ({
                //   inviteCode: e,
                // })),
              },
            });
            aggregateQueryInside.push({
              $lookup: {
                from: "driver",
                localField: "driver",
                foreignField: "_id",
                as: "driverRef",
              },
            });
            aggregateQueryInside.push({
              $unwind: {
                path: "$driverRef",
                includeArrayIndex: "arrayIndex",
              },
            });
            aggregateQueryInside.push({
              $group: {
                _id: "$driverLevel",
                grandParentDriver: {
                  $first: "$grandParentDriver",
                },
                referralCode: {
                  $push: "$referralCode",
                },
                totalEarning: {
                  $sum: "$driverRef.earningFromReferral",
                },
                count: {
                  $sum: 1,
                },
              },
            });
            aggregateQueryInside.push({
              $project: {
                _id: 0,
                grandParentDriver: 1,
                referralCode: 1,
                level: "$_id",
                invited: "$count",
                earning: "$totalEarning",
              },
            });
            aggregateQueryInside.push({
              $sort: {
                level: 1,
              },
            });
            DriverReferralSchema.aggregate(aggregateQueryInside, function (
              err,
              lastLevelInfo
            ) {
              if (err) {
                return nextCall({ message: message.SOMETHING_WENT_WRONG });
              }
              if (lastLevelInfo.length) {
                totalRefEarning.push(lastLevelInfo[0]);
              }
              nextCall(
                null,
                driver,
                totalInvited,
                totalRefEarning,
                totalEarning
              );
            });
          }
        },
        function (
          driver,
          totalInvited,
          totalRefEarning,
          totalEarning,
          nextCall
        ) {
          // for (let index = 0; index < totalRefEarning.length - 1; index++) {
          //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
          // }

          if (totalRefEarning.length == 2) {
            totalRefEarning.push({
              level: null,
              invited: null,
              earning: null,
            });
          } else if (totalRefEarning.length == 1) {
            totalRefEarning.push(
              {
                level: null,
                invited: null,
                earning: null,
              },
              {
                level: null,
                invited: null,
                earning: null,
              }
            );
          } else if (totalRefEarning.length == 0) {
            totalRefEarning.push(
              {
                level: null,
                invited: null,
                earning: null,
              },
              {
                level: null,
                invited: null,
                earning: null,
              },
              {
                level: null,
                invited: null,
                earning: null,
              }
            );
          }
          var realResponse = {
            driver: driver,
            invited: totalInvited,
            earning: totalEarning,
            levels: totalRefEarning,
          };
          _self.addActionLog(
            req.user,
            log_message.SECTION.REFERRAL_HIERARCY,
            log_message.ACTION.VIEW_DRIVER_REFERRAL_HIERARCY +
              ", DriverId: " +
              driver.autoIncrementID +
              ", Name: " +
              driver.name
          );
          nextCall(null, realResponse);
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
          message: message.GET_DRIVER_DETAILS_SUCC,
          data: response,
        });
      }
    );
  },

  listDriverReferralByLevel: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          req
            .checkBody("driver_level", message.DRIVER_LEVEL_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, driver);
            }
          });
        },
        /** get driver referral details */
        function (body, driver, nextCall) {
          let aggregateQuery = [];
          let matchObj;
          // body.driver_level = 1;
          if (body.driver_level && body.driver_level == 1) {
            matchObj = {
              parentDriver: mongoose.Types.ObjectId(driver._id),
            };
          } else if (body.driver_level && body.driver_level == 2) {
            matchObj = {
              grandParentDriver: mongoose.Types.ObjectId(driver._id),
            };
          } else if (body.driver_level && body.driver_level >= 3) {
            matchObj = {
              greatGrandParentDriver: mongoose.Types.ObjectId(driver._id),
            };
          } else {
            return nextCall({
              message: message.DRIVER_LEVEL_NOT_FOUND,
            });
          }

          if (body.filter && Object.keys(body.filter).length) {
            matchObj["createdAt"] = {
              $gte: body.filter.fromDate,
              $lte: body.filter.toDate,
            };
          }

          aggregateQuery.push({
            $match: matchObj,
          });
          aggregateQuery.push({
            $lookup: {
              from: "driver",
              localField: "driver",
              foreignField: "_id",
              as: "driver",
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$driver",
              includeArrayIndex: "arrayIndex",
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "driver",
              localField: "parentDriver",
              foreignField: "_id",
              as: "parentDriver",
            },
          });

          aggregateQuery.push({
            $unwind: {
              path: "$parentDriver",
              includeArrayIndex: "arrayIndex",
            },
          });

          if (body.search && body.search.value) {
            var search_value = body.search.value;
            var regex = new RegExp(search_value, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  {
                    "driver.uniqueID": regex,
                  },
                  {
                    "driver.phoneNumber": regex,
                  },
                  {
                    "driver.email": regex,
                  },
                  {
                    "driver.name": regex,
                  },
                  {
                    "driver.countryCode": regex,
                  },
                ],
              },
            });
          }

          aggregateQuery.push({
            $sort: {
              "driver.createdAt": -1,
            },
          });

          aggregateQuery.push({
            $facet: {
              paginatedResults: [
                {
                  $skip: body.start || 0,
                },
                {
                  $limit: body.length || 10,
                },
              ],
              totalCount: [
                {
                  $count: "count",
                },
              ],
            },
          });

          DriverReferralSchema.aggregate(
            aggregateQuery,
            (err, driverReferralDetails) => {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (driverReferralDetails.length > 0) {
                response.data = driverReferralDetails[0].paginatedResults;
                if (driverReferralDetails[0].totalCount[0]) {
                  response.recordsTotal =
                    driverReferralDetails[0].totalCount[0].count;
                  response.recordsFiltered =
                    driverReferralDetails[0].totalCount[0].count;
                }

                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REFERRAL_HIERARCY,
                  log_message.ACTION.VIEW_DRIVER_LEVEL +
                    ", DriverId: " +
                    driver.autoIncrementID +
                    ",  Name: " +
                    driver.name
                );
                nextCall(null, response);
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REFERRAL_HIERARCY,
                  log_message.ACTION.VIEW_DRIVER_LEVEL +
                    ", DriverId: " +
                    driver.autoIncrementID +
                    ",  Name: " +
                    driver.name
                );
                nextCall(null, response);
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
        return res.sendToEncode(response);
      }
    );
  },

  /** Referral Module Passenger */
  listAllPassengerReferral: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {
            isDeleted: false,
            // 'passengerLevel': {
            //     $in: [0, 1, 2, 3, 4]
            // }
          };

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                uniqueID: regex,
              },
              {
                name: regex,
              },
              {
                email: regex,
              },
              {
                onlyPhoneNumber: regex,
              },
              {
                countryCode: regex,
              },
            ];
            matchObj.$or = or;
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          PassengerSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          PassengerSchema.find(
            matchObj,
            {
              _id: 1,
              uniqueID: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              dob: 1,
              profilePhoto: 1,
              isBlocked: 1,
              createdAt: 1,
              autoIncrementID: 1,
              passengerLevel: 1,
            },
            {
              limit: Number(req.body.length) || response.recordsTotal,
              skip: Number(req.body.start) || 0,
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, poiUsers) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (poiUsers.length > 0) {
                // response.data = poiUsers;
                nextCall(null, poiUsers);
              } else {
                nextCall(null, []);
              }
            });
        },
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  $or: [
                    {
                      level1Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level2Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level3Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level4Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                    {
                      level5Passenger: mongoose.Types.ObjectId(passenger._id),
                    },
                  ],
                },
              });
              // stage 2
              aggregateQuery.push({
                $group: {
                  _id: null,
                  totalInvitedCount: {
                    $sum: 1,
                  },
                },
              });
              PassengerReferralSchema.aggregate(
                aggregateQuery,
                (err, totalInvitedCountData) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (
                      totalInvitedCountData &&
                      totalInvitedCountData.length > 0
                    ) {
                      passenger.totalInvitedCount =
                        totalInvitedCountData[0].totalInvitedCount;
                    } else {
                      passenger.totalInvitedCount = 0;
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              // response.data = passengers;
              nextCall(null, passengers);
            }
          );
        },
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              // stage 1
              aggregateQuery.push({
                $match: {
                  passenger: mongoose.Types.ObjectId(passenger._id),
                },
              });

              aggregateQuery.push({
                $lookup: {
                  from: "passenger",
                  localField: "level1Passenger",
                  foreignField: "_id",
                  as: "parentPassenger",
                },
              });

              aggregateQuery.push({
                $unwind: {
                  path: "$parentPassenger",
                  includeArrayIndex: "arrayIndex",
                },
              });

              aggregateQuery.push({
                $group: {
                  _id: null,
                  parentPassenger: {
                    $first: "$parentPassenger",
                  },
                },
              });
              PassengerReferralSchema.aggregate(
                aggregateQuery,
                (err, parentPassenger) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    if (parentPassenger && parentPassenger.length > 0) {
                      passenger.parentPassenger =
                        parentPassenger[0].parentPassenger;
                    } else {
                      passenger.parentPassenger = {};
                    }
                    nextObj(null);
                  }
                }
              );
            },
            function (err) {
              response.data = passengers;
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  getPassengerReferralDetails: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              nextCall(null, passenger);
            }
          });
        },
        /** get passenger referral details  */
        function (passenger, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              $or: [
                {
                  level1Passenger: mongoose.Types.ObjectId(passenger._id),
                },
                {
                  level2Passenger: mongoose.Types.ObjectId(passenger._id),
                },
                {
                  level3Passenger: mongoose.Types.ObjectId(passenger._id),
                },
                {
                  level4Passenger: mongoose.Types.ObjectId(passenger._id),
                },
                {
                  level5Passenger: mongoose.Types.ObjectId(passenger._id),
                },
              ],
            },
          });
          aggregateQuery.push({
            $lookup: {
              from: "passenger",
              localField: "passenger",
              foreignField: "_id",
              as: "passengerRef",
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$passengerRef",
              includeArrayIndex: "arrayIndex",
            },
          });

          // myEarning, this is the amount that user has earned from the ride that downline user hase done.
          aggregateQuery.push({
            $lookup: {
              from: "passenger_referral_earning_logs",
              let: {
                ownUserId: mongoose.Types.ObjectId(passenger._id),
                otherPassengerId: "$passengerRef._id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$beneficiaryPassengerId", "$$ownUserId"],
                        },
                        {
                          $eq: ["$passengerId", "$$otherPassengerId"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "myEarning",
            },
          });

          aggregateQuery.push({
            $group: {
              _id: "$passengerLevel",
              level4Passenger: {
                $first: "$level4Passenger",
              },
              referralCode: {
                $push: "$referralCode",
              },
              totalEarning: {
                $sum: "$passengerRef.earningFromReferral",
              },
              count: {
                $sum: 1,
              },
              myEarning: {
                $push: {
                  $sum: "$myEarning.referralAmount",
                },
              },
            },
          });
          aggregateQuery.push({
            $project: {
              _id: 0,
              level: "$_id",
              level4Passenger: 1,
              referralCode: 1,
              invited: "$count",
              earning: "$totalEarning",
              myEarning: {
                $reduce: {
                  input: "$myEarning",
                  initialValue: { sum: 0 },
                  in: {
                    sum: { $add: ["$$value.sum", "$$this"] },
                  },
                },
              },
            },
          });

          aggregateQuery.push({
            $project: {
              _id: 0,
              level: 1,
              level4Passenger: 1,
              referralCode: 1,
              invited: 1,
              earning: 1,
              myEarning: "$myEarning.sum",
            },
          });

          aggregateQuery.push({
            $sort: {
              level: 1,
            },
          });

          PassengerReferralSchema.aggregate(
            aggregateQuery,
            (err, totalRefEarning) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                // let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;
                // for (let index = 0; index < totalRefEarning.length - 1; index++) {
                //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
                // }

                let totalInvited = _self.sum(totalRefEarning, "invited");
                // let totalEarning = _self.sum(totalRefEarning, 'earning') + passenger.earningFromReferral;
                let totalEarning = passenger.earningFromReferral; // 4th nov 19, for now need only user's referral earning to be display
                nextCall(
                  null,
                  passenger,
                  totalRefEarning,
                  totalInvited,
                  totalEarning
                );
              }
            }
          );
        },
        function (
          passenger,
          totalRefEarning,
          totalInvited,
          totalEarning,
          nextCall
        ) {
          // let indexCondition;
          /*  if (passenger.passengerLevel == 0) {
                      // if (totalRefEarning.length == 1) {
                      //     totalRefEarning[0] = {
                      //         "level": null,
                      //         "invited": null,
                      //         "earning": null
                      //     }
                      // }
                      // if (totalRefEarning.length == 2) {
                      //     totalRefEarning[1] = {
                      //         "level": null,
                      //         "invited": null,
                      //         "earning": null
                      //     }
                      // }
                      if (totalRefEarning.length < 5) {
                          for (let index = totalRefEarning.length - 1; index < 5; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                              // totalRefEarning.push({
                              //     "level": null,
                              //     "invited": null,
                              //     "earning": null
                              // })
                          }
                      }
                      totalRefEarning[4] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 1) {
                      if (totalRefEarning.length < 4) {
                          for (let index = totalRefEarning.length - 1; index < 4; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                      totalRefEarning[3] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 2) {
                      if (totalRefEarning.length < 3) {
                          for (let index = totalRefEarning.length - 1; index < 3; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                      totalRefEarning[2] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 3) {
                      if (totalRefEarning.length < 2) {
                          for (let index = totalRefEarning.length - 1; index < 2; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                      totalRefEarning[1] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 4) {
                      if (totalRefEarning.length < 1) {
                          for (let index = totalRefEarning.length - 1; index < 1; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                  }
  */
          // if (totalRefEarning.length < 5) {
          //     for (let index = totalRefEarning.length; index < indexCondition; index++) {
          //         totalRefEarning.push({
          //             "level": null,
          //             "invited": null,
          //             "earning": null
          //         })
          //     }
          // }
          /*var realResponse = {
                    passenger: passenger,
                    invited: totalInvited,
                    earning: passenger.earningFromReferral,
                    user_level: passenger.passengerLevel,
                    levels: totalRefEarning
                }
                _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_PASSENGER_REFERRAL_HIERARCY + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                nextCall(null, realResponse)*/

          if (totalRefEarning.length <= 5) {
            nextCall(
              null,
              passenger,
              totalInvited,
              totalRefEarning,
              totalEarning
            );
          } else {
            let aggregateQueryInside = [];
            aggregateQueryInside.push({
              $match: {
                level5Passenger: totalRefEarning[4].level4Passenger,
                $or: totalRefEarning[4].referralCode.map((e) => ({
                  inviteCode: e,
                })),
              },
            });
            aggregateQueryInside.push({
              $lookup: {
                from: "passenger",
                localField: "passenger",
                foreignField: "_id",
                as: "passengerRef",
              },
            });
            aggregateQueryInside.push({
              $unwind: {
                path: "$passengerRef",
                includeArrayIndex: "arrayIndex",
              },
            });
            aggregateQueryInside.push({
              $group: {
                _id: "$passengerLevel",
                level4Passenger: {
                  $first: "$level4Passenger",
                },
                referralCode: {
                  $push: "$referralCode",
                },
                totalEarning: {
                  $sum: "$passengerRef.earningFromReferral",
                },
                count: {
                  $sum: 1,
                },
              },
            });
            aggregateQueryInside.push({
              $project: {
                _id: 0,
                level4Passenger: 1,
                referralCode: 1,
                level: "$_id",
                invited: "$count",
                earning: "$totalEarning",
              },
            });
            aggregateQueryInside.push({
              $sort: {
                level: 1,
              },
            });
            PassengerReferralSchema.aggregate(aggregateQueryInside, function (
              err,
              lastLevelInfo
            ) {
              if (err) {
                return nextCall({ message: message.SOMETHING_WENT_WRONG });
              }
              if (lastLevelInfo.length) {
                totalRefEarning.push(lastLevelInfo[0]);
              }
              nextCall(
                null,
                passenger,
                totalInvited,
                totalRefEarning,
                totalEarning
              );
            });
          }
        },
        function (
          passenger,
          totalInvited,
          totalRefEarning,
          totalEarning,
          nextCall
        ) {
          // for (let index = 0; index < totalRefEarning.length - 1; index++) {
          //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
          // }
          if (totalRefEarning.length == 4) {
            totalRefEarning.push({
              level: null,
              invited: null,
              earning: null,
            });
          } else if (totalRefEarning.length == 3) {
            for (let index = totalRefEarning.length; index < 5; index++) {
              totalRefEarning[index] = {
                level: null,
                invited: null,
                earning: null,
              };
            }
          } else if (totalRefEarning.length == 2) {
            for (let index = totalRefEarning.length; index < 5; index++) {
              totalRefEarning[index] = {
                level: null,
                invited: null,
                earning: null,
              };
            }
          } else if (totalRefEarning.length == 1) {
            for (let index = totalRefEarning.length; index < 5; index++) {
              totalRefEarning[index] = {
                level: null,
                invited: null,
                earning: null,
              };
            }
          } else if (totalRefEarning.length == 0) {
            totalRefEarning.pop();
            for (let index = totalRefEarning.length; index < 5; index++) {
              totalRefEarning[index] = {
                level: null,
                invited: null,
                earning: null,
              };
            }
          }
          var realResponse = {
            passenger: passenger,
            invited: totalInvited,
            earning: totalEarning,
            user_level: passenger.passengerLevel,
            levels: totalRefEarning,
          };
          _self.addActionLog(
            req.user,
            log_message.SECTION.REFERRAL_HIERARCY,
            log_message.ACTION.VIEW_PASSENGER_REFERRAL_HIERARCY +
              ", PassengerId: " +
              passenger.autoIncrementID +
              ", Name: " +
              passenger.name
          );
          nextCall(null, realResponse);
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
          message: message.GET_PASSENGER_REFERRAL_SUCC,
          data: response,
        });
      }
    );
  },

  listPassengerReferralByLevel: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          req
            .checkBody("passenger_level", message.PASSENGER_LEVEL_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, passenger);
            }
          });
        },
        /** get passenger referral details */
        function (body, passenger, nextCall) {
          let aggregateQuery = [];
          let matchObj;
          // body.passenger_level = 1;
          if (body.passenger_level && body.passenger_level == 1) {
            matchObj = {
              level1Passenger: mongoose.Types.ObjectId(passenger._id),
            };
          } else if (body.passenger_level && body.passenger_level == 2) {
            matchObj = {
              level2Passenger: mongoose.Types.ObjectId(passenger._id),
            };
          } else if (body.passenger_level && body.passenger_level == 3) {
            matchObj = {
              level3Passenger: mongoose.Types.ObjectId(passenger._id),
            };
          } else if (body.passenger_level && body.passenger_level == 4) {
            matchObj = {
              level4Passenger: mongoose.Types.ObjectId(passenger._id),
            };
          } else {
            return nextCall({
              message: message.PASSENGER_LEVEL_NOT_FOUND,
            });
          }

          if (body.filter && Object.keys(body.filter).length) {
            matchObj["createdAt"] = {
              $gte: body.filter.fromDate,
              $lte: body.filter.toDate,
            };
          }

          aggregateQuery.push({
            $match: matchObj,
          });
          aggregateQuery.push({
            $lookup: {
              from: "passenger",
              localField: "passenger",
              foreignField: "_id",
              as: "passenger",
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$passenger",
              includeArrayIndex: "arrayIndex",
            },
          });

          aggregateQuery.push({
            $lookup: {
              from: "passenger",
              localField: "level1Passenger",
              foreignField: "_id",
              as: "parentPassenger",
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$parentPassenger",
              includeArrayIndex: "arrayIndex",
            },
          });

          if (body.search && body.search.value) {
            var search_value = body.search.value;
            var regex = new RegExp(search_value, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  {
                    "passenger.uniqueID": regex,
                  },
                  {
                    "passenger.phoneNumber": regex,
                  },
                  {
                    "passenger.email": regex,
                  },
                  {
                    "passenger.name": regex,
                  },
                  {
                    "passenger.countryCode": regex,
                  },
                ],
              },
            });
          }

          aggregateQuery.push({
            $sort: {
              "passenger.createdAt": -1,
            },
          });

          aggregateQuery.push({
            $facet: {
              paginatedResults: [
                {
                  $skip: body.start || 0,
                },
                {
                  $limit: body.length || 10,
                },
              ],
              totalCount: [
                {
                  $count: "count",
                },
              ],
            },
          });

          PassengerReferralSchema.aggregate(
            aggregateQuery,
            (err, passengerReferralDetails) => {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (passengerReferralDetails.length > 0) {
                response.data = passengerReferralDetails[0].paginatedResults;
                if (passengerReferralDetails[0].totalCount[0]) {
                  response.recordsTotal =
                    passengerReferralDetails[0].totalCount[0].count;
                  response.recordsFiltered =
                    passengerReferralDetails[0].totalCount[0].count;
                }

                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REFERRAL_HIERARCY,
                  log_message.ACTION.VIEW_PASSENGER_LEVEL +
                    ", PassengerId: " +
                    passenger.autoIncrementID +
                    ",  Name: " +
                    passenger.name
                );
                nextCall(null, response);
              } else {
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.REFERRAL_HIERARCY,
                  log_message.ACTION.VIEW_PASSENGER_LEVEL +
                    ", PassengerId: " +
                    passenger.autoIncrementID +
                    ",  Name: " +
                    passenger.name
                );
                nextCall(null, response);
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
        return res.sendToEncode(response);
      }
    );
  },

  /** Referral Earning Withdraw Module */
  getDriverReferralEarning: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      totalReferralRemainingAmount: 0,
      totalReferralCollectedAmount: 0,
      data: [],
    };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver earning details count */
        function (body, nextCall) {
          var matchObj = {
            beneficiaryDriverId: body.driver_id,
          };
          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }
          DriverRefEarningLogSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, body, matchObj);
          });
        },
        /** get driver earning details */
        function (body, matchObj, nextCall) {
          DriverRefEarningLogSchema.find(
            matchObj,
            {},
            {
              limit: Number(body.length) || response.recordsTotal,
              skip: Number(body.start) || 0,
            }
          )
            .populate([
              {
                path: "driverId",
                select: "name uniqueID",
              },
              {
                path: "beneficiaryDriverId",
                select: "name uniqueID",
              },
              {
                path: "rideId",
                select:
                  "rideId paymentAt createdAt pickupAddress destinationAddress",
              },
            ])
            .exec(function (err, totalDriverRefEarningLogs) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                response.data = totalDriverRefEarningLogs;
                nextCall(null, body);
              }
            });
        },
        /** get driver earning remaining withdrawal */
        function (body, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              beneficiaryDriverId: mongoose.Types.ObjectId(body.driver_id),
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalReferralRemainingAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$isWithdrawed", false],
                    },
                    "$referralAmount",
                    0,
                  ],
                },
              },
              totalReferralCollectedAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$isWithdrawed", true],
                    },
                    "$referralAmount",
                    0,
                  ],
                },
              },
            },
          });
          aggregateQuery.push({
            $project: {
              totalReferralRemainingAmount: "$totalReferralRemainingAmount",
              totalReferralCollectedAmount: "$totalReferralCollectedAmount",
            },
          });

          DriverRefEarningLogSchema.aggregate(
            aggregateQuery,
            (err, totalAmount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (totalAmount[0]) {
                response.totalReferralRemainingAmount =
                  totalAmount[0].totalReferralRemainingAmount;
                response.totalReferralCollectedAmount =
                  totalAmount[0].totalReferralCollectedAmount;
                nextCall(null, response);
              } else {
                response.totalReferralRemainingAmount =
                  totalAmount.totalReferralRemainingAmount;
                response.totalReferralCollectedAmount =
                  totalAmount.totalReferralCollectedAmount;
                nextCall(null, response);
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

        _self.addActionLog(
          req.user,
          log_message.SECTION.REFERRAL_EARNING,
          log_message.ACTION.VIEW_DRIVER_REFERRAL_EARNING
        );
        return res.sendToEncode(response);
      }
    );
  },

  driverRefEarningWithdraw: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody(
              "driverRefLogsId",
              message.DRIVER_REF_EARNING_LOG_ID_REQUIRED
            )
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver referral earning log details */
        function (body, nextCall) {
          DriverRefEarningLogSchema.findOne({
            _id: body.driverRefLogsId,
          }).exec(function (err, driverRefEarningLog) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driverRefEarningLog) {
              return nextCall({
                message: message.DRIVER_REF_EARNING_LOG_NOT_FOUND,
              });
            } else if (
              driverRefEarningLog &&
              driverRefEarningLog.isWithdrawed
            ) {
              return nextCall({
                message: message.DRIVER_REF_EARNING_LOG_ALL_RECEIVED,
              });
            } else {
              nextCall(null, body, driverRefEarningLog);
            }
          });
        },
        /** update driverRefEarningLog withdraw */
        function (body, driverRefEarningLog, nextCall) {
          DriverRefEarningLogSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.driverRefLogsId),
            },
            {
              $set: {
                isWithdrawed: true,
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
        },
        /** insert in withdraw logs */
        function (updateData, nextCall) {
          let withdrawData = {
            driverId: updateData.beneficiaryDriverId,
            isDriver: true,
            amount: updateData.referralAmount,
          };

          let withdraw = new WithdrawsSchema(withdrawData);
          withdraw.save(function (err, withdrawData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, updateData);
          });
        },
        /** get driver details */
        function (updateData, nextCall) {
          DriverSchema.findOne({
            _id: updateData.beneficiaryDriverId,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.REFERRAL_EARNING,
                log_message.ACTION.WITHDRAW_DRIVER_EARNING +
                  ", DriverId: " +
                  driver.autoIncrementID +
                  ", Name: " +
                  driver.name
              );
              nextCall(null);
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_REF_EARNING_LOG_ACTION_SUCC,
          data: {},
        });
      }
    );
  },

  driverRefEarWithdrawAll: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("driver_id", message.DRIVER_ID_REQUIRED).notEmpty();
          req.checkBody("total_amount", message.AMOUNT_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOne({
            _id: body.driver_id,
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!driver) {
              return nextCall({
                message: message.DRIVER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, driver);
            }
          });
        },
        /** update driverRefEarningLog withdraw */
        function (body, driver, nextCall) {
          DriverRefEarningLogSchema.updateMany(
            {
              beneficiaryDriverId: mongoose.Types.ObjectId(body.driver_id),
              isWithdrawed: false,
            },
            {
              $set: {
                isWithdrawed: true,
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
              nextCall(null, body, driver);
            }
          );
        },
        /** insert in withdraw logs */
        function (body, driver, nextCall) {
          let withdrawData = {
            driverId: body.driver_id,
            isDriver: true,
            amount: body.total_amount,
          };

          let withdraw = new WithdrawsSchema(withdrawData);
          withdraw.save(function (err, withdrawData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.REFERRAL_EARNING,
              log_message.ACTION.WITHDRAW_ALL_DRIVER_EARNING +
                ", DriverId: " +
                driver.autoIncrementID +
                ", Name: " +
                driver.name
            );
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.DRIVER_REF_EARNING_LOG_ACTION_SUCC,
          // data: {}
        });
      }
    );
  },

  getPassengerReferralEarning: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      totalReferralRemainingAmount: 0,
      totalReferralCollectedAmount: 0,
      data: [],
    };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger earning details count */
        function (body, nextCall) {
          var matchObj = {
            beneficiaryPassengerId: body.passenger_id,
          };
          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          PassengerReferralEarningLogsSchema.count(matchObj, function (
            err,
            count
          ) {
            if (err) {
              return nextCall({
                code: 400,
                status: 400,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, body, matchObj);
          });
        },
        /** get passenger earning details */
        function (body, matchObj, nextCall) {
          PassengerReferralEarningLogsSchema.find(
            matchObj,
            {},
            {
              limit: Number(body.length) || response.recordsTotal,
              skip: Number(body.start) || 0,
            }
          )
            .populate("rideId")
            .exec(function (err, totalPassengerRefEarningLogs) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                response.data = totalPassengerRefEarningLogs;
                nextCall(null, body);
              }
            });
        },
        /** get passenger earning remaining withdrawal */
        function (body, nextCall) {
          let aggregateQuery = [];
          aggregateQuery.push({
            $match: {
              beneficiaryPassengerId: mongoose.Types.ObjectId(
                body.passenger_id
              ),
            },
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalReferralRemainingAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$isWithdrawed", false],
                    },
                    "$referralAmount",
                    0,
                  ],
                },
              },
              totalReferralCollectedAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$isWithdrawed", true],
                    },
                    "$referralAmount",
                    0,
                  ],
                },
              },
            },
          });
          aggregateQuery.push({
            $project: {
              totalReferralRemainingAmount: "$totalReferralRemainingAmount",
              totalReferralCollectedAmount: "$totalReferralCollectedAmount",
            },
          });

          PassengerReferralEarningLogsSchema.aggregate(
            aggregateQuery,
            (err, totalAmount) => {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (totalAmount[0]) {
                response.totalReferralRemainingAmount =
                  totalAmount[0].totalReferralRemainingAmount;
                response.totalReferralCollectedAmount =
                  totalAmount[0].totalReferralCollectedAmount;
                nextCall(null, response);
              } else {
                response.totalReferralRemainingAmount =
                  totalAmount.totalReferralRemainingAmount;
                response.totalReferralCollectedAmount =
                  totalAmount.totalReferralCollectedAmount;
                nextCall(null, response);
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

        _self.addActionLog(
          req.user,
          log_message.SECTION.REFERRAL_EARNING,
          log_message.ACTION.VIEW_PASSENGER_REFERRAL_EARNING
        );
        return res.sendToEncode(response);
      }
    );
  },

  passengerRefEarningWithdraw: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody(
              "passengerRefLogsId",
              message.PASSENGER_REF_EARNING_LOG_ID_REQUIRED
            )
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger referral earning log details */
        function (body, nextCall) {
          PassengerReferralEarningLogsSchema.findOne({
            _id: body.passengerRefLogsId,
          }).exec(function (err, passengerRefEarningLog) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passengerRefEarningLog) {
              return nextCall({
                message: message.PASSENGER_REF_EARNING_LOG_NOT_FOUND,
              });
            } else if (
              passengerRefEarningLog &&
              passengerRefEarningLog.isWithdrawed
            ) {
              return nextCall({
                message: message.PASSENGER_REF_EARNING_LOG_ALL_RECEIVED,
              });
            } else {
              nextCall(null, body, passengerRefEarningLog);
            }
          });
        },
        /** update passengerRefEarningLog withdraw */
        function (body, passengerRefEarningLog, nextCall) {
          PassengerReferralEarningLogsSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(body.passengerRefLogsId),
            },
            {
              $set: {
                isWithdrawed: true,
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
        },
        /** insert in withdraw logs */
        function (updateData, nextCall) {
          let withdrawData = {
            passengerId: updateData.beneficiaryPassengerId,
            amount: updateData.referralAmount,
          };

          let withdraw = new WithdrawsSchema(withdrawData);
          withdraw.save(function (err, withdrawData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null, updateData);
          });
        },
        /** get passenger details */
        function (updateData, nextCall) {
          PassengerSchema.findOne({
            _id: updateData.beneficiaryPassengerId,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.REFERRAL_EARNING,
                log_message.ACTION.WITHDRAW_PASSENGER_EARNING +
                  ", PassengerId: " +
                  passenger.autoIncrementID +
                  ", Name: " +
                  passenger.name
              );
              nextCall(null);
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.PASSENGER_REF_EARNING_LOG_ACTION_SUCC,
          data: {},
        });
      }
    );
  },

  passengerRefEarWithdrawAll: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("passenger_id", message.PASSENGER_ID_REQUIRED)
            .notEmpty();
          req.checkBody("total_amount", message.AMOUNT_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOne({
            _id: body.passenger_id,
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!passenger) {
              return nextCall({
                message: message.PASSENGER_NOT_FOUND,
              });
            } else {
              nextCall(null, body, passenger);
            }
          });
        },
        /** update passengerRefEarningLog withdraw all */
        function (body, passenger, nextCall) {
          PassengerReferralEarningLogsSchema.updateMany(
            {
              beneficiaryPassengerId: mongoose.Types.ObjectId(
                body.passenger_id
              ),
              isWithdrawed: false,
            },
            {
              $set: {
                isWithdrawed: true,
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
              nextCall(null, body, passenger);
            }
          );
        },
        /** insert in withdraw logs */
        function (body, passenger, nextCall) {
          let withdrawData = {
            passengerId: body.passenger_id,
            amount: body.total_amount,
          };

          let withdraw = new WithdrawsSchema(withdrawData);
          withdraw.save(function (err, withdrawData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.REFERRAL_EARNING,
              log_message.ACTION.WITHDRAW_ALL_PASSENGER_EARNING +
                ", PassengerId: " +
                passenger.autoIncrementID +
                ", Name: " +
                passenger.name
            );
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.PASSENGER_REF_EARNING_LOG_ACTION_SUCC,
          // data: {}
        });
      }
    );
  },

  /** Setting Module */
  getSystemSettings: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          SystemSettingsSchema.find(
            {},
            {
              _id: 1,
              uniqueID: 1,
              adminFee: 1,
              driverAutoIncrement: 1,
              passengerAutoIncrement: 1,
              operatorAutoIncrement: 1,
              driverMinimumBalance: 1,
              driverVersionUpdate: 1,
              passengerVersionUpdate: 1,
              fbUrl: 1,
            }
          ).exec(function (err, getSystemSettingData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              _self.addActionLog(
                req.user,
                log_message.SECTION.ADMIN_SETTING,
                log_message.ACTION.GET_SYSTEM_SETTING
              );
              nextCall(null, getSystemSettingData[0]);
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
          message: message.GET_SYSTEM_SETTING_DETAILS_SUCC,
          data: response,
        });
      }
    );
  },

  updateAdminFee: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("admin_fee", message.ADMIN_FEE_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** update admin fee */
        function (body, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getSettingData[0]) {
              let updateData = {
                adminFee: body.admin_fee,
              };
              SystemSettingsSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_ADMIN_FEE
                  );
                  nextCall(null);
                }
              );
            } else {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Admin fee updated successfully',
        });
      }
    );
  },

  updateDriverMinimumBalance: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("minimum_balance", message.MINIMUM_BALANCE_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** update minimum balance */
        function (body, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getSettingData[0]) {
              let updateData = {
                driverMinimumBalance: body.minimum_balance,
              };
              SystemSettingsSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_DRIVER_MINIMUM_BALANCE
                  );
                  nextCall(null);
                }
              );
            } else {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.SYSTEM_SETTING_ACTION_SUCC,
        });
      }
    );
  },

  driverVersionUpdate: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("new_version_ios", message.IOS_VERSION_REQUIRED)
            .notEmpty();
          req
            .checkBody("new_version_android", message.ANDROID_VERSION_REQUIRED)
            .notEmpty();
          req
            .checkBody("force_update", message.FORCE_UPDATE_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** update minimum balance */
        function (body, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getSettingData[0]) {
              let updateData = {
                driverVersionUpdate: {
                  new_version_ios: body.new_version_ios,
                  new_version_android: body.new_version_android,
                  force_update: body.force_update,
                },
              };
              SystemSettingsSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_DRIVER_APP_VERSION
                  );
                  nextCall(null);
                }
              );
            } else {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.SYSTEM_SETTING_ACTION_SUCC,
        });
      }
    );
  },

  passengerVersionUpdate: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody("new_version_ios", message.IOS_VERSION_REQUIRED)
            .notEmpty();
          req
            .checkBody("new_version_android", message.ANDROID_VERSION_REQUIRED)
            .notEmpty();
          req
            .checkBody("force_update", message.FORCE_UPDATE_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** update minimum balance */
        function (body, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getSettingData[0]) {
              let updateData = {
                passengerVersionUpdate: {
                  new_version_ios: body.new_version_ios,
                  new_version_android: body.new_version_android,
                  force_update: body.force_update,
                },
              };
              SystemSettingsSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_PASSENGER_APP_VERSION
                  );
                  nextCall(null);
                }
              );
            } else {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.SYSTEM_SETTING_ACTION_SUCC,
        });
      }
    );
  },

  /** Notification Module */
  sendNotificationToDriver: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          if (!req.body.flag && req.body.flag != "all") {
            req.checkBody("ids", message.DRIVER_IDS_ARRAY_REQUIRED).notEmpty();
          }
          req.checkBody("title", message.TITLE_REQUIRED).notEmpty();
          req.checkBody("message", message.MESSAGE_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** admin a notification to driver or selected driver or all driver */
        function (body, nextCall) {
          if (body.ids && typeof body.ids == "string") {
            body.ids = JSON.parse(body.ids);
          }

          var matchObj = {};
          if (body.flag && body.flag == "all") {
            matchObj = {
              isDeleted: false,
            };
          } else {
            matchObj = {
              isDeleted: false,
              _id: {
                $in: body.ids,
              },
            };
          }

          DriverSchema.find(matchObj, {
            _id: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            autoIncrementID: 1,
            deviceDetail: 1,
          }).exec(function (err, drivers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              var logIds = [];
              async.mapSeries(
                drivers,
                function (driver, nextDriver) {
                  async.waterfall(
                    [
                      function (nextCall) {
                        _self.badgeCount(
                          driver._id,
                          (isDriver = true),
                          function (err, totalBadgeCount) {
                            if (err) {
                              nextCall({ message: err });
                            } else {
                              totalBadgeCount = totalBadgeCount
                                ? totalBadgeCount + 1
                                : 1;
                              nextCall(null, totalBadgeCount);
                            }
                          }
                        );
                      },
                      function (totalBadgeCount, nextCall) {
                        NotificationSchema.count(
                          {
                            driverId: driver._id,
                            type: "notification",
                            isRead: false,
                          },
                          function (err, badgeCount) {
                            if (err) {
                              return nextCall({ message: err });
                            } else {
                              badgeCount = badgeCount ? badgeCount + 1 : 1;
                              return nextCall(
                                null,
                                totalBadgeCount,
                                badgeCount
                              );
                            }
                          }
                        );
                      },
                      function (totalBadgeCount, badgeCount, nextCall) {
                        let pushNotificationData = {
                          to:
                            (driver.deviceDetail &&
                              driver.deviceDetail.token) ||
                            "",
                          type: "driver",
                          data: {
                            title: body.title,
                            type: 16,
                            body: body.message,
                            badge: totalBadgeCount,
                            notificationBadgeCountData: {
                              notification: badgeCount,
                            },
                            tag: "System Notification",
                            data: {},
                          },
                        };
                        nextCall(null, pushNotificationData);
                      },
                      function (pushNotificationData, nextCall) {
                        pn.fcm(pushNotificationData, function (err, Success) {
                          let notificationData = {
                            title: pushNotificationData.data.title,
                            note: pushNotificationData.data.body,
                            receiver_type: "driver",
                            driverId: driver._id,
                          };
                          let Notification = new NotificationSchema(
                            notificationData
                          );
                          Notification.save((err, notification) => {
                            if (err) {
                              return nextCall({
                                message: message.SOMETHING_WENT_WRONG,
                              });
                            }
                            nextCall(null, null);
                          });
                        });
                      },
                    ],
                    function (err, response) {
                      if (err) {
                        nextCall({ message: err });
                      } else {
                        logIds.push(driver._id);
                        nextDriver(null);
                      }
                    }
                  );

                  // var badgeCountResponse = _self.badgeCount(driver._id, isDriver = true)
                  // var badgeCount = badgeCountResponse.badgeCount ? badgeCountResponse.badgeCount + 1 : 0

                  // let pushNotificationData = {
                  //     to: (driver.deviceDetail && driver.deviceDetail.token) || '',
                  //     type: 'driver',
                  //     data: {
                  //         title: body.title,
                  //         type: 16,
                  //         body: body.message,
                  //         badge: badgeCount,
                  //         tag: 'System Notification',
                  //         data: {}
                  //     }
                  // }

                  // pn.fcm(pushNotificationData, function (err, Success) {
                  //     let notificationData = {
                  //         title: pushNotificationData.data.title,
                  //         note: pushNotificationData.data.body,
                  //         receiver_type: 'driver',
                  //         driverId: driver._id
                  //     }
                  //     let Notification = new NotificationSchema(notificationData);
                  //     Notification.save((err, notification) => {
                  //         if (err) {
                  //             return nextCall({
                  //                 "message": message.SOMETHING_WENT_WRONG,
                  //             });
                  //         }
                  //         nextDriver(null)
                  //     })
                  // })
                },
                function (err) {
                  var SEND_NOTIFICATION =
                    log_message.ACTION.SEND_NOTIFICATION_TO_DRIVER;
                  if (body.flag && body.flag == "all") {
                    SEND_NOTIFICATION =
                      log_message.ACTION.SEND_NOTIFICATION_TO_ALL_DRIVER;
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.NOTIFICATION,
                    SEND_NOTIFICATION
                  );
                  nextCall(null, body, logIds);
                }
              );
            }
          });
        },
        /** get notification logs auto increment id */
        function (body, logIds, nextCall) {
          _self.getNotificationLogsAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            body.autoIncrementID = response.notificationLogsAutoIncrement;
            nextCall(null, body, logIds);
          });
        },
        /** add notification logs */
        function (body, logIds, nextCall) {
          let notificationLogsData = {
            autoIncrementID: body.autoIncrementID,
            title: body.title,
            note: body.message,
            receiver_type: "driver",
            ids: logIds,
            type: body.flag && body.flag == "all" ? "bulk" : "individual",
          };
          let NotificationLogs = new NotificationLogsSchema(
            notificationLogsData
          );
          NotificationLogs.save((err, notificationLogs) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.NOTIFICATION_ACTION_SUCC,
        });
      }
    );
  },

  sendNotificationToPassenger: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          if (!req.body.flag && req.body.flag != "all") {
            req
              .checkBody("ids", message.PASSENGER_IDS_ARRAY_REQUIRED)
              .notEmpty();
          }
          req.checkBody("title", message.TITLE_REQUIRED).notEmpty();
          req.checkBody("message", message.MESSAGE_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** admin a notification to passenger or selected passenger or all passenger */
        function (body, nextCall) {
          if (body.ids && typeof body.ids == "string") {
            body.ids = JSON.parse(body.ids);
          }

          if (body.flag && body.flag == "all") {
            var matchObj = {
              isDeleted: false,
            };
          } else {
            var matchObj = {
              isDeleted: false,
              _id: {
                $in: body.ids,
              },
            };
          }

          PassengerSchema.find(matchObj, {
            _id: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            autoIncrementID: 1,
            deviceDetail: 1,
          }).exec(function (err, passengers) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              var logIds = [];
              async.mapSeries(
                passengers,
                function (passenger, nextPassenger) {
                  async.waterfall(
                    [
                      function (nextCall) {
                        _self.badgeCount(
                          passenger._id,
                          (isDriver = false),
                          function (err, totalBadgeCount) {
                            if (err) {
                              nextCall({ message: err });
                            } else {
                              totalBadgeCount = totalBadgeCount
                                ? totalBadgeCount + 1
                                : 1;
                              nextCall(null, totalBadgeCount);
                            }
                          }
                        );
                      },
                      function (totalBadgeCount, nextCall) {
                        NotificationSchema.count(
                          {
                            passengerId: passenger._id,
                            type: "notification",
                            isRead: false,
                          },
                          function (err, badgeCount) {
                            if (err) {
                              return nextCall({ message: err });
                            } else {
                              badgeCount = badgeCount ? badgeCount + 1 : 1;
                              return nextCall(
                                null,
                                totalBadgeCount,
                                badgeCount
                              );
                            }
                          }
                        );
                      },
                      function (totalBadgeCount, badgeCount, nextCall) {
                        let pushNotificationData = {
                          to:
                            (passenger.deviceDetail &&
                              passenger.deviceDetail.token) ||
                            "",
                          type: "passenger",
                          data: {
                            title: body.title,
                            type: 17,
                            body: body.message,
                            badge: totalBadgeCount,
                            notificationBadgeCountData: {
                              notification: badgeCount,
                            },
                            tag: "System Notification",
                            data: {},
                          },
                        };
                        nextCall(null, pushNotificationData);
                      },
                      function (pushNotificationData, nextCall) {
                        pn.fcm(pushNotificationData, function (err, Success) {
                          let notificationData = {
                            title: pushNotificationData.data.title,
                            note: pushNotificationData.data.body,
                            receiver_type: "passenger",
                            passengerId: passenger._id,
                          };
                          let Notification = new NotificationSchema(
                            notificationData
                          );
                          Notification.save((err, notification) => {
                            if (err) {
                              return nextCall({
                                message: message.SOMETHING_WENT_WRONG,
                              });
                            }
                            nextCall(null, null);
                          });
                        });
                      },
                    ],
                    function (err, response) {
                      if (err) {
                        nextCall({ message: err });
                      } else {
                        logIds.push(passenger._id);
                        nextPassenger(null);
                      }
                    }
                  );
                  // var badgeCountResponse = _self.badgeCount(passenger._id, isDriver = false)
                  // console.log("badgeCountResponse", badgeCountResponse)
                  // var badgeCount = badgeCountResponse.badgeCount ? badgeCountResponse.badgeCount + 1 : 0

                  // console.log("before", badgeCount)

                  // let pushNotificationData = {
                  //     to: (passenger.deviceDetail && passenger.deviceDetail.token) || '',
                  //     type: 'passenger',
                  //     data: {
                  //         title: body.title,
                  //         type: 17,
                  //         body: body.message,
                  //         badge: badgeCount,
                  //         tag: 'System Notification',
                  //         data: {}
                  //     }
                  // }

                  // console.log("after", badgeCount)

                  // pn.fcm(pushNotificationData, function (err, Success) {
                  //     let notificationData = {
                  //         title: pushNotificationData.data.title,
                  //         note: pushNotificationData.data.body,
                  //         receiver_type: 'passenger',
                  //         passengerId: passenger._id
                  //     }
                  //     let Notification = new NotificationSchema(notificationData);
                  //     Notification.save((err, notification) => {
                  //         if (err) {
                  //             return nextCall({
                  //                 "message": message.SOMETHING_WENT_WRONG,
                  //             });
                  //         }
                  //         nextPassenger(null)
                  //     })
                  // })
                },
                function (err) {
                  var SEND_NOTIFICATION =
                    log_message.ACTION.SEND_NOTIFICATION_TO_PASSENGER;
                  if (body.flag && body.flag == "all") {
                    SEND_NOTIFICATION =
                      log_message.ACTION.SEND_NOTIFICATION_TO_ALL_PASSENGER;
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.NOTIFICATION,
                    SEND_NOTIFICATION
                  );
                  nextCall(null, body, logIds);
                }
              );
            }
          });
        },
        /** get notification logs auto increment id */
        function (body, logIds, nextCall) {
          _self.getNotificationLogsAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            body.autoIncrementID = response.notificationLogsAutoIncrement;
            nextCall(null, body, logIds);
          });
        },
        /** add notification logs */
        function (body, logIds, nextCall) {
          let notificationLogsData = {
            autoIncrementID: body.autoIncrementID,
            title: body.title,
            note: body.message,
            receiver_type: "passenger",
            ids: logIds,
            type: body.flag && body.flag == "all" ? "bulk" : "individual",
          };
          let NotificationLogs = new NotificationLogsSchema(
            notificationLogsData
          );
          NotificationLogs.save((err, notificationLogs) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.NOTIFICATION_ACTION_SUCC,
        });
      }
    );
  },

  updatefbUrl: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req.checkBody("fbUrl", message.FB_URL_REQUIRED).notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** update admin fee */
        function (body, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (getSettingData[0]) {
              let updateData = {
                fbUrl: body.fbUrl,
              };
              SystemSettingsSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
                },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_FB_URL
                  );
                  nextCall(null);
                }
              );
            } else {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Fb URL updated successfully',
        });
      }
    );
  },

  /** CMS Module */
  updatePrivacyPolicyData: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody("privacy_policy", message.PRIVACY_POLICY_REQUIRED)
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** insert privacyPolicy */
        function (body, nextCall) {
          CMSSchema.find({}).exec(function (err, cmsData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (cmsData[0]) {
              let updateData = {
                privacyPolicy: body.privacy_policy,
              };
              CMSSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
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
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_PRIVACY_POLICY
                  );
                  nextCall(null, updateData);
                }
              );
            } else {
              let cms = new CMSSchema(body);
              cms.save(function (err, insertData) {
                if (err) {
                  return nextCall({
                    message: message.OOPS_SOMETHING_WRONG,
                  });
                }
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.ADMIN_SETTING,
                  log_message.ACTION.ADD_PRIVACY_POLICY
                );
                nextCall(null, insertData);
              });
            }
          });
        },
      ],
      function (err, resopnseData) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.PRIVACY_POLICY_UPDATE_SUCC,
          data: resopnseData,
        });
      }
    );
  },

  updateCallCenterData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          req.checkBody("id", "Call Center Id is requird.").notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          var newData = {};
          CallCenterSchema.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(body.id) },
            {
              termAndCondition: body.termAndCondition,
            },
            { new: true }
          ).exec(function (err, updateCallCenter) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }

            newData = {
              data: updateCallCenter,
            };
            return nextCall(null, newData);
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
          data: response,
          message: "Call Center Updated Successfully.",
        });
      }
    );
  },

  updateTermAndConditionData: function (req, res) {
    async.waterfall(
      [
        /** chek required parameters */
        function (nextCall) {
          req
            .checkBody(
              "term_and_condition",
              message.TERM_AND_CONDITION_REQUIRED
            )
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        /** insert term and condition */
        function (body, nextCall) {
          CMSSchema.find({}).exec(function (err, cmsData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (cmsData[0]) {
              let updateData = {
                termAndCondition: body.term_and_condition,
              };
              CMSSchema.findOneAndUpdate(
                {},
                {
                  $set: updateData,
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
                  _self.addActionLog(
                    req.user,
                    log_message.SECTION.ADMIN_SETTING,
                    log_message.ACTION.UPDATE_TERM_AND_CONDITION
                  );
                  nextCall(null, updateData);
                }
              );
            } else {
              let cms = new CMSSchema(body);
              cms.save(function (err, insertData) {
                if (err) {
                  return nextCall({
                    message: message.OOPS_SOMETHING_WRONG,
                  });
                }
                _self.addActionLog(
                  req.user,
                  log_message.SECTION.ADMIN_SETTING,
                  log_message.ACTION.ADD_TERM_AND_CONDITION
                );
                nextCall(null, insertData);
              });
            }
          });
        },
      ],
      function (err, resopnseData) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.TERM_AND_CONDITION_UPDATE_SUCC,
          data: resopnseData,
        });
      }
    );
  },

  getCMSData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          CMSSchema.find({}).exec(function (err, cmsData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (cmsData[0]) {
              nextCall(null, cmsData);
            } else {
              nextCall({
                message: "CMS data not found.",
              });
            }
          });
        },
      ],
      function (err, resopnseData) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: message.TERM_AND_CONDITION_UPDATE_SUCC,
          data: resopnseData,
        });
      }
    );
  },
  getCallCenterData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          CallCenterSchema.find({}).exec(function (err, cmsData) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if (cmsData[0]) {
              nextCall(null, cmsData);
            } else {
              nextCall({
                resopnseData: "Call Center data not found.",
              });
            }
          });
        },
      ],
      function (err, resopnseData) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }

        return res.sendToEncode({
          status_code: 200,
          message: "Call Center data get successfully.",
          data: resopnseData,
        });
      }
    );
  },
  getCallCenterDataDetails: (req, res) => {
    async.waterfall(
      [
        function (nextCall) {
          CallCenterSchema.findOne()
            .lean()
            .exec(function (err, response) {
              if (err) {
                return nextCall({ message: message.SOMETHING_WENT_WRONG });
              } else {
                return nextCall(null, response);
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
          message: "Call Center data get successfully.",
          data: response,
        });
      }
    );
  },

  /** Logs Module */
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

  ListOfAllActionLog: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                section: regex,
              },
              {
                action: regex,
              },
              {
                userType: regex,
              },
              {
                userName: regex,
              },
            ];
            matchObj.$or = or;
            if (
              req.body.search &&
              req.body.search.value &&
              !isNaN(req.body.search.value)
            ) {
              matchObj.$or = [
                {
                  autoIncrementID: Number(req.body.search.value),
                },
              ];
            }
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          ActionLogsSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          ActionLogsSchema.find(
            matchObj,
            {
              _id: 1,
              section: 1,
              action: 1,
              userType: 1,
              userName: 1,
              autoIncrementID: 1,
              actionAt: 1,
              createdAt: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, actionLogs) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (actionLogs.length > 0) {
                response.data = actionLogs;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  badgeCount: function (id, isDriver, callback) {
    var matchObj = {};
    var response = {};
    if (isDriver) {
      matchObj = {
        driverId: id,
        isRead: false,
      };
    } else {
      matchObj = {
        passengerId: id,
        isRead: false,
      };
    }
    NotificationSchema.count(matchObj).exec(function (err, result) {
      if (err) {
        return callback({ err: err });
      } else {
        return callback(null, result);
      }
    });
    return response;
  },

  //set driver earningFromRide
  setDriverEarningFromRide: function (req, res) {
    async.waterfall(
      [
        /** get all driver */
        function (nextCall) {
          DriverSchema.find({
            isDeleted: false,
          })
            .select("name uniqueID")
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

        /** get top ten driver by driver earning in ride */
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  _id: mongoose.Types.ObjectId(driver._id),
                  isDeleted: false,
                },
              });
              // stage 1
              aggregateQuery.push({
                $lookup: {
                  from: "ride",
                  localField: "_id",
                  foreignField: "driverId",
                  as: "rideRef",
                },
              });
              // stage 2
              aggregateQuery.push({
                $unwind: {
                  path: "$rideRef",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 3
              aggregateQuery.push({
                $match: {
                  "rideRef.status": "completed",
                  "rideRef.paymentStatus": true,
                },
              });
              // stage 4
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  driverEarning: {
                    $sum: "$rideRef.driverEarning",
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
                  let earningFromRide = 0;
                  if (driverEarning[0]) {
                    earningFromRide = driverEarning[0].driverEarning;
                  }

                  // console.log("earningFromRide", earningFromRide)
                  DriverSchema.findOneAndUpdate(
                    {
                      _id: mongoose.Types.ObjectId(driver._id),
                    },
                    {
                      $set: {
                        earningFromRide: Number(earningFromRide),
                      },
                    }
                  ).exec((err, driverUpdate) => {
                    if (err) {
                      return nextCall({
                        message: message.SOMETHING_WENT_WRONG,
                      });
                    }
                    // console.log("driver._id", driver._id)
                    nextObj(null);
                  });
                }
              });
            },
            function (err) {
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Earning from ride updated successfully",
        });
      }
    );
  },

  //set passenger earningFromRide
  setPassengerEarningFromRide: function (req, res) {
    async.waterfall(
      [
        /** get all passenger */
        function (nextCall) {
          PassengerSchema.find({
            isDeleted: false,
          })
            .select("name uniqueID")
            .exec(function (err, passengers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                nextCall(null, passengers);
              }
            });
        },

        /** get top ten driver by driver earning in ride */
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  _id: mongoose.Types.ObjectId(passenger._id),
                  isDeleted: false,
                },
              });
              // stage 1
              aggregateQuery.push({
                $lookup: {
                  from: "ride",
                  localField: "_id",
                  foreignField: "passengerId",
                  as: "rideRef",
                },
              });
              // stage 2
              aggregateQuery.push({
                $unwind: {
                  path: "$rideRef",
                },
              });
              // stage 3
              aggregateQuery.push({
                $match: {
                  "rideRef.status": "completed",
                  "rideRef.paymentStatus": true,
                },
              });
              // stage 4
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  passengerEarning: {
                    $sum: "$rideRef.toatlFare",
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

              PassengerSchema.aggregate(
                aggregateQuery,
                (err, passengerEarning) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let earningFromRide = 0;
                    if (passengerEarning[0]) {
                      earningFromRide = passengerEarning[0].passengerEarning;
                    }

                    // console.log("earningFromRide", earningFromRide)
                    PassengerSchema.findOneAndUpdate(
                      {
                        _id: mongoose.Types.ObjectId(passenger._id),
                      },
                      {
                        $set: {
                          earningFromRide: Number(earningFromRide),
                        },
                      }
                    ).exec((err, passengerUpdate) => {
                      if (err) {
                        return nextCall({
                          message: message.SOMETHING_WENT_WRONG,
                        });
                      }
                      // console.log("passenger._id", passenger._id)
                      nextObj(null);
                    });
                  }
                }
              );
            },
            function (err) {
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Earning from ride updated successfully",
        });
      }
    );
  },

  //set driver totalInvited
  setDrivertotalInvited: function (req, res) {
    async.waterfall(
      [
        /** get all driver */
        function (nextCall) {
          DriverSchema.find({
            isDeleted: false,
          })
            .select("name uniqueID")
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

        /** get top ten driver by driver earning in ride */
        function (drivers, nextCall) {
          async.mapSeries(
            drivers,
            function (driver, nextObj) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  _id: mongoose.Types.ObjectId(driver._id),
                  isDeleted: false,
                },
              });
              // stage 1
              aggregateQuery.push({
                $lookup: {
                  from: "driver_referrals",
                  localField: "_id",
                  foreignField: "parentDriver",
                  as: "parentDriverReferrals",
                },
              });
              // stage 2
              aggregateQuery.push({
                $unwind: {
                  path: "$parentDriverReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 3
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  parentDriverReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$parentDriverReferrals.driverLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 4
              aggregateQuery.push({
                $lookup: {
                  from: "driver_referrals",
                  localField: "_id",
                  foreignField: "grandParentDriver",
                  as: "grandParentReferrals",
                },
              });
              // stage 5
              aggregateQuery.push({
                $unwind: {
                  path: "$grandParentReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 6
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  parentDriverReferralsCount: {
                    $first: "$parentDriverReferralsCount",
                  },
                  grandParentReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$grandParentReferrals.driverLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 7
              aggregateQuery.push({
                $lookup: {
                  from: "driver_referrals",
                  localField: "_id",
                  foreignField: "greatGrandParentDriver",
                  as: "greatGrandParentDriverReferrals",
                },
              });
              // stage 8
              aggregateQuery.push({
                $unwind: {
                  path: "$greatGrandParentDriverReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  parentDriverReferralsCount: {
                    $first: "$parentDriverReferralsCount",
                  },
                  grandParentReferralsCount: {
                    $first: "$grandParentReferralsCount",
                  },
                  greatGrandParentDriverReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: [
                            "$greatGrandParentDriverReferrals.driverLevel",
                            0,
                          ],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 9
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
                  totalInvitedCount: {
                    $add: [
                      "$parentDriverReferralsCount",
                      "$grandParentReferralsCount",
                      "$greatGrandParentDriverReferralsCount",
                    ],
                  },
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

              DriverSchema.aggregate(
                aggregateQuery,
                (err, totalInvitedDrivers) => {
                  if (err) {
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  } else {
                    let totalInvited = 0;
                    if (totalInvitedDrivers[0]) {
                      totalInvited = totalInvitedDrivers[0].totalInvitedCount;
                    }

                    // console.log("earningFromRide", earningFromRide)
                    DriverSchema.findOneAndUpdate(
                      {
                        _id: mongoose.Types.ObjectId(driver._id),
                      },
                      {
                        $set: {
                          totalInvited: Number(totalInvited),
                        },
                      }
                    ).exec((err, driverUpdate) => {
                      if (err) {
                        return nextCall({
                          message: message.SOMETHING_WENT_WRONG,
                        });
                      }
                      // console.log("driver._id", driver._id)
                      nextObj(null);
                    });
                  }
                }
              );
            },
            function (err) {
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Total invited updated successfully",
        });
      }
    );
  },

  //set passenger totalInvited
  setPassengertotalInvited: function (req, res) {
    async.waterfall(
      [
        /** get all passenger */
        function (nextCall) {
          PassengerSchema.find({
            isDeleted: false,
          })
            .select("name uniqueID")
            .exec(function (err, passengers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                nextCall(null, passengers);
              }
            });
        },

        /** get top ten driver by driver earning in ride */
        function (passengers, nextCall) {
          async.mapSeries(
            passengers,
            function (passenger, nextObj) {
              let aggregateQuery = [];
              aggregateQuery.push({
                $match: {
                  _id: mongoose.Types.ObjectId(passenger._id),
                  isDeleted: false,
                },
              });
              // stage 1
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referrals",
                  localField: "_id",
                  foreignField: "level1Passenger",
                  as: "level1PassengerReferrals",
                },
              });
              // stage 2
              aggregateQuery.push({
                $unwind: {
                  path: "$level1PassengerReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 3
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  level1PassengerReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$level1PassengerReferrals.passengerLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 4
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referrals",
                  localField: "_id",
                  foreignField: "level2Passenger",
                  as: "level2PassengerReferrals",
                },
              });
              // stage 5
              aggregateQuery.push({
                $unwind: {
                  path: "$level2PassengerReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 6
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  level1PassengerReferralsCount: {
                    $first: "$level1PassengerReferralsCount",
                  },
                  level2PassengerReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$level2PassengerReferrals.passengerLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 7
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referrals",
                  localField: "_id",
                  foreignField: "level3Passenger",
                  as: "level3PassengerReferrals",
                },
              });
              // stage 8
              aggregateQuery.push({
                $unwind: {
                  path: "$level3PassengerReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 9
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  level1PassengerReferralsCount: {
                    $first: "$level1PassengerReferralsCount",
                  },
                  level2PassengerReferralsCount: {
                    $first: "$level2PassengerReferralsCount",
                  },
                  level3PassengerReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$level3PassengerReferrals.passengerLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 10
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referrals",
                  localField: "_id",
                  foreignField: "level4Passenger",
                  as: "level4PassengerReferrals",
                },
              });
              // stage 11
              aggregateQuery.push({
                $unwind: {
                  path: "$level4PassengerReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 12
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  level1PassengerReferralsCount: {
                    $first: "$level1PassengerReferralsCount",
                  },
                  level2PassengerReferralsCount: {
                    $first: "$level2PassengerReferralsCount",
                  },
                  level3PassengerReferralsCount: {
                    $first: "$level3PassengerReferralsCount",
                  },
                  level4PassengerReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$level4PassengerReferrals.passengerLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 13
              aggregateQuery.push({
                $lookup: {
                  from: "passenger_referrals",
                  localField: "_id",
                  foreignField: "level5Passenger",
                  as: "level5PassengerReferrals",
                },
              });
              // stage 14
              aggregateQuery.push({
                $unwind: {
                  path: "$level5PassengerReferrals",
                  preserveNullAndEmptyArrays: true,
                },
              });
              // stage 15
              aggregateQuery.push({
                $group: {
                  _id: "$_id",
                  level1PassengerReferralsCount: {
                    $first: "$level1PassengerReferralsCount",
                  },
                  level2PassengerReferralsCount: {
                    $first: "$level2PassengerReferralsCount",
                  },
                  level3PassengerReferralsCount: {
                    $first: "$level3PassengerReferralsCount",
                  },
                  level4PassengerReferralsCount: {
                    $first: "$level4PassengerReferralsCount",
                  },
                  level5PassengerReferralsCount: {
                    $sum: {
                      $cond: {
                        if: {
                          $gt: ["$level5PassengerReferrals.passengerLevel", 0],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
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
              // stage 16
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
                  totalInvitedCount: {
                    $add: [
                      "$level1PassengerReferralsCount",
                      "$level2PassengerReferralsCount",
                      "$level3PassengerReferralsCount",
                      "$level4PassengerReferralsCount",
                      "$level5PassengerReferralsCount",
                    ],
                  },
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
                    let totalInvited = 0;
                    if (totalPassengerInviteData[0]) {
                      totalInvited =
                        totalPassengerInviteData[0].totalInvitedCount;
                    }

                    PassengerSchema.findOneAndUpdate(
                      {
                        _id: mongoose.Types.ObjectId(passenger._id),
                      },
                      {
                        $set: {
                          totalInvited: Number(totalInvited),
                        },
                      }
                    ).exec((err, passengerUpdate) => {
                      if (err) {
                        return nextCall({
                          message: message.SOMETHING_WENT_WRONG,
                        });
                      }
                      // console.log("passenger._id", passenger._id)
                      nextObj(null);
                    });
                  }
                }
              );
            },
            function (err) {
              nextCall();
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Total invited updated successfully",
        });
      }
    );
  },

  /** Notification Logs Module */
  ListOfAllNotificationLogs: function (req, res) {
    var response = {
      draw: req.body.draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    };
    async.waterfall(
      [
        function (nextCall) {
          var matchObj = {};

          if (req.body.filter && Object.keys(req.body.filter).length) {
            matchObj["createdAt"] = {
              $gte: req.body.filter.fromDate,
              $lte: req.body.filter.toDate,
            };
          }

          var sort = {};
          if (req.body.order && req.body.order.length > 0) {
            req.body.order = req.body.order[0];
            sort[req.body.columns[req.body.order.column].data] =
              req.body.order.dir === "asc" ? 1 : -1;
          }
          if (req.body.search && req.body.search.value) {
            var search_value = req.body.search.value;
            var regex = new RegExp(search_value, "i");
            var or = [
              {
                title: regex,
              },
              {
                note: regex,
              },
              {
                receiver_type: regex,
              },
              {
                type: regex,
              },
            ];
            matchObj.$or = or;
            if (
              req.body.search &&
              req.body.search.value &&
              !isNaN(req.body.search.value)
            ) {
              matchObj.$or = [
                {
                  autoIncrementID: Number(req.body.search.value),
                },
              ];
            }
          }
          nextCall(null, matchObj, sort);
        },
        function (matchObj, sort, nextCall) {
          NotificationLogsSchema.count(matchObj, function (err, count) {
            if (err) {
              return nextCall({
                code: 400,
                status: 0,
                message: message.NO_DATA_FOUND,
              });
            }
            response.recordsTotal = count;
            response.recordsFiltered = count;
            nextCall(null, matchObj, sort);
          });
        },
        function (matchObj, sort, nextCall) {
          NotificationLogsSchema.find(
            matchObj,
            {
              _id: 1,
              autoIncrementID: 1,
              title: 1,
              note: 1,
              receiver_type: 1,
              ids: 1,
              type: 1,
              createdAt: 1,
            },
            {
              limit: Number(req.body.length),
              skip: Number(req.body.start),
            }
          )
            .sort(sort)
            .lean()
            .exec(function (err, notificationLogs) {
              if (err) {
                return nextCall({
                  error: err,
                  status_code: 0,
                  message: message.SOMETHING_WENT_WRONG,
                  error: err,
                });
              } else if (notificationLogs.length > 0) {
                response.data = notificationLogs;
                nextCall();
              } else {
                nextCall();
              }
            });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode(err);
        }
        res.sendToEncode(response);
      }
    );
  },

  sendNotificationFromNotificationLogs: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody(
              "notificationLog_id",
              message.NOTIFICATION_LOG_ID_REQUIRED
            )
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          NotificationLogsSchema.findOne({
            _id: mongoose.Types.ObjectId(body.notificationLog_id),
          }).exec(function (err, notificationLog) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!notificationLog) {
              return nextCall({
                message: message.NOTIFICATION_LOG_NOT_FOUND,
              });
            } else {
              nextCall(null, notificationLog);
            }
          });
        },
        /** admin send notification to driver or selected driver or all driver */
        function (notificationLog, nextCall) {
          var matchObj = {
            isDeleted: false,
            _id: {
              $in: notificationLog.ids,
            },
          };

          if (
            notificationLog.receiver_type &&
            notificationLog.receiver_type == "driver"
          ) {
            DriverSchema.find(matchObj, {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              autoIncrementID: 1,
              deviceDetail: 1,
            }).exec(function (err, drivers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                var logIds = [];
                async.mapSeries(
                  drivers,
                  function (driver, nextDriver) {
                    async.waterfall(
                      [
                        function (nextCall) {
                          _self.badgeCount(
                            driver._id,
                            (isDriver = true),
                            function (err, totalBadgeCount) {
                              if (err) {
                                nextCall({ message: err });
                              } else {
                                totalBadgeCount = totalBadgeCount
                                  ? totalBadgeCount + 1
                                  : 1;
                                nextCall(null, totalBadgeCount);
                              }
                            }
                          );
                        },
                        function (totalBadgeCount, nextCall) {
                          NotificationSchema.count(
                            {
                              driverId: driver._id,
                              type: "notification",
                              isRead: false,
                            },
                            function (err, badgeCount) {
                              if (err) {
                                return nextCall({ message: err });
                              } else {
                                badgeCount = badgeCount ? badgeCount + 1 : 1;
                                return nextCall(
                                  null,
                                  totalBadgeCount,
                                  badgeCount
                                );
                              }
                            }
                          );
                        },
                        function (totalBadgeCount, badgeCount, nextCall) {
                          let pushNotificationData = {
                            to:
                              (driver.deviceDetail &&
                                driver.deviceDetail.token) ||
                              "",
                            type: notificationLog.receiver_type,
                            data: {
                              title: notificationLog.title,
                              type: 16,
                              body: notificationLog.note,
                              badge: totalBadgeCount,
                              notificationBadgeCountData: {
                                notification: badgeCount,
                              },
                              tag: "System Notification",
                              data: {},
                            },
                          };
                          nextCall(null, pushNotificationData);
                        },
                        function (pushNotificationData, nextCall) {
                          pn.fcm(pushNotificationData, function (err, Success) {
                            let notificationData = {
                              title: pushNotificationData.data.title,
                              note: pushNotificationData.data.body,
                              receiver_type: notificationLog.receiver_type,
                              driverId: driver._id,
                            };
                            let Notification = new NotificationSchema(
                              notificationData
                            );
                            Notification.save((err, notification) => {
                              if (err) {
                                return nextCall({
                                  message: message.SOMETHING_WENT_WRONG,
                                });
                              }
                              nextCall(null, null);
                            });
                          });
                        },
                      ],
                      function (err, response) {
                        if (err) {
                          nextCall({ message: err });
                        } else {
                          logIds.push(driver._id);
                          nextDriver(null);
                        }
                      }
                    );
                  },
                  function (err) {
                    var SEND_NOTIFICATION =
                      log_message.ACTION.SEND_NOTIFICATION_TO_DRIVER;
                    if (
                      notificationLog.type &&
                      notificationLog.type == "bulk"
                    ) {
                      SEND_NOTIFICATION =
                        log_message.ACTION.SEND_NOTIFICATION_TO_ALL_DRIVER;
                    }
                    _self.addActionLog(
                      req.user,
                      log_message.SECTION.NOTIFICATION,
                      SEND_NOTIFICATION
                    );
                    nextCall(null, notificationLog, logIds);
                  }
                );
              }
            });
          } else if (
            notificationLog.receiver_type &&
            notificationLog.receiver_type == "passenger"
          ) {
            PassengerSchema.find(matchObj, {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              autoIncrementID: 1,
              deviceDetail: 1,
            }).exec(function (err, passengers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                var logIds = [];
                async.mapSeries(
                  passengers,
                  function (passenger, nextPassenger) {
                    async.waterfall(
                      [
                        function (nextCall) {
                          _self.badgeCount(
                            passenger._id,
                            (isDriver = false),
                            function (err, totalBadgeCount) {
                              if (err) {
                                nextCall({ message: err });
                              } else {
                                totalBadgeCount = totalBadgeCount
                                  ? totalBadgeCount + 1
                                  : 1;
                                nextCall(null, totalBadgeCount);
                              }
                            }
                          );
                        },
                        function (totalBadgeCount, nextCall) {
                          NotificationSchema.count(
                            {
                              passengerId: passenger._id,
                              type: "notification",
                              isRead: false,
                            },
                            function (err, badgeCount) {
                              if (err) {
                                return nextCall({ message: err });
                              } else {
                                badgeCount = badgeCount ? badgeCount + 1 : 1;
                                return nextCall(
                                  null,
                                  totalBadgeCount,
                                  badgeCount
                                );
                              }
                            }
                          );
                        },
                        function (totalBadgeCount, badgeCount, nextCall) {
                          let pushNotificationData = {
                            to:
                              (passenger.deviceDetail &&
                                passenger.deviceDetail.token) ||
                              "",
                            type: notificationLog.receiver_type,
                            data: {
                              title: notificationLog.title,
                              type: 17,
                              body: notificationLog.note,
                              badge: totalBadgeCount,
                              notificationBadgeCountData: {
                                notification: badgeCount,
                              },
                              tag: "System Notification",
                              data: {},
                            },
                          };
                          nextCall(null, pushNotificationData);
                        },
                        function (pushNotificationData, nextCall) {
                          pn.fcm(pushNotificationData, function (err, Success) {
                            let notificationData = {
                              title: pushNotificationData.data.title,
                              note: pushNotificationData.data.body,
                              receiver_type: notificationLog.receiver_type,
                              passengerId: passenger._id,
                            };
                            let Notification = new NotificationSchema(
                              notificationData
                            );
                            Notification.save((err, notification) => {
                              if (err) {
                                return nextCall({
                                  message: message.SOMETHING_WENT_WRONG,
                                });
                              }
                              nextCall(null, null);
                            });
                          });
                        },
                      ],
                      function (err, response) {
                        if (err) {
                          nextCall({ message: err });
                        } else {
                          logIds.push(passenger._id);
                          nextPassenger(null);
                        }
                      }
                    );
                  },
                  function (err) {
                    var SEND_NOTIFICATION =
                      log_message.ACTION.SEND_NOTIFICATION_TO_PASSENGER;
                    if (
                      notificationLog.type &&
                      notificationLog.type == "bulk"
                    ) {
                      SEND_NOTIFICATION =
                        log_message.ACTION.SEND_NOTIFICATION_TO_ALL_PASSENGER;
                    }
                    _self.addActionLog(
                      req.user,
                      log_message.SECTION.NOTIFICATION,
                      SEND_NOTIFICATION
                    );
                    nextCall(null, notificationLog, logIds);
                  }
                );
              }
            });
          } else {
            return nextCall({
              message: message.SOMETHING_WENT_WRONG,
            });
          }
        },
        /** get notification logs auto increment id */
        function (notificationLog, logIds, nextCall) {
          _self.getNotificationLogsAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            notificationLog.autoIncrementID =
              response.notificationLogsAutoIncrement;
            nextCall(null, notificationLog, logIds);
          });
        },
        /** add notification logs */
        function (notificationLog, logIds, nextCall) {
          let notificationLogsData = {
            autoIncrementID: notificationLog.autoIncrementID,
            title: notificationLog.title,
            note: notificationLog.note,
            receiver_type: notificationLog.receiver_type,
            ids: logIds,
            type: notificationLog.type,
          };
          let NotificationLogs = new NotificationLogsSchema(
            notificationLogsData
          );
          NotificationLogs.save((err, notificationLogs) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            nextCall(null);
          });
        },
      ],
      function (err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: message.NOTIFICATION_ACTION_SUCC,
        });
      }
    );
  },

  getNotificationLogsUserList: function (req, res) {
    // var response = {
    //     "draw": req.body.draw,
    //     "recordsTotal": 0,
    //     "recordsFiltered": 0,
    //     "data": []
    // };
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          req
            .checkBody(
              "notificationLog_id",
              message.NOTIFICATION_LOG_ID_REQUIRED
            )
            .notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          }
          nextCall(null, req.body);
        },
        function (body, nextCall) {
          NotificationLogsSchema.findOne({
            _id: mongoose.Types.ObjectId(body.notificationLog_id),
          }).exec(function (err, notificationLog) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!notificationLog) {
              return nextCall({
                message: message.NOTIFICATION_LOG_NOT_FOUND,
              });
            } else {
              nextCall(null, notificationLog);
            }
          });
        },
        /** admin send notification to driver or selected driver or all driver */
        function (notificationLog, nextCall) {
          var matchObj = {
            isDeleted: false,
            _id: {
              $in: notificationLog.ids,
            },
          };

          if (
            notificationLog.receiver_type &&
            notificationLog.receiver_type == "driver"
          ) {
            DriverSchema.find(matchObj, {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              autoIncrementID: 1,
              // 'deviceDetail': 1
            }).exec(function (err, drivers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                nextCall(null, drivers);
              }
            });
          } else if (
            notificationLog.receiver_type &&
            notificationLog.receiver_type == "passenger"
          ) {
            PassengerSchema.find(matchObj, {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              autoIncrementID: 1,
              // 'deviceDetail': 1
            }).exec(function (err, passengers) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else {
                nextCall(null, passengers);
              }
            });
          } else {
            return nextCall({
              message: message.SOMETHING_WENT_WRONG,
            });
          }
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
          data: response,
        });
      }
    );
  },

  //** Created by arpit patel */
  createNotification: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (
            (fields && !fields.title) ||
            !fields.description ||
            !fields.type
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, fields, files);
          }
        },
        function (fields, files, nextCall) {
          if (files.media) {
            // skip files except image files
            // if (files.profilePhoto.type.indexOf('image') === -1) {
            //   return nextFile(null, null);
            // }
            if (fields.type != "image") {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let url_video =  '/uploads/notification_video/'+filename; //  CONSTANTS.NOTIFICATION_VIDEO + filename;
              console.log('path',rootPath + "/" + url_video);

              async.series(
                [
                  function (nextProc) {
                    Uploader.uploadVideo(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + url_video,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  console.log('err',err);
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            } else {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let thumb_image = CONSTANTS.NOTIFICATION_MEDIA_THUMB + filename;
              let large_image = CONSTANTS.NOTIFICATION_MEDIA_LARGE + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.thumbUpload(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + thumb_image,
                      },
                      nextProc
                    );
                  },
                  function (nextProc) {
                    Uploader.largeUpload(
                      {
                        // upload large file
                        src: files.media.path,
                        dst: rootPath + "/" + large_image,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            }
          } else {
            nextCall(null, fields);
          }
        },
        function (fields, nextCall) {
          let notificationData = {
            title: fields.title,
            description: fields.description,
            type: fields.type,
            status: fields.status,
            media: fields.media ? fields.media : "",
          };

          let newNotification = new NotificationNewSchema(notificationData);
          newNotification.save(function (err, response) {
            console.log(err);
            console.log(response);
            if (err) {
              return nextCall({ message: "Notification not added" });
            } else {
              return nextCall(null, response);
            }
          });
        },
      ],
      function (err, response) {
        console.log(err);
        console.log(response);
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Notification Added",
          data: response,
        });
      }
    );
  },

  updateNotification: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (
            (fields && !fields.title) ||
            !fields.description ||
            !fields.type ||
            !fields.notificationId
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, fields, files);
          }
        },
        function (fields, files, nextCall) {
          if (files.media ) {
            // skip files except image files
            // if (files.profilePhoto.type.indexOf('image') === -1) {
            //   return nextFile(null, null);
            // }

            if (fields.type === "image" && fields.removeMedia ) {
              Uploader.remove({
                filepath:
                  rootPath +
                  "/" +
                  CONSTANTS.NOTIFICATION_MEDIA_THUMB +
                  fields.removeMedia,
              });

              Uploader.remove({
                filepath:
                  rootPath +
                  "/uploads/notification_video/" +
                  fields.removeMedia,
              });
            } else {
              if (fields.removeMedia && fields.removeMedia ) {
                Uploader.remove({
                  filepath:
                    rootPath +
                    "/uploads/notification_video/"+
                    fields.removeMedia,
                });
              }
            }

            if (fields.type != "image") {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let url_video = "/uploads/notification_video/" + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.uploadVideo(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + url_video,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            } else {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let thumb_image = CONSTANTS.NOTIFICATION_MEDIA_THUMB + filename;
              let large_image = CONSTANTS.NOTIFICATION_MEDIA_LARGE + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.thumbUpload(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + thumb_image,
                      },
                      nextProc
                    );
                  },
                  function (nextProc) {
                    Uploader.largeUpload(
                      {
                        // upload large file
                        src: files.media.path,
                        dst: rootPath + "/" + large_image,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            }
          } else {
            nextCall(null, fields);
          }
        },
        function (fields, nextCall) {
          let notificationData = {
            title: fields.title,
            description: fields.description,
            type: fields.type,
            status: fields.status,
            ...(fields.media && {media : fields.media}), // media: fields.media ? fields.media : "",
          };

          if(fields.type === 'text')
          {
            notificationData.media = '';
          }

          // let newNotification = new NotificationNewSchema(notificationData);
          NotificationNewSchema.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(fields.notificationId) },
            notificationData,
            {
              new: true,
            },
            function (err, response) {
              console.log(err);
              console.log(response);
              if (err) {
                return nextCall({ message: "Notification not updated" });
              } else {
                return nextCall(null, response);
              }
            }
          );
        },
      ],
      function (err, response) {
        console.log(err);
        console.log(response);
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Notification Updated",
          data: response,
        });
      }
    );
  },

  getAllNotificationList: (req, res) => {
    async.waterfall(
      [
        /** get All User Group*/
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
            // matchObj.createdAt = { $gte: new Date(tempDate) };
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ title: re }, { descrition: re }, { type: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $facet: {
              notificationList: [
                {
                  $skip: Number(req.query.skip) || 0,
                },
                {
                  $limit: Number(req.query.limit) || 100,
                },
              ],
              notificationCount: [
                {
                  $count: "totalCount",
                },
              ],
            },
          });
          NotificationNewSchema.aggregate(
            aggregateQuery,
            (err, allNotificationList) => {
              if (err) {
                return nextCall({
                  message: message.NO_DATA_FOUND,
                });
              } else {
                let response = {
                  data: allNotificationList,
                  notification_media_thumb_url:
                    CONSTANTS.NOTIFICATION_MEDIA_THUMB,
                  notification_media_large_url:
                    CONSTANTS.NOTIFICATION_MEDIA_LARGE,
                };
                // let responseData = {};
                // responseData.notificationList = allNotificationList;
                nextCall(null, response);
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
          message: "Get Notification list successfully",
          data: response,
        });
      }
    );
  },
  getAllNotificationListPDF: (req, res) => {
    async.waterfall(
      [
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ title: re }, { descrition: re }, { type: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          NotificationNewSchema.aggregate(
            aggregateQuery,
            (err, allNotificationList) => {
              if (err) {
                return nextCall({
                  message: message.NO_DATA_FOUND,
                });
              } else {
                let response = {
                  data: allNotificationList,
                  notification_media_thumb_url:
                    CONSTANTS.NOTIFICATION_MEDIA_THUMB,
                  notification_media_large_url:
                    CONSTANTS.NOTIFICATION_MEDIA_LARGE,
                };
                nextCall(null, response);
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
          message: "Get Notification List successfully.",
          data: response,
        });
      }
    );
  },

  getNotificationDetails: (req, res) => {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          if (!req.query.notificationId) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, req.query.notificationId);
          }
        },
        function (notificationId, nextCall) {
          NotificationNewSchema.findOne({
            _id: mongoose.Types.ObjectId(notificationId),
          })
            .lean()
            .exec(function (err, response) {
              if (err) {
                return nextCall({ message: message.SOMETHING_WENT_WRONG });
              } else {
                return nextCall(null, response);
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
          message: "Notification Details",
          data: response,
        });
      }
    );
  },

  getPassengerListFromNotification: async function (req, res) {
    let notificationDetails = await NotificationNewSchema.findOne({
      _id: mongoose.Types.ObjectId(req.query.notificationId),
    });
    let ids = [];
    if (notificationDetails === null) {
      return res.sendToEncode({
        status: 400,
        message: message.SOMETHING_WENT_WRONG,
      });
    } else {
      let notificationLog = await NotificationLogsNewSchema.findOne({
        receiver_type: "passenger",
        notificationId: mongoose.Types.ObjectId(req.query.notificationId),
      }).lean();
      if (notificationLog === null) {
        let logData = {
          notificationId: mongoose.Types.ObjectId(req.query.notificationId),
          receiver_type: "passenger",
        };
        let newNotificationLog = new NotificationLogsNewSchema(logData);
        let newNotificationLogDetils = await newNotificationLog.save();
        ids = [];
      } else {
        ids = notificationLog.ids;
      }
    }
    let newIdList = [];
    ids.forEach((element) => {
      newIdList.push(mongoose.Types.ObjectId(element.receiverId));
    });
    let aggregateQuery = [];

    if (req.query.search !== undefined && req.query.search.length > 0) {
      const re = new RegExp(`${req.query.search}`, "i");
      aggregateQuery.push({
        $match: {
          $or: [
            {
              uniqueID: re,
            },
            {
              name: re,
            },
            {
              email: re,
            },
            {
              onlyPhoneNumber: re,
            },
            {
              countryCode: re,
            },
          ],
        },
      });
    }
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;

    aggregateQuery.push({
      $sort: { [columnName]: orderBy },
    });
    aggregateQuery.push({
      $addFields: {
        isSend: {
          $cond: {
            if: {
              $in: ["$_id", newIdList],
            },
            then: true,
            else: false,
          },
        },
      },
    });

    aggregateQuery.push({
      $facet: {
        passengerList: [
          {
            $skip: Number(req.query.skip) || 0,
          },
          {
            $limit: Number(req.query.limit) || 100,
          },
        ],
        notificationCount: [
          {
            $count: "totalCount",
          },
        ],
      },
    });
    let passengerDetails = await PassengerSchema.aggregate(aggregateQuery);
    return res.sendToEncode({
      status_code: 200,
      message: "passenger list",
      data: passengerDetails,
    });
  },

  getDriverListFromNotification: async (req, res) => {
    let notificationDetails = await NotificationNewSchema.findOne({
      _id: mongoose.Types.ObjectId(req.query.notificationId),
    });
    let ids = [];
    if (notificationDetails === null) {
      return res.sendToEncode({
        status: 400,
        message: message.SOMETHING_WENT_WRONG,
      });
    } else {
      let notificationLog = await NotificationLogsNewSchema.findOne({
        receiver_type: "driver",
        notificationId: mongoose.Types.ObjectId(req.query.notificationId),
      }).lean();
      if (notificationLog === null) {
        let logData = {
          notificationId: mongoose.Types.ObjectId(req.query.notificationId),
          receiver_type: "driver",
        };
        let newNotificationLog = new NotificationLogsNewSchema(logData);
        let newNotificationLogDetils = await newNotificationLog.save();
        ids = [];
      } else {
        ids = notificationLog.ids;
      }
    }
    let newIdList = [];
    ids.forEach((element) => {
      newIdList.push(mongoose.Types.ObjectId(element.receiverId));
    });
    let aggregateQuery = [];

    if (req.query.search !== undefined && req.query.search.length > 0) {
      const re = new RegExp(`${req.query.search}`, "i");
      aggregateQuery.push({
        $match: {
          $or: [
            {
              uniqueID: re,
            },
            {
              name: re,
            },
            {
              email: re,
            },
            {
              onlyPhoneNumber: re,
            },
            {
              countryCode: re,
            },
          ],
        },
      });
    }
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;

    aggregateQuery.push({
      $sort: { [columnName]: orderBy },
    });
    aggregateQuery.push({
      $addFields: {
        isSend: {
          $cond: {
            if: {
              $in: ["$_id", newIdList],
            },
            then: true,
            else: false,
          },
        },
      },
    });

    aggregateQuery.push({
      $facet: {
        driverList: [
          {
            $skip: Number(req.query.skip) || 0,
          },
          {
            $limit: Number(req.query.limit) || 100,
          },
        ],
        notificationCount: [
          {
            $count: "totalCount",
          },
        ],
      },
    });
    let driverDetails = await DriverSchema.aggregate(aggregateQuery);
    return res.sendToEncode({
      status_code: 200,
      message: "driver list",
      data: driverDetails,
    });
  },

  sendNotificationToDriverList: async (req, res) => {
    req
      .checkBody("notificationId", message.NOTIFICATION_ID_REQUIRED)
      .notEmpty();

    req.checkBody("driverIdList", "Passenger id list require").notEmpty();
    let newDriverIdList = [];
    var error = req.validationErrors();
    if (error && error.length) {
      return res.sendToEncode({
        status: 400,
        message: error[0].msg || message.SOMETHING_WENT_WRONG,
      });
    } else {
      let driverIdList = req.body.driverIdList;
      let notificationDetails = await NotificationNewSchema.findOne({
        _id: mongoose.Types.ObjectId(req.body.notificationId),
      });

      if (notificationDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: "Notification details not found",
        });
      } else {
        for (let i = 0; i < driverIdList.length; i++) {
          let tempObj = {
            receiverId: mongoose.Types.ObjectId(driverIdList[i]),
          };
          newDriverIdList.push(tempObj);
        }
      }
      let notificationLogDetails = await NotificationLogsNewSchema.findOneAndUpdate(
        {
          receiver_type: "driver",
          notificationId: mongoose.Types.ObjectId(req.body.notificationId),
        },
        {
          $push: { ids: { $each: newDriverIdList } },
        },
        {
          new: true,
          upsert: true,
        }
      );
      if (notificationLogDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: message.SOMETHING_WENT_WRONG,
        });
      } else {
        let driverDetailsList = await DriverSchema.find({
          _id: {
            $in: driverIdList,
          },
        });

        if (driverDetailsList.length === 0) {
          return res.sendToEncode({
            status: 400,
            message: "Error in sending notification using fcm",
          });
        } else {
          let newPromiseArray = [];
          for (let i = 0; i < driverDetailsList.length; i++) {
            let promiseData = new Promise(function (resolve, reject) {
              let pushNotificationData = {
                to:
                  (driverDetailsList[i].deviceDetail &&
                    driverDetailsList[i].deviceDetail.token) ||
                  "",
                os: driverDetailsList[i].deviceDetail.os,

                type: "driver",
                data: {
                  title: "",
                  type: 23,
                  body: notificationDetails.title,
                  data: notificationDetails,
                  notification: {
                    title: notificationDetails.title,
                    description: notificationDetails.desciption,
                  },
                  tag: "custome notification",
                },
              };
              pn.fcm(pushNotificationData, function (err, Success) {
                if (err) {
                  reject(err);
                } else {
                  resolve(Success);
                }
              });
            });
            newPromiseArray.push(promiseData);
          }

          Promise.all(newPromiseArray).then(function (values) {});

          return res.sendToEncode({
            status: 200,
            message: "Notification sent to all selected driver list",
          });
        }
      }
    }
  },

  sendNotificationToPassengerList: async (req, res) => {
    req
      .checkBody("notificationId", message.NOTIFICATION_ID_REQUIRED)
      .notEmpty();

    req.checkBody("passengerIdList", "Passenger id list require").notEmpty();
    var error = req.validationErrors();
    let newDriverIdList = [];
    if (error && error.length) {
      return res.sendToEncode({
        status: 400,
        message: error[0].msg || message.SOMETHING_WENT_WRONG,
      });
    } else {
      let passengerIdList = req.body.passengerIdList;
      let notificationDetails = await NotificationNewSchema.findOne({
        _id: mongoose.Types.ObjectId(req.body.notificationId),
      });
      if (notificationDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: "Notification details not found",
        });
      } else {
        for (let i = 0; i < passengerIdList.length; i++) {
          let tempObj = {
            receiverId: mongoose.Types.ObjectId(passengerIdList[i]),
          };
          newDriverIdList.push(tempObj);
        }
      }

      let notificationLogDetails = await NotificationLogsNewSchema.findOneAndUpdate(
        {
          receiver_type: "passenger",
          notificationId: mongoose.Types.ObjectId(req.body.notificationId),
        },
        {
          $push: { ids: { $each: newDriverIdList } },
        },
        {
          new: true,
          upsert: true,
        }
      );

      if (notificationLogDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: message.SOMETHING_WENT_WRONG,
        });
      } else {
        let passengerDetailsList = await PassengerSchema.find({
          _id: {
            $in: passengerIdList,
          },
        });

        if (passengerDetailsList.length === 0) {
          return res.sendToEncode({
            status: 400,
            message: "Error in sending notification using fcm",
          });
        } else {
          let newPromiseArray = [];
          for (let i = 0; i < passengerDetailsList.length; i++) {
            let promiseData = new Promise(function (resolve, reject) {
              let pushNotificationData = {
                to:
                  (passengerDetailsList[i].deviceDetail &&
                    passengerDetailsList[i].deviceDetail.token) ||
                  "",
                os: passengerDetailsList[i].deviceDetail.os,

                type: "passenger",
                data: {
                  title: "",
                  type: 23,
                  body: notificationDetails.title,
                  data: notificationDetails,
                  notification: {
                    title: notificationDetails.title,
                    description: notificationDetails.desciption,
                  },
                  tag: "custome notification",
                },
              };
              pn.fcm(pushNotificationData, function (err, Success) {
                if (err) {
                  reject(err);
                } else {
                  resolve(Success);
                }
              });
            });
            newPromiseArray.push(promiseData);
          }

          Promise.all(newPromiseArray).then(function (values) {});

          return res.sendToEncode({
            status: 200,
            message: "Notification sent to all selected passenger list",
          });
        }
      }
    }
  },
  createReward1: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (
            (fields && !fields.title) ||
            !fields.description ||
            !fields.type
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, fields, files);
          }
        },
        function (fields, files, nextCall) {
          if (files.media) {
            var extension = path.extname(files.media.name);
            var filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.REWARD_MEDIA_THUMB + filename;
            let large_image = CONSTANTS.REWARD_MEDIA_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.media.path,
                      dst: rootPath + "/" + thumb_image,
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.media.path,
                      dst: rootPath + "/" + large_image,
                    },
                    nextProc
                  );
                },
              ],
              function (err) {
                if (err) {
                  return nextCall(err, fields);
                }
                fields.media = filename;
                nextCall(null, fields);
              }
            );
          } else {
            nextCall(null, fields);
          }
        },
        function (fields, nextCall) {
          let rewardData = {
            title: fields.title,
            description: fields.description,
            type: fields.type,
            status: fields.status,
            media: fields.media ? fields.media : "",
          };

          let newReward = new RewardNewSchema(rewardData);
          newReward.save(function (err, response) {
            if (err) {
              return nextCall({ message: "Reward not added" });
            } else {
              return nextCall(null, response);
            }
          });
        },
      ],
      function (err, response) {
        console.log(err);
        console.log(response);
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Reward Added",
          data: response,
        });
      }
    );
  },
  createReward: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (
            (fields && !fields.title) ||
            !fields.description ||
            !fields.type
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, fields, files);
          }
        },
        function (fields, files, nextCall) {
          if (files.media) {
            if (fields.type != "image") {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let url_video = CONSTANTS.REWARD_VIDEO + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.uploadVideo(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + url_video,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            } else {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let thumb_image = CONSTANTS.REWARD_MEDIA_THUMB + filename;
              let large_image = CONSTANTS.REWARD_MEDIA_LARGE + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.thumbUpload(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + thumb_image,
                      },
                      nextProc
                    );
                  },
                  function (nextProc) {
                    Uploader.largeUpload(
                      {
                        // upload large file
                        src: files.media.path,
                        dst: rootPath + "/" + large_image,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            }
          } else {
            nextCall(null, fields);
          }
        },
        function (fields, nextCall) {
          let rewardData = {
            title: fields.title,
            description: fields.description,
            type: fields.type,
            status: fields.status,
            media: fields.media ? fields.media : "",
          };

          let newReward = new RewardNewSchema(rewardData);
          newReward.save(function (err, response) {
            console.log(err);
            console.log(response);
            if (err) {
              return nextCall({ message: "Reward  not added" });
            } else {
              return nextCall(null, response);
            }
          });
        },
      ],
      function (err, response) {
        console.log(err);
        console.log(response);
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Reward Added",
          data: response,
        });
      }
    );
  },
  updateReward: function (req, res) {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (
            (fields && !fields.title) ||
            !fields.description ||
            !fields.type ||
            !fields.rewardId
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, fields, files);
          }
        },
        function (fields, files, nextCall) {
          if (files.media && fields.removeMedia == 1) {
            if (fields.type === "image") {
              Uploader.remove({
                filepath:
                  rootPath +
                  "/" +
                  CONSTANTS.REWARD_MEDIA_THUMB +
                  fields.removeMedia,
              });

              Uploader.remove({
                filepath:
                  rootPath +
                  "/" +
                  CONSTANTS.REWARD_MEDIA_LARGE +
                  fields.removeMedia,
              });
            } else {
              if (fields.removeMedia && fields.removeMedia == 1) {
                Uploader.remove({
                  filepath:
                    rootPath +
                    "/" +
                    CONSTANTS.REWARD_VIDEO +
                    fields.removeMedia,
                });
              }
            }

            if (fields.type != "image") {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let url_video = CONSTANTS.REWARD_VIDEO + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.uploadVideo(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + url_video,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            } else {
              var extension = path.extname(files.media.name);
              var filename = DS.getTime() + extension;
              let thumb_image = CONSTANTS.REWARD_MEDIA_THUMB + filename;
              let large_image = CONSTANTS.REWARD_MEDIA_LARGE + filename;

              async.series(
                [
                  function (nextProc) {
                    Uploader.thumbUpload(
                      {
                        // upload thumb file
                        src: files.media.path,
                        dst: rootPath + "/" + thumb_image,
                      },
                      nextProc
                    );
                  },
                  function (nextProc) {
                    Uploader.largeUpload(
                      {
                        // upload large file
                        src: files.media.path,
                        dst: rootPath + "/" + large_image,
                      },
                      nextProc
                    );
                  },
                ],
                function (err) {
                  if (err) {
                    return nextCall(err, fields);
                  }
                  fields.media = filename;
                  nextCall(null, fields);
                }
              );
            }
          } else {
            nextCall(null, fields);
          }
        },
        function (fields, nextCall) {
          let rewardData = {
            title: fields.title,
            description: fields.description,
            type: fields.type,
            status: fields.status,
            media: fields.media ? fields.media : "",
          };

          RewardNewSchema.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(fields.rewardId) },
            rewardData,
            {
              new: true,
            },
            function (err, response) {
              console.log(err);
              console.log(response);
              if (err) {
                return nextCall({ message: "Reward not updated" });
              } else {
                return nextCall(null, response);
              }
            }
          );
        },
      ],
      function (err, response) {
        console.log(err);
        console.log(response);
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: "Reward Updated",
          data: response,
        });
      }
    );
  },

  getAllRewardList: (req, res) => {
    async.waterfall(
      [
        /** get All Reward List*/
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ title: re }, { descrition: re }, { type: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $facet: {
              rewardList: [
                {
                  $skip: Number(req.query.skip) || 0,
                },
                {
                  $limit: Number(req.query.limit) || 100,
                },
              ],
              rewardCount: [
                {
                  $count: "totalCount",
                },
              ],
            },
          });
          RewardNewSchema.aggregate(aggregateQuery, (err, allRewardList) => {
            if (err) {
              return nextCall({
                message: message.NO_DATA_FOUND,
              });
            } else {
              let response = {
                data: allRewardList,
                reward_media_thumb_url: CONSTANTS.REWARD_MEDIA_THUMB,
                reward_media_large_url: CONSTANTS.REWARD_MEDIA_LARGE,
              };
              nextCall(null, response);
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
          message: "Get reward list successfully.",
          data: response,
        });
      }
    );
  },
  getAllRewardListPDF: (req, res) => {
    async.waterfall(
      [
        function (nextCall) {
          let aggregateQuery = [];

          if (
            req.query.startDate !== "" &&
            req.query.startDate !== null &&
            req.query.startDate !== undefined
          ) {
            var tempDate = req.query.startDate.split("-").reverse().join("-");

            aggregateQuery.push({
              $match: {
                createdAt: { $gte: new Date(tempDate) },
              },
            });
          }

          if (
            req.query.endDate !== "" &&
            req.query.endDate !== null &&
            req.query.endDate !== undefined
          ) {
            var tempDate = req.query.endDate.split("-").reverse().join("-");
            aggregateQuery.push({
              $match: {
                createdAt: { $lt: new Date(tempDate) },
              },
            });
          }

          if (req.query.search !== undefined && req.query.search.length > 0) {
            const re = new RegExp(`${req.query.search}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ title: re }, { descrition: re }, { type: re }],
              },
            });
          }

          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          RewardNewSchema.aggregate(aggregateQuery, (err, allRewardList) => {
            if (err) {
              return nextCall({
                message: message.NO_DATA_FOUND,
              });
            } else {
              let response = {
                data: allRewardList,
                reward_media_thumb_url: CONSTANTS.REWARD_MEDIA_THUMB,
                reward_media_large_url: CONSTANTS.REWARD_MEDIA_LARGE,
              };
              nextCall(null, response);
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
          message: "Get reward list successfully.",
          data: response,
        });
      }
    );
  },
  getRewardDetails: (req, res) => {
    async.waterfall(
      [
        /** check required paremeters */
        function (nextCall) {
          if (!req.query.rewardId) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          } else {
            nextCall(null, req.query.rewardId);
          }
        },
        function (rewardId, nextCall) {
          RewardNewSchema.findOne({
            _id: mongoose.Types.ObjectId(rewardId),
          })
            .lean()
            .exec(function (err, response) {
              if (err) {
                return nextCall({ message: message.SOMETHING_WENT_WRONG });
              } else {
                return nextCall(null, response);
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
          message: "Reward Details",
          data: response,
        });
      }
    );
  },
  getPassengerListFromReward: async function (req, res) {
    /** get All User Group*/
    let rewardDetails = await RewardNewSchema.findOne({
      _id: mongoose.Types.ObjectId(req.query.rewardId),
    });
    let ids = [];
    if (rewardDetails === null) {
      return res.sendToEncode({
        status: 400,
        message: message.SOMETHING_WENT_WRONG,
      });
    } else {
      let rewardLog = await RewardLogsNewSchema.findOne({
        receiver_type: "passenger",
        rewardId: mongoose.Types.ObjectId(req.query.rewardId),
      });
      if (rewardLog === null) {
        let logData = {
          rewardId: mongoose.Types.ObjectId(req.query.rewardId),
          receiver_type: "passenger",
        };
        let newRewardLog = new RewardLogsNewSchema(logData);
        let newRewardLogDetils = await newRewardLog.save();
        ids = [];
      } else {
        ids = rewardLog.ids;
      }
    }
    let newIdList = [];
    ids.forEach((element) => {
      newIdList.push(mongoose.Types.ObjectId(element.receiverId));
    });
    let aggregateQuery = [];

    if (req.query.search !== undefined && req.query.search.length > 0) {
      const re = new RegExp(`${req.query.search}`, "i");
      aggregateQuery.push({
        $match: {
          $or: [
            {
              uniqueID: regex,
            },
            {
              name: regex,
            },
            {
              email: regex,
            },
            {
              onlyPhoneNumber: regex,
            },
            {
              countryCode: regex,
            },
          ],
        },
      });
    }
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;

    aggregateQuery.push({
      $sort: { [columnName]: orderBy },
    });
    aggregateQuery.push({
      $addFields: {
        isSend: {
          $cond: {
            if: {
              $in: ["$_id", newIdList],
            },
            then: true,
            else: false,
          },
        },
      },
    });

    aggregateQuery.push({
      $facet: {
        passengerList: [
          {
            $skip: Number(req.query.skip) || 0,
          },
          {
            $limit: Number(req.query.limit) || 100,
          },
        ],
        rewardCount: [
          {
            $count: "totalCount",
          },
        ],
      },
    });
    let passengerDetails = await PassengerSchema.aggregate(aggregateQuery);
    return res.sendToEncode({
      status_code: 200,
      message: "passenger list",
      data: passengerDetails,
    });
  },

  getDriverListFromReward: async (req, res) => {
    let rewardDetails = await RewardNewSchema.findOne({
      _id: mongoose.Types.ObjectId(req.query.rewardId),
    });
    let ids = [];
    if (rewardDetails === null) {
      return res.sendToEncode({
        status: 400,
        message: message.SOMETHING_WENT_WRONG,
      });
    } else {
      let rewardLog = await RewardLogsNewSchema.findOne({
        receiver_type: "driver",
        rewardId: mongoose.Types.ObjectId(req.query.rewardId),
      });
      if (rewardLog === null) {
        let logData = {
          rewardId: mongoose.Types.ObjectId(req.query.rewardId),
          receiver_type: "driver",
        };
        let newRewardLog = new RewardLogsNewSchema(logData);
        let newRewardLogDetils = await newRewardLog.save();
        ids = [];
      } else {
        ids = rewardLog.ids;
      }
    }
    let newIdList = [];
    ids.forEach((element) => {
      newIdList.push(mongoose.Types.ObjectId(element.receiverId));
    });
    let aggregateQuery = [];

    if (req.query.search !== undefined && req.query.search.length > 0) {
      const re = new RegExp(`${req.query.search}`, "i");
      aggregateQuery.push({
        $match: {
          $or: [
            {
              uniqueID: regex,
            },
            {
              name: regex,
            },
            {
              email: regex,
            },
            {
              onlyPhoneNumber: regex,
            },
            {
              countryCode: regex,
            },
          ],
        },
      });
    }
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;

    aggregateQuery.push({
      $sort: { [columnName]: orderBy },
    });
    aggregateQuery.push({
      $addFields: {
        isSend: {
          $cond: {
            if: {
              $in: ["$_id", newIdList],
            },
            then: true,
            else: false,
          },
        },
      },
    });

    aggregateQuery.push({
      $facet: {
        passengerList: [
          {
            $skip: Number(req.query.skip) || 0,
          },
          {
            $limit: Number(req.query.limit) || 100,
          },
        ],
        rewardCount: [
          {
            $count: "totalCount",
          },
        ],
      },
    });
    let driverDetails = await DriverSchema.aggregate(aggregateQuery);
    return res.sendToEncode({
      status_code: 200,
      message: "driver list",
      data: driverDetails,
    });
  },

  sendRewardToDriverList: async (req, res) => {
    req.checkBody("rewardId", "RewardId is required.").notEmpty();

    req.checkBody("driverIdList", "Driver id list require").notEmpty();
    let newDriverIdList = [];

    var error = req.validationErrors();
    if (error && error.length) {
      return res.sendToEncode({
        status: 400,
        message: error[0].msg || message.SOMETHING_WENT_WRONG,
      });
    } else {
      let driverIdList = req.body.driverIdList;
      let rewardDetails = await RewardNewSchema.findOne({
        _id: mongoose.Types.ObjectId(req.body.rewardId),
      });

      if (rewardDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: "Reward details not found",
        });
      } else {
        for (let i = 0; i < driverIdList.length; i++) {
          let tempObj = {
            receiverId: mongoose.Types.ObjectId(driverIdList[i]),
          };
          newDriverIdList.push(tempObj);
        }
      }
      let rewardLogDetails = await RewardLogsNewSchema.findOneAndUpdate(
        {
          receiver_type: "driver",
          rewardId: mongoose.Types.ObjectId(req.body.rewardId),
        },
        {
          $push: { ids: { $each: newDriverIdList } },
        },
        {
          new: true,
          upsert: true,
        }
      );
      if (rewardLogDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: message.SOMETHING_WENT_WRONG,
        });
      } else {
        let driverDetailsList = await DriverSchema.find({
          _id: {
            $in: driverIdList,
          },
        });

        if (driverDetailsList.length === 0) {
          return res.sendToEncode({
            status: 400,
            message: "Error in sending reward using fcm",
          });
        } else {
          let newPromiseArray = [];
          for (let i = 0; i < driverDetailsList.length; i++) {
            let promiseData = new Promise(function (resolve, reject) {
              let pushNotificationData = {
                to:
                  (driverDetailsList[i].deviceDetail &&
                    driverDetailsList[i].deviceDetail.token) ||
                  "",
                os: driverDetailsList[i].deviceDetail.os,

                type: "driver",
                data: {
                  title: "",
                  type: 23,
                  body: rewardDetails.title,
                  data: rewardDetails,
                  notification: {
                    title: rewardDetails.title,
                    description: rewardDetails.desciption,
                  },
                  tag: "custome notification",
                },
              };
              pn.fcm(pushNotificationData, function (err, Success) {
                if (err) {
                  reject(err);
                } else {
                  resolve(Success);
                }
              });
            });
            newPromiseArray.push(promiseData);
          }

          Promise.all(newPromiseArray).then(function (values) {});

          return res.sendToEncode({
            status: 200,
            message: "Notification sent to all selected driver list",
          });
        }
      }
    }
  },

  sendRewardToPassengerList: async (req, res) => {
    req.checkBody("rewardId", "RewardId is required.").notEmpty();

    req.checkBody("passengerIdList", "Passenger id list require").notEmpty();
    var error = req.validationErrors();
    let newDriverIdList = [];
    if (error && error.length) {
      return res.sendToEncode({
        status: 400,
        message: error[0].msg || message.SOMETHING_WENT_WRONG,
      });
    } else {
      let passengerIdList = req.body.passengerIdList;
      let rewardDetails = await RewardNewSchema.findOne({
        _id: mongoose.Types.ObjectId(req.body.rewardId),
      });
      if (rewardDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: "Reward details not found",
        });
      } else {
        for (let i = 0; i < passengerIdList.length; i++) {
          let tempObj = {
            receiverId: mongoose.Types.ObjectId(passengerIdList[i]),
          };
          newDriverIdList.push(tempObj);
        }
      }

      let rewardLogDetails = await RewardLogsNewSchema.findOneAndUpdate(
        {
          receiver_type: "passenger",
          rewardId: mongoose.Types.ObjectId(req.body.rewardId),
        },
        {
          $push: { ids: { $each: newDriverIdList } },
        },
        {
          new: true,
          upsert: true,
        }
      );

      if (rewardLogDetails === null) {
        return res.sendToEncode({
          status: 400,
          message: message.SOMETHING_WENT_WRONG,
        });
      } else {
        let passengerDetailsList = await PassengerSchema.find({
          _id: {
            $in: passengerIdList,
          },
        });

        if (passengerDetailsList.length === 0) {
          return res.sendToEncode({
            status: 400,
            message: "Error in sending notification using fcm",
          });
        } else {
          let newPromiseArray = [];
          for (let i = 0; i < passengerDetailsList.length; i++) {
            let promiseData = new Promise(function (resolve, reject) {
              let pushNotificationData = {
                to:
                  (passengerDetailsList[i].deviceDetail &&
                    passengerDetailsList[i].deviceDetail.token) ||
                  "",
                os: passengerDetailsList[i].deviceDetail.os,

                type: "passenger",
                data: {
                  title: "",
                  type: 23,
                  body: rewardDetails.title,
                  data: rewardDetails,
                  notification: {
                    title: rewardDetails.title,
                    description: rewardDetails.desciption,
                  },
                  tag: "custome notification",
                },
              };
              pn.fcm(pushNotificationData, function (err, Success) {
                if (err) {
                  reject(err);
                } else {
                  resolve(Success);
                }
              });
            });
            newPromiseArray.push(promiseData);
          }

          Promise.all(newPromiseArray).then(function (values) {});

          return res.sendToEncode({
            status: 200,
            message: "Reward sent to all selceted passenger list",
          });
        }
      }
    }
  },
};

function saveRecycle(subject, token, tableName, recordId) {
  jwt.verify(token, config.secret, function (err, decoded) {
    let recycleData = {
      subject: subject,
      userId: decoded._id,
      tableName: tableName,
      recordId: recordId,
    };

    let recycleLogs = new RecycleBinSchema(recycleData);
    recycleLogs.save((err, recycleLogs) => {
      if (err) {
        return false;
      }
      return true;
    });
  });
}

module.exports = _self;
