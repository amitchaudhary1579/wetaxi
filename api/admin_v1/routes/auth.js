var debug = require("debug")("x-code:v1:routes"),
  express = require("express"),
  router = express.Router(),
  isLoggedInPolicie = require("../policies/isLoggedIn.js"),
  isUserAuthenticatedPolicy = require("../policies/isUserAuthenticated.js"),
  AdminController = require("../controllers/admin"),
  dispacherController = require('../controllers/dispacherController'),
  dashBoardController = require('../controllers/dashBoardController'),
  voController = require('../controllers/voController');
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
    console.log(req.query);
    res.sendToEncode = function (data) {

      req.resbody = data;
      next();
    };
    next();
  },
  decodeReqPolicy
);

router.get("/auth/test", AdminController.test);

router.post("/auth/decrypt", AdminController.decrypt);

// router.post("/auth/saveUser", AdminController.saveUser);
router.post("/auth/login", AdminController.login);
router.post("/auth/sendNotification", AdminController.sendNotification);
router.post('/auth/forgotPassword', voController.forgotPassword);
router.post('/auth/checkOtp', voController.checkOtp);
router.post('/auth/resetPassword', voController.resetPassword);
/** CMS Module */
router.get("/auth/getCMSData", AdminController.getCMSData);

/**
 * Authentication Middleware (BEFORE)
 * Serve all apis before MIDDLE if they serve like /api/*
 */
router.all("/api/*", isUserAuthenticatedPolicy, isLoggedInPolicie);

/** Passenger Module */
router.post("/api/changePassword", AdminController.changePassword);
router.post("/api/getAllCountries", AdminController.getAllCountries);
router.post("/api/ListOfAllPassengers", AdminController.ListOfAllPassengers);
router.get(
  "/api/ListOfAllPassengersPDF",
  AdminController.ListOfAllPassengersPDF
);
router.get("/api/getCallCenterData", AdminController.getCallCenterData);

router.get(
  "/api/ListOfAllPassengersExcel",
  AdminController.ListOfAllPassengersExcel
);

router.post("/api/addPassenger", AdminController.addPassenger);
router.post("/api/getPassengerDetails", AdminController.getPassengerDetails);
router.post(
  "/api/blockUnblockPassenger",
  AdminController.blockUnblockPassenger
);
router.post("/api/editPassenger", AdminController.editPassenger);
router.post("/api/deletePassenger", AdminController.deletePassenger);

/** Driver Module */
router.post("/api/getAllVehicleTypes", AdminController.getAllVehicleTypes);
router.post("/api/ListOfAllDrivers", AdminController.ListOfAllDrivers);
router.post("/api/addDriver", AdminController.addDriver);
router.post("/api/getDriverDetails", AdminController.getDriverDetails);
router.post("/api/blockUnblockDriver", AdminController.blockUnblockDriver);
router.post("/api/verifyUnverifyDriver", AdminController.verifyUnverifyDriver);
router.post("/api/editDriver", AdminController.editDriver);
router.post("/api/deleteDriver", AdminController.deleteDriver);
router.post("/api/updateBillingPlan", AdminController.updateBillingPlan);

