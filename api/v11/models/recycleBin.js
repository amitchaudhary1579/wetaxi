var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require("../db/connection");
var DS = rootRequire("services/date"); // date services

var schema = new Schema(
  {
    subject: { type: String, required: true },
    userId: { type: ObjectId, ref: "admin_app" },
    tableName: { type: String, required: true },
    recordId: { type: ObjectId, required: true },
    isDeleted: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: "recycleBin"
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
