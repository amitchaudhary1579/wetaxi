const debug = require('debug')('x-code:v10:socketRoutes')
const socketioJwt = require('socketio-jwt')

const config = rootRequire('config/global')
const SocketIO = rootRequire('support/socket.io')
const DecodeSocketRequestPolicy = require('../policies/decodeSocketRequest.js')
const SocketLoggedInPolicy = require('../policies/isSocketLoggedIn.js')

const passengerRoute = require('./passenger')
const driverRoute = require('./driver')

exports.init = function (app, apiBase='/v11') {
   
    SocketIO.on('io', function (io) {
        console.log('init socket route here'); 
        var nsp = io.of('')// apiBase + '/GoGoTaxi')

        nsp.use( (socket, next) => {
            console.log('hereh in socket ');
            next();
        }
        )
        nsp.use(
            socketioJwt.authorize({
                secret: config.secret,
                handshake: true
            })
        )

        nsp.on('connection', function (socket) {
            

            console.log('inconnection',socket.decoded_token);
            if (!socket.decoded_token) {
                socket.disconnect()
            } else {
                SocketLoggedInPolicy(socket, nsp, io)
            }
            socket.userInfo = socket.decoded_token
            console.log('userInfo',socket.userInfo);
            // to decode request parameters
            socket.use(DecodeSocketRequestPolicy)
            
            driverRoute(socket, nsp, io)
            passengerRoute(socket, nsp, io)

            socket.on('disconnect', () => {
                console.log('heree');
              debug('disconnect', socket.id)
            })

            socket.on('logout', (data) => {
                debug('logout for testing', data)
                socket.to(data.socket_id).emit('server-logout-forcefully', { status: 1, message: 'User logout successfully' })
            })
            return 'connect success';
        })
    })

}