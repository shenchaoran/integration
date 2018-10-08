/**
 * Created by 朱串串 on 2016/3/24.
 */
$(document).ready(function(){

});
$(document).on('click','.btnRunModel',function(){
    var modelName=$(this).parent().parent().find("td:first-child").text();
    window.open('/modelser/'+encodeURIComponent(modelName)+'');
});
/* 查看模型信息*/
$(document).on('click','.modelDesciption',function(a){
    //var name=$(this).attr('myval');
    var modelName=$(this).parent().parent().find("td:first-child").text();
    $('#modelDesHead').text(modelName);
    $('#modelDesContent').html('<p>'+modelName+'<br>'+modelName+'<br>'+modelName+'<br>'+'</p>');
    $('#modelDes').modal('toggle');
});