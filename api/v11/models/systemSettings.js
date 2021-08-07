/**
 * Created by Parag Soni on 06/05/2019.
 */
var mongoose = require('mongoose'),
  crypto = require('crypto'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.Schema.Types.ObjectId,
  connection = require('../db/connection'),
  ED = rootRequire('services/encry_decry'),
  DS = rootRequire('services/date'); // date services

// model schema
var schema = new Schema(
  {
    uniqueID: { type: Number, required: true, unique: true },
    adminFee: { type: Number },
    driverMinimumBalance: { type: Number, default: 0 },
    driverAutoIncrement: { type: Number, default: 0, unique: true },
    passengerAutoIncrement: { type: Number, default: 0, unique: true },
    operatorAutoIncrement: { type: Number, default: 0, unique: true },
    vehicleOwnerAutoIncrement:{ type: Number, default: 0, unique: true },   
    promoterAutoIncrement:{ type: Number, default: 0, unique: true },
    rewardAutoIncrement: { type: Number, default: 0, unique: true },
    vehicleAutoIncrement: { type: Number, default: 0, unique: true },
    emergencyAutoIncrement: { type: Number, default: 0, unique: true },
    driverReferralAutoIncrement: { type: Number, default: 0, unique: true },
    passengerReferralAutoIncrement: { type: Number, default: 0, unique: true },
    logAutoIncrement: { type: Number, default: 0, unique: true },
    helpCenterAutoIncrement: { type: Number, default: 0, unique: true },
    notificationLogsAutoIncrement: { type: Number, default: 0, unique: true },
    driverVersionUpdate: { type: Object },
    passengerVersionUpdate: { type: Object },
    fbUrl: { type: String, default: '' }
  },
  {
    collection: 'system_settings'
  }
);

module.exports = connection.model(schema.options.collection, schema);
