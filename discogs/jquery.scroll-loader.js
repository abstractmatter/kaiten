(function($) {
	// default configuration
	var defaultOptions = { 
		url 			: '',
		type			: 'post',
		data 			: { page : 1 },
		loaderHeight	: 80,
		autoLoad		: true,
		loader			: null
	};
	
	// plugin definition
	$.fn.scrollLoader = function(options) {
		var $container = $(this),
			jqXHR = null;
		
		// already initialized?
		if ($container.data('init'))
		{
			console.info('The scroll loader has already been initialized');
			return;
		}
		$container.data('init', true);
		
		// configuration
		var config = $.extend(true, {}, defaultOptions, options);
		
		// default loader
		if (!config.loader)
		{
			config.loader = function($block, onComplete){
				jqXHR = $.ajax({
					url		: config.url,
					data	: config.data,
					type	: config.type,
					success	: function(response){
						onComplete(response);
					}
				});
			};
		}
		
		// debounce
		function debounce(fn, delay) {
			var timeout = null, self = this, args = arguments;
			delay || (delay = 100);
			
		    return function() {
				if (timeout)
				{
					clearTimeout(timeout);
				}

				timeout = setTimeout(function(){
					fn.apply(self, args);
					timeout = null;
				}, delay);
			};
		}
		
		// creates and appends a new block at the end of the container
		function createContentBlock() {
			return $('<div />', {
				"class" : "block block-nav scroll",
				"style" : "height:"+config.loaderHeight+"px"
			}).appendTo($container);
		}
		
		// loads content in a block 
		function loadContent($block) {
			$container.unbind('scroll'); // disable handler			
			$block.addClass('loader');
			
			config.loader($block, function(html, isLast){
				$block.removeClass('loader scroll');
				if (html)
				{
					$block.removeAttr('style').html(html); // fill with new content
				}
				$block = createContentBlock(); // create a new block immediately
				if (!isLast)
				{	
					// re-enable handler for next page, see officity.utils.js for debounce()					
					config.data.page = parseInt(config.data.page, 10) + 1;
					$container.bind('scroll', debounce(function(){  
						onScroll($block);
					}));
				}
				else
				{
					$block.css({
						"line-height"	: config.loaderHeight+"px",
						"vertical-align": "middle",
						"text-align"	: "center"
					});
					
					$('<a />', { 
						"href" : "#",
						"text" : "go to top"
					}).click(function(){
						$container.animate({ scrollTop: 0 }, 500, 'easeOutExpo');
					}).appendTo($block);
				}
			});
		};
		
		// scroll handler
		function onScroll($block) {
			if (($container[0].scrollHeight - config.loaderHeight) <= ($container.height() + $container.scrollTop()))
			{
				loadContent($block);
			}
		}
		
		// initial loading
		var $block = createContentBlock();
		if (config.autoLoad === true)
		{
			loadContent($block);
		}
		else
		{
			$container.bind('scroll', debounce(function(){ 
				onScroll($block);
			}));
		}
		
		// reset event
		$container.bind('reset.scrollloader', function(e){
			$block.remove();
			$block = createContentBlock();
			config.data.page = 1;
			$container.bind('scroll', debounce(function(){  
				onScroll($block);
			}));
		});
		
		return this;
	};
})(jQuery);