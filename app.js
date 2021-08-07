global.rootRequire = function (name) {
    return require(__dirname + '/' + name);
};
global.rootPath = __dirname;

require('dotenv').config();

var debug = require('debug')('x-code:app'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),

    expressValidator = require('express-validator'),
    app = express(),
    initAPISVersions = require('./api/index.js'),
    staticRoutes = require('./routes/index.js');

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator({
    customValidators: {
        gte: function (param, num) {
            return param >= num;
        }
    }
}));

app.use(cookieParser());

// var cors = require('cors')

// app.use(cors())

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Origin', "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name, user-access-token, authorization");
    res.header('Access-Control-Allow-Methods', "POST, GET, PUT, DELETE, OPTIONS");
    if (req.method == 'OPTIONS') {
        return res.status(200).json({});
    } else {
        next();
    }

});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/dist/datta-able-v7.2.2')));

// socket webview api initialize
app.use('/socket', staticRoutes);
app.use('/',initAPISVersions)

/**
* Error Handlers Methods
**/

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler - will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler - no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// handle all exceptions
// process.on('uncaughtException', function (err) {
//   debug('Uncaught Exception: '+err);
// });

module.exports = app;
