import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';

import * as RequestCtrl from '../controllers/request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
let debug = require('debug');
let initDebug = debug('Integration: Init');

export let connect2MSC = (): Promise<any> => {
    let url = APIModel.getAPIUrl('connector');
    return new Promise((resolve, reject) => {
        RequestCtrl.getByServer(url, undefined)
            .then(response => {
                initDebug('Connected to MSC succeed!');
                return resolve('connect2MSC');
            })
            .catch(error => {
                initDebug('Connected to MSC failed!');
                return reject(error);
            });
    });
};
