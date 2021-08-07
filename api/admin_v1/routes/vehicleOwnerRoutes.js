var debug = require("debug")("x-code:v1:routes"),
  express = require("express"),
  router = express.Router(),
  isLoggedInPolicie = require("../policies/isLoggedIn.js"),
  isUserAuthenticatedPolicy = require("../policies/isUserAuthenticated.js"),
  AdminController = require("../controllers/admin"),
  dispacherController=require('../controllers/dispacherController'),
  dashBoardController = require('../controllers/dashBoardController'),
  voController= require('../controllers/voController');

var decodeReqPolicy = require("../policies/decodeRequest.js");
var encodeResPolicy = require("../policies/encodeResponse.js");
// var AESCrypt = rootRequire('services/aes');

router.get("/encode", function (req, res) {
  res.render("encode");
});

router.post("/encode", function (req, res) {
  var body = req.body;

  debug("ENCODE BREQ BODY :->", body);

  try {
    var json = eval("(" + body.data + ")");
    var enc = AESCrypt.encrypt(JSON.stringify(json));
  } catch (e) {
    var enc = "Invalid parameters";
  }
  res.send({
    encoded: enc,
  });
});

router.get("/decode", function (req, res) {
  res.render("decode");
});

router.post("/decode", function (req, res) {
  var body = req.body;

  debug("DECODE REQ BODY :->", body);

  try {
    var dec = AESCrypt.decrypt(JSON.stringify(body.data));
  } catch (e) {
    var dec = "Invalid parameters";
  }
  res.send(dec);
});

  // decode request data
  router.all(
    "/*",
    function (req, res, next) {
      res.sendToEncode = function (data) {
        req.resbody = data;
        
        next();
      };
      next();
    },
    decodeReqPolicy
  );

  router.all("/api/*", isUserAuthenticatedPolicy, isLoggedInPolicie);
  
  router.get('/api/dashboardData', voController.dashboardData);  
  router.get('/api/dashboardTableData', voController.getDashBoardTableData);
  router.get('/api/driverList', voController.driverList);
  router.get('/api/vehicleList', voController.listVehicles);
  router.post('/api/addVehicle', voController.addVehicle);
  router.get('/api/vehicleRequestList', voController.vehicleRequestList);
  router.post('/api/editVehicle', voController.editVehicle);
  router.post('/api/acceptRejectRequest', voController.acceptRejectRequest);
  router.get("/api/getVehicleById", voController.getVehicleById);
  router.get('/api/getAccountDetails',voController.getAccountDetails);
  router.post('/api/saveAccountDetails',voController.saveAccountDetails);  
  router.post('/api/sendFreeCarWarning',voController.sendFreeCarWarning);
  router.post('/api/confirmCarFree',voController.carFreeConfirm );
  router.post('/api/withdraw', voController.transferMoneyFromWallet);
  router.get('/api/walletNew', voController.walletNew);
  router.get('/api/getWithdraws',voController.getWithdrawsLogs );
  router.get('/api/getWithdrawsById',voController.getWithDrawsById );
  router.post('/api/addMoneyToWallet', voController.addMoneyToWallet);
  router.get('/api/getTransferLogs',voController.getMoneyTransferLog);
  router.get('/api/getLiveLocation', voController.getLiveLocation)
  router.get('/api/getReferral', voController.getReferral);    
  router.get('/api/getDriverHistory',voController.getDriverHistory);
  router.all("/*", encodeResPolicy);

// exports router
module.exports = router;