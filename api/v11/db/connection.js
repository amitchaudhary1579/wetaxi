var debug = require('debug')('x-code:v1:db:connection'),
  mongoose = require('mongoose'),
  mysql = require('mysql'),
  config = rootRequire('./config/global.js'),
  connection;

// DB configuration
if (config.database.use === 'mongodb') {
  connection = mongoose.createConnection(config.database.mongoURL + 'WeTaxiMarketPlace');
  // connection.on('error', debug.bind(debug, 'connection error:'));
  connection.on('connected', function () {
    console.log('Mongoose connected to ' + config.database.mongoURL + 'WeTaxiMarketPlace');
  });

  connection.on('error', function (err) {
    console.log('Mongoose connection error' + err);
  });

  connection.on('disconnected', function () {
    console.log('Mongoose disconnected');
  });
} else if (config.database.use === 'mysql') {
  var pool = mysql.createPool(config.database.mySQLConfig);

  debug('Successfully connected with mysql');

  connection = function (sqlQuery, params, callback) {
    // get a connection from a pool request
    pool.getConnection(function (err, conn) {
      if (err) {
        callback(true);
        return;
      }
      // execute a query
      conn.query(sqlQuery, params, function (err, results) {
        conn.release();
        if (err) {
          callback(true);
          return;
        }
        callback(false, results);
      });
    });
  };
} else {
  debug('Failed to connect with db');
}

module.exports = connection;
