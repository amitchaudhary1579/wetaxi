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

var schema = new Schema(
  {
    uniqueID: { type: String, unique: true, required: true },
    name: {
      type: String,
      trim: true,
      default: "",
      sparse: true,
      required: true
    },
    email: { type: String, trim: true, default: "", index: true },
    dob: { type: String, default: "", required: true },
    // phoneNumber: { type: String, trim: true, unique: true, min: 10, max: 15, index: true, required: true },
    phoneNumber: { type: String, trim: true, min: 10, max: 15, required: true },
    onlyPhoneNumber: { type: String, trim: true, required: true },
    countryCode: { type: String, trim: true, min: 10, max: 15, required: true },
    // countryCodeWithPhoneNumber: { type: String, trim: true, min: 10, max: 15, required: true },
    profilePhoto: { type: String, default: "" },
    referralCode: { type: String, trim: true, default: "", sparse: true },
    inviteCode: { type: String, default: "" },
    gender: { type: String, default: "" },
    currentLocation: { type: String, default: "" },
    uplineCode: { type: String, default: "" },
    earningFromReferral: { type: Number, default: 0 },
    earningFromRide: { type: Number, default: 0 },
    accountDetails:{
      cardNumber: { type: String},
      cardType: { type: String}
    },
    walletMoney: { type: Number, default: 0 },
    passengerLevel: { type: Number, default: 0 },
    languageId: { type: ObjectId, ref: "language" },
    fbId: { type: String, default: "" },
    isFbLogin: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false, required: false },
    isBlocked: { type: Boolean, default: false, required: false },
    isDeleted: { type: Boolean, default: false, required: false },
    totalCompletedRides: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    totalInvited: { type: Number, default: 0 },
    avgRating: { type: Number, default: 2.5 },
    totalRating: { type: Number, default: 0 },
    ratedCount: { type: Number, default: 0 },
    deviceDetail: {
      os: {
        type: String,
        trim: true,
        enum: ["android", "ios"]
      },
      token: {
        type: String,
        default: ""
      },
      brand: {
        type: String,
        require: true
      }
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      angle: {
        type: Number,
        default: 0
      },
      speed: {
        type: Number,
        default: 0
      },
      index: {
        type: String,
        default: "2dsphere"
      },
      coordinates: {
        type: Array,
        default: [0, 0]
      }
    },
    socketId: { type: String },
    autoIncrementID: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: "passenger"
  }
);

schema.pre("save", function(next) {
  var passenger = this;
  passenger.createdAt = passenger.updatedAt = DS.now();
  next();
});

schema.pre("update", function(next) {
  this.update({}, { $set: { updatedAt: DS.now() } });
  next();
});

module.exports = connection.model(schema.options.collection, schema);
