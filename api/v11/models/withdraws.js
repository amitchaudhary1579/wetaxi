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
    driverId: { type: ObjectId, ref: 'driver' },
    passengerId: { type: ObjectId, ref: 'passenger' },
    isDriver: { type: Boolean, default: false, required: true },
    amount: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
}, {
    collection: 'withdraws'
});

module.exports = connection.model(schema.options.collection, schema);