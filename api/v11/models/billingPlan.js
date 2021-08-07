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
    name: { type: Object },
    details: { type: Object },
    chargeAmt: { type: Number, required: true },
    type: { type: String },
    billingType: {
      type: String,
      required: true,
      trim: true,
      enum: ["percentage", "cash"]
    },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: "billing_plan"
  }
);

schema.pre("save", function(next) {
  var billingPlan = this;
  billingPlan.createdAt = billingPlan.updatedAt = DS.now();
  next();
});

schema.pre("update", function(next) {
  this.update({}, { $set: { updatedAt: DS.now() } });
  next();
});

module.exports = connection.model(schema.options.collection, schema);
