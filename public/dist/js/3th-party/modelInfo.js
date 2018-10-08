/**
 * Created by Administrator on 2016/4/12.
 */
$(document).on('click','.btnRunModel',function(){
    var modelName=$(this).parent().parent().find("td:first-child").text();
    window.open('modelDetailInfo.html');
});
/* 查看模型信息*/
$(document).on('click','.modelDesciption',function(a){
    //var name=$(this).attr('myval');
    var modelName=$(this).parent().parent().find("td:first-child").text();
    $('#modelDesHead').text(modelName);
    var content="SWMM（storm water management model，暴雨洪水管理模型）是一个动态的降水-径流模拟模型，主要用于模拟城市某一单一降水事件或长期的水量和水质模拟。其径流模块部分综合处理各子流域所发生的降水，径流和污染负荷。其汇流模块部分则通过管网、渠道、蓄水和处理设施、水泵、调节闸等进行水量传输。该模型可以跟踪模拟不同时间步长任意时刻每个子流域所产生径流的水质和水量，以及每个管道和河道中水的流量、水深及水质等情况。 SWMM自1971年开发以来，已经经历过多次升级。当前最新版本5.0是在以前版本基础上进行了全新升级的结果，可以在Windows操作系统下运行SWMM5提供了一个宽松的综合性环境，可以对研究区输入的数据进行编辑、模拟水文、水力和水质情况，并可以用多种形式对结果进行显示，包括对排水区域和系统输水路线进行彩色编码，提供结果的时间序列曲线和图表、坡面图以及统计频率的分析结果。";
    $('#modelDesContent').html('<p>'+content+'</p>');
    $('#modelDes').modal('toggle');
});