var debug = require('debug')('x-code:v1:policies:encode'),
    HttpStatus = require('http-status-codes'),
    config = rootRequire('config/global'),
    AESCrypt = rootRequire('services/aes');

module.exports = function (request, response, next) {
    // debug('RESPONSES:', request.sourceOfRequest, request.resbody, request.method);

    if (request.method == 'OPTIONS') {
        return next();
    }
   
    // send server error if response does not exit
    if (!request.resbody || typeof request.resbody !== 'object') {
        return response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send({
                status: 0,
                message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR)
            });
    }

    // console.log(request.resbody, config.cryptoEnable, request.sourceOfRequest)
    if (config.cryptoEnable === true && request.sourceOfRequest != 'web') {
        // send response with encryption
        if (typeof request.resbody.data != 'undefined') {
            request.resbody.data = JSON.stringify(request.resbody.data)
            request.resbody.data = AESCrypt.encrypt(request.resbody.data);
        } else {
            request.resbody.data = '';
        }
        response
            .status(request.resbody.status_code || 200)
            .send(request.resbody);
    } else {
        // send response without encryption
        response
            .status(request.resbody.status_code || 200)
            .send(request.resbody);
    }

};