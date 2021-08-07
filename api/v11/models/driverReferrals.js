/**
 * Created by Parag Soni on 06/05/2019.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require('../db/connection');
var DS = rootRequire('services/date'); // date services

var schema = new Schema({
    driver: { type: ObjectId, ref: 'driver' },
    parentDriver: { type: ObjectId, ref: 'driver' },
    grandParentDriver: { type: ObjectId, ref: 'driver' },
    greatGrandParentDriver: { type: ObjectId, ref: 'driver' },
    referralCode: { type: String },
    inviteCode: { type: String },
    driverLevel: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
        collection: 'driver_referrals'
    });

schema.pre('save', function (next) {
    var driver = this;
    driver.createdAt = driver.updatedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);