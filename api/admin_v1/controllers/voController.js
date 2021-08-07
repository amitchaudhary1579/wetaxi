const { io } = require("socket.io-client");

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
  pn = require('../../../support/push-notifications/pn'),
  //Database Schemas (MongoDB)
  AdminSchema = require("../../" + CONSTANTS.API_VERSION + "/models/admin"),
  withdrawLogsSchema = require("../../" + CONSTANTS.API_VERSION + "/models/withdrawsLogs"),
  walletLogs = require("../../" + CONSTANTS.API_VERSION + "/models/walletLogs")
VehicleSchema = require("../../" + CONSTANTS.API_VERSION + "/models/vehicle"),
  VehicleRequestSchema = require("../../" + CONSTANTS.API_VERSION + "/models/vehicleRequest"),
  DriverSchema = require("../../" + CONSTANTS.API_VERSION + "/models/driver"),
  SystemSettingsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/systemSettings"),
  RideSchema = require("../../" + CONSTANTS.API_VERSION + "/models/ride"),
  VehicleTypeSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/vehicleType"),
  VehicleColorSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/vehicleColor"),
  CountiesSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/countries"),
  NotificationNewSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationNew"),
  NotificationLogsNewSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationLogsNew"),
  ActionLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/action_logs"),
  NotificationLogsSchema = require("../../" +
    CONSTANTS.API_VERSION +
    "/models/notificationLogs"),
  Uploader = rootRequire("support/uploader"),
  message = rootRequire("config/messages/en"),
  commonHelper = require('../../v11/policies/commonHelper'),
  sendMail = require('../policies/emailHelper'),
  ED = rootRequire("services/encry_decry"),
  log_message = rootRequire("config/log_messages");
var API_URL = "http://3.21.49.79:6025/";

