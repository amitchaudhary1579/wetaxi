/**
 * Created by Parag Soni on 06/05/2019.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var connection = require('../db/connection');
var ED = rootRequire('services/encry_decry');
var DS = rootRequire('services/date'); // date services


var schema = new Schema({
    autoIncrementID: { type: Number, required: true },
    phoneNumber: { type: String, trim: true, min: 10, max: 15, required: true },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        index: {
            type: String,
            default: '2dsphere'
        },
        coordinates: {
            type: Array,
            default: [0, 0]
        }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'emergency'
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