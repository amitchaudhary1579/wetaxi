const config = rootRequire('config/global')
const redis = require('redis')

const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port
})

if(config.redis.enable) {
  client.on('connect', function () {
    console.log('Redis client connected');
  })
  
  client.on('error', function (err) {
    console.log('Something went wrong ' + err);
  })
}

// client.set('TESTKEY', 'my test value', (err, reply) => {
//   console.log(err, reply)
// })
// client.get('TESTKEY', function (error, result) {
//   if (error) {
//     console.log('\nTESTKEY', error);
//   }
//   console.log('GET result ->' + result);
// })


module.exports = client
