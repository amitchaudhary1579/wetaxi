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
    title: { type: String, default: '' },
    note: { type: String },
    receiver_type: { type: String, enum: ['passenger', 'driver'] },
    passengerId: { type: ObjectId, ref: 'passenger' },
    driverId: { type: ObjectId, ref: 'driver' },
    rideId: { type: ObjectId, ref: 'ride' },
    billingId: { type: ObjectId, ref: 'biling_plan' },
    type: {
        type: String,
        default: 'notification',
        trim: true,
        enum: ['notification', 'billing_plan', 'credit', 'reward', 'recent_transaction']
    },
    bilingAmount: { type: Number },
    isRead: { type: Boolean, default: false, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'notification'
});

schema.pre('save', function (next) {
    var notification = this;
    notification.createdAt = notification.updatedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);