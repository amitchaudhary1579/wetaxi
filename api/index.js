//Initalize all api versions


const express = require('express');
const adminRouter = require('./admin_v1/routes/auth');
const vehicleOwnerRouter = require('./admin_v1/routes/vehicleOwnerRoutes');
const promoterRoute = require('./admin_v1/routes/promoterRoutes')
const v11= require('./v11/routes/auth');
require('./v11/socketRoutes/').init();

// const promoCodeRouter = require('./promocode');

const router = express.Router();

// / GET home page. /
router.use('/admin_v1', adminRouter);
router.use('/v11', v11);

router.use('/Vo', vehicleOwnerRouter);
router.use('/promoter', promoterRoute);

module.exports = router;

