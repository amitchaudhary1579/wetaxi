const nodemailer = require('nodemailer');
const config = rootRequire("config/global");

 var { resetPassword } = require('../emailTemplate/resetPassword');
 var { resetPasswordSuccess} = require('../emailTemplate/resetPasswordSuccess');
// var { forgotPassCnfmTemplate } = require('./forgotPass.verify');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.newMailOptions.email,
        pass: config.newMailOptions.pass
    }
})

module.exports.sendVerificationOTP = async (mail, type, mailOTP) => {
    try{
        var mailOptions;
        if (type == 'forgotPassword'){
            mailOptions = {
                from: 'WE-taxi <kush@solulab.co>',
                to: mail,
                subject: 'Forgot password for We taxi panel',
                html: resetPassword(config.baseUrl, mailOTP)
            };
        }
        else if(type== 'resetPassword') {
            mailOptions = {
                from: 'WE-taxi <kush@solulab.co>',
                to: mail,
                subject: 'Reset password for We taxi panel',
                html: resetPasswordSuccess(config.baseUrl)
            };
        }
        if (type == 'forgot_pass'){
            mailOptions = {
                from: 'WE-taxi <kush@solulab.co>',
                to: mail,
                subject: 'Forgot Password verification for Biomorphik',
                html: forgotPassCnfmTemplate(mailOTP)
            };
        }
        await transporter.sendMail(mailOptions);
        return {'result': true, 'error':false, 'msg':'OTP verification mail was sent', 'otp':mailOTP};
    }catch(ex){
        console.log('sendVerificationOTP: ', ex);
        return {'result': false, 'error':true, 'msg': 'Internal server error'};
    }
}