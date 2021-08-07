/**
 * Created by Parag Soni on 06/05/2019.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = mongoose.Schema.Types.ObjectId;
var connection = require('../db/connection');
var ED = rootRequire('services/encry_decry');
var DS = rootRequire('services/date'); // date services


var schema = new Schema({
    rideId: { type: String },
    passengerId: { type: ObjectId, ref: 'passenger', required: true },
    driverId: { type: ObjectId, ref: 'driver' },
    vehicleId: { type:ObjectId, ref: 'vehicle'},
    requestedVehicleTypeId: { type: ObjectId, ref: 'vehicle_type', required: true },
    activateRideOtp: { type: String},
    deviceDetail: {
        os: {
            type: String,
            trim: true,
            enum: ['android', 'ios']
        },
        token: {
            type: String,
            default: "",
        }
    },
    pickupAddress: { type: String },
    pickupLocation: {
        type: {
            type: String,
            default: 'Point'
        },
        angle: {
            type: Number,
            default: 0
        },
        speed: {
            type: Number,
            default: 0
        },
        index: {
            type: String,
            default: '2dsphere'
        },
        coordinates: {
            type: Array,
            default: [0, 0]
        }
    },
    destinationAddress: { type: String },
    destinationLocation: {
        type: {
            type: String,
            default: 'Point'
        },
        angle: {
            type: Number,
            default: 0
        },
        speed: {
            type: Number,
            default: 0
        },
        index: {
            type: String,
            default: '2dsphere'
        },
        coordinates: {
            type: Array,
            default: [0, 0]
        }
    },

    totalDistance: { type: Number, default: 0 }, // In Km
    totalTime: { type: Number, default: 0 }, // In seconds
    totalFare: { type: Number, default: 0 },
    driverEarning: { type: Number, default: 0 },
    adminEarning: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    arrivedAt: { type: Date },
    startedAt: { type: Date },
    paymentAt: { type: Date },
    endedAt: { type: Date },
    acceptedAt: { type: Date },
    updatedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        trim: true,
        enum: ['requested', 'cancelled', 'accepted', 'arrived', 'onride', 'completed', 'request_expired']
    },
    tripType: { type: String },
    cancelBy: { type: String }, // total 3: system, driver, passenger
    cancelReason: { type: ObjectId, ref: 'reason' },
    paymentStatus: { type: Boolean, default: false },
    isRating: { type: Boolean, default: false },
    isPassengerRating: { type: Boolean, default: false },
    rate: { type: Number, default: 0 },
    comment: { type: String, default: '' },
    passengerRate: { type: Number, default: 0 },
    passengerComment: { type: String, default: '' },
    reasonText: { type: Object },
    driverCommission:  { type: Number},
    promoterDriverCommission:  { type: Number},
    promoterVoCommission: { type: Number},
    voCommission:  { type: Number},

    isFoodOrder : { type : Boolean , default : false},
    orderId : {
        type : ObjectId,
        ref : 'order'
    }
}, {
    collection: 'ride'
});

schema.pre('save', function (next) {
    var passenger = this;
    passenger.createdAt = passenger.updatedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model(schema.options.collection, schema);