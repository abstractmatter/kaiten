/* WIKIPEDIA CONNECTORS COLLECTION */

/* 1. home
 * 2. search
 * 3. languages
 * 4. page
 * 5. static
 * 6. image
 * */

// namespace
if (!window.kConnectors)
{
	window.kConnectors = {};
}

//_w will be used as a handy shortcut
_w = window.kConnectors.wikipedia = {
	// the collection name
	collectionName : "wikipedia",
	
	// (optional) the relative path to the CSS file used by this collection (relative to the document)
	cssFile		: 'connectors/wikipedia/wikipedia.css',
	
	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	// by inspecting the link, this function decides if Kaiten has to check the connectors in this collection
	connectable	: function(href, $link){
		return true;
	},
	
	// the connectors array
	connectors	: [],
	
	// helper
	addConnector : function(connector){
		this.connectors.push(connector);
	},
	
	// tools, etc.
	footer : '<p class="nectil-footer">Text is available under the Creative Commons Attribution-ShareAlike License; additional terms may apply. See Terms of Use for details.</p>',
	currentLanguage : window.kConnectors.languages.userLanguage(),
	domain : 'http://'+window.kConnectors.languages.userLanguage()+'.wikipedia.org',
	isWikipediaDomain :  /^(http|https):\/\/[a-z]{2,3}.wikipedia\.org\/wiki\//,
	searchPaginate: 50
};

/* ADD ALL CONNECTORS */

