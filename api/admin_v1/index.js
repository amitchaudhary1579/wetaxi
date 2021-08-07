//Initialize all routers
module.exports = function (app, apiBase) {
    var auth = require('./routes/auth');
    app.use(apiBase, auth);
};
