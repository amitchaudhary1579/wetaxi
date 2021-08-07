//Initialize all routers
module.exports = function(app, apiBase) {
    var auth = require('./routes/auth');
    require('./socketRoutes/').init(app, apiBase);
    app.use(apiBase, auth);
};