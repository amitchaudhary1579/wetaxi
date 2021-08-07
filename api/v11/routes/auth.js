var debug = require('debug')('x-code:v1:routes'),
  express = require('express'),
  router = express.Router(),
  isDriverLoggedInPolicy = require('../policies/isDriverLoggedIn.js'),
  isDriverAuthenticatedPolicy = require('../policies/isDriverAuthenticated.js'),
  isPassengerLoggedInPolicy = require('../policies/isPassengerLoggedIn.js'),
  isPassengerAuthenticatedPolicy = require('../policies/isPassengerAuthenticated.js'),
  DriverController = require('../controllers/driverController'),
  PassangerController = require('../controllers/passengerController'),
  GeneralController = require('../controllers/generalController');

/** languages */
var ENGLISH_MESSAGES = rootRequire('config/messages/en');

var decodeReqPolicy = require('../policies/decodeRequest.js');
var encodeResPolicy = require('../policies/encodeResponse.js');
// var AESCrypt = rootRequire('services/aes');

router.get('/encode', function (req, res) {
  res.render('encode');
});

router.post('/encode', function (req, res) {
  var body = req.body;

  debug('ENCODE BREQ BODY :->', body);

  try {
    var json = eval('(' + body.data + ')');
    var enc = AESCrypt.encrypt(JSON.stringify(json));
  } catch (e) {
    var enc = 'Invalid parameters';
  }
  res.send({
    encoded: enc
  });
});

router.get('/decode', function (req, res) {
  res.render('decode');
});

router.post('/decode', function (req, res) {
  var body = req.body;

  debug('DECODE REQ BODY :->', body);

  try {
    var dec = AESCrypt.decrypt(JSON.stringify(body.data));
  } catch (e) {
    var dec = 'Invalid parameters';
  }
  res.send(dec);
});

// decode request data
router.all(
  '/*',
  function (req, res, next) {
    res.sendToEncode = function (data) {
      if (req.headers.language == 'km') {
        data.message = COMBODIA_MESSAGES[data.message];
      } else if (req.headers.language == 'zh') {
        data.message = CHINESE_MESSAGES[data.message];
      } else {
        data.message = ENGLISH_MESSAGES[data.message];
      }
      req.resbody = data;
      next();
    };
    next();
  },
  decodeReqPolicy
);

// router.get('/auth/test', DriverController.test);
router.get('/auth/preLogin', GeneralController.preLogin);
router.get('/auth/getHelpCenterData', GeneralController.getHelpCenterData);
router.get('/auth/getAllVehicleTypes', GeneralController.getAllVehicleTypes);
router.get('/auth/getLanguages', GeneralController.getLanguages);
router.post('/auth/S3Bucket', GeneralController.s3Bucket);

/**
 * Drivers Account & Authentication APIs
 */
router.post('/auth/driver/checkNumber', DriverController.checkNumber);
router.post('/auth/driver/verify-otp', DriverController.verifyOTP)
router.post('/auth/driver/login', DriverController.login);
router.post('/auth/driver/signup', DriverController.add);
// router.post('/auth/driver/renewToken', DriverController.renewToken);
// router.post('/auth/driver/renewToken', function(err));


/**
 * Passenger Account & Authentication APIs
 */
router.post('/auth/passenger/checkNumber', PassangerController.checkNumber);
router.post('/auth/passenger/verify-otp', PassangerController.verifyOTP);
router.post('/auth/passenger/login', PassangerController.login);
router.post('/auth/passenger/signup', PassangerController.add);
router.post('/auth/passenger/addVendor', PassangerController.addVendor)
router.post('/auth/passenger/renewToken', PassangerController.renewToken);
router.post('/api/passenger/calculateTotalFare', PassangerController.calculateTotalFare);

// router.post('auth/checkNumberPassanger', PassangerController.checkNumber);

/**
 * Authentication Middleware (BEFORE)
 * Serve all apis before MIDDLE if they serve like /api/*
 */
router.get('/auth/testPush', async function(){
  
    //  push notification 
 var FCM = require('fcm-push');

var serverKey = 'AAAAfmScU8c:APA91bEHBI0NSiUCqh1Twwf1Zt8xH8AUw3Hf7NqvJCd7VUok6ULIrykWVdWe-ajZzhFAInQzNNo1ak95_dIx9_Go4GBVFyBl6uJoeNpbj6-FKg_vK-cGXlLMjfF4c7WsL2aAYxn5_nxt';
var fcm = new FCM(serverKey);

var message = {
    to: 'dKvnZGb-DrM:APA91bFjjdgarXXxZE51jakpd75M2CU6tY2w5b1N5ZhAyPLLAZz8nd_DSF8QsFM5XUzwcbp-nQYYSbgz0oY_AVn6o4d0SFuahnqN86z6juqnXYEMJv4GFV2_fSToD29xTsIZj1Zzfr9d', // required fill with device token or topics
    data: {
        your_custom_data_key: 'your_custom_data_value'
    },
    notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification'
    }
};
fcm.send(message, function(err, response){
  if (err) {
    
      console.log("Something has gone wrong!", err);
  } else {
      console.log("Successfully sent with response: ", response);
  }
});

});
router.all('/api/driver/*', isDriverAuthenticatedPolicy, isDriverLoggedInPolicy);
router.all('/api/passenger/*', isPassengerAuthenticatedPolicy, isPassengerLoggedInPolicy);

router.post('/api/passenger/test', PassangerController.test);

