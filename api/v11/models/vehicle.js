"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require("../db/connection");
var ED = rootRequire("services/encry_decry");
var DS = rootRequire("services/date"); // date services

var schema = new Schema({
  typeId: { type: ObjectId, ref: "vehicle_type" },
  year: { type: String },
  seats: { type: String },
  color: { type: String },  
  model: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  platNumber: { type: String },
  isAcAvailable: { type: Boolean, default: false },
  isSmokingAllowed: { type: Boolean, default: false },
  vehiclePhotos: { type: Array, default: [] },
  vehicleIdPhotos: { type: Array, default: [] },
  commissionPercentage: { type: Number, default: 5},
  plateNoPhotos: { type: Array, default: [] },
  addedBy : { type: ObjectId , ref: 'admin_app'},
  isDeleted: { type: Boolean, default: false},
  isDriverAssign: { type: Boolean, default: false},
  transmissionType:{
    type: String,
      trim: true,
      enum: ["gear", "auto"],
      default: "gear"
  },
  currentDriverAssignId: { type: ObjectId, ref: 'driver'},
  currentDriverAssign: { type: Boolean, default: false},
},{
    collection: "vehicle",
});
schema.pre('save', function(next) {
    var helpCenter = this;
    helpCenter.createdAt = helpCenter.updatedAt = DS.now();
    next();
});

schema.pre('update', function(next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);