/** Vehicle owner module */
router.post("/api/addVehicleOwner", voController.addVo);
router.get("/api/vehicleOwnerDetails", voController.getVoById);
router.post("/api/editVehicleOwner", voController.editVo);
// router.post("/api/deleteVehicleOwner", voController.deleteVo);
router.get('/api/vehicleOwnerList', voController.getVoList);
// router.get('/api/deActiveVehicle', voController.deActiveVehicle);
//  vehicle module//
router.post("/api/addVehicle", voController.addVehicle);
router.get("/api/vehicleList", voController.listVehicles);
router.get("/api/getVehicleById", voController.getVehicleById);
router.post("/api/editVehicle", voController.editVehicle);
/** Promoter Module */
router.get("/api/listPromoter", voController.listPromoter);
router.post("/api/deactivatePromoter", voController.deactivateUser);
/** Dashboard Module */
router.get("/api/getDashboardData", dashBoardController.getDashboardData); //done
router.get("/api/getDashboardMapData", dashBoardController.getDashboardMapData); //done
router.get(
  "/api/getTopTenDriverAndPassengerData",
  dashBoardController.getTopTenDriverAndPassengerData
);
router.get("/api/getIncomeRelatedData", dashBoardController.getIncomeRelatedData);
router.get(
  "/api/getDashboardProvinceData",
  dashBoardController.getDashboardProvinceData
); // done
router.get(
  "/api/getDashboardCustomerData",
  dashBoardController.getDashboardCustomerData
); //done
router.get(
  "/api/getDashboardDriversData",
  dashBoardController.getDashboardDriversData
); //done
router.get("/api/getDashboardTripsData", dashBoardController.getDashboardTripsData); //done
router.get(
  "/api/getDashboardNetSalesData",
  dashBoardController.getDashboardNetSalesData
); //done
router.get(
  "/api/getDashboardSaleRevenueData",
  dashBoardController.getDashboardSaleRevenueData
); //done

router.get(
  "/api/getDashboardCancleReasonData",
  dashBoardController.getDashboardCancleReasonData
); //done

router.get(
  "/api/getDashboardCancleReasonWeeklyData",
  dashBoardController.getDashboardCancleReasonWeeklyData
); //done
router.get(
  "/api/getDashboardMonthlyLiveTripData",
  dashBoardController.getDashboardMonthlyLiveTripData
); //done

router.get(
  "/api/getDashboardWeeklyLiveTripData",
  dashBoardController.getDashboardWeeklyLiveTripData
); //done

router.get(
  "/api/getDashboardDailyLiveDrivers",
  dashBoardController.getDashboardDailyLiveDrivers
); //done
// dashboard controller done 
// dispacter controller start
router.get(
  "/api/getAllReceivedBookingsDispacter",
  dispacherController.getAllReceivedBookingsDispacter
); // done

router.get(
  "/api/getMonthlyReceivedBookingsCount",
  dispacherController.getMonthlyReceivedBookingsCount
);

router.get(
  "/api/getWeeklyReceivedBookingsCount",
  dispacherController.getWeeklyReceivedBookingsCount
);

router.get(
  "/api/getAllAcceptedBookingdDispacter",
  dispacherController.getAllAcceptedBookingdDispacter
); //done

router.get(
  "/api/getMonthlyAcceptedBookingsCount",
  dispacherController.getMonthlyAcceptedBookingsCount
); //done

router.get(
  "/api/getWeeklyAcceptedBookingsCount",
  dispacherController.getWeeklyAcceptedBookingsCount
); //done

router.get("/api/getAllOnRideDispacter", dispacherController.getAllOnRideDispacter); //done

router.get(
  "/api/getMonthlyAcceptedOnRideDispacterCount",
  dispacherController.getMonthlyAcceptedOnRideDispacterCount
); //done 

router.get(
  "/api/getWeeklyAcceptedOnRideDispacterCount",
  dispacherController.getWeeklyAcceptedOnRideDispacterCount
);// done

router.get(
  "/api/getAllSuccessfulTripsDispacter",
  dispacherController.getAllSuccessfulTripsDispacter
);// done

router.get(
  "/api/getMonthlySuccessfulTripsCount",
  dispacherController.getMonthlySuccessfulTripsCount
);

router.get(
  "/api/getWeeklySuccessfulTripsCount",
  dispacherController.getWeeklySuccessfulTripsCount
);

router.get(
  "/api/getAllCancleBookingsDispacter",
  dispacherController.getAllCancleBookingsDispacter
);// done

router.get(
  "/api/getMonthlyCancleBookingsCount",
  dispacherController.getMonthlyCancleBookingsCount
);

router.get(
  "/api/getweeklyCancleBookingsCount",
  dispacherController.getweeklyCancleBookingsCount
);

// Promocode API Start

