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
var schema = new Schema({
    receiver_type: { type: String, enum: ['passenger', 'driver'] },
    notificationId: { type: ObjectId, ref: 'notificationNew' },
    ids: [{
        receiverId: ObjectId,
        sendAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'notification_logs_new'
});

schema.pre('save', function (next) {
    var notification = this;
    notification.createdAt = notification.updatedAt = DS.now();
    next();
});

schema.pre('update', function (next) {
    this.update({}, { $set: { updatedAt: DS.now() } });
    next();
});

module.exports = connection.model('notification_logs_new', schema);