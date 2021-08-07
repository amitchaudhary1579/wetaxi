const passengerCtrl = require('../socketControllers/passengerCtrl')

module.exports = (socket, nsp, io) => {
    passengerCtrl.connect(socket, nsp, io)
    socket.on('disconnect', passengerCtrl.disconnect(socket, nsp, io))
    socket.on('search-cars', passengerCtrl.searchCars(socket, nsp, io)) //check
    socket.on('update-passenger-location', passengerCtrl.updateLocation(socket, nsp, io)) //check
    socket.on('search-car-on-request-ride', passengerCtrl.searchCarOnRequestRide(socket, nsp, io)) //check
    socket.on('passenger-get-receipt', passengerCtrl.getReceipt(socket, nsp, io))
    socket.on('passenger-cancel-ride', passengerCtrl.cancelRide(socket, nsp, io))
    socket.on('passenger-ride-rate', passengerCtrl.rideRate(socket, nsp, io))
    //  socket.on('check-current-ride-request', passengerCtrl.checkCurrentRideRequest(socket, nsp, io))
}