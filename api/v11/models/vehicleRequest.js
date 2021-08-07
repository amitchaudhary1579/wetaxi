/**
 * Created by Parag Soni on 06/05/2019.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId,

    connection = require('../db/connection'),
    ED = rootRequire('services/encry_decry'),
    DS = rootRequire('services/date'); // date services

// model schema
var schema = new Schema({
    driverId: { type: ObjectId, ref:'driver'},
    vehicleOwnerId: { type: ObjectId, ref:'admin_app'},
    vehicleId: {type: ObjectId, ref:'vehicle'}, 
    isApproved: { type: Boolean, default: false},
    status: { type: String, default: 'pending'},
    approvedDate: { type: Date , default:null },
    isSendByDriver: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDeletedByDriver: {type: Boolean,  default: false}
}, {
    collection: 'vehicleRequest'
});

module.exports = connection.model(schema.options.collection, schema);