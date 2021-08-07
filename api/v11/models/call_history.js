/**
 * Created by Parag Soni on 06/05/2019.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require('../db/connection');
var ED = rootRequire('services/encry_decry');
var DS = rootRequire('services/date'); // date services


var schema = new Schema({
    channelId: { type: String },
    passengerId: { type: ObjectId, ref: 'passenger', required: true },
    driverId: { type: ObjectId, ref: 'driver', required: true },
    startAt: { type: Date },
    endedAt: { type: Date },
    status: {
        type: String,
        trim: true,
        enum: ['requested', 'completed']
    },
    from: { type: String },
    to: { type: String },
}, {
    collection: 'call_history'
});

schema.pre('save', function (next) {
    var call = this;
    call.startAt = call.endedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { endedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);