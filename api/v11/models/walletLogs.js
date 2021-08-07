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
    roleForm: {
        type: String,
        enum: ['admin', 'driver', 'passenger']
    },
    from: {
        type: Schema.Types.ObjectId,
        refPath: 'roleForm',  
        required: true
    },
    roleTo: { 
        type: String,
        enum: ['admin', 'driver', 'passenger', 'null' ],
    },
    to:{
        type: Schema.Types.ObjectId,
        refPath: 'roleTo',
        default: null
    },
    transferType: {
        type: String,
        trim: true,
        enum: ['rideTransfer', 'addToWalletTransfer']
    },
    rideId: {
        type: Schema.Types.ObjectId,
        refPath: 'ride',  
        default: null
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        refPath: 'roleForm',
        required: true
    },
    amount: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'transferLog'
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