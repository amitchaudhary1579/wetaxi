/**
 * Created by Parag Soni on 06/05/2019.
 */
"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require("../db/connection");
var ED = rootRequire("services/encry_decry");
var DS = rootRequire("services/date"); // date services

// var vehicle = new Schema({
//   typeId: { type: ObjectId, ref: "vehicle_type" },
//   year: { type: String },
//   seats: { type: String },
//   color: { type: String },
//   model: { type: String },
//   platNumber: { type: String },
//   isAcAvailable: { type: Boolean, default: false },
//   isSmokingAllowed: { type: Boolean, default: false },
//   vehiclePhotos: { type: Array, default: [] },
//   vehicleIdPhotos: { type: Array, default: [] },
//   plateNoPhotos: { type: Array, default: [] },
// });
var schema = new Schema(
  {
    uniqueID: { type: String, unique: true, required: true },
    name: { type: String, trim: true, default: "", sparse: true },
    email: { type: String, trim: true, default: "", index: true },
    dob: { type: String, default: "", required: true },
    gender: { type: String, trim: true, enum: ['male','female'], required: true },
    phoneNumber: { type: String, trim: true, min: 10, max: 15, required: true },
    countryCode: { type: String, trim: true, required: true },
    onlyPhoneNumber: { type: String, trim: true, required: true },
    profilePhoto: { type: String, default: "" },
    idPhotos: { type: Array, default: [] },
    
    // vehicle: vehicle,
    isVerified: { type: Boolean, default: false, required: true },
    verifiedBy: { type: ObjectId, ref: "admin_app" },
    verifiedDate: { type: Date, default: "" },
    isBlocked: { type: Boolean, default: false, required: false },
    isDeleted: { type: Boolean, default: false, required: false },
    isOnline: { type: Boolean, default: false, required: false },
    isBusy: { type: Boolean, default: false, required: false },
    isAvailable: { type: Boolean, default: false, required: false },
    status: { type: Boolean, default: true, required: false },
    isAvailableAt: { type: Date, default: DS.now() },
    addedBy: { type: ObjectId, ref: "admin_app"}, //new 
    isPassExam: { type: Boolean, default: false, required: false }, // new
    CommercialCronUpdatedAt: { type: Date },
    // isRideRequestSended: { type: Boolean, default: false, required: false },

    avgRating: { type: Number, default: 2.5 },
    totalRating: { type: Number, default: 0 },
    ratedCount: { type: Number, default: 0 },
    billingId: { type: ObjectId, ref: "billing_plan" },
    languageId: { type: ObjectId, ref: "language" },
    radius: { type: Number, default: 2 },
    referralCode: { type: String } /** share new user using this code */,
    inviteCode: { type: String, default: "" } /** parent user code */,
    gender: { type: String, default: "" },
    currentLocation: { type: String, default: "" },
    drivingLicence: { type: String, default: ""},
    driverLevel: { type: Number, default: 0 },
    socketId: { type: String },
    totalCompletedRides: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    totalInvited: { type: Number, default: 0 },
    creditBalance: { type: Number, default: 0 },
    earningFromReferral: { type: Number, default: 0 },
    earningFromRide: { type: Number, default: 0 },
    accountDetails:{
      cardNumber: { type: String},
      cardType: { type: String}
    },
    walletMoney: { type: Number, default: 0 },
    blockedRidesCount: { type: Number, default: 0 },
    autoIncrementID: { type: Number, required: true },
    creditBy: { type: ObjectId, ref: "admin" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deviceDetail: {
      os: {
        type: String,
        trim: true,
        enum: ["android", "ios"],
      },
      token: {
        type: String,
        default: "",
      },
      brand: {
        type: String,
        require: true,
      },
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      angle: {
        type: Number,
        default: 0,
      },
      speed: {
        type: Number,
        default: 0,
      },
      index: {
        type: String,
        default: "2dsphere",
      },
      coordinates: {
        type: Array,
        default: [0, 0],
      },
    },
  },
  {
    collection: "driver",
  }
);

schema.pre("save", function (next) {
  var driver = this;
  driver.createdAt = driver.updatedAt = DS.now();
  next();
});

schema.pre("update", function (next) {
  this.update({}, { $set: { updatedAt: DS.now() } });
  next();
});

module.exports = connection.model(schema.options.collection, schema);
