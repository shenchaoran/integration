let express = require('express');
let router = express.Router();
module.exports = router;

let networkRoute = require('./networkRoute');
let visualRoute = require('./visualization');
let dataRoute = require('./data.route');
let slnRoute = require('./solution.route');
let taskRoute = require('./task.route');
let userRoute = require('./user.route');

router.use('/integration/data', dataRoute);
router.use('/integration/solution', slnRoute);
router.use('/integration/task', taskRoute);
router.use('/integration/network', networkRoute);
router.use('/visualizations', visualRoute);
router.use('/user', userRoute);


router.route('/index')
    .get((req, res, next) => {
        return res.render('shared/index');
    });

// router.route('*')
//     .get((req, res, next) => {
//         return res.redirect('/index');
//     });