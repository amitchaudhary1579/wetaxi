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
    nativeName: { type: String, trim: true, unique: true, default: "" },
    code: { type: String, trim: true, unique: true, default: "" },
    flag: { type: String, default: "" }
}, {
    collection: 'language'
});

module.exports = connection.model(schema.options.collection, schema);