var isbool = true;
        
$(window).scroll(function() {
if (isbool && $('.ajaxload .next a').attr("href") && ($(this).scrollTop() + $(window).height() + 20) >= $(document).height()) {
    isbool = false;
    aln()
    }
});
        
function al() {
    $('.ajaxload li[class!="next"]').remove();
     $('.ajaxload .next a').click(function() {
        if (isbool) {
            aln()
        }
        return false
    })
}
        
al();
        
function aln() {
    var a = '.ajaxload .next a',
    b = $(a).attr("href");
    $(a).addClass('loading').text("loading...");
    if (b) {
        $.ajax({
            url: b,
            error: function() {
                alert('Request failed, unknown network error');
                $(a).removeAttr("class").text("Load More");
                return false
            },
                
            success: function(d) {
                var c = $(d).find("#main .post"),
                e = $(d).find(a).attr("href");
                if (c) {
                    $('.ajaxload').before(c)
                };
                $(a).removeAttr("class");
                if (e) {
                    $(a).text("Load More").attr("href", e)
                } else {
                    $(a).remove();
                    $('.ajaxload .next').text('No more')
                }
                if ($('.protected', d).length) {
                    $('.protected *').unbind();
                    ap()
                }
                isbool = true;
                return false;
                $("img").lazyload({effect: "fadeIn", threshold: 100, failurelimit: 5});
            }
        })
    }
}