var debug = require("debug")("x-code:v1:routes"),
  express = require("express"),
  router = express.Router(),
  isLoggedInPolicie = require("../policies/isLoggedIn.js"),
  isUserAuthenticatedPolicy = require("../policies/isUserAuthenticated.js"),
  AdminController = require("../controllers/admin"),
  dispacherController=require('../controllers/dispacherController'),
  dashBoardController = require('../controllers/dashBoardController'),
  promoterController = require('../controllers/promoterController'),
  voController= require('../controllers/voController');
var decodeReqPolicy = require("../policies/decodeRequest.js");
var encodeResPolicy = require("../policies/encodeResponse.js");
// var AESCrypt = rootRequire('services/aes');

router.get("/encode", function (req, res) {
  res.render("encode");
});


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
      console.log(req.query);
      res.sendToEncode = function (data) {
  
        req.resbody = data;
        next();
      };
      next();
    },
    decodeReqPolicy
  );

  router.all("/api/*", isUserAuthenticatedPolicy, isLoggedInPolicie);
  router.get('/api/getDashboard', )  
  router.post('/api/addDriver', AdminController.addDriver);
  router.post('/api/driverList',AdminController.ListOfAllDrivers);
  router.post('/api/editDriver', AdminController.editDriver);
  router.post("/api/getDriverDetails", AdminController.getDriverDetails);
  router.post("/api/verifyUnverifyDriver", AdminController.verifyUnverifyDriver);
  router.post("/api/blockUnblockDriver", AdminController.blockUnblockDriver);
  router.post("/api/addVehicleOwner", voController.addVo);
  router.get("/api/vehicleOwnerDetails", voController.getVoById);
  router.post("/api/editVehicleOwner", voController.editVo);
  router.get('/api/vehicleOwnerList', voController.getVoList);
  router.get('/api/getAccountDetails',voController.getAccountDetails);
  router.post('/api/saveAccountDetails',voController.saveAccountDetails);
  router.post('/api/withdraw', voController.transferMoneyFromWallet);
  router.get('/api/getWithdraws',voController.getWithdrawsLogs );
  router.get('/api/getDashboardDriversData', dashBoardController.getDashboardDriversData);  
  router.get('/api/getDashboardData', promoterController.getDashboardData);  
  router.get('/api/walletNew', voController.walletNew);
  router.get('/api/getReferral', promoterController.getReferral);
  // router.get('/api/getWithdrawsById',voController.getWithDrawsById );
  router.all("/*", encodeResPolicy);

// exports router
module.exports = router;

