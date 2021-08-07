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
  //Database Schemas (MongoDB)
  DriverSchema = require('../models/driver'),
  VehicleSchema= require('../models/vehicle'),
  VehicleRequestSchema= require('../models/vehicleRequest'),
  PassengerSchema = require('../models/passenger'),
  DriverRideRequestSchema = require('../models/driverRideRequest'),
  DriverRefEarningLogSchema = require('../models/driverReferralEarningLogs'),
  SystemSettingsSchema = require('../models/systemSettings'),
  BillingPlanSchema = require('../models/billingPlan'),
  WalletLogsSchema = require('../models/walletLogs'),
  WithdrawsSchema = require('../models/withdraws'),
  withdrawLogsSchema = require('../models/withdrawsLogs'),
  RewardSchema = require('../models/reward'),
  VehicleTypeSchema = require('../models/vehicleType'),
  RideSchema = require('../models/ride'),
  NotificationSchema = require('../models/notification'),
  LanguageSchema = require('../models/language'),
  UniqueCodeSchema = require('../models/uniqueCode'),
  DriverReferralsSchema = require('../models/driverReferrals'),
  EmergencySchema = require('../models/emergency'),
  callHistorySchema = require('../models/call_history'),

  NotificationLogNewSchema = require('../models/notificationLogsNew'),
  RewardLogsNewSchema = require('../models/rewardLogsNew');
  /** languages */
  ENGLISH_MESSAGES = rootRequire('config/messages/en'),
  log_message = rootRequire("config/log_messages");
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
  Mailer = rootRequire('support/mailer'), // date services
  Request = require('request-promise');

const commonHelper = require('../policies/commonHelper');

const RIDE_REQUEST_TIMEOUT = 20;

// --> 1. This Crone will run every mid night
schedule.scheduleJob('0 0 1 * *', function () {
  // deduct commercial plan charges amount every month
  _self.commercialPlanCrone();
});

// Create indexs required in DriverSchema
DriverSchema.collection.createIndex({
  location: '2dsphere'
},
  function (err, resp) { }
);
var API_URL = "http://3.21.49.79:6025/";

