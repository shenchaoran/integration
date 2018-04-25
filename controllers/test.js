
// let geoDataDB  = require('../models/data.model');
let ObjectID = require('mongodb').ObjectID;
let Promise = require('bluebird');
let RequestCtrl = require('./request.controller');
let fs = Promise.promisifyAll(require('fs'));
let path = require('path');
let _ = require('lodash');
let VisualizationCtrl = require('./visualization.controller');
let DataCtrl = require('./data.controller');

let url = 'http://localhost:9990/integration/data/5adf5e23a21f3cd2f0a568cb';
RequestCtrl.getFile(url, path.join(__dirname, '1'));

// let fname;
// let ext;
// let newName = path.join(__dirname, new ObjectID().toString()) + '.zip';
// RequestCtrl.get(url, undefined, true)
//     .then(res => {
//         console.log(res.data.length);
//         let buf = Buffer.from(res.data, 'binary');
//         console.log(buf.length);
//         return fs.writeFileAsync(newName, buf)
//     })
//     .catch(e => {
//         console.log(e);
//     })

// DataCtrl.fetchData({
//     from: {
//         host: '172.21.213.146',
//         port: '8060',
//         posType: 'MSC',
//         id: 'gd_f901b180-47c4-11e8-b29e-2facd065bf06'
//     }
// });

// let stub = {
//     from: {
//         host: '172.21.212.85',
//         port: '8899',
//         posType: 'DSC',
//         id: '5adf21be54ca1f1070f1bc6c'
//     }
// };

// let url = `http://${stub.from.host}:${stub.from.port}/user/download?dataId=${stub.from.id}`;
// RequestCtrl.getFile(url);
// DataCtrl.fetchData(stub);

// VisualizationCtrl.batchDeploy();


// a=[1,2,3]
// _.map(a, item => {
//     new Promise((resolve, reject) => {
//         setTimeout(() => {
//             console.log(item)
//         }, 1000);;
//     });
// })

// let a = [1, 2, 3]
// _.map(a, (item, i) => {
//     console.log(item);
//     if(i === 1)
//         return false;
// })

// global.a = 1;
// console.log(global);

// RequestCtrl.post('http://localhost:8060/geodata?type=file', {
//     gd_tag: 'asdjflasdj',
//     myfile: fs.createReadStream(path.join(__dirname, 'task.controller.js'))
// }, 'File')
//     .then(v => {
//         v;
//     })
//     .catch(e => {
//         console.log(e);
//     })

// new Promise((resolve, reject) => {
//         return resolve(1)
//     })
//     .then(v => {
//         setTimeout(() => {
//             return Promise.resolve(2);
//         }, 1000);
//     })
//     .then(console.log)
//     .catch(e => {
//         console.log('e:', e)
//     });

// new Promise((resolve, reject) => {
//     return resolve(1);
// })
//     .then(a => {
//         return Promise.resolve(a);
//     })
//     .then(b => {
//         console.log(b);
//     })
//     .catch(console.log);

// geoDataDB.insert({
//     meta: {
//         name: 'test',
//         path: 'test',
//         desc: 'test'
//     },
//     auth: {}
// })
//     .then(console.log);