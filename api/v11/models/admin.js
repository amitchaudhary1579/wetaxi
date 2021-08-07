var mongoose = require("mongoose"),
  crypto = require("crypto"),
  Schema = mongoose.Schema,
  connection = require("../db/connection"),
  ED = rootRequire("services/encry_decry"),
  DS = rootRequire("services/date"); // date services

var ObjectId = mongoose.Schema.Types.ObjectId;

// model schema
var schema = new Schema(
  {
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    dob: { type: String, default: "", required: true },
    gender: { type: String, default: "" },
    type: {
      type: String,
      required: true,
        trim: true,
        enum: ["admin", "vehicleOwner","promoter"],
        default: "vehicleOwner"
    },
    profilePhoto: { type: String, default: "" },
    isActive: {
      type: Boolean,
      default: true,
      required: false
    },
    otpExpireTime: { type:Date, default:null},
    otp: { type: String},
    confirmOtp: { type: String},
    canChangePassword: {
      type: Boolean,
      default: true,
      required: false
    },
    autoIncrementID: {
      type: Number,
      required: true
    },
    updated_at: {
      type: Date,
      default: DS.now()
    },
    created_at: {
      type: Date,
      default: DS.now()
    },
    userName: {
      type: String,
      default: ""
      // required: true
    },
    countryCode:{
      type: String,
      default: ""
    },
    phoneNumber: {
      type: String,
      default: ""
      //  required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    userCommission: { type: Number, default: 5}, // driver commission 
    vehicleOwnerCommission: { type: Number, default: 5}, 
    accountDetails: {
      cardNumber: { type: String},
      cardType: { type: String}
    },
    walletMoney: { type: Number, default: 0 },
    addedBy: { type: ObjectId, ref: "admin_app"}
  },
  {
    collection: "admin_app"
  }
);

schema.pre("save", function(next) {
  var admin = this;
  admin.password = ED.encrypt(admin.password);
  admin.created_at = admin.updated_at = DS.now();
  next();
});

schema.pre("update", function(next) {
  this.update({}, { $set: { updated_at: DS.now() } });
  next();
});

module.exports = connection.model(schema.options.collection, schema);
