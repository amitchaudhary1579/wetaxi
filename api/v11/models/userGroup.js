var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require("../db/connection");
var DS = rootRequire("services/date"); // date services

var schema = new Schema(
  {
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: false },
    name: { type: String, default: "", required: true },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    pageAccess: { type: Array }
  },
  {
    collection: "userGroup"
  }
);

schema.pre("save", function(next) {
  var code = this;
  code.createdAt = code.updatedAt = DS.now();
  next();
});

schema.pre("update", function(next) {
  this.update({}, { $set: { updatedAt: DS.now() } });
  next();
});

module.exports = connection.model(schema.options.collection, schema);