var _self = {
  /**
   * Crone of Monthly Commercial plan
   */
  commercialPlanCrone: function (req, res) {
    async.waterfall(
      [
        /** get commercial Plan from Database */
        function (nextCall) {
          BillingPlanSchema.findOne({
            type: 'commercial_plan'
          }).exec(function (err, commercialPlan) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WRONG'
              });
            } else if (!commercialPlan) {
              return nextCall({
                message: 'COMMERCIAL_PLAN_NOT_EXIST'
              });
            } else {
              nextCall(null, commercialPlan);
            }
          });
        },
        /** get drivers which has commercial plan */
        function (commercialPlan, nextCall) {
          DriverSchema.find({
            billingId: commercialPlan._id,
            isVerified: true
          }).exec((err, drivers) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WRONG'
              });
            } else {
              async.map(
                drivers,
                function (driver, callback) {
                  let condition = {
                    _id: driver._id
                  };
                  let updateData = {
                    $inc: {
                      creditBalance: -Number(commercialPlan.chargeAmt)
                    },
                    $set: {
                      CommercialCronUpdatedAt: DS.now()
                    }
                  };
                  DriverSchema.findOneAndUpdate(condition, updateData)
                    .populate('languageId')
                    .exec((err, updatedDriver) => {
                      if (err) {
                        return nextCall({
                          message: 'SOMETHING_WENT_WRONG'
                        });
                      }

                      async.waterfall(
                        [
                          function (nextCall) {
                            let COMMERCIAL_PLAN_FIRST_TEXT;
                            let COMMERCIAL_PLAN_LAST_TEXT;
                            if (updateData.languageId && updateData.languageId.code == 'km') {
                              COMMERCIAL_PLAN_FIRST_TEXT = COMBODIA_MESSAGES['COMMERCIAL_PLAN_FIRST_TEXT'];
                              COMMERCIAL_PLAN_LAST_TEXT = COMBODIA_MESSAGES['COMMERCIAL_PLAN_LAST_TEXT'];
                            } else if (updateData.languageId && updateData.languageId.code == 'zh') {
                              COMMERCIAL_PLAN_FIRST_TEXT = CHINESE_MESSAGES['COMMERCIAL_PLAN_FIRST_TEXT'];
                              COMMERCIAL_PLAN_LAST_TEXT = CHINESE_MESSAGES['COMMERCIAL_PLAN_LAST_TEXT'];
                            } else {
                              COMMERCIAL_PLAN_FIRST_TEXT = ENGLISH_MESSAGES['COMMERCIAL_PLAN_FIRST_TEXT'];
                              COMMERCIAL_PLAN_LAST_TEXT = ENGLISH_MESSAGES['COMMERCIAL_PLAN_LAST_TEXT'];
                            }
                            nextCall(null, COMMERCIAL_PLAN_FIRST_TEXT, COMMERCIAL_PLAN_LAST_TEXT);
                          },
                          function (COMMERCIAL_PLAN_FIRST_TEXT, COMMERCIAL_PLAN_LAST_TEXT, nextCall) {
                            NotificationSchema.count({
                              driverId: driver._id,
                              type: 'billing_plan',
                              isRead: false
                            }, function (err, count) {
                              if (err) {
                                return nextCall({
                                  message: err
                                });
                              } else {
                                var badgeCount = count ? count + 1 : 1;
                                return nextCall(null, COMMERCIAL_PLAN_FIRST_TEXT, COMMERCIAL_PLAN_LAST_TEXT, badgeCount);
                              }
                            });
                          },
                          function (COMMERCIAL_PLAN_FIRST_TEXT, COMMERCIAL_PLAN_LAST_TEXT, nextCall) {
                            NotificationSchema.count({
                              driverId: driver._id,
                              isRead: false
                            }, function (err, count) {
                              if (err) {
                                return nextCall({
                                  message: err
                                });
                              } else {
                                var totalBadgeCount = count ? count + 1 : 1;
                                return nextCall(null, COMMERCIAL_PLAN_FIRST_TEXT, COMMERCIAL_PLAN_LAST_TEXT, badgeCount, totalBadgeCount);
                              }
                            });
                          },
                          function (COMMERCIAL_PLAN_FIRST_TEXT, COMMERCIAL_PLAN_LAST_TEXT, badgeCount, totalBadgeCount, nextCall) {
                            let pushNotificationData = {
                              to: (updatedDriver.deviceDetail && updatedDriver.deviceDetail.token) || '',
                              type: 'driver',
                              data: {
                                title: '',
                                type: 10,
                                body: COMMERCIAL_PLAN_FIRST_TEXT + commercialPlan.chargeAmt + COMMERCIAL_PLAN_LAST_TEXT,
                                badge: totalBadgeCount,
                                notificationBadgeCountData: {
                                  billing_plan: badgeCount
                                },
                                tag: 'Commercial Plan Deduction',
                                data: {}
                              }
                            };
                            nextCall(null, pushNotificationData);
                          },
                          function (pushNotificationData, nextCall) {
                            /** send Notification to Driver */
                            pn.fcm(pushNotificationData, function (err, Success) {
                              /** insert notification data */
                              let notificationData = {
                                title: pushNotificationData.data.body,
                                receiver_type: 'driver',
                                driverId: driver._id
                              };
                              let Notification = new NotificationSchema(notificationData);
                              Notification.save((err, notification) => {
                                if (err) {
                                  return nextCall({
                                    message: 'SOMETHING_WENT_WRONG'
                                  });
                                }
                                /** add wallet logs of commercial amount */

                                let insertData = {
                                  driverId: driver._id,
                                  type: 'billing_plan_withdraw',
                                  amount: Number(commercialPlan.chargeAmt)
                                };
                                insertData.type = 'billing_plan_withdraw';
                                let wallet = new WalletLogsSchema(insertData);
                                wallet.save(function (err, insertWalletData) {
                                  if (err) {
                                    return nextCall({
                                      message: 'SOMETHING_WENT_WRONG'
                                    });
                                  }
                                  nextCall(null);
                                });
                              });
                            });
                          }
                        ],
                        function (err, response) {
                          if (err) {
                            nextCall({
                              message: err
                            });
                          } else {
                            callback(null);
                          }
                        }
                      );
                      // let COMMERCIAL_PLAN_FIRST_TEXT;
                      // let COMMERCIAL_PLAN_LAST_TEXT;
                      // if (updateData.languageId && updateData.languageId.code == 'km') {
                      //     COMMERCIAL_PLAN_FIRST_TEXT = COMBODIA_MESSAGES['COMMERCIAL_PLAN_FIRST_TEXT'];
                      //     COMMERCIAL_PLAN_LAST_TEXT = COMBODIA_MESSAGES['COMMERCIAL_PLAN_LAST_TEXT'];
                      // } else if (updateData.languageId && updateData.languageId.code == 'zh') {
                      //     COMMERCIAL_PLAN_FIRST_TEXT = CHINESE_MESSAGES['COMMERCIAL_PLAN_FIRST_TEXT'];
                      //     COMMERCIAL_PLAN_LAST_TEXT = CHINESE_MESSAGES['COMMERCIAL_PLAN_LAST_TEXT'];
                      // } else {
                      //     COMMERCIAL_PLAN_FIRST_TEXT = ENGLISH_MESSAGES['COMMERCIAL_PLAN_FIRST_TEXT'];
                      //     COMMERCIAL_PLAN_LAST_TEXT = ENGLISH_MESSAGES['COMMERCIAL_PLAN_LAST_TEXT'];
                      // }
                      // NotificationSchema.count({ driverId: driver._id, isRead: false }, function (err, count) {
                      //     if (err) {
                      //         return false
                      //     }
                      //     else {
                      //         updatedDriver.badgeCount = count ? count + 1 : 1
                      //         return updatedDriver.badgeCount
                      //     }
                      // })

                      // let pushNotificationData = {
                      //     to: (updatedDriver.deviceDetail && updatedDriver.deviceDetail.token) || '',
                      //     type: 'driver',
                      //     data: {
                      //         title: '',
                      //         type: 10,
                      //         body: COMMERCIAL_PLAN_FIRST_TEXT + commercialPlan.chargeAmt + COMMERCIAL_PLAN_LAST_TEXT,
                      //         badge: updatedDriver.badgeCount,
                      //         tag: 'Commercial Plan Deduction',
                      //         data: {}
                      //     }
                      // }

                      /** send Notification to Driver */
                      // pn.fcm(pushNotificationData, function (err, Success) {
                      //     /** insert notification data */
                      //     let notificationData = {
                      //         title: pushNotificationData.data.body,
                      //         receiver_type: 'driver',
                      //         driverId: driver._id
                      //     }
                      //     let Notification = new NotificationSchema(notificationData);
                      //     Notification.save((err, notification) => {
                      //         if (err) {
                      //             return nextCall({
                      //                 "message": 'SOMETHING_WENT_WRONG',
                      //             });
                      //         }
                      //         /** add wallet logs of commercial amount */

                      //         let insertData = {
                      //             driverId: driver._id,
                      //             type: 'billing_plan_withdraw',
                      //             amount: Number(commercialPlan.chargeAmt)
                      //         }
                      //         insertData.type = 'billing_plan_withdraw';
                      //         let wallet = new WalletLogsSchema(insertData);
                      //         wallet.save(function (err, insertWalletData) {
                      //             if (err) {
                      //                 return nextCall({
                      //                     "message": 'SOMETHING_WENT_WRONG'
                      //                 })
                      //             }
                      //             callback(null);
                      //         });
                      //     })
                      // })
                    });
                },
                function (err) {
                  nextCall(null);
                }
              );
            }
          });
        }
      ],
      function (err, response) {
        if (err) {
          // console.log('-------------------------------------');
          // console.log('Commercial Plan Crone', err);
          // console.log('-------------------------------------');
        } else {
          // console.log('--------------------------------');
          // console.log('Commercial Plan Crone SUCC');
          // console.log('--------------------------------');
        }
      }
    );
  },

  /**
   * :::Test Zone:::
   * all apis and function to test are placd here
   */
  test: function (req, res) {
    return res.sendToEncode({
      status_code: 200,
      message: 'Success!',
      data: {
        Test: process.env.MONGO_URL
      }
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
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getUniqueData[0].uniqueID.indexOf(randomString) === -1) {
              let getUniqueArrayData = getUniqueData[0].uniqueID.push(randomString);
              let updateData = {
                uniqueID: getUniqueData[0].uniqueID
              };
              UniqueCodeSchema.findOneAndUpdate({}, {
                $set: updateData
              },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });
                  }
                  nextCall(null, randomString);
                }
              );
            } else {
              _self.getUniqueId(function (err, response) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                }
              });
            }
          });
        }
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
          SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSystemSettingData[0]) {
              SystemSettingsSchema.findOneAndUpdate({}, {
                $inc: {
                  driverAutoIncrement: Number(1)
                }
              }, {
                new: true
              },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });
                  }
                  nextCall(null, updateData);
                }
              );
            } else {
              _self.getDriverAutoIncrement(function (err, response) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                }
              });
            }
          });
        }
      ],
      function (err, response) {
        callback(err, response);
      }
    );
  },

  /************************************************
   * ::: Driver APIs :::
   * all apis related to mostly users are placd here
   *************************************************/

  /* --------------------------------------------------\*
   * Check Number completed
   * ------------------------------------------------ */
  checkNumber: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('phoneNumber', 'PHONE_REQUIRED').notEmpty();
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
          try {
            //Check and Update Driver

            var condition = {
              phoneNumber: body.phoneNumber,
              isDeleted: false
            };
            let deviceToken = body.deviceToken;
            DriverSchema.findOne(condition)
              .lean()
              .exec(function (err, driver) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                }
                let phoneNumber = body.phoneNumber.substring(1, body.phoneNumber.length);
                let message = '';
                let otpSend = '';
                commonHelper.generateOTP((err, otp) => {
                  // otpSend.push(otp);
                  otpSend = otp;
                  message = 'you otp is ' + otp;
                });

                commonHelper.sendMessage(phoneNumber, message, (err, response) => {
                  if (err) {
                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });

                  }

                  redisClient.set(deviceToken, otpSend, 'EX', 300);
                });
                if (!driver) {
                  return nextCall({
                    message: 'NUMBER_NOT_REGISTERED'
                  });
                } else {
                  nextCall(null, driver);
                }
              });
          } catch (error) {
            // console.log(error);
          }
        },
        function (driver, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              //   console.log(err);
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSettingData[0]) {
              driver.driverVersionUpdate = getSettingData[0].driverVersionUpdate;
              nextCall(null, driver);
            } else {

              return nextCall({
                message: 'SYSTEM_SETTINGS_NOT_FOUND'
              });
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
      }
    );
  },

  /*----------------------------------------------------\*
   * Check OTP completed
   *------------------------------------------------------*/

  verifyOTP: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('otp', 'OTP_REQUIRED').notEmpty();
          req.checkBody('phoneNumber', 'PHONE_REQUIRED').notEmpty();
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
          //Check and Update Driver
          let deviceToken = body.deviceToken;
          let otp = body.otp;
          redisClient.get(deviceToken, (err, response) => {
            if (err) {
              return nextCall({
                message: 'OTP_EXPIRED'
              })
            }
            // console.log(response);
            if (response === otp) {
              ///check user register or not 
              var condition = {
                phoneNumber: body.phoneNumber,
                isDeleted: false
              };

              // DriverSchema.findOneAndUpdate({
              //     condition
              //   }, {}



              return nextCall(null, {
                message: 'OTP_MATCHED'
              });
            } else if (response === null) {
              return nextCall({
                message: 'OTP_EXPIRED'
              });
            } else {
              return nextCall({
                message: 'OTP_WRONG'
              })
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
          message: response.message
        });
      }
    );
  },


  /* --------------------------------------------------\*
   * Login  completed
   * ------------------------------------------------ */
  login: function (req, res) {
    async.waterfall(
      [
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
          // Check and Update Driver
          var condition = {
            phoneNumber: body.phoneNumber,
            isDeleted: false
          };
          var dataToUpdate = {
            isOnline: true,
            deviceDetail: {
              os: body.deviceOs,
              token: body.deviceToken
            }
          };
          if (body.longitude && body.latitude) {
            dataToUpdate['location.coordinates'] = [Number(body.longitude), Number(body.latitude)];
            dataToUpdate['location.type'] = 'Point';
          }
          if (body.angle) {
            dataToUpdate['location.angle'] = body.angle ? Number(body.angle) : 0;
          }
          if (body.speed) {
            dataToUpdate['location.speed'] = body.speed ? Number(body.speed) : 0;
          }

          DriverSchema.findOneAndUpdate(
            condition, {
            $set: dataToUpdate
          }, {
            upsert: true,
            new: true
          }
          )
            .populate('vehicle.typeId')
            .populate('languageId')
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!driver) {
                return nextCall({
                  message: 'NUMBER_NOT_REGISTERED'
                });
              } else {
                var jwtData = {
                  _id: driver._id,
                  email: driver.email,
                  deviceToken: driver.deviceDetail.token,
                  type: 'driver'
                };
                // create a token
                var d = driver.toObject();
                d.access_token = jwt.sign(jwtData, config.secret, {
                  // expiresIn: config.jwtTokenExpiryTime
                });

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

                let phoneNumber = d.countryCode + ' ' + d.onlyPhoneNumber.substring(0, 2) + ' ' + d.onlyPhoneNumber.substring(2, 5) + ' ' + d.onlyPhoneNumber.substring(5, d.onlyPhoneNumber.length);
                d.phoneNumber = phoneNumber;
                nextCall(null, d);
              }
            });
        },
        function (driver, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSystemSettingData[0]) {
              driver.driverMinimumBalance = getSystemSettingData[0].driverMinimumBalance;
            }
            nextCall(null, driver);
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
      }
    );
  },

  /* --------------------------------------------------\*
   * Add Driver  completed
   * ------------------------------------------------ */
  add: function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        // function (fields, files, nextCall) {
        //   console.log("STEP1::::::::::::;", fields, files);
        //   if (
        //     (fields &&
        //       // (!fields.name) || (!fields.phoneNumber) || (!fields.dob) ||
        //       // (!fields.typeId) || (!fields.year) || (!fields.seats) ||
        //       // (!fields.color) || (!fields.model) || (!fields.isAcAvailable) ||
        //       // (!fields.isSmokingAllowed) || (!fields.deviceOs) || (!fields.deviceToken) ||
        //       // (!fields.language_code) || (!fields.platNumber)
        //       !fields.phoneNumber)) {
        //     return nextCall({
        //       message: 'INVALID_PARAMS'
        //     });
        //   }
        //   nextCall(null, fields, files);
        // },
        /** check email and mobile no already registered or not */
        function (fields, files, nextCall) {
          console.log("STEP2::::::::::::;", fields, files);
          DriverSchema.findOne({
            phoneNumber: fields.phoneNumber,
            isDeleted: false
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else if (driver) {
              return nextCall({
                message: 'DRIVER_ALREADY_REGISTERED'
              });
            } else {
              nextCall(null, fields, files);
            }
          });
        },
        /** upload profile picture */
        function (fields, files, nextCall) {
          console.log("STEP3::::::::::::;", fields, files);
          if (files.profilePhoto) {
            // skip files except image files
            if (files.profilePhoto && files.profilePhoto.type.indexOf('image') === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.profilePhoto.name);
            var filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload({
                    // upload thumb file
                    src: files.profilePhoto.path,
                    dst: rootPath + '/' + thumb_image
                  },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload({
                    // upload large file
                    src: files.profilePhoto.path,
                    dst: rootPath + '/' + large_image
                  },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove({
                    filepath: files.profilePhoto.path
                  },
                    nextProc
                  );
                }
              ],
              function (err, data) {
                if (err) {
                  nextCall(err, fields, files);
                } else {
                  fields.profilePhoto = filename;
                  nextCall(null, fields, files);
                }
              }
            );
          } else {
            fields.profilePhoto = '';
            nextCall(null, fields, files);
          }
        },
        /** upload id photos */
        function (fields, files, nextCall) {
          console.log("STEP4::::::::::::;", fields, files);
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
                if (files.idPhotos[k].type.indexOf('image') === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.idPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload({
                        // upload thumb file
                        src: files.idPhotos[k].path,
                        dst: rootPath + '/' + thumb_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload({
                        // upload large file
                        src: files.idPhotos[k].path,
                        dst: rootPath + '/' + large_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove({
                        filepath: files.idPhotos[k].path
                      },
                        nextProc
                      );
                    }
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
        function (fields, files, nextCall) {
          console.log("STEP5::::::::::::;", fields, files);
          if (files.vehiclePhotos) {
            if (!(files.vehiclePhotos.length > 0)) {
              let a = [];
              a.push(files.vehiclePhotos);
              files.vehiclePhotos = a;
            }

            async.mapSeries(
              Object.keys(files.vehiclePhotos),
              function (k, nextFile) {
                // skip files except image files
                if (files.vehiclePhotos[k].type.indexOf('image') === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.vehiclePhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload({
                        // upload thumb file
                        src: files.vehiclePhotos[k].path,
                        dst: rootPath + '/' + thumb_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload({
                        // upload large file
                        src: files.vehiclePhotos[k].path,
                        dst: rootPath + '/' + large_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove({
                        filepath: files.vehiclePhotos[k].path
                      },
                        nextProc
                      );
                    }
                  ],
                  function (err) {
                    if (err) {
                      nextFile(err, filename);
                    }
                    nextFile(null, filename);
                  }
                );
              },
              function (err, vehiclePhotosName) {
                fields.vehiclePhotos = vehiclePhotosName;
                nextCall(null, fields, files);
              }
            );
          } else {
            fields.vehiclePhotos = [];
            nextCall(null, fields, files);
          }
        },
        /** upload vehicle id photos */
        function (fields, files, nextCall) {
          console.log("STEP6::::::::::::;", fields, files);
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
                if (files.vehicleIdPhotos[k].type.indexOf('image') === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.vehicleIdPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload({
                        // upload thumb file
                        src: files.vehicleIdPhotos[k].path,
                        dst: rootPath + '/' + thumb_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload({
                        // upload large file
                        src: files.vehicleIdPhotos[k].path,
                        dst: rootPath + '/' + large_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove({
                        filepath: files.vehicleIdPhotos[k].path
                      },
                        nextProc
                      );
                    }
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
          console.log("STEP7::::::::::::;", fields, files);
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
                if (files.plateNoPhotos[k].type.indexOf('image') === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.plateNoPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload({
                        // upload thumb file
                        src: files.plateNoPhotos[k].path,
                        dst: rootPath + '/' + thumb_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload({
                        // upload large file
                        src: files.plateNoPhotos[k].path,
                        dst: rootPath + '/' + large_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove({
                        filepath: files.plateNoPhotos[k].path
                      },
                        nextProc
                      );
                    }
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
        //   console.log("STEP8::::::::::::;", fields.typeId);
        //   VehicleTypeSchema.findOne({
        //     _id: fields.typeId
        //   }).exec(function (err, vehicleType) {
        //     if (err) {
        //       return nextCall({
        //         message: 'SOMETHING_WENT_WRONG'
        //       });
        //     } else if (!vehicleType) {
        //       return nextCall({
        //         message: 'VEHICLE_NOT_FOUND'
        //       });
        //     } else {
        //       fields.vehicleType = vehicleType.type.en.charAt(0);
        //       nextCall(null, fields);
        //     }
        //   });
        // },
        // /** get unique id */
        function (fields, nextCall) {
          _self.getUniqueId(function (err, response) {
            if (err) {
              return nextCall({
                "message": 'SOMETHING_WENT_WRONG'
              })
            }
            fields.uniqueID = fields.vehicleType + '-' + response;
            nextCall(null, fields)
          });
        },
        /** get driver auto increment id */
        function (fields, nextCall) {
          console.log("STEP9::::::::::::;", fields);
          _self.getDriverAutoIncrement(function (err, response) {
            console.log("STEP9::::::::::::;", err);
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            fields.autoIncrementID = response.driverAutoIncrement;
            nextCall(null, fields);
          });
        },
        /** get unique id */
        function (fields, nextCall) {
          console.log("STEP10::::::::::::;", fields);
          var year = new Date()
            .getFullYear()
            .toString()
            .substr(-2);
          // create autoIncrementID
          var newuniqueId = year + "0000" + fields.autoIncrementID;
          fields.uniqueID = newuniqueId;

          UniqueCodeSchema.find({}).exec(function (err, getUniqueData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getUniqueData[0].uniqueID.indexOf(newuniqueId) === -1) {
              let getUniqueArrayData = getUniqueData[0].uniqueID.push(newuniqueId);
              let updateData = {
                uniqueID: getUniqueData[0].uniqueID
              };
              UniqueCodeSchema.findOneAndUpdate({}, {
                $set: updateData
              },
                function (err, updateData) {
                  if (err) {
                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });
                  }
                  nextCall(null, fields);
                }
              );
            } else {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
          });
        },
        /** get language id */
        function (fields, nextCall) {
          console.log("STEP11::::::::::::;", typeof fields.language_code);
          LanguageSchema.findOne({
            code: fields.language_code
          })
            .lean()
            .exec(function (err, language) {
              console.log("STEP11::::::::::::;", language);
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!language) {
                return nextCall({
                  message: 'LANGUAGE_NOT_FOUND'
                });
              } else {
                fields.languageId = language._id;
                nextCall(null, fields);
              }
            });
        },
        // /** add point count or batch count  */
        function (fields, nextCall) {
          console.log("STEP12::::::::::::;", fields);
          if (fields.inviteCode != undefined && fields.inviteCode != null && fields.inviteCode != '') {
            DriverReferralsSchema.findOne({
              referralCode: fields.inviteCode
            })
              .lean()
              .exec(function (err, driverReferral) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                } else if (!driverReferral) {
                  nextCall(null, fields);
                } else {
                  //increment inviteCode's driver points

                  DriverSchema.findOneAndUpdate({
                    referralCode: fields.inviteCode
                  }, {
                    $inc: {
                      totalPoints: 1,
                      totalInvited: 1
                    }
                  }).exec((err, driver) => {
                    if (err) {
                      return nextCall({
                        message: 'SOMETHING_WENT_WRONG'
                      });
                    }
                    nextCall(null, fields);
                  });
                }
              });
          } else {
            nextCall(null, fields);
          }
        },
        /** driverReferral find parent driver */
        function (fields, nextCall) {
          console.log("STEP13::::::::::::;", fields.inviteCode);
          if (fields.inviteCode !== undefined && fields.inviteCode !== null && fields.inviteCode !== '') {
            console.log("STEP13::::::::::::;", fields.inviteCode);
            DriverReferralsSchema.findOne({
              referralCode: fields.inviteCode
            })
              .lean()
              .exec(function (err, driverReferral) {
                console.log('driverReferral', err);
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                } else if (!driverReferral) {
                  return nextCall({
                    message: 'INVALID_REFERRAL_CODE'
                  });
                } else {
                  /* 
                             * Discontinued due to nth child logic
                            if (driverReferral.driverLevel < 2) {
                                let referralCodeGenerated = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
                                nextCall(null, fields, referralCodeGenerated, driverReferral);
                            } else {
                                let referralCodeGenerated = "";
                                nextCall(null, fields, referralCodeGenerated, driverReferral);
                            } */
                  //generate referral code 
                  let referralCodeGenerated =
                    Math.random()
                      .toString(36)
                      .substring(2, 6) +
                    Math.random()
                      .toString(36)
                      .substring(2, 6);
                  nextCall(null, fields, referralCodeGenerated, driverReferral);
                }
          });
          } else {
            let referralCodeGenerated =
              Math.random()
                .toString(36)
                .substring(2, 6) +
              Math.random()
                .toString(36)
                .substring(2, 6);
            nextCall(null, fields, referralCodeGenerated, false);
          }
        },
        /** insert data into driver collection */
        function (fields, referralCodeGenerated, driverReferral, nextCall) {
          console.log("STEP14::::::::::::;", fields);
          console.log("STEP14::::::::::::;", referralCodeGenerated);
          console.log("STEP14::::::::::::;", driverReferral);

          /*
                let location = {};
                location.coordinates = [0, 0];
                if (fields.lat && fields.lat != "" && fields.long && fields.long != "") {
                    location.coordinates = [Number(fields.long), Number(fields.lat)]; //<field>: [<longitude>, <latitude> ]
                }
                */

          // let vehicleData = {
          //   typeId: fields.typeId,
          //   year: fields.year ? fields.year : '',
          //   seats: fields.seats ? fields.seats : '',
          //   color: fields.color,
          //   model: fields.model ? fields.model : '',
          //   isAcAvailable: fields.isAcAvailable,
          //   isSmokingAllowed: fields.isSmokingAllowed,
          //   vehiclePhotos: fields.vehiclePhotos,
          //   vehicleIdPhotos: fields.vehicleIdPhotos,
          //   plateNoPhotos: fields.plateNoPhotos,
          //   platNumber: fields.platNumber
          // };

          let deviceDetail = {
            os: fields.deviceOs,
            token: fields.deviceToken,
            brand: fields.deviceBrand
          };

          let driverData = {
            uniqueID: fields.uniqueID,
            name: fields.name ? fields.name : '',
            email: fields.email ? fields.email : '',
            dob: fields.dob,
            gender: fields.gender,
            phoneNumber: fields.phoneNumber,
            profilePhoto: fields.profilePhoto,
            countryCode: fields.countryCode,
            onlyPhoneNumber: fields.onlyPhoneNumber,
            // profilePhoto: fields.profilePhoto,
            idPhotos: fields.idPhotos,
            // vehicle: vehicleData,
            deviceDetail: deviceDetail,
            languageId: fields.languageId,
            isOnline: true,
            referralCode: referralCodeGenerated,
            inviteCode: fields.inviteCode,
            driverLevel: driverReferral ? driverReferral.driverLevel + 1 : 0,
            autoIncrementID: fields.autoIncrementID
          };

          if (fields.longitude && fields.latitude) {
            if (fields.angle) {
              driverData.location = {
                type: 'Point',
                index: '2dsphere',
                coordinates: [Number(fields.longitude), Number(fields.latitude)],
                angle: Number(fields.angle),
                speed: fields.speed ? Number(fields.speed) : 0
              };
            } else {
              driverData.location = {
                type: 'Point',
                index: '2dsphere',
                coordinates: [Number(fields.longitude), Number(fields.latitude)],
                speed: fields.speed ? Number(fields.speed) : 0
              };
            }
          }

          let driver = new DriverSchema(driverData);
          driver.save(function (err, driverData) {
            console.log('err', err);
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              nextCall(null, driver, driverReferral);
            }
          });
        },
        /** insert data into driver collection */
        function (driver, driverReferral, nextCall) {
          console.log("STEP15::::::::::::;", driver, driverReferral);
          DriverSchema.findOne({
            _id: driver._id
          })
            .populate('vehicle.typeId')
            .populate('languageId')
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!driver) {
                return nextCall({
                  message: 'DRIVER_NOT_FOUND'
                });
              } else {
                var jwtData = {
                  _id: driver._id,
                  email: driver.email,
                  deviceToken: driver.deviceDetail.token,
                  type: 'driver'
                };
                // create a token
                var d = driver.toObject();
                d.access_token = jwt.sign(jwtData, config.secret, {
                  // expiresIn: config.jwtTokenExpiryTime
                });

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

                nextCall(null, d, driverReferral);
              }
            });
        },
        /** driverReferral find parent driver */
        function (driver, driverReferral, nextCall) {
          let referralData;
          if (driverReferral && driverReferral.driverLevel == 0) {
            console.log("STEP16::::::::::::;", driver, driverReferral);
            referralData = {
              driver: driver._id,
              parentDriver: driverReferral.driver,
              // grandParentDriver: null,
              // greatGrandParentDriver: null,
              referralCode: driver.referralCode,
              inviteCode: driver.inviteCode,
              driverLevel: driverReferral.driverLevel + 1
            };
            nextCall(null, driver, referralData);
          } else if (driverReferral && driverReferral.driverLevel == 1) {
            referralData = {
              driver: driver._id,
              parentDriver: driverReferral.driver,
              grandParentDriver: driverReferral.parentDriver,
              // greatGrandParentDriver: null,
              referralCode: driver.referralCode,
              inviteCode: driver.inviteCode,
              driverLevel: driverReferral.driverLevel + 1
            };
            nextCall(null, driver, referralData);
          } else if (driverReferral && driverReferral.driverLevel >= 2) {
            referralData = {
              driver: driver._id,
              parentDriver: driverReferral.driver,
              grandParentDriver: driverReferral.parentDriver,
              greatGrandParentDriver: driverReferral.grandParentDriver,
              referralCode: driver.referralCode,
              inviteCode: driver.inviteCode,
              driverLevel: driverReferral.driverLevel + 1
            };
            nextCall(null, driver, referralData);
          } else {
            referralData = {
              driver: driver._id,
              // parentDriver: null,
              // grandParentDriver: null,
              // greatGrandParentDriver: null,
              referralCode: driver.referralCode,
              inviteCode: '',
              driverLevel: 0
            };
            nextCall(null, driver, referralData);
          }
        },
        function (driver, referralData, nextCall) {
          console.log("STEP17::::::::::::;", driver, referralData);
          let driverRefData = new DriverReferralsSchema(referralData);
          driverRefData.save(function (err, driverData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              nextCall(null, driver);
            }
          });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'DRIVER_CREATE_SUCCESS',
          data: r
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Edit Driver  completed
   * ------------------------------------------------ */
  edit: function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        // function(fields, files, nextCall) {
        //     if (fields && (!fields.driver_id)) {
        //         return nextCall({
        //             "message": 'INVALID_PARAMS'
        //         });
        //     }
        //     nextCall(null, fields, files);
        // },
        /** get driver details */
        function (fields, files, nextCall) {
          DriverSchema.findOne({
            _id: req.user._id
          })
            .lean()
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!driver) {
                return nextCall({
                  message: 'DRIVER_NOT_FOUND'
                });
              } else {
                nextCall(null, fields, files, driver);
              }
            });
        },
        /** check email and mobile no already registered or not */
        function (fields, files, driver, nextCall) {
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
            DriverSchema.findOne({
              $or: userExistCondition
            }).exec(function (err, driverData) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (driverData) {
                return nextCall({
                  message: 'DRIVER_ALREADY_REGISTERED'
                });
              } else {
                nextCall(null, fields, files, driver);
              }
            });
          } else {
            nextCall(null, fields, files, driver);
          }
        },
        /** upload profile picture */
        function (fields, files, driver, nextCall) {
          if (files.profilePhoto) {
            // skip files except image files
            if (files.profilePhoto.type.indexOf('image') === -1) {
              return nextFile(null, null);
            }

            var extension = path.extname(files.profilePhoto.name);
            var filename = DS.getTime() + extension;
            let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
            let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload({
                    // upload thumb file
                    src: files.profilePhoto.path,
                    dst: rootPath + '/' + thumb_image
                  },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload({
                    // upload large file
                    src: files.profilePhoto.path,
                    dst: rootPath + '/' + large_image
                  },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove({
                    filepath: files.profilePhoto.path
                  },
                    nextProc
                  );
                },
                function (nextProc) {
                  // remove old large image
                  if (driver.profilePhoto && driver.profilePhoto != '') {
                    Uploader.remove({
                      filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
                    },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
                function (nextProc) {
                  // remove old thumb image
                  if (driver.profilePhoto && driver.profilePhoto != '') {
                    Uploader.remove({
                      filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
                    },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                }
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
            // if (driver.profilePhoto && driver.profilePhoto != '') {
            //     /** remove large image */
            //     Uploader.remove({
            //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
            //     });
            //     /** remove thumb image */
            //     Uploader.remove({
            //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
            //     });
            // }

            // fields.profilePhoto = "";
            nextCall(null, fields, files, driver);
          }
        },
        /** remove id photos */
        function (fields, files, driver, nextCall) {
          console.log('fileds for removeID', fields.removeIdPhotos);
          if (fields.removeIdPhotos && fields.removeIdPhotos.length > 0) {
            if (fields.removeIdPhotos && typeof fields.removeIdPhotos == 'string') {
              fields.removeIdPhotos = JSON.parse(fields.removeIdPhotos);
            }
            async.mapSeries(
              fields.removeIdPhotos,
              function (k, nextFile) {
                /** remove image from server */
                if (k && k != '') {
                  Uploader.remove({
                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + k
                  });

                  Uploader.remove({
                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + k
                  });
                }

                /** remove image name from id photos array */
                driver.idPhotos = driver.idPhotos.filter(item => item !== k);
                nextFile(null);
              },
              function (err) {
                nextCall(null, fields, files, driver);
              }
            );
          } else {
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
                if (files.idPhotos[k].type.indexOf('image') === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.idPhotos[k].name);
                var filename = DS.getTime() + extension;
                let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                async.series(
                  [
                    function (nextProc) {
                      Uploader.thumbUpload({
                        // upload thumb file
                        src: files.idPhotos[k].path,
                        dst: rootPath + '/' + thumb_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload({
                        // upload large file
                        src: files.idPhotos[k].path,
                        dst: rootPath + '/' + large_image
                      },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove({
                        filepath: files.idPhotos[k].path
                      },
                        nextProc
                      );
                    }
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
                console.log('idPhotoName---', idPhotosName);
                driver.idPhotos = driver.idPhotos.concat(idPhotosName);
                console.log('driver photo after update',driver.idPhotos);

                if(driver.idPhotos.length>2){
                  let length = driver.idPhotos.length-2;
                  for(let i=0; i<length; i++){
                    // remove last photoes 
                    console.log('i', i);
                    driver.idPhotos.shift(); 
                  }
                }
                console.log('after shift data',driver.idPhotos);
                nextCall(null, fields, driver);
              }
            );
          } else {
            nextCall(null, fields, driver);
          }
        },
   
        /** update data into driver collection */
        function (fields, driver, nextCall) {
          // let vehicleData = {
          //     "typeId": fields.typeId ? fields.typeId : driver.vehicle.typeId,
          //     "year": fields.year ? fields.year : driver.vehicle.year,
          //     "seats": fields.seats ? fields.seats : driver.vehicle.seats,
          //     "color": fields.color ? fields.color : driver.vehicle.color,
          //     "model": fields.model ? fields.model : driver.vehicle.model,
          //     "isAcAvailable": fields.isAcAvailable ? fields.isAcAvailable : driver.vehicle.isAcAvailable,
          //     "isSmokingAllowed": fields.isSmokingAllowed ? fields.isSmokingAllowed : driver.vehicle.isSmokingAllowed,
          //     "vehiclePhotos": fields.vehiclePhotos ? fields.vehiclePhotos : driver.vehicle.vehiclePhotos,
          //     "vehicleIdPhotos": fields.vehicleIdPhotos ? fields.vehicleIdPhotos : driver.vehicle.vehicleIdPhotos,
          //     "plateNoPhotos": fields.plateNoPhotos ? fields.plateNoPhotos : driver.vehicle.plateNoPhotos,
          //     "platNumber": fields.platNumber ? fields.platNumber : driver.vehicle.platNumber,
          // }

          // let vehicleData = {
          //   typeId: fields.typeId,
          //   year: fields.year,
          //   seats: fields.seats,
          //   color: fields.color,
          //   model: fields.model,
          //   isAcAvailable: fields.isAcAvailable,
          //   isSmokingAllowed: fields.isSmokingAllowed,
          //   vehiclePhotos: fields.vehiclePhotos ? fields.vehiclePhotos : driver.vehicle.vehiclePhotos,
          //   vehicleIdPhotos: fields.vehicleIdPhotos ? fields.vehicleIdPhotos : driver.vehicle.vehicleIdPhotos,
          //   plateNoPhotos: fields.plateNoPhotos ? fields.plateNoPhotos : driver.vehicle.plateNoPhotos,
          //   platNumber: fields.platNumber,
          // };

          // let updateDriverData = {
          //     "uniqueID": fields.uniqueID ? fields.uniqueID : driver.uniqueID,
          //     "name": fields.name ? fields.name : driver.name,
          //     "email": fields.email ? fields.email : driver.email,
          //     "dob": fields.dob ? fields.dob : driver.dob,
          //     "phoneNumber": fields.phoneNumber ? fields.phoneNumber : driver.phoneNumber,
          //     "countryCode": fields.countryCode ? fields.countryCode : driver.countryCode,
          //     "onlyPhoneNumber": fields.onlyPhoneNumber ? fields.onlyPhoneNumber : driver.onlyPhoneNumber,
          //     "profilePhoto": fields.profilePhoto ? fields.profilePhoto : driver.profilePhoto,
          //     "idPhotos": driver.idPhotos,
          //     "vehicle": vehicleData
          // }

          let updateDriverData = {
            // uniqueID: fields.uniqueID,
            name: fields.name,
            email: fields.email,
            dob: fields.dob ? fields.dob : driver.dob,
            gender: fields.gender ? fields.gender : driver.gender,
            phoneNumber: fields.phoneNumber ? fields.phoneNumber : driver.phoneNumber,
            countryCode: fields.countryCode ? fields.countryCode : driver.countryCode,
            onlyPhoneNumber: fields.onlyPhoneNumber ? fields.onlyPhoneNumber : driver.onlyPhoneNumber,
            profilePhoto: fields.profilePhoto ? fields.profilePhoto : driver.profilePhoto,
            idPhotos: driver.idPhotos,
            drivingLicence: fields.drivingNumber ? fields.drivingNumber : driver.drivingLicence,  
            // vehicle: vehicleData
          };

          DriverSchema.findOneAndUpdate({
            _id: driver._id
          }, {
            $set: updateDriverData
          }, {
            upsert: true,
            new: true
          })
            .populate('languageId')
            .exec(function (err, driver) {
              if (err) {
                console.log('err --------',err);
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!driver) {
                return nextCall({
                  message: 'DRIVER_NOT_FOUND'
                });
              } else {
                // var jwtData = {
                //     _id: driver._id,
                //     email: driver.email,
                //     deviceToken: driver.deviceDetail.token
                // };
                // create a token
                var d = driver.toObject();
                // d.access_token = jwt.sign(jwtData, config.secret, {
                //     // expiresIn: config.jwtTokenExpiryTime
                // });

                //Profile Photo
                d.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                d.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;

                //ID Photo
                d.idPhotosLarge = CONSTANTS.ID_PHOTO_LARGE_URL;
                d.idPhotosThumb = CONSTANTS.ID_PHOTO_THUMB_URL;

                //Vehicle Photos
                // d.vehiclePhotosUrlLarge = CONSTANTS.VEHICLE_PHOTO_LARGE_URL;
                // d.vehiclePhotosUrlThumb = CONSTANTS.VEHICLE_PHOTO_THUMB_URL;

                // //vehicle Id Photos
                // d.vehicleIdPhotosUrlLarge = CONSTANTS.VEHICLE_ID_PHOTO_LARGE_URL;
                // d.vehicleIdPhotosUrlThumb = CONSTANTS.VEHICLE_ID_PHOTO_THUMB_URL;

                // //Plate No Photo
                // d.plateNoPhotosUrlLarge = CONSTANTS.PLATE_NO_PHOTO_LARGE_URL;
                // d.plateNoPhotosUrlThumb = CONSTANTS.PLATE_NO_PHOTO_THUMB_URL;
                  nextCall(null, d);
              }
            });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'DRIVER_UPDATE_SUCC',
          data: r
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * My Profile  completed
   * ------------------------------------------------ */
  detail: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          DriverSchema.findOne({
            _id: req.user._id
          })
            .populate('vehicle.typeId')
            .populate('languageId')
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!driver) {
                return nextCall({
                  message: 'NUMBER_NOT_REGISTERED'
                });
              } else {
                let d = driver.toObject();

                //Profile Photo
                d.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                d.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;

                //ID Photo
                d.idPhotosLarge = CONSTANTS.ID_PHOTO_LARGE_URL;
                d.idPhotosThumb = CONSTANTS.ID_PHOTO_THUMB_URL;

                //Vehicle Photos
                // d.vehiclePhotosUrlLarge = CONSTANTS.VEHICLE_PHOTO_LARGE_URL;
                // d.vehiclePhotosUrlThumb = CONSTANTS.VEHICLE_PHOTO_THUMB_URL;

                // //vehicle Id Photos
                // d.vehicleIdPhotosUrlLarge = CONSTANTS.VEHICLE_ID_PHOTO_LARGE_URL;
                // d.vehicleIdPhotosUrlThumb = CONSTANTS.VEHICLE_ID_PHOTO_THUMB_URL;

                // //Plate No Photo
                // d.plateNoPhotosUrlLarge = CONSTANTS.PLATE_NO_PHOTO_LARGE_URL;
                // d.plateNoPhotosUrlThumb = CONSTANTS.PLATE_NO_PHOTO_THUMB_URL;

                nextCall(null, d);
              }
            });
        },
        function (response, nextCall) {
          NotificationSchema.count({
            driverId: req.user._id,
            isRead: false
          }).exec(function (err, result) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              response.unreadNotification = result;
              nextCall(null, response);
            }
          });
        },
        function (response, nextCall) {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              isRead: false
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: '$type',
              badgeCount: {
                $sum: 1
              }
            }
          });
          NotificationSchema.aggregate(aggregateQuery, (err, notificationCounts) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              let notificationBadgeCountData = {};
              async.map(
                notificationCounts,
                function (notificationCount, callback) {
                  if (notificationCount._id == 'reward') {
                    notificationBadgeCountData.reward = notificationCount.badgeCount;
                  } else if (notificationCount._id == 'billing_plan') {
                    notificationBadgeCountData.billing_plan = notificationCount.badgeCount;
                  } else if (notificationCount._id == 'credit') {
                    notificationBadgeCountData.credit = notificationCount.badgeCount;
                  } else if (notificationCount._id == 'notification') {
                    notificationBadgeCountData.notification = notificationCount.badgeCount;
                  }
                  callback(null);
                },
                function (err) {
                  response.notificationBadgeCountData = notificationBadgeCountData;
                  nextCall(null, response);
                }
              );
            }
          });
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Get Status  need to change 
   * ------------------------------------------------ */
  getStatus: function (req, res) {
    var response = {
      user: {},
      ride: {}
    };
    async.waterfall(
      [
        /** get driver details */
        function (nextCall) {  
          DriverSchema.findOne({ // need to change query 
            _id: req.user._id
          })
            .populate('languageId')
            .populate('vehicle.typeId')
            .select(
              'uniqueID name phoneNumber countryCode onlyPhoneNumber profilePhoto isVerified isBlocked isOnline isBusy isAvailable avgRating creditBalance totalCompletedRides radius vehicle inviteCode referralCode driverLevel totalPoints'
            )
            .lean()
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!driver) {
                return nextCall({
                  message: 'NUMBER_NOT_REGISTERED'
                });
              } else {
                let phoneNumber = driver.countryCode + ' ' + driver.onlyPhoneNumber.substring(0, 2) + ' ' + driver.onlyPhoneNumber.substring(2, 5) + ' ' + driver.onlyPhoneNumber.substring(5, driver.onlyPhoneNumber.length);
                driver.phoneNumber = phoneNumber;

                response.user = driver;
                response.user.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                response.user.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                response.user.badge = 'silver';
                response.user.currentDate = DS.now();

                nextCall(null, response);
              }
            });
        },
        /** get driver active ride */
        function (response, nextCall) {
          RideSchema.findOne({
            driverId: response.user._id,
            status: {
              $in: ['requested', 'accepted', 'arrived', 'onride', 'completed']
            },
            paymentStatus: false
          })
            .populate('passengerId')
            .sort('createdAt')
            .lean()
            .exec((err, ride) => {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!ride) {
                response.ride = {};
              } else {
                response.ride = ride;
              }
              nextCall(null, response);
            });
        },
        /** get driver today ride data and earning data */
        (response, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: response.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              todayTotalRideDistance: {
                $sum: '$totalDistance'
              },
              todayTotalRideTime: {
                $sum: '$totalTime'
              },
              todayTotalEarningFromRide: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, todayRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (todayRides.length > 0) {
                response.user.todayTotalRideDistance = todayRides[0].todayTotalRideDistance;
                response.user.todayTotalRideTime = todayRides[0].todayTotalRideTime;
                response.user.todayTotalEarningFromRide = todayRides[0].todayTotalEarningFromRide;
              } else {
                response.user.todayTotalRideDistance = 0;
                response.user.todayTotalRideTime = 0;
                response.user.todayTotalEarningFromRide = 0;
              }
              // response.user.todayTotalEarningFromReferralEarning = 0;
              nextCall(null, response);
            }
          });
        },
        /** get total referral earning need to remove */
        (response, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              beneficiaryDriverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              referralEarnings: {
                $sum: '$referralAmount'
              }
            }
          });
          DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, todayDriverRefEarningLogs) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (todayDriverRefEarningLogs.length > 0) {
                response.user.todayTotalEarningFromReferralEarning = todayDriverRefEarningLogs[0].referralEarnings;
              } else {
                response.user.todayTotalEarningFromReferralEarning = 0;
              }
              nextCall(null, response);
            }
          });
        },
        (response, nextCall) => {
          if (response.ride && response.ride._id) {
            nextCall(null, response, null);
          } else {
            DriverRideRequestSchema.findOne({
              driverId: req.user._id,
              status: {
                $elemMatch: {
                  type: 'sent',
                  createdAt: {
                    $gt: moment()
                      .subtract(Number(RIDE_REQUEST_TIMEOUT), 'seconds')
                      .toISOString()
                  }
                }
              }
            }).exec((err, driverRideRequest) => {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }

              if (driverRideRequest && driverRideRequest.status) {
                let driverSentRequestDiff = moment(DS.now()).diff(
                  moment(Number(driverRideRequest.status[driverRideRequest.status.length - 1]['createdAt'])),
                  'seconds'
                );
                if (driverSentRequestDiff < RIDE_REQUEST_TIMEOUT) {
                  response.timer = RIDE_REQUEST_TIMEOUT;
                  response.remainingTimer = RIDE_REQUEST_TIMEOUT - driverSentRequestDiff;
                  nextCall(null, response, driverRideRequest.rideId);
                } else {
                  nextCall(null, response, null);
                }
              } else {
                response.timer = RIDE_REQUEST_TIMEOUT;
                response.remainingTimer = 0;
                nextCall(null, response, null);
              }
            });
          }
        },
        (response, rideId, nextCall) => {
          if (rideId && rideId != '') {
            RideSchema.findOne({
              _id: rideId
            })
              .populate('passengerId')
              .exec((err, rideData) => {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                }
                response.ride = rideData;
                if (rideData && rideData.driverId == '') {
                  response.timer = RIDE_REQUEST_TIMEOUT;
                  response.remainingTimer = 0;
                }

                redisClient.lrange(`ride.location.${rideData._id}`, 0, -1, (err, reply) => {
                  if (err) {
                    console.log('------------------------------------');
                    console.log('acceptOrPassRequest redis error:', err);
                    console.log('------------------------------------');
                  }

                  let locationRoute = JSON.parse(JSON.stringify(reply));
                  async.map(
                    locationRoute,
                    function (location, callback) {
                      let splitData = location.split(',');
                      let RouteData = {
                        coordinates: [Number(splitData[0]), Number(splitData[1])]
                      };
                      callback(null, RouteData);
                    },
                    function (err, RouteData) {
                      response.ride.locationRoute = RouteData;
                      nextCall(null, response);
                    }
                  );
                });
              });
          } else {
            if (response.ride && response.ride._id) {
              redisClient.lrange(`ride.location.${response.ride._id}`, 0, -1, (err, reply) => {
                if (err) {
                  console.log('------------------------------------');
                  console.log('acceptOrPassRequest redis error:', err);
                  console.log('------------------------------------');
                }

                let locationRoute = JSON.parse(JSON.stringify(reply));
                async.map(
                  locationRoute,
                  function (location, callback) {
                    let splitData = location.split(',');
                    let RouteData = {
                      coordinates: [Number(splitData[0]), Number(splitData[1])]
                    };
                    callback(null, RouteData);
                  },
                  function (err, RouteData) {
                    response.ride.locationRoute = RouteData;
                    nextCall(null, response);
                  }
                );
              });
            } else {
              nextCall(null, response);
            }
          }
        },
        (response, nextCall) => {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSettingData[0]) {
              response.driverVersionUpdate = getSettingData[0].driverVersionUpdate;
              response.driverMinimumBalance = getSettingData[0].driverMinimumBalance;
              nextCall(null, response);
            } else {
              return nextCall({
                message: 'SYSTEM_SETTINGS_NOT_FOUND'
              });
            }
          });
        },
        (response, nextCall) => {
          console.log('here');
          callHistorySchema.findOne({
            "driverId": req.user._id,
            "status": "requested"
          }).populate({
            path: 'passengerId',
            select: 'name profilePhoto'
          }).exec(function (err, result) {
            if (err) {
              // console.log('driver error ', err);
              response.callDetails = {};
            } else if (!result) {
              response.callDetails = {};
            } else {
              console.log(result);

              response.callDetails = result;

            }
            console.log('response.callDetails', response.callDetails);
            nextCall(null, response);
          })
        },
        (response, nextCall) => {
          NotificationSchema.count({
            driverId: req.user._id,
            isRead: false
          }).exec(function (err, result) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              response.unreadNotification = result;
              nextCall(null, response);
            }
          });
        },
        (response, nextCall) => {
          RideSchema.count({
            driverId: req.user._id,
          }).exec(function (err, result) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              console.log(result);
              response.totalRideCount = result;
              nextCall(null, response);
            }
          });
        },
        (response, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              isRead: false
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: '$type',
              badgeCount: {
                $sum: 1
              }
            }
          });
          NotificationSchema.aggregate(aggregateQuery, (err, notificationCounts) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              let notificationBadgeCountData = {};
              async.map(
                notificationCounts,
                function (notificationCount, callback) {
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
                },
                function (err) {
                  response.notificationBadgeCountData = notificationBadgeCountData;
                  nextCall(null, response);
                }
              );
            }
          });
        },

        /* For totalReferralCount remove this next call*/
        function (response, nextCall) {
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
                    .startOf('month')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              },
              $or: [{
                parentDriver: mongoose.Types.ObjectId(req.user._id)
              },
              {
                grandParentDriver: mongoose.Types.ObjectId(req.user._id)
              },
              {
                greatGrandParentDriver: mongoose.Types.ObjectId(req.user._id)
              }
              ]
            }
          });
          aggregateQuery.push({
            $group: {
              _id: null,
              totalInvitedCount: {
                $sum: 1
              }
            }
          });
          DriverReferralsSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG
              });
            } else {
              if (totalInvitedCountData && totalInvitedCountData.length > 0) {
                response.totalReferralCount = totalInvitedCountData[0].totalInvitedCount;
                nextCall(null, response);
              } else {
                response.totalReferralCount = 0;
                nextCall(null, response);
              }
            }
          });
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },

