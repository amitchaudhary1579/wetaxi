/**
 * Created by Parag Soni on 06/05/2019.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require('../db/connection');
var DS = rootRequire('services/date'); // date services

var schema = new Schema({
    autoIncrementID: { type: Number, default: 0 },
    section: { type: String },
    action: { type: String },
    userType: { type: String },
    userName: { type: String },
    userId: { type: ObjectId, ref: 'admin_app' },
    actionAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, {
        collection: 'action_logs'
    });

module.exports = connection.model(schema.options.collection, schema);