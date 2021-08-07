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
// Schema
var schema = new Schema({
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'ride'
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'driver'
    },
    isDuplicate: {
      type: Boolean,
      default: false
    },
    distance: {
      type: Number,
      default: 0
    },
    sequence: {
      type: Number,
      default: 0
    },
    status: [
      {
        _id: 0,
        type: {
            type: String,
            trim: true,
            enum: ['open', 'sent', 'accepted', 'passed', 'timeout']
        },
        createdAt: { type: Date, default: DS.now() },
      }
    ]
    ,
    createdAt: {
      type: Date,
      default: DS.now()
    },
    updatedAt: {
      type: Date,
      default: DS.now()
    }
  }, {
      collection: 'driver_ride_request'
    });
  
    schema.pre('save', function(next) {
        var passenger = this;
        passenger.createdAt = passenger.updatedAt = DS.now();
        next();
    });
    
    schema.pre('update', function(next) {
        this.update({}, { $set: { updatedAt: DS.now() } });
        next();
    });


module.exports = connection.model(schema.options.collection, schema);