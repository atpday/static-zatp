$(function(){
    var navH = $("#catalog").offset().top;
    //滚动条事件
    $(window).scroll(function(){
        //获取滚动条的滑动距离
        var scroH = $(this).scrollTop();
        //滚动条的滑动距离大于等于定位元素距离浏览器顶部的距离，就固定
        if(scroH>=navH){
            $(".catalog").css({position: 'fixed',width: '256px',visibility: 'visible'});
            $(".catalog").animate({top: '90px'},800);
        }
        else{
            $(".catalog").css({position: 'static',top:'0px',visibility: 'hidden'});
            $(".catalog").animate(800);
        }
    });

    $(document).on('click', '.cbtn', function(e) {
        $('html,body').animate({scrollTop: $("#" + this.name).offset().top}, 500);
    });

});