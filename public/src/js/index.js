/**
 * Created by SCR on 2017/7/9.
 */
/*jshint esversion: 6 */
var Util = require('./util');
// var MSAggreJS = null;
var CanvasJS = null;
var SolutionLibraryJS = null;
var TaskListJS = null;
var SolutionJS = null;
var NetworkJS = null;
var VisualJS = null;
var VisualDetailJS = null;

NetworkJS = require('./NetworkJS');
CanvasJS = require('./CanvasJS');
SolutionLibraryJS = require('./SolutionLibraryJS');
TaskListJS = require('./TaskListJS');
SolutionJS = require('./SolutionJS');
VisualJS = require('./VisualLibJS');
VisualDetailJS = require('./VisualDetailJS');

$().ready(function() {

    // 通用方法
    for (var key in Util) {
        window[key] = Util[key];
    }

    var url = location.pathname;
    var solution = null;
    var task = null;

    // // 用到的才加载，不然会变慢
    // if (url.indexOf('integration/network') != -1) {
    //     NetworkJS = require('./NetworkJS');
    // } else if (url.indexOf('/integration/solution') != -1 || url.indexOf('/integration/task') != -1) {
    //     // MSAggreJS = require('MSAggreJS');
    //     CanvasJS = require('./CanvasJS');
    //     SolutionLibraryJS = require('./SolutionLibraryJS');
    //     TaskListJS = require('./TaskListJS');
    //     SolutionJS = require('./SolutionJS');
    // } else if (url.indexOf('visualization') != -1) {
    //     VisualJS = require('./VisualLibJS');
    // } else if (url.indexOf('visualization/detail') != -1) {
    //     VisualDetailJS = require('./VisualDetailJS');
    // }

    if (url == '/integration/solution/new') {
        $('#saveas-solution-tool').remove();
        CanvasJS.init('edit', 'solution');

        SolutionJS.init();

        // new Promise((resolve, reject)=> {
        //     MSAggreJS.getALLMS((err, mss)=> {
        //         if(err){
        //             reject(err);
        //         }
        //         else{
        //             resolve(mss);
        //         }
        //     });
        // })
        //     .then((mss)=> {
        //         return new Promise((reject)=> {
        //             MSAggreJS.buildMSListModal(mss, false, (err) => {
        //                 if(err){
        //                     reject(err);
        //                 }
        //             });
        //         });
        //     })
        //     .catch((err)=> {
        //         var errMsg = '<pre>'+JSON.stringify(err,null,4)+'</pre>';
        //         $.gritter.add({
        //             title: '警告：',
        //             text: errMsg,
        //             sticky: false,
        //             time: 2000
        //         });
        //         return;
        //     });
    } else if (url == '/integration/solution') {
        SolutionLibraryJS.init();
    } else if (url == '/integration/solution/detail') {
        CanvasJS.init('view', 'solution');

        solution = $('#solution-detail').text().slice(1, -1);
        if (!solution || solution == '') {
            $.gritter.add({
                title: 'Warning:',
                text: 'Can\'t find this solution',
                sticky: false,
                time: 2000
            });
            return;
        }
        solution = JSON.parse(solution);

        CanvasJS.initImport('SOLUTION', solution);
        CanvasJS.importSolution();
    } else if (url == '/integration/solution/edit') {
        CanvasJS.init('edit', 'solution');

        solution = $('#solution-detail').text().slice(1, -1);
        if (!solution || solution == '') {
            $.gritter.add({
                title: 'Warning:',
                text: 'Can\'t find this solution',
                sticky: false,
                time: 2000
            });
            return;
        }
        solution = JSON.parse(solution);

        SolutionJS.importLayoutBySolution(solution);
        // MSAggreJS.importLayoutBySolution(solution);
        CanvasJS.initImport('SOLUTION', solution);
        CanvasJS.importSolution();
        $('#toggle-model-node-sidebar-btn').click();
        $('#toggle-cart-sidebar-btn').click();
    } else if (url == '/integration/task') {
        TaskListJS.init();
    } else if (url == '/integration/task/new') {
        $('#saveas-task-tool').remove();
        CanvasJS.init('configure', 'task');

        solution = $('#solution-detail').text().slice(1, -1);
        if (!solution || solution == '') {
            $.gritter.add({
                title: 'Warning:',
                text: 'Can\'t find this solution',
                sticky: false,
                time: 2000
            });
            return;
        }
        solution = JSON.parse(solution);

        CanvasJS.initImport('SOLUTION', solution);
        CanvasJS.importSolution();
    } else if (url == '/integration/task/detail') {
        CanvasJS.init('view', 'task');

        task = $('#task-detail').text().slice(1, -1);
        if (!task || task == '') {
            $.gritter.add({
                title: 'Warning:',
                text: 'Can\'t find this solution',
                sticky: false,
                time: 2000
            });
            return;
        }
        task = JSON.parse(task);

        CanvasJS.initImport('TASK', task);
        CanvasJS.importTask();
    } else if (url == '/integration/task/edit') {
        CanvasJS.init('configure', 'task');

        task = $('#task-detail').text().slice(1, -1);
        if (!task || task == '') {
            $.gritter.add({
                title: 'Warning:',
                text: 'Can\'t find this solution',
                sticky: false,
                time: 2000
            });
            return;
        }
        task = JSON.parse(task);

        CanvasJS.initImport('TASK', task);
        CanvasJS.importTask();
    } else if (url == '/integration/network/new') {
        NetworkJS.init();
    } else if (url == '/visualizations') {
        VisualJS.init();
    } else if (url.indexOf('/visualizations/') !== -1) {
        VisualDetailJS.init();
    }

});