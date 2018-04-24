/**
 * Created by SCR on 2017/6/29.
 */
let setting = require('../config/setting');
let solutionDB = require('../models/solution.model');

let express = require('express');
let router = express.Router();
module.exports = router;

router.route('/')
    .get((req, res, next) => {
        return res.render('integration/solutionLibrary');
    })
    .delete(function(req, res, next) {
        let _id = req.body._id;
        if(_id) {
            solutionDB.remove()
                .then(rst => {
                    return res.json({
                        error: null,
                        result: rst
                    });
                })
                .catch(next);
        }
        else {
            return res.end('invalid solution id');
        }
    })
    .post(function(req, res, next) {
        let isSaveAs = req.query.isSaveAs;
        let solution = req.body;
        isSaveAs = parseInt(isSaveAs);
        solutionDB.save(solution, isSaveAs)
            .then(id => {
                return res.json({
                    error: null,
                    _id: id
                });
            })
            .catch(next);
    });

router.route('/new')
    .get((req, res, next) => {
        return res.render('integration/solution');
    });

// edit solution
// solution detail
// configure solution
router.route('/:ac')
    .get(function(req, res, next) {
        let ac = req.params.ac;
        if (ac == 'edit' || ac == 'configure' || ac == 'detail') {
            let ejsFile = null;
            if (ac == 'edit') {
                ejsFile = 'integration/solution';
            } else if (ac == 'detail' || ac == 'configure') {
                ejsFile = 'integration/task';
            }
            let solutionID = null;
            if (ac == 'configure') {
                solutionID = req.query.solutionID;
            } else {
                solutionID = req.query._id;
            }
            if (!solutionID || solutionID == undefined) {
                return res.render('integration/task', {
                    solution: '',
                    solutionName: 'query error!'
                });
            }
            solutionDB.findOne({_id: solutionID})
                .then(doc => {
                    if (doc && doc != undefined) {
                        return res.render(ejsFile, {
                            solution: JSON.stringify(doc),
                            solutionName: doc.solutionInfo.name
                        });
                    } else {
                        return res.render(ejsFile, {
                            solution: '',
                            solutionName: 'query error!'
                        });
                    }
                })
                .catch(next);
        } else {
            return next();
        }
    });


router.route('/:id')
    .get(function(req, res, next) {
        let _id = req.params.id;
        let isComplete = req.query.isComplete;
        if (!_id || _id == undefined) {
            return res.end(JSON.stringify({ error: 'Can\'t find this solution!' }));
        }
        if (!isComplete || isComplete == undefined) {
            return res.end(JSON.stringify({ error: 'Please specify the "isComplete" field!' }));
        }
        if (_id == 'all' && isComplete == 'false') {
            solutionDB.getReducedDocs()
                .then(docs => {
                    return res.json({
                        error: null,
                        solutionsSegment: docs
                    });
                })
                .catch(next);
        }
    });