/* --------------------------------------------------\*
   * send request for vehicle->  test
   * ------------------------------------------------ */
  sendRequestForVehicle : async function(req,res){
    console.log('in send request', req.body)
    let fields= req.body;
    fields.createdBy = req.user._id;
  // driverId  check
  // let checkDriverAssignToVehicle = await VehicleSchema.findOne({ currentDriverAssignId: req.user._id})
  //   if(checkDriverAssignToVehicle){
  //     return res.sendToEncode({
  //       status: 400,
  //       message: 'driver has already assign vehicle'
  //     });  
  //   }
    let checkDriverRequestCondition = { 
      driverId: mongoose.Types.ObjectId(req.user._id),
      vehicleId: mongoose.Types.ObjectId(fields.vehicleId),
      isDeleted: false,
      status: 'pending'
    }
  let checkDriverRequest = await VehicleRequestSchema.findOne(checkDriverRequestCondition);
  if(checkDriverRequest){
    console.log('here no vehicle id found');
    return res.sendToEncode({
      status: 400,
      message: 'already sended request to same vehicle',
    });
  }

  // let findDriver = await DriverSchema.findOne({ _id : req.user._id});
  // if(!findDriver){
  //   return res.sendToEncode({
  //     status: 400,
  //     message: (err && err.message) || message.SOMETHING_WENT_WRONG,
  //   });
  // }
  let findVehicleId = await  VehicleSchema.findOne({ _id : mongoose.Types.ObjectId(fields.vehicleId)});
  if(!findVehicleId){
    console.log('here no vehicle id found');
    return res.sendToEncode({
      status: 400,
      message: 'vehicle not found',
    });
  }
  let data = { 
            driverId: fields.createdBy,
            vehicleOwnerId: fields.vehicleOwnerId,
            vehicleId: fields.vehicleId, 
            isSendByDriver: true
          }
          let userData = new VehicleRequestSchema(data);
          userData.save(function (err, responseData) {
            if (err) {
              console.log('err 1',err);
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || message.SOMETHING_WENT_WRONG,
              });
            }
            // console.log(responseData);
          //   _self.addActionLog(
          //     req.user,
          //     log_message.SECTION.DRIVER,
          //     log_message.ACTION.ADD_DRIVER +
          //       ", vehicleRequestId: " +
          //       responseData.autoIncrementID 
          //   );
            return res.sendToEncode({
                    status_code: 200,
                    message: 'added successfully',
                    data: {},
                  });
          });
  },
