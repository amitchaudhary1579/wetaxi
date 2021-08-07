var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connection = require('../db/connection');
var ObjectId = mongoose.Schema.Types.ObjectId;
var ED = rootRequire('services/encry_decry');
var DS = rootRequire('services/date'); // date services

var schema = new Schema({
    passengerId: { type: ObjectId, ref: 'passenger' },
    predictions: {
        type: JSON
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isHome: {
        type: Boolean,
        default: false
    },
    isWork: {
        type: Boolean,
        default: false
    },

}, {
    collection: 'passenger_search_history'
});
schema.pre('save', function (next) {
    var searchHistory = this;
    searchHistory.createdAt = searchHistory.updatedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});
module.exports = connection.model(schema.options.collection, schema);