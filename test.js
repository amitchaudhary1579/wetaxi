const io = require('socket.io-client');
const socket = io("http://localhost:6025/v11/GoGoTaxi", {
    // path : '',
    query: `token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDA1MjcwZmM1NjgyNjUzNDIxMWVhNGYiLCJlbWFpbCI6ImFiZGVhbGkwMDlAZ21haWwuY29tIiwiZGV2aWNlVG9rZW4iOiJxd2VydHl1aW9wMTIzNDU2Nzg5MCIsInR5cGUiOiJwYXNzZW5nZXIiLCJpYXQiOjE2MTQxNTAzMjB9.g5k6Zwno13hIw11NOD7e7XkNmw9mbeMES93mRhhGipg`
});
var message = '["Hello test"]'
socket.on('connect', (data) => {
    console.log("Connection successfull", data)
    socket.emit('search-cars', {lat:22.322872233654177, long:73.18681119741495} , (data) => {console.log(data)})    
})