/* --------------------------------------------------\*
   * vehicleList test
   * ------------------------------------------------ */
  listVehicles: async function(req, res){
    try{
    async.waterfall(
      [
        function (nextCall) {
        let conditionData = {isDriverAssign: false, currentDriverAssign: false};
        let aggregateQuery=[];
        let commissionMin = req.query.commissionMin ? Number( req.query.commissionMin) : 0;
        let commissionMax = req.query.commissionMax ? Number( req.query.commissionMax) : 10;
        let carTypeQuery =  req.query.carType ?  req.query.carType : false;
        let carSeatsQuery = req.query.carSeats? req.query.carSeats : false;
        let carAge =  req.query.carAge ?  req.query.carAge : false;
        let transmission=  req.query.transmission ?  req.query.transmission : false;
          console.log('query',req.query);
         var columnName = req.query.columnName ? req.query.columnName : "_id";
         var orderBy = req.query.orderBy == "asc" ? 1 : -1;
          if(commissionMin && commissionMax){
            aggregateQuery.push({
              $match: {
                $and: [{commissionPercentage: {$lte : commissionMax}},{commissionPercentage: {$gte : commissionMin}}]}
            });  
          }
          if(carTypeQuery){
            aggregateQuery.push({
              $match: {
                typeId:  mongoose.Types.ObjectId(carTypeQuery)
              }
            })  
          }
          if(carSeatsQuery){
            aggregateQuery.push({
              $match: {
                seats : carSeatsQuery
              }
            })  
          }
          if(transmission){
            aggregateQuery.push({
              $match: {
                transmissionType : transmission
              }
            })  
          }
          if(carAge){
            aggregateQuery.push({
              $match: {
                year:  carAge
              }
            })  
          }
          console.log('cnnd',conditionData);
          aggregateQuery.push({
            $match: conditionData
          })
          aggregateQuery.push({
              '$lookup': {
              'from': 'admin_app',
              'let': {
              'id': '$addedBy'
              },
              // 'localField': 'client',
              // 'foreignField': '_id',
              'pipeline': [{
              '$match': {
              '$expr': {
              '$eq': ['$_id', '$$id']
              }
              }
              },
              {
              '$project': {
                name :1
              }
              }
              ],
              'as': 'addedByData'
            }
          });
          aggregateQuery.push( {
            '$unwind': {
              'path': '$addedByData', 
              'preserveNullAndEmptyArrays': true
            }
          });
        
         aggregateQuery.push( {
          '$lookup': {
            'from': 'vehicle_type', 
            'localField': 'typeId', 
            'foreignField': '_id', 
            'as': 'vehicleTypeData'
          }
        }, {
          '$unwind': {
            'path': '$vehicleTypeData', 
            'preserveNullAndEmptyArrays': true
          }
        },{
          '$project': { 
            'plateNoPhotos': 0,
            'vehicleIdPhotos':0,
            'vehiclePhotos':0,
            'isAcAvailable':0,
            'color': 0,
            'isDeleted': 0,
            'isDriverAssign':0,
            'transmissionType':0,
            'currentDriverAssignId':0,
            'currentDriverAssign':0
          }
        } 
        );
         aggregateQuery.push({
           $sort: { [columnName]: orderBy },
         });
  
         aggregateQuery.push({
           $skip: Number(req.query.skip) || 0,
         });
  
         aggregateQuery.push({
           $limit: Number(req.query.limit) || 10,
         });
         console.log('aggreate',aggregateQuery);
         VehicleSchema.aggregate(aggregateQuery, (err, allVehicle) => {
           console.log('all',allVehicle);
          if (err) {
            console.log(err);
            return nextCall({
              message: 'some thing went wrong',
            });
          } else {
            let responseData = {};
            responseData.allVehicle = allVehicle;
            nextCall(null,responseData);
          }
        });
  }
  ],
  function (err,data) {
  console.log('data---',data);
  if (data) {
    return res.sendToEncode({
      status_code: 200,
      message: 'list of vehicle data',
      data: data,
    });
  }else {
    return res.sendToEncode({
      status: 400,
      message: 'no vehicle available',
    });
  }
  }
  )  
}catch(err){
  console.log('error from api',err);
}
  },
  vehicleIdData :  async function(req,res){
    // let data = req.query.vehicleId; 
    let condition = {_id: mongoose.Types.ObjectId(req.query.vehicleId) };
    let aggregateQuery= [];
    aggregateQuery.push({
      $match: condition
    })
    aggregateQuery.push({
        '$lookup': {
        'from': 'admin_app',
        'let': {
        'id': '$addedBy'
        },
        // 'localField': 'client',
        // 'foreignField': '_id',
        'pipeline': [{
        '$match': {
        '$expr': {
        '$eq': ['$_id', '$$id']
        }
        }
        },
        {
        '$project': {
          name :1,
          type:1,
          phoneNumber:1,
          profilePhoto:1
        }
        }
        ],
        'as': 'addedByData'
      }
    });
    aggregateQuery.push( {
      '$unwind': {
        'path': '$addedByData', 
        'preserveNullAndEmptyArrays': false
      }
    });
  
   aggregateQuery.push({
    '$lookup': {
      'from': 'vehicle_type', 
      'localField': 'typeId', 
      'foreignField': '_id', 
      'as': 'vehicleTypeData'
    }
  }, {
    '$unwind': {
      'path': '$vehicleTypeData', 
      'preserveNullAndEmptyArrays': false
    }
  });
// console.log(JSON.stringify(aggregateQuery));
  VehicleSchema.aggregate(aggregateQuery, (err, allVehicle) => {
    if (err) {
      return res.sendToEncode({
        message: message.SOMETHING_WENT_WRONG,
      });
    } else {
      let responseData = {};
      responseData.allVehicle = allVehicle;
      responseData.url= API_URL + "uploads/vehicle_photos/large";
      return res.sendToEncode({
        status_code: 200,
        message: 'vehicle data',
        data: responseData,
      });
    }
  });
  },
