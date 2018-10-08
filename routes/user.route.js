let express = require('express');
let router = express.Router();
let UserCtrl = require('../controllers/user.controller');

module.exports = router;

router.route('/signin')
    .post((req, res, next) => {
        if (req.body.username && req.body.password) {
            let user = {
                username: req.body.username, 
                password: req.body.password
            };
            UserCtrl.signin(user)
                .then(rst => {
                    return res.json(rst);
                })
                .catch(next);
        } else {
            return res.json({
                error: 'invalid request'
            })
        }
    });

router.route('/signup')
    .post((req, res, next) => {
        if (req.body.username && req.body.password && req.body.email) {
            let user = {
                username: req.body.username, 
                password: req.body.password,
                email: req.body.email
            };
            UserCtrl.signup(user)
                .then(rst => {
                    return res.json(rst);
                })
                .catch(next);
        } else {
            return res.json({
                error: 'invalid request'
            })
        }
    });

router.route('/find-psw')
    .post((req, res, next) => {
        
    });