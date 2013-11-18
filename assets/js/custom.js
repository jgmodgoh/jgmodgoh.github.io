(function(){
   random_quote = function() {
   "use strict";

   var quote_tag = $("#quote");
   var quotes = ['"Develop success from failures. Discouragement and failure are two of the surest stepping stones to success." - Dale Carnegie',
                 '"I have not failed. I\'ve just found 10,000 ways that won\'t work." - Thomas Edison',
                 '"Continuous effort - not strength or intelligence - is key to unlocking our potential." - Winston Churchill',
                 '"Be nice to people on your way up because you meet them on your way down." - Jimmy Durante',
                 '"Knowledge speaks, but wisdom listens." - Jimi Hendrix',
                 '"We are all in the gutter, but some of us are looking at the stars."- Oscar Wilde'];
   var previous_quote = quote_tag.text();
   var current_quote = quotes[Math.floor(Math.random()*6)];

   while (current_quote == previous_quote){
     current_quote = quotes[Math.floor(Math.random()*6)]; 
   };
   
   quote_tag.text(current_quote);
   quote_tag.attr("class","site-description animated fadeIn");
   setTimeout(function(){quote_tag.attr("class","site-description animated fadeOut")},6000);
  }

  startloop = function() {
    random_quote();
    setInterval(random_quote, 8000);
    
  }
  startloop();
})();

$(document).ready(function(){
    // fade in and fade out
    $(function () {
        $(window).scroll(function () {
            if ($(this).scrollTop() > 50) {
                $('#uparrow').fadeIn();
            } else {
                $('#uparrow').fadeOut();
            }
        });
 
        // scroll body to 0px on click
        $('#uparrow').click(function () {
            $('body,html').animate({
                scrollTop: 0
            }, 800);
            return false;
        });
    });
 
});


