let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');
let ObjectID = require('mongodb').ObjectID;
let Promise = require('bluebird');
let _ = require('lodash');
var moment = require('moment');

let schema = {
    username: String,
    password: String,
    email: String,
    avatar: String
};
let collectionName = 'User';
let userDB = new Mongoose(schema, collectionName);

module.exports = userDB;