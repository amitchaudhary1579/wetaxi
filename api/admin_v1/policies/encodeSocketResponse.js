var debug = require('debug')('x-code:v1:policies:encode'),
  HttpStatus = require('http-status-codes'),
  config = rootRequire('config/global'),
  AESCrypt = rootRequire('services/aes');

module.exports = function(CB, result) {
  debug('SOCKET RESPONSES:', result);

  if (!config.cryptoEnable) {
    if (typeof CB == 'function') {
      CB(result);
    }
    return;
  }

  // send server error if response does not exit
  if (!result || typeof result !== 'object') {
    if (typeof CB == 'function') {
      return CB({ status: 0, message: 'Oops! Server Error.' });
    }
    return;
  }

  // send response with encryption
  if (typeof result.data != 'undefined') {
    result.data = JSON.stringify(result.data);
    result.data = AESCrypt.encrypt(result.data);
  } else {
    result.data = '';
  }

  if (typeof CB == 'function') {
    CB(result);
  }
};
