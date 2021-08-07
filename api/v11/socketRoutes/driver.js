const driverCtrl = require('../socketControllers/driverCtrl')

module.exports = (socket, nsp, io) => {
    driverCtrl.connect(socket, nsp, io)
    socket.on('update-driver-location', driverCtrl.updateLocation(socket, nsp, io)) //check
    socket.on('accept-ride', driverCtrl.acceptRide(socket, nsp, io)) //check
    socket.on('reject-ride', driverCtrl.rejectRide(socket, nsp, io)) //check
    socket.on('cancel-ride', driverCtrl.cancelRide(socket, nsp, io)) //check
    socket.on('get-new-ride-request', driverCtrl.getNewRideRequest(socket, nsp, io)) //check
    socket.on('arrive-ride', driverCtrl.arriveRide(socket, nsp, io)) //check
    socket.on('start-ride', driverCtrl.startRide(socket, nsp, io)) //check
    socket.on('complete-ride', driverCtrl.completeRide(socket, nsp, io)) //check
    socket.on('driver-cash-paid', driverCtrl.cashPaid(socket, nsp, io)) //check
    socket.on('driver-get-receipt', driverCtrl.getReceipt(socket, nsp, io))
    socket.on('driver-ride-rate', driverCtrl.rideRate(socket, nsp, io))
    socket.on('disconnect', driverCtrl.disconnect(socket, nsp, io))
}