router.get("/api/getPromotionList", AdminController.getPromotionList);
router.post("/api/editPromotionCode", AdminController.editPromotionCode);
router.post("/api/savePromoCode", AdminController.savePromoCode);
// router.get("/api/generatePromoCode", AdminController.generatePromoCode);
router.delete("/api/deletePromotionCode", AdminController.deletePromotionCode);
router.get(
  "/api/getPromoCodeDetailsById",
  AdminController.getPromoCodeDetailsById
);

// Promocode API End

// Pages API Start
router.get("/api/getAllPages", AdminController.getAllPages);
router.get("/api/getAllPositionNew", AdminController.getAllPosition1);
// router.get("/api/getAllPages2", AdminController.getAllPages1);
router.get(
  "/api/getPagesAccessByUserId",
  AdminController.getPagesAccessByUserId
);
router.get("/api/getTripsByDriverId", AdminController.getTripsByDriverId);
router.get("/api/getTripsByDriverIdPDF", AdminController.getTripsByDriverIdPDF);
router.get(
  "/api/getTripsByDriverIdExcel",
  AdminController.getTripsByDriverIdExcel
);
router.get("/api/getTripsByPassengerId", AdminController.getTripsByPassengerId);
router.get(
  "/api/getTripsByPassengerIdPDF",
  AdminController.getTripsByPassengerIdPDF
);
router.get(
  "/api/getTripsByPassengerIdExcel",
  AdminController.getTripsByPassengerIdExcel
);
router.get(
  "/api/getPassengerTransactionDetailByTripId",
  AdminController.getPassengerTransactionDetailByTripId
);
// Pages API end

// User API END
router.post("/api/changeDriverStatus", AdminController.changeDriverStatus);

// Driver and passenger API Start
router.get("/api/getAllDriversLocation", AdminController.getAllDriversLocation);
router.get(
  "/api/getAllPassengersLocation",
  AdminController.getAllPassengersLocation
);
router.post(
  "/api/getAllPassengersLocationPOST",
  AdminController.getAllPassengersLocationPOST
);
router.get("/api/getDriverLocationById", AdminController.getDriverLocationById);
router.get(
  "/api/getPassengersLocationById",
  AdminController.getPassengersLocationById
);
router.get(
  "/api/getDispacterDetailsById",
  dispacherController.getDispacterDetailsById
); //done
// Driver and passenger API End

/** Help Center Module */
router.post("/api/listAllHelpCenters", AdminController.ListOfAllHelpCenters);
router.post("/api/getHelpCenterDetails", AdminController.getHelpCenterDetails);
router.post("/api/editHelpCenter", AdminController.editHelpCenter);
router.post("/api/addHelpCenter", AdminController.addHelpCenter);
router.post("/api/deleteHelpCenter", AdminController.deleteHelpCenter);

// emergency module 
router.post("/api/ListOfAllEmergencies", AdminController.ListOfAllEmergencies);
router.post("/api/addEmergency", AdminController.addEmergency);
router.post("/api/getEmergencyDetails", AdminController.getEmergencyDetails);
router.post("/api/editEmergency", AdminController.editEmergency);
router.post("/api/deleteEmergency", AdminController.deleteEmergency);

// Recycle API start
router.get("/api/getAllRecycleBinList", AdminController.getAllRecycleBinList);
router.get("/api/recoverRecycle", AdminController.recoverRecycle);
router.post(
  "/api/recoverRecycleMultiple",
  AdminController.recoverRecycleMultiple
);
router.delete("/api/deleteRecycle", AdminController.deleteRecycle);
router.post(
  "/api/deleteRecycleMultiple",
  AdminController.deleteRecycleMultiple
);
// Recycle API end

