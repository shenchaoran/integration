/**
 * Created by SCR on 2017/7/9.
 */
/*jshint esversion: 6 */
var ObjectID = require('bson-objectid');
var io = require('socket.io-client');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var _ = require('lodash');

var CanvasJS = (() => {
    // region private
    var __STATES_WIDTH = 115;
    var __STATES_HEIGHT = 70;
    var __DATA_RADIUS = 33;

    // var __STATES_WIDTH = 135;
    // var __STATES_HEIGHT = 90;
    // var __DATA_RADIUS = 43;

    var __translateX = null;
    var __translateY = null;

    var __tempNodeA = null;
    var __tempNodeZ = null;
    var __beginNode = null;
    var __tempLink = null;

    const StatesColor = {
        unready: '#60A7FF',
        pending: '#A3D39B',
        pause: '#ff75c9',
        running: '#ffee58',
        collapsed: '#e0412b',
        succeed: '#41EB4A'
    };
<<<<<<< HEAD
    
=======
>>>>>>> 600a93a41288b63d1f039317a613dae209f7b7e9

    // 包括角色和状态
    const EventColor = {
        ready: '#ffee58',
        pending: '#A3D39B',
        received: '#41EB4A',
        failed: '#e0412b',
        // mid: '#3AEB7C',
        origin: '#60A7FF',
        optional: '#9bc8ff',
        input: '#FF8034'
        // output: '#3AEB7C'
    };

    const SolutionColor = {
        link: StatesColor.unready,
        manualLink: '#0949ff',
        event: EventColor.origin,
        states: StatesColor.unready,
        optional: EventColor.optional
    };

    // 数据角色和状态
    const DataState = {
        // unready: 'UNREADY',              // DataState表示的是已经上传过的数据的状态，没有 unready这一种
        ready: 'READY', // 准备好，表示初始状态，将要分发的状态，before dispatch
        pending: 'PENDING', // 正在传输 dispatching
        received: 'RECEIVED', // 计算节点接受成功 after dispatch
        failed: 'FAILED' // 计算节点接受失败 failed
        // mid: 'MID',                      // 计算中间产物
        // result: 'RESULT'                 // 输出数据的状态，是最终计算结果数据（没有流向下个模型） is result
        // used: 'USED'                     // 模型已经跑完，使用过该数据 is used
    };

    const TaskState = {
        configured: 'CONFIGURED',
        collapsed: 'COLLAPSED',
        end: 'END',
        finished: 'FINISHED',
        running: 'RUNNING',
        pause: 'PAUSE'
    };

    const MSState = {
        unready: 'UNREADY', // 初始状态，前台创建task时默认是这种
        pending: 'PENDING', // 正在发送运行指令
        pause: 'PAUSE', // 允许用户给准备好的模型打断点
        running: 'RUNNING', // 现在默认准备好数据就开始运行
        collapsed: 'COLLAPSED', // 运行失败，两种情况：调用出错；运行失败
        finished: 'FINISHED' // 运行成功且结束
    };

    const __font = '12px 微软雅黑';

    const __lineHeight = 12;

    var __getRGB = function (color) {
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var hex2RGB = function (hexStr) {
            var sColor = hexStr.toLowerCase();
            if (sColor && reg.test(sColor)) {
                if (sColor.length === 4) {
                    var sColorNew = '#';
                    for (var i = 1; i < 4; i += 1) {
                        sColorNew += sColor
                            .slice(i, i + 1)
                            .concat(sColor.slice(i, i + 1));
                    }
                    sColor = sColorNew;
                }
                //处理六位的颜色值
                var sColorChange = [];
                for (let i = 1; i < 7; i += 2) {
                    sColorChange.push(parseInt('0x' + sColor.slice(i, i + 2)));
                }
                return 'RGB(' + sColorChange.join(',') + ')';
            } else {
                return sColor;
            }
        };
        var rgbStr = hex2RGB(color);
        var group = rgbStr.match(/RGB\((.+)\)/);
        return group[1];
    };

    var __showContextMenu = function (type) {
        var id = null;
        if (type == 'STATES') {
            id = 'stateContextMenu';
        } else if (type == 'INPUT' || type == 'OUTPUT' || type == 'CONTROL') {
            id = 'eventContextMenu';
        } else if (type == 'STAGE') {
            id = 'stageContextMenu';
        }
        $('#' + id)
            .css({
                // top:event.layerY + (+$(event.target).parent().css('padding-left').replace('px','')),
                // left:event.layerX + (+$(event.target).parent().css('padding-top').replace('px',''))
                top: event.clientY,
                left: event.clientX
            })
            .show();
    };

    var __hideContextMenu = function () {
        $('.contextMenu li').hide();
        $('.contextMenu').hide();
    };

    var __getEventDetail = function (
        __serviceType,
        __stateID,
        __eventName,
        __MSID,
        serviceList
    ) {
        var service = null;
        for (var i = 0; i < serviceList.length; i++) {
            if (serviceList[i]._id == __MSID) {
                service = serviceList[i];
                break;
            }
        }
        if (!service) return null;
        if (__serviceType == 'model') {
            let mdl = service.MDL;
            let datasetItemList =
                mdl.ModelClass.Behavior.RelatedDatasets.DatasetItem;
            let states = mdl.ModelClass.Behavior.StateGroup.States.State;
            let state = null;
            let event = null;
            if (states instanceof Array) {
                for (let m = 0; m < states.length; m++) {
                    if (states[m]._$.id == __stateID) {
                        state = states[m];
                    }
                }
            } else {
                if (states._$.id == __stateID) {
                    state = states;
                }
            }
            var events = state.Event;
            if (events instanceof Array) {
                for (var j = 0; j < events.length; j++) {
                    if (events[j]._$.name == __eventName) {
                        event = events[j];
                        break;
                    }
                }
            } else {
                if (events._$.name == __eventName) {
                    event = events;
                }
            }
            var datasetReference = null;
            if (event._$.type == 'response') {
                if (typeof event.ResponseParameter != 'undefined') {
                    datasetReference =
                        event.ResponseParameter._$.datasetReference;
                } else if (typeof event.ControlParameter != 'undefined') {
                    datasetReference =
                        event.ControlParameter._$.datasetReference;
                }
            } else if (event._$.type == 'noresponse') {
                datasetReference = event.DispatchParameter._$.datasetReference;
            }

            // var schema = null;
            // if(datasetItemList instanceof Array){
            //     for(var k=0;k<datasetItemList.length;k++){
            //         if(datasetItemList[k]._$.name == datasetReference){
            //             schema = datasetItemList[k];
            //             break;
            //         }
            //
            //     }
            // }
            // else {
            //     if(datasetItemList._$.name == datasetReference){
            //         schema = datasetItemList;
            //     }
            // }
            var schema = __getSchema(service.MDLStr, datasetReference);
            return {
                schema: schema,
                event: event
            };
        } else if (
            __serviceType == 'data map' ||
            __serviceType == 'data refactor'
        ) {
            let schema = null;
            let event = null;
            let datasetReference = null;
            let States = service.CDL.StateGroup.States;
            let SchemaGroup = service.CDL.SchemaGroup;
            for (let i = 0; i < States.length; i++) {
                if (States[i].id == __stateID) {
                    for (let j = 0; j < States[i].Events.length; j++) {
                        if (States[i].Events[j].name == __eventName) {
                            event = States[i].Events[j];
                            datasetReference =
                                States[i].Events[j].datasetReference;
                            break;
                        }
                    }
                    break;
                }
            }
            if (datasetReference != null) {
                for (let i = 0; i < SchemaGroup.length; i++) {
                    if (SchemaGroup[i].name == datasetReference) {
                        schema = SchemaGroup[i].schema;
                        break;
                    }
                }
            }
            return {
                schema: schema,
                event: event
            };
        }
    };

    // 返回states的信息和attributeset信息
    var __getServiceDetail = function (__serviceType, __MSID, serviceList) {
        var service = null;
        for (var i = 0; i < serviceList.length; i++) {
            if (serviceList[i]._id == __MSID) {
                service = serviceList[i];
                break;
            }
        }
        if (!service) return null;

        if (__serviceType == 'model') {
            var states = [];
            var mdl = service.MDL;
            var statesNode = mdl.ModelClass.Behavior.StateGroup.States.State;
            var attributeSetNode = mdl.ModelClass.AttributeSet;
            if (statesNode) {
                if (statesNode instanceof Array) {
                    for (let i = 0; i < statesNode.length; i++) {
                        states.push(statesNode[i]._$);
                    }
                } else {
                    states.push(statesNode._$);
                }
            }
            var categoriesNode = attributeSetNode.Categories.Category;
            var categories = {
                principle: categoriesNode._$.principle,
                path: categoriesNode._$.path
            };
            var LocalAttributesNode =
                attributeSetNode.LocalAttributes.LocalAttribute;
            var localAttributes = null;
            if (LocalAttributesNode) {
                if (LocalAttributesNode instanceof Array) {
                    localAttributes = LocalAttributesNode;
                    // for(let i=0;i<LocalAttributesNode.length;i++){
                    //     var localAttributeNode = LocalAttributesNode[i];
                    //     localAttributes.push(localAttributeNode[i]);
                    // }
                } else {
                    localAttributes = [LocalAttributesNode];
                    // localAttributes.push(LocalAttributesNode)
                }
            }
            // TODO 添加runtime
            var runtimeNode = mdl.ModelClass.Runtime;
            return {
                attributeSet: {
                    categories: categories,
                    localAttributes: localAttributes
                },
                host: service.host,
                port: service.port,
                states: states
            };
        } else if (
            __serviceType == 'data map' ||
            __serviceType == 'data refactor'
        ) {
            return {
                DS: service.DS,
                host: service.host,
                port: service.port
            };
        }
    };

    var __getRoleByID = function (roleList, _id) {
        for (var i = 0; i < roleList.length; i++) {
            if (roleList[i]._id == _id) {
                return roleList[i];
            }
        }
        return null;
    };

    // JTopo自带的toJson函数出错（可能是因为circle object的原因）
    // 自己写一个导出函数，将必要的属性导出
    var __myLayout = function (role) {
        var rst = {};
        if (role.elementType == 'container') {
            for (var key1 in role) {
                if (
                    typeof role[key1] != 'function' &&
                    key1 != 'childs' &&
                    key1 != 'messageBus'
                ) {
                    rst[key1] = role[key1];
                }
            }
            rst.childsID = [];
            if (role.childs && role.childs != undefined) {
                for (var i = 0; i < role.childs.length; i++) {
                    rst.childsID.push(role.childs[i]._id);
                }
            }
        } else if (role.elementType == 'link') {
            for (var key2 in role) {
                if (typeof role[key2] != 'function' && key2 != 'messageBus') {
                    if (key2 == 'nodeA') {
                        rst.nodeAID = role[key2]._id;
                    } else if (key2 == 'nodeZ') {
                        rst.nodeZID = role[key2]._id;
                    } else {
                        rst[key2] = role[key2];
                    }
                }
            }
        } else if (role.elementType == 'node') {
            for (var key3 in role) {
                if (
                    typeof role[key3] != 'function' &&
                    key3 != 'messageBus' &&
                    key3 != 'inLinks' &&
                    key3 != 'outLinks'
                ) {
                    rst[key3] = role[key3];
                }
                if (key3 == 'paint') {
                    rst[key3] = role[key3];
                }
            }
        } else if (role.elementType == 'scene') {
            for (var key4 in role) {
                if (
                    typeof role[key4] != 'function' &&
                    key4 != 'stage' &&
                    key4 != 'childs' &&
                    key4 != 'currentElement' &&
                    key4 != 'selectedElements' &&
                    key4 != 'messageBus' &&
                    key4 != 'mouseOverelement' &&
                    key4 != 'mousecoord' &&
                    key4 != 'operations' &&
                    key4 != 'propertiesStack' &&
                    key4 != 'serializedProperties' &&
                    key4 != 'zIndexArray' &&
                    key4 != 'mouseDownEvent' &&
                    key4 != 'zIndexMap'
                ) {
                    rst[key4] = role[key4];
                }
            }
        }
        return rst;
    };

    var __createGUID = function () {
        function _p8(s) {
            var p = (Math.random().toString(16) + '000000000').substr(2, 8);
            return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p;
        }
        return _p8() + _p8(true) + _p8(true) + _p8();
    };

    var __getMaxZIndex = function () {
        var maxZ = Math.max.apply(
            null,
            $.map($('body > *'), function (e, n) {
                if (
                    $(e).css('position') == 'absolute' ||
                    $(e).css('position') == 'relative' ||
                    $(e).css('position') == 'fixed'
                )
                    return parseInt($(e).css('z-index')) || 1;
            })
        );
        return maxZ;
    };

    var __is2Node = function (node, relationList) {
        for (let i = 0; i < relationList.length; i++) {
            var toNode = relationList[i].to;
            if (
                toNode.MSID == node.__MSID &&
                toNode.eventName == node.__eventName &&
                toNode.stateID == node.__stateID
            ) {
                return true;
            }
        }
        return false;
    };

    var __wrapText = function () {
        CanvasRenderingContext2D.prototype.wrapText = function (str, x, y) {
            var textArray = str.split('\n');
            if (textArray == undefined || textArray == null) return false;

            var rowCnt = textArray.length;
            var i = 0,
                imax = rowCnt,
                maxLength = 0;
            maxText = textArray[0];
            for (; i < imax; i++) {
                var nowText = textArray[i],
                    textLength = nowText.length;
                if (textLength >= maxLength) {
                    maxLength = textLength;
                    maxText = nowText;
                }
            }
            var maxWidth = this.measureText(maxText).width;
            var lineHeight = this.measureText('元').width * 1.35;
            x = x - lineHeight * 4;
            y = y + lineHeight / 2 / 1.35;
            for (var j = 0; j < textArray.length; j++) {
                var words = textArray[j];
                this.fillText(
                    words, -(maxWidth / 2),
                    y - textArray.length * lineHeight / 2
                );
                y += lineHeight;
            }
        };
    };

    // 将text 分割为数组，使每一个数组元素的宽度不大于width，font是字体
    var __breakLinesForCanvas = function (text, width, height, font) {
        width -= 20;
        var findBreakPoint = function (text, width, context) {
            var min = 0;
            var max = text.length - 1;

            while (min <= max) {
                var middle = Math.floor((min + max) / 2);
                var middleWidth = context.measureText(text.substr(0, middle))
                    .width;
                var oneCharWiderThanMiddleWidth = context.measureText(
                    text.substr(0, middle + 1)
                ).width;
                if (
                    middleWidth <= width &&
                    oneCharWiderThanMiddleWidth > width
                ) {
                    return middle;
                }
                if (middleWidth < width) {
                    min = middle + 1;
                } else {
                    max = middle - 1;
                }
            }

            return -1;
        };
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        var result = [];
        var breakPoint = 0;
        var lines = Math.floor(height / __lineHeight) - 2;

        if (font) {
            context.font = font;
        }

        while ((breakPoint = findBreakPoint(text, width, context)) !== -1) {
            result.push(text.substr(0, breakPoint));
            text = text.substr(breakPoint);
        }

        if (text) {
            result.push(text);
        }
        if (result.length > lines) {
            result = result.slice(0, lines - 1);
            result.push('...');
        }

        return result.join('\n');
    };

    var __getSchema = function (mdlStr, eventName) {
        try {
            var doc = new dom().parseFromString(mdlStr);
            var schema = xpath.select(
                "/ModelClass/Behavior/DatasetDeclarations/DatasetDeclaration[@name='" +
                eventName +
                "']",
                doc
            );
            if (schema.length == 0) {
                schema = xpath.select(
                    "/ModelClass/Behavior/RelatedDatasets/DatasetItem[@name='" +
                    eventName +
                    "']",
                    doc
                );
            }
            schema = schema.toString();
            schema = schema.replace(/\"/g, '&quot');
            schema = schema.replace(/</g, '&lt');
            schema = schema.replace(/>/g, '&gt');
            return schema;
        } catch (e) {
            return null;
        }
    };

    var __getEventsFromMDL = function (MDL) {
        var events = [];
        var states = MDL.ModelClass.Behavior.StateGroup.States.State;
        if (states instanceof Array) {} else {
            states = [states];
        }

        for (let i = 0; i < states.length; i++) {
            var state = states[i];
            var stateID = state._$.id;
            var childEvents = state.Event;
            if (childEvents instanceof Array) {} else {
                childEvents = [childEvents];
            }

            for (let j = 0; j < childEvents.length; j++) {
                childEvents[j].stateID = stateID;
            }
            events = events.concat(childEvents);
        }
        return events;
    };

    // endregion

    return {
        __menuID: null,
        __hasChanged: false,
        // canvas element
        __stage: null,
        __scene: null,
        __toolMode: null, // normal zoomIn zoomOut delete
        __mode: 'view', // view edit configure
        __type: null,

        __solution: {
            layoutCfg: {
                scene: null,
                nodeList: [],
                containerList: [],
                linkList: []
            },
            solutionCfg: {
                relationList: [],
                serviceList: []
            },
            solutionInfo: {
                author: [],
                desc: null,
                name: null
            },
            time: null
        },
        __task: {
            taskCfg: {
                dataList: [],
                solutionID: null,
                driver: null
            },
            taskState: null,
            taskInfo: {
                name: null,
                desc: null,
                author: []
            },
            time: null,
            MSState: []
        },
        __user: {

        },

        // canvas object 和 solution 中的不一样！
        __nodeList: [],
        __linkList: [],
        __containerList: [],
        __currentNode: null,
        __isValid: true,

        init: function (mode, type) {
            var self = this;
            this.__mode = mode;
            this.__type = type;
            self.__initDOMLayout();
            __wrapText();

            this.__stage = new JTopo.Stage($('#canvas')[0]);
            this.__scene = new JTopo.Scene();
            this.__stage.add(this.__scene);
            this.__stage.setCenter(0, 0);
            this.__stage.wheelZoom = 0.85;
            this.__scene.mode = 'normal';

            this.__bindStageEvent(this.__stage);
            this.__bindSceneEvent(this.__scene);
            this.__bindToolbarEvent();
            this.__bindMenuEvent();
            this.addLinkRoleManuel();

            if (mode == 'view') {
                $('#edit-mode-toolbar').remove();
                $('#configure-mode-toolbar').remove();
            } else if (mode == 'edit') {
                $('#configure-mode-toolbar').remove();
            } else if (mode == 'configure') {
                $('#edit-mode-toolbar').remove();
            }

            if (type == 'task') {
                $('#task-legend').show();
            } else if (type == 'solution') {
                $('#solution-legend').show();
            }
            this.initLegend();

            window.onbeforeunload = function (event) {
                if (self.__mode != 'view' && self.__hasChanged) {
                    return 'Configuration has changed, close will not save these changes!';
                }
            };
        },

        __initDOMLayout: function () {
            var url = location.href;
            // 获取 dom 元素左边界像素
            function getElementLeft(element) {
                var actualLeft = element.offsetLeft;
                var current = element.offsetParent;
                while (current !== null) {
                    actualLeft += current.offsetLeft;
                    current = current.offsetParent;
                }
                return actualLeft;
            }

            function setSidebarBtnLayout() {
                var windowW = window.innerWidth;
                if (windowW < 500) {
                    for (let i = 0; i < $('.toggle-sidebar-btn').length; i++) {
                        $($('.toggle-sidebar-btn')[i]).css('margin-left', 0);
                    }
                } else {
                    var visibleTabID = $('.sidebar:visible').attr('id');
                    var tabW = '350px';
                    $(
                        '.toggle-sidebar-btn[data-target="#' +
                        visibleTabID +
                        '"]'
                    ).css('margin-left', tabW);

                    for (let i = 0; i < $('.sidebar:hidden').length; i++) {
                        var hiddenTabID = $($('.sidebar:hidden')[i]).attr('id');
                        $(
                            '.toggle-sidebar-btn[data-target="#' +
                            hiddenTabID +
                            '"]'
                        ).css('margin-left', 0);
                    }
                }
            }

            function setCanvasLayout() {
                var marginLeft = 0;
                var windowW = window.innerWidth;
                if ($('.sidebar:visible').length) {
                    marginLeft = 350;
                } else {
                    marginLeft = 0;
                }
                if (windowW < 500) {
                    marginLeft = 0;
                }

                if (windowW > 500) {
                    $('#canvas-div').css('margin-left', marginLeft);
                    $('#canvas-div').css('clear', 'none');
                    $('section').css('overflow', 'hidden');
                } else {
                    $('#canvas-div').css('margin-left', marginLeft);
                    $('#canvas-div').css('clear', 'left');
                    $('section').css('overflow', 'auto');
                }

                $('#canvas').attr('width', '' + $('#canvas-div').width());
                $('#canvas').attr('height', '' + $('#canvas-div').height());
            }

            setSidebarBtnLayout();
            setCanvasLayout();

            $(window).resize(function () {
                setSidebarBtnLayout();
                setCanvasLayout();
            });

            $('.toggle-sidebar-btn').click(function (e) {
                var sidebars = $('.sidebar');
                if (
                    $(this)
                    .find('i')
                    .hasClass('fa-chevron-right')
                ) {
                    for (let i = 0; i < sidebars.length; i++) {
                        if (
                            '#' + $(sidebars[i]).attr('id') ==
                            $(this).attr('data-target')
                        ) {
                            $($(this).attr('data-target')).attr(
                                'class',
                                'sidebar'
                            );
                            continue;
                        }
                        $(sidebars[i]).attr('class', 'sidebar myCollapsed');
                    }
                } else if (
                    $(this)
                    .find('i')
                    .hasClass('fa-chevron-left')
                ) {
                    for (let i = 0; i < sidebars.length; i++) {
                        if (
                            '#' + $(sidebars[i]).attr('id') ==
                            $(this).attr('data-target')
                        ) {
                            $($(this).attr('data-target')).attr(
                                'class',
                                'sidebar myCollapsed'
                            );
                            continue;
                        }
                    }
                }
                var sidebar_btns = $('.toggle-sidebar-btn');
                if (
                    $(this)
                    .find('i')
                    .hasClass('fa-chevron-right')
                ) {
                    for (let i = 0; i < sidebar_btns.length; i++) {
                        if (sidebar_btns[i] == this) {
                            $(this)
                                .find('i')
                                .attr('class', 'fa fa-chevron-left');
                            continue;
                        }
                        $(sidebar_btns[i])
                            .find('i')
                            .attr('class', 'fa fa-chevron-right');
                    }
                } else if (
                    $(this)
                    .find('i')
                    .hasClass('fa-chevron-left')
                ) {
                    for (let i = 0; i < sidebar_btns.length; i++) {
                        if (sidebar_btns[i] == this) {
                            $(this)
                                .find('i')
                                .attr('class', 'fa fa-chevron-right');
                            continue;
                        }
                    }
                }

                setCanvasLayout();
                setSidebarBtnLayout();
            });

            if (url.indexOf('integration/solution/edit') != -1) {
                $('#div-model-Node').toggleClass('myCollapsed');
                $('#div-AggreMS').toggleClass('myCollapsed');
                $('#toggle-model-node-sidebar-btn')
                    .find('i')
                    .toggleClass('fa-chevron-left fa-chevron-right');
                $('#toggle-cart-sidebar-btn')
                    .find('i')
                    .toggleClass('fa-chevron-left fa-chevron-right');
                setCanvasLayout();
                setSidebarBtnLayout();
            }
        },

        // region bind event
        __bindToolbarEvent: function () {
            var self = this;
            let couldSave;

            $('#toolbar button').click(function () {
                if (
                    typeof $(this).attr('data-toggle') !== 'undefined' &&
                    $(this).attr('data-toggle') == 'button'
                ) {
                    if (!$(this).hasClass('active')) {
                        $('#toolbar button').removeClass('active');
                    } else {
                        $('#hand-tool').addClass('active');
                    }
                }

                switch ($(this).attr('id')) {
                    // 清空场景
                    case 'del-all-tool':
                        if (
                            self.__type == 'solution' &&
                            self.__mode == 'edit'
                        ) {
                            // self.__serviceList = [];
                            // self.__relationList = [];
                            // self.__dataList = [];
                            self.__scene.clear();

                            self.__toolMode = 'normal';
                            self.__scene.mode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 回到初始位置
                    case 'back-pos-tool':
                        // self.__stage.centerAndZoom(1);
                        // self.__stage.setCenter(0,0);
                        // self.__stage.zoom(1);

                        self.__scene.scaleX = 1;
                        self.__scene.scaleY = 1;

                        self.__scene.translateX = $('#canvas-div').width() / 2;
                        self.__scene.translateY = $('#canvas-div').height() / 2;
                        self.__stage.paint();

                        self.__toolMode = 'normal';
                        self.__scene.mode = 'normal';
                        $('#toolbar button').removeClass('active');
                        $('#hand-tool').addClass('active');
                        break;
                        // 显示模式切换
                    case 'display-toggle-tool':
                        if (!$(this).hasClass('active')) {
                            self.__scene.mode = 'select';
                            self.__toolMode = 'normal';
                        } else {
                            self.__scene.mode = 'normal';
                            self.__toolMode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 放大
                    case 'zoomIn-tool':
                        if (!$(this).hasClass('active')) {
                            self.__toolMode = 'zoomIn';
                            self.__scene.mode = 'normal';
                        } else {
                            self.__toolMode = 'normal';
                            self.__scene.mode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 缩小
                    case 'zoomOut-tool':
                        if (!$(this).hasClass('active')) {
                            self.__toolMode = 'zoomOut';
                            self.__scene.mode = 'normal';
                        } else {
                            self.__toolMode = 'normal';
                            self.__scene.mode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 拖动模式
                    case 'hand-tool':
                        if (!$(this).hasClass('active')) {
                            self.__scene.mode = 'normal';
                            self.__toolMode = 'normal';
                        } else {
                            self.__scene.mode = 'select';
                            self.__toolMode = 'normal';
                        }
                        break;
                        // 框选模式
                    case 'select-tool':
                        if (!$(this).hasClass('active')) {
                            self.__scene.mode = 'select';
                            self.__toolMode = 'normal';
                        } else {
                            self.__scene.mode = 'normal';
                            self.__toolMode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 编辑模式
                    case 'edit-tool':
                        if (!$(this).hasClass('active')) {
                            self.__scene.mode = 'edit';
                            self.__toolMode = 'normal';
                        } else {
                            self.__scene.mode = 'normal';
                            self.__toolMode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 删除模式
                    case 'del-tool':
                        if (!$(this).hasClass('active')) {
                            self.__toolMode = 'delete';
                            self.__scene.mode = 'normal';
                        } else {
                            self.__toolMode = 'normal';
                            self.__scene.mode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 创建连接线模式
                    case 'link-tool':
                        if (!$(this).hasClass('active')) {
                            self.__toolMode = 'link';
                            self.__scene.mode = 'normal';
                        } else {
                            self.__toolMode = 'normal';
                            self.__scene.mode = 'normal';
                            $('#toolbar button').removeClass('active');
                            $('#hand-tool').addClass('active');
                        }
                        break;
                        // 运行
                    case 'run-tool':
                        self.run();
                        break;
                        // 另存为
                    case 'saveas-solution-tool':
                        couldSave = self.__setUser();
                        if (couldSave) {
                            $('#save-aggre-solution-modal').modal('show');
                            self.__bindSaveSolutionEvent(1);
                        }
                        break;
                        // 保存solution
                    case 'save-solution-tool':
                        $('#save-aggre-solution-modal').on(
                            'shown.bs.modal',
                            function (e) {
                                $('#solutionName').focus();
                            }
                        );
                        couldSave = self.__setUser();
                        if (couldSave) {
                            $('#save-aggre-solution-modal').modal('show');
                            self.__bindSaveSolutionEvent(0);
                        }
                        break;
                        //  保存task
                    case 'save-task-tool':
                        $('#save-aggre-task-modal').modal('show');
                        self.__bindSaveTaskEvent(0);
                        break;
                    case 'saveas-img-solution-tool':
                        var canvasW = $('#canvas-div').width() / 2;
                        var canvasH = $('#canvas-div').height() / 2;
                        // self.__stage.setCenter(canvasW, canvasH);
                        self.__stage.saveImageInfo();
                        // self.__stage.setCenter(0,0);
                        break;
                    case 'configure-tool':
                        var solutionID = null;
                        var index = window.location.href.indexOf('_id=');
                        if (index == -1) {
                            __addNotice(
                                __NoticeType.warning,
                                'Please create a solution and save first!'
                            );
                        } else {
                            solutionID = window.location.href.substr(
                                index + 4,
                                24
                            );
                        }
                        var configureURL =
                            '/integration/task/new?solutionID=' + solutionID;
                        window.location.href = configureURL;
                }
            });

            $('#hand-tool').click();
        },

        __bindMenuEvent: function () {
            var self = this;

            // region menu authority
            if (this.__type == 'task') {
                $('.solution-menu').remove();
            } else if (this.__type == 'solution') {
                $('.task-menu').remove();
            }
            if (this.__mode == 'view') {
                $('.edit-mode-menu').remove();
                $('.configure-mode-menu').remove();
            } else if (this.__mode == 'edit') {
                $('.view-mode-menu').remove();
                $('.configure-mode-menu').remove();
            } else if (this.__mode == 'configure') {
                $('.edit-mode-menu').remove();
                $('.view-mode-menu').remove();
            }
            // endregion

            // region menu item call
            $('.contextMenu li').on('click', function (e) {
                __hideContextMenu();
            });

            $('#show-data-menu').on('click', function (e) {
                self.__buildEventDialogDetail();
            });

            $('#remove-data-menu').on('click', function (e) {
                var node = self.__currentNode;
                node.dispatchEvent('remove data');
            });

            $('#configure-data-menu').on('click', function (e) {});

            $('#del-ms-menu').on('click', function (e) {
                self.removeServiceRole(self.__currentNode);
            });

            // 其他操作都是在保存时更新，但这个要立即更新
            $('#addbreak-ms-menu').on('click', function (e) {
                var node = self.__currentNode;

                var saveBreak = function () {
                    $.ajax({
                            url: '/integration/task/breakpoint?ac=add',
                            method: 'POST',
                            contentType: 'application/json;charset=utf-8',
                            dataType: 'json',
                            data: JSON.stringify({
                                taskID: self.__task._id,
                                MSID: node.__MSID
                            })
                        })
                        .done(function (res) {
                            if (res.error) {
                                __addNotice(
                                    __NoticeType.warning,
                                    'Add break point failed<br><pre>' +
                                    JSON.stringify(res.error, null, 4) +
                                    '</pre>'
                                );
                            } else {
                                if (res.result == 'success') {
                                    var msStateList = self.__task.MSState;
                                    for (
                                        let i = 0; i < msStateList.length; i++
                                    ) {
                                        if (
                                            msStateList[i].MSID == node.__MSID
                                        ) {
                                            msStateList[i].state =
                                                MSState.pause;
                                            break;
                                        }
                                    }
                                    node.fillColor = __getRGB(
                                        StatesColor.pause
                                    );
                                    node.__pause = true;
                                    __addNotice(
                                        __NoticeType.notice,
                                        'Add break point successed!'
                                    );
                                } else {
                                    __addNotice(
                                        __NoticeType.notice,
                                        "Can't add a break point to a running model!"
                                    );
                                }
                            }
                        })
                        .error(function (err) {
                            __addNotice(
                                __NoticeType.warning,
                                'Add break point failed<br><pre>' +
                                JSON.stringify(err, null, 4) +
                                '</pre>'
                            );
                        });
                };

                if (
                    $('#taskID-input').length &&
                    $('#taskID-input').attr('value') &&
                    $('#taskID-input').attr('value') != undefined
                ) {
                    saveBreak();
                } else {
                    var msStateList = self.__task.MSState;
                    for (let i = 0; i < msStateList.length; i++) {
                        if (msStateList[i].MSID == node.__MSID) {
                            msStateList[i].state = MSState.pause;
                            break;
                        }
                    }
                    node.fillColor = __getRGB(StatesColor.pause);
                    node.__pause = true;
                }
            });

            $('#removebreak-ms-menu').on('click', function (e) {
                var node = self.__currentNode;

                var removeBreak = function () {
                    $.ajax({
                            url: '/integration/task/breakpoint?ac=remove',
                            method: 'POST',
                            contentType: 'application/json;charset=utf-8',
                            dataType: 'json',
                            data: JSON.stringify({
                                taskID: self.__task._id,
                                MSID: node.__MSID
                            })
                        })
                        .done(function (res) {
                            if (res.error) {
                                __addNotice(
                                    __NoticeType.warning,
                                    'Remove break point failed<br><pre>' +
                                    JSON.stringify(res.error, null, 4) +
                                    '</pre>'
                                );
                            } else {
                                if (res.result == 'success') {
                                    var msStateList = self.__task.MSState;
                                    for (
                                        let i = 0; i < msStateList.length; i++
                                    ) {
                                        if (
                                            msStateList[i].MSID == node.__MSID
                                        ) {
                                            msStateList[i].state =
                                                MSState.unready;
                                            break;
                                        }
                                    }
                                    node.fillColor = __getRGB(
                                        StatesColor.unready
                                    );
                                    node.__pause = false;
                                    __addNotice(
                                        __NoticeType.notice,
                                        'Remove break point successed!'
                                    );
                                }
                            }
                        })
                        .error(function (err) {
                            __addNotice(
                                __NoticeType.warning,
                                'Remove break point failed<br><pre>' +
                                JSON.stringify(err, null, 4) +
                                '</pre>'
                            );
                        });
                };

                if (
                    $('#taskID-input').length &&
                    $('#taskID-input').attr('value') &&
                    $('#taskID-input').attr('value') != undefined
                ) {
                    removeBreak();
                } else {
                    var msStateList = self.__task.MSState;
                    for (let i = 0; i < msStateList.length; i++) {
                        if (msStateList[i].MSID == node.__MSID) {
                            msStateList[i].state = MSState.unready;
                            break;
                        }
                    }
                    node.fillColor = __getRGB(StatesColor.unready);
                    node.__pause = false;
                }
            });

            $('#toggle-direction-ms-menu').on('click', function (e) {
                var serviceList = self.__solution.solutionCfg.serviceList;
                var node = self.__currentNode;
                var service = _.find(serviceList, item => item._id === node.__MSID);
                let nodeA = node.inLinks[0].nodeA;
                let nodeZ = node.outLinks[0].nodeZ;
                let tempNode = _.cloneDeep(nodeA);
                // let nodeAEventname, nodeZEventname;
                var text = node.__text;
                if (node.__callType === 'src2udx') {
                    // text = text.replace(
                    //     '(source data to UDX)',
                    //     '(UDX to source data)'
                    // );
                    node.__callType = 'udx2src';
                    service.callType = 'udx2src';
                    service.CDL.StateGroup.States[0].Events[0].name = 'UDX';
                    service.CDL.StateGroup.States[0].Events[1].name = 'Source';
                    // nodeAEventname = 'Source';
                    // nodeZEventname = 'UDX';
                } else if (node.__callType === 'udx2src') {
                    // text = text.replace(
                    //     '(UDX to source data)',
                    //     '(source data to UDX)'
                    // );
                    node.__callType = 'src2udx';
                    service.callType = 'src2udx';
                    service.CDL.StateGroup.States[0].Events[0].name = 'Source';
                    service.CDL.StateGroup.States[0].Events[1].name = 'UDX';
                    // nodeAEventname = 'UDX';
                    // nodeZEventname = 'Source';
                }
                // var nodeA = this.__getEventNode(node.__MSID, node.__stateID, nodeAEventname);
                // var nodeZ = this.__getEventNode(node.__MSID, node.__stateID, nodeZEventname);
                // var tempNode = _.cloneDeep(nodeA);
                nodeA.__text = nodeZ.__text;
                nodeA.__eventName = nodeZ.__eventName;
                nodeZ.__text = tempNode.__text;
                nodeZ.__eventName = tempNode.__eventName;

                // node.__text = text;
                changeText = (node) => {
                    node.text = __breakLinesForCanvas(node.__text, node.width, node.height, __font);
                }
                changeText(nodeA);
                changeText(nodeZ);

                self.__stage.paint();
            });
            // endregion
        },

        __bindStageEvent: function (stage) {
            var self = this;

            // zoom
            stage.addEventListener('mouseup', function (e) {
                if (typeof self.__toolMode !== 'undefined') {
                    if (self.__toolMode == 'zoomIn') {
                        self.__stage.zoomOut(0.85);
                    } else if (self.__toolMode == 'zoomOut') {
                        self.__stage.zoomIn(0.85);
                    }
                }
            });
        },

        __bindSceneEvent: function (scene) {
            var self = this;

            // region hide context menu
            scene.addEventListener('mouseup', function (e) {
                // $('.' + self.__type + '-menu, .' + self.__mode + '-mode-menu').show();
                if (
                    e.target == null ||
                    e.target instanceof JTopo.Container ||
                    e.target instanceof JTopo.Link
                ) {
                    __hideContextMenu();
                }
            });
            // endregion

            // region delete manual link
            scene.addEventListener('mouseup', function (e) {
                var target = e.target;
                if (e.target == null) {
                    __beginNode = null;
                }
                if (e.button == 0) {
                    if (
                        self.__type === 'solution' &&
                        self.__mode === 'edit' &&
                        target &&
                        target.elementType == 'link' &&
                        target.__linkType == 'CUSTOM' &&
                        self.__toolMode == 'delete'
                    ) {
                        self.__hasChanged = true;
                        self.removeRelationByJTopoID(self.__scene, target._id);
                        self.__removeJTopoElementByID(self.__scene, target._id);
                    }
                } else if (e.button == 2) {
                    if (target == null && !__beginNode) {
                        $('#hand-tool').click();
                    }
                    // if (
                    //     self.__type == 'solution' &&
                    //     self.__mode == 'edit' &&
                    //     target &&
                    //     target.elementType == 'link' &&
                    //     target.__linkType == 'CUSTOM'
                    // ) {
                    //     self.__hasChanged = true;
                    //     self.removeRelationByJTopoID(self.__scene, target._id);
                    //     self.__removeJTopoElementByID(self.__scene, target._id);
                    // }
                }
            });
            // endregion

            // region scene change tag
            scene.addEventListener('mousewheel', function (e) {
                if (self.__type == 'solution') {
                    self.__hasChanged = true;
                }
            });
            // endregion

            // region repaint text when node resize
            scene.addEventListener('mousedrag', function (e) {
                if (self.__type == 'solution') {
                    self.__hasChanged = true;
                }

                var node = e.target;
                if (
                    node != null &&
                    node instanceof JTopo.Node &&
                    self.__scene.mode == 'edit'
                ) {
                    var width = null;
                    var height = null;
                    if (node.__nodeType == 'STATES') {
                        width = node.width;
                        height = node.height;
                    } else {
                        height = width = node.radius * 2;
                    }
                    node.text = __breakLinesForCanvas(
                        node.__text,
                        width,
                        height,
                        __font
                    );
                    self.__stage.paint();
                }
            });
            // endregion
        },

        __bindContainerEvent: function (container) {},

        __bindNodeEvent: function (node) {
            var self = this;
            var type = node.__nodeType;

            // region menu authority
            node.addEventListener('mouseup', function (e) {
                if (e.button == 2) {
                    __hideContextMenu();
                    if (node.__nodeType != 'STATES') {
                        if (
                            (node.__nodeType == 'INPUT' ||
                                node.__nodeType == 'CONTROL') &&
                            !__is2Node(
                                node,
                                self.__solution.solutionCfg.relationList
                            )
                        ) {
                            if (node.__isInput && node.__gdid) {
                                $('#remove-data-menu').show();
                                $('#show-data-menu').show();
                            } else {
                                $('#show-data-menu').show();
                                $('#configure-data-menu').show();
                            }
                        }
                    } else if (node.__nodeType == 'STATES') {
                        var msStateList = self.__task.MSState;
                        var msState = null;
                        for (let i = 0; i < msStateList.length; i++) {
                            if (msStateList[i].MSID == this.__MSID) {
                                msState = msStateList[i];
                                break;
                            }
                        }
                        if (
                            msState == null ||
                            msState.state == MSState.unready
                        ) {
                            $('#addbreak-ms-menu').show();
                        } else if (
                            msState == null ||
                            msState.state == MSState.pause
                        ) {
                            $('#removebreak-ms-menu').show();
                        }

                        if (node.__serviceType == 'model') {} else if (node.__serviceType == 'data map') {
                            $('#toggle-direction-ms-menu').show();
                        } else if (
                            node.__serviceType == 'data refactor'
                        ) {}
                    }
                    __showContextMenu(node.__nodeType);
                    self.__currentNode = node;
                } else if (e.button == 0) {
                    __hideContextMenu();
                }
            });
            // endregion

            // region remove service
            if (self.__mode == 'edit' && self.__type == 'solution') {
                node.addEventListener('mouseup', function (e) {
                    if (e.button == 2) {} else if (e.button == 0) {
                        if (node.__nodeType == 'STATES') {
                            if (self.__toolMode == 'delete')
                                self.removeServiceRole(e.target);
                        }
                    }
                });
            }
            // endregion

            // region data panel
            if (type == 'INPUT' || type == 'OUTPUT' || type == 'CONTROL') {
                // 双击上传数据
                node.addEventListener('dbclick', function (e) {
                    __beginNode = null;
                    self.__currentNode = node;
                    self.__buildEventDialogDetail();
                });
            } else if (type == 'STATES') {
                node.addEventListener('dbclick', function (e) {
                    __beginNode = null;
                    self.__currentNode = node;
                    self.__buildStatesDialogDetail();
                });
            }
            // endregion

            // region text indentation
            node.addEventListener('mouseover', function (e) {
                var node = this;
                if (node && node instanceof JTopo.Node) {
                    var width = null;
                    var height = null;
                    if (node.__nodeType == 'STATES') {
                        width = node.width;
                        height = node.height;
                    } else {
                        height = width = node.radius * 2 - 3;
                    }
                    node.text = __breakLinesForCanvas(
                        node.__text,
                        width,
                        9999,
                        __font
                    );
                    self.__stage.paint();
                }
            });

            node.addEventListener('mouseout', function (e) {
                var node = this;
                if (node && node instanceof JTopo.Node) {
                    var width = null;
                    var height = null;
                    if (node.__nodeType == 'STATES') {
                        width = node.width;
                        height = node.height;
                    } else {
                        height = width = node.radius * 2 - 3;
                    }
                    node.text = __breakLinesForCanvas(
                        node.__text,
                        width,
                        height,
                        __font
                    );
                    self.__stage.paint();
                }
            });
            // endregion

            // region delete uploaded data
            node.addEventListener('remove data', function (e) {
                var MSStateList = self.__task.MSState;
                var canRemove = false;
                for (let i = 0; i < MSStateList.length; i++) {
                    if (MSStateList[i].MSID == node.__MSID) {
                        if (
                            MSStateList[i].state == MSState.unready ||
                            MSStateList[i].state == MSState.pause ||
                            MSStateList[i].state == MSState.collapsed
                        ) {
                            canRemove = true;
                            break;
                        }
                        break;
                    }
                }
                if (!canRemove) {
                    __addNotice(
                        __NoticeType.warning,
                        "Can't remove this data!"
                    );
                    return;
                }
                if (confirm('Are you sure to delete this configured data?')) {
                    self.__hasChanged = true;
                    var id =
                        this.__MSID +
                        '___' +
                        this.__stateID +
                        '___' +
                        this.__eventName;
                    id = id.replace(/\s/g, '-');
                    $('#' + id + '-download-div').remove();
                    var dataList = self.__task.taskCfg.dataList;
                    for (let i = 0; i < dataList.length; i++) {
                        if (dataList[i].gdid == this.__gdid) {
                            dataList.splice(i, 1);
                            break;
                        }
                    }
                    this.__gdid = null;
                    var fillColor = __getRGB(
                        this.__optional != null && this.__optional == true ?
                        EventColor.optional :
                        EventColor.origin
                    );
                    this.fillColor = fillColor;
                    self.__stage.paint();
                }
            });
            // endregion

            // region window change flag
            node.addEventListener('mousedrag', function (e) {
                if (self.__type == 'solution') {
                    self.__hasChanged = true;
                }
            });
            // endregion
        },

        __bindSaveSolutionEvent: function (isSaveAs) {
            var self = this;

            $('#save-aggre-form').validate({
                onfocusout: function (element) {
                    $(element).valid();
                },
                focusInvalid: true,
                submitHandler: function (form) {
                    var data = self.exportSolution();
                    if (!data.solutionInfo) {
                        data.solutionInfo = {};
                    }
                    data.solutionInfo.name = $('#solutionName').val();
                    data.solutionInfo.desc = $('#solutionDesc').val();

                    let user = {
                        _id: self.__user._id,
                        username: self.__user.username,
                        avatar: self.__user.avatar
                    };
                    if (!data.solutionInfo.author) {
                        data.solutionInfo.author = []
                    }
                    let v = _.find(data.solutionInfo.author, author => author._id === self.__user._id);
                    if (!v) {
                        data.solutionInfo.author.push(user);
                    }

                    $('#loading-div').show();
                    $('#submit-form-btn').attr('disabled', true);
                    $.ajax({
                            url: '/integration/solution?isSaveAs=' + isSaveAs,
                            data: JSON.stringify(data),
                            contentType: 'application/json;charset=utf-8',
                            type: 'POST',
                            dataType: 'json'
                        })
                        .done(function (res) {
                            if (res.error) {
                                $('#loading-div').hide();
                                $('#submit-form-btn').attr('disabled', false);
                                $.gritter.add({
                                    title: 'Warning：',
                                    text: 'Save solution failed!<br><pre>' +
                                        JSON.stringify(res.error, null, 4) +
                                        '</pre>',
                                    sticky: false,
                                    time: 2000
                                });
                            } else {
                                self.__setAuthor();
                                self.__hasChanged = false;
                                $('#loading-div').hide();
                                $('#submit-form-btn').attr('disabled', false);
                                $('#save-aggre-solution-modal').modal('hide');

                                $('#solutionID-input').attr('value', res._id);
                                // temp del
                                // $('#solution-name').empty();
                                // $('#solution-author').empty();
                                $('#solution-name').append(
                                    data.solutionInfo.name
                                );
                                // temp del
                                // $('#solution-author').append(
                                //     solutionInfo.author
                                // );
                                $('#solution-info').css('display', 'block');

                                $.gritter.add({
                                    title: 'Notice:',
                                    text: 'Save solution success!',
                                    sticky: false,
                                    time: 2000
                                });

                                window.location = '/integration/solution/edit?_id=' + res._id;
                            }
                        })
                        .fail(function (err) {
                            $('#loading-div').hide();
                            $('#submit-form-btn').attr('disabled', false);
                            $.gritter.add({
                                title: 'Warning:',
                                text: `Save solution failed!<br><pre>${JSON.stringify(err, null, 4)}</pre>`,
                                sticky: false,
                                time: 2000
                            });
                        });
                }
            });
        },

        // task 的保存和solution不是一个套路，只用保存最新的datalist就行，其他状态由后台维护
        __bindSaveTaskEvent: function (isSaveAs, isRunNow) {
            var self = this;
            $('#save-aggre-form').validate({
                onfocusout: function (element) {
                    $(element).valid();
                },
                focusInvalid: true,
                submitHandler: function (form) {
                    var data = self.exportTask();
                    if (!data.taskInfo) {
                        data.taskInfo = {}
                    }
                    data.taskInfo.name = $('#taskName').val();
                    data.taskInfo.desc = $('#taskDesc').val();

                    let user = {
                        _id: self.__user._id,
                        username: self.__user.username,
                        avatar: self.__user.avatar
                    };
                    if (!data.taskInfo.author) {
                        data.taskInfo.author = []
                    }
                    let v = _.find(data.taskInfo.author, author => author._id === self.__user._id);
                    if (!v) {
                        data.taskInfo.author.push(user);
                    }

                    $('#loading-div').show();
                    $('#submit-form-btn').attr('disabled', true);
                    $.ajax({
                            url: '/integration/task?isSaveAs=' + isSaveAs,
                            data: JSON.stringify(data),
                            contentType: 'application/json;charset=utf-8',
                            type: 'POST',
                            dataType: 'json'
                        })
                        .done(function (res) {
                            if (res.error) {
                                $('#loading-div').hide();
                                $('#submit-form-btn').attr('disabled', false);
                                $.gritter.add({
                                    title: 'Warning：',
                                    text: 'Save task failed!<br><pre>' +
                                        JSON.stringify(res.error, null, 4) +
                                        '</pre>',
                                    sticky: false,
                                    time: 2000
                                });
                            } else {
                                self.__setAuthor();
                                self.__hasChanged = false;
                                $('#loading-div').hide();
                                $('#submit-form-btn').attr('disabled', false);
                                $('#save-aggre-task-modal').modal('hide');

                                $('#taskID-input').attr('value', res._id);
                                $('#task-name').empty();
                                // $('#task-author').empty();
                                $('#task-name').append(data.taskInfo.name);
                                // $('#task-author').append(
                                //     data.taskInfo.author
                                // );
                                $('#task-info').css('display', 'block');

                                $.gritter.add({
                                    title: 'Notice:',
                                    text: 'Save task success!',
                                    sticky: false,
                                    time: 2000
                                });

                                if (isRunNow) {
                                    return self.run();
                                }
                                if (window.location.pathname == '/integration/task/new') {
                                    window.location.href = '/integration/task/edit?_id=' + res._id;
                                }
                                if (isSaveAs) {
                                    window.location.search = '?_id=' + res._id;
                                }
                            }
                        })
                        .fail(function (err) {
                            $('#loading-div').hide();
                            $('#submit-form-btn').attr('disabled', false);
                            $.gritter.add({
                                title: 'Warning:',
                                text: 'Save task failed!<br><pre>' +
                                    JSON.stringify(err, null, 4) +
                                    '</pre>',
                                sticky: false,
                                time: 2000
                            });
                        });
                }
            });
        },
        // endregion

        // region user
        __setUser: function () {
            let self = this;
            let jwt = localStorage.getItem('jwt');
            let user = localStorage.getItem('user');
            if (user && jwt) {
                user = JSON.parse(user);
                jwt = JSON.parse(jwt);
                if (jwt.expires > Date.now()) {
                    self.__user = user;
                    return true;
                } else {
                    $('#signin-a').click();
                    return false;
                }
            } else {
                $('#signin-a').click();
                return false;
            }
        },

        __setAuthor: function () {
            let self = this;
            let authors = _.get(self, '__solution.solutionInfo.author');
            $('#solution-author').empty();
            _.map(authors, author => {
                let user;
                if (author.avatar) {
                    user = `
                        <span class="avatar" title="${author.username}" data-toggle='tooltip'>
                            <img src="data:image/png;base64,${author.avatar}">
                        </span>
                    `
                } else if (author.username) {
                    user = `
                        <span class="avatar" title="${author.username}" data-toggle='tooltip'>
                            ${author.username}
                        </span>
                    `
                } else {
                    user = '';
                }

                $('#solution-author').append(user)
            });

            authors = _.get(self, '__task.taskInfo.author');
            $('#task-author').empty();
            _.map(authors, author => {
                let user;
                if (author.avatar) {
                    user = `
                        <span class="avatar" title="${author.username}" data-toggle='tooltip'>
                            <img src="data:image/png;base64,${author.avatar}">
                        </span>
                    `
                } else if (author.username) {
                    user = `
                        <span class="avatar" title="${author.username}" data-toggle='tooltip'>
                            ${author.username}
                        </span>
                    `
                } else {
                    user = '';
                }

                $('#task-author').append(user)
            });
        },
        // endregion

        // region find/add/delete canvas object operation

        /* 两种node，附加信息有：
         * {
         *     __nodeType:'STATES',
         *     __MSID:String,
         *     __containerID:String
         *     __state                  // 应该放在msstate中，这里是临时属性，不会存在solution中
         *     __pause                  // 放在msstate中
         *     __serviceType
         *     __callType               // data map type: src2udx/udx2src
         * }
         * {
         *     __nodeType:'INPUT',      // 'OUTPUT' 'CONTROL'
         *     __MSID:String,
         *     __stateID:String,
         *     __eventName:String
         *     __gdid                   // 放在 dataList 中
         *     __isInput:Boolean        // 当上传数据了，才为true
         *     __eventType
         *     __serviceType
         * }
         *  创建时只添加jTopo自带的属性，额外属性在调用端添加
         */
        __addJTopoNode: function (x, y, text, type, scale, optional) {
            var node = null;
            var linkScale = scale == 1 ? 1 : 2 - scale;
            if (type == 'STATES') {
                node = new JTopo.Node(text);
                node.borderRadius = 5;
                node.borderWidth = 0;
                node.borderColor = '0,0,0';
                node.fillColor = __getRGB(SolutionColor.states);
                node.setSize(__STATES_WIDTH, __STATES_HEIGHT);
                node.layout = {
                    type: 'tree',
                    direction: 'right',
                    width: linkScale * __DATA_RADIUS * 2,
                    height: linkScale * __DATA_RADIUS * 4
                };
            } else {
                node = new JTopo.CircleNode(text);
                node.radius = __DATA_RADIUS;
                node.borderWidth = 0;
                node.borderColor = '0,0,0';
                if (optional && optional == true) {
                    node.fillColor = __getRGB(EventColor.optional);
                } else {
                    node.fillColor = __getRGB(SolutionColor.event);
                }
            }
            if (x && y) node.setCenterLocation(x, y);
            node.alpha = 1;
            node.textPosition = 'Middle_Center';
            node.font = __font;
            node.fontColor = '30,30,30';
            node.showSelected = true;
            node.dragable = true;
            node.editAble = false;
            node.scaleX = scale;
            node.scaleY = scale;
            node._id = __createGUID();

            var width = null;
            var height = null;
            if (type == 'STATES') {
                width = node.width;
                height = node.height;
            } else {
                height = width = node.radius * 2 - 3;
            }
            node.__text = text;
            node.text = __breakLinesForCanvas(text, width, height, __font);

            node.paintText = function (a) {
                var b = this.text;
                if (null != b && '' != b) {
                    a.beginPath();
                    a.font = this.font;
                    var c = a.measureText(b).width,
                        d = a.measureText('田').width;
                    a.fillStyle =
                        'rgba(' + this.fontColor + ', ' + this.alpha + ')';
                    var e = this.getTextPostion(this.textPosition, c, d);
                    a.wrapText(b, e.x, e.y);
                    a.closePath();
                }
            };

            this.__scene.add(node);
            return node;
        },

        // 增加属性：
        // __linkType:'CUSTOM'          // 'IN' 'OUT'
        // _id:nodeA._id + '__' + nodeZ._id
        __addJTopoLink: function (nodeA, nodeZ) {
            // var link = new JTopo.FoldLink(nodeA, nodeZ);
            var link = new JTopo.Link(nodeA, nodeZ);
            // link.direction = direction || 'horizontal';
            link.arrowsRadius = 7;
            link.lineWidth = 2;
            link.bundleOffset = 60;
            link.bundleGap = 15;
            link.strokeColor = '96, 168, 255';
            link._id = nodeA._id + '__' + nodeZ._id;
            this.__scene.add(link);
            return link;
        },

        __addJTopoContainer: function () {
            var container = new JTopo.Container();
            container._id = __createGUID();
            container.alpha = 0;
            this.__scene.add(container);
            return container;
        },

        // 手动添加link，此处会添加到私有变量 __relationList 中，附加信息有
        // {
        //     __linkType: 'CUSTOM',
        //     __relationID: String
        // }
        addLinkRoleManuel: function () {
            var self = this;
            var scene = this.__scene;
            // var __beginNode = null;
            var tempNodeA = new JTopo.Node('tempA');
            tempNodeA.setSize(1, 1);

            var tempNodeZ = new JTopo.Node('tempZ');
            tempNodeZ.setSize(1, 1);

            var link = new JTopo.Link(tempNodeA, tempNodeZ);
            link.lineWidth = 2;

            scene.mouseup(function (e) {
                if (self.__toolMode != 'link') return;
                if (e.button == 2) {
                    __beginNode = null;
                    scene.remove(link);
                    return;
                }
                if (e.target != null && e.target instanceof JTopo.Node) {
                    if (__beginNode == null) {
                        // TODO 验证添加规则
                        if (e.target.__nodeType == 'STATES') {
                            __beginNode = null;
                            scene.remove(link);
                            return;
                        }

                        __beginNode = e.target;
                        scene.add(link);
                        tempNodeA.setLocation(e.x, e.y);
                        tempNodeZ.setLocation(e.x, e.y);
                    } else if (__beginNode !== e.target) {
                        var endNode = e.target;
                        if (!self.validateLink(__beginNode, endNode)) {
                            __beginNode = null;
                            scene.remove(link);
                            return;
                        }

                        var relation = self.__addRelation(__beginNode, endNode);
                        var l = new JTopo.Link(__beginNode, endNode);
                        l.arrowsRadius = 7;
                        l.lineWidth = 2;
                        l.bundleOffset = 60;
                        l.bundleGap = 15;
                        l.strokeColor = __getRGB(SolutionColor.manualLink);
                        l._id = __beginNode._id + '__' + endNode._id;
                        l.__linkType = 'CUSTOM';
                        l.__relationID = relation._id;

                        scene.add(l);
                        __beginNode = null;
                        scene.remove(link);
                        self.__hasChanged = true;
                    } else {
                        __beginNode = null;
                    }
                } else {
                    __beginNode = null;
                    scene.remove(link);
                }
            });

            scene.mousedown(function (e) {
                if (self.__toolMode != 'link') return;
                if (
                    e.target == null ||
                    e.target === __beginNode ||
                    e.target === link
                ) {
                    scene.remove(link);
                }
            });
            scene.mousemove(function (e) {
                if (self.__toolMode != 'link') return;
                tempNodeZ.setLocation(e.x, e.y);
            });
        },

        __addRelation: function (nodeA, nodeZ) {
            var relation = {
                _id: nodeA.__MSID + '__' + nodeZ.__MSID,
                from: {
                    MSID: nodeA.__MSID,
                    stateID: nodeA.__stateID,
                    eventName: nodeA.__eventName
                },
                to: {
                    MSID: nodeZ.__MSID,
                    stateID: nodeZ.__stateID,
                    eventName: nodeZ.__eventName
                }
            };
            this.__solution.solutionCfg.relationList.push(relation);
            return relation;
        },

        __addJTopoElementByJSON: function (roleJSON) {
            var role = null;
            var nodeList = this.__nodeList;
            if (roleJSON.elementType == 'link') {
                var nodeA = __getRoleByID(nodeList, roleJSON.nodeAID);
                var nodeZ = __getRoleByID(nodeList, roleJSON.nodeZID);
                role = new JTopo.Link(nodeA, nodeZ);
                for (var key in roleJSON) {
                    if (key == 'strokeColor') {
                        if (roleJSON.__linkType == 'CUSTOM') {
                            role.strokeColor = __getRGB(
                                SolutionColor.manualLink
                            );
                        } else {
                            role.strokeColor = __getRGB(SolutionColor.link);
                        }
                        continue;
                    }
                    role[key] = roleJSON[key];
                }
                this.__linkList.push(role);
            } else if (roleJSON.elementType == 'container') {
                role = new JTopo.Container();
                for (let key in roleJSON) {
                    role[key] = roleJSON[key];
                }
                if (roleJSON.childsID && roleJSON.childsID != undefined) {
                    for (var i = 0; i < roleJSON.childsID.length; i++) {
                        var child = __getRoleByID(
                            nodeList,
                            roleJSON.childsID[i]
                        );
                        if (child && child != undefined) role.add(child);
                    }
                }
                this.__bindContainerEvent(role);
                this.__containerList.push(role);
            } else if (roleJSON.elementType == 'node') {
                if (roleJSON.__nodeType == 'STATES') {
                    role = new JTopo.Node();
                } else {
                    role = new JTopo.CircleNode();
                }
                for (let key in roleJSON) {
                    role[key] = roleJSON[key];
                }

                var width = null;
                var height = null;
                if (roleJSON.__nodeType == 'STATES') {
                    width = role.width;
                    height = role.height;
                } else {
                    height = width = role.radius * 2 - 3;
                }
                if (roleJSON.__text) {
                    role.__text = roleJSON.__text;
                } else {
                    role.__text = roleJSON.text;
                }
                role.text = __breakLinesForCanvas(
                    role.__text,
                    width,
                    height,
                    __font
                );
                role.paintText = function (a) {
                    var b = this.text;
                    if (null != b && '' != b) {
                        a.beginPath();
                        a.font = this.font;
                        var c = a.measureText(b).width,
                            d = a.measureText('田').width;
                        a.fillStyle =
                            'rgba(' + this.fontColor + ', ' + this.alpha + ')';
                        var e = this.getTextPostion(this.textPosition, c, d);
                        a.wrapText(b, e.x, e.y);
                        a.closePath();
                    }
                };

                this.__bindNodeEvent(role);
                this.__nodeList.push(role);
            } else if (roleJSON.elementType == 'scene') {
                for (let key in roleJSON) {
                    this.__scene[key] = roleJSON[key];
                }
                return;
            }
            this.__scene.add(role);
        },

        // 用于删除自定义的线
        __removeJTopoElementByID: function (scene, _id) {
            if (scene.childs.length == 0) return -1;
            for (var i = 0; i < scene.childs.length; i++) {
                if (scene.childs[i]._id == _id) {
                    scene.remove(scene.childs[i]);
                    return 1;
                }
            }
            return 0;
        },

        // remove container and childs
        __removeJTopoContainer: function (scene, containerNode) {
            for (var j = 0; j < containerNode.childs.length; j++) {
                if (containerNode.childs[j].elementType == 'node')
                    scene.remove(containerNode.childs[j]);
            }
            scene.remove(containerNode);
        },

        removeRelationByJTopoID: function (scene, id) {
            for (var i = 0; i < scene.childs.length; i++) {
                if (scene.childs[i]._id == id) {
                    var link = scene.childs[i];
                    var relationID =
                        link.nodeA.__MSID + '__' + link.nodeZ.__MSID;
                    var relationList = this.__solution.solutionCfg.relationList;
                    for (var j = 0; j < relationList.length; j++) {
                        if (relationList[j]._id == relationID) {
                            relationList.splice(j, 1);
                            return;
                        }
                    }
                    break;
                }
            }
        },

        removeRelationByMSID: function (MSID) {
            var relationList = this.__solution.solutionCfg.relationList;
            for (var j = 0; j < relationList.length; j++) {
                var relation = relationList[j];
                if (relation.from.MSID == MSID || relation.to.MSID == MSID) {
                    relationList.splice(j, 1);
                }
            }
        },

        // 不支持container元素
        __getJTopoElementByID: function (scene, _id) {
            var roleList = scene.childs;
            if (roleList.length == 0) return null;
            for (var i = 0; i < roleList.length; i++) {
                if (
                    roleList[i]._id == _id &&
                    roleList[i].elementType != 'container'
                ) {
                    return roleList[i];
                }
            }
            return null;
        },

        __getServiceByID: function (id) {
            var serviceList = this.__solution.solutionCfg.serviceList;
            for (var i = 0; i < serviceList.length; i++) {
                if (serviceList[i]._id == id) {
                    return serviceList[i];
                }
            }
            return null;
        },
        // endregion

        // region dobule click dialog
        // TODO 数据不一定必须要上传，也有可能是以服务的形式接入进来
        // 上传数据，会添加到 __dataList 中
        __buildEventDialogDetail: function () {
            var node = this.__currentNode;
            var self = this;
            var type = node.__nodeType;
            var id = node.__MSID + '___' + node.__stateID + '___' + node.__eventName;
            id = id.replace(/\s/g, '-');
            var addDownBtn = function () {
                if (node.__gdid) {
                    // var ms = self.__getServiceByID(node.__MSID);
                    var stub = self.__getNodeStub(node);
                    var dataDownloadURL;
                    var dataVisualizationURL;
                    if (stub && stub.from) {
                        if (stub.from.posType === 'LOCAL') {
                            dataDownloadURL = `/integration/data/${stub.from.id}`;
                            dataVisualizationURL = `/visualizations?data-service=/integration/data/${stub.from.id}`;
                        } else if (stub.from.posType === 'MSC') {
                            dataDownloadURL = `http://${stub.from.host}:${stub.from.port}/geodata/${stub.from.id}`;
                            dataVisualizationURL = `/visualizations?data-service=http://${stub.from.host}:${stub.from.port}/geodata/${stub.from.id}`;
                        } else if (stub.from.posType === 'DSC') {
                            dataDownloadURL = `http://${stub.from.host}:${stub.from.port}/user/download?dataId=${stub.from.id}`;
                            dataVisualizationURL = `/visualizations?data-service=http://${stub.from.host}:${stub.from.port}/user/download?dataId=${stub.from.id}`;
                        }
                    }

                    if ($('#' + id + '-download-data').length) {
                        if ($('#' + id + '-visualization-data').length) {}
                    } else {
                        $('#' + id + '-download-div').remove();
                        $(
                            `<div id="${id}-download-div">
                                <p style="margin-top: 10px"><b>Download data: </b>&nbsp;&nbsp;
                                    <button id="${id}-download-data" class="btn btn-default btn-xs down-event-btn">Download</button>
                                </p>
                                <p style="margin-top: 10px"><b>Data visualization: </b>&nbsp;&nbsp;
                                    <button id="${id}-visualization-data" class="btn btn-default btn-xs down-event-btn">Visualization</button>
                                </p>
                            </div>`
                        ).appendTo($('#' + id));

                        $(`#${id}-visualization-data`).on('click', () => {
                            if (!self.__task._id) {
                                $('#save-aggre-task-modal').modal('show');
                            } else {
                                window.open(dataVisualizationURL);
                            }
                        });

                        $(`#${id}-download-data`).on('click', () => {
                            // 必须先保存task才能下载
                            if (!self.__task._id) {
                                $('#save-aggre-task-modal').modal('show');
                            } else {
                                if (dataDownloadURL) {
                                    window.open(dataDownloadURL);
                                } else {
                                    alert('could not found the data!');
                                }
                            }
                        });
                    }
                }
            };

            if ($('#' + id).length) {
                $('#' + id)
                    .parent()
                    .show();
                $('#' + id)
                    .parent()
                    .css('z-index', __getMaxZIndex() + 1);
            } else {
                // region append event information
                var eventDetail = __getEventDetail(
                    node.__serviceType,
                    node.__stateID,
                    node.__eventName,
                    node.__MSID,
                    self.__solution.solutionCfg.serviceList
                );
                var $dataInfoDialog = null;

                if (eventDetail == null) {
                    $dataInfoDialog = $(
                        '<div id="' +
                        id +
                        '" class="data-info-dialog" title="Data Information">' +
                        'Unknown data schema' +
                        '</div>'
                    );
                } else {
                    var eventName = null;
                    var eventType = null;
                    var eventDesc = null;
                    var optional = null;
                    var schemaStr = null;
                    if (node.__serviceType == 'model') {
                        eventName = eventDetail.event._$.name;
                        eventType =
                            eventDetail.event._$.type == 'response' ?
                            'Input' :
                            'Output';
                        eventDesc = eventDetail.event._$.description;
                        optional = __isTrue(eventDetail.event._$.optional);
                        // schemaStr = JSON.stringify(eventDetail.schema,null,4);
                        schemaStr =
                            '<p><b>UDX Schema: </b></p><pre style="width:100%;max-height:300px">' +
                            eventDetail.schema +
                            '</pre>';
                    } else if (node.__serviceType == 'data refactor') {
                        eventName = eventDetail.event.name;
                        eventType = eventDetail.event.type;
                        eventDesc = eventDetail.event.description;
                        optional = __isTrue(eventDetail.event.optional);
                        schemaStr = '';
                        // schemaStr = '<p><b>UDX Schema: </b></p><pre style="width:100%;height:300px">' + eventDetail.schema + '</pre>';
                    } else if (node.__serviceType == 'data map') {
                        eventName = eventDetail.event.name;
                        eventType = eventDetail.event.type;
                        eventDesc = eventDetail.event.description;
                        optional = __isTrue(eventDetail.event.optional);
                        schemaStr = '';
                    }

                    $dataInfoDialog = $(`
                        <div id="${id}" class="data-info-dialog" title="Data Information">
                            <p><b>Name: </b><span>${eventName}</span></p>
                            <p><b>Type: </b><span>${eventType}</span></p>
                            <p><b>Description: </b><span>${eventDesc}</span></p>
                            <p><b>Optional: </b><span>${optional}</span></p>
                            ${schemaStr}
                        </div>
                    `);
                }
                // endregion

                $dataInfoDialog.appendTo($('#aggreDIV'));
                $dataInfoDialog.dialog({
                    width: 350,
                    modal: false,
                    create: function () {
                        $(this).css('maxHeight', 500);
                    }
                });
                $('#' + id).parent().addClass('dataInfo-ui-dialog');

                if (this.__mode == 'configure') {
                    // 如果模型状态是 unready 或者 pause，才允许上传数据
                    var msStateList = self.__task.MSState;
                    var msState = null;
                    for (let i = 0; i < msStateList.length; i++) {
                        if (msStateList[i].MSID == node.__MSID) {
                            msState = msStateList[i];
                            break;
                        }
                    }
                    if (
                        msState == null ||
                        msState.state == MSState.unready ||
                        msState.state == MSState.pause
                    ) {
                        if (
                            (node.__nodeType == 'INPUT' ||
                                node.__nodeType == 'CONTROL') &&
                            !__is2Node(
                                node,
                                self.__solution.solutionCfg.relationList
                            )
                        ) {
                            $(`
                                <div style='margin-bottom: 10px;'>
                                    <p><b>Upload data: </b></p>
                                    <input id="${id}-upload-data" name="myfile" type="file" class="file">
                                </div>
                            `).appendTo($dataInfoDialog);

                            // select from DSC
                            $(`
                                <div style='margin-bottom: 10px;'>
                                    <p><b>Select data: </b></p>
                                    <span class='select-data-input-group'>
                                        <div tabindex='2' id='${id}-upload-data-input' type='text'></div>
                                        <span>
                                            <span tabindex="500" id='${id}-delete' title="Clear selected files" style='display: none;margin-right: -5px; border-radius: 0; border-left: none;' class="btn btn-default fileinput-remove fileinput-remove-button">
                                                <i class="glyphicon glyphicon-trash"></i>
                                            </span>
                                            <button class='btn btn-primary' id="${id}-select-data">
                                                <i class="glyphicon glyphicon-folder-open"></i>
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            `).appendTo($dataInfoDialog);

                            const DSCstr = localStorage.getItem('DSC');
                            const DSC = JSON.parse(DSCstr);
                            // const host = '172.21.212.85';
                            // const port = '8899';
                            const host = '106.14.78.235';
                            const port = '8899';

                            $(`#${id}-delete`).on('click', () => {
                                $(`#${id}-delete`).hide();
                                $(`#${id}-upload-data-input`).empty();
                                $(`#${id}-download-div`).remove();

                                node.__gdid = null;
                                node.__isInput = false;
                                node.fillColor = __getRGB(EventColor.origin);
                                var dataList = self.__task.taskCfg.dataList;
                                _.remove(dataList, item => item.MSID === node.__MSID && item.eventName === node.__eventName && item.stateID === node.__stateID)
                            });

                            $(`#${id}-select-data`).on('click', () => {
                                // 这里设置接受数据的 id
                                window.currentDataId = id;
                                let fmUrl = `http://${host}:${port}/user/filemanager?parent-origin=${window.origin}`;
                                let targetWindow = window.open(fmUrl, 'self-filemanager-dlg', 'height=500,width=900,top=100,left=100');

                                window.addEventListener('message', (e) => {
                                    console.log(e.origin);
                                    if (e.origin === `http://${host}:${port}`) {
                                        let data = JSON.parse(e.data);
                                        if (data.code === 'filemanager') {
                                            // console.log(data.msg);

                                            $(`#${id}-upload-data-input`).append(data.msg.filename);
                                            $(`#${id}-delete`).show();

                                            self.__hasChanged = true;
                                            var ms = self.__getServiceByID(node.__MSID);
                                            // TODO
                                            var inputData = {
                                                from: {
                                                    host: host,
                                                    port: port,
                                                    posType: 'DSC',
                                                    id: data.msg.oid
                                                },
                                                to: {
                                                    host: ms.host,
                                                    port: ms.port,
                                                    serviceType: ms.serviceType
                                                },
                                                state: DataState.ready,
                                                isInput: true,
                                                isMid: false,

                                                fname: data.msg.filename,

                                                MSID: node.__MSID,
                                                stateID: node.__stateID,
                                                eventName: node.__eventName
                                            };

                                            var hasInserted = false;
                                            var dataList = self.__task.taskCfg.dataList;
                                            for (var i = 0; i < dataList.length; i++) {
                                                // 已经上传过，重新上传替换
                                                if (
                                                    dataList[i].MSID == node.__MSID &&
                                                    dataList[i].stateID ==
                                                    node.__stateID &&
                                                    dataList[i].eventName ==
                                                    node.__eventName
                                                ) {
                                                    dataList[i].id = data.msg.oid;
                                                    hasInserted = true;
                                                    break;
                                                }
                                            }

                                            if (!hasInserted) {
                                                dataList.push(inputData);
                                            }
                                            node.__isInput = true;
                                            node.__gdid = data.msg.oid;
                                            node.fillColor = __getRGB(EventColor.input);

                                            addDownBtn();

                                            $.gritter.add({
                                                title: 'Notice:',
                                                text: 'Select data success!',
                                                sticky: false,
                                                time: 2000
                                            });
                                            return;
                                        }
                                    }
                                });

                                // let parentOrigin;
                                // let groups = window.location.href.split('/\?|\&/g');
                                // for(let i=0;i<groups.length; i++) {
                                //     if(groups[i].indexOf('parent-origin') != -1) {
                                //         parentOrigin = groups[i].substr('parent-origin='.length);
                                //     }
                                // }
                                // if(parentOrigin) {
                                //     window.opener.postMessage(JSON.stringify({
                                //         code: 'filemanager',
                                //         msg: {
                                //             parentid: parentid,
                                //             filename: filename,
                                //             format: format, 
                                //             oid: oid
                                //         }
                                //     }), parentOrigin);
                                // }
                            });

                            // TODO 验证数据合法性
                            $('#' + id + '-upload-data')
                                .fileinput({
                                    uploadUrl: '/integration/data',
                                    // allowedFileExtensions: (node.__serviceType == 'data map')?[]:['xml','zip'],
                                    allowedFileExtensions: [],
                                    aploadAsync: true,
                                    showPreview: false,
                                    showUpload: true,
                                    showRemove: true,
                                    showClose: false,
                                    showUploadedThumbs: false,
                                    autoReplace: true,
                                    maxFileCount: 1,
                                    uploadLabel: '',
                                    removeLabel: '',
                                    cancelLabel: '',
                                    browseLabel: ''
                                })
                                .on('fileselect', function (
                                    event,
                                    numFiles,
                                    label
                                ) {
                                    $(
                                        '#' + id + ' .fileinput-remove-button'
                                    ).on('click', function (e) {
                                        node.__gdid = null;
                                        $('#' + id + '-download-div').remove();
                                    });
                                })
                                .on('fileuploaded', function (
                                    e,
                                    data,
                                    previewId,
                                    index
                                ) {
                                    if (data.response.res != 'suc') {
                                        $.gritter.add({
                                            title: 'Warning:',
                                            text: 'Upload data failed!',
                                            sticky: false,
                                            time: 2000
                                        });
                                        return;
                                    }
                                    self.__hasChanged = true;
                                    var gdid = data.response.gd_id;
                                    var fname = data.response.fname;
                                    var ms = self.__getServiceByID(node.__MSID);
                                    // TODO
                                    var inputData = {
                                        from: {
                                            host: 'localhost',
                                            port: '',
                                            posType: 'LOCAL',
                                            id: gdid
                                        },
                                        to: {
                                            host: ms.host,
                                            port: ms.port,
                                            serviceType: ms.serviceType
                                        },
                                        state: DataState.ready,
                                        isInput: true,
                                        isMid: false,

                                        fname: fname,

                                        MSID: node.__MSID,
                                        stateID: node.__stateID,
                                        eventName: node.__eventName
                                    };

                                    var hasInserted = false;
                                    var dataList = self.__task.taskCfg.dataList;
                                    for (var i = 0; i < dataList.length; i++) {
                                        // 已经上传过，重新上传替换
                                        if (
                                            dataList[i].MSID == node.__MSID &&
                                            dataList[i].stateID ==
                                            node.__stateID &&
                                            dataList[i].eventName ==
                                            node.__eventName
                                        ) {
                                            dataList[i].id = gdid;
                                            hasInserted = true;
                                            break;
                                        }
                                    }

                                    if (!hasInserted) {
                                        dataList.push(inputData);
                                    }
                                    node.__isInput = true;
                                    node.__gdid = gdid;
                                    node.fillColor = __getRGB(EventColor.input);

                                    addDownBtn();

                                    $.gritter.add({
                                        title: 'Notice:',
                                        text: 'Upload data success!',
                                        sticky: false,
                                        time: 2000
                                    });
                                    return;
                                })
                                .on('fileerror', function (e, data) {
                                    $.gritter.add({
                                        title: 'Warning:',
                                        text: '<pre>' +
                                            JSON.stringify(error, null, 4) +
                                            '</pre>',
                                        sticky: false,
                                        time: 2000
                                    });
                                });
                        }
                    }
                }
                // close event
                $('.ui-dialog-titlebar-close').click(function (e) {
                    $(this)
                        .parent()
                        .parent()
                        .hide();
                });
            }
            // download button
            addDownBtn();
        },

        __buildStatesDialogDetail: function () {
            var node = this.__currentNode;
            var self = this;
            var type = node.__nodeType;
            var id = node.__MSID + '-states-dialog';
            if ($('#' + id).length) {
                $('#' + id).parent().show();
                $('#' + id).parent().css('z-index', __getMaxZIndex() + 1);
            } else {
                var serviceDetail = __getServiceDetail(
                    node.__serviceType,
                    node.__MSID,
                    self.__solution.solutionCfg.serviceList
                );

                var $serviceInfoDialog = null;
                if (serviceDetail == null) {
                    $serviceInfoDialog = $(
                        '<div id="' +
                        id +
                        '" class="service-info-dialog" title="Service Information">' +
                        'Parse model service language failed!' +
                        '</div>'
                    );
                } else {
                    if (node.__serviceType == 'model') {
                        var category = serviceDetail.attributeSet.categories;
                        var localAttributes =
                            serviceDetail.attributeSet.localAttributes;
                        var states = serviceDetail.states;

                        $serviceInfoDialog = $(
                            '<div id="' +
                            id +
                            '" class="service-info-dialog" title="Service Information">' +
                            '<div id="' +
                            id +
                            '-Categories">' +
                            '<h4>Categories:</h4>' +
                            '<p><b>Principle: </b><span>' +
                            category.principle +
                            '</span></p>' +
                            '<p><b>Path: </b><span>' +
                            category.path +
                            '</span></p>' +
                            '</div>' +
                            '<hr style="opacity: 0.3">' +
                            '<div id="' +
                            id +
                            '-LocalAttributes"><h4>LocalAttributes:</h4>' +
                            '<ul id="' +
                            id +
                            '-tab" class="nav nav-tabs"></ul>' +
                            '<div id="' +
                            id +
                            '-tab-content" class="tab-content"></div>' +
                            '</div>' +
                            '<hr style="opacity: 0.3">' +
                            '<div id="' +
                            id +
                            '-States">' +
                            '<h4>State list:</h4>' +
                            '<div id="' +
                            id +
                            '-states-div"></div>' +
                            '<div>' +
                            '<hr style="opacity: 0.3">' +
                            '<h4>Position:</h4>' +
                            '<p><b>Host:</b><span> ' +
                            serviceDetail.host +
                            '</span></p>' +
                            '<p><b>Port:</b><span> ' +
                            serviceDetail.port +
                            '</span></p>' +
                            '</div>' +
                            '</div>' +
                            '</div>'
                        );
                        $serviceInfoDialog.appendTo($('#aggreDIV'));
                        for (let i = 0; i < localAttributes.length; i++) {
                            if (
                                localAttributes[i].Keywords &&
                                localAttributes[i].Abstract
                            ) {
                                var tabTitle =
                                    localAttributes[i]._$.localName == '' ?
                                    'Undefined' :
                                    localAttributes[i]._$.localName;
                                $('#' + id + '-tab').append(
                                    $(
                                        '<li>' +
                                        '<a href="' +
                                        localAttributes[i]._$.local +
                                        '" data-toggle="tab">' +
                                        tabTitle +
                                        '</span>' +
                                        '</li>'
                                    )
                                );
                                $('#' + id + '-tab-content').append(
                                    $(
                                        '<div class="tab-pane fade" id="' +
                                        localAttributes[i]._$.local +
                                        '"></div>'
                                    )
                                );
                                if (localAttributes[i].Keywords) {
                                    $('#' + localAttributes[i]._$.local).append(
                                        '<p style="padding-top: 10px"><b>Keywords: </b><span>' +
                                        localAttributes[i].Keywords +
                                        '</span></p>'
                                    );
                                }
                                if (localAttributes[i].Abstract) {
                                    $('#' + localAttributes[i]._$.local).append(
                                        '<p><b>Abstract: </b><span>' +
                                        localAttributes[i].Abstract +
                                        '</span></p>'
                                    );
                                }
                            }
                        }
                        var $a = $('#' + id + '-tab li a');
                        for (let i = 0; i < $a.length; i++) {
                            $a[i].blur();
                        }
                        if ($('#' + id + '-tab').children().length == 0) {
                            $('#' + '-LocalAttributes').empty();
                        }
                        $($('#' + id + '-tab').children()[0]).addClass(
                            'active'
                        );
                        $($('#' + id + '-tab-content').children()[0]).addClass(
                            'in active'
                        );
                        for (let i = 0; i < states.length; i++) {
                            $('#' + id + '-states-div').append(
                                $(
                                    '<p><b>State name: </b>' +
                                    states[i].name +
                                    '</p>' +
                                    '<p><b>State type: </b>' +
                                    states[i].type +
                                    '</p>' +
                                    '<p><b>State description: </b>' +
                                    states[i].description +
                                    '</p>'
                                )
                            );
                            // if(i!=states.length-1){
                            //     $('#' + id + '-states-div').append($('<hr>'));
                            // }
                        }
                    } else if (
                        node.__serviceType == 'data refactor' ||
                        node.__serviceType == 'data map'
                    ) {
                        $serviceInfoDialog = $(
                            '<div id="' +
                            id +
                            '" class="service-info-dialog" title="Service Information">' +
                            '<p><b>Name: </b><span>' +
                            serviceDetail.DS.name +
                            '</span></p>' +
                            '<p><b>Author: </b><span>' +
                            serviceDetail.DS.author +
                            '</span></p>' +
                            '<p><b>Time: </b><span>' +
                            serviceDetail.DS.datetime +
                            '</span></p>' +
                            '<p><b>Description: </b><span>' +
                            serviceDetail.DS.description +
                            '</span></p>' +
                            '<p><b>Detail: </b><span>' +
                            serviceDetail.DS.details +
                            '</span></p>' +
                            '<p><b>Direction: </b><span>' +
                            node.__callType +
                            '</span></p>' +
                            '<p><b>Host:</b> <span> ' +
                            serviceDetail.host +
                            '</span></p>' +
                            '<p><b>Port:</b><span> ' +
                            serviceDetail.port +
                            '</span></p>' +
                            '</div>'
                        );
                    }
                }

                $serviceInfoDialog.dialog({
                    width: 350,
                    modal: false,
                    create: function () {
                        $(this).css('maxHeight', 500);
                    }
                });
                $('#' + id)
                    .parent()
                    .find('.ui-dialog-title')
                    .css('font-size', '18px');
                $('#' + id)
                    .parent()
                    .addClass('dataInfo-ui-dialog');
                $('.ui-dialog-titlebar-close').click(function (e) {
                    $(this)
                        .parent()
                        .parent()
                        .hide();
                });
            }
        },
        // endregion

        // region add/delete service role
        addServiceRole: function (service) {
            // 增加调用描述语言CDL
            let __convert2SADLService = (service) => {
                var SADLService = null;
                if (service.serviceType == 'model') {
                    SADLService = service;
                } else if (service.serviceType == 'data map') {
                    SADLService = {
                        _id: ObjectID().str,
                        host: service.host,
                        port: service.port,
                        serviceType: service.serviceType,
                        DS: {
                            _id: service._id,
                            name: service.name,
                            description: service.description,
                            uname: service.uname,
                            uemail: service.uemail,
                            author: service.author,
                            datetime: service.datetime,
                            // snapshot: service.snapshot,
                            available: service.available,
                            details: service.details,
                            uid: service.uid,
                            associate: service.associate,
                            delete: service.delete,
                            deletetime: service.deletetime
                        },
                        CDL: {
                            SchemaGroup: [],
                            StateGroup: {
                                StateTransitions: {},
                                States: [{
                                    id: 'data map state',
                                    name: 'Default',
                                    type: 'basic',
                                    description: '',
                                    Events: [{
                                            type: 'in',
                                            name: 'Source',
                                            description: 'input data',
                                            optional: 0,
                                            datasetReference: ''
                                        },
                                        {
                                            type: 'out',
                                            name: 'UDX',
                                            description: 'output data',
                                            optional: 0,
                                            datasetReference: ''
                                        }
                                    ]
                                }]
                            }
                        }
                    };
                } else if (service.serviceType == 'data refactor') {
                    SADLService = {
                        _id: ObjectID().str,
                        host: service.host,
                        port: service.port,
                        serviceType: service.serviceType,
                        DS: {
                            _id: service.refactorId,
                            method: service.name,
                            name: service.method.$.name,
                            class: service.method.$.class,
                            description: service.method.$.description
                        },
                        CDL: {
                            SchemaGroup: [],
                            StateGroup: {
                                StateTransitions: {},
                                States: [{
                                    id: 'data refactor state',
                                    name: 'Default',
                                    type: 'basic',
                                    description: '',
                                    Events: _.map(service.method.Params, event => {
                                        return {
                                            type: event.$.type,
                                            description: event.$.description,
                                            name: event.$.name,
                                            optional: 0,
                                            datasetReference: event.$.schema
                                        };
                                    })
                                }]
                            }
                        }
                    };
                }
                return SADLService;
            }

            // {
            //     _id: ObjectId,
            //     host:String,
            //     port:String,
            //     MS:Object,
            //     MDL:Object
            // }
            let __addModelService = (SADLService) => {
                if (SADLService.id) delete SADLService.id;
                var self = this;
                //暂时只有一个state

                // var stateID = null;
                // var states = SADLService.MDL.ModelClass.Behavior.StateGroup.States.State;
                // if(states instanceof Array){
                //
                // }
                // else{
                //     states = [states];
                // }
                // stateID = states[0]._$.id;

                var event = __getEventsFromMDL(SADLService.MDL);
                var eventCount = event.length;
                var scale = eventCount <= 4 ? 1 : Math.pow(0.99, eventCount);
                var linkScale = scale === 1 ? 1 : 2 - scale;
                var canvasW = $('#canvas-div').width() / 2;
                var canvasH = $('#canvas-div').height() / 2;

                var container = this.__addJTopoContainer();
                var stateNodeX =
                    (window.event.layerX - canvasW) / this.__scene.scaleX -
                    this.__scene.translateX +
                    canvasW;
                var stateNodeY =
                    (window.event.layerY - canvasH) / this.__scene.scaleY -
                    this.__scene.translateY +
                    canvasH;
                var stateNode = this.__addJTopoNode(
                    stateNodeX,
                    stateNodeY,
                    SADLService.MS.ms_model.m_name,
                    'STATES',
                    scale
                );
                // 有可能会出现一个服务使用多次的情况，所以_id得在前台生成
                var __service = JSON.parse(JSON.stringify(SADLService));
                __service._id = ObjectID().str;
                this.__solution.solutionCfg.serviceList.push(__service);

                stateNode.__MSID = __service._id;
                stateNode.__nodeType = 'STATES';
                stateNode.__containerID = container._id;
                stateNode.__serviceType = 'model';

                this.__task.MSState.push({
                    state: MSState.unready,
                    MSID: __service._id,
                    host: __service.host,
                    port: __service.port,
                    serviceType: __service.serviceType
                });
                this.__bindNodeEvent(stateNode);
                container.add(stateNode);

                var inputCount = 0;
                var outputCount = 0;
                var controlCount = 0;
                for (var j = 0; j < eventCount; j++) {
                    if (typeof event[j].ResponseParameter !== 'undefined') {
                        inputCount++;
                    } else if (typeof event[j].DispatchParameter !== 'undefined') {
                        outputCount++;
                    } else if (typeof event[j].ControlParameter !== 'undefined') {
                        controlCount++;
                    }
                }
                var dx = __DATA_RADIUS * 4.5 * linkScale * this.__scene.scaleX;
                var dy = __DATA_RADIUS * 2.5 * linkScale * this.__scene.scaleY;
                var k = 0;
                for (var i = 0; i < eventCount; i++) {
                    var nodeA = null;
                    var x = null;
                    var y = null;
                    var type = null;
                    var link = null;
                    if (typeof event[i].DispatchParameter !== 'undefined') {
                        type = 'OUTPUT';
                    } else {
                        x =
                            (window.event.layerX - dx - canvasW) /
                            this.__scene.scaleX -
                            this.__scene.translateX +
                            canvasW;
                        y =
                            (window.event.layerY -
                                ((inputCount + controlCount - 1) / 2 - k) * dy -
                                canvasH) /
                            this.__scene.scaleY -
                            this.__scene.translateY +
                            canvasH;
                        if (typeof event[i].ResponseParameter !== 'undefined') {
                            type = 'INPUT';
                        } else if (
                            typeof event[i].ControlParameter !== 'undefined'
                        ) {
                            type = 'CONTROL';
                        }
                        k++;
                    }
                    var optional = event[i]._$.optional;
                    optional = __isTrue(optional);
                    nodeA = this.__addJTopoNode(
                        x,
                        y,
                        event[i]._$.name,
                        type,
                        scale,
                        optional
                    );
                    nodeA.__nodeType = type;
                    nodeA.__MSID = __service._id;
                    nodeA.__stateID = event[i].stateID;
                    nodeA.__eventName = event[i]._$.name;
                    nodeA.__optional = optional;
                    nodeA.__serviceType = 'model';
                    this.__bindNodeEvent(nodeA);
                    container.add(nodeA);

                    if (typeof event[i].DispatchParameter !== 'undefined') {
                        link = this.__addJTopoLink(stateNode, nodeA);
                        link.__linkType = 'OUT';
                    } else {
                        link = this.__addJTopoLink(nodeA, stateNode);
                        link.__linkType = 'IN';
                    }
                }
                JTopo.layout.layoutNode(this.__scene, stateNode, true);
            }

            // _id, host, port, DS, CDL, serviceType
            let __addDataMapService = (service) => {
                var self = this;

                service.callType = 'src2udx';
                this.__solution.solutionCfg.serviceList.push(service);
                this.__task.MSState.push({
                    state: MSState.unready,
                    MSID: service._id,
                    host: service.host,
                    port: service.port,
                    serviceType: service.serviceType
                });

                var scale = 1;
                var linkScale = 1;
                var canvasW = $('#canvas-div').width() / 2;
                var canvasH = $('#canvas-div').height() / 2;

                var container = this.__addJTopoContainer();
                var stateNodeX =
                    (window.event.layerX - canvasW) / this.__scene.scaleX -
                    this.__scene.translateX +
                    canvasW;
                var stateNodeY =
                    (window.event.layerY - canvasH) / this.__scene.scaleY -
                    this.__scene.translateY +
                    canvasH;
                var serviceName = service.DS.name;
                var stateNode = this.__addJTopoNode(
                    stateNodeX,
                    stateNodeY,
                    serviceName,
                    'STATES',
                    scale
                );
                // 有可能会出现一个服务使用多次的情况，所以_id得在前台生成

                stateNode.__MSID = service._id;
                stateNode.__nodeType = 'STATES';
                stateNode.__containerID = container._id;
                stateNode.__serviceType = service.serviceType;
                stateNode.__callType = 'src2udx';

                this.__bindNodeEvent(stateNode);
                container.add(stateNode);

                var inputCount = 1;
                var outputCount = 1;
                var controlCount = 0;
                var dx = __DATA_RADIUS * 4.5 * linkScale * this.__scene.scaleX;
                var dy = __DATA_RADIUS * 2.5 * linkScale * this.__scene.scaleY;
                var k = 0;

                var state = service.CDL.StateGroup.States[0];
                var event = state.Events;

                for (var i = 0; i < event.length; i++) {
                    var nodeA = null;
                    var x = null;
                    var y = null;
                    var type = null;
                    var link = null;
                    if (event[i].type == 'out') {
                        type = 'OUTPUT';
                    } else {
                        x =
                            (window.event.layerX - dx - canvasW) /
                            this.__scene.scaleX -
                            this.__scene.translateX +
                            canvasW;
                        y =
                            (window.event.layerY -
                                ((inputCount + controlCount - 1) / 2 - k) * dy -
                                canvasH) /
                            this.__scene.scaleY -
                            this.__scene.translateY +
                            canvasH;
                        type = 'INPUT';
                    }
                    var optional = event[i].optional;
                    optional =
                        optional == '0' || optional == 0 || optional == false ?
                        false :
                        true;
                    nodeA = this.__addJTopoNode(
                        x,
                        y,
                        event[i].name,
                        type,
                        scale,
                        optional
                    );
                    nodeA.__nodeType = type;
                    nodeA.__MSID = service._id;
                    nodeA.__stateID = state.id;
                    nodeA.__eventName = event[i].name;
                    nodeA.__optional = optional;
                    nodeA.__serviceType = service.serviceType;
                    this.__bindNodeEvent(nodeA);
                    container.add(nodeA);

                    if (event[i].type == 'out') {
                        link = this.__addJTopoLink(stateNode, nodeA);
                        link.__linkType = 'OUT';
                    } else {
                        link = this.__addJTopoLink(nodeA, stateNode);
                        link.__linkType = 'IN';
                    }
                }
                JTopo.layout.layoutNode(this.__scene, stateNode, true);
            }

            let __addDataRefactorService = (service) => {
                var self = this;

                this.__solution.solutionCfg.serviceList.push(service);
                this.__task.MSState.push({
                    state: MSState.unready,
                    MSID: service._id,
                    host: service.host,
                    port: service.port,
                    serviceType: service.serviceType
                });

                var scale = 1;
                var linkScale = 1;
                var canvasW = $('#canvas-div').width() / 2;
                var canvasH = $('#canvas-div').height() / 2;

                var container = this.__addJTopoContainer();
                var stateNodeX =
                    (window.event.layerX - canvasW) / this.__scene.scaleX -
                    this.__scene.translateX +
                    canvasW;
                var stateNodeY =
                    (window.event.layerY - canvasH) / this.__scene.scaleY -
                    this.__scene.translateY +
                    canvasH;
                var serviceName = service.DS.name;
                var stateNode = this.__addJTopoNode(
                    stateNodeX,
                    stateNodeY,
                    serviceName,
                    'STATES',
                    scale
                );
                // 有可能会出现一个服务使用多次的情况，所以_id得在前台生成

                stateNode.__MSID = service._id;
                stateNode.__nodeType = 'STATES';
                stateNode.__containerID = container._id;
                stateNode.__serviceType = service.serviceType;

                this.__bindNodeEvent(stateNode);
                container.add(stateNode);

                var inputCount = 1;
                var outputCount = 1;
                var controlCount = 0;
                var dx = __DATA_RADIUS * 4.5 * linkScale * this.__scene.scaleX;
                var dy = __DATA_RADIUS * 2.5 * linkScale * this.__scene.scaleY;
                var k = 0;

                var state = service.CDL.StateGroup.States[0];
                var event = state.Events;

                for (var i = 0; i < event.length; i++) {
                    var nodeA = null;
                    var x = null;
                    var y = null;
                    var type = null;
                    var link = null;
                    if (event[i].type == 'out') {
                        type = 'OUTPUT';
                    } else {
                        x =
                            (window.event.layerX - dx - canvasW) /
                            this.__scene.scaleX -
                            this.__scene.translateX +
                            canvasW;
                        y =
                            (window.event.layerY -
                                ((inputCount + controlCount - 1) / 2 - k) * dy -
                                canvasH) /
                            this.__scene.scaleY -
                            this.__scene.translateY +
                            canvasH;
                        type = 'INPUT';
                    }
                    var optional = event[i].optional;
                    optional =
                        optional == '0' || optional == 0 || optional == false ?
                        false :
                        true;
                    nodeA = this.__addJTopoNode(
                        x,
                        y,
                        event[i].name,
                        type,
                        scale,
                        optional
                    );
                    nodeA.__nodeType = type;
                    nodeA.__MSID = service._id;
                    nodeA.__stateID = state.id;
                    nodeA.__eventName = event[i].name;
                    nodeA.__optional = optional;
                    nodeA.__serviceType = service.serviceType;
                    this.__bindNodeEvent(nodeA);
                    container.add(nodeA);

                    if (event[i].type == 'out') {
                        link = this.__addJTopoLink(stateNode, nodeA);
                        link.__linkType = 'OUT';
                    } else {
                        link = this.__addJTopoLink(nodeA, stateNode);
                        link.__linkType = 'IN';
                    }
                }
                JTopo.layout.layoutNode(this.__scene, stateNode, true);
            }

            this.__hasChanged = true;
            service = __convert2SADLService(service);
            if (service.serviceType == 'model') {
                __addModelService(service);
            } else if (service.serviceType == 'data map') {
                __addDataMapService(service);
            } else if (service.serviceType == 'data refactor') {
                __addDataRefactorService(service);
            }
        },

        removeServiceRole: function (serviceNode) {
            this.__hasChanged = true;
            var self = this;
            var roleList = self.__scene.childs;
            var serviceList = this.__solution.solutionCfg.serviceList;
            for (var j = 0; j < serviceList.length; j++) {
                if (serviceList[j]._id == serviceNode.__MSID) {
                    serviceList.splice(j, 1);
                    break;
                }
            }
            for (var i = 0; i < roleList.length; i++) {
                if (
                    roleList[i].elementType == 'container' &&
                    roleList[i]._id == serviceNode.__containerID
                ) {
                    self.__removeJTopoContainer(self.__scene, roleList[i]);
                    break;
                }
            }
            this.removeRelationByMSID(serviceNode.__MSID);
            self.__stage.paint();
        },
        // endregion

        // region import and export
        // TODO 优化，添加 role 时直接放在 __solution 中
        __getLayoutCfg: function () {
            var self = this;
            this.__scene.mode = 'normal';
            var layout = {
                linkList: [],
                containerList: [],
                nodeList: [],
                scene: __myLayout(this.__scene)
            };
            for (var i = 0; i < self.__scene.childs.length; i++) {
                var role = self.__scene.childs[i];
                var roleJSON = __myLayout(role);
                if (role.elementType == 'container') {
                    layout.containerList.push(roleJSON);
                } else if (role.elementType == 'link') {
                    layout.linkList.push(roleJSON);
                } else if (role.elementType == 'node') {
                    layout.nodeList.push(roleJSON);
                }
            }
            return layout;
        },

        __getSolutionCfg: function () {
            return {
                serviceList: this.__solution.solutionCfg.serviceList,
                relationList: this.__solution.solutionCfg.relationList
            };
        },

        __getNodeStub: function (node) {
            this.__task;
            return _.find(this.__task.taskCfg.dataList, stub => stub.MSID === node.__MSID && stub.stateID === node.__stateID && stub.eventName === node.__eventName);
        },

        __importRoleByJSON: function (roleList) {
            for (var i = 0; i < roleList.length; i++) {
                this.__addJTopoElementByJSON(roleList[i]);
            }
        },

        // 根据state更新颜色，并将数据链接添加到dialog中
        __importDataList: function () {
            var dataList = this.__task.taskCfg.dataList;
            var roleList = this.__scene.childs;
            for (let i = 0; i < roleList.length; i++) {
                let role = roleList[i];
                if (role.elementType == 'node') {
                    for (let j = 0; j < dataList.length; j++) {
                        var data = dataList[j];
                        if (
                            role.__MSID == data.MSID &&
                            role.__stateID == data.stateID &&
                            role.__eventName == data.eventName
                        ) {
                            // role.shadow = true;
                            // role.shadowColor = 'rgba(0,0,0,1)';
                            if (data.state) {
                                if (data.isInput) {
                                    role.__isInput = data.isInput;
                                    role.fillColor = __getRGB(EventColor.input);
                                } else {
                                    role.fillColor = __getRGB(
                                        EventColor[data.state.toLowerCase()]
                                    );
                                }
                            }

                            role.__gdid = data.id;
                            // 设置上传按钮的显示，添加下载链接
                        }
                    }
                }
            }
            this.__stage.paint();
        },

        __importStatesState: function () {
            var MSState = this.__task.MSState;
            var roleList = this.__scene.childs;
            for (let i = 0; i < roleList.length; i++) {
                let role = roleList[i];
                if (role.elementType == 'node' && role.__nodeType == 'STATES') {
                    for (let j = 0; j < MSState.length; j++) {
                        var service = MSState[j];
                        if (role.__MSID == service.MSID) {
                            if (service.state) {
                                role.fillColor = __getRGB(
                                    StatesColor[service.state.toLowerCase()]
                                );
                                role.__state = service.state;
                            }
                        }
                    }
                }
            }
            this.__stage.paint();
        },

        exportSolution: function () {
            let _id;
            if (
                $('#solutionID-input').length &&
                $('#solutionID-input').attr('value') &&
                $('#solutionID-input').attr('value') != undefined
            ) {
                _id = $('#solutionID-input').attr('value');
            }
            return {
                _id: _id,
                layoutCfg: this.__getLayoutCfg(),
                solutionCfg: this.__getSolutionCfg(),
                solutionInfo: this.__solution.solutionInfo
            };
        },

        importSolution: function () {
            var solution = this.__solution;
            var self = this;
            // this.__serviceList = solution.solutionCfg.serviceList;
            // this.__relationList = solution.solutionCfg.relationList;

            var sceneJSON = solution.layoutCfg.scene;
            this.__addJTopoElementByJSON(sceneJSON);
            var containerList = solution.layoutCfg.containerList;
            var nodeList = solution.layoutCfg.nodeList;
            var linkList = solution.layoutCfg.linkList;
            this.__importRoleByJSON(nodeList);
            this.__importRoleByJSON(containerList);
            this.__importRoleByJSON(linkList);
            self.__stage.paint();

            // init MSState
            if (location.href.indexOf('integration/task/new') != -1) {
                var MSState = this.__task.MSState;
                var serviceList = this.__solution.solutionCfg.serviceList;
                for (let i = 0; i < serviceList.length; i++) {
                    MSState.push({
                        MSID: serviceList[i]._id,
                        state: 'UNREADY',
                        host: serviceList[i].host,
                        port: serviceList[i].port,
                        serviceType: serviceList[i].serviceType
                    });
                }
            }
        },

        importTask: function () {
            this.importSolution();
            this.__importDataList();
            this.__importStatesState();
        },

        initLegend: function () {
            if (this.__type == 'solution') {
                let trList = $('#solution-table tr');
                for (let i = 0; i < trList.length; i++) {
                    let $pic = $(trList[i]).find('td:nth-child(1) div');
                    let className = $pic.attr('class');
                    if (className) {
                        $pic.css('background', SolutionColor[className]);
                    }
                }
            } else if (this.__type == 'task') {
                let eventTrList = $('#event-table tr');
                for (let i = 0; i < eventTrList.length; i++) {
                    let $pic = $(eventTrList[i]).find('td:nth-child(1) div');
                    let className = $pic.attr('class');
                    $pic.css('background', EventColor[className]);
                }

                let statesTrList = $('#states-table tr');
                for (let i = 0; i < statesTrList.length; i++) {
                    let $pic = $(statesTrList[i]).find('td:nth-child(1) div');
                    let className = $pic.attr('class');
                    $pic.css('background', StatesColor[className]);
                }
            }
        },

        // 给私有变量赋值，添加solution或task的基本信息到modal和input中
        initImport: function (type, data) {
            this.__setUser();
            if (type == 'SOLUTION') {
                this.__solution = data;
                let solution = this.__solution;

                // bottom label
                $('#config-tag').css('display', 'block');
                if ($('#task-info').length) {
                    $('#task-info').css('display', 'none');
                }

                $('#solution-name').empty();
                $('#solution-name').append(solution.solutionInfo.name);
                // temp del
                // $('#solution-author').empty();
                // $('#solution-author').append(
                //     solution.solutionInfo.author
                // );
                $('#solutionID-input').attr('value', solution._id);
                // modal input text
                $('#solutionName').attr(
                    'value',
                    solution.solutionInfo.name
                );
                $('#solutionDesc').html(solution.solutionInfo.desc);
                // $('#solutionAuthor').attr(
                //     'value',
                //     solution.solutionInfo.author
                // );
            } else if (type == 'TASK') {
                this.__task = data;
                this.__solution = data.solutionDetail;
                // this.__dataList = data.taskCfg.dataList;
                let task = this.__task;
                let solution = this.__solution;

                // bottom label
                $('#config-tag').css('display', 'block');

                $('#solution-name').empty();
                $('#solution-name').append(solution.solutionInfo.name);
                // temp del
                // $('#solution-author').empty();
                // $('#solution-author').append(
                //     solution.solutionInfo.author
                // );
                $('#solutionID-input').attr('value', solution._id);
                $('#taskID-info').css('display', 'block');

                $('#task-name').empty();
                // $('#task-author').empty();
                $('#task-name').append(task.taskInfo.name);
                // $('#task-author').append(task.taskInfo.author);
                $('#taskID-input').attr('value', task._id);
                // modal input text
                $('#taskName').attr('value', task.taskInfo.name);
                $('#taskDesc').html(task.taskInfo.desc);
                // $('#taskAuthor').attr('value', task.taskInfo.author);

                this.registerSocket();
            }

            this.__setAuthor();
        },

        exportTask: function () {
            // var taskInfo = {};
            // var saveTag = $('#save-aggre-form').serializeArray();
            // for (let i = 0; i < saveTag.length; i++) {
            //     taskInfo[saveTag[i].name] = saveTag[i].value;
            // }
            var inputDataList = [];
            var dataList = this.__task.taskCfg.dataList;
            for (let i = 0; i < dataList.length; i++) {
                if (dataList[i].isInput) {
                    inputDataList.push(dataList[i]);
                }
            }

            __task = {
                taskCfg: {
                    dataList: inputDataList,
                    solutionID: this.__solution._id,
                    driver: 'DataDriver'
                },
                taskInfo: this.__task.taskInfo,
                taskState: 'CONFIGURED',
                // taskInfo: taskInfo,
                MSState: this.__task.MSState
            };
            if (
                $('#taskID-input').length &&
                $('#taskID-input').attr('value') &&
                $('#taskID-input').attr('value') != undefined
            ) {
                __task._id = $('#taskID-input').attr('value');
            }

            return __task;
        },
        // endregion

        run: function () {
            var self = this;
            var postRun = function () {
                if (!self.__isValid) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Start integration task failed! <br><pre>' +
                            JSON.stringify(res.error, null, 4) +
                            '</pre>',
                        sticky: false,
                        time: 2000
                    });
                }
                $.ajax({
                        url: '/integration/task/run',
                        data: JSON.stringify(self.exportTask()),
                        contentType: 'application/json;charset=utf-8',
                        type: 'POST',
                        dataType: 'json'
                    })
                    .done(function (res) {
                        if (res.error) {
                            $.gritter.add({
                                title: 'Warning:',
                                text: 'Start integration task failed! <br><pre>' +
                                    JSON.stringify(res.error, null, 4) +
                                    '</pre>',
                                sticky: false,
                                time: 2000
                            });
                        } else {
                            $.gritter.add({
                                title: 'Notice:',
                                text: 'Start integration task successed, please check the run state at times!',
                                sticky: false,
                                time: 2000
                            });

                            if (
                                window.location.pathname !=
                                '/integration/task/edit' &&
                                window.location.query != '?_id=' + res._id
                            ) {
                                window.location.href =
                                    '/integration/task/edit?_id=' + res._id;
                            }
                        }
                    })
                    .fail(function (err) {
                        $.gritter.add({
                            title: 'Warning:',
                            text: 'Start integration task failed! <br><pre>' +
                                JSON.stringify(err, null, 4) +
                                '</pre>',
                            sticky: false,
                            time: 2000
                        });
                    });
            };
            // 在点击运行前要有一些其他交互，如果没保存要先保存
            if (
                $('#taskID-input').length &&
                $('#taskID-input').attr('value') &&
                $('#taskID-input').attr('value') != undefined
            ) {
                postRun();
            } else {
                $('#save-aggre-task-modal').modal('show');
                self.__bindSaveTaskEvent(0, true);
            }
        },

        // TODO 当上传数据时调用，验证上传数据与 schema 是否匹配，先不做
        validateEvent: function () {},

        // 当在不同模型之间建立连接时，验证link 是否合法
        validateLink: function (nodeA, nodeZ) {
            // 只能由输出连向输入
            if (nodeZ.__nodeType == 'OUTPUT' || nodeZ.__nodeType == 'STATES') {
                $.gritter.add({
                    title: 'Warning:',
                    text: 'To node must be input!',
                    sticky: false,
                    time: 2000
                });
                return false;
            }
            if (nodeA.__nodeType != 'OUTPUT') {
                $.gritter.add({
                    title: 'Warning:',
                    text: 'From node must be output!',
                    sticky: false,
                    time: 2000
                });
                return false;
            }

            // TODO 在不同模型之间添加连线时，检查他的schema是否相同

            return true;
        },

        // region web-socket
        // 其他信息也都复制到node里了
        __updateNodeState: function (node) {
            if (node.__nodeType == 'STATES') {
                node.fillColor = __getRGB(
                    StatesColor[node.__state.toLowerCase()]
                );
            } else {
                // update ui, and download link(update when db click)
                if (
                    node.__isInput == true &&
                    node.__state == DataState.received
                ) {
                    node.fillColor = __getRGB(EventColor.input);
                } else {
                    node.fillColor = __getRGB(
                        EventColor[node.__state.toLowerCase()]
                    );
                }
                if (node.__state == DataState.ready) {
                    // node;
                }
            }
            this.__stage.paint();
        },

        __getEventNode: function (__MSID, __stateID, __eventName) {
            var nodeList = this.__nodeList;
            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                if (
                    node.__MSID == __MSID &&
                    node.__stateID == __stateID &&
                    node.__eventName == __eventName
                ) {
                    return node;
                }
            }
            return null;
        },

        __getStatesNode: function (MSinsID) {
            var nodeList = this.__nodeList;
            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                if (node.__MSID == MSinsID && node.__nodeType == 'STATES') {
                    return node;
                }
            }
            return null;
        },

        __updateDataListState: function (dispatchRst) {
            for (let i = 0; i < dispatchRst.length; i++) {
                for (let j = 0; j < this.__task.taskCfg.dataList.length; j++) {
                    var data = this.__task.taskCfg.dataList[j];
                    if (
                        data.id == dispatchRst[i].gdid &&
                        data.MSID == dispatchRst[i].MSID
                    ) {
                        if (dispatchRst[i].error) {
                            data.state = DataState.failed;
                            let node = this.__getEventNode(
                                data.MSID,
                                data.stateID,
                                data.eventName
                            );
                            node.__state = data.state;
                            node.__gdid = null;
                            // node.__host = null;  // 不要也行，后台查找可以得到
                            // node.__port = null;
                            this.__updateNodeState(node);
                            $.gritter.add({
                                title: 'Warning:',
                                text: 'Dispatch data failed!<br><pre>' +
                                    JSON.stringify(
                                        dispatchRst[i].error,
                                        null,
                                        4
                                    ) +
                                    '</pre>',
                                sticky: false,
                                time: 2000
                            });
                        } else {
                            // if(data.state == DataState.ready)
                            data.state = DataState.pending;
                            let node = this.__getEventNode(
                                data.MSID,
                                data.stateID,
                                data.eventName
                            );
                            node.__state = data.state;
                            node.__gdid = data.id;
                            // node.__host = data.host;
                            // node.__port = data.port;
                            this.__updateNodeState(node);
                        }
                        break;
                    }
                }
            }
        },

        // 更新下载完成的数据 或者 模型运行结果数据
        __updateDataState: function (downloadRst, newData) {
            if (!newData) {
                for (let j = 0; j < this.__task.taskCfg.dataList.length; j++) {
                    var data = this.__task.taskCfg.dataList[j];
                    if (
                        data.MSID == downloadRst.MSID &&
                        downloadRst.stateID == data.stateID &&
                        downloadRst.eventName == data.eventName
                    ) {
                        // data.state = downloadRst.err?DataState.failed:DataState.received;
                        data.state = downloadRst.state;
                        let node = this.__getEventNode(
                            data.MSID,
                            data.stateID,
                            data.eventName
                        );
                        node.__state = data.state;
                        node.__gdid = data.id;
                        node.__isInput = data.isInput;
                        this.__updateNodeState(node);
                        break;
                    }
                }
            } else {
                let node = this.__getEventNode(
                    newData.MSID,
                    newData.stateID,
                    newData.eventName
                );
                if (node) {
                    node.__state = newData.state;
                    node.__gdid = newData.id;
                    node.__isInput = newData.isInput;
                    this.__updateNodeState(node);
                }
            }
        },

        __updateByDispatchedRst: function (dispatchRst) {},

        __updateByDownloadedRst: function (downloadRst) {},

        registerSocket: function () {
            var self = this;
            socket = io('/integrate/task');

            socket.on('connect', function () {
                console.log('socket connected to server');
                // 按照taskID 给room命名，后台有状态更新时，更新所有该task对应的client
                socket.emit('dispatch room', self.__task._id);
            });

            socket.on('disconnect', function () {
                console.log('disconnected');
            });

            socket.on('error', function (msg) {
                console.log(JSON.parse(msg));
            });
            ////////////////////////////////////////////////////////////////////////////////

            // {
            //     error:err,
            //     dispatchRst:dispatchRst      // gdid, MSID, stateID, eventName, error
            // }
            socket.on('data dispatched', function (msg) {
                msg = JSON.parse(msg);
                console.log('data dispatched', msg);
                if (msg.error) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Dispatch data failed!<br><pre>' +
                            JSON.stringify(msg.error, null, 4) +
                            '</pre>',
                        sticky: false,
                        time: 2000
                    });
                } else {
                    self.__updateDataListState(msg.dispatchRst);
                }
            });

            // {
            //     error:err,
            //     downloadRst:replyData
            // }
            // downloadRst:
            // {
            //     taskID: dataPosition.taskID,
            //     gdid: dataPosition.gdid,
            //     MSID: dataPosition.MSID,
            //     stateID: dataPosition.stateID,
            //     eventName: dataPosition.eventName,
            //     err: err
            // }
            socket.on('data downloaded', function (msg) {
                msg = JSON.parse(msg);
                console.log('data downloaded', msg);
                if (msg.error) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Download data failed!<br><pre>' +
                            JSON.stringify(msg.error, null, 4) +
                            '</pre>',
                        sticky: false,
                        time: 2000
                    });
                } else {
                    self.__updateDataState(msg.downloadRst);
                }
            });

            // {
            //     error:null,
            //     MSinsID: MSinsID
            // }
            socket.on('service starting', function (msg) {
                msg = JSON.parse(msg);
                console.log('service starting', msg);
                if (msg.error) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Start service failed!<br><pre>' +
                            JSON.stringify(msg.error, null, 4) +
                            '</pre>',
                        sticky: false,
                        time: 2000
                    });
                } else {
                    var statesNode = self.__getStatesNode(msg.MSinsID);
                    statesNode.__state = MSState.pending;
                    self.__updateNodeState(statesNode);
                }
            });

            // {
            //     error:res.error,
            //     MSinsID: MSinsID
            // }
            socket.on('service started', function (msg) {
                msg = JSON.parse(msg);
                console.log('service started', msg);
                let statesNode = self.__getStatesNode(msg.MSinsID);
                if (msg.error) {
                    statesNode.__state = MSState.collapsed;
                    self.__updateNodeState(statesNode);
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Dispatch data failed!<br><pre>' +
                            JSON.stringify(msg.error, null, 4) +
                            '</pre>',
                        sticky: false,
                        time: 2000
                    });
                } else {
                    statesNode.__state = MSState.running;
                    self.__updateNodeState(statesNode);
                }
            });

            // {
            //     error:null,
            //     MSinsID: MSinsID,
            //     MSState: finishedInfo.MSState,
            //     newDataList: newDataList
            // }
            socket.on('service stoped', function (msg) {
                msg = JSON.parse(msg);
                console.log('service stoped', msg);
                if (msg.error) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Dispatch data failed!<br><pre>' +
                            JSON.stringify(msg.error, null, 4) +
                            '</pre>',
                        sticky: false,
                        time: 2000
                    });
                } else {
                    var statesNode = self.__getStatesNode(msg.MSinsID);
                    statesNode.__state = msg.MSState;
                    self.__updateNodeState(statesNode);
                    // self.__dataList = self.__dataList.concat(msg.newDataList);
                    self.__task.taskCfg.dataList = self.__task.taskCfg.dataList.concat(
                        msg.newDataList
                    );
                    for (let i = 0; i < msg.newDataList.length; i++) {
                        self.__updateDataState(null, msg.newDataList[i]);
                    }
                }
            });

            socket.on('update task state', function (msg) {
                msg = JSON.parse(msg);
                console.log('update task state', msg);
                if (msg.error) {
                    __addNotice(
                        __NoticeType.warning,
                        '<pre>' + JSON.stringify(msg.error, null, 4) + '</pre>'
                    );
                }
                var state = msg.taskState;
                if (state == TaskState.finished) {
                    $.gritter.add({
                        title: 'Notice:',
                        text: 'Task finished!',
                        sticky: false,
                        time: 2000
                    });
                } else if (state == TaskState.end) {
                    $.gritter.add({
                        title: 'Notice:',
                        text: 'Task run to the end, please upload the essential input data to continue!',
                        sticky: false,
                        time: 2000
                    });
                } else if (state == TaskState.collapsed) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Task collapsed. Maybe caused by unsuited input data or model error!',
                        sticky: false,
                        time: 2000
                    });
                } else if (state == TaskState.pause) {
                    $.gritter.add({
                        title: 'Notice:',
                        text: 'Task paused, please cancel the break points to continue!',
                        sticky: false,
                        time: 2000
                    });
                }
            });
        }
        // endregion
    };
})();

module.exports = CanvasJS;