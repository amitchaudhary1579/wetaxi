var util = require('util');
const marketPlacePush = require('../push-notifications/marketplace.push');
var debug = require('debug')('x-code:notification'),
    FCM = require('fcm-push'),
    apn = require('apn'),
    _ = require('underscore'),
    fs = require('fs'),

    config = rootRequire('config/global');

// var _config = {
//     "passphrase": "admin",
//     'production': false,
//     'key': fs.readFileSync(__dirname + '/pemFiles/app_pushnotification_driver_end.pem'),
//     'cert': fs.readFileSync(__dirname + '/pemFiles/app_pushnotification_driver_end.pem'),
//     'debug': true
// };

// var apnProvider = new apn.Provider(_config);

var _self = {

    /**
     * FCM Push Notification
     **/
    fcm: function pushFCM(options, callback) {


        if (options.os === 'web') {



            const data = {
                to: options.to,
                deviceType : "web",
                notification: {
                    title: options.data.title,
                    body: options.data.body,
                },
                data: {
                    title: options.data.title,
                    message: options.data.body,   
                }
            }
            marketPlacePush.sendNotification(data, callback);

        } else {

            if (options.data.type != 4) {
                options.data.sound = 'default';
            }


            if (!options.data.badge) {
                options.data.badge = 0
            }

            var fcm;
            if (options.type == 'driver') {
                fcm = new FCM(config.notification.driverAndroidApiKey);
                if (options.data.type != 4) {
                    options.data.android_channel_id = 'normalChannel';
                }
            } else {
                fcm = new FCM(config.notification.passengerAndroidApiKey);
            }
            if (options.data.title === 'Incoming Call') {
                options.data.sound = 'call';
                options.data.android_channel_id = 'general-channel';
            }

            var message = {
                to: options.to, // required fill with device token or topics
                data: options.data || {},
                // notification: options.data || {}
            };
            if (options.data.type != 4 && !options.os && options.os != 'android') {
                message.notification = options.data || {}
            } else if (options.data.type == 4 && options.os && options.os == 'ios') {
                message.notification = options.data || {},
                    message.notification.click_action = "ACTION_BUTTON"
            } else {

                if (options.data.notification != undefined) {
                    message.notification = options.data.notification;
                }
            }
            console.log('message', message);
            fcm.send(message, callback);
        }

    },

    /**
     * APN Push Notification
     **/
    apn: function pushAPN(options, callback) {

        var _config = {

            token: {
                // key: fs.readFileSync(__dirname + '/pemFiles/GoGo_AuthKey_FWJZCJ36X6.p8'), app_pushnotification.p12
                key: fs.readFileSync(__dirname + '/pemFiles/app_pushnotification.p12'),
                keyId: "JSA8252YV7",//"FWJZCJ36X6",
                teamId: "S5X8785YQW" //"FZ686P9F97"
            },
            production: false
            // "passphrase": "admin",
            // 'production': false,
            // 'key': fs.readFileSync(__dirname + '/pemFiles/GoGo_AuthKey_FWJZCJ36X6.p8'),
            // 'cert': fs.readFileSync(__dirname + '/pemFiles/app_pushnotification_driver_end.pem'),
            // 'debug': true
        };

        var apnProvider = new apn.Provider(_config);
        console.log('APN :', options);

        var note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 0;
        note.sound = "default";
        note.alert = "xCode";
        note.topic = "com.app.xCode";
        note.contentAvailable = 1;

        // note.payload = {'messageFrom': 'John Appleseed'};
        note.payload = {
            body: {}
        };

        // assign clone of data to payload body
        if (options && options.data && options.data.message) {
            note.alert = options.data.notification;
            note.payload.body = _.clone(options.data);
            if (options.data.type == 4) {
                note.alert.click_action = "ACTION_BUTTON"
            }
            delete note.payload.body['message'];
            delete note.payload.body['title'];
        }

        apnProvider.send(note, options.to).then((result) => {
            console.log('result', result);
            console.log('error', result.failed[0].error);
            console.log('error', result.failed[0].response);

            // debug('\n result:', util.inspect(result, {
            //     showHidden: false,
            //     depth: null
            // }));
            callback(null, result);
        }).catch((error) => {
            console.log(error);
            callback(error, null);
        });
    },

    silentFcm: function pushFCM(options, callback) {
        var fcm = new FCM(config.notification.androidApiKey);
        var message = {
            to: options.to,
            content_available: true,
            // 'content-available': 1,
            data: options.data || {},
            notification: options.data || {}
        };
        fcm.send(message, callback);
    },
};

module.exports = _self;

// setTimeout(function() {
//     _self.apn({
//         to: 'B75BFCDFD7A8E946E330E4A4407FE351692C7A1595C748F5546934E3E91C6097',
//         data: {
//             message: 'test',
//             sender_id: 'sadsad'
//         }
//     });
// }, 2000);