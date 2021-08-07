var crypto = require('crypto');
var config = rootRequire('config/global');

var AESCrypt = {};

AESCrypt.decrypt = function (encryptdata) {
    encryptdata = new Buffer(encryptdata, 'base64').toString('binary');

    var hashKey = crypto.createHash('sha256').update(config.cryptoKey).digest(),
        decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, config.cryptoIV),
        decoded = decipher.update(encryptdata, 'binary', 'utf8');

    decoded += decipher.final('utf8');
    return decoded;
};

AESCrypt.encrypt = function (cleardata) {
    var hashKey = crypto.createHash('sha256').update(config.cryptoKey).digest(),
        encipher = crypto.createCipheriv('aes-256-cbc', hashKey, config.cryptoIV),
        encryptdata = encipher.update(cleardata, 'utf8', 'binary');

    encryptdata += encipher.final('binary');
    encode_encryptdata = new Buffer(encryptdata, 'binary').toString('base64');
    return encode_encryptdata;
};

module.exports = AESCrypt;

// var json = { screen_type: 'all',
//   user_id: '58ec9d7f0017192176f234b9',
//   lat: 23.0215813,
//   lon: 72.5446066 };

// var enc = AESCrypt.encrypt(JSON.stringify(json));
// console.log('ENC:', enc);

// var dec = AESCrypt.decrypt("tmBq8A71zV6VdqlEB7PXsjeqJ7ZTqqpR+SLGudMUI1NkkoLQzbgSX54SyBPkNsRn36ILNwk+LQMy66bl9msa5bq2mad/181d1XCE10MKJk4V++YSwbChX+oIlKyP+BOI");
// console.log('2', JSON.parse(dec));
