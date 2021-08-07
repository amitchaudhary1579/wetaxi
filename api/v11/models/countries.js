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
    name: { type: String, trim: true, unique: true, default: "" },
    code: { type: String, trim: true, unique: true, default: "" },
    phoneCode: { type: String, trim: true, unique: true, default: "" },
    flag: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'countries'
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