/* --------------------------------------------------\*
   * accept/ reject  test
   * ------------------------------------------------ */

  acceptRejectRequest: async function(req,res){
    // here accept or reject vehicle owner request
    // also check driver has already assign vehicle or not 
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (fields && !fields.requestId && !fields.status) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields);
        },
        function(fields, nextCall){
          // check that driver has already assign or not to other vehicle 
          VehicleSchema.findOne( { 
            currentDriverAssignId: req.user._id,
            isDeleted:  false
          }, function( err, updateAssignId){
            if (err) {
              console.log(err);
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            if(updateAssignId){
              return nextCall({
                message: 'already assign to another vehicle',
              });
            }
          });    
        },
        function(fields, nextCall){
          VehicleRequestSchema.findOneAndUpdate(
            { _id: fields.requestId},
            {
              status:  fields.status,
            },
            function (err, updateData) {
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              if(fields.status=='approve'){
                VehicleSchema.updateOne( { 
                  _id: updateData.vehicleId,
                  isDeletd: false
                }, { 
                  currentDriverAssignId: updateData.driverId
                }, function( err, updateAssignId){
                  if (err) {
                    console.log(err);
                    return nextCall({
                      message: message.SOMETHING_WENT_WRONG,
                    });
                  }// remove pending request for that vehicleid 
                  if(updateAssignId){
                    VehicleRequestSchema.updateMany({ vehicleId: updateData.vehicleId ,isApproved:false}, { isDeleted: true});
                  }else {
                  // vehicle 
                  return nextCall({
                    message: 'vehicle already assign',
                  });
                  }
                });
              }
              // generate actionlog
              nextCall(null, updateData);
            }
          );
        }
      ],
      function (err,data) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'request update successfully',
          data: {},
        });
      } 
    )   
  },
  