var ObjectId = mongoose.Types.ObjectId;
var _self = {
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
  getVehicleOwnerAutoIncrement: function (callback) {
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
                    vehicleOwnerAutoIncrement: Number(1),
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
              _self.vehicleOwnerAutoIncrement(function (err, response) {
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
  forgotPassword: async function (req, res) {
    if (!req.body.email && req.body.email == '') {
      return res.sendToEncode({
        status: 400,
        message: message.INVALID_PARAMS,
      });
    }
    let findUser = await AdminSchema.findOne({ email: req.body.email.trim() }, '_id type')
    if (findUser) {
      if (findUser.type != 'admin') {
        const mailOTP = await commonHelper.generateOTPNew();
        const currDate = new Date();
        // console.log(currDate)
        const expireTime = currDate.setMinutes(currDate.getMinutes() + 5);
        let updateOtp = await AdminSchema.updateOne({ _id: findUser._id }, {
          otpExpireTime: expireTime,
          otp: mailOTP
        });
        let updateData = await sendMail.sendVerificationOTP([req.body.email.trim()], 'forgotPassword', mailOTP);
        if (updateOtp.nModified || updateOtp.ok) {
          return res.sendToEncode({
            status_code: 200,
            message: 'success otp send to your email',
            data: {},
          });
        } else {
          return res.sendToEncode({
            status_code: 400,
            message: message.SOMETHING_WENT_WRONG,
            data: {},
          });
        }
      } else {
        return res.sendToEncode({
          status: 400,
          message: message.INVALID_PARAMS,
        });
      }
    } else {
      return res.sendToEncode({
        status: 400,
        message: 'admin can not change password',
      });
    }
  },
  checkOtp: async function (req, res) {
    if (!req.body.email && req.body.email == '' && !req.body.otp && req.body.otp == '') {
      return res.sendToEncode({
        status: 400,
        message: message.INVALID_PARAMS,
      });
    } else {
      let findEmailOtp = await AdminSchema.findOne({ email: req.body.email.trim(), otp: req.body.otp });
      if (findEmailOtp) {
        // check now 
        let currDate = new Date();
        let checkExpireOtp = await AdminSchema.findOne({ email: req.body.email.trim(), otpExpireTime: { $gte: currDate } });
        if (checkExpireOtp) {
          // success 
          // confirm otp
          const confirmOtp = await commonHelper.generateOTPNew();
          await AdminSchema.updateOne({ email: req.body.email.trim() }, { confirmOtp: confirmOtp })
          return res.sendToEncode({
            status_code: 200,
            message: 'otp match',
            data: { confirmOtp: confirmOtp },
          });
        } else {
          return res.sendToEncode({
            status: 400,
            message: 'otp expired',
          });
        }
      } else {
        return res.sendToEncode({
          status: 400,
          message: 'otp not match',
        });
      }
    }
  },
  resetPassword: async function (req, res) {
    if (!req.body.confirmOtp && req.body.confirmOtp != '' && !req.body.password && req.body.password != '') {
      return res.sendToEncode({
        status: 400,
        message: message.INVALID_PARAMS,
      });
    } else {
      let findUser = await AdminSchema.findOne({ confirmOtp: req.body.confirmOtp }, '_id email');
      if (findUser) {
        let encryptPassword = ED.encrypt(req.body.password);
        let updatePassword = await AdminSchema.updateOne({ _id: findUser._id }, { password: encryptPassword, confirmOtp: '' });
        if (updatePassword.nModified || updatePassword.ok) {
          await sendMail.sendVerificationOTP([findUser.email], 'resetPassword');
          return res.sendToEncode({
            status_code: 200,
            message: 'Password updated',
            data: {},
          });
        }
      } else {
        return res.sendToEncode({
          status: 400,
          message: 'confirm otp not found',
        });
      }
    }
  },
  addVo: async function (req, res) {
    async.waterfall(
      [
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
            !fields.email ||
            !fields.password ||
            !fields.userType
          ) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        }, function (fields, files, nextCall) {
          console.log('herer in chck number', fields);
          AdminSchema.findOne(
            {
              $or: [{ 'email': fields.email }, { 'phoneNumber': fields.phoneNumber }],
              isDeleted: false,
            }).exec(function (err, driver) {
              console.log('err 1', err);
              console.log('driver', driver);
              if (err) {
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              } else if (driver) {
                console.log('herer in driver')
                return nextCall({
                  message: fields.userType == "promoter" ? 'promoter already registered' : 'vehicle owner already registered',
                });
              } else {
                nextCall(null, fields, files);
              }
            });
        },
        function (fields, files, nextCall) {
          console.log('fileds function after', fields);
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
                  console.log('err---', err);
                  nextCall(err, fields, files);
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
        function (fields, nextCall) {
          console.log('fileds function after', fields);
          if (fields.userType == 'promoter') {
            _self.getPromoterAutoIncrement(function (err, response) {
              if (err) {
                console.log('err 2', err);
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              fields.autoIncrementID = response.promoterAutoIncrement;
              nextCall(null, fields);
            });
          } else {
            _self.getVehicleOwnerAutoIncrement(function (err, response) {
              if (err) {
                console.log('err 2', err);
                return nextCall({
                  message: message.SOMETHING_WENT_WRONG,
                });
              }
              fields.autoIncrementID = response.vehicleOwnerAutoIncrement;
              nextCall(null, fields);
            });
          }
        },
        /** insert data into driver collection */
        function (fields, nextCall) {
          console.log('fileds function after', fields);
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

          let data = {
            name: fields.name,
            email: fields.email,
            dob: fields.dob,
            password: fields.password,
            gender: fields.gender,
            phoneNumber: fields.phoneNumber,
            profilePhoto: fields.profilePhoto,
            autoIncrementID: fields.autoIncrementID,
            addedBy: req.user._id, // new
            type: fields.userType,
            countryCode: fields.countryCode,
            userCommission: fields.Commission ? Number(fields.Commission) : 0,
            vehicleOwnerCommission: fields.userType == 'promoter' ? Number(fields.vehicleOwnerCommission) ? Number(fields.vehicleOwnerCommission) : 0 : 0
            //   languageId: fields.languageId,
          };
          let userData = new AdminSchema(data);
          userData.save(function (err, responseData) {
            if (err) {
              console.log('err 1', err);
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.DRIVER,
              log_message.ACTION.ADD_DRIVER +
              ", vehicleOwnerId: " +
              responseData.autoIncrementID +
              ",  Name: " +
              responseData.name
            );
            nextCall(fields, null);
          });
        },
      ],
      function (fields, err) {
        console.log('fileds function after last', fields);
        console.log('err', err)
        if (fields.message) {
          return res.sendToEncode({
            status: 400,
            message: (fields && fields.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: fields.userType == "promoter" ? 'promoter added successfully' : 'vehicle owner added successfully',
          data: {},
        });
      }
    );
  },
  editVo: async function (req, res) { // for promoter and vehicle owner both
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          fields.userId = req.user.type == 'admin' || req.user.type == 'promoter' ? fields.id : req.user._id;
          AdminSchema.findOne({
            _id: fields.userId
          })
            .lean()
            .exec(function (err, Vo) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else if (!Vo) {
                return nextCall({
                  message: 'user not found'
                });
              } else {
                nextCall(null, fields, files, Vo);
              }
            });
        },
        /** check email and mobile no already registered or not */
        // function (fields, files, Vo, nextCall) {
        //   var userExistCondition = [];
        //   console.log('phoneNumber---',req.user);
        //   if (fields.phoneNumber && fields.phoneNumber != req.user.phoneNumber) {
        //     userExistCondition.push({
        //       phoneNumber: fields.phoneNumber,
        //        _id: { $ne : ObjectId(fields.userId)},
        //        isDeleted: false 
        //     });
        //   }
        //   if (userExistCondition.length >0) {
        //     AdminSchema.findOne({
        //       $or: userExistCondition
        //     }).exec(function (err, driverData) {
        //       if (err) {
        //         return nextCall({
        //           message: 'SOMETHING_WENT_WRONG'
        //         });
        //       } else if (driverData) {
        //         // console.log('driverData  ---',driverData)
        //         return nextCall({
        //           message: 'user already existed'
        //         });
        //       } else {
        //         nextCall(null, fields, files, Vo);
        //       }
        //     });
        //   } else {
        //     nextCall(null, fields, files, Vo);
        //   }
        // },
        /** upload profile picture */
        function (fields, files, Vo, nextCall) {
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
                  if (Vo.profilePhoto && Vo.profilePhoto != '') {
                    Uploader.remove({
                      filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + Vo.profilePhoto
                    },
                      nextProc
                    );
                  } else {
                    nextProc();
                  }
                },
                function (nextProc) {
                  // remove old thumb image
                  if (Vo.profilePhoto && Vo.profilePhoto != '') {
                    Uploader.remove({
                      filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + Vo.profilePhoto
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
                  nextCall(err, fields, files, Vo);
                }
                fields.profilePhoto = filename;
                nextCall(null, fields, Vo);
              }
            );
          } else {
            nextCall(null, fields, Vo);
          }
        },
        function (fields, Vo, nextCall) {
          console.log('fields by api', fields);
          let updateDriverData = {
            // uniqueID: fields.uniqueID,
            name: fields.name ? fields.name : Vo.name,
            // email: fields.email,
            dob: fields.dob ? fields.dob : Vo.dob,
            phoneNumber: fields.phoneNumber
              ? fields.phoneNumber
              : Vo.phoneNumber,
            countryCode: fields.countryCode
              ? fields.countryCode
              : Vo.countryCode,
            // onlyPhoneNumber: fields.onlyPhoneNumber
            //   ? fields.onlyPhoneNumber
            //   : Vo.onlyPhoneNumber,
            profilePhoto: fields.profilePhoto
              ? fields.profilePhoto
              : Vo.profilePhoto,
            userCommission: fields.Commission
              ? fields.Commission
              : Vo.userCommission,
            vehicleOwnerCommission: Vo.userType == 'promoter' ? fields.vehicleOwnerCommission ? fields.vehicleOwnerCommission : Vo.vehicleOwnerCommission ? Vo.vehicleOwnerCommission : 0 : 0,
            // drivingLicence: fields.drivingNumber ? fields.drivingNumber : driver.drivingLicence,  
          };
          console.log('updated data ', updateDriverData);
          AdminSchema.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(fields.userId),
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
                ", VehicleOwnerId: " +
                updateData.autoIncrementID +
                ",  Name: " +
                updateData.name
              );
              nextCall(updateData, null);
            }
          );
        },
      ],
      function (updateData, err) {
        if (err) {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: updateData.type == 'promoter' ? 'Promoter updated successfully' : 'Vehicle owner updated successfully',
          data: {},
        });
      }
    );
  },
  getVoById: async function (req, res) { //get VO details by Id 
    console.log('req.', req.query);
    async.waterfall(
      [
        function (nextCall) {
          let userId = req.user.type == 'admin' || req.user.type == 'promoter' ? req.query.id : req.user._id;
          AdminSchema.findOne({ _id: ObjectId(userId) }, 'name _id email phoneNumber addedBy profilePhoto gender dob countryCode userCommission userType vehicleOwnerCommission')
            .populate('addedBy', 'name type')
            .exec(function (err, Vo) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {

                nextCall(null, Vo);
                // prints "The creator is Aaron"
              }
            })
        }
      ],
      function (err, data) {
        if (data) {
          return res.sendToEncode({
            status_code: 200,
            message: 'user details',
            data: data,
          });
        } else {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
      }
    );
  },
  getVoList: async function (req, res) {
    async.waterfall(
      [
        function (nextCall) {

          let conditionId;
          if (req.user.type == 'promoter') {
            conditionId = { type: 'vehicleOwner', addedBy: ObjectId(req.user._id), isDeleted: false };
          } else if (req.user.type == 'admin') {
            if (req.body.promoterId && req.body.promoterId != null && req.body.promoterId != undefined) {
              conditionId = { type: 'vehicleOwner', addedBy: ObjectId(req.query.promoterId), isDeleted: false };
            } else {
              conditionId = { type: 'vehicleOwner', isDeleted: false };
            }
          }
          let aggregateQuery = [];
          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;
          let searchKey = req.query.searchKey ? req.query.searchKey : false;
          aggregateQuery.push({
            $match: conditionId
          })
          if (searchKey) {
            // search on promoters email, name, dob, gender
            const re = new RegExp(`${searchKey}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ email: re }, { name: re }, { dob: re }, { phoneNumber: re }],
              },
            });
          }
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
                  name: 1,
                  type: 1,
                  profilePhoto: 1
                }
              }
              ],
              'as': 'addedByData'
            }
          });
          aggregateQuery.push({
            '$unwind': {
              'path': '$addedByData',
              'preserveNullAndEmptyArrays': true
            }
          });
          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });

          //  aggregateQuery.push({
          //    $skip: Number(req.query.skip) || 0,
          //  });

          //  aggregateQuery.push({
          //    $limit: Number(req.query.limit) || 10,
          //  });
          aggregateQuery.push({
            $facet: {
              vehicleOwnerList: [
                {
                  $skip: Number(req.query.skip) || 0,
                },
                {
                  $limit: Number(req.query.limit) || 10,
                },
              ],
              vehicleOwnerCount: [
                {
                  $count: "filterCount",
                },
              ],
            },
          });

          // .populate('addedBy','name type profilePhoto');  
          AdminSchema.aggregate(aggregateQuery, async (err, allVehicleData) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let fullCount = await AdminSchema.find(conditionId).count();
              allVehicleData[0].fullCount = fullCount;
              nextCall(null, allVehicleData);
            }
          });
        }
      ],
      function (err, data) {
        if (data) {
          return res.sendToEncode({
            status_code: 200,
            message: 'vehicle ownerList',
            data: data,
          });
        } else {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
      }
    );
  },
  deleteVo: async function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, nextCall) {
          if (fields && !fields.id) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        }, function (fields, nextCall) {
          AdminSchema.updateOne({ _id: ObjectId(fields.id) }, { isDeleted: true }).exec(function (err, data) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            };
            _self.addActionLog(
              req.user,
              log_message.SECTION.PROMOTION_CODE,
              log_message.ACTION.DELETE_PROMOCODE +
              ", vehicleOwner Id : " +
              fields.id
            );
          });
        }
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
      })
  },
  addVehicle: async function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (fields && !fields.typeId) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        // vehicle pohotoes
        function (fields, files, nextCall) {
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
                if (files.vehiclePhotos[k].type.indexOf("image") === -1) {
                  return nextFile(null, null);
                }

                var extension = path.extname(files.vehiclePhotos[k].name);
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
                          src: files.vehiclePhotos[k].path,
                          dst: rootPath + "/" + thumb_image
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.largeUpload(
                        {
                          // upload large file
                          src: files.vehiclePhotos[k].path,
                          dst: rootPath + "/" + large_image
                        },
                        nextProc
                      );
                    },
                    function (nextProc) {
                      Uploader.remove(
                        {
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
        function (fields, nextCall) {
          VehicleTypeSchema.findOne({
            _id: fields.typeId,
          }).exec(function (err, vehicleType) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else if (!vehicleType) {
              return nextCall({
                message: message.VEHICLE_NOT_FOUND,
              });
            } else {
              fields.vehicleType = vehicleType.type.en.charAt(0);
              nextCall(null, fields);
            }
          });
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
          let vehicleData = {
            typeId: fields.typeId,
            addedBy: req.user._id,
            year: fields.year,
            seats: fields.seats,
            color: fields.color,
            model: fields.model,
            transmissionType: fields.transmissionType ? fields.transmissionType : 'gear',
            commissionPercentage: fields.commissionPercentage ? fields.commissionPercentage : 5,
            isAcAvailable: fields.isAcAvailable,
            isSmokingAllowed: fields.isSmokingAllowed,
            vehiclePhotos: fields.vehiclePhotos,
            vehicleIdPhotos: fields.vehicleIdPhotos,
            plateNoPhotos: fields.plateNoPhotos,
            platNumber: fields.platNumber,
          };
          console.log(vehicleData);
          let vehicle = new VehicleSchema(vehicleData);
          vehicle.save(function (err, vehicleResponse) {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
            _self.addActionLog(
              req.user,
              log_message.SECTION.DRIVER,
              log_message.ACTION.ADD_DRIVER +
              ", vehicleId: " +
              vehicleResponse.autoIncrementID
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
          message: message.CREATE_VEHICLE_SUCC,
          data: {},
        });
      }
    );
  },
  listVehicles: async function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let conditionId = {};
          if (req.user.type == 'promoter') {
            conditionId = {
              addedBy: ObjectId(req.query.vehicleOwnerId),
              isDeleted: false
            }
          } else if (req.user.type == 'admin') {
            if (req.query.vehicleOwnerId) {
              conditionId = {
                addedBy: ObjectId(req.query.vehicleOwnerId),
                isDeleted: false
              }
            } else {
              conditionId = {
                isDeleted: false
              }
            }
          } else {
            conditionId = { isDeleted: false, addedBy: ObjectId(req.user._id) }
          }
          let aggregateQuery = [];
          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;
          let searchKey = req.query.search ? req.query.search : false;
          let startDate = req.query.startDate ? req.query.startDate : false;
          let endDate = req.query.endDate ? req.query.endDate : false;
         
          aggregateQuery.push({
            $match: conditionId
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
                  name: 1,
                  type: 1,
                  profilePhoto: 1
                }
              }
              ],
              'as': 'addedByData'
            }
          });
          aggregateQuery.push({
            '$unwind': {
              'path': '$addedByData',
              'preserveNullAndEmptyArrays': true
            }
          });
          aggregateQuery.push({
            '$lookup': {
              'from': 'vehicle_type',
              'let': {
                'id': '$typeId'
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
                  type: 1
                }
              }
              ],
              'as': 'vehicleTypeData'
            }
          });
          aggregateQuery.push({
            '$unwind': {
              'path': '$vehicleTypeData',
              'preserveNullAndEmptyArrays': true
            }
          });
          aggregateQuery.push({
            '$lookup': {
              'from': 'driver',
              'let': {
                'id': '$currentDriverAssignId'
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
                  name: 1,
                  phoneNumber: 1,
                  countryCode: 1,
                  onlyPhoneNumber: 1
                }
              }
              ],
              'as': 'driverData'
            }
          });
          aggregateQuery.push({
            '$unwind': {
              'path': '$driverData',
              'preserveNullAndEmptyArrays': true
            }
          });
          aggregateQuery.push({
            $sort: { [columnName]: orderBy },
          });




         
          
          if (searchKey) {
            const re = new RegExp(`${searchKey}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  // { 'addedByData.name': re } , { 'addedByData.type' : re} ,
                {'driverData.name' : re} , {'driverData.phoneNumber' : re} , 
                {'transmissionType' : re},
                {'platNumber' : re},
                {'model' : re},
                
              ],
              },
            });
          }

          if(startDate)
          {

            aggregateQuery.push({
              $match: {
                updatedAt : {
                  $gte: new Date(startDate)
                }
              },
            });
         }
         
         if(endDate)
         {

           aggregateQuery.push({
             $match: {
              updatedAt : {
                $lte: new Date(endDate)
               }
             },
           });
        }

          aggregateQuery.push({
            $facet: {
              vehicleList: [
                {
                  $skip: Number(req.query.skip) || 0,
                },
                {
                  $limit: Number(req.query.limit) || 10,
                },
              ],
              vehicleCount: [
                {
                  $count: "filterCount",
                },
              ],
            },
          });
          // .populate('addedBy','name type profilePhoto');  
          VehicleSchema.aggregate(aggregateQuery, async (err, allVehicle) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              let fullCount = await VehicleSchema.find(conditionId).count();
              allVehicle[0].fullCount = fullCount;
              responseData.allVehicle = allVehicle;
              nextCall(null, responseData);
            }
          });
        }
      ],
      function (err, data) {
        if (data) {
          return res.sendToEncode({
            status_code: 200,
            message: 'vehicle added successfully',
            data: data,
          });
        } else {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
      }
    )
  },
  getVehicleById: async function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let vehicleId = req.query.id;
          VehicleSchema.findOne({ _id: ObjectId(vehicleId) })
            .populate('addedBy', 'name type').lean()
            .exec(async function (err, Vo) {
              if (err) {
                return nextCall({
                  message: 'SOMETHING_WENT_WRONG'
                });
              } else {
                if (Vo.currentDriverAssign == true) {
                  let findDriver = await DriverSchema.findOne({ _id: Vo.currentDriverAssignId }, 'name onlyPhoneNumber countryCode email gender');
                  if (findDriver) {
                    Vo.currentDriverData = findDriver;
                  }
                }
                nextCall(null, Vo);
                // prints "The creator is Aaron"
              }
            })
        }
      ],
      function (err, data) {
        if (data) {
          return res.sendToEncode({
            status_code: 200,
            message: 'vehicle details',
            data: data,
          });
        } else {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
      }
    );
  },
  editVehicle: async function (req, res) {
    async.waterfall(
      [
        /** get form data */
        function (nextCall) {
          Uploader.getFormFields(req, nextCall);
        },
        function (fields, files, nextCall) {
          if (fields && !fields.vehicleId) {
            return nextCall({
              message: message.INVALID_PARAMS,
            });
          }
          nextCall(null, fields, files);
        },
        function (fields, files, nextCall) {
          VehicleSchema.findOne({
            _id: fields.vehicleId,
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
        function (fields, files, driver, nextCall) {
          if (fields.removeVehicleIdPhotos && fields.removeVehicleIdPhotos.length > 0) {
            if (
              fields.removeVehicleIdPhotos &&
              typeof fields.removeVehicleIdPhotos == "string"
            ) {
              fields.removeVehicleIdPhotos = JSON.parse(
                fields.removeVehicleIdPhotos
              );
            }
            async.mapSeries(
              fields.removeVehicleIdPhotos,
              function (k, nextFile) {
                if (k && k != "") {
                  /** remove image from server */
                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
                  });

                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k,
                  });
                }

                /** remove image name from id photos array */
                driverIdPhotos = driverIdPhotos.filter(
                  (item) => item !== k
                );
                nextFile(null);
              },
              function (err) {
                nextCall(null, fields, files, driver);
              }
            );
          } else {
            // driverIdPhotos = driverIdPhotos;
            nextCall(null, fields, files, driver);
          }
        },
        /** upload vehicle id photos */
        function (fields, files, driver, nextCall) {
          if (files.vehicleIdPhotos) {
            if ((files.vehicleIdPhotos.length > 0)) {
              let a = [];
              a.push(files.vehicleIdPhotos);
              files.vehicleIdPhotos = a;
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
                  driverIdPhotos = Object.assign(
                    driverIdPhotos.concat(vehicleIdPhotosName)
                  );
                  nextCall(null, fields, files, driver);
                }
              );
            }
          
          } else {
            nextCall(null, fields, files, driver);
          }
        },
        /** remove plate number photos */
        function (fields, files, driver, nextCall) {
          if (
            fields.removePlateNoPhotos &&
            fields.removePlateNoPhotos.length > 0
          ) {
            if (
              fields.removePlateNoPhotos &&
              typeof fields.removePlateNoPhotos == "string"
            ) {
              fields.removePlateNoPhotos = JSON.parse(
                fields.removePlateNoPhotos
              );
            }
            async.mapSeries(
              fields.removePlateNoPhotos,
              function (k, nextFile) {
                if (k && k != "") {
                  /** remove image from server */
                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k,
                  });

                  Uploader.remove({
                    filepath:
                      rootPath + "/" + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k,
                  });
                }

                /** remove image name from id photos array */
                driver.plateNoPhotos = driver.plateNoPhotos.filter(
                  (item) => item !== k
                );
                nextFile(null);
              },
              function (err) {
                nextCall(null, fields, files, driver);
              }
            );
          } else {
            driver.plateNoPhotos = driver.plateNoPhotos;
            nextCall(null, fields, files, driver);
          }
        },
        /** upload plate number photos */
        function (fields, files, driver, nextCall) {
          if (files.plateNoPhotos) {
            if ((files.plateNoPhotos.length > 0)) {
              let a = [];
              a.push(files.plateNoPhotos);
              files.plateNoPhotos = a;
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
                  driver.plateNoPhotos = Object.assign(
                    driver.plateNoPhotos.concat(plateNumberPhotosName)
                  );
                  nextCall(null, fields, driver);
                }
              );
            }
       
          } else {
            nextCall(null, fields, driver);
          }
        },
        /** get vehicle type */
        function (fields, driver, nextCall) {
          let vehicleData = {
            typeId: fields.typeId ? fields.typeId : driver.typeId,
            year: fields.year ? fields.year : driver.year,
            seats: fields.seats ? fields.seats : driver.seats,
            color: fields.color ? fields.color : driver.color,
            model: fields.model ? fields.model : driver.model,
            isAcAvailable: fields.isAcAvailable
              ? fields.isAcAvailable
              : driver.isAcAvailable,
            isSmokingAllowed: fields.isSmokingAllowed
              ? fields.isSmokingAllowed
              : driver.isSmokingAllowed,
            // vehiclePhotos: driverPhotos,
            vehicleIdPhotos: driver.IdPhotos,
            plateNoPhotos: driver.plateNoPhotos,
            platNumber: fields.platNumber
              ? fields.platNumber
              : driver.platNumber
          };
          VehicleSchema.updateOne({
            _id: mongoose.Types.ObjectId(fields.vehicleId),
          }, {
            $set: vehicleData,
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
        }
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
          message: 'vehicle update successfully',
          data: {},
        });
      }
    );
  },
  // deActiveVehicle: async function(req,res){
  driverList: async function (req, res) {
    // here driver list 
    let userId = req.user._id;
    let aggregateQuery = [];
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;
    aggregateQuery.push({
      $match: {
        isBlocked: false,
        isVerified: true,
        isDeleted: false,
        isBusy: false,
        isAvailable: true,
        // isPassExam: true 
      }
    })
    aggregateQuery.push({
      $project: {
        uniqueID: 1,
        name: 1,
        email: 1,
        phoneNumber: 1,
        profilePhoto: 1,
        totalRating: 1,
        avgRating: 1,
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
    DriverSchema.aggregate(aggregateQuery, (err, driverList) => {
      if (err) {
        console.log('error',err);
        return nextCall({
          message: message.SOMETHING_WENT_WRONG,
        });
      } else {
        return res.sendToEncode({
          status_code: 200,
          message: 'driver list',
          data: driverList,
        });

      }
    });
  },
  listPromoter: async function (req, res) {
    let aggregateQuery = [];
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;
    let searchKey = req.query.searchKey ? req.query.searchKey : false;
    aggregateQuery.push({
      $match: {
        type: 'promoter',
        isDeleted: false
      }
    });
    //
    if (searchKey) {
      // search on promoters email, name, dob, gender
      const re = new RegExp(`${searchKey}`, "i");
      aggregateQuery.push({
        $match: {
          $or: [{ email: re }, { name: re }, { dob: re }, { phoneNumber: re }],
        },
      });
    }
    aggregateQuery.push({
      $project: {
        password: 0,
        canChangePassword: 0,
        updated_at: 0,
        userName: 0,
      }
    })
    aggregateQuery.push({
      $sort: { [columnName]: orderBy },
    });
    aggregateQuery.push({
      $facet: {
        promoterList: [
          {
            $skip: Number(req.query.skip) || 0,
          },
          {
            $limit: Number(req.query.limit) || 10,
          },
        ],
        promoterCount: [
          {
            $count: "filterCount",
          },
        ]
      },
    });
    AdminSchema.aggregate(aggregateQuery, async (err, promoterList) => {
      if (err) {
        return nextCall({
          message: message.SOMETHING_WENT_WRONG,
        });
      } else {
        let fullCount = await AdminSchema.find({ isDeleted: false, type: 'promoter' }).count();

        promoterList[0].fullCount = fullCount;
        // promoterList.filterCount = 
        return res.sendToEncode({
          status_code: 200,
          message: 'driver list',
          data: promoterList,

        });
      }
    });
  },
  deactivateUser: async function (req, res) {
    /** get form data */
    let findUserData = await AdminSchema.findOne({
      _id: ObjectId(req.body.id)
    });
    if (!findUserData) {
      return res.sendToEncode({
        message: 'DRIVER_NOT_FOUND'
      });
    } else {
      let updateData = await AdminSchema.updateOne({
        _id: findUserData._id
      }, {
        isActive: findUserData.isActive ? false : true
      });
      if (updateData.nModified || updateData.ok) {
        _self.addActionLog(
          req.user,
          log_message.SECTION.DRIVER,
          log_message.ACTION.UPDATE_DRIVER +
          ", promoterID: " +
          updateData.autoIncrementID +
          ",  Name: " +
          updateData.name
        );
        return res.sendToEncode({
          status_code: 200,
          message: 'update successfully',
          data: {},
        })
      } else {
        return res.sendToEncode({
          status: 400,
          message: (err && err.message) || message.SOMETHING_WENT_WRONG,
        });
      }
    }
  },
  // },
  sendRequestToDriver: async function (req, res) {
    console.log('in send request', req.body)
    // async.waterfall(
    //   [
    //     /** get form data */
    //     function (nextCall) {
    //       Uploader.getFormFields(req, nextCall);
    //     },
    //     function (fields, files, nextCall) {
    //       if (fields && !fields.vehicleId) {
    //         return nextCall({
    //           message: message.INVALID_PARAMS,
    //         });
    //       }
    //       nextCall(null, fields, files);
    //     },   
    // function (fields, nextCall) {
    let fields = req.body;
    fields.createdBy = req.user._id;
    // driverId  check
    let findDriver = await DriverSchema.findOne({ _id: fields.driverId });
    if (!findDriver) {
      return res.sendToEncode({
        status: 400,
        message: (err && err.message) || message.SOMETHING_WENT_WRONG,
      });
    }
    let findVehicleId = await VehicleSchema.findOne({ _id: fields.vehicleId });
    if (!findVehicleId) {
      return res.sendToEncode({
        status: 400,
        message: (err && err.message) || message.SOMETHING_WENT_WRONG,
      });
    }
    let data = {
      driverId: fields.driverId,
      vehicleOwnerId: fields.createdBy,
      vehicleId: fields.vehicleId,
      isSendByDriver: false
    }
    let userData = new VehicleRequestSchema(data);
    userData.save(function (err, responseData) {
      if (err) {
        console.log('err 1', err);
        return res.sendToEncode({
          status: 400,
          message: (err && err.message) || message.SOMETHING_WENT_WRONG,
        });
      }
      _self.addActionLog(
        req.user,
        log_message.SECTION.DRIVER,
        log_message.ACTION.ADD_DRIVER +
        ", vehicleRequestId: " +
        responseData.autoIncrementID +
        ",  Name: " +
        responseData.name
      );
      return res.sendToEncode({
        status_code: 200,
        message: 'added successfully',
        data: {},
      });
    });
  },
  acceptRejectRequest: async function (req, res) {
    // here accept or reject vehicle request by vehicle owner 
    // also check driver has already assign vehicle or not 
    let fields = req.body;

    /** get form data */
    if (fields && !fields.requestId && !fields.status) {
      console.log('validation error')
    }
    // check that driver has already assign or not to other vehicle 
    if (fields.status == 'approve') {
      // VehicleSchema.findOne( { 
      //   currentDriverAssignId: fields.driverId
      // }, function( err, updateAssignId){
      //   if (err) {
      //     console.log(err);
      //     return nextCall({
      //       message: message.SOMETHING_WENT_WRONG,
      //     });
      //   }
      //   if(updateAssignId){
      //     return nextCall({
      //       message: 'already assign to another vehicle',
      //     });
      //   }
      // });
    }
    VehicleRequestSchema.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(fields.requestId) },
      {
        status: fields.status,
        approvedDate: Date.now(),
        isApproved: fields.status == "approve" ? true : false
      },
      function (err, updateData) {
        if (err) {
          return nextCall({
            message: message.SOMETHING_WENT_WRONG,
          });
        }

        if (fields.status == 'approve') {
          VehicleSchema.updateOne({
            _id: updateData.vehicleId
          }, {
            currentDriverAssignId: updateData.driverId,
            currentDriverAssign: true
          }, function (err, updateAssignId) {
            if (err) {
              console.log(err);
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            }
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
  vehicleRequestList: async function (req, res) {
    // here list of all vehicle request shown 
    async.waterfall(
      [
        function (nextCall) {
          let userId = req.user._id;
          let aggregateQuery = [];
          var columnName = req.query.columnName ? req.query.columnName : "_id";
          var orderBy = req.query.orderBy == "asc" ? 1 : -1;
          let searchKey = req.query.search ? req.query.search : false;
          let startDate = req.query.startDate ? req.query.startDate : false;
          let endDate = req.query.endDate ? req.query.endDate : false;
          aggregateQuery.push({
            $match: {
              isSendByDriver: true,
              vehicleOwnerId: ObjectId(userId)
            }
          })
          aggregateQuery.push({
            '$lookup': {
              'from': 'driver',
              'let': {
                'id': '$driverId'
              },
              'pipeline': [{
                '$match': {
                  '$expr': {
                    '$eq': ['$_id', '$$id']
                  }
                }
              }, {
                '$project': {
                  name: 1,
                  uniqueID: 1,
                  email: 1,
                  phoneNumber: 1,
                  drivingLicence: 1,
                  profilePhoto: 1
                }
              }],
              'as': 'driverData'
            }
          });
          aggregateQuery.push({
            '$unwind': {
              'path': '$driverData',
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
                    '$eq': ['$_id', '$$id']
                  }
                }
              }, {
                '$project': {
                  name: 1,
                  model: 1,
                  platNumber: 1,
                  phoneNumber: 1,
                  drivingLicence: 1
                }
              }],
              'as': 'vehicleData'
            }
          });
          aggregateQuery.push({
            '$unwind': {
              'path': '$vehicleData',
              'preserveNullAndEmptyArrays': false
            }
          });
          if (searchKey) {
            const re = new RegExp(`${searchKey}`, "i");
            aggregateQuery.push({
              $match: {
                $or: [{ 'driverData.name': re } , { 'driverData.email' : re} ,
                {'vehicleData.name' : re} , {'vehicleData.platNumber' : re} , {
                  'vehicleData.model' : re }
              ],
              },
            });
          }

          if(startDate)
          {

            aggregateQuery.push({
              $match: {
                createdAt : {
                  $gte: new Date(startDate)
                }
              },
            });
         }
         
         if(endDate)
         {

           aggregateQuery.push({
             $match: {
               createdAt : {
                $lte: new Date(endDate)
               }
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
          VehicleRequestSchema.aggregate(aggregateQuery, (err, allRequest) => {
            if (err) {
              return nextCall({
                message: message.SOMETHING_WENT_WRONG,
              });
            } else {
              let responseData = {};
              responseData.allRequest = allRequest;
              nextCall(null, responseData);
            }
          });
        }
      ],
      function (err, data) {
        if (data) {
          return res.sendToEncode({
            status_code: 200,
            message: 'list of data',
            data: data,
          });
        } else {
          return res.sendToEncode({
            status: 400,
            message: (err && err.message) || message.SOMETHING_WENT_WRONG,
          });
        }
      }
    )
  },
  dashboardData: async function (req, res) {
    let userId = req.user._id;
    let responseData = {};
    let totalVehicleCount = await VehicleSchema.count( //total
      {
        addedBy: ObjectId(userId)
      });
    responseData.totalVehicleCount = totalVehicleCount;

    let isCarHasDriver = await VehicleSchema.count( // driver assign
      {
        addedBy: ObjectId(userId),
        currentDriverAssign: true
      }
    )
    let assignCarInRide = await RideSchema.aggregate(
      [
        {
          '$match': {
            'status': 'onride'
          }
        }, {
          '$sort': {
            'createdAt': -1
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
          '$match': {
            'vehicleData.addedBy': req.user._id
          }
        },
        {
          '$count': 'rideId'
        }
      ]
    );

    responseData.idealCarList = Number(isCarHasDriver) - Number(assignCarInRide.length > 0 ? assignCarInRide[0].rideId : 0);
    responseData.assignCarInRide = Number(assignCarInRide.length > 0 ? assignCarInRide[0].rideId : 0);
    responseData.isCarHasDriverCount = isCarHasDriver;
    responseData.carWithoutDriver = Number(responseData.totalVehicleCount) - Number(isCarHasDriver)
    // nextCall(responseData)
    // console.log(responseData);
    return res.sendToEncode({
      status_code: 200,
      message: 'dashboard data for box',
      data: responseData,
    });
    // await RideSchema.count( // car with ride on 
    //     {
    //       status: 'onride'
    //     }
    //   ).exec(function (err, carWithoutDriver) {
    //     if (err) {
    //       return nextCall({
    //         message: message.SOMETHING_WENT_WRONG,
    //       });
    //     } else {
    //       responseData.carWithoutDriver = carWithoutDriver;
    //     }
    // })
  },
  getDashBoardTableData: async function (req, res) {
    let responseData = {};
    let aggregateQuery = [];
    // assign car list 
    aggregateQuery.push({
      $match: {
        addedBy: ObjectId(req.user._id)
      }
    });
    aggregateQuery.push({
      '$lookup': {
        'from': 'vehicle_type',
        'let': {
          'id': '$typeId'
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
            name: 1,
            type: 1,
          }
        }
        ],
        'as': 'vehicleTypeData'
      }
    });
    aggregateQuery.push({
      '$unwind': {
        'path': '$vehicleTypeData',
        'preserveNullAndEmptyArrays': false
      }
    }); // vehicleTypeData
    aggregateQuery.push({
      '$lookup': {
        'from': 'driver',
        'let': {
          'id': '$currentDriverAssignId'
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
            name: 1,
            uniqueID: 1,
            profilePhoto: 1,
            phoneNumber: 1,
          }
        }
        ],
        'as': 'driverData'
      }
    });
    aggregateQuery.push({
      '$unwind': {
        'path': '$driverData',
        'preserveNullAndEmptyArrays': false
      }
    }); // cuurent driver data 

    aggregateQuery.push({
      '$lookup': {
        'from': 'ride',
        'let': {
          'id': '_id'
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
          '$sort': {
            'createdAt': -1
          }
        },
        {
          '$limit': 1
        },
        {
          '$project': {
            'status': 1,
          }
        }
        ],
        'as': 'rideStatusData'
      }
    });
    aggregateQuery.push({
      '$unwind': {
        'path': '$rideStatusData',
        'preserveNullAndEmptyArrays': false
      }
    });
    let vehicleData = await VehicleSchema.aggregate(aggregateQuery);
    return res.sendToEncode({
      status_code: 200,
      message: 'dashboard data for table',
      data: responseData,
    });
  },
  getAccountDetails: async function (req, res) {
    let accountInfo = await AdminSchema.findOne({ _id: mongoose.Types.ObjectId(req.user._id) }, '_id accountDetails');
    if (accountInfo) {
      return res.sendToEncode({
        status_code: 200,
        message: "",
        data: accountInfo
      });
    } else {
      return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'No user Found',
      });
    }
  },
  saveAccountDetails: async function (req, res) {
    let updateData = {
      accountDetails: {
        cardNumber: req.body.cardNumber,
        cardType: req.body.cardType
      },
    }
    let accountInfo = await AdminSchema.updateOne({ _id: mongoose.Types.ObjectId(req.user._id) }, updateData);
    if (accountInfo) {
      return res.sendToEncode({
        status_code: 200,
        message: "",
        data: 'Account updated'
      });
    } else {
      return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'No user Found'
      });
    }
  },
  sendFreeCarWarning: async function (req, res) {
    if (req.body.vehicleId && req.body.vehicleId != '') {
      // 
      let getDriverDetails = await VehicleSchema.aggregate([
        {
          '$match': {
            '_id': mongoose.Types.ObjectId(req.body.vehicleId),
            'currentDriverAssign': true
          }
        }, {
          '$lookup': {
            'from': 'driver',
            'localField': 'currentDriverAssignId',
            'foreignField': '_id',
            'as': 'driverData'
          }
        }, {
          '$unwind': {
            'path': '$driverData',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$project': {
            '_id': 1,
            'driverData.countryCode': 1,
            'driverData.onlyPhoneNumber': 1,
            'driverData.deviceDetail': 1
          }
        }
      ]);
      if (getDriverDetails.length > 0) {
        //  send push notiifcation 
        let pushNotificationData = {
          to: (getDriverDetails[0].driverData.deviceDetail.token),
          type: 'driver',
          os: getDriverDetails[0].driverData.deviceDetail.os,
          data: {
            title: '',
            body: 'Set car free',
            tag: 'Vehicle',
            data: {
              vehicleOwnerId: req.user._id
            },
            notification: {
              title: 'Vehicle Owner request assign car free',
              body: 'Tap to communicate with car owner'
            }
          }
        }
        // console.log('push notification', pushNotificationData);
        pn.fcm(pushNotificationData, function (err, Success) {
          if (err) {
            console.log('error in send notifincation ', err);
          }
          return res.sendToEncode({
            status_code: 200,
            message: 'notification send',
            data: {},
          });
        });
      } else {
        return res.sendToEncode({
          status:  400,
          message: 'vehicle already free Not Found Any Driver'
        });
      }
    } else {
      return res.sendToEncode({
        status:  400,
        message: 'undefined params'
      });
    }
  },
  carFreeConfirm: async function (req, res) {
    if (req.body.vehicleId && req.body.vehicleId != '') {
      // 
      let getDriverDetails = await VehicleSchema.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.vehicleId) }, { currentDriverAssign: false, currentDriverAssignId: null });
      if (getDriverDetails) {
        return res.sendToEncode({
          status_code: 200,
          message: 'car released',
          data: {},
        });
      } else {
        return res.sendToEncode({
          status:  400,
          message: 'vehicle already free'
        });
      }
    } else {
      return res.sendToEncode({
        status:  400,
        message: 'undefined params'
      });
    }
  },
  getWithdrawsLogs: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          var limit = req.query.limit && req.query.limit > 0 ? Number(req.query.limit) : 10;
          var page = req.query.page && req.query.page > 0 ? Number(req.query.page) : 1;
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
  getWithDrawsById: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          var limit = req.body.limit && req.body.limit > 0 ? Number(req.body.limit) : 10;
          var page = req.body.page && req.body.page > 0 ? Number(req.body.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;

          offset = Number(offset);

          withdrawLogsSchema.find({
            userId: req.query.userId
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
  getMoneyTransferLog: async function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let projection = req.user.type == 'promoter' ? 'promoterCommission rideId endedAt' : 'voCommission rideId endedAt';
          var limit = req.query.limit && req.query.limit > 0 ? Number(req.query.limit) : 10;
          var page = req.query.page && req.query.page > 0 ? Number(req.query.page) : 1;
          var offset = (page - 1) * limit;
          var hasMore = false;
          offset = Number(offset);
          withdrawLogsSchema.find({
            from: req.user._id
          })
            .sort({
              createdAt: -1
            })
            .limit(limit)
            .skip(offset).
            populate('rideId', projection)
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
  transferMoneyFromWallet: async function (req, res) {
    if (!req.body.amount && req.body.amount == '') {
      return res.sendToEncode({
        status: err.code ? err.code : 400,
        message: 'undefined params'
      });
    }
    else {
      let findWalletData = await AdminSchema.findOne({ _id: req.user._id }, 'walletMoney');
      if (!findWalletData) {
        return res.sendToEncode({
          status: 400,
          message: 'user not find'
        });
      } else if (findWalletData.walletMoney < req.body.amount) {
        return res.sendToEncode({
          status: 400,
          message: 'can not give amount greater then wallet'
        });
      } else {
        let updateWalletBalance = await AdminSchema.updateOne({ _id: req.user._id }, {
          $inc: {
            walletMoney: -Number(req.body.amount)
          }
        });

        let data = {
          roleFor: 'admin',
          userId: req.user._id,
          createdBy: req.user._id,
          amount: req.body.amount
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
  addMoneyToWallet: async function (req, res) {
    if (!req.body.amount && req.body.amount == '') {
      return res.sendToEncode({
        status: 400,
        message: 'undefined params'
      });
    } else {
      let updateData = await AdminSchema.updateOne({ _id: req.user._id }, {
        $inc: {
          walletMoney: Number(req.body.amount)
        }
      });
      let data = {
        roleForm: 'admin',
        roleTO: 'null',
        from: req.user._id,
        amount: Number(req.body.amount),
        transferType: 'addToWalletTransfer',
        createdBy: req.user._id
      }
      await commonHelper.walletAccountLogs(data);
      if (updateData.nModified || updateData.ok) {
        return res.sendToEncode({
          status_code: 200,
          message: 'success',
          data: {}
        });
      }
    }
  },
  getLiveLocation: async function (req, res) {
    if (!req.query.vehicleId && req.query.vehicleId == '') {
      return res.sendToEncode({
        status: 400,
        message: 'undefined params'
      });
    } else {
      // get location of vehicle
      let findVehicleIsAssign = await VehicleSchema.aggreagte([
        {
          '$match': {
            'currentDriverAssignId': {
              '$ne': null
            },
            '_id': mongoose.Types.ObjectId(req.query.vehicleId)
          }
        }, {
          '$lookup': {
            'from': 'driver',
            'localField': 'currentDriverAssignId',
            'foreignField': '_id',
            'as': 'driverData'
          }
        }, {
          '$unwind': {
            'path': '$driverData',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$project': {
            'driverData.location': 1,
            'driverData.onlyPhoneNumber': 1,
            'driverData.countryCode': 1
          }
        }
      ]);
      if (findVehicleIsAssign.length > 0) {
        return res.sendToEncode({
          status: 200,
          message: 'list of data',
          data: findVehicleIsAssign[0]
        });
      } else {
        return res.sendToEncode({
          status: 400,
          message: 'no driver assigned '
        });
        // driver not assign 
      }
    }
  },
  walletNew: async function (req, res) {
    let walletData = await AdminSchema.findOne({
      _id: req.user._id
    }, 'walletMoney');
    if (walletData) {
      return res.sendToEncode({
        status: 200,
        message: 'list of data',
        data: walletData
      });
    } else {
      return res.sendToEncode({
        status: 400,
        message: 'no wallet found'
      });
      // driver not assign 
    }
  },
  getReferral: async function (req, res) {
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
    },
      {
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
    },
      {
        '$match': {
          'isVehicleAdded': true
        },
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
        'voCommission': 1,
        'totalTime': 1,
        'totalDistance': 1,
        'pickupAddress': 1,
        'destinationAddress': 1
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
    if (referralRide.length > 0) {
      return res.sendToEncode({
        status_code: 200,
        message: '',
        data: referralRide
      });
    } else {
      return res.sendToEncode({
        status: 400,
        message: 'SOMETHING_WENT_WRONG'
      });
    }
  },
  getDriverHistory: async function (req, res) {
    var columnName = req.query.columnName ? req.query.columnName : "_id";
    var orderBy = req.query.orderBy == "asc" ? 1 : -1;

    let data = await VehicleRequestSchema.aggregate([
      {
        '$match': {
          'status': 'approve',
          'vehicleOwnerId': req.user._id
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
        '$project': {
          'driverData.uniqueID': 1,
          'driverData.onlyPhoneNumber': 1,
          'driverData.countryCode': 1,
          'driverData.gender': 1,
          'createdAt': 1,
          'approvedDate': 1
        }
      }, {
        $sort: { [columnName]: orderBy },
      }, {
        $facet: {
          driverHistoryList: [
            {
              $skip: Number(req.query.skip) || 0,
            },
            {
              $limit: Number(req.query.limit) || 10,
            },
          ],
          driverHistoryTotalCount: [
            {
              $count: "filterCount",
            },
          ],
        }
      }
    ]);
    return res.sendToEncode({
      status_code: 200,
      message: 'vehicle History for Driver',
      data: data,
    });
  },
}
module.exports = _self;