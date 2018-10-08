let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');

let schema = {
    posType: String,   // LOCAL/MSC/DSC
    path: String,
    // desc: String,
    // id: String,         // id on MSC/DSC
    // pid: String,        // parent id on DSC
    fname: String
    // DSC: {
    //     _id: String,
    //     name: String,
    //     format: String,     // file/folder
    //     datatime: String,
    //     size: String,
    //     creator: String,
    //     parentid: String,   
    //     type: String,
    //     favoriteby: String
    // },
    // MSC: {
    //     gd_id: String,
    //     gd_tag: String,
    //     gd_datatime: String,
    //     gd_type: String,
    //     gd_size: String,
    //     gd_value: String,
    //     gd_fname: String
    // },
    // auth: mongoose.Schema.Types.Mixed
};
let collectionName = 'Geo_Data';
let geoDataDB = new Mongoose(schema, collectionName);

module.exports = geoDataDB;