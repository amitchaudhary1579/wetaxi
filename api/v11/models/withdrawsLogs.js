/**
 * Created by Parag Soni on 06/05/2019.
 */
var mongoose = require('mongoose'),
    crypto = require('crypto'),
    Schema = mongoose.Schema;

    connection = require('../db/connection'),
    ED = rootRequire('services/encry_decry'),
    DS = rootRequire('services/date'); // date services

// model schema
var schema = new Schema({
    roleFor: {
        type: String,
        enum: ['admin', 'driver', 'passenger' ]
    },
    userId: {
        type: Schema.Types.ObjectId,
        refPath: 'roleFor',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        refPath: 'roleFor',
        required: true
    },
    amount: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'withdrawsLogs'
});

schema.pre('save', function(next) {
    var helpCenter = this;
    helpCenter.createdAt = helpCenter.updatedAt = DS.now();
    next();
});

schema.pre('update', function(next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);