// PDF, excel and csv api start
router.get(
  "/api/getAllReceivedBookingsDispacterExcel",
  AdminController.getAllReceivedBookingsDispacterExcel
); //done
router.get(
  "/api/getAllAcceptedBookingdDispacterExcel",
  AdminController.getAllAcceptedBookingdDispacterExcel
);// done
router.get(
  "/api/getAllOnRideDispacterExcel",
  AdminController.getAllOnRideDispacterExcel
);//done
router.get(
  "/api/getAllSuccessfulTripsDispacterExcel",
  AdminController.getAllSuccessfulTripsDispacterExcel
);// done
router.get(
  "/api/getAllCancleBookingsDispacterExcel",
  AdminController.getAllCancleBookingsDispacterExcel
); //done
router.get("/api/getPromotionListExcel", AdminController.getPromotionListExcel);
router.get("/api/getAllUserGroupsExcel", AdminController.getAllUserGroupsExcel);
router.get("/api/getAllUsersExcel", AdminController.getAllUsersExcel);
router.get(
  "/api/getAllDriversLocationExcel",
  AdminController.getAllDriversLocationExcel
);
router.get(
  "/api/getAllPassengersLocationExcel",
  AdminController.getAllPassengersLocationExcel
);

router.get(
  "/api/getAllBillingPlansExcel",
  AdminController.getAllBillingPlansExcel
);

router.get("/api/getAllDriverPDF", AdminController.getAllDriverPDF);
router.get("/api/getAllDriverExcel", AdminController.getAllDriverExcel);
router.get("/api/getAllBillingPlansPDF", AdminController.getAllBillingPlansPDF);

router.get(
  "/api/getAllReceivedBookingsDispacterPDF",
  AdminController.getAllReceivedBookingsDispacterPDF
); //done

router.get(
  "/api/getAllAcceptedBookingdDispacterPDF",
  AdminController.getAllAcceptedBookingdDispacterPDF
); //done

router.get(
  "/api/getAllOnRideDispacterPDF",
  AdminController.getAllOnRideDispacterPDF
); //done

router.get(
  "/api/getAllSuccessfulTripsDispacterPDF",
  AdminController.getAllSuccessfulTripsDispacterPDF
); //done

router.get(
  "/api/getAllCancleBookingsDispacterPDF",
  AdminController.getAllCancleBookingsDispacterPDF
); //done

router.get("/api/getPromotionListPDF", AdminController.getPromotionListPDF);

router.get("/api/getAllUserGroupsPDF", AdminController.getAllUserGroupsPDF);

router.get("/api/getAllUsersPDF", AdminController.getAllUsersPDF);

router.get(
  "/api/getAllDriversLocationPDF",
  AdminController.getAllDriversLocationPDF
);

router.get(
  "/api/getAllPassengersLocationPDF",
  AdminController.getAllPassengersLocationPDF
);

router.post("/api/saveBillingPlan", AdminController.saveBillingPlan);
router.delete("/api/deleteBillingPlan", AdminController.deleteBillingPlan);

router.post("/api/saveReward", AdminController.saveReward);

router.get("/api/getAllActionLog", AdminController.getAllActionLog);
router.get("/api/getAllActionLogPDF", AdminController.getAllActionLogPDF);
router.get("/api/getAllActionLogExcel", AdminController.getAllActionLogExcel);
router.get("/api/getAllActionLogCSV", AdminController.getAllActionLogCSV);
router.get(
  "/api/getAllActionLogByUserId",
  AdminController.getAllActionLogByUserId
);
router.get(
  "/api/getAllActionLogByUserIdExcel",
  AdminController.getAllActionLogByUserIdExcel
);
router.get(
  "/api/getAllActionLogByUserIdPDF",
  AdminController.getAllActionLogByUserIdPDF
);

router.get("/api/getAllVehicle", AdminController.getAllVehicle);
router.get("/api/getAllVehiclePDF", AdminController.getAllVehiclePDF);
router.get("/api/getAllVehicleExcel", AdminController.getAllVehicleExcel);

// pdf , excel andcsv api end
// router.get('/api/setDriverEarningFromRide', AdminController.setDriverEarningFromRide);
// router.get('/api/setPassengerEarningFromRide', AdminController.setPassengerEarningFromRide);
// router.get('/api/setDrivertotalInvited', AdminController.setDrivertotalInvited);
// router.get('/api/setPassengertotalInvited', AdminController.setPassengertotalInvited);

