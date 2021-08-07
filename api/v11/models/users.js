var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require("../db/connection");
var DS = rootRequire("services/date"); // date services

var schema = new Schema(
  {
    userName: { type: String, default: "", required: true },
    phone: { type: String, default: "", required: true },
    password: { type: String, default: "", required: true },
    email: { type: String, default: "", required: true },
    groupId: { type: ObjectId, ref: "userGroup", required: true },
    positionId: { type: ObjectId, ref: "position", required: true },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: "users_app"
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