(function($kt, langTool){
	/* 1. home */
	_w.addConnector({
		name : "home",
		loader:function(data, $panel, $kaiten){
			$panel.data('connector','wikipedia.home');
		 	$panel.data('domain', _w.domain);

			$panel.kpanel('setTitle', 'Wikipedia');

			var $body = $kt('panel.body');
			$kt('block.navigation')
				.append($kt('line.summary',{
							iconURL:'connectors/wikipedia/images/wikipedia.png',
							label:'Wikipedia',
							info:''
						})
					)
				.append($kt('line.search').submit(function(evt){
							evt.preventDefault();
							var query = $(this).find('input:text').val();
							$kaiten.kaiten('load', {
								kConnector: 'wikipedia.search',
								query:query,
								title:langTool.get('search')+' '+query,
								kTitle : langTool.get('search')+' '+query
							},$(this));
						})
					)
				.append($kt('line.navigation',{
							id:'translate-navmain',
							label:langTool.get('navmain').label,
							iconURL:'connectors/wikipedia/images/wikipedia-16.png',
							data:{
								kConnector:'wikipedia.page',
								kWidth:'800px'
							}
						})
					)
				.append($kt('line.navigation',{
						id:'translate-navlang',
						label:langTool.get('navlang').label,
						info:languages[_w.currentLanguage],
						data:{
							kConnector:'wikipedia.languages',
							kTitle:langTool.get('navlang').label
						}
					})
				)
				.appendTo($body);

			return $body;
		}
	});
	
	/* 2. search */
	_w.addConnector({
			name : "search",
			loader : function(data, $panel, $kaiten){
				if (!data.query)
				{
					throw new Error('No query!');
				}
				
				$panel.data('fromConnector','wikipedia.search');
				if (!data.domain)
				{
					data.domain = $panel.prev().data('domain') || _w.domain;
				}
			 	$panel.data('domain',data.domain);

				var queryData = {
					action		: 'query', 
					list		: 'search',
					srsearch	: data.query,
					srlimit		: _w.searchPaginate,
					sroffset    : ((data.page || 1) - 1) * _w.searchPaginate,
					srprop		: 'titlesnippet',
					format		: 'json'
				};
				var self = this;
			
				// perform our cross-domain AJX request to the public API and
				// use a custom function to convert JSON received into proper HTML
				return $.ajax({
					url			: data.domain+'/w/api.php?callback=?',
					type		: 'get',
					dataType	: 'json html',
					data		: queryData,
					converters	: {
						'json html' : function(response){
							if (data.domain)
							{
							 	$panel.data('domain',data.domain);
							}
							else
							{
							 	$panel.removeData('domain');
							}
							$panel.data('page',data.page || 1);
							return self.transform($panel, response);
						}
					}
				});
			},
			// tool
			transform : function($panel, jsonData){
				// get page revision, process page HTML and add some custom content (title, footer)
				var body 		= $kt('panel.body');
				var results		= $kt('block.navigation').appendTo(body);
				var list 		= jsonData.query.search;
				var count		= jsonData.query.searchinfo.totalhits;
				var suggestion	= jsonData.query.searchinfo.suggestion;

				//console.log(jsonData.query);
				if (suggestion) {
					$kt('line.navigation',{
						label:'try: "'+suggestion+'"'
					})
					.click(function(){
						$panel.kpanel('reload',{query:suggestion, kTitle:suggestion, page:1});
					}).appendTo(results);
				}

				for (var n in list)
				{
					if (list.hasOwnProperty(n))
					{
						var match = list[n];

						$kt('line.navigation',{
							label:(match.titlesnippet || match.title),
							data:{
								kConnector:'wikipedia.page',
								titles:match.title,
								kTitle:match.title
							}
						}).appendTo(results);
					}
				}

				if (count > _w.searchPaginate)
				{
					var pages = $('<div class="center"/>');
					var page = $panel.data('page') || 1;
					var lastPage = Math.ceil(count/_w.searchPaginate);
					var curPage = page - 4;
					if (curPage < 1)
					{
						curPage = 1;
					}

					if (curPage > 1)
					{
						$('<span/>',{
								'class':(page==1?'selected':'selectable'),
								text:1
							})
							.data('page',1)
							.appendTo(pages);
					}
					for (var i=0; curPage <= lastPage && i < 8; curPage++, i++) 
					{
						$('<span/>',{
								'class':(page==curPage?'selected':'selectable'),
								text:curPage
							})
							.data('page',curPage)
							.appendTo(pages);
					};

					if (curPage <= lastPage)
					{
						$('<span/>',{
								'class':(page==lastPage?'selected':'selectable'),
								text:lastPage
							})
							.data('page',lastPage)
							.appendTo(pages);
					}

					body.delegate('.results-browser .selectable','click',function(){
						$panel.kpanel('reload',{page: $(this).data('page')});
					});

					pagination = $('<div class="results-browser"/>');
					pagination.append('<span class="left">'+count+' hits</span>');
					pagination.append('<span class="right">'+count+' hits</span>');
					pagination.append(pages);
					body.prepend(pagination).append(pagination.clone());
				}
				// add a footer
				body.append(_w.footer);

				return body;
			}
		});
	
	/* 3. languages */
	_w.addConnector({
		name : "languages",
		loader: function(data, $panel, $kaiten){
			$panel.data('fromConnector','wikipedia.languages');
			if (!data.domain)
			{
				data.domain = $panel.prev().data('domain') || _w.domain;
			}
		 	$panel.data('domain',data.domain);

			// load the main page by default
			var self = this, queryData = {
				action		: 'sitematrix',
				format		: 'json'
			};
		
			// perform our cross-domain AJX request to the public API and
			// use a custom function to convert JSON received into proper HTML
			return $.ajax({
				url			: data.domain+'/w/api.php?callback=?',
				type		: 'get',
				dataType	: 'json html',
				data		: queryData,
				converters	: {
					/*'json html' : this.convertWikiPageData*/
					'json html' : function(data){
						if (data.domain)
						{
						 	$panel.data('domain',data.domain);
						}
						else
						{
						 	$panel.removeData('domain');
						}
						return self.format($panel, data);
					}
				}
			});
		},
		// tools
		format : function($panel, jsonData){
			// get page revision, process page HTML and add some custom content (title, footer)
			var self	= this,
				body 	= $kt('panel.body'),
			 	list 	= jsonData.sitematrix,
			 	block 	= $kt('block.navigation').appendTo(body);

			for (var n in list)
			{
				if (list.hasOwnProperty(n) && list[n].code)
				{
					var lang = list[n];
					if (lang.site.length)
					{
						var nav = $kt('line.clickable',{
							label:lang.name,
							info:lang.site[0].url,
							'class':window.kConnectors.languages.exists(lang.code) ? 'main-language':'other-language'
						}).appendTo(block)
							.click(function(){
								self.changeLanguage($(this));
							})
							.data('domain', lang.site[0].url)
							.data('code', lang.code);
						
						if (lang.site[0].url == _w.domain)
						{
							nav.addClass('k-active');
						}
					}
				}
			}

			function sortAlpha(a,b){  
			    return $(a).find('.label').text() > $(b).find('.label').text();  
			};
			
			block.find('.items.main-language').sort(sortAlpha).appendTo(block);
			$kt('line.separator',{id:'translate-other-lang',label:window.kConnectors.languages.get('other-lang').label}).appendTo(block);
			block.find('.items.other-language').sort(sortAlpha).appendTo(block);  

			// add a footer
			$kt('block.content',{'content':_w.footer}).appendTo(body);

			return body;
		},
		changeLanguage : function($item){
			_w.domain = $item.data('domain');
			$item.closest('.k-panel').prevAll().first().data('domain',_w.domain);
			$item.siblings().removeClass('k-active');
			$item.addClass('k-active');
			var language = $item.data('code');
			window.kConnectors.languages.setCurrentLanguage(language);
			_w.language = language;
			$('#translate-navlang').find('.info').text(languages[language]);
		}
	});
	
	/* 4. page */
	_w.addConnector({
		name : "page",
		connectable : function(href, $link) {
			var from = $link.closest('.k-panel').data('connector');
			return !$link.hasClass('image') && (
						_w.isWikipediaDomain.test(href)
						 || (/^https?:\/\//.test(href)==false && from && from.indexOf('wikipedia') == 0) 
					);
		},
		getData : function(href, $link) {
			var $this = $(this);

			if ((/^https?:\/\//.test(href) || href.indexOf('/wiki/')==0))
			{
				var data = { 
					titles : decodeURIComponent(href.split('/').pop())
				};

				if (href.indexOf('http') == 0)
				{
					data.domain = decodeURIComponent(href.match('https?://[^/]*')[0]);
				}
				return data;
			}
			else
			{
				return {
					kConnector : 'iframe',
					url      : _w.domain + href.replace('&action=edit','')
				};
			}
		},
		loader : function(data,$panel,$kaiten){
			$panel.data('connector','wikipedia.page');
			if (!data.domain)
			{
				data.domain = $panel.prev().data('domain') || _w.domain;
			}
		 	$panel.data('domain',data.domain);

			var queryData = {							
				action		: 'query', 
				prop		: 'revisions', 
				rvprop		: 'content', 
				format		: 'json', 
				titles		: data.titles || 'Main Page', // load the main page by default
				rvparse		: true,
				redirects	: 1
			};

			var self = this;

			// perform our cross-domain AJX request to the public API and
			// use a custom function to convert JSON received into proper HTML
			return $.ajax({
				url			: data.domain+'/w/api.php?callback=?',
				type		: 'get',
				dataType	: 'json html',
				data		: queryData,
				converters	: {
					/*'json html' : this.convertWikiPageData*/
					'json html' : function(response){
						if (data.domain)
						{
						 	$panel.data('domain',data.domain);
						}
						else
						{
						 	$panel.removeData('domain');
						}
						return self.format($panel, response);
					}
				}
			});
		},
		// tools
		format : function($panel, jsonData){
			// get page revision, process page HTML and add some custom content (title, footer)
			var body,
			 	pages = jsonData.query.pages;

			//console.group('format content');
			for (var n in pages)
			{
				if (pages.hasOwnProperty(n))
				{
					// set panel title
					$panel.kpanel('setTitle', pages[n].title);

					// prepare content
					if (pages[n].revisions)
					{
						body = $kt('panel.body')
								.append($kt('block.content',{
										'content':'<h1>'+pages[n].title+'</h1>\
												<a class="k-exit gotowiki" href="'+$panel.data('domain')+'/wiki/'+pages[n].title+'">'+
													langTool.get('exit')+
												'</a>'
										}))
								.append($kt('block.navigation',{'class':'top'}))
								.append($kt('block.content',{'content':pages[n].revisions['0']['*']}))
								.append($kt('block.navigation',{'class':'bottom'}))
								.append($kt('block.content',{'content':_w.footer}));


						this.toc(body);
						this.summary(body);	
						this.collapsible(body);
					}
					else
					{
						throw new Error(langTool.get('no-content'));
					}
				}
			}
			//console.groupEnd();		
			return body;
		},
		/**
		 * Removes the table of contents from the panel but puts it in a
		 * navigable item.
		 */	
		toc : function (body){
			var node = body.find('#toc'), itemLabel;
			if (!node.size())
			{
				return;
			}
			// itemLabel = node.find('#toctitle').text();
			// if (!itemLabel.trim()){
				itemLabel = window.kConnectors.languages.get('navtoc').label;
			// }
			//itemLabel = window.kConnectors.languages.get('en', 'navtoc-label');
			node.remove();
			body.find('div.top').append($kt('line.navigation',{
					iconURL:'connectors/wikipedia/images/toc.png',
					label:itemLabel,
					data:{
						kConnector:	'wikipedia.static',
						kTitle:		itemLabel,
						formater:	this.transformToc,
						source:		node
					}
				})
			);	
		},
		/**
		 * Trasform the table of contents to have a kaiten like markup
		 */	
		transformToc : function (node, title){			
			var block = $kt('block.navigation')
						.append($kt('line.summary',{
							iconURL:'connectors/wikipedia/images/toc.png',
							label:title,
							info:''
						}));

			var toc = node.find('ul').eq(0).clone().attr('id','toc').appendTo(block);
			toc.delegate('li,a', 'click', function(evt){
				$this = $(this);
				if (!$this.is('a'))
				{
					$this = $this.find('a');
				}
				var $panel   = $this.closest('.k-panel');
				var $prev    = $panel.prev();
				if($prev.is(':hidden')){
					$panel.kpanel('prev');
				}

				var $target = $prev.find($this.attr('href').replace(/\./g,'\\.'));//some ids contains '.'
				if ($target.size() > 0)
				{
					$prev.find('.panel-body').scrollTop($target.position().top + $prev.find('.panel-body').scrollTop() - 8);
				}
				return false;
			});

			return $kt('panel.body').append(block);
		},

		/**
		 * Removes the summary from the panel but puts it in a 
		 * navigable item	 
		 */
		summary : function (body){
			//we cannot do $('table.infobox') because sometimes the class name is
			//appended with oddities like '_v2' (infobox_v2)
			//this finds a table with a class attribute starting with 'infobox'
			var node = body.find('table[class^="infobox"]'),
				itemLabel;
			if (!node.size())
			{
				return;
			}
			itemLabel = window.kConnectors.languages.get('navsummary').label;
			node.remove();
			body.find('div.top').append($kt('line.navigation',{
					iconURL:'connectors/wikipedia/images/toc.png',
					label:itemLabel,
					data:{
						kConnector:	'wikipedia.static',
						kTitle:		itemLabel,
						formater:	this.transformSummary,
						source:		node
					}
				})
			);	
		},
		/**
		 * Trasform the table of contents to have a kaiten like markup
		 */	
		transformSummary : function (node,title){
			var block = $kt('block.navigation').append($kt('line.summary',{
					iconURL:'connectors/wikipedia/images/toc.png',
					label:title, 
					info:''
				}));

			var summary = node.attr('id','summary').appendTo(block);

			return $kt('panel.body').append(block);
		},
		collapsible : function (body){
			var collapsible = body.find('.collapsible');
			var self=this;
			if (collapsible.size())
			{
				var items = body.find('div.bottom');
				collapsible.find('tr:first-child').each(function(){
					$(this).find('.noprint').remove();
					$kt('line.navigation',{
							label:$(this).text(),
							data:{
								kConnector:	'wikipedia.static',
								kTitle:		$(this).text(),
								formater:	self.buildCollapseContent,
								source:		$(this).nextAll(),
								title:		$(this).find('td,th').html()
							}
						}).appendTo(items);

				});
			}
			collapsible.remove();
		},
		buildCollapseContent : function (rows, title){
			var block = $kt('block.navigation').append($kt('line.summary',{label:title, info:''}));

			var body = $kt('panel.body').append(block);

			rows.each(function(){
				var self=$(this);
				if (self.text().trim())
				{
					if (self.find('td,th').size()>1){
						title = self.find('td,th').eq(0);
						body.append($kt('block.content',{
							content:'<h2>'+title.html()+'</h2><div>'+title.nextAll().html()+'</div>'
						}));
					}
					else
					{
						body.append($kt('block.content',{
							content:'<div>'+self.find('td,th').html()+'</div>'
						}));
					}
				}
			});

			return body;
		}
	});
	
	/* 5. static */
	_w.addConnector({
		name : "static",
		loader:function(data, $panel, $kaiten){
			$panel.data('connector','wikipedia.static');
			if (!data.domain)
			{
				data.domain = $panel.prev().data('domain') || _w.domain;
			}
		 	$panel.data('domain',data.domain);
			if (!data.formated)
			{
				data.formated = data.formater(data.source, data.title || data.kTitle);
			}
			return data.formated;
		}
	});
	
	/* 6. image */
	_w.addConnector({
		name : "image",
		connectable: function(href, $link) {
			return $link.hasClass('image');
		},
		getData : function(href,$link) {
			var data = { 
				titles : decodeURIComponent(href.split('/').pop())
			};

			if (href.indexOf('http') == 0)
			{
				data.domain = decodeURIComponent(href.match('https?://[^/]*')[0]);
			}
			return data;
		},
		loader : function(data, $panel, $kaiten){
			$panel.data('connector','wikipedia.image');
			if (!data.domain)
			{
				data.domain = $panel.prev().data('domain') || _w.domain;
			}
		 	$panel.data('domain',data.domain);
			var self = this,
				queryData = {							
					action		: 'query', 
					prop		: 'imageinfo', 
					iiprop      : 'url|metadata|size|comment',
					iiparse		: true,
					format		: 'json', 
					titles		: data.titles || 'Main Page'
				};

			// perform our cross-domain AJX request to the public API and
			// use a custom function to convert JSON received into proper HTML
			return $.ajax({
				url			: data.domain+'/w/api.php?callback=?',
				type		: 'get',
				dataType	: 'json html',
				data		: queryData,
				converters	: {
					/*'json html' : this.convertWikiPageData*/
					'json html' : function(response){
						$panel.data('fromConnector','wikipedia.image');
						if (data.domain)
						{
						 	$panel.data('domain',data.domain);
						}
						else
						{
						 	$panel.removeData('domain');
						}
						return self.format($panel,response);
					}
				}
			});
		},
		// tool
		format : function($panel, jsonData){
			// get page revision, process page HTML and add some custom content (title, footer)
			var $body=$kt('panel.body'), h1;
			var pages = jsonData.query.pages;
			for (var n in pages)
			{
				if (pages.hasOwnProperty(n))
				{
					// set panel title
					$panel.kpanel('setTitle', pages[n].title);
					// console.log(pages[n],pages[n].imageinfo[0].width);

					if (pages[n].imageinfo[0])
					{
						$body.append($kt('block.content',{
							content:'<h1>'+pages[n].title+'</h1>\
									<div class="wikiImageView">\
										<img src="'+pages[n].imageinfo[0].url+'"/>\
									</div>'
						})).css('overflow-x', '');

						$panel.kpanel('setOptimalWidth',pages[n].imageinfo[0].width+'px');
					}
					else
					{
						throw new Error(langTool.get('no-content'));
					}
				}
			}

			return $body;
		}
	});
}(kTemplater.jQuery, window.kConnectors.languages));