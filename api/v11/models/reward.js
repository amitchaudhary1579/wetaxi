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
var schema = new Schema({
    name: { type: Object },
    details: { type: Object },
    driverId: { type: ObjectId, ref: 'driver' },
    passengerId: { type: ObjectId, ref: 'passenger' },
    amount: { type: Number, required: true, default: 0 },
    isDriver: { type: Boolean, default: false },
    isPassenger: { type: Boolean, default: false },
    isExpandable: { type: Boolean, default: false },
    type: { type: String, default: 'other' }, // total 2 types : birthday and other
    isReceived: { type: Boolean, default: false },
    giftType: { type: String, default: 'other' }, // total 3 types : wallet, cash, other
    giftName: { type: String },
    autoIncrementID: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },

}, {
        collection: 'reward'
    });


module.exports = connection.model(schema.options.collection, schema);