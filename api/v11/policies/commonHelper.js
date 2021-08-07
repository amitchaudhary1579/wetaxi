const moment = require('moment');
const {
    accountSid,
    authToken,
    trailNumber
} = require('../../../config/global');
const walletLogs= require('../models/walletLogs');
const withdrawLogsSchema = require('../models/withdrawsLogs');
// var {
//     stripe_secret_key,
//     stripe_pub_key,
// } = require('../config');
// var stripe = require('stripe')(stripe_secret_key);

module.exports.generateOTP = (cb) => {
    let digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return cb(null, OTP);
}

module.exports.generateOTPNew = () => {
    let digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

module.exports.sendMessage = async (phoneNumber, message, cb) => {
            console.log(message);
            const accountId = accountSid;
            const authTokens = authToken;
            const client = require('twilio')(accountId, authTokens);

            return await client.messages
                .create({
                    body: message,
                    from: trailNumber,
                    to: '+'+ phoneNumber
                })
                .then(message => {
                    return cb(null, true);
                }).catch(err => {
                    console.log(err);
                    return cb(null, false);
                });
    };
    // let requestOption = {
    //     method: 'GET',
    //     // uri: 'https://sandbox.mekongsms.com/api/sendsms.aspx',
    //     uri: 'https://api.mekongsms.com/api/sendsms.aspx',
    //     qs: {
    //         // username: 'gogotaxi_free@apitest',
    //         // pass: '139ab8a86d5e9be6f876afbe48f8a524',
    //         username: 'gogotaxi_sms@mekongnet',
    //         pass: '4298e686575b24102da9183d736c1b37',
    //         cd: 'TEST',
    //         sender: 'GOGO TAXI',
    //         smstext: message,
    //         isflash: 0,
    //         gsm: phoneNumber,
    //         int: 1
    //     },
    //     headers: {
    //         'User-Agent': 'Request-Promise'
    //     },
    //     json: true // Automatically parses the JSON string in the response
    // };
    // Request(requestOption)
    //     .then(function (body) {
    //         console.log(body);
    //         return cb(null, true);
    //     })
    //     .catch(function (err) {
    //         return cb(err, null);
    //     });


module.exports.getUtcCurrentDateTime = (cb) => {
    return cb(null, moment().utc().toDate());
};

// convert date to utc date
module.exports.getDateInUTC = (date, cb) => {
    return cb(null, moment(date).utc().toDate());
};

module.exports.walletAccountLogs  = async (data)=>{
    console.log('data', data);
    let saveLogData = new walletLogs(data); 
    let saveLOgs = await saveLogData.save(data);
    return true;
};

module.exports.withDrawLOgs  = async(data)=>{
    let actionLogs = new withdrawLogsSchema(data);
    let saveLOgs =  await actionLogs.save();
    return true;
};
// create customer
// module.exports.createCustomer = async (name, email, phone) => {
//     try{
//         var cus = await stripe.customers.create({
//             name:name,
//             email:email,
//             phone: phone,
//         });
//         return {'result': true, 'error': false, 'data': cus};
//     }catch(ex){
//         console.log('createCustomer: ', ex);
//         return {'result': false, 'error':true, 'msg': 'Internal server error'};
//     }
// }
// update source
// module.exports.addSource = async (customer, source) => {
//     try{
//         var cus = await stripe.customers.update(customer,{
//             source:source
//         });
//         return {'result': true, 'error': false, 'data': cus};
//     }catch(ex){
//         console.log('addSource: ', ex);
//         return {'result': false, 'error':true, 'msg': 'Internal server error'};
//     }
// }
// pay to stripe
// module.exports.payStripe = async (cus_id, currency, amount, desc) => {
//     try{
//         var charge = await stripe.charges.create({
//             amount:parseFloat(amount)*100,
//             currency: currency,
//             customer: cus_id,
//             description: desc
//         });
//         return {'result': true, 'error': false, 'data': charge};
//     }catch(ex){
//         console.log('payStripe: ', ex);
//         return {'result': false, 'error':true, 'msg': 'Internal server error'};
//     }
// }