/* --------------------------------------------------\*
   * vehicle request list with reject and accept 
   * ------------------------------------------------ */
  vehicleRequestList:  async function(req, res){
    // here list of all vehicle request shown 
            async.waterfall(
              [
            function (nextCall) {
            let userId = req.user._id;
            let aggregateQuery=[];
            var status= req.query.status ? req.query.status : false;
            var columnName = req.query.columnName ? req.query.columnName : "_id";
            var orderBy = req.query.orderBy == "asc" ? 1 : -1;
            if(status){
              aggregateQuery.push({
                $match: { 
                  status: status
                }
              })   
            }
            aggregateQuery.push({
              $match: { 
                isDeleted: false,
                driverId: mongoose.Types.ObjectId(userId)
              }
            })
            aggregateQuery.push({
              '$lookup': {
                'from': 'admin_app',
                'let': {
                'id': '$vehicleOwnerId'
                },
                'pipeline': [{
                '$match': {
                '$expr': {
                '$eq': ['$_id', '$$id']}
                } },{
                '$project': {
                  name :1,
                  phoneNumber:1
                }}],
                'as': 'addedByData'
              }
            });
              aggregateQuery.push(  {
            '$unwind': {
              'path': '$addedByData', 
              'preserveNullAndEmptyArrays': false
            }
            });
            aggregateQuery.push({
              '$lookup': {
              'from': 'vehicle',
              'let': {
              'id': '$vehicleId'
              },
              'pipeline': [{
              '$match': {
              '$expr': {
              '$eq': ['$_id', '$$id']}
              } },{
              '$project': {
                '_id':1,
                name :1,
                model:1,
                platNumber:1,
                commissionPercentage: 1,
                seats:1,
                typeId: 1
              }}],
              'as': 'vehicleData'
            }
          });
            aggregateQuery.push(  {
          '$unwind': {
            'path': '$vehicleData', 
            'preserveNullAndEmptyArrays': false
          }
          });
          aggregateQuery.push({
            '$addFields': {
              name :'$vehicleData.name',
              model:'$vehicleData.model',
              platNumber:'$vehicleData.platNumber',
              commissionPercentage: '$vehicleData.commissionPercentage',
              seats:'$vehicleData.seats',
              requestId: '$_id',
              _id: '$vehicleData._id',
              typeId: '$vehicleData.typeId'
            }
            });
          aggregateQuery.push({
            '$project':{
              "driverId": 0,
                "vehicleOwnerId": 0,
                "vehicleId": 0,
                "isDeletedByDriver": 0,
                "updatedAt": 0,
                "isDeleted": 0,
                "isSendByDriver": 0,
                "approvedDate": 0,

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
              VehicleRequestSchema.aggregate(aggregateQuery, (err, allRequest) => {
                if (err) {
                  return nextCall({
                    message: message.SOMETHING_WENT_WRONG,
                  });
                } else {
                  let responseData = {};
                  responseData.allRequest = allRequest;
                  nextCall(null,responseData);
                }
              });
            }
              ],
            function (err,data) {
                // console.log('data---',data);
                if (data) {
                  return res.sendToEncode({
                    status_code: 200,
                    message: 'list of data',
                    data: data,
                  });
                }else {
                  return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                  });
                }
            }
            )  
  },
/* --------------------------------------------------\*
   * Get user car list test
   * ------------------------------------------------ */
  driverCarList : async function(req,res){
    let userId = req.user._id;
    let aggregateQuery=[];
    // var status= req.query.status ? req.query.status : false;
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;
    // currentDriverAssignId
    aggregateQuery.push({
      $match: { 
        currentDriverAssignId: mongoose.Types.ObjectId(userId)
      }
    });
    aggregateQuery.push({
      '$lookup': {
      'from': 'admin_app',
      'let': {
      'id': '$addedBy'
      },
      // 'localField': 'client',
      // 'foreignField': '_id',
      'pipeline': [{
      '$match': {
      '$expr': {
      '$eq': ['$_id', '$$id']
      }
      }
      },
      {
      '$project': {
        name :1,
        phoneNumber:1
      }
      }
      ],
      'as': 'addedByData'
    }
  });
    aggregateQuery.push({
    '$unwind':{
      'path': '$addedByData', 
      'preserveNullAndEmptyArrays': false
    }
  });
    aggregateQuery.push({
    '$lookup': {
      'from': 'vehicleRequest',
      'let': {
      'id': '$_id',
      'driverId': mongoose.Types.ObjectId(userId)
      },
      // 'localField': 'client',
      // 'foreignField': '_id',
      'pipeline': [{
      '$match': {
      '$expr': {
      '$eq': ['$vehicleId', '$$id'],
      '$eq': ['$driverId', '$$driverId']
      },
      'status':'approve'
      }
      },
      {
        $sort:{
          'approvedDate': -1
        }
      },
      {
        '$limit':1
      },
      {
      '$project': {
        'approvedDate' :1,
        'createdAt': 1
      }
      }
      ],
      'as': 'requestData'
    }
  }, {
    '$unwind': {
      'path': '$requestData', 
      'preserveNullAndEmptyArrays': false
    }
  });
    aggregateQuery.push({
    '$project':{
      'addedByData':1,
      'requestData':1,
      'year':1,
      'seats':1,
      'color':1,
      'model':1,
      'platNumber':1,
      'commissionPercentage':1
    }
  });
    aggregateQuery.push({
    $skip: Number(req.query.skip) || 0,
  });
    aggregateQuery.push({
      $limit: Number(req.query.limit) || 10,
    });

  VehicleSchema.aggregate( aggregateQuery,(err, allCar) => {
    if (err) {
      return res.sendToEncode({
        message: 'something went wrong',
      });
    } else {
      let responseData = {};
      responseData.allCar = allCar;
      return res.sendToEncode({
        status_code: 200,
        message: 'list of cars',
        data: responseData,
      });
    }
  })
  },
/* --------------------------------------------------\*
   * delete pending request
   * ------------------------------------------------ */
  deleteRequest :  async function(req,res){
    if(!req.body.requestId){
        return res.sendToEncode({
          message: 'requestId parameter required',
        });
  }
  let deleteRequest = await VehicleRequestSchema.updateOne({ _id: req.body.requestId},{ isDeleted: true, isDeletedByDriver: false});
  if(deleteRequest.nModified || deleteRequest.ok ){
    return res.sendToEncode({
      status_code: 200,
      message: 'request deleted',
      data: {},
    });
  }else {
    return res.sendToEncode({
      message: 'no request found',
    });
  }
  },
  /* --------------------------------------------------\*
   * Get Current Billing Plan completed
   * ------------------------------------------------ */
  getPlans: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          DriverSchema.findOne({
            _id: req.user._id
          })
            .populate('billingId')
            // .select()
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!driver) {
                return nextCall({
                  message: 'DRIVER_NOT_FOUND'
                });
              } else if (driver.billingId) {
                billingPlan = driver.billingId;
                nextCall(null, billingPlan);
              } else {
                nextCall(null, {});
              }
            });
        },
        function (billingPlan, nextCall) {
          NotificationSchema.update({
            driverId: req.user._id,
            isRead: false,
            type: 'billing_plan'
          }, {
            isRead: true
          }, {
            multi: true
          },
            function (err, result) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                nextCall(null, billingPlan);
              }
            }
          );
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },
  /* --------------------------------------------------\*
   * Get Credit data
   * ------------------------------------------------ */
  getCreditData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          DriverSchema.findOne({
            _id: req.user._id
          })
            .select('creditBalance')
            .lean()
            .exec(function (err, driver) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!driver) {
                return nextCall({
                  message: 'DRIVER_NOT_FOUND'
                });
              } else if (driver) {
                nextCall(null, driver);
              }
            });
        },
        function (driver, nextCall) {
          NotificationSchema.update({
            driverId: driver._id,
            isRead: false,
            type: 'credit'
          }, {
            isRead: true
          }, {
            multi: true
          },
            function (err, result) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                nextCall(null, driver);
              }
            }
          );
        },
        function (driver, nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);
          driver.credits = [];
          WalletLogsSchema.find({
            driverId: driver._id,
            type: 'credit'
          })
            .sort({
              _id: -1
            })
            .limit(limit)
            .skip(offset)
            .exec(function (err, credits) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (credits.length) {
                driver.credits = credits;
                hasMore = credits.length == limit ? true : false;
                nextCall(null, {
                  driver,
                  page,
                  hasMore
                });
              } else {
                nextCall(null, {
                  driver,
                  page,
                  hasMore
                });
              }
            });
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Get Withdraws
   * ------------------------------------------------ */
  getWithdraws: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);

          WithdrawsSchema.find({
            driverId: req.user._id
          })
            .sort({
              _id: -1
            })
            .limit(limit)
            .skip(offset)
            .lean()
            .exec(function (err, withdraws) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
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
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },
  getWithdrawsLogs: function(req, res){
    async.waterfall(
      [
        function (nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);

          withdrawLogsSchema.find({
            userId: req.user._id
          })
            .sort({
              createdAt: -1
            })
            .limit(limit)
            .skip(offset)
            .lean()
            .exec(function (err, withdraws) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
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
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },
  transferMoneyFromWallet : async function(req, res){
    if(!req.body.amount && req.body.amount==''){
      return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'undefined params'
    });
    }
    else {
      let findWalletData = await DriverSchema.findOne({ _id: req.user._id}, 'walletMoney');
      if(!findWalletData){
        return res.sendToEncode({
          status:  400,
          message: 'user not find'
      });
      } else if(findWalletData.walletMoney < req.body.amount){
        return res.sendToEncode({
          status:  400,
          message: 'can not give amount greater then wallet'
      });
      } else {
        let updateWalletBalance =  await DriverSchema.updateOne({_id: req.user._id},{ $inc: {
          walletMoney: -Number(req.body.amount)
        }});

      let data ={
        roleFor: 'driver',
        userId: req.user._id,
        createdBy: req.user._id,
        amount: Number(req.body.amount)
      }
        await commonHelper.withDrawLOgs(data);
        return res.sendToEncode({
          status_code: 200,
          message: 'success',
          data: {}
        });
    }
  }
  },
  addMoneyToWallet: async function(req,res){
    if(!req.body.amount && req.body.amount==''){
      return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'undefined params'
    });
    }else {
    let updateData = await DriverSchema.updateOne({ _id: req.user._id},{ $inc: { 
      walletMoney: Number(req.body.amount)
    }});
    let data = { 
      roleForm: 'driver',
      roleTO: 'null',
      from: req.user._id,
      amount : Number(req.body.amount),
      transferType:'addToWalletTransfer',
      createdBy: req.user._id
    }
    await commonHelper.walletAccountLogs(data);
    if(updateData.nModified || updateData.ok){
      return res.sendToEncode({
        status_code: 200,
        message: 'success',
        data: {}
      });
    }
  }
  },
  getMoneyTransferLog : async function(req, res){
    async.waterfall(
      [
        function (nextCall) {
          // let projection = req.user.type=='promoter'?'promoterCommission rideId endedAt' :'voCommission rideId endedAt';
          var limit = req.query.limit && req.query.limit > 0 ? Number(req.query.limit) : 10;
          var page = req.query.page && req.query.page > 0 ? Number(req.query.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;
          offset = Number(offset);
          WalletLogsSchema.find({
            from: req.user._id
          })
            .sort({
              createdAt: -1
            })
            .limit(limit)
            .skip(offset).
            populate('rideId', 'rideId driverEarning endedAt')
            .lean()
            .exec(function (err, withdraws) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
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
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },
  /* --------------------------------------------------\*
   * Get Rewards
   * ------------------------------------------------ */
  getRewards: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          NotificationSchema.update({
            driverId: req.user._id,
            isRead: false,
            type: 'reward'
          }, {
            isRead: true
          }, {
            multi: true
          },
            function (err, result) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                nextCall(null);
              }
            }
          );
        },
        function (nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);

          RewardSchema.find({
            driverId: req.user._id
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
                  message: 'SOMETHING_WENT_WRONG'
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
        },
        function(rewardData, nextCall) {
            if (rewardData.rewards && rewardData.rewards.length> 0)
                nextCall(null, rewardData);
            else {
              var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
              var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
              var offset = (page - 1) * limit;
              var hasMore = false;

                //  get data from reward log schema 
                 RewardLogsNewSchema.aggregate([
                  {
                    '$unwind': {
                      'path': '$ids', 
                      'preserveNullAndEmptyArrays': false
                    }
                  }, {
                    '$match': {
                      'ids.receiverId': mongoose.Types.ObjectId(req.user._id)
                    }
                  }, {
                    '$lookup': {
                      'from': 'rewardNew', 
                      'localField': 'rewardId', 
                      'foreignField': '_id', 
                      'as': 'rewardData'
                    }
                  }, {
                    '$unwind': {
                      'path': '$rewardData', 
                      'preserveNullAndEmptyArrays': false
                    }
                  }, {
                    '$project': {
                      'rewardData': 1, 
                      'createdAt': 1, 
                      'updatedAt': 1
                    }
                  },
                  {
                    '$sort': {
                      'createdAt': -1,
                    }
                  },
                  {
                    '$skip': offset
                }, {
                    '$limit': limit
                }
                ]).exec(function (err, rewards) {
                  if (err) {
                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });
                  } else {
                    console.log('--------- rewards',rewards);
                    hasMore = rewards.length && rewards.length == limit ? true : false;
                    nextCall(null, {
                      rewards,
                      page,
                      hasMore
                    });
                  }
                });
            }    
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Get My Language
   * ------------------------------------------------ */
  getMyLanguage: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          LanguageSchema.find({})
            .lean()
            .exec(function (err, v) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
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
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },
  /* --------------------------------------------------\*
   * Update Language
   * ------------------------------------------------ */
  updateLanguage: function (req, res) {
    async.waterfall(
      [
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
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOneAndUpdate({
            _id: req.user._id
          }, {
            $set: {
              languageId: body.languageId
            }
          }, {
            new: true
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (!driver) {
              return nextCall({
                message: 'DRIVER_NOT_FOUND'
              });
            } else {
              nextCall(null, {});
            }
          });
        }
      ],
      function (err, r) {
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
      }
    );
  },
  /* --------------------------------------------------\*
   * Update Radius
   * ------------------------------------------------ */
  updateRadius: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('radius', 'RADIUS_REQUIRED').notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              code: 401,
              message: error[0].msg
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          DriverSchema.findOneAndUpdate({
            _id: req.user._id
          }, {
            $set: {
              radius: body.radius
            }
          }, {
            new: true
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (!driver) {
              return nextCall({
                message: 'DRIVER_NOT_FOUND'
              });
            } else {
              nextCall(null, {});
            }
          });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'RADIUS_UPDATE_SUCC',
          data: r
        });
      }
    );
  },
  /* --------------------------------------------------\*
   * My Wallet
   * ------------------------------------------------ */
  myWallet: function (req, res) {
    var walletData = {
      todayEarnings: 0,
      referralEarnings: 0,
      referralWithdraws: 0
    };
    async.waterfall(
      [
        /** get driver today ride data and earning data */
        nextCall => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              todayTotalEarningFromRide: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, todayRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (todayRides.length > 0) {
                walletData.todayEarnings = todayRides[0].todayTotalEarningFromRide;
              } else {
                walletData.todayEarnings = 0;
              }
              nextCall(null, walletData);
            }
          });
        },
        /** get total referral amount */
        (walletData, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              beneficiaryDriverId: req.user._id
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              referralEarnings: {
                $sum: '$referralAmount'
              }
            }
          });
          DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, totalDriverRefEarningLogs) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (totalDriverRefEarningLogs.length > 0) {
                walletData.referralEarnings = totalDriverRefEarningLogs[0].referralEarnings;
              } else {
                walletData.referralEarnings = 0;
              }
              nextCall(null, walletData);
            }
          });
        },
        /** get referral withdraws amount */
        (walletData, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              beneficiaryDriverId: req.user._id,
              isWithdrawed: true
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              referralWithdraws: {
                $sum: '$referralAmount'
              }
            }
          });
          DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, driverRefEarningLogs) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (driverRefEarningLogs.length > 0) {
                walletData.referralWithdraws = driverRefEarningLogs[0].referralWithdraws;
              } else {
                walletData.referralWithdraws = 0;
              }
              walletData.referralEarnings = walletData.referralEarnings - walletData.referralWithdraws;
              nextCall(null, walletData);
            }
          });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: r
        });
      }
    );
  },
  myWalletNew :async  function(req, res){
    let accountData = await DriverSchema.findOne({ _id: mongoose.Types.ObjectId(req.user._id)}, '_id walletMoney');
    if(accountData){
      return res.sendToEncode({
          status_code: 200,
          message: "",
          data: accountData
      });
  }else {
      return res.sendToEncode({
          status: err.code ? err.code : 400,
          message: 'No user Found',
      });
  }
  },
  myAccountDetails: async function(req, res){
    let accountInfo = await DriverSchema.findOne({ _id: mongoose.Types.ObjectId(req.user._id)}, '_id accountDetails');
    if(accountInfo){
    return res.sendToEncode({
        status_code: 200,
        message: "",
        data: accountInfo
    });
}else {
    return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'No user Found',
    });
}
},
saveAccountDetails :  async function(req, res){
    let updateData = { 
        accountDetails:{
            cardNumber: req.body.cardNumber,
            cardType: req.body.cardType
          },
    }
    let accountInfo = await DriverSchema.updateOne({ _id: mongoose.Types.ObjectId(req.user._id)}, updateData);
    if(accountInfo){
    return res.sendToEncode({
        status_code: 200,
        message: "",
        data: 'Account updated'
    });
}else {
    return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'No user Found'
    });
}
},  
  /* --------------------------------------------------\*
   * My Wallet
   * ------------------------------------------------ */
  myDrivingEarnings: function (req, res) {
    var walletData = {
      today: 0,
      yesterday: 0,
      lastWeek: 0,
      lastMonth: 0,
      lastYear: 0
    };
    async.waterfall(
      [
        /** get Today earnings */
        nextCall => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              today: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, todayRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (todayRides.length > 0) {
                walletData.today = todayRides[0].today;
              } else {
                walletData.today = 0;
              }
              nextCall(null, walletData);
            }
          });
        },
        /** get Yeasterday earnings */
        (walletData, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'days')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'days')
                    .hours(23)
                    .minutes(58)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              yesterday: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, yesterdayRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (yesterdayRides.length > 0) {
                walletData.yesterday = yesterdayRides[0].yesterday;
              } else {
                walletData.yesterday = 0;
              }
              nextCall(null, walletData);
            }
          });
        },
        /** get Last week earnings */
        (walletData, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'weeks')
                    .startOf('isoWeek')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'weeks')
                    .endOf('isoWeek')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              lastWeek: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, lastWeekRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (lastWeekRides.length > 0) {
                walletData.lastWeek = lastWeekRides[0].lastWeek;
              } else {
                walletData.lastWeek = 0;
              }
              nextCall(null, walletData);
            }
          });
        },
        /** get Last month earnings */
        (walletData, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'months')
                    .startOf('month')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'months')
                    .endOf('month')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              lastMonth: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, lastMonthRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (lastMonthRides.length > 0) {
                walletData.lastMonth = lastMonthRides[0].lastMonth;
              } else {
                walletData.lastMonth = 0;
              }
              nextCall(null, walletData);
            }
          });
        },
        /** get Last year earnings */
        (walletData, nextCall) => {
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              driverId: req.user._id,
              createdAt: {
                $gte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'years')
                    .startOf('year')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                ),
                $lte: new Date(
                  moment()
                    .utc()
                    .subtract(1, 'years')
                    .endOf('year')
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0)
                    .format()
                )
              }
            }
          });
          // stage 2
          aggregateQuery.push({
            $group: {
              _id: 1,
              lastYear: {
                $sum: '$driverEarning'
              }
            }
          });
          RideSchema.aggregate(aggregateQuery, (err, lastYearRides) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (lastYearRides.length > 0) {
                walletData.lastYear = lastYearRides[0].lastYear;
              } else {
                walletData.lastYear = 0;
              }
              nextCall(null, walletData);
            }
          });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: r
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Update Status
   * ------------------------------------------------ */
  updateStatus: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('isAvailable', 'ISAVAILABLE_REQUIRED').notEmpty();

          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              code: 401,
              message: error[0].msg
            });
          }
          nextCall(null, req.body);
        },
        /** get driver details */
        function (body, nextCall) {
          if (body.isAvailable == '1') {
            isAvailable = true;
          } else {
            isAvailable = false;
          }
          DriverSchema.findOneAndUpdate({
            _id: req.user._id
          }, {
            $set: {
              isAvailable: isAvailable
            }
          }, {
            new: true
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (!driver) {
              return nextCall({
                message: 'DRIVER_NOT_FOUND'
              });
            } else {
              nextCall(null, {});
            }
          });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'STATUS_UPDATE_SUCC',
          data: r
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Logout
   * ------------------------------------------------ */
  logout: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let updateData = {
            isOnline: false,
            deviceDetail: {}
          };
          DriverSchema.findOneAndUpdate({
            _id: req.user._id
          }, {
            $set: updateData
          }, {
            new: true
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (!driver) {
              return nextCall({
                message: 'DRIVER_NOT_FOUND'
              });
            } else {
              nextCall(null, {});
            }
          });
        }
      ],
      function (err, r) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: r
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * getTransactionHistory
   * ------------------------------------------------ */
  getTransactionHistory: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          NotificationSchema.update({
            driverId: req.user._id,
            isRead: false,
            type: 'recent_transaction'
          }, {
            isRead: true
          }, {
            multi: true
          },
            function (err, result) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                nextCall(null);
              }
            }
          );
        },
        function (nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);
          RideSchema.find({
            driverId: req.user._id
          })
            .populate('passengerId').populate('driverId').populate('vehicleId')
            .sort({
              createdAt: -1
            })
            .limit(limit).lean()
            .skip(offset)
            .exec(function (err, rides) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (rides.length) {
                let response = {
                  'rides': rides,
                };
                EmergencySchema.find().lean().exec((err, emergency) => {
                  response.emergencyDetails = emergency
                  VehicleTypeSchema.find().lean().exec((err, vehicleDetails) => {
                    let i;
                    for (i = 0; i < rides.length; i++) {
                      vehicleDetails.forEach(element => {
                        if (String(response.rides[i].vehicleId.typeId) === String(element._id)) {
                          response.rides[i].vehicleDetails = element;
                        }
                      });
                      response.rides[i].driverId.vehicle=response.rides[i].vehicleId;
                    };
                    hasMore = rides.length == limit ? true : false;
                    console.log('response', response);
                    nextCall(null, {
                      response,
                      page,
                      hasMore
                    });
                  })
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
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Get transaction data successfully.',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * getTransactionHistory
   * ------------------------------------------------ */
  getNotificationData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          NotificationSchema.update({
            driverId: req.user._id,
            isRead: false,
            type: 'notification'
          }, {
            isRead: true
          }, {
            multi: true
          },
            function (err, result) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                nextCall(null);
              }
            }
          );
        },
        function (nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);
          NotificationSchema.find({
            driverId: req.user._id,
            type: 'notification'
          })
            .sort({
              createdAt: -1
            })
            .limit(limit)
            .skip(offset)
            .exec(function (err, notifications) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
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
        },
        function (body, nextCall) {
          NotificationLogNewSchema.aggregate([
            {
              '$match': {
                'ids.receiverId': mongoose.Types.ObjectId(req.user._id)
              }
            }, {
              '$unwind': {
                'path': '$ids'
              }
            }, {
              '$lookup': {
                'from': 'notificationNew',
                'localField': 'notificationId',
                'foreignField': '_id',
                'as': 'notificationDetails'
              }
            }, {
              '$unwind': {
                'path': '$notificationDetails'
              }
            }, {
              '$sort': {
                'ids.sendAt': 1
              }
            }, {
              '$addFields': {
                'createdAt': '$ids.sendAt',
                'receive_type': '$receiver_type',
                'type': 'notification',
                'driverId': '$ids.receiverId',
                'isRead': true,
                'updatedAt': '$ids.sendAt',
                'title': '$notificationDetails.title',
                'note': '$notificationDetails.description',
                'media': '$notificationDetails.media',
                'notification_type': '$notificationDetails.type',
                'isActive': '$notificationDetails.isActive',
                'status': '$notificationDetails.status',
                'thumb_url': CONSTANTS.NOTIFICATION_MEDIA_THUMB,
                'large_url': CONSTANTS.NOTIFICATION_MEDIA_LARGE
              }
            }, {
              '$project': {
                '_id': 0,
                'notificationId': 0,
                'receiver_type': 0,
                'ids': 0,
                'notificationDetails': 0
              }
            }, {
              '$facet': {
                'notification': [
                  {
                    '$skip': 0
                  }, {
                    '$limit': 10
                  }
                ],
                'totalNotification': [
                  {
                    '$count': 'count'
                  }
                ]
              }
            }
          ]).exec(function (err, response) {
            if (response[0].notification.length != 0) {
              console.log('reponse', response);
              let limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;

              body.hasMore = response[0].totalNotification[0].count == limit ? true : false;
              for (let i = 0; i < response[0].notification.length; i++) {
                body.notifications.push(response[0].notification[i]);
              }
            }
          });
          nextCall(null, body);
        },
        function (body, nextCall) {
          NotificationSchema.update({
            driverId: req.user._id,
            isRead: false,
            type: 'notification'
          }, {
            isRead: true
          }, {
            multi: true
          },
            function (err, result) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                nextCall(null, body);
              }
            }
          );
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Get notification data successfully.',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * Renew Token
   * ------------------------------------------------ */
  renewToken: function (req, res) {
    async.waterfall(
      [
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
          DriverSchema.findOne({
            phoneNumber: body.phoneNumber,
            isDeleted: false
          }).exec(function (err, driver) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else if (!driver) {
              return nextCall({
                message: 'DRIVER_NOT_FOUND'
              });
            } else {
              var jwtData = {
                _id: driver._id,
                email: driver.email,
                deviceToken: driver.deviceDetail.token,
                type: 'driver'
              };
              // create a token
              var d = driver.toObject();
              d.access_token = jwt.sign(jwtData, config.secret, {
                // expiresIn: config.jwtTokenExpiryTime
              });

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
              nextCall(null, d);
            }
          });
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Renew token successfully.',
          data: response
        });
      }
    );
  },

  sum: function (items, prop) {
    return items.reduce(function (a, b) {
      return a + b[prop];
    }, 0);
  },

  inviteAndEarn: function (req, res) {
    let aggregateQuery = [];
    aggregateQuery.push({
      $match: {
        $or: [{
          parentDriver: mongoose.Types.ObjectId(req.user._id)
        },
        {
          grandParentDriver: mongoose.Types.ObjectId(req.user._id)
        },
        {
          greatGrandParentDriver: mongoose.Types.ObjectId(req.user._id)
        }
        ]
      }
    });
    aggregateQuery.push({
      $lookup: {
        from: 'driver',
        localField: 'driver',
        foreignField: '_id',
        as: 'driverRef'
      }
    });
    aggregateQuery.push({
      $unwind: {
        path: '$driverRef',
        preserveNullAndEmptyArrays: false
      }
    });

    // myEarning, this is the amount that user has earned from the ride that downline user hase done.
    aggregateQuery.push({
      $lookup: {
        from: 'driver_referral_earning_logs',
        let: {
          ownUserId: mongoose.Types.ObjectId(req.user._id),
          otherDriverId: '$driverRef._id'
        },
        pipeline: [{
          $match: {
            $expr: {
              $and: [{
                $eq: ['$beneficiaryDriverId', '$$ownUserId']
              },
              {
                $eq: ['$driverId', '$$otherDriverId']
              }
              ]
            }
          }
        }],
        as: 'myEarning'
      }
    });

    aggregateQuery.push({
      $group: {
        _id: '$driverRef.driverLevel',
        totalEarning: {
          $sum: '$driverRef.earningFromReferral'
        },
        count: {
          $sum: 1
        },
        myEarning: {
          $push: {
            $sum: '$myEarning.referralAmount'
          }
        }
      }
    });

    aggregateQuery.push({
      $project: {
        _id: 0,
        level: '$_id',
        invited: '$count',
        earning: '$totalEarning',
        myEarning: {
          $reduce: {
            input: '$myEarning',
            initialValue: {
              sum: 0
            },
            in: {
              sum: {
                $add: ['$$value.sum', '$$this']
              }
            }
          }
        }
      }
    });

    aggregateQuery.push({
      $project: {
        _id: 0,
        level: 1,
        invited: 1,
        earning: 1,
        myEarning: '$myEarning.sum'
      }
    });

    aggregateQuery.push({
      $sort: {
        level: 1
      }
    });

    DriverReferralsSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
      if (err) {
        // return nextCall({
        //     "message": 'SOMETHING_WENT_WRONG',
        // });
        return res.sendToEncode({
          status: 400,
          message: 'SOMETHING_WENT_WRONG'
        });
      } else {
        // let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;
        let totalInvited = _self.sum(totalRefEarning, 'invited');
        // let totalEarning = _self.sum(totalRefEarning, 'earning') + req.user.earningFromReferral;
        let totalEarning = req.user.earningFromReferral; // 4th nov 19, for now need only user's referral earning to be display

        // for (let index = 0; index < totalRefEarning.length - 1; index++) {
        //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
        // }

        // if (req.user.driverLevel == 0) {
        //     if (totalRefEarning.length == 1) {
        //         totalRefEarning[0] = {
        //             "level": null,
        //             "invited": null,
        //             "earning": null
        //         }
        //     }
        //     if (totalRefEarning.length == 2) {
        //         totalRefEarning[1] = {
        //             "level": null,
        //             "invited": null,
        //             "earning": null
        //         }
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
        //     totalRefEarning[2] = {
        //         "level": null,
        //         "invited": null,
        //         "earning": null
        //     }
        // } else if (req.user.driverLevel == 1) {
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
        // } else if (req.user.driverLevel == 2) {
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

        if (totalRefEarning.length < 3) {
          for (let i = totalRefEarning.length; i < 3; i++) {
            totalRefEarning.push({
              level: null,
              invited: null,
              earning: null,
              myEarning: null
            });
          }
        }

        var realResponse = {
          status_code: 200,
          message: '',
          data: {
            profilePhotoUrlLarge: CONSTANTS.PROFILE_PHOTO_LARGE_URL,
            profilePhotoUrlThumb: CONSTANTS.PROFILE_PHOTO_THUMB_URL,
            profilePhoto: req.user.profilePhoto,
            invited: totalInvited,
            earning: totalEarning,
            user_level: req.user.driverLevel,
            levels: totalRefEarning
          }
        };
        return res.status(200).send(realResponse);
      }
    });
  },

  earningFromReferral: function (req, res) {
    var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
    var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
    var offset = (page - 1) * limit;
    var hasMore = false;
    offset = Number(offset);

    DriverRefEarningLogSchema.find({
      beneficiaryDriverId: mongoose.Types.ObjectId(req.user._id)
    })
      .populate([{
        path: 'driverId',
        select: 'name uniqueID'
      },
      {
        path: 'rideId',
        select: 'rideId paymentAt pickupAddress destinationAddress'
      }
      ])
      .sort({
        _id: -1
      })
      .limit(limit)
      .skip(offset)
      .exec(function (err, referrals) {
        if (err) {
          console.log({
            message: 'SOMETHING_WENT_WRONG'
          });
        } else {
          var response = {
            status_code: 200,
            message: '',
            data: referrals,
            page: page,
            hasMore: referrals.length && referrals.length == limit ? true : false
          };
          return res.status(200).send(response);
        }
      });
  },

  getInviteAndEarnDetailsOfLevel: function (req, res) {
    async.waterfall(
      [
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
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;

          let aggregateQuery = [];

          if (req.body.level == '-1') {
            aggregateQuery.push({
              $match: {
                $or: [{
                  parentDriver: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  grandParentDriver: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  greatGrandParentDriver: mongoose.Types.ObjectId(req.user._id)
                }
                ]
              }
            });
          } else if (req.body.level == '0') {
            aggregateQuery.push({
              $match: {
                parentDriver: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else if (req.body.level == '1') {
            aggregateQuery.push({
              $match: {
                grandParentDriver: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else if (req.body.level == '2') {
            aggregateQuery.push({
              $match: {
                greatGrandParentDriver: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else {
            return nextCall({
              message: 'LEVEL_NOT_VALID'
            });
          }

          aggregateQuery.push({
            $lookup: {
              from: 'driver_referral_earning_logs',
              localField: 'driver',
              foreignField: 'beneficiaryDriverId',
              as: 'driverbenefite'
            }
          });

          aggregateQuery.push({
            $lookup: {
              from: 'driver',
              localField: 'driver',
              foreignField: '_id',
              as: 'driverDetails'
            }
          });
          aggregateQuery.push({
            $unwind: {
              path: '$driverDetails',
              preserveNullAndEmptyArrays: true
            }
          });

          aggregateQuery.push({
            $unwind: {
              path: '$driverbenefite',
              preserveNullAndEmptyArrays: true
            }
          });

          // totalInvitedCount
          aggregateQuery.push({
            $lookup: {
              from: 'driver_referrals',
              let: {
                ownUserId: '$driverDetails._id'
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $lte: [
                        '$createdAt',
                        new Date(
                          moment()
                            .hours(23)
                            .minutes(59)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      ]
                    },
                    {
                      $gte: [
                        '$createdAt',
                        new Date(
                          moment()
                            .startOf('month')
                            .hours(0)
                            .minutes(0)
                            .seconds(0)
                            .milliseconds(0)
                            .format()
                        )
                      ]
                    },
                    {
                      $or: [{
                        $eq: ['$parentDriver', '$$ownUserId']
                      },
                      {
                        $eq: ['$grandParentDriver', '$$ownUserId']
                      },
                      {
                        $eq: ['$greatGrandParentDriver', '$$ownUserId']
                      }
                      ]
                    }
                    ]
                  }
                }
              }],
              as: 'totalInvitedCount'
            }
          });

          // myEarning, this is the amount that user has earned from the ride that downline user hase done.
          aggregateQuery.push({
            $lookup: {
              from: 'driver_referral_earning_logs',
              let: {
                ownUserId: mongoose.Types.ObjectId(req.user._id),
                otherDriverId: '$driverDetails._id'
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $eq: ['$beneficiaryDriverId', '$$ownUserId']
                    },
                    {
                      $eq: ['$driverId', '$$otherDriverId']
                    }
                    ]
                  }
                }
              }],
              as: 'myEarning'
            }
          });

          aggregateQuery.push({
            $group: {
              _id: '$_id',
              driver_id: {
                $first: '$driverDetails._id'
              },
              uniqueID: {
                $first: '$driverDetails.uniqueID'
              },
              name: {
                $first: '$driverDetails.name'
              },
              driverLevel: {
                $first: '$driverDetails.driverLevel'
              },
              countryCode: {
                $first: '$driverDetails.countryCode'
              },
              countryCode: {
                $first: '$driverDetails.countryCode'
              },
              onlyPhoneNumber: {
                $first: '$driverDetails.onlyPhoneNumber'
              },
              isVerified: {
                $first: '$driverDetails.isVerified'
              },
              createdAt: {
                $first: '$driverDetails.createdAt'
              },
              profilePhoto: {
                $first: '$driverDetails.profilePhoto'
              },
              totalPoints: {
                $first: '$driverDetails.totalPoints'
              },
              platNumber: {
                $first: '$driverDetails.vehicle.platNumber'
              },
              isDeleted: {
                $first: '$driverDetails.isDeleted'
              },
              earningAmount: {
                $sum: '$driverbenefite.referralAmount'
              },
              totalInvitedCount: {
                $first: '$totalInvitedCount'
              },
              myEarning: {
                $first: {
                  $sum: '$myEarning.referralAmount'
                }
              }
            }
          });

          aggregateQuery.push({
            $sort: {
              createdAt: -1
            }
          });
          aggregateQuery.push({
            $skip: offset
          });
          aggregateQuery.push({
            $limit: limit
          });
          aggregateQuery.push({
            $project: {
              _id: 1,
              driver_id: 1,
              uniqueID: 1,
              name: 1,
              driverLevel: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              isVerified: 1,
              createdAt: 1,
              profilePhoto: 1,
              totalPoints: 1,
              platNumber: 1,
              isDeleted: 1,
              earningAmount: 1,
              totalInvitedCount: {
                $size: '$totalInvitedCount'
              },
              myEarning: 1
            }
          });
          DriverReferralsSchema.aggregate(aggregateQuery, (err, getInviteAndEarnDetailsOfLevel) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              let data = {};
              data.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
              data.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
              data.users = getInviteAndEarnDetailsOfLevel;
              data.page = page;
              data.hasMore = getInviteAndEarnDetailsOfLevel.length == limit ? true : false;
              nextCall(null, data);
            }
          });
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Get invite and earn details of level successfully.',
          data: response
        });
      }
    );
  },

  callRequest: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('driverId', 'DRIVER_ID_REQUIRED').notEmpty();
          req.checkBody('passengerId', 'PASSENGER_ID_REQUIRED').notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              code: 401,
              message: error[0].msg
            });
          }
          nextCall(null, req.body);
        },
        function (data, nextCall) {
          PassengerSchema.findOne({
            '_id': data.passengerId
          }).exec((err, passenger) => {
            if (err) {
              return nextCall({
                "message": 'SOMETHING_WENT_WRONG'
              });
            } else if (!passenger) {
              return nextCall({
                'message': 'PASSENGER_NOT_FOUND'
              })
            } else {
              data.driverDetails = req.user;
              data.driverDetails.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
              data.driverDetails.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
              data.passengerDetails = {
                '_id': passenger._doc._id,
                'deviceDetail': passenger._doc.deviceDetail
              };
              nextCall(null, data)
            }
          })
        },
        function (details, nextCall) {
          console.log(details.passengerDetails);
          let call = {
            passengerId: mongoose.Types.ObjectId(details.passengerDetails._id),
            driverId: mongoose.Types.ObjectId(details.driverDetails._id),
            channelId: details.passengerDetails._id,
            status: 'requested',
            from: 'driver',
            to: 'passenger'
          }
          let saveCallDetails = new callHistorySchema(call);
          saveCallDetails.save(function (err, response) {
            if (err) {
              console.log(err);
              return nextCall({
                "message": err.message
              })
            } else {
              let pushNotificationData = {
                to: (details.passengerDetails.deviceDetail && details.passengerDetails.deviceDetail.token) || '',
                type: 'passenger',
                os: details.passengerDetails.deviceDetail.os,
                data: {
                  title: 'Incoming Call',
                  type: 21,
                  body: 'Call From Driver',
                  tag: 'call',
                  data: {
                    channelId: details.passengerDetails._id,
                    driverDetails: details.driverDetails
                  }
                  ,
                  notification: {
                    title: 'Incoming Call From ' + details.driverDetails.name,
                    body: 'Call From Driver',
                    sound: 'call',
                    android_channel_id: "general-channel"
                  }
                }
              }
              pn.fcm(pushNotificationData, function (err, success) {
                if (err) {
                  console.log('error in send notifincation ', err);
                } else {
                  let pushNotificationDataResponse = JSON.parse(success);
                  details.multicast_id = pushNotificationDataResponse.multicast_id;
                  details.message_id = pushNotificationDataResponse.results[0].message_id;
                }
                console.log(success);
                setTimeout(_self.closeCallRequest, 30000, details);

              })
              nextCall(null, response)
            }
          })
        }
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Call sended',
          data: response
        });
      }
    );
  },


  declineCall: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('channelId', 'CHANNEL_ID_REQUIRED').notEmpty();
          var error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              code: 401,
              message: error[0].msg
            });
          }
          nextCall(null, req.body);
        },
        function (data, nextCall) {
          callHistorySchema.findOne({
            channelId: data.channelId,
            status: 'requested'
          }).exec(function (err, callDetails) {
            if (err) {
              return nextCall({
                'message': 'SOMETHING_WENT_WRONG'
              });
            } else if (!callDetails) {
              console.log('here');
              return nextCall({

                'message': 'PASSENGER_NOT_FOUND'
              });
            } else {
              PassengerSchema.findOne({
                '_id': mongoose.Types.ObjectId(callDetails._doc.passengerId)
              }).exec((err, passenger) => {
                if (err) {
                  return nextCall({
                    "message": 'SOMETHING_WENT_WRONG'
                  });
                } else if (!passenger) {
                  console.log('here1');
                  return nextCall({
                    'message': 'PASSENGER_NOT_FOUND'
                  })
                } else {
                  data.passengerDetails = {
                    '_id': passenger._doc._id,
                    'deviceDetail': passenger._doc.deviceDetail
                  };
                  nextCall(null, data)
                }
              })
            }
          })

        },
        function (details, nextCall) {
          console.log('detaisl.passengerDEtails.id', details.passengerDetails._id);
          let pushNotificationData = {
            to: (details.passengerDetails.deviceDetail && details.passengerDetails.deviceDetail.token) || '',
            type: 'passenger',
            os: details.passengerDetails.deviceDetail.os,
            data: {
              title: 'Call Declined',
              type: 11,
              body: 'Call Declined',
              tag: 'call',
              data: {
                channelId: details.channelId
              },
              notification: {
                title: 'Call Declined'
              }
            }

          }
          console.log(pushNotificationData);
          pn.fcm(pushNotificationData, function (err, Success) {

            console.log(Success);
            if (err) {
              console.log('error in send notification ', err);
            }
            else {
              callHistorySchema.updateOne({
                channelId: details.channelId,
                status: "requested"
              }, {
                status: "completed"
              }).exec(function (err, callDetails) {
                if (err) {
                  return nextCall({
                    'message': 'SOMETHING_WENT_WRONG'
                  });
                } else if (!callDetails) {
                  return nextCall({
                    'message': 'PASSENGER_NOT_FOUND'
                  });
                } else {
                  nextCall(null, { 'status': 'success' });
                }
              });
            }
          })
        },
      ],
      function (err, response) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: 'Call Declined Success',
          data: response
        });
      }
    );
  },



  closeCallRequest: function (details) {
    callHistorySchema.updateOne({
      channelId: details.passengerDetails._id,
      status: "requested"
    }, {
      status: "completed"
    }).exec(function (err, callDetails) {
      if (err) {

        console.log('error');
        return {
          'message': 'SOMETHING_WENT_WRONG'
        };
      } else if (callDetails.nModified === 1) {

        let pushNotificationData = {
          to: (details.passengerDetails.deviceDetail && details.passengerDetails.deviceDetail.token) || '',
          type: 'passenger',
          os: details.passengerDetails.deviceDetail.os,
          data: {
            title: 'Missed Call From Driver',
            type: 9,
            body: 'Call Ended',
            tag: 'call',
            data: {
              channelId: details.passengerDetails._id,
              multicast_id: details.multicast_id,
              message_id: details.message_id

            },
            notification: {
              title: 'Missed Call From Driver'
            }
          }

        }
        pn.fcm(pushNotificationData, function (err, Success) {

          console.log(Success);
          if (err) {
            console.log('error in send notification ', err);
          }
        });
        console.log('success');
        return { 'status': 'success' };
      }
    });

  },

};
module.exports = _self;