/** Vehicle Type Module */
router.post("/api/listAllVehicleTypes", AdminController.ListOfAllVehicles);
router.post("/api/getVehicleTypeById", AdminController.getVehicleTypeDetails);
router.post("/api/addVehicleType", AdminController.addVehicleType);
router.put("/api/editVehicleType", AdminController.editVehicleType);
router.delete("/api/deleteVehicleType", AdminController.deleteVehicleType);
router.post(
  "/api/activeInactiveVehicleType",
  AdminController.activeInactiveVehicleType
);

/** Billing plans Module */
router.post("/api/listAllBillingPlans", AdminController.listAllBillingPlans);
router.post(
  "/api/getBillingPlanDetails",
  AdminController.getBillingPlanDetails
);
router.post("/api/editBillingPlan", AdminController.editBillingPlan);

/** Operator Module */

router.post("/api/changePasswordStatus", AdminController.changePasswordStatus);
// router.post("/api/listAllOperators", AdminController.listAllOperators);
// router.post("/api/addOperator", AdminController.addOperator);
// router.post("/api/getOperatorDetails", AdminController.getOperatorDetails);
// router.post("/api/editOperator", AdminController.editOperator);
// router.post(
//   "/api/activeInactiveOperator",
//   AdminController.activeInactiveOperator
// );
// router.post("/api/deleteOperator", AdminController.deleteOperator);

/** Credit Module */
router.post("/api/listAllCredits", AdminController.listAllCredits);
router.post("/api/getDriverList", AdminController.getDriverList);
router.post("/api/addCredit", AdminController.addCredit);
router.post(
  "/api/getBillingPlanWithdraw",
  AdminController.getBillingPlanWithdraw
);

/** Emergency Module */
// router.post("/api/ListOfAllEmergencies", AdminController.ListOfAllEmergencies);
// router.post("/api/addEmergency", AdminController.addEmergency);
// router.post("/api/getEmergencyDetails", AdminController.getEmergencyDetails);
// router.post("/api/editEmergency", AdminController.editEmergency);
// router.post("/api/deleteEmergency", AdminController.deleteEmergency);

/** Rewards Module */
router.post("/api/listAllRewards", AdminController.ListAllRewards);
router.post("/api/addReward", AdminController.addReward);
router.post("/api/receiveReward", AdminController.receiveReward);
router.post("/api/listDriverReward", AdminController.listDriverReward);
router.post("/api/listPassengerReward", AdminController.listPassengerReward);

/** Ride History Module */
router.post("/api/listAllRideHistory", AdminController.ListAllRideHistory);
router.post("/api/getRideDetails", AdminController.getRideDetails);
router.post("/api/cancelRide", AdminController.cancelRide);

/** Referral Module Driver */
router.post(
  "/api/listAllDriverReferral",
  AdminController.listAllDriverReferral
);
router.post(
  "/api/getDriverReferralDetails",
  AdminController.getDriverReferralDetails
);
router.post(
  "/api/listDriverReferralByLevel",
  AdminController.listDriverReferralByLevel
);

/** Referral Module Passenger */
router.post(
  "/api/listAllPassengerReferral",
  AdminController.listAllPassengerReferral
);
router.post(
  "/api/getPassengerReferralDetails",
  AdminController.getPassengerReferralDetails
);
router.post(
  "/api/listPassengerReferralByLevel",
  AdminController.listPassengerReferralByLevel
);

/** Withdraw Module */
router.post(
  "/api/getDriverReferralEarning",
  AdminController.getDriverReferralEarning
);
router.post(
  "/api/driverRefEarningWithdraw",
  AdminController.driverRefEarningWithdraw
);
router.post(
  "/api/driverRefEarWithdrawAll",
  AdminController.driverRefEarWithdrawAll
);
router.post(
  "/api/getPassengerReferralEarning",
  AdminController.getPassengerReferralEarning
);
router.post(
  "/api/passengerRefEarningWithdraw",
  AdminController.passengerRefEarningWithdraw
);
router.post(
  "/api/passengerRefEarWithdrawAll",
  AdminController.passengerRefEarWithdrawAll
);

