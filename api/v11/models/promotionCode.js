var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;


var connection = require('../db/connection');
var DS = rootRequire('services/date'); // date services

var schema = new Schema({

    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    code: { type: String, default: null },
    promotionCodeType: { type: String, default: null },
    startDate: { type: Date, default: null },
    expireDate: { type: Date, default: null },
    discount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    code: {
        type: String,
        default: null
    },
    startDate: {
        type: Date,
        default: null,
    },
    expireDate: {
        type: Date,
        default: null
    },
    discount: {
        type: Number,
        default: 0
    },
    promotionCodeType: {
        type: String,
        default: null
    }
}, {
    collection: 'promotionCode'
});


schema.pre('save', function (next) {
    var promotionCode = this;
    promotionCode.createdAt = promotionCode.updatedAt = DS.now();
    next();
});
schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);