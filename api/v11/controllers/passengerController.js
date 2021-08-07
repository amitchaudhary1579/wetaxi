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
  DriverSchema = require('../models/driver'),
  PassengerSchema = require('../models/passenger'),
  DriverRideRequestSchema = require('../models/driverRideRequest'),
  PassengerReferralSchema = require('../models/passengerReferrals'),
  PassengerReferralEarningLogs = require('../models/passengerReferralEarningLogs'),
  SystemSettingsSchema = require('../models/systemSettings'),
  LanguageSchema = require('../models/language'),
  WithdrawsSchema = require('../models/withdraws'),
  WalletLogsSchema = require('../models/walletLogs'),
  withdrawLogsSchema = require('../models/withdrawsLogs'),
  RewardSchema = require('../models/reward'),
  UniqueCodeSchema = require('../models/uniqueCode'),
  RideSchema = require('../models/ride'),
  ReasonSchema = require('../models/reason'),
  NotificationSchema = require('../models/notification'),
  RideLogsSchema = require('../models/rideLogs'),
  PassengerReferralSchema = require('../models/passengerReferrals'),
  SearchHistorySchema = require('../models/searchHistory'),
  VehicleTypeSchema = require('../models/vehicleType'),
  EmergencySchema = require('../models/emergency'),
  NotificationLogNewSchema = require('../models/notificationLogsNew'),
  // Custom services/helpers
  DS = rootRequire('services/date'),
  ED = rootRequire('services/encry_decry'),
  CONSTANTS = rootRequire('config/constant'),
  redisClient = rootRequire('support/redis'),
  callHistorySchema = require('../models/call_history');
//Cron Scheduler
schedule = require('node-schedule'),
  //Push notification
  pn = require('../../../support/push-notifications/pn'),
  //Supports
  Uploader = rootRequire('support/uploader'),
  Mailer = rootRequire('support/mailer'); // date services

var message = rootRequire('config/messages/en');
const commonHelper = require('../policies/commonHelper');

