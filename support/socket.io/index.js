var debug = require('debug')('x-code:socket'),
	socketio = require('socket.io'),
	emitter = require('events').EventEmitter,
	config = rootRequire('config/global'),
	Mailer = rootRequire('support/mailer');


// create a new event
var em = new emitter();

var listen = function (server) {

	if (!server) {
		return;
	}

	if (config.socket && !config.socket.enable) {
		return;
	}

	var io = socketio.listen(server);
	// var io = socketio(server);
	// io.attach(server, {
	// 	pingInterval: 2000,
	// 	pingTimeout: 2000,
	// 	transports: ['polling'],
	// 	// transports: 'websocket'],
	// 	// cookie: false
	// });

	io.sockets.setMaxListeners(25);
	// io.on('connection', function(socket) {
	// 	debug('connection established!!!');
	// 	em.emit('io', io);
	// });

	setTimeout(function () {
		em.emit('io', io);
	}, 300);

};

// bind listen function to event
em.listen = listen;

module.exports = em;