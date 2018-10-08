/**
 * Created by SCR on 2017/8/2.
 */
/*jshint esversion: 6 */
module.exports = {
    __NoticeType: {
        warning: 'Warning:',
        notice: 'Notice:'
    },

    __addNotice: function (noticeType,noticeText) {
        var className = noticeType.slice(0,-1);
        $.gritter.add({
            class_name: className,
            title: noticeType,
            text: noticeText,
            sticky: false,
            time: 2000
        });
    },

    __serialize: function (form) {
        var rst = {};
        var serializeArray = $(form).serializeArray();
        for(let i=0;i<serializeArray.length;i++){
            rst[serializeArray[i].name] = serializeArray[i].value;
        }
        return rst;
    },

    __getElementLeft: function (element){
        var actualLeft = element.offsetLeft;
        var current = element.offsetParent;
        while (current !== null){
            actualLeft += current.offsetLeft;
            current = current.offsetParent;
        }
        return actualLeft;
    },

    __getElementTop: function (element){
        var actualTop = element.offsetTop;
        var current = element.offsetParent;
        while (current !== null){
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
        return actualTop;
    },

    __getHiddenHeight: function (element) {
        if(element.offsetHeight)
            return element.offsetHeight;

        var display = element.style.display;
        var position = element.style.position;
        var visibility = element.style.visibility;

        element.style.visibility = 'hidden';
        element.style.display = 'block';
        element.style.position = 'absolute';

        var height = element.offsetHeight;

        element.style.display = display;
        element.style.position = position;
        element.style.visibility = visibility;

        return height;
    },

    __isTrue: function (boolValue) {
        switch (boolValue){
            case 0:
            case '0':
            case 'False':
            case 'false':
                return false;
            case 1:
            case '1':
            case 'True':
            case 'true':
                return true;
        }
    }
};