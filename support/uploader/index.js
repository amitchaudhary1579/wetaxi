var debug = require('debug')('x-code:uploader'),
  config = rootRequire('config/global'),
  fs = require('fs'),
  fse = require('fs-extra'),
  path = require('path'),
  formidable = require('formidable'),
  gm = require('gm').subClass({
    imageMagick: true
  }),
  mkdirp = require('mkdirp'),
  AESCrypt = rootRequire('services/aes');

const _self = {

  getFormFields: function getFormFields(req, callback) {
    let form = new formidable.IncomingForm();
    console.log("form::::::::", form);
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;
    console.log("form::::::::", form);
    // store all uploads in the /uploads directory
    form.uploadDir = path.join(rootPath, '/uploads/tmp');
    console.log("form::::::::", form);
    // create a directory
    fse.mkdirs(form.uploadDir, function (err) {
      if (err) {
        console.log("error:::::::::::", err);
        return callback(err, null, null);
      }

      // log any errors that occur
      form.on('error', function (err) {
        console.log("error:::::::::::", err);
        debug('An error has occured: \n' + err);
      });

      // once all the files have been uploaded, send a response to the client
      form.on('end', function (err) {
        console.log("error:::::::::::", err);
        debug('An error has occured: \n' + err);
      });
      // parse the incoming request containing the form data
      form.parse(req, function (err, fields, files) {
        console.log("form::::::::", err, fields, files);
        // skip to decode code for web request for development
        if (req.sourceOfRequest == 'web') {
          console.log("error:::::::::::", err);
          return callback(err, fields, files);
        }

        // skip to decode code
        if (!config.cryptoEnable) {
          console.log("error:::::::::::", err);
          return callback(err, fields, files);
        }

        // check data is encoded or not
        if (!fields || (fields && !fields.encoded)) {
          return callback(true);
        }

        try {
          var dec = AESCrypt.decrypt(fields.encoded);
          fields = JSON.parse(dec);
          console.log(fields, files);
        } catch (err) {
          return callback(true);
        }

        callback(err, fields, files);
      });
    });
  },

  // upload: function upload(options, callback) {
  //     fse.mkdirs(path.dirname(options.dst), function (err) {
  //         if (err) {
  //             return callback(err);
  //         }
  //         gm(options.src)
  //             .resize(options.width || 240, options.height || 240)
  //             .noProfile()
  //             .write(options.dst, callback);
  //     });
  // },

  thumbUpload: function upload(options, callback) {
    fse.mkdirs(path.dirname(options.dst), function (err) {
      if (err) {
        return callback(err);
      }
      gm(options.src)
        .resize(options.width || 240, options.height || 240)
        .noProfile()
        .write(options.dst, callback);
    });
  },

  largeUpload: function upload(options, callback) {
    fse.mkdirs(path.dirname(options.dst), function (err) {
      if (err) {
        return callback(err);
      }
      gm(options.src)
        .noProfile()
        .write(options.dst, callback);
    });
  },

  uploadVideo: function uploadVideo(options, callback) {
    fse.mkdirs(path.dirname(options.dst), function (err) {
      if (err) {
        return callback(err);
      }

      fse.copy(options.src, options.dst, err => {
        if (err) return callback(err);
        callback();
      });
    });
  },

  remove: function remove(options, callback) {
    fse.remove(options.filepath, callback);
  }
};

module.exports = _self;
