var util = require('util');

var debug = require('debug')('x-code:v1:socket:socketControllers:userSocketController'),
    moment = require('moment'),
    async = require('async'),
    path = require('path'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    fse = require('fs-extra'),
    PN = rootRequire('support/push-notifications/pn'),

    config = rootRequire('config/global'),
    message = rootRequire('config/messages/en'),
    Uploader = rootRequire('support/uploader'),
    Mailer = rootRequire('support/mailer'),
    DS = rootRequire('services/date'), // date services
    AESCrypt = rootRequire('services/aes');

var _self = {

    test: function(socket, nsp, data, CB) {
        CB({
            "status": 1,
            "message": "got it",
            data: data
        });
    },

    connect: function(socket, nsp, data, CB) {
        CB({
            "status": 1,
            "message": "got it",
            data: data
        });
    }

};

module.exports = _self;