/** Setting Module */
router.post("/api/getSystemSettings", AdminController.getSystemSettings);
router.post("/api/updateAdminFee", AdminController.updateAdminFee);
router.post(
  "/api/sendNotificationToDriver",
  AdminController.sendNotificationToDriver
);
router.post(
  "/api/sendNotificationToPassenger",
  AdminController.sendNotificationToPassenger
);
router.post(
  "/api/updateDriverMinimumBalance",
  AdminController.updateDriverMinimumBalance
);
router.post("/api/driverVersionUpdate", AdminController.driverVersionUpdate);
router.post(
  "/api/passengerVersionUpdate",
  AdminController.passengerVersionUpdate
);
router.post("/api/updatefbUrl", AdminController.updatefbUrl);

/** CMS Module */
router.post(
  "/api/updatePrivacyPolicyData",
  AdminController.updatePrivacyPolicyData
);
router.post("/api/updateCallCenterData", AdminController.updateCallCenterData);
router.post(
  "/api/updateTermAndConditionData",
  AdminController.updateTermAndConditionData
);

router.get(
  "/api/getCallCenterDataDetails",
  AdminController.getCallCenterDataDetails
);
/** Action Log Module */
router.post("/api/ListOfAllActionLog", AdminController.ListOfAllActionLog);

/** Notification Log Module */
router.post(
  "/api/ListOfAllNotificationLogs",
  AdminController.ListOfAllNotificationLogs
);
router.post(
  "/api/sendNotificationFromNotificationLogs",
  AdminController.sendNotificationFromNotificationLogs
);
router.post(
  "/api/getNotificationLogsUserList",
  AdminController.getNotificationLogsUserList
);

/** new notification module created by arpit patel */
router.post("/api/createNotification", AdminController.createNotification);

router.get("/api/getAllNotification", AdminController.getAllNotificationList);
router.get(
  "/api/getAllNotificationListPDF",
  AdminController.getAllNotificationListPDF
);
router.get(
  "/api/getNotificationDetails",
  AdminController.getNotificationDetails
);
router.post("/api/updateNotification", AdminController.updateNotification);
router.post("/api/updateReward", AdminController.updateReward);

router.get(
  "/api/passengerListFromNotification",
  AdminController.getPassengerListFromNotification
);
router.get(
  "/api/driverListFromNotification",
  AdminController.getDriverListFromNotification
);
router.post(
  "/api/sendNotificationToDriverList",
  AdminController.sendNotificationToDriverList
);
router.post(
  "/api/sendNotificationToPassengerList",
  AdminController.sendNotificationToPassengerList
);

/** end of notification module created by arpit patel */

router.post("/api/createReward", AdminController.createReward);
router.get("/api/getAllRewardList", AdminController.getAllRewardList);
router.get("/api/getAllRewardListPDF", AdminController.getAllRewardListPDF);
router.get("/api/getRewardDetails", AdminController.getRewardDetails);

router.get(
  "/api/getPassengerListFromReward",
  AdminController.getPassengerListFromReward
);
router.get(
  "/api/getDriverListFromReward",
  AdminController.getDriverListFromReward
);
router.post(
  "/api/sendRewardToDriverList",
  AdminController.sendRewardToDriverList
);
router.post(
  "/api/sendRewardToPassengerList",
  AdminController.sendRewardToPassengerList
);

/**
 * Other APIs Routes (MIDDLE)
 */
// router.get('/auth/test', UserController.test);

/**
 * Responses Middleware (AFTER)
 * Serve all apis after MIDDLE if they serve like /api/*
 */
router.all("/*", encodeResPolicy);

// exports router
module.exports = router;
