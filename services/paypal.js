var paypal = require('paypal-rest-sdk');
var config = rootRequire('config/global');

var PaypalMethod = {};
paypal.configure(config.paypal);

PaypalMethod.add_card = function (card_data, callback) {
    paypal.creditCard.create(card_data, callback);
}
PaypalMethod.delete_card = function (card_id, callback) {
    paypal.creditCard.del(card_id, callback);
}
PaypalMethod.get_card = function (card_id, callback) {
    paypal.creditCard.get(card_id, callback);
}
PaypalMethod.make_payment = function (card_data, callback) {
    paypal.payment.create(card_data, callback);
}
module.exports = PaypalMethod;

