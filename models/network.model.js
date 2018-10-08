/**
 * Created by SCR on 2017/8/1.
 */
let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');

let schema = {
    modelServices:mongoose.Schema.Types.Mixed,
    dataServices:mongoose.Schema.Types.Mixed,
    networkInfo:mongoose.Schema.Types.Mixed,
    time:Number
};
let collectionName = 'Network';
let networkDB = new Mongoose(schema, collectionName);

module.exports = networkDB;