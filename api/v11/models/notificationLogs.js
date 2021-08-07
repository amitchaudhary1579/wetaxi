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
    autoIncrementID: { type: Number, required: true },
    title: { type: String, default: '' },
    note: { type: String },
    receiver_type: { type: String, enum: ['passenger', 'driver'] },
    ids: {
        type: Array,
        default: []
    },
    type: {
        type: String,
        default: 'notification',
        trim: true,
        enum: ['bulk', 'individual']
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'notification_logs'
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