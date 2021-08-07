/**
 * Created by Parag Soni on 06/05/2019.
 */
var mongoose = require("mongoose"),
  crypto = require("crypto"),
  Schema = mongoose.Schema,
  ObjectId = mongoose.Schema.Types.ObjectId,
  connection = require("../db/connection"),
  ED = rootRequire("services/encry_decry"),
  DS = rootRequire("services/date"); // date services

// model schema
var schema = new Schema(
  {
    type: { type: Object },
    autoIncrementID: { type: Number, required: true },
    image: { type: String, required: true },
    commission:{ type: Number, default : 10}, 
    minFare: { type: Number },
    feePerKM: { type: Number },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: "vehicle_type"
  }
);

schema.pre("save", function(next) {
  var vehicle = this;
  vehicle.createdAt = vehicle.updatedAt = DS.now();
  next();
});

schema.pre("update", function(next) {
  this.update({}, { $set: { updatedAt: DS.now() } });
  next();
});

module.exports = connection.model(schema.options.collection, schema);
