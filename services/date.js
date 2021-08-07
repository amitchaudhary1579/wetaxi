var moment = require('moment');

var _self = {
  now: function now() {
    return moment().toISOString();
  },

  getTime: function getTime() {
    return moment().valueOf();
  },

  getFiveMinOldTime: function getFiveMinOldTime() {
    return moment()
      .utc()
      .subtract(5, 'minutes')
      .toISOString();
  },

  getOldTimeByMin: function getOldTimeByMin(minute) {
    return moment()
      .utc()
      .subtract(minute, 'minutes')
      .toISOString();
  }
};

module.exports = _self;