var fs = require('fs');
var https = require('https');
const systemSettings = require('../models/systemSettings');
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
      message: 'Success!',
      data: {
        Test: process.env.MONGO_URL
      }
    });
  },

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
              UniqueCodeSchema.findOneAndUpdate(
                {},
                {
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

  saveImageToDisk: function (url, localPath) {
    var file = fs.createWriteStream(localPath);
    var request = https.get(url, function (response) {
      response.pipe(file);
    });
  },

  getPassengerAutoIncrement: function (callback) {
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
              SystemSettingsSchema.findOneAndUpdate(
                {},
                {
                  $inc: {
                    passengerAutoIncrement: Number(1)
                  }
                },
                {
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
              _self.getPassengerAutoIncrement(function (err, response) {
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

  /* --------------------------------------------------\*
   * Check Number   completed
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
          //Check and Update Passenger

          var condition = {
            phoneNumber: body.phoneNumber,
            isDeleted: false
          };


          PassengerSchema.findOne(condition)
            .lean()
            .exec(function (err, passenger) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              let phoneNumber = body.phoneNumber.substring(1, body.phoneNumber.length);
              let message = '';
              let otpSend = '';
              let deviceToken = body.deviceToken;
              commonHelper.generateOTP((err, otp) => {
                // otpSend.push(otp);
                otpSend = otp;
                message = 'you one time otp is ' + otp;
              });
              console.log('otp', otpSend)
              commonHelper.sendMessage(phoneNumber, message, (err, response) => {
                if (err) {

                  return nextCall({ message: 'SOMETHING_WENT_WRONG' });
                } else {
                  redisClient.set(deviceToken, otpSend, 'EX', 300);
                }
              });
              if (!passenger) {

                return nextCall({
                  message: 'NUMBER_NOT_REGISTERED'
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
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSettingData[0]) {
              passenger.passengerVersionUpdate = getSettingData[0].passengerVersionUpdate;
              nextCall(null, passenger);
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

  /* --------------------------------------------------\*
     * verifyOtp completed
     * ------------------------------------------------ */

  verifyOTP: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('otp', 'OTP_REQUIRED').notEmpty();
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
            if (response === otp) {
              var condition = {
                phoneNumber: body.phoneNumber,
                isDeleted: false
              };
              PassengerSchema.findOne(condition)
                .lean()
                .exec(function (err, passenger) {
                  if (err) {
                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });
                  }
                  if (!passenger) {
                    return nextCall({
                      message: 'PASSENGER_NOT_FOUND'
                    })
                  } else {
                    nextCall(null, passenger);
                  }
                });
            } else if (response === null) {
              return nextCall({ message: 'OTP_EXPIRED' });
            } else {
              return nextCall({ message: 'OTP_WRONG' })
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
    console.log('login Data',req.body);
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
          // console.log(body)
          // Check and Update Passenger
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
          }
          if (body.angle) {
            dataToUpdate['location.angle'] = body.angle ? Number(body.angle) : 0;
          }
          if (body.speed) {
            dataToUpdate['location.speed'] = body.speed ? Number(body.speed) : 0;
          }

          PassengerSchema.findOneAndUpdate(condition, dataToUpdate, {
            new: true
          })
            .populate('languageId')
            .exec(function (err, passenger) {
              if (err) {
                return nextCall({
                  // "message": 'SOMETHING_WENT_WRONG',
                  message: err.message
                });
              }
              if (!passenger) {
                return nextCall({
                  message: 'NUMBER_NOT_REGISTERED'
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
                // let formatedPhoneNumber = p.countryCode + ' ' + p.onlyPhoneNumber.substring(0, 2) + ' ' + p.onlyPhoneNumber.substring(2, 5) + ' ' + p.onlyPhoneNumber.substring(5, p.onlyPhoneNumber.length);
                // p.formatedPhoneNumber = formatedPhoneNumber;

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
      }
    );
  },

  /* --------------------------------------------------\*
   * Sign UP completed
   * ------------------------------------------------ */
  add: function (req, res) {
    async.waterfall(
      [
        /** get formData */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        /** check required parameters */
        function (fields, files, nextCall) {
          console.log('files::::::::::', files);
          if ((fields && !fields.name) || !fields.phoneNumber || !fields.dob || !fields.deviceOs || !fields.deviceToken || !fields.language_code) {
            return nextCall({
              message: 'INVALID_PARAMS'
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
                message: 'SOMETHING_WENT_WRONG'
              });
            } else if (passenger) {
              return nextCall({
                message: 'PASSENGER_ALREADY_REGISTERED'
              });
            } else {
              nextCall(null, fields, files);
            }
          });
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
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (passenger) {
                return nextCall({
                  message: 'PASSENGER_ALREADY_REGISTERED'
                });
              } else {
                var url = fields.fbImageUrl;
                var filename = DS.getTime() + '.jpg';
                var thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                var large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                _self.saveImageToDisk(url, large_image);
                _self.saveImageToDisk(url, thumb_image);

                fields.profilePhoto = filename;
                nextCall(null, fields, files);
              }
            });
          } else {
            nextCall(null, fields, files);
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

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.profilePhoto.path,
                      dst: rootPath + '/' + thumb_image
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.profilePhoto.path,
                      dst: rootPath + '/' + large_image
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.profilePhoto.path
                    },
                    nextProc
                  );
                }
              ],
              function (err) {
                if (err) {
                  return nextCall(err, fields);
                }
                fields.profilePhoto = filename;
                nextCall(null, fields);
              }
            );
          } else {
            nextCall(null, fields);
          }
        },
        /** get language id */
        function (fields, nextCall) {
          LanguageSchema.findOne({
            code: fields.language_code
          })
            .lean()
            .exec(function (err, language) {
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
        /** get passenger auto increment id */
        function (fields, nextCall) {
          _self.getPassengerAutoIncrement(function (err, response) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (response.passengerAutoIncrement > 999999) {
              fields.uniqueID = 'P-' + response.passengerAutoIncrement;
            } else {
              fields.uniqueID = 'P-' + ('00000' + response.passengerAutoIncrement).slice(-6);
            }
            fields.autoIncrementID = response.passengerAutoIncrement;
            nextCall(null, fields);
          });
        },
        /** add point count  */
        function (fields, nextCall) {
          if (fields.inviteCode != undefined && fields.inviteCode != null && fields.inviteCode != '') {
            PassengerReferralSchema.findOne({
              referralCode: fields.inviteCode
            })
              .lean()
              .exec(function (err, passengerReferral) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                } else if (!passengerReferral) {
                  nextCall(null, fields);
                } else {
                  PassengerSchema.findOneAndUpdate(
                    {
                      referralCode: fields.inviteCode
                    },
                    {
                      $inc: {
                        totalPoints: 1,
                        totalInvited: 1
                      }
                    }
                  ).exec((err, passenger) => {
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
        /** inviteCode start */
        function (fields, nextCall) {
          if (fields.inviteCode != undefined && fields.inviteCode != null && fields.inviteCode != '') {
            PassengerReferralSchema.findOne({
              referralCode: fields.inviteCode
            })
              .lean()
              .exec(function (err, passengerReferral) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                } else if (!passengerReferral) {
                  return nextCall({
                    message: 'INVALID_REFERRAL_CODE'
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
                  fields.referralCode =
                    Math.random()
                      .toString(36)
                      .substring(2, 6) +
                    Math.random()
                      .toString(36)
                      .substring(2, 6);
                  nextCall(null, fields, passengerReferral);
                }
              });
          } else {
            fields.referralCode =
              Math.random()
                .toString(36)
                .substring(2, 6) +
              Math.random()
                .toString(36)
                .substring(2, 6);
            nextCall(null, fields, false);
          }
        },
        function (fields, passengerReferral, nextCall) {
          if (fields.longitude && fields.latitude) {
            if (fields.angle) {
              fields.location = {
                type: 'Point',
                index: '2dsphere',
                coordinates: [Number(fields.longitude), Number(fields.latitude)],
                angle: Number(fields.angle),
                speed: fields.speed ? Number(fields.speed) : 0
              };
            } else {
              fields.location = {
                type: 'Point',
                index: '2dsphere',
                coordinates: [Number(fields.longitude), Number(fields.latitude)],
                speed: fields.speed ? Number(fields.speed) : 0
              };
            }
          }

          fields.passengerLevel = passengerReferral ? passengerReferral.passengerLevel + 1 : 0;

          delete fields.deviceOs;
          delete fields.deviceToken;

          let passenger = new PassengerSchema(fields);
          passenger.save(function (err, passenger) {
            if (err) {
              return nextCall({
                message: 'OOPS_SOMETHING_WRONG'
              });
            } else {
              nextCall(null, fields, passenger, passengerReferral);
            }
          });
        },
        function (fields, passenger, passengerReferral, nextCall) {
          PassengerSchema.findOne({
            _id: passenger._id
          })
            .populate('languageId')
            .lean()
            .exec(function (err, passenger) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
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
              passengerLevel: passengerReferral.passengerLevel + 1
            };
            nextCall(null, passenger, referralData);
          } else if (passengerReferral && passengerReferral.passengerLevel == 1) {
            referralData = {
              passenger: passenger._id,
              level1Passenger: passengerReferral.passenger,
              level2Passenger: passengerReferral.level1Passenger,
              referralCode: passenger.referralCode,
              inviteCode: passenger.inviteCode,
              passengerLevel: passengerReferral.passengerLevel + 1
            };
            nextCall(null, passenger, referralData);
          } else if (passengerReferral && passengerReferral.passengerLevel == 2) {
            referralData = {
              passenger: passenger._id,
              level1Passenger: passengerReferral.passenger,
              level2Passenger: passengerReferral.level1Passenger,
              level3Passenger: passengerReferral.level2Passenger,
              referralCode: passenger.referralCode,
              inviteCode: passenger.inviteCode,
              passengerLevel: passengerReferral.passengerLevel + 1
            };
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
              passengerLevel: passengerReferral.passengerLevel + 1
            };
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
              passengerLevel: passengerReferral.passengerLevel + 1
            };
            nextCall(null, passenger, referralData);
          } else {
            referralData = {
              passenger: passenger._id,
              referralCode: passenger.referralCode,
              inviteCode: '',
              passengerLevel: 0
            };
            nextCall(null, passenger, referralData);
          }
        },
        function (passenger, referralData, nextCall) {
          let passengerRefData = new PassengerReferralSchema(referralData);
          passengerRefData.save(function (err, driverData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              nextCall(null, passenger);
            }
          });
        }
      ],
      function (err, response) {
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
      }
    );
  },

  addVendor: async function(req, res){
    try{
      const fields = req.body
      const updatedSettings = await systemSettings.findOneAndUpdate(
        {},
        {
          $inc: {
            passengerAutoIncrement: Number(1)
          }
        },
        {
          new: true
        }
      )
      if (updatedSettings.passengerAutoIncrement > 999999) {
        fields.uniqueID = 'P-' + updatedSettings.passengerAutoIncrement;
      } else {
        fields.uniqueID = 'P-' + ('00000' + updatedSettings.passengerAutoIncrement).slice(-6);
      }
      fields.autoIncrementID = updatedSettings.passengerAutoIncrement;
      let passenger = new PassengerSchema(fields);
      await passenger.save()
      return res.sendToEncode({
        status_code: 200,
        message: 'CREATE_PASSANGER_SUCC',
        data: passenger
      });
    }catch(err){
      console.log("err addVendor: ", err);
      return res.sendToEncode({
        status: 400,
        message: 'SOMETHING_WENT_WRONG'
      });
    }
  },

  /* --------------------------------------------------\*
   * Edit completed
   * ------------------------------------------------ */
  edit: function (req, res) {
    async.waterfall(
      [
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
                message: 'SOMETHING_WENT_WRONG'
              });
            } else if (!passenger) {
              return nextCall({
                message: 'PASSENGER_NOT_FOUND'
              });
            } else {
              nextCall(null, fields, files, passenger);
            }
          });
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
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (passengerData) {
                return nextCall({
                  message: 'PASSENGER_ALREADY_REGISTERED'
                });
              } else {
                nextCall(null, fields, files, passenger);
              }
            });
          } else {
            nextCall(null, fields, files, passenger);
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
            passenger.profilePhoto = '';
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

            async.series(
              [
                function (nextProc) {
                  Uploader.thumbUpload(
                    {
                      // upload thumb file
                      src: files.profilePhoto.path,
                      dst: rootPath + '/' + thumb_image
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.largeUpload(
                    {
                      // upload large file
                      src: files.profilePhoto.path,
                      dst: rootPath + '/' + large_image
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  Uploader.remove(
                    {
                      filepath: files.profilePhoto.path
                    },
                    nextProc
                  );
                },
                function (nextProc) {
                  // remove old large image
                  if (passenger.profilePhoto != '') {
                    Uploader.remove(
                      {
                        filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
                      },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
                function (nextProc) {
                  // remove old thumb image
                  if (passenger.profilePhoto != '') {
                    Uploader.remove(
                      {
                        filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
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
            phoneNumber: fields.phoneNumber ? fields.phoneNumber : passenger.phoneNumber,

            countryCode: fields.countryCode ? fields.countryCode : passenger.countryCode,
            onlyPhoneNumber: fields.onlyPhoneNumber ? fields.onlyPhoneNumber : passenger.onlyPhoneNumber,

            dob: fields.dob ? fields.dob : passenger.dob,
            profilePhoto: fields.profilePhoto
          };

          PassengerSchema.findOneAndUpdate(
            {
              _id: passenger._id
            },
            {
              $set: updateData
            },
            {
              new: true,
              lean: true
            },
            function (err, r) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              r.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
              r.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
              nextCall(null, r);
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
          message: 'PASSENGER_UPDATE_SUCC',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * My Profile completed
   * ------------------------------------------------ */
  detail: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          PassengerSchema.findOne({
            _id: req.user._id
          })
            .populate('languageId')
            .exec(function (err, passenger) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!passenger) {
                return nextCall({
                  message: 'PASSENGER_NOT_FOUND'
                });
              } else {
                p = passenger.toObject();
                p.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                p.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                nextCall(null, p);
              }
            });
        },
        function (response, nextCall) {
          NotificationSchema.count({
            passengerId: req.user._id,
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
              passengerId: req.user._id,
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
        } /* For totalReferralCount */,
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
              $or: [
                {
                  level1Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level2Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level3Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level4Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level5Passenger: mongoose.Types.ObjectId(req.user._id)
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
          PassengerReferralSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
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
   * Get My Language completed
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
   * Logout completed
   * ------------------------------------------------ */
  logout: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let updateData = {
            isOnline: false,
            deviceDetail: {}
          };
          PassengerSchema.findOneAndUpdate(
            {
              _id: req.user._id
            },
            {
              $set: updateData
            },
            {
              new: true
            }
          ).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (!passenger) {
              return nextCall({
                message: 'PASSENGER_NOT_FOUND'
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
   * My Wallet completed
   * ------------------------------------------------ */
  myWallet: function (req, res) {
    var walletData = {
      todayEarnings: 0,
      referralEarnings: 0,
      referralWithdraws: 0
    };
    async.waterfall(
      [
        function (nextCall) {
          PassengerSchema.findOne({
            _id: req.user._id
          }).exec(function (err, passengerData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            walletData.referralEarnings = passengerData.earningFromReferral;
            nextCall(null, walletData);
          });
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
          PassengerReferralEarningLogs.aggregate(aggregateQuery, (err, passengerRefEarningLogs) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              if (passengerRefEarningLogs.length > 0) {
                walletData.referralWithdraws = passengerRefEarningLogs[0].referralWithdraws;
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
  myWalletNew : async function(req, res){
    let accountData = await PassengerSchema.findOne({ _id: mongoose.Types.ObjectId(req.user._id)}, '_id walletMoney');
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
  /* --------------------------------------------------\*
     * My Account
     * ------------------------------------------------ */
  myAccountDetails: async function(req, res){
      let accountInfo = await PassengerSchema.findOne({ _id: mongoose.Types.ObjectId(req.user._id)}, '_id accountDetails');
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
      let accountInfo = await PassengerSchema.updateOne({ _id: mongoose.Types.ObjectId(req.user._id)}, updateData);
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
   * Get Withdraws completed
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
            passengerId: req.user._id
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
      let findWalletData = await PassengerSchema.findOne({ _id: req.user._id}, 'walletMoney');
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
        let updateWalletBalance =  await PassengerSchema.updateOne({_id: req.user._id},{ $inc: {
          walletMoney: -Number(req.body.amount)
        }});

      let data ={
        roleFor: 'passenger',
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
    let updateData = await PassengerSchema.updateOne({ _id: req.user._id},{ $inc: { 
      walletMoney: Number(req.body.amount)
    }});
    let data = { 
      roleForm: 'passenger',
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
            populate('rideId', 'rideId endedAt')
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
   * Get Rewards completed
   * ------------------------------------------------ */
  getRewards: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          NotificationSchema.update(
            {
              passengerId: req.user._id,
              isRead: false,
              type: 'reward'
            },
            { isRead: true },
            { multi: true },
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
            passengerId: req.user._id
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
   * Update Language completed
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
        /** get passenger details */
        function (body, nextCall) {
          PassengerSchema.findOneAndUpdate(
            {
              _id: req.user._id
            },
            {
              $set: {
                languageId: body.languageId
              }
            },
            {
              new: true
            }
          ).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (!passenger) {
              return nextCall({
                message: 'PASSENGER_NOT_FOUND'
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
   * Get Status completed
   * ------------------------------------------------ */
  getStatus: function (req, res) {
    var response = {
      user: {},
      ride: {}
    };
    async.waterfall(
      [
        function (nextCall) {
          console.log('function 1');
          PassengerSchema.findOne({
            _id: req.user._id
          })
            .populate('languageId')
            .lean()
            .exec(function (err, passenger) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              if (!passenger) {
                return nextCall({
                  message: 'NUMBER_NOT_REGISTERED'
                });
              } else {
                response.user = passenger;
                response.user.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
                response.user.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
                response.user.badge = 'silver';
                nextCall(null, response);
              }
            });
        },
        function (response, nextCall) {
          console.log('function 2');
          RideSchema.findOne({
            passengerId: response.user._id,
            status: {
              $in: ['requested', 'accepted', 'arrived', 'onride' /* , 'completed' */]
            }
            // "paymentStatus": false
          })
            .populate('driverId')
            .populate('requestedVehicleTypeId')
            .sort('createdAt')
            .lean()
            .exec((err, ride) => {
              console.log('error from  function 2', err);
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!ride) {
                response.ride = {};
                nextCall(null, response);
              } else {
                response.ride = ride;
                // console.log('ride from function 2', ride)
                /** get driver from Queue */
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
                      'driverId': 1,
                      'vehicle.color': 1, 
                      'vehicle.typeId': 1,
                      'vehicle.platNumber':1,
                      'vehicle.model':1,
                    }
                  }
                ]).exec((err, driverRideRequest) => {
                  console.log('error from  function 2', err);
                    if (err) {
                      return nextCall({
                        message: 'SOMETHING_WENT_WRONG'
                      });
                    }
                    console.log('in request ',driverRideRequest);
                    if (driverRideRequest.length > 0) {
                      // response.vehicle= {};
                      response.ride.driverId = driverRideRequest[0].driverId;
                      response.ride.driverId.vehicle ={
                        'platNumber': driverRideRequest[0].vehicle.platNumber
                      } 
                      response.ride.driverLocation = driverRideRequest[0].driverId.location;
                      response.ride.driverVehicleColor = driverRideRequest[0].vehicle.color;
                      response.ride.platNumber= driverRideRequest[0].vehicle.platNumber;
                      response.ride.status = ride.status;
                    }
                    redisClient.lrange(`ride.location.${ride._id}`, 0, -1, (err, reply) => {
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
              }
            });
        },
        /** get distance of driver to pickeup passenger */
        function (response, nextCall) {
          console.log('function 3');
          if (response && response.ride && response.ride.status && response.ride.status == 'accepted') {
            var aggregateQuery = [];
            var matchQuery = {
              _id: mongoose.Types.ObjectId(response.ride._id)
            };
            aggregateQuery.push({
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [Number(response.ride.driverId.location.coordinates[0]), Number(response.ride.driverId.location.coordinates[1])]
                },
                distanceField: 'distance',
                spherical: true,
                distanceMultiplier: 1 / 1000, // convert meters into km
                query: matchQuery
              }
            });
            RideSchema.aggregate(aggregateQuery, function (err, ride) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              response.ride.distance = Math.round(Number(ride[0].distance) * 100) / 100;
              nextCall(null, response);
            });
          } else {
            nextCall(null, response);
          }
        },
        function (response, nextCall) {
          console.log('function 4');
          ReasonSchema.find({}).exec((err, reasons) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else if (!reasons) {
              response.reasons = [];
            } else {
              response.reasons = reasons;
            }
            nextCall(null, response);
          });
        },
        function (response, nextCall) {
          console.log('function 5');
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSettingData[0]) {
              response.passengerVersionUpdate = getSettingData[0].passengerVersionUpdate;
              nextCall(null, response);
            } else {
              return nextCall({
                message: 'SYSTEM_SETTINGS_NOT_FOUND'
              });
            }
          });
        },
        function (response, nextCall) {
          console.log('function 6');
          NotificationSchema.count({
            passengerId: req.user._id,
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
          console.log('function 7');
          let aggregateQuery = [];
          // stage 1
          aggregateQuery.push({
            $match: {
              passengerId: req.user._id,
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
        /* For totalReferralCount */
        function (response, nextCall) {
          console.log('here');
          callHistorySchema.findOne({
            "passengerId": req.user._id,
            "status": "requested"
          }).populate({
            path: 'driverId',
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
        function (response, nextCall) {
          console.log('function 8');
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
              $or: [
                {
                  level1Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level2Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level3Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level4Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level5Passenger: mongoose.Types.ObjectId(req.user._id)
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
          PassengerReferralSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
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
        console.log(err);
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        console.log('final get status response', response);
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * getTrinsactionHistory completed
   * ------------------------------------------------ */
  getTransactionHistory: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          NotificationSchema.update(
            {
              passengerId: req.user._id,
              isRead: false,
              type: 'recent_transaction'
            },
            { isRead: true },
            { multi: true },
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
            passengerId: req.user._id,
            status: {
              $ne: 'request_expired'
            },
            acceptedAt: {
              $lte: new Date(moment().format())
            }
          })
            .populate('driverId').
            populate('vehicleId')
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
                    console.log(rides.length);
                    for (i = 0; i < rides.length; i++) {
                      vehicleDetails.forEach(element => {
                        if (String(response.rides[i].vehicleId.typeId) === String(element._id)) {
                          response.rides[i].vehicleDetails = element;
                        }
                      });
                      response.rides[i].driverId.vehicle= response.rides[i].vehicleId;
                    };
                    hasMore = rides.length == limit ? true : false;
                    nextCall(null, {
                      response,
                      page,
                      hasMore
                    });
                  })
                });
              } else {
                let response = {
                  'rides': rides
                };
                nextCall(null, {
                  response,
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
        // console.log(JSON.stringify(response));
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
   * getTransactionHistory completed
   * ------------------------------------------------ */
  getNotificationData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          NotificationSchema.update(
            {
              passengerId: req.user._id,
              isRead: false,
              type: 'notification'
            },
            { isRead: true },
            { multi: true },
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
            passengerId: req.user._id,
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
                'passengerId': '$ids.receiverId',
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
          console.log(body);

          NotificationSchema.update(
            {
              passengerId: req.user._id,
              isRead: false,
              type: 'notification'
            },
            {
              isRead: true
            },
            {
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
          PassengerSchema.findOne({
            phoneNumber: body.phoneNumber,
            isDeleted: false
          }).exec(function (err, passenger) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else if (!passenger) {
              return nextCall({
                message: 'PASSENGER_NOT_FOUND'
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


  /* --------------------------------------------------\*
   * Invite and Earn Completed 
   * ------------------------------------------------ */

  inviteAndEarn: function (req, res) {
    async.waterfall(
      [
        nextCall => {
          let aggregateQuery = [];
          var userLevel = req.user.passengerLevel;
          aggregateQuery.push({
            $match: {
              $or: [
                {
                  level1Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level2Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level3Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level4Passenger: mongoose.Types.ObjectId(req.user._id)
                },
                {
                  level5Passenger: mongoose.Types.ObjectId(req.user._id)
                }
              ]
            }
          });
          aggregateQuery.push({
            $lookup: {
              from: 'passenger',
              localField: 'passenger',
              foreignField: '_id',
              as: 'passengerRef'
            }
          });
          aggregateQuery.push({
            $unwind: {
              path: '$passengerRef',
              includeArrayIndex: 'true'
            }
          });

          // myEarning, this is the amount that user has earned from the ride that downline user hase done.
          aggregateQuery.push({
            $lookup: {
              from: 'passenger_referral_earning_logs',
              let: {
                ownUserId: mongoose.Types.ObjectId(req.user._id),
                otherPassengerId: '$passengerRef._id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$beneficiaryPassengerId', '$$ownUserId']
                        },
                        {
                          $eq: ['$passengerId', '$$otherPassengerId']
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'myEarning'
            }
          });

          aggregateQuery.push({
            $group: {
              _id: '$passengerLevel',
              totalEarning: {
                $sum: '$passengerRef.earningFromReferral'
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
                  initialValue: { sum: 0 },
                  in: {
                    sum: { $add: ['$$value.sum', '$$this'] }
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
          console.log(aggregateQuery);
          PassengerReferralSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              let totalInvited = _self.sum(totalRefEarning, 'invited');
              // let totalEarning = _self.sum(totalRefEarning, 'earning') + req.user.earningFromReferral;
              let totalEarning = req.user.earningFromReferral; // 4th nov 19, for now need only user's referral earning to be display

              // let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;
              // for (let index = 0; index < totalRefEarning.length - 1; index++) {
              //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
              // }
              nextCall(null, totalRefEarning, userLevel, totalInvited, totalEarning);
            }
          });
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
                earning: null,
                myEarning: null
              });
            }
          }
          nextCall(null, totalRefEarning, level, totalInvited, totalEarning);
        },
        (totalRefEarning, level, totalInvited, totalEarning, nextCall) => {
          var realResponse = {
            status_code: 200,
            message: '',
            data: {
              profilePhotoUrlLarge: CONSTANTS.PROFILE_PHOTO_LARGE_URL,
              profilePhotoUrlThumb: CONSTANTS.PROFILE_PHOTO_THUMB_URL,
              profilePhoto: req.user.profilePhoto,
              invited: totalInvited,
              earning: totalEarning,
              user_level: level,
              levels: totalRefEarning
            }
          };
          console.log(realResponse);
          return res.status(200).send(realResponse);
        }
      ],
      (err, response) => {
        if (err) {
          return CB({
            status: 400,
            message: (err && err.message) || 'Server internal error'
          });
        }
        return CB({
          status: 200,
          message: 'Get invite and earn successfully.',
          data: response
        });
      }
    );
  },

  /* --------------------------------------------------\*
  * Earning From Referral Completed 
  * ------------------------------------------------ */

  earningFromReferral: function (req, res) {
    var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
    var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
    var offset = (page - 1) * limit;
    var hasMore = false;
    offset = Number(offset);

    PassengerReferralEarningLogs.find({
      beneficiaryPassengerId: mongoose.Types.ObjectId(req.user._id)
    })
      .populate([
        {
          path: 'passengerId',
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


  /* --------------------------------------------------\*
  *Get Invite and earnings of level Completed 
  * ------------------------------------------------ */

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
                $or: [
                  {
                    level1Passenger: mongoose.Types.ObjectId(req.user._id)
                  },
                  {
                    level2Passenger: mongoose.Types.ObjectId(req.user._id)
                  },
                  {
                    level3Passenger: mongoose.Types.ObjectId(req.user._id)
                  },
                  {
                    level4Passenger: mongoose.Types.ObjectId(req.user._id)
                  },
                  {
                    level5Passenger: mongoose.Types.ObjectId(req.user._id)
                  }
                ]
              }
            });
          } else if (req.body.level == '0') {
            aggregateQuery.push({
              $match: {
                level1Passenger: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else if (req.body.level == '1') {
            aggregateQuery.push({
              $match: {
                level2Passenger: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else if (req.body.level == '2') {
            aggregateQuery.push({
              $match: {
                level3Passenger: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else if (req.body.level == '3') {
            aggregateQuery.push({
              $match: {
                level4Passenger: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else if (req.body.level == '4') {
            aggregateQuery.push({
              $match: {
                level5Passenger: mongoose.Types.ObjectId(req.user._id)
              }
            });
          } else {
            return nextCall({
              message: 'LEVEL_NOT_VALID'
            });
          }

          aggregateQuery.push({
            $lookup: {
              from: 'passenger_referral_earning_logs',
              localField: 'passenger',
              foreignField: 'beneficiaryPassengerId',
              as: 'passengerbenefite'
            }
          });

          aggregateQuery.push({
            $lookup: {
              from: 'passenger',
              localField: 'passenger',
              foreignField: '_id',
              as: 'passengerDetails'
            }
          });
          aggregateQuery.push({
            $unwind: {
              path: '$passengerDetails',
              preserveNullAndEmptyArrays: true
            }
          });

          aggregateQuery.push({
            $unwind: {
              path: '$passengerbenefite',
              preserveNullAndEmptyArrays: true
            }
          });

          // totalInvitedCount
          aggregateQuery.push({
            $lookup: {
              from: 'passenger_referrals',
              let: {
                ownUserId: '$passengerDetails._id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
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
                          $or: [
                            {
                              $eq: ['$level1Passenger', '$$ownUserId']
                            },
                            {
                              $eq: ['$level2Passenger', '$$ownUserId']
                            },
                            {
                              $eq: ['$level3Passenger', '$$ownUserId']
                            },
                            {
                              $eq: ['$level4Passenger', '$$ownUserId']
                            },
                            {
                              $eq: ['$level5Passenger', '$$ownUserId']
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'totalInvitedCount'
            }
          });

          // myEarning, this is the amount that user has earned from the ride that downline user hase done.
          aggregateQuery.push({
            $lookup: {
              from: 'passenger_referral_earning_logs',
              let: {
                ownUserId: mongoose.Types.ObjectId(req.user._id),
                otherPassengerId: '$passengerDetails._id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$beneficiaryPassengerId', '$$ownUserId']
                        },
                        {
                          $eq: ['$passengerId', '$$otherPassengerId']
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'myEarning'
            }
          });

          aggregateQuery.push({
            $group: {
              _id: '$_id',
              passenger_id: {
                $first: '$passengerDetails._id'
              },
              uniqueID: {
                $first: '$passengerDetails.uniqueID'
              },
              name: {
                $first: '$passengerDetails.name'
              },
              passengerLevel: {
                $first: '$passengerDetails.passengerLevel'
              },
              countryCode: {
                $first: '$passengerDetails.countryCode'
              },
              onlyPhoneNumber: {
                $first: '$passengerDetails.onlyPhoneNumber'
              },
              phoneNumber: {
                $first: '$passengerDetails.phoneNumber'
              },
              createdAt: {
                $first: '$passengerDetails.createdAt'
              },
              profilePhoto: {
                $first: '$passengerDetails.profilePhoto'
              },
              isDeleted: {
                $first: '$passengerDetails.isDeleted'
              },
              earningAmount: {
                $sum: '$passengerbenefite.referralAmount'
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
              passenger_id: 1,
              uniqueID: 1,
              name: 1,
              passengerLevel: 1,
              countryCode: 1,
              onlyPhoneNumber: 1,
              phoneNumber: 1,
              createdAt: 1,
              profilePhoto: 1,
              isDeleted: 1,
              earningAmount: 1,
              totalInvitedCount: { $size: '$totalInvitedCount' },
              myEarning: 1
            }
          });

          PassengerReferralSchema.aggregate(aggregateQuery, (err, getInviteAndEarnDetailsOfLevel) => {
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

  /* --------------------------------------------------\*
  *save search history  Completed 
  * ------------------------------------------------ */

  savePlaces: function (req, res) {
    try {
      async.waterfall(
        [
          function (nextCall) {
            var error = req.validationErrors();

            if (error && error.length) {
              return nextCall({
                code: 401,
                message: error[0].msg
              });
            }
            nextCall(null, req.body);
          },
          /** Save Place data added*/
          function (body, nextCall) {
            body.isSetHome = false;
            body.isSetWork = false;
            if (req.body.isHome === true || req.body.isHome === 'true') {
              body.isSetHome = true;
            }
            if (req.body.isWork === true || req.body.isWork === 'true') {
              body.isSetWork = true;
            }
            SearchHistorySchema.findOne(
              {
                "predictions.place_id": req.body.predictions.place_id,
                "passengerId": mongoose.Types.ObjectId(req.user._id)
              }
            ).exec(function (err, searchHistory) {
              if (searchHistory) {
                body.isExist = true;
              } else {
                body.isExist = false;
              }
              nextCall(null, body);
            });
          },
          function (body, nextCall) {
            if (body.isExist) {
              let condition = {
                updatedAt: DS.now()
              };
              if (req.body.isHome != undefined) {
                condition.isHome = body.isSetHome;
              }
              if (req.body.isWork != undefined) {
                condition.isWork = body.isSetWork;
              }
              SearchHistorySchema.findOneAndUpdate(
                { "predictions.place_id": req.body.predictions.place_id },
                {
                  $set: condition
                }, {
                new: true
              }
              ).exec(function (err, searchHistory) {
                if (err) {
                  console.log(err);
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                }

                let newData = {
                  status_code: 200,
                  data: searchHistory,
                  message: 'SEARCH_HISTORY_UPDATED'
                }
                console.log(newData);

                return nextCall(null, newData);
              });
            } else {
              if (req.body.predictions === undefined) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              }
              let savePlaceData = {

                passengerId: mongoose.Types.ObjectId(req.user._id),
                predictions: req.body.predictions,
                isHome: body.isSetHome,
                isWork: body.isSetWork
              };
              let saveHistory = new SearchHistorySchema(savePlaceData);

              saveHistory.save(saveHistory);
              if (!saveHistory) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {

                let newData = {
                  status_code: 200,
                  message: 'SEARCH_HISTORY_ADDED',
                  data: saveHistory
                }
                console.log(newData);
                return nextCall(null, newData);
              }
            }
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
            message: response.message,
            data: response.data
          });
        }
      );
    } catch (err) { console.log(err) }
  },

  /* --------------------------------------------------\*
  *Get recent search  Completed 
  * ------------------------------------------------ */

  //recent place search history fetch
  recentPlaces: function (req, res) {
    try {
      async.waterfall(
        [
          function (nextCall) {
            //    req.checkBody('placeId', 'DESTINATION_ADDRESS').notEmpty();

            var error = req.validationErrors();

            if (error && error.length) {
              return nextCall({
                code: 401,
                message: error[0].msg
              });
            }
            nextCall(null, req.body);
          }, function (body, nextCall) {
            SearchHistorySchema.find({ passengerId: mongoose.Types.ObjectId(req.user._id) }).sort({ updatedAt: -1 }).exec(function (err, data) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                let predictions = [];
                data.forEach(element => {
                  if (element.predictions != null) {
                    predictions.push(element.predictions);
                  }
                });
                var response = {
                  status_code: 200,
                  message: '',
                  data: { 'predictions': predictions },

                };
                console.log(response);
                nextCall(null, response);
              }
            });
          }], function (err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || 'SOMETHING_WENT_WRONG'
              });
            }
            return res.sendToEncode({
              status_code: 200,
              message: response.message,
              data: response.data
            });
          }
      );
    } catch (err) {
      console.log('err', err)
    }















    // try {
    //   // var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
    //   // var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
    //   // var offset = (page - 1) * limit;

    //   // var hasMore = false;
    //   // let skipLimit = {
    //   //   skip: Number(offset),
    //   //   limit: Number(limit)
    //   // }
    //   // offset = Number(offset);

    //   SearchHistorySchema.find({ passengerId: mongoose.Types.ObjectId(req.user._id) }).sort({ updatedAt: -1 }).exec(function (err, data) {
    //     if (err) {
    //       return res.status(200).send({
    //         message: 'SOMETHING_WENT_WRONG'
    //       });
    //     } else {
    //       let predictions = [];
    //       data.forEach(element => {
    //         if (element.predictions != null) {
    //           predictions.push(element.predictions);
    //         }
    //       });
    //       var response = {
    //         status_code: 200,
    //         message: '',
    //         data: { 'predictions': predictions },

    //       };
    //       console.log(response);
    //       return res.status(200).send(response);
    //     }
    //   });

    // } catch (err) { console.log(err) }
  },

  /* --------------------------------------------------\*
  *update work and home address  Completed 
  * ------------------------------------------------ */

  updateWorkAndHome: function (req, res) {
    try {
      async.waterfall(
        [
          function (nextCall) {
            //    req.checkBody('placeId', 'DESTINATION_ADDRESS').notEmpty();

            var error = req.validationErrors();

            if (error && error.length) {
              return nextCall({
                code: 401,
                message: error[0].msg
              });
            }
            nextCall(null, req.body);
          }, function (body, nextCall) {
            var newData = {};
            // create a 
            let workHomeCondition = body.isHome != undefined ? 'isHome' : 'isWork'
            console.log(workHomeCondition);
            SearchHistorySchema.updateMany({
              passengerId: mongoose.Types.ObjectId(req.user._id),
              [workHomeCondition]: true,
            }, {
              [workHomeCondition]: false
            }).exec(function (err, response) {
              console.log(err);
              console.log(response);
            })

            if (!(body.placeId === undefined)) {
              // let condition = {
              //   passengerId: mongoose.Types.ObjectId(req.user._id)
              // }
              // //let homeCondition = body.isHome  ? condition.isHome= true :  
              SearchHistorySchema.findOneAndUpdate(
                { "predictions.place_id": body.placeId },
                { $set: { updatedAt: DS.now(), [workHomeCondition]: true } }, { new: true }
              ).exec(function (err, response) {
                if (err) {
                  return nextCall({
                    message: 'SOMETHING_WENT_WRONG'
                  });
                }
                if (response) {
                  newData = {
                    status_code: 200,
                    message: 'HOME_WORK_HISTORY_UPDATED',
                    data: response
                  }
                  return nextCall(null, newData);
                } else {
                  let savePlaceData = {
                    passengerId: mongoose.Types.ObjectId(req.user._id),
                    predictions: req.body.predictions,
                    [workHomeCondition]: true
                  };
                  let saveHistory = new SearchHistorySchema(savePlaceData);

                  saveHistory.save(saveHistory);
                  if (!saveHistory) {

                    return nextCall({
                      message: 'SOMETHING_WENT_WRONG'
                    });
                  } else {
                    newData = {
                      status_code: 200,
                      message: 'SEARCH_HISTORY_ADDED',
                      data: saveHistory
                    }
                  }
                  return nextCall(null, newData);
                }

                // return nextCall(null, newData);
              })
            }
          }], function (err, response) {
            if (err) {
              return res.sendToEncode({
                status: 400,
                message: (err && err.message) || 'SOMETHING_WENT_WRONG'
              });
            }
            return res.sendToEncode({
              status_code: 200,
              message: response.message,
              data: response.data
            });
          }
      );
    } catch (err) {
      console.log('err', err)
    }

  },

  getHomeWorkPlace: function (req, res) {
    try {

      SearchHistorySchema.find({
        $and: [
          {
            passengerId: mongoose.Types.ObjectId(req.user._id),
          },
          {
            $or: [
              { isWork: true },
              { isHome: true }
            ]
          }
        ]
      }).exec(function (err, response) {
        if (err) {
          return res.status(400).send({
            message: 'SOMETHING_WENT_WRONG'
          });
        }
        newData = {
          status_code: 200,
          message: 'HOME_WORK_ADDRESS',
          data: response
        }
        return res.status(200).send(newData);
        nextCall(null, newData);
      });
    }
    catch (err) {
      console.log('err', err)
    }
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
          DriverSchema.findOne({
            '_id': data.driverId
          }).exec((err, driver) => {
            if (err) {
              return nextCall({
                "message": 'SOMETHING_WENT_WRONG'
              });
            } else if (!driver) {
              return nextCall({
                'message': 'DRIVER_NOT_FOUND'
              })
            } else {
              data.passengerDetails = req.user;
              data.passengerDetails.profilePhotoUrlLarge = CONSTANTS.PROFILE_PHOTO_LARGE_URL;
              data.passengerDetails.profilePhotoUrlThumb = CONSTANTS.PROFILE_PHOTO_THUMB_URL;
              data.driverDetails = {
                '_id': driver._doc._id,
                'deviceDetail': driver._doc.deviceDetail
              };
              nextCall(null, data)
            }
          })
        },
        function (details, nextCall) {
          let call = {
            passengerId: mongoose.Types.ObjectId(details.passengerDetails._id),
            driverId: mongoose.Types.ObjectId(details.driverDetails._id),
            channelId: details.driverDetails._id,
            status: 'requested',
            from: 'passenger',
            to: 'driver'
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
                to: (details.driverDetails.deviceDetail && details.driverDetails.deviceDetail.token) || '',
                type: 'driver',
                os: details.driverDetails.deviceDetail.os,
                data: {
                  title: 'Incoming Call',
                  type: 21,
                  body: 'Call From Passenger',
                  tag: 'call',
                  data: {
                    channelId: details.driverDetails._id,
                    passengerDetails: details.passengerDetails
                  }
                  ,
                  notification: {
                    title: 'Incoming Call From ' + details.passengerDetails.name,
                    body: 'Call From Passenger',
                    sound: 'call',
                    android_channel_id: "general-channel"
                    // image: details.passengerDetails.profilePhotoUrlThumb + details.passengerDetails.profilePhoto,
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
              })
              setTimeout(_self.closeCallRequest, 60000, details);
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
              DriverSchema.findOne({
                '_id': mongoose.Types.ObjectId(callDetails._doc.driverId)
              }).exec((err, driver) => {
                if (err) {
                  return nextCall({
                    "message": 'SOMETHING_WENT_WRONG'
                  });
                } else if (!driver) {
                  console.log('here1');
                  return nextCall({
                    'message': 'DRIVER_NOT_FOUND'
                  })
                } else {
                  data.driverDetails = {
                    '_id': driver._doc._id,
                    'deviceDetail': driver._doc.deviceDetail
                  };
                  nextCall(null, data)
                }
              })
            }
          })
        },
        function (details, nextCall) {


          let pushNotificationData = {
            to: (details.driverDetails.deviceDetail && details.driverDetails.deviceDetail.token) || '',
            type: 'driver',
            os: details.driverDetails.deviceDetail.os,
            data: {
              title: 'Call Declined',
              type: 9,
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
          message: 'Call declined success',
          data: response
        });
      }
    );
  },


  calculateTotalFare: function (req, res) {
    async.waterfall([
      /** check required parameters */
      (nextCall) => {
        // req.checkBody('lat', 'DRIVER_ID_REQUIRED').notEmpty();
        // req.checkBody('long', 'PASSENGER_ID_REQUIRED').notEmpty();
        // req.checkBody('destinationAddress', 'DRIVER_ID_REQUIRED').notEmpty();
        // req.checkBody('destinationLat', 'PASSENGER_ID_REQUIRED').notEmpty();
        // req.checkBody('destinationLong', 'DRIVER_ID_REQUIRED').notEmpty();
        req.checkBody('totalDistance', 'PASSENGER_ID_REQUIRED').notEmpty();
        req.checkBody('vehicleId', 'PASSENGER_ID_REQUIRED').notEmpty();

        var error = req.validationErrors();
        if (error && error.length) {
          return nextCall({
            code: 401,
            message: error[0].msg
          });
        }
        nextCall(null, req.body);
        // if (!data || !data.lat || !data.long || !data.destinationAddress || !data.destinationLat || !data.destinationLong || !data.totalDistance || !data.vehicleId) {
        //   return nextCall({
        //     'message': data.INVALID_PARAMS
        //   })
        // }
        //nextCall(null, data)
      },
      // (data, ride, nextCall) => {
      //   Request.get(
      //     'https://maps.googleapis.com/maps/api/geocode/json?address=' + data.lat + ',' + data.long + '&key=' + CONSTANTS.GOOGLE_API_KEY,
      //     (error, response, res) => {
      //       if (error) {
      //         return nextCall({
      //           "message": data.languageMessage.SOMETHING_WENT_WRONG,
      //         });
      //       } else {
      //         let responseData = JSON.parse(res);
      //         data.destinationAddress = responseData.results[0].formatted_address
      //         nextCall(null, data, ride)
      //       }
      //     })
      // },

      // /** get admin fee */
      (data, nextCall) => {
        SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
          if (err) {
            return nextCall({
              "message": data.SOMETHING_WENT_WRONG
            });
          }
          if (getSystemSettingData[0] && getSystemSettingData[0].adminFee) {
            nextCall(null, data, getSystemSettingData[0].adminFee)
          } else {
            nextCall(null, data, Number(0))
          }
        })
      },
      /** calculate total fare of ride */
      (data, adminFee, nextCall) => {
        VehicleTypeSchema.findOne({
          "_id": mongoose.Types.ObjectId(data.vehicleId)
        }).exec(async (err, vehicleTypeDetails) => {
          console.log(err);
          if (err) {
            return nextCall({
              "message": data.SOMETHING_WENT_WRONG,
            });
          }
          let numberRegex = /(\d+)/g;
          console.log(data.totalDistance);
          data.totalDistance = Number(data.totalDistance.replace('km', ''));
          // data.totalDistance = data.totalDistance.match(numberRegex);
          console.log(data.totalDistance);
          if (data.totalDistance <= 1) {
            data.totalFare = Number(vehicleTypeDetails.minFare)
          } else {
            data.totalDistance = data.totalDistance ? Number(data.totalDistance) : 1;
            let totalFare= Math.round((((Number(data.totalDistance) - 1) * Number(vehicleTypeDetails.feePerKM)) + Number(vehicleTypeDetails.minFare)) * 100) / 100;
            data.totalFare = totalFare + (totalFare/100) *totalFare;
          }
          // let getUserBalance = await PassengerSchema.findOne({ _id: req.user._id},'walletMoney');
          // console.log('getUserBalance', getUserBalance);
          // data.balance= getUserBalance.walletMoney;
          console.log('data.to', data.totalFare);
          console.log('data.distance', data.distance);
          nextCall(null, data)
        })
      },
      /** store ride route location in ride logs table*/
    ], (err, response) => {
      console.log(err);
      console.log(response);
      if (err) {
        return res.sendToEncode({
          status: 400,
          message: (err && err.message) || 'SOMETHING_WENT_WRONG'
        });
      }
      return res.send({
        status_code: 200,
        message: 'total fair',
        data: response
      });

    })
  },

  closeCallRequest: function (details) {
    console.log("-------------------------------------------");
    callHistorySchema.updateOne({
      channelId: details.driverDetails._id,
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
        console.log('callDetails', callDetails);
        let pushNotificationData = {
          to: (details.driverDetails.deviceDetail && details.driverDetails.deviceDetail.token) || '',
          type: 'driver',
          os: details.driverDetails.deviceDetail.os,
          data: {
            title: 'Missed Call From passenger',
            type: 22,
            body: 'Call Ended',
            tag: 'call',
            data: {
              channelId: details.driverDetails._id,
              multicast_id: details.multicast_id,
              message_id: details.message_id

            },
            notification: {
              title: 'Missed Call From passenger'
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

  }
};
module.exports = _self;
