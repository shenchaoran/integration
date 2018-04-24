import { geoDataDB, GeoDataClass } from '../models/UDX-data.model';
import * as Promise from 'bluebird';
let debug = require('debug');
let initDebug = debug('Integration: Init');
import * as mongoose from 'mongoose';

let initData = (data: GeoDataClass): Promise<any> => {
    return new Promise((resolve, reject) => {
        geoDataDB.find(data._id)
            .then(docs => {
                if (docs.length >= 1) {
                    initDebug('Init data succeed!' + data._id);
                    return resolve();
                } else {
                    geoDataDB.insert(data)
                        .then(rst => {
                            initDebug('Init data succeed!' + data._id);
                            return resolve();
                        })
                        .catch(err => {
                            initDebug(err);
                            return reject(err);
                        });
                }
            })
            .catch(err => {
                initDebug(err);
                return reject(err);
            });
    });
};


// let datas = [
//     {
//         _id?: mongoose.Types.ObjectId(),
//         gdid: '',
//         filename: '',
//         path: '',
//         permission: 'public',
//         userId: 'Admin'
//     }
// ];

// Promise.all()