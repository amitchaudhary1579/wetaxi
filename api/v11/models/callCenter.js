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
    privacyPolicy: { type: String },
    termAndCondition: { type: String }
  },
  {
    collection: "callCenter"
  }
);

module.exports = connection.model(schema.options.collection, schema);
