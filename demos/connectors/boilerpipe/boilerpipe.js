if (!window.kConnectors) window.kConnectors = {};

window.kConnectors.boilerpipe = {};

/**
 *
 * @param String c shortcut to window.kConnectors
 * @param Object $ shortcut to window.jQuery
 */
(function (c, $){
			
	/**
	 * Boilerpipe
	 */
	c.boilerpipe = {
		name: 'boilerpipe',
		cssFile: 'connectors/boilerpipe/boilerpipe.css',
		connectable: function(href, $link)
		{ 
			return $link.hasClass('boilerpipe'); 
		},
		getData: function (href, $link)
		{
			var data = { url: href };
			return data;
		},
		loader: function (data, $panel, kaiten)
		{
			var parts_a,
				parts_b,
				href = data.url;

			if (href.indexOf('http') == 0)
			{
				parts_a = decodeURIComponent(href).split('//');
				parts_b = parts_a[1].split('/');
				host = parts_a[0] + '//' + parts_b.shift();

				href = host + '/' + parts_b.join('/');
			}
			else
			{
				// relative urls
				host = $panel.prev().data('host');
				href = host + href;
			}

			$panel.data('host',host);

			var paramsStr = "'" + href + "', '" + $panel.attr('id') + "'",
				pSels = window.Kaiten.selectors.panelItems,
				//g.etfv.co is a service to get the favicon of a website!
				styleStr = "background-image:url('http://g.etfv.co/" + href + "')";		

			$.getJSON('connectors/boilerpipe/get-pageinfo.php', {url: href}, function (response){
				var header = $panel.find('div.'+pSels.headerClass);
				header.find('div.boilerpipe-url').text(response.title);
			});

			return [
				'<div class="'+pSels.headerClass+'">',
					'<div class="boilerpipe o-tabs">',						
						'<span class="favicon" style="' + styleStr +'"/>',
						'<div class="boilerpipe-url">' + href + '</div>',
						'<div class="nav-row" style="border:none;padding:0px;background:none;margin-top:8px;">',
							'<ul id="nav"/>',
						'</div>',
					'</div>',
					'<div class="o-tab" title="Content"    id="boilerPage"     onclick="window.kConnectors.boilerpipe.loadPage('+paramsStr+');"/>',
					'<div class="o-tab" title="Article"    id="boilerArticle"  onclick="window.kConnectors.boilerpipe.loadArticle('+paramsStr+');"/>',
					'<div class="o-tab" title="Web Page"   id="boilerIframe"   onclick="window.kConnectors.boilerpipe.loadIframe('+paramsStr+');"/>',
					'<div class="o-tab" title="New window"  id="boilerWindow"   onclick="window.open('+paramsStr+');"/>',
				'</div>',
				'<div class="'+pSels.bodyClass+'">',
					'<div class="shadow"></div>',
					'<div class="boilerpipe-block">',
						'<div class="boilerpipe-content"></div>',
					'</div>',
				'</div>',
				'<script type="text/javascript">',
					'$(this).bind("layout.kpanel", function (){ $(this).oTabs(); });',
					'window.kConnectors.boilerpipe.loadPage('+paramsStr+');',
				'</script>'
			].join('');	
		}
	};
	
	c.boilerpipe.init = function ($K)
	{
		$K.undelegate('.k-panel', 'kpanelafterload').delegate('.k-panel', 'kpanelafterload', function(e, $panel, $kaiten){
			var $panel = $(this);
			if ($panel.hasClass('init-o-tabs'))
			{
				$panel.find('.o-tabs').oTabs();
			}
		});
	}
	
	/**
	 * Event handler for 'article' button in panel header
	 * @todo if already loaded then return?
	 */

	c.boilerpipe.loadArticle = function (url, panelID)
	{
		var $panel = $('#'+panelID), 
			$boilerblock = $panel.find('div.boilerpipe-block'),
			pSels = window.Kaiten.selectors.panelItems;

		$panel.kpanel('originalSize');
		$boilerblock.addClass('loader');
		$boilerblock.children().remove();
		$.get('connectors/boilerpipe/boilerpipe.php', {url: url, extractor: 'ArticleExtractor', output: 'htmlFragment'}, function (response){
			$boilerblock.removeClass('loader');
			response = '<div class="boilerpipe-content">'+response+'</div>';
			// response = $(response);
			// response.find('a').each(function (){
			// 	$(this).addClass('boilerpipe');
			// });
			$boilerblock.css('overflow','auto');
			$boilerblock.html(response);
		});				
	};

	/**
	 * Event handler for 'page' button in panel header
	 * @todo if already loaded then return?
	 */
	c.boilerpipe.loadPage = function (url, panelID)
	{
		var $panel = $('#'+panelID), 
			$boilerblock = $panel.find('div.boilerpipe-block'),
			pSels = window.Kaiten.selectors.panelItems;

		$panel.kpanel('originalSize');
		$boilerblock.addClass('loader');
		$boilerblock.children().remove();
		$.get('connectors/boilerpipe/boilerpipe.php', {url: url, extractor: 'KeepEverythingExtractor', output: 'html'}, function (response){
			$boilerblock.removeClass('loader');
			response = '<div class="boilerpipe-content">'+response+'</div>';
			// response = $(response);
			// response.find('a').each(function (){
			// 	$(this).addClass('boilerpipe');
			// });
			$boilerblock.css('overflow','auto');
			$boilerblock.html(response);
		});		
	};

	/**
	 * Event handler for 'iframe' button in panel header
	 * @todo if already loaded then return?
	 */
	c.boilerpipe.loadIframe  = function (url, panelID)
	{
		var $panel = $('#'+panelID), 
			$boilerblock = $panel.find('div.boilerpipe-block'),
			pSels = window.Kaiten.selectors.panelItems,
			onloadStr = "$('#"+panelID+"').kpanel('toggleLoader', false, 'body');";

		$panel.kpanel('maximize');

		$boilerblock.children().remove();
		$boilerblock.css('overflow','hidden');
		$boilerblock.append('<iframe src="'+url+'" width="100%" height="100%" onload="'+onloadStr+'" />');
	};

})(window.kConnectors, jQuery);