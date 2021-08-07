var debug = require('debug')('x-code:v1:policies:socket:decode'),
    jwt = require('jsonwebtoken'),

    // User = require('../models/User'),
    User = require('../../v11/models/users'),

    config = rootRequire('config/global'),
    AESCrypt = rootRequire('services/aes');

var EncodeSocketResponsePolicy = require('../policies/encodeSocketResponse.js');

module.exports = function(packet, next) {

    // debug('SOCKET REQUEST DATA:->', packet);

    if (typeof packet[2] == 'function') {
        packet[2] = EncodeSocketResponsePolicy.bind(null, packet[2]);
    }

    // skip to decode code
    if (!config.cryptoEnable) {
        return next();
    }

    if (!packet[1] || typeof packet[1] != 'object') {
        return;
    }

    if (packet[1].encoded) {
        try {
            var dec = AESCrypt.decrypt(packet[1].encoded);
            packet[1] = JSON.parse(dec);
        } catch (err) {
            if (typeof packet[2] == 'function') {
                return packet[2]({ status: 0, message: 'Failed to decode data.' });
            }
            return;
        }

        next();
    } else {
        // next();
        if (typeof packet[2] == 'function') {
            return packet[2]({ status: 0, message: 'Request is not autherized.' });
        }
    }

};
