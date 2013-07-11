(function(){
   random_quote = function() {
   "use strict";

   var quote_tag = $("#quote");
   var quotes = ['"Develop success from failures. Discouragement and failure are two of the surest stepping stones to success." - Dale Carnegie',
                 '"Continuous effort - not strength or intelligence - is key to unlocking our potential." - Winston Churchill',
                 '"We are all in the gutter, but some of us are looking at the stars." - Oscar Wilde'];
   var previous_quote = quote_tag.text();
   var current_quote = quotes[Math.floor(Math.random()*3)];

   while (current_quote == previous_quote){
     current_quote = quotes[Math.floor(Math.random()*3)]; 
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




