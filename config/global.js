module.exports = {
  PORT: process.env.PORT,

  apiHost:
    process.env.API_URL + ":" + process.env.PORT + "/" + process.env.VERSION,

  database: {
    mongoURL: process.env.MONGO_URL || "mongodb://localhost:27017/",
    mySQLConfig: {
      connectionLimit: 10, // Max. connection limit
      host: "localhost", // DB Hostname
      user: "root", // DB username
      password: "", // DB Password
      database: "gogotaxi" // DB name
    },
    use: "mongodb" // specify db =>  mongodb , mysql
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    enable: true
  },

  jwtTokenVerificationEnable: true, // true/false

  secret: "##GoGoTaxi**", // jwt secret key

  cryptoEnable: false, // To enable this method
  cryptoKey: "xCode2017@!secureAcc$ess", // Secret encryption key
  cryptoIV: "a2xhcgAAAAAAAAAA", // Secret encryption IV

  socket: {
    enable: true
  },

  mailOptions: {
    host: "smtp.1and1.com", //HOST name
    secureConnection: false, // use SSL
    port: 587, // port for secure SMTP
    auth: {
      user: "vijay.pampaniya@agileinfoways.com",
      pass: "Vijay@1029"
    }
  },
  baseUrl: 'http://3.25.2.201:6025/',
  newMailOptions: {
    email: 'kush@solulab.co',
    pass: 'keptain@1234'
  },
  // 'redis': {
  //     'host': '192.168.2.209',
  //     'port': 6379,
  //     'enable': true
  // },

  notification: {
    // Push Notificatoin
    enable: true, // enable/disable notification
    // driverAndroidApiKey: "AIzaSyCc_EUtb3S2ZG7rqbyfg5fiJoj2oNM0-g0", // driver android api key
    driverAndroidApiKey: 'AAAAfmScU8c:APA91bEHBI0NSiUCqh1Twwf1Zt8xH8AUw3Hf7NqvJCd7VUok6ULIrykWVdWe-ajZzhFAInQzNNo1ak95_dIx9_Go4GBVFyBl6uJoeNpbj6-FKg_vK-cGXlLMjfF4c7WsL2aAYxn5_nxt',
    passengerAndroidApiKey: "AAAAWZoWbmo:APA91bGSmFUDDPJiobN2WAyfCDBV7UPx5fIFQizsAQ29qAYtRzYFMY0a76XItLgiBGyXPU6OR6B9niDQ3iG-_BQnC194pL7l3J02v91E9HBFVdmZ9W0j2njM34IwFIsD_DnlgV-9NPx6"   // "AIzaSyD0AuHjDvxXnk7faDEoum6Dp62ahttAoxc" // passenger android api key
  },
  accountSid: 'AC6dfc7c013035ffa8c87db2da94430524',
  authToken: '45545465dec174636092496ab10534d8',
  trailNumber: "+18146342124",
  jwtTokenExpiryTime: 60 * 60 * 72,  //(72 hours) ,
  marketPlaceFCMConfig: {
    type: 'service_account',
    project_id: 'wetaxi-marketplace',
    private_key_id: '752f90859423db492151ef46d59ec031622d9648',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC254kaZxCl8oM1\nANKkh0hzikUkpxtICywpsX8JZa4kKKNoGO5Buy4nsFbdYO8lAJILc2ubHyjsYzAN\nGiljN+4p/WaLJPD9cfOWbZa7M9tOZ41EYdLwYFs0656VhdR9TgHjodG1O0EWGSxe\nUjcqOfL5PsgaL/L+nIA2zs86A6k3/qJWsNcWb9Xp0Q+x6ySD7UDYfI5S144T+MuQ\nj8NepdDKg20eltFC/xUWD1By85e8bZMETigrYxXmmiC6iM8M98U2oLzaF0s/02dz\nlv+9BEz7SqpochewH7EB2jYwuaxiuRYxydS/9XJIJmGviPPlJGsmkWGLpgscIuMO\nGPz2riqdAgMBAAECggEAIC0BEHT7F8Ze0I8xfyIRW8oCOd1vzi+w+DCyYWvSw6em\nf2SLXWLZTsAVt+Iaj87W4k7Oqj5EC7mzNUrZ5wtqyVY7mNTJ1DwcluT2dD4+IT/U\nOShgXEsHIHsmrbUaWWTErk/EPXaMD6AkDv+1lqcVGEW0G+89dw7++yVMjS8hsKi8\nuN6HoWe2/1h+3q5BHgz21mgNWBtuXmJ0RAgXed2CAkbtuLl9l1YRN0UEP7CuSa44\nDIGCB4XpoTcOAZGmZOOqIIEEQqrsLMCTrL5p/gtXfIGx8/avSb/m5dwNOG2MWBIn\nkpPH42kur7fpMHYDgIYjO4QSD8sZ3cD0hchFXNiNfQKBgQD93zd/eGpOpaSobqkG\n3KLtcivyHzfsZ/nK8jXQGXcnThuEJmdubVqCUDTOOcfUJ6reHW4jBTLwIQTcnKj6\nsIj+Crr9mCRiTXtCOazsnhsC8sHyh/7Z/3wX+FWy32SC/8a5yBk27Hlu1eQOZN2H\n5flK+fLriilQSB5qz2K2ajhhNwKBgQC4cAeet/5eleu87Ns5EdmHCjvU+dn5sjH4\nagdb7Dra9pQZB01J/brxjtjPQjAMzgQEZsNGbknhLZkDh/RkXrJCHbpAw3GR7tdq\nDeFPQ3ms+0vBdGMXqmUwDs2yzaQEKErmVVH4D/27cCiXioxst7LvpGKmgRhTsJUb\nKv+o0ymMywKBgB9+S2Iyy+1Juy1x3OIPCN8v5Ke6m7NmCqTUezx/jDqCBAPWx8n5\nIts7m/FhVZrJ+PZo7DrH8FO9pN7BSG0g7T2mkx/Wed0AA6RphzwrOOqattihakoc\n2YYXtnnkIJHnrP1rB0W6/C11tz7Z4Gl1bAGTFEGH+CwPZkaVx4cdkjTtAoGAcDlS\nmaPw9hKZBzLDzXzr9Dwo3dVNaZ6gwzuY0LjzsuoYgQYtZBksV/EIQUxPumrcjOUO\natuOvqIlGb3u2ee45Xv7KY8Cmr5OeqyJbNZswfGCTesIpIy81zoatXJlG1Z9BJvj\nrWHljNiZCmR2P2yjRyeqExA4AixO/eHzAAHEpXMCgYEA40y3Q3eGfUxOCGbSplEe\nUMpvLVNUMRipOb1LTE7P4+BWNsP+3z9OaJ2FIeBg/Hb7GwzRiTzu7du+hn+VyWQM\nJRoI0x2SkV617Vx+tUyGC/nz6lOnxUPcsrUBgbN6UXb7urx4EQkOo5wVAAdzbx7b\nsIGEfQpg6XxZYkdE9Oj9pyM=\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-ogvn6@wetaxi-marketplace.iam.gserviceaccount.com',
    client_id: '117029176794997538683',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ogvn6%40wetaxi-marketplace.iam.gserviceaccount.com',

  }
};