router.put('/api/driver/update', DriverController.edit);
router.get('/api/driver/getData', DriverController.detail);
router.get('/api/driver/getStatus', DriverController.getStatus);
router.get('/api/driver/getPlans', DriverController.getPlans);
router.post('/api/driver/getCreditData', DriverController.getCreditData);
router.post('/api/driver/getWithdraws', DriverController.getWithdraws);
router.post('/api/driver/getRewards', DriverController.getRewards);
router.put('/api/driver/updateRadius', DriverController.updateRadius);
router.put('/api/driver/updateStatus', DriverController.updateStatus);
router.post('/api/driver/sendRequestForVehicle', DriverController.sendRequestForVehicle); // test
router.get('/api/driver/listVehicles', DriverController.listVehicles);// test // done
router.get('/api/driver/vehicleIdData',DriverController.vehicleIdData); // test 
// router.post('/api/driver/acceptRejectRequest',DriverController.acceptRejectRequest); //done
router.get('/api/driver/vehicleRequestList', DriverController.vehicleRequestList); //test
router.get('/api/driver/myCars', DriverController.driverCarList); // test
router.post('/api/driver/deleteRequest',DriverController.deleteRequest); //test
// router.get('/api/driver/listOfRequest', DriverController.requestList); //test
router.post('/api/driver/logout', DriverController.logout);
router.get('/api/driver/getMyLanguage', DriverController.getMyLanguage);
router.get('/api/driver/myWallet', DriverController.myWallet);
router.get('/api/driver/myWalletNew', DriverController.myWalletNew);
router.get('/api/driver/accountDetails', DriverController.myAccountDetails);
router.post('/api/driver/saveAccountDetails', DriverController.saveAccountDetails);
router.post('/api/driver/addMoneyToWallet', DriverController.addMoneyToWallet);
// router.post('/api/driver/testPush', DriverController.testPush);
router.get('/api/driver/myDrivingEarnings', DriverController.myDrivingEarnings);
router.put('/api/driver/updateLanguage', DriverController.updateLanguage);
router.post('/api/driver/getEmergency', GeneralController.getEmergency);
router.post('/api/driver/getTransactionHistory', DriverController.getTransactionHistory);
router.post('/api/driver/getNotificationData', DriverController.getNotificationData);
router.get('/api/driver/inviteAndEarn', DriverController.inviteAndEarn);
router.post('/api/driver/getInviteAndEarnDetailsOfLevel', DriverController.getInviteAndEarnDetailsOfLevel);
router.post('/api/driver/earningFromReferral', DriverController.earningFromReferral);
router.post('/api/driver/withdraw', DriverController.transferMoneyFromWallet);
router.get('/api/driver/getWithdraws',DriverController.getWithdrawsLogs );
router.get('/api/driver/getMoneyTransferLog',DriverController.getMoneyTransferLog);
router.post('/api/driver/makeCall', DriverController.callRequest);
router.post('/api/driver/declineCall', DriverController.declineCall);

router.put('/api/passenger/update', PassangerController.edit);
router.get('/api/passenger/getData', PassangerController.detail);
router.post('/api/passenger/logout', PassangerController.logout);
router.get('/api/passenger/getMyLanguage', PassangerController.getMyLanguage);
router.get('/api/passenger/myWallet', PassangerController.myWallet);
router.get('/api/passenger/myWalletNew', PassangerController.myWalletNew);
router.get('/api/passenger/accountDetails', PassangerController.myAccountDetails);
router.post('/api/passenger/saveAccountDetails', PassangerController.saveAccountDetails);
// router.post('/api/passenger/getWithdraws', PassangerController.getWithdraws);
router.post('/api/passenger/getRewards', PassangerController.getRewards);
router.put('/api/passenger/updateLanguage', PassangerController.updateLanguage);
router.post('/api/passenger/getEmergency', GeneralController.getEmergency);
router.get('/api/passenger/getStatus', PassangerController.getStatus);
router.post('/api/passenger/getTransactionHistory', PassangerController.getTransactionHistory);
router.post('/api/passenger/getNotificationData', PassangerController.getNotificationData);
router.get('/api/passenger/inviteAndEarn', PassangerController.inviteAndEarn);
router.post('/api/passenger/getInviteAndEarnDetailsOfLevel', PassangerController.getInviteAndEarnDetailsOfLevel);
router.post('/api/passenger/earningFromReferral', PassangerController.earningFromReferral);
router.post('/api/passenger/withdraw', PassangerController.transferMoneyFromWallet);
router.get('/api/passenger/getWithdraws',PassangerController.getWithdrawsLogs );
router.get('/api/passenger/getMoneyTransferLog',PassangerController.getMoneyTransferLog);
router.post('/api/passenger/addMoneyToWallet',PassangerController.addMoneyToWallet);
router.post('/api/passenger/savePlace', PassangerController.savePlaces);
router.get('/api/passenger/recentPlace', PassangerController.recentPlaces);
router.post('/api/passenger/updateWorkAndHome', PassangerController.updateWorkAndHome);
router.get('/api/passenger/getHomeWorkPlace', PassangerController.getHomeWorkPlace);
router.post('/api/passenger/makeCall', PassangerController.callRequest);
router.post('/api/passenger/declineCall', PassangerController.declineCall);


// router.get('/auth/commercialPlanCrone', DriverController.commercialPlanCrone);

/**
 * Other APIs Routes (MIDDLE)
 */
// router.get('/auth/test', UserController.test);

/**
 * Responses Middleware (AFTER)
 * Serve all apis after MIDDLE if they serve like /api/*
 */
router.all('/*', encodeResPolicy);

// exports router
module.exports = router;
