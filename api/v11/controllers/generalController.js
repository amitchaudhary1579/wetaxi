const debug = require('debug')('x-code:v1:controllers:driver'),
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
  VehicleTypeSchema = require('../models/vehicleType'),
  VehicleColorSchema = require('../models/vehicleColor'),
  LanguageSchema = require('../models/language'),
  HelpCenterSchema = require('../models/helpCenter'),
  CountiesSchema = require('../models/countries'),
  EmergencySchema = require('../models/emergency'),
  ReasonSchema = require('../models/reason'),
  SystemSettingsSchema = require('../models/systemSettings'),
  // Custom services/helpers
  DS = rootRequire('services/date'),
  ED = rootRequire('services/encry_decry'),
  CONSTANTS = rootRequire('config/constant'),
  //Cron Scheduler
  schedule = require('node-schedule'),
  //Push notification
  pn = require('../../../support/push-notifications/pn'),
  //Supports
  Uploader = rootRequire('support/uploader'),
  Mailer = rootRequire('support/mailer'); // date services

//s3 bucket
const AWS = require('aws-sdk');
// Enter copied or downloaded access ID and secret key here
const ID = 'AKIAIF5ZYKCC4KX2U6TA';
const SECRET = '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';
// The name of the bucket that you have created
const BUCKET_NAME = 'gogo-taxi-bucket';
const fs = require('fs');

let _self = {
  /************************************************
   * ::: General APIs :::
   * all apis related to mostly users are place here
   *************************************************/
  // preLogin

  // fetch all local detay
  preLogin: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          var responseData = {};
          responseData.countryFlagUrl = CONSTANTS.COUNTRY_FLAGS_URL;
          // resopnseData.countries = CONSTANTS.COUNTRIES;
          CountiesSchema.find({}, function (err, countries) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (countries && countries.length) {
              responseData.countries = countries;
              nextCall(null, responseData);
            } else {
              responseData.countries = [];
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          VehicleColorSchema.find({}, function (err, c) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (c && c.length) {
              responseData.colors = c;
              nextCall(null, responseData);
            } else {
              responseData.colors = [];
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          responseData.vehicleTypeUrl = CONSTANTS.VEHICLE_TYPE_URL;
          VehicleTypeSchema.find({}, function (err, v) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (v && v.length) {
              responseData.vehicleType = v;
              nextCall(null, responseData);
            } else {
              responseData.vehicleType = [];
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          LanguageSchema.find({}, function (err, languages) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            responseData.languages = languages;
            nextCall(null, responseData);
          });
        },
        function (responseData, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSettingData[0]) {
              responseData.driverVersionUpdate = getSettingData[0].driverVersionUpdate;
              responseData.passengerVersionUpdate = getSettingData[0].passengerVersionUpdate;
              nextCall(null, responseData);
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
   * Get Help center data
   * ------------------------------------------------ */
  getHelpCenterData: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          var responseData = {};
          responseData.fbUrl = '';
          HelpCenterSchema.find(
            {},
            {
              _id: 1,
              phoneNumber: 1,
              email: 1,
              createdAt: 1,
              updatedAt: 1
            }
          ).exec(function (err, helpData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            } else {
              responseData.helpCenters = helpData || {};
              nextCall(null, responseData);
            }
          });
        },
        function (responseData, nextCall) {
          SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            if (getSettingData[0]) {
              responseData.fbUrl = getSettingData[0].fbUrl;
              nextCall(null, responseData);
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

  getAllVehicleTypes: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let resopnseData = {};
          resopnseData.vehicleTypeUrl = CONSTANTS.VEHICLE_TYPE_URL;
          VehicleTypeSchema.find({}, function (err, v) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            resopnseData.vehicleType = v;
            nextCall(null, resopnseData);
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

  getLanguages: function (req, res) {
    async.waterfall(
      [
        function (nextCall) {
          let resopnseData = {};
          resopnseData.countryFlagUrl = CONSTANTS.COUNTRY_FLAGS_URL;
          LanguageSchema.find({}, function (err, v) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            resopnseData.languages = v;
            nextCall(null, resopnseData);
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
   * Emergency
   * ------------------------------------------------ */
  getEmergency: function (req, res) {
    async.waterfall(
      [
        // Check required params
        function (nextCall) {
          req.checkBody('latitude', 'LATITUDE_REQUIRED').notEmpty();
          req.checkBody('longitude', 'LONGITUDE_REQUIRED').notEmpty();

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
          EmergencySchema.aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [Number(body.longitude), Number(body.latitude)] },
                distanceField: 'distance',
                spherical: true,
                distanceMultiplier: 1 / 1609.344, // convert meters into miles
                num: 1
              }
            }
          ]).exec(function (err, nearByEmergencyData) {
            if (err) {
              return nextCall({
                message: 'SOMETHING_WENT_WRONG'
              });
            }
            nextCall(null, nearByEmergencyData[0]);
          });
        }
      ],
      function (err, emergencyData) {
        if (err) {
          return res.sendToEncode({
            status: err.code ? err.code : 400,
            message: (err && err.message) || 'SOMETHING_WENT_WRONG'
          });
        }
        return res.sendToEncode({
          status_code: 200,
          message: '',
          data: emergencyData
        });
      }
    );
  },

  s3Bucket: function (req, res) {
    const s3 = new AWS.S3({
      accessKeyId: ID,
      secretAccessKey: SECRET
    });
    var params = { Bucket: BUCKET_NAME, Key: req.body.imageId };
    s3.getObject(params, function (err, data) {
      console.log(data);
      // res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      // res.write(data.Body, 'binary');
      // res.end(null, 'binary');
    });
    // async.waterfall(
    //   [
    //     function(nextCall) {
    //       Uploader.getFormFields(req, nextCall);
    //     },
    //     /** check required parameters */
    //     function(fields, files, nextCall) {
    //       // console.log('files::::::::::', files);
    //       console.log('SAN:::::::::::::::::::::::::::', typeof files.hello.path);
    //       let fileName = files.hello.path;
    //       const fileContent = fs.readFileSync(fileName);
    //       // Setting up S3 upload parameters
    //       const params = {
    //         Bucket: BUCKET_NAME,
    //         Key: files.hello.name, // File name you want to save as in S3
    //         Body: fileContent
    //       };
    //       const s3 = new AWS.S3({
    //         accessKeyId: ID,
    //         secretAccessKey: SECRET
    //       });
    //       // Uploading files to the bucket
    //       s3.upload(params, function(err, data) {
    //         if (err) {
    //           throw err;
    //         }
    //         console.log(`File uploaded successfully. ${data.Location}`);
    //       });
    //     }
    //   ],
    //   function(err, nextCall) {
    //     if (err) {
    //       return res.sendToEncode({
    //         status_code: err.code ? err.code : 400,
    //         message: (err && err.message) || 'SOMETHING_WENT_WRONG',
    //         data: err
    //       });
    //     }
    //     return res.sendToEncode({
    //       status_code: 200,
    //       message: 'SUCCESS',
    //       data: nextCall
    //     });
    //   }
    // );
    //   const s3 = new AWS.S3({
    //     accessKeyId: ID,
    //     secretAccessKey: SECRET
    //   });
    //   const params = {
    //     Bucket: BUCKET_NAME
    //     // CreateBucketConfiguration: {
    //     //   // Set your region here
    //     //   LocationConstraint: 'eu-west-1'
    //     // }
    //   };
    //   s3.deleteBucket(params, function(err, data) {
    //     if (err) console.log('ERROR::::::::', err);
    //     else console.log('Bucket Created Successfully:::::::::::', data);
    //   });
  }
};

module.exports = _self;
