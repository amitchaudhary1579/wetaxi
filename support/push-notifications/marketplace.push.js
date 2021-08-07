/* eslint-disable no-useless-catch */
const FCM = require('fcm-node')
const serverConfig = require('../../config/global').marketPlaceFCMConfig
const fcm = new FCM(serverConfig)

exports.sendNotification = (data , cb) => {
  try {
    if (data.deviceToken === null || data.deviceToken === undefined || data.deviceToken === '') return

    const icon = 'https://www.pinclipart.com/picdir/big/86-862588_mobi-food-logo-gif-clipart.png'
    let message

    if (data.deviceType === 'ios') {
      message = {
        to: data.deviceToken,
        notification: {
          title: data.title,
          body: data.body
        },
        data: {
          orderId: '' + data.orderId
        }
      }
    } else if (data.deviceType === 'web') {
      message = {
        to: data.deviceToken,
        notification: {
          title: data.title,
          body: data.body,
          icon: icon
        },
        data: {
          title: data.title,
          message: data.body,
        //   clickAction: `http://localhost:3000/${data.clickAction}`,
          icon: icon
        }
      }
    } else {
      message = {
        to: data.deviceToken,
        notification: {
          title: data.title,
          body: data.body
        },
        data: {
          orderId: '' + data.orderId
          // chefId: data.chefId || "",
        }
      }
    }

    fcm.send(message, async err => {
      if (err) {
        console.log('Error in Notification : ', err)
        return  cb(err, null);
      }
      return cb(null , true);
      // eslint-disable-next-line new-cap
      
    })
  } catch (error) {
    throw error
  }
}
