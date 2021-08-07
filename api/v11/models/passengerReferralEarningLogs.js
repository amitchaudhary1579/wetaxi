'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require('../db/connection');
var ED = rootRequire('services/encry_decry');
var DS = rootRequire('services/date'); // date services


var schema = new Schema({
    rideId: { type: ObjectId, ref: 'ride' },
    autoIncrementID: { type: Number, required: true },
    passengerId: { type: ObjectId, ref: 'passenger' },
    beneficiaryPassengerId: { type: ObjectId, ref: 'passenger' },
    referralAmount: { type: Number },
    isWithdrawed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
        collection: 'passenger_referral_earning_logs'
    });

schema.pre('save', function (next) {
    var helpCenter = this;
    helpCenter.createdAt = helpCenter.updatedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);