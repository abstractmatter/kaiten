/* DISCOGS CONNECTORS COLLECTION */

/* 1. home
 * 2. label
 * 3. release
 * 4. master
 * 5. artist
 * 6. search
 * */

_d = window.kConnectors.discogs = {
	collectionName : "discogs",
	
	// (optional) the CSS file used by this connectors collection
	cssFile		: 'discogs.css',
	
	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	// by inspecting the link, this function decides if Kaiten has to check the connectors in this collection
	connectable	: function(href, $link){
		return (href.indexOf('http://www.discogs.com') > -1);
	},
	
	// (optional) initialization function executed only once, the first time the connectors collection is used
	init		: function($kaiten){
		// tracklist details (release/master)
		$kaiten.undelegate('a.toggle', 'click').delegate('a.toggle', 'click', function(){
			$(this).toggleClass('active').next('span').toggleClass('hidden');
		});
	},
	
	// (optional) desttroy function executed only once, when the connectors collection is unregistered
	destroy		: function($kaiten){
		$kaiten.undelegate('a.toggle', 'click');
	},
	
	// the connectors array
	connectors	: [
  	   	  // 1. home panel
          {
				name : "home",
				connectable : function(href, $link) {								
					var isHome = /^https?:\/\/www\.discogs\.com\/?$/;	  
					return isHome.test(href);
				},
          		// home loader
				loader : function(data, $panel, $kaiten) {
					$panel.kpanel({
						afterload : function(){
							$(this).find(':text').first().focus();
						}
					});
				
					// header
					var $header = kTemplater.jQuery('panel.header');
					var $navBlock = kTemplater.jQuery('block.navigation');
					$navBlock.append(kTemplater.jQuery('line.summary', {
						label	: 'Discogs database search and browse.',
						info	: 'Search for your favorite labels, artists and releases!<br /><br />Version : 2011-10-18<br/>Feedback/suggestions : Marc Mignonsin, <a href="mailto:marc@nectil.com">marc@nectil.com</a><br />See <a href="http://kaitenbrowser.com" class="k-exit">kaitenbrowser.com</a> for more...',
						iconURL : 'images/release-32.png'
					}));
					$header.append($navBlock);
					
					// body
					var $body = kTemplater.jQuery('panel.body');
					$navBlock = kTemplater.jQuery('block.navigation');
					$body.append($navBlock);
													
					_d.createSearchForm('general', $navBlock, $kaiten);
					_d.createSearchForm('labels', $navBlock, $kaiten);
					_d.createSearchForm('artists', $navBlock, $kaiten);
					_d.createSearchForm('releases', $navBlock, $kaiten);
					
					return $header.add($body);
				}
          },
          // 2. labels
          {
        	  	name : "label",
				connectable : function(href, $link) {
					if (href && href.indexOf('http://www.discogs.com/') > -1)
					{
						var parts = href.split('/');
						var idOrName = parts.pop();
						var type = parts.pop();
						return (type === 'label');
					}
					return false;
				},
				getData : function(href, $link) {
					return {
						name 	: href.split('/').pop(),
						encoded : true
					};
				},
				// label loader
				loader : function(data, $panel, $kaiten) {
					//console.log('label data', data);
					var defaultData = {
						//api_key : _d.API_KEY
					};
					
					// merge default data with custom data
					var data2Send = $.extend({}, defaultData, data);
					if (!data2Send.name)
					{
						throw new Error('No name! Cannot retrieve label details.'); 
					}
					data2Send.uri = (!data2Send.encoded) ? 'label/'+encodeURIComponent(data2Send.name) : 'label/'+data2Send.name;
					
					var self = this;
					return $.ajax({
						url			: _d.proxyURL,
						type		: 'post',
						dataType	: 'xml html',
						data		: data2Send,
						converters	: {
							'xml html' : function(xml){
								//console.log('label xml converter', xml);
							    var $xml = $(xml), $resp = $xml.children('resp');
							    _d.updateReqsCount($resp.attr('requests'));
							    var errorMsg = $resp.children('error').text();
							    console.log(errorMsg);
							    if (errorMsg)
							    {
								    throw new Error(errorMsg);
								}
								    
							    var $label = $resp.children('label');
							    console.log($label);
							    var title = $label.children('name').text(); 
				
								// set panel title
								$panel.kpanel('setTitle', title);
								
								// general description
								var $body = kTemplater.jQuery('panel.body');
								
								var $block = kTemplater.jQuery('block.content');
								$block.append(_d.formatImage($label, title));
								$block.append('<h1>'+title+'</h1>');
								$block.append('<p>'+$label.children('profile').text()+'</p>');
								if ($label.children('contactinfo').text())
								{
									$block.append('<p><strong>Contact:</strong> '+$label.children('contactinfo').text()+'</p>');
								}											
								$block.append(_d.formatURLs($label));
								$body.append($block);
								
								// parent label
								var $navItems = $label.children('parentLabel');
								if ($navItems.length > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Parent label</h1>'));
									$block = kTemplater.jQuery('block.navigation');
									$block.append(kTemplater.jQuery('line.navigation', {
										label : $navItems.text(),
										data : { kConnector:'discogs.label', name:$navItems.text() },
										iconURL : 'images/label-16.png'
									}));
									$body.append($block);
								}
				
								// sub label(s)
								$navItems = $label.children('sublabels').children('label');
								if ($navItems.length > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Sub labels</h1>'));
									$block = kTemplater.jQuery('block.navigation');
									$navItems.each(function(){
										var $this = $(this);
										$block.append(kTemplater.jQuery('line.navigation', {
											label : $this.text(),														
											data : { kConnector:'discogs.label', name:$this.text() },
											iconURL : 'images/label-16.png'
										}));
									});
									$body.append($block);												
								}
				
								// release(s)
								$navItems = $label.children('releases').children('release');
								var l = $navItems.length;
								if (l > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Releases ('+l+')</h1>'));
									$navItems.sort(function(a, b){ return $(a).children('catno').text() < $(b).children('catno').text() });
									
									$block = kTemplater.jQuery('block.navigation');
									$navItems.each(function(){
										var $this = $(this);
										$block.append(kTemplater.jQuery('line.navigation', {
											label : $this.children('artist').text()+' - '+$this.children('title').text()+' ('+$this.children('format').text()+')',
											info : $this.children('catno').text(),														
											data : { kConnector:'discogs.release', id:$this.attr('id') },
											iconURL : 'images/release-16.png'
										}));
									});
									
									if (l >= _d.navigablesLimit)
									{
										var $slicedBlock = kTemplater.jQuery('block.navigation');
										$slicedBlock.append(kTemplater.jQuery('line.navigation', {
											label : 'Browe all releases...',
											data : { kConnector:'html.string', html:$block, kTitle:title+' releases ('+l+')' },
											iconURL : 'images/search-16.png'
										}));
										$navItems.slice(0, _d.navigablesLimit).each(function(){
											var $this = $(this);
											$slicedBlock.append(kTemplater.jQuery('line.navigation', {
												label : $this.children('artist').text()+' - '+$this.children('title').text()+' ('+$this.children('format').text()+')',
												info : $this.children('catno').text(),														
												data : { kConnector:'discogs.release', id:$this.attr('id') },
												iconURL : 'images/release-16.png'
											}));
										});
										$body.append($slicedBlock);
									}
									else
									{
										$body.append($block);
									}
								}
								
								return $body;
							}
						}
					});
				}
          },
          // 3. releases
          {
        	  	name : "release",
				connectable : function(href, $link) {
        	  		//console.log('release', arguments, href.indexOf('http://www.discogs.com/'));
					if (href.indexOf('http://www.discogs.com/') > -1)
					{
						var parts = href.split('/');
						var idOrName = parts.pop();
						var type = parts.pop();
						return (type === 'release');
					}
					return false;
				},
				getData : function(href, $link) {
					return {
						id : href.split('/').pop()
					};
				},
				// release loader
				loader : function(data, $panel, $kaiten) {
					//console.log('release data', data);
					var defaultData = {
						//api_key : _d.API_KEY
					};

					// merge default data with custom data
					var data2Send = $.extend({}, defaultData, data);
					if (!data2Send.id)
					{
						throw new Error('No ID! Cannot retrieve release details.');
					}
					data2Send.uri = 'release/'+data2Send.id;
					
					var self = this;								
					return $.ajax({
						url			: _d.proxyURL,
						type		: 'post',
						dataType	: 'xml html',
						data		: data2Send,
						converters	: {
							'xml html' : function(xml){
								//console.log('release xml converter', xml);
							    var $xml = $(xml), $resp = $xml.children('resp');
							    _d.updateReqsCount($resp.attr('requests'));
							    var errorMsg = $resp.children('error').text();
							    if (errorMsg)
							    {
								    throw new Error(errorMsg);
								}
								
							    var $release = $resp.children('release');
							    console.log($release);
							    var title = $release.children('title').text(); 

								// set panel title
								$panel.kpanel('setTitle', title);
								
								// general description
								var $body = kTemplater.jQuery('panel.body');
								
								var $block = kTemplater.jQuery('block.content');
								$block.append(_d.formatImage($release, title));
								$block.append('<h1>'+title+'</h1>');

								// general description : release date											
								$block.append('<p><strong>Release date:</strong> '+$release.children('released').text()+' ('+$release.children('country').text()+')</p>');

								// general description : format(s)
								var $formats = $release.children('formats').children('format');
								var html = '<p><strong>Format(s):</strong><ul>';
								$formats.each(function(i){
									var $this = $(this);
									$descs = $this.children('descriptions').children('description');
									html += '<li>'+$this.attr('qty')+' x '+$this.attr('name');
									$descs.each(function(){
										html += ', '+$(this).text();
									});
									html += '</li>';
								});
								html += '</ul></p>';
								$block.append(html);

								_d.formatGenresStyles($release, $block);
								_d.formatTracklist($release, $block);
								
								// general description : notes
								if ($release.children('notes').text())
								{
									$block.append('<p><strong>Release notes:</strong><br />'+$release.children('notes').text()+'</p>');
								}
								
								$body.append($block);

								// master
								var $master = $release.children('master_id');
								if ($master.length > 0)
								{
									$block = kTemplater.jQuery('block.navigation');
									$block.append(kTemplater.jQuery('line.navigation', {
										label : 'Master',														
										data : {
											kConnector : 'discogs.master',
											kTitle : title,
											id : $master.text()
										},
										iconURL : 'images/master-16.png'
									}));
									$body.append($block);
								}
								
								// artist(s)
								$body.append(kTemplater.jQuery('block.content').append('<h1>Artists</h1>'));
								$block = kTemplater.jQuery('block.navigation');
								$release.children('artists').children('artist').each(function(){
									var $this = $(this);
									$block.append(kTemplater.jQuery('line.navigation', {														
										label : $this.children('name').text(),													
										data : { kConnector:'discogs.artist', name:$this.children('name').text() },
										iconURL : 'images/artist-16.png'
									}));
								});
								$body.append($block);
								
								// credits(s)
								var $navItems = $release.children('extraartists').children('artist');
								if ($navItems.length > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Credits</h1>'));
									$block = kTemplater.jQuery('block.navigation');
									$navItems.sort(function(a, b){ return $(a).children('name').text() > $(b).children('name').text() }).each(function(){
										var $this = $(this);
										$block.append(kTemplater.jQuery('line.navigation', {														
											label : $this.children('name').text(),													
											data : { kConnector:'discogs.artist', name:$this.children('name').text() },
											iconURL : 'images/artist-16.png',
											info : $this.children('role').text()
										}));
									});
									$body.append($block);
								}

								// label(s)
								$navItems = $release.children('labels').children('label');
								if ($navItems.length > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Labels</h1>'));
									$block = kTemplater.jQuery('block.navigation');
									$navItems.each(function(){
										var $this = $(this);
										$block.append(kTemplater.jQuery('line.navigation', {
											label : $this.attr('name'),
											info : $this.attr('catno'),													
											data : { kConnector:'discogs.label', name:$this.attr('name') },
											iconURL : 'images/label-16.png'
										}));
									});
									$body.append($block);												
								}
								
								return $body;
							}
						}
					});
				}
          },
          // 4. masters
          {
        	  	name : "master",
				connectable : function(href, $link) {
					if (href.indexOf('http://www.discogs.com/') > -1)
					{
						var parts = href.split('/');
						var idOrName = parts.pop();
						var type = parts.pop();
						return (type === 'master');
					}
					return false;
				},
				getData : function(href, $link) {
					return {
						id : href.split('/').pop()
					};
				},
				// master loader
				loader : function(data, $panel, $kaiten) {
					//console.log('master data', data);
					var defaultData = {
						//api_key : _d.API_KEY
					};

					// merge default data with custom data
					var data2Send = $.extend({}, defaultData, data);
					if (!data2Send.id)
					{
						throw new Error('No ID! Cannot retrieve master details.');
					}
					data2Send.uri = 'master/'+data2Send.id;
					
					var self = this;								
					return $.ajax({
						url			: _d.proxyURL,
						type		: 'post',
						dataType	: 'xml html',
						data		: data2Send,
						converters	: {
							'xml html' : function(xml){
								//console.log('master xml converter', xml);
							    var $xml = $(xml), $resp = $xml.children('resp');
							    _d.updateReqsCount($resp.attr('requests'));
							    var errorMsg = $resp.children('error').text();
							    if (errorMsg)
							    {
								    throw new Error(errorMsg);
								}
								
							    var $master = $resp.children('master');
							    console.log($master);
							    var mainID = $master.children('main_release').text();
							    var $main = $master.children('versions').children('release[id='+mainID+']');
							    var title = $main.children('title').text(); 

								// set panel title
								$panel.kpanel('setTitle', title);
								
								// general description
								var $body = kTemplater.jQuery('panel.body');
								
								var $block = kTemplater.jQuery('block.content');
								$block.append(_d.formatImage($master, title));
								$block.append('<h1>'+title+'</h1>');
								
								_d.formatGenresStyles($master, $block);
								_d.formatTracklist($master, $block);
																			
								$body.append($block);
								
								// artist(s)
								$body.append(kTemplater.jQuery('block.content').append('<h1>Artists</h1>'));
								$block = kTemplater.jQuery('block.navigation');
								$master.children('artists').children('artist').each(function(){
									var $this = $(this);
									$block.append(kTemplater.jQuery('line.navigation', {														
										label : $this.children('name').text(),													
										data : { kConnector:'discogs.artist', name:$this.children('name').text() },
										iconURL : 'images/artist-16.png'
									}));
								});
								$body.append($block);
								
								// version(s)
								var $navItems = $master.children('versions').children('release');
								if ($navItems.length > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Versions ('+$navItems.length+')</h1>'));
									$block = kTemplater.jQuery('block.navigation');
									$navItems.each(function(){
										var $this = $(this);
										$block.append(kTemplater.jQuery('line.navigation', {														
											label : $this.children('title').text()+' ('+$this.children('format').text()+')',		
											info : $this.children('label').text()+', '+$this.children('released').text().split('-').shift(),											
											data : { kConnector:'discogs.release', id:$this.attr('id') },
											iconURL : 'images/release-16.png'
										}));
									});
									$body.append($block);												
								}
								
								return $body;
							}
						}
					});
				}
          },
          // 5. artists
          {
        	  	name : "artist",
				connectable : function(href, $link) {
					if (href.indexOf('http://www.discogs.com/') > -1)
					{
						var parts = href.split('/');
						var idOrName = parts.pop();
						var type = parts.pop();
						return (type === 'artist');
					}
					return false;
				},
				getData : function(href, $link) {
					return {
						name	: href.split('/').pop().replace(/^(.*)(\?.*)$/, '$1'),
						encoded	: true
					};
				},
				loader : function(data, $panel, $kaiten) {
					//console.log('artist data', data);
					var defaultData = {
						//api_key : _d.API_KEY
					};

					// merge default data with custom data
					var data2Send = $.extend({}, defaultData, data);
					if (!data2Send.name)
					{
						throw new Error('No name! Cannot retrieve artist details.'); 
					}
					data2Send.uri = (!data2Send.encoded) ? 'artist/'+encodeURIComponent(data2Send.name) : 'artist/'+data2Send.name;
					
					var self = this;
					return $.ajax({
						url			: _d.proxyURL,
						type		: 'post',
						dataType	: 'xml html',
						data		: data2Send,
						converters	: {
							'xml html' : function(xml){
								//console.log('artist xml converter', xml);
							    var $xml = $(xml), $resp = $xml.children('resp');
							    _d.updateReqsCount($resp.attr('requests'));
							    var errorMsg = $resp.children('error').text();
							    if (errorMsg)
							    {
								    throw new Error(errorMsg);
								}
								
							    var $artist = $resp.children('artist');
							    console.log($artist);
							    var title = $artist.children('name').text(); 

								// set panel title
								$panel.kpanel('setTitle', title);
								
								// general description
								var $body = kTemplater.jQuery('panel.body');
								
								var $block = kTemplater.jQuery('block.content');
								$block.append(_d.formatImage($artist, title));
								$block.append('<h1>'+title+'</h1>');																						
								if ($artist.children('realname').text())
								{
									$block.append('<p><strong>Real name:</strong> '+$artist.children('realname').text()+'</p>');
								}
								if ($artist.children('profile').text())
								{
									$block.append('<p><strong>Profile:</strong> '+$artist.children('profile').text()+'</p>');
								}
								$block.append(_d.formatURLs($artist));
								var html = '';
								var $names = $artist.children('namevariations').children(), l = $names.length;
								if (l > 0)
								{
									html = '<p><strong>Name variation(s)</strong>: ';
									$names.each(function(i){
										html += $(this).text();
										if (i < (l - 1))
										{
											html += ', ';
										}
									});
									html += '</p>';
								}
								var $aliases = $artist.children('aliases').children();
								l = $aliases.length;
								if (l > 0)
								{
									html += '<p><strong>Alias(es):</strong>';
									$aliases.each(function(i){
										var $this = $(this);
										html += '<a href="http://www.discogs.com/artist/'+encodeURIComponent($this.text())+'">'+$(this).text()+'</a>';
										if (i < (l - 1))
										{
											html += ', ';
										}
									});										
									html += '</p>';
								}
								var $members = $artist.children('members').children();
								l = $members.length;
								if (l > 0)
								{
									html += '<p><strong>Members:</strong>';
									$members.each(function(i){
										var $this = $(this);
										html += '<a href="http://www.discogs.com/artist/'+encodeURIComponent($this.text())+'">'+$(this).text()+'</a>';
										if (i < (l - 1))
										{
											html += ', ';
										}
									});										
									html += '</p>';
								}
								var $groups = $artist.children('groups').children();
								l = $groups.length;
								if (l > 0)
								{
									html += '<p><strong>Group(s):</strong>';
									$groups.each(function(i){
										var $this = $(this);
										html += '<a href="http://www.discogs.com/artist/'+encodeURIComponent($this.text())+'">'+$this.text()+'</a>';
										if (i < (l - 1))
										{
											html += ', ';
										}
									});										
									html += '</p>';
								}
								if ($names.length > 0 || $aliases.length > 0 || $groups.length > 0)
								{
									$block.append(html);
								}
								$body.append($block);
								
								// release(s)
								var $navItems = $artist.children('releases').children('release'), l = $navItems.length;
								if (l > 0)
								{
									$body.append(kTemplater.jQuery('block.content').append('<h1>Releases ('+l+')</h1>'));												
									$navItems.sort(function(a, b){ return parseInt($(a).children('year').text(),10) < parseInt($(b).children('year').text(),10) })
									
									var $block = kTemplater.jQuery('block.navigation');												
									$navItems.each(function(){
										var $this = $(this), type = $this.attr('type');
										var iconURL = _d.releaseIcons[type];
										if (type === 'Main')
										{
											iconURL = 'release';
											type = '';
										}
										if (iconURL === undefined) 
										{								
											//iconURL = 'release';
										}
										var info = $this.children('label').text()+', '+$this.children('year').text();
										if (type)
										{
											info += ' ('+type+')';
										}
										$block.append(kTemplater.jQuery('line.navigation', {
											label : $this.children('title').text()+' ('+$this.children('format').text()+')',
											info : info,	
											data : { kConnector:'discogs.release', id:$this.attr('id') },
											iconURL : 'images/'+iconURL+'-16.png'
										}));
									});
									
									if (l >= _d.navigablesLimit)
									{
										var $slicedBlock = kTemplater.jQuery('block.navigation');
										$slicedBlock.append(kTemplater.jQuery('line.navigation', {
											label : 'Browe all releases...',
											data : { kConnector:'html.string', html:$block, kTitle:title+' releases ('+l+')' },
											iconURL : 'images/search-16.png'
										}));
										$navItems.slice(0, _d.navigablesLimit).each(function(){
											var $this = $(this), type = $this.attr('type');
											var iconURL = _d.releaseIcons[type];
											if (type === 'Main')
											{
												iconURL = 'release';
												type = '';
											}
											if (iconURL === undefined) 
											{								
												//iconURL = 'release';
											}
											var info = $this.children('label').text()+', '+$this.children('year').text();
											if (type)
											{
												info += ' ('+type+')';
											}
											$slicedBlock.append(kTemplater.jQuery('line.navigation', {
												label : $this.children('title').text()+' ('+$this.children('format').text()+')',
												info : info,	
												data : { kConnector:'discogs.release', id:$this.attr('id') },
												iconURL : 'images/'+iconURL+'-16.png'
											}));
										});
										$body.append($slicedBlock);
									}
									else
									{
										$body.append($block);
									}
								}
								
								return $body;
							}
						}
					});
				}
          },
          // 6. search
          {
        	  	name : "search",
				init : function($kaiten){
					$kaiten.delegate('.paginator img', 'click', function(e){
						var $this = $(this);
						var p = $this.closest('.paginator').data('page');
						p = ($this.closest('.tail').length > 0) ? p + 1 : p - 1;
						$this.closest('.k-panel').kpanel('reload', { p : p }, true);
					});
				},
				destroy : function($kaiten){
					$kaiten.undelegate('.paginator img', 'click');
				},
				loader : function(data, $panel, $kaiten) {
					var defaultData = {
						//api_key : _d.API_KEY
					};

					// merge default data with custom data
					var data2Send = $.extend({}, defaultData, data);
					if (!data2Send.q)
					{
						throw new Error('No query! Cannot search.'); 
					}
					var q = data2Send.q;
					data2Send.q = encodeURIComponent(data2Send.q);
					
					var self = this;
					return $.ajax({
						url			: _d.proxyURL,
						type		: 'post',
						dataType	: 'xml html',
						data		: data2Send,
						converters	: {
							'xml html' : function(xml){
								//console.log('search xml converter', xml);
							    var $xml = $(xml), $resp = $xml.children('resp');
							    _d.updateReqsCount($resp.attr('requests'));
							    console.log($resp);
							    $panel.kpanel('setTitle', 'Search for '+q);
							    
							    var $body = kTemplater.jQuery('panel.body'), $block;
								var $block = kTemplater.jQuery('block.navigation');
																			
							    var $exacts = $resp.children('exactresults').children();										    
								if ($exacts.length > 0)
								{
									$block.append(kTemplater.jQuery('line.separator', {
										label : 'Exact results: '+$exacts.length,
										iconURL : 'images/search-16.png'
									}));
									$exacts.sort(function(a, b){ return $(a).children('title').text() > $(b).children('title').text() }).each(function(){
										var $this = $(this), data = $kaiten.kaiten('findLoaderData', $this.children('uri').text());
										data.encoded = true;
										//console.log('result', $this.children('uri').text(), data);
										$block.append(kTemplater.jQuery('line.navigation', {
											label : $this.children('title').text(),
											title :  $this.children('summary').text(),
											info : $this.attr('type'),														
											data : data,
											iconURL : 'images/'+$this.attr('type')+'-16.png'
										}));
									});
								}
								
								var $results = $resp.children('searchresults').children();
								if ($results.length > 0)
								{
									var totalCount = $resp.children('searchresults').attr('numResults');
									var totalPages = Math.ceil(totalCount / 20);
									var currentPage = Math.ceil($resp.children('searchresults').attr('end') / 20);
									
									var $customSep = kTemplater.jQuery('line.separator', {
										"class" : 'paginator',
										label : 'All results: '+totalCount,
										info : (totalPages == 1) ? '' : 'page '+currentPage+'/'+totalPages,
										iconURL : 'images/search-16.png'
									}).append('<div class="tail"><img src="images/browse-next.png" title="next page" /></div>');
																					
									var imgTag  = (currentPage === 1) ? '<img src="images/search-16.png" />' : '<img src="images/browse-prev.png" title="previous page" />';
									$customSep.find('.head').html(imgTag);
									$customSep.find('.tail').toggle(currentPage < totalPages);
									
									$customSep.data('page', currentPage);
									
									$block.append($customSep);
									
									$results.sort(function(a, b){ return $(a).children('title').text() > $(b).children('title').text() }).each(function(){
										var $this = $(this), data = $kaiten.kaiten('findLoaderData', $this.children('uri').text());
										data.encoded = true;
										//console.log('result', $this.children('uri').text(), data);
										$block.append(kTemplater.jQuery('line.navigation', {
											label : $this.children('title').text(),
											title :  $this.children('summary').text(),
											info : $this.attr('type'),														
											data : data,
											iconURL : 'images/'+$this.attr('type')+'-16.png'
										}));
									});
								}
								else
								{
									$block = kTemplater.jQuery('block.noresults', { content : 'No results' });
								}
								
								return $body.append($block);
							}
						}
					});
				}
          } // last connector
	], // end of "discogs" connectors
	// useful variables and helpers
	//API_KEY		: '',
	proxyURL		: 'discogs-proxy.php',
	searchTypesData : {
		general : {
			searchLabel	: 'General search', 
			icon		: 'images/search-16.png'
		},
		labels : {
			searchLabel	: 'Search for labels', 
			icon		: 'images/label-16.png',
		},
		artists : {
			searchLabel	: 'Search for artists', 
			icon		: 'images/artist-16.png',
		},
		releases : {
			searchLabel	: 'Search for releases', 
			icon		: 'images/release-16.png',
		}
	},
	navigablesLimit : 20,
	releaseIcons : {
		"Appearance"		: "artist",
		"TrackAppearance"	: "track",
		"Producer"			: "artist",
		"Co-producer"		: "artist",
		"Remix"				: "remix",
		"UnofficialRelease"	: "unofficial",
		"Mixed by"			: "mixed",
		"DJ Mix"			: "mixed",
		"Scratches"			: "scratch"						
	},
	updateReqsCount : function(n){
		$K.find('#custom-info').html('Today: <strong>'+(5000-n)+'</strong> requests available.');
	},
	formatImage	: function($rootNode, title){
		var $images = $rootNode.children('images').children('image'),
			$first = $images.first(),
			$html = $('<div class="details-thumb" />');
		
		if (!$first.length)
		{
			return;
		}
		
		$html.append($('<a class="navigable" />').data('load', {
			kConnector:'html.string', 
			html:'<div class="block"><img style="max-width:100%;" src="'+$first.attr('uri')+'" /></div>', 
			kTitle:$first.attr('uri').split('/').pop() 
		}).append('<img src="'+$first.attr('uri150')+'" />'));
		
		if ($images.length > 1)
		{							
			var $block = kTemplater.jQuery('block.content'),
				$this;
			$images.each(function(){
				$this = $(this);
				$img = $('<div class="gallery-thumb" />');
				$img.append($('<a class="navigable" />')/*.attr('href', $this.attr('uri'))*/.data('load', {
					kConnector:'html.string', 
					html:'<div class="block"><img style="max-width:100%;" src="'+$this.attr('uri')+'" /></div>', 
					kTitle:$this.attr('uri').split('/').pop() 
				}).append('<img src="'+$this.attr('uri150')+'" />'));
				$img.appendTo($block);
			});
			$('<br /><a class="navigable">[more images]</a>').appendTo($html).data('load', {
				kConnector:'html.string', 
				html:$block, 
				kTitle:title+' images' 
			});
		}
		return $html;
	},
	formatURLs	: function($rootNode){
		var html = '<p>';
		$rootNode.children('urls').children('url').each(function(){
			var $this = $(this);
			html += '<a href="'+$this.text()+'">'+$this.text()+'</a><br/>';
		});
		html += '</p>';
		return html;
	},
	formatGenresStyles : function($rootNode, $block) {
		// general description : genre(s)
		var $genres = $rootNode.children('genres').children('genre'), l = $genres.length;
		var html = '<p><strong>Genre(s):</strong> <em>';
		$genres.each(function(i){
			html += $(this).text();
			if (i < (l - 1))
			{
				html += ', ';
			}
		});	
		html += '</em>';
		
		// general description : styles(s)
		var $styles = $rootNode.children('styles').children('style');
		l = $styles.length;
		html += '<br /><strong>Style(s):</strong> <em>';
		$styles.each(function(i){
			html += $(this).text();
			if (i < (l - 1))
			{
				html += ', ';
			}
		});
		html += '</em></p>';
		$block.append(html);
	},
	formatTracklist : function($rootNode, $block) {
		// general description : tracklist
		var $tracks = $rootNode.children('tracklist').children('track');
		var html = '<p><strong>Tracklist:</strong></p><ul>';
		$tracks.each(function(){
			var $this = $(this), position = $.trim($this.children('position').text());
			var prefix = (!position) ? '' : position+'. ';
			var $artists = $this.children('artists').children('artist'), l = $artists.length;
			html += '<li>'+prefix+$this.children('title').text();
			if (l > 0)
			{
				html += ' by ';
				$artists.each(function(i){
					var $this = $(this), name = $this.children('name').text();
					html += '<a href="http://www.discogs.com/artist/'+encodeURIComponent(name)+'" style="padding:0;">'+name+'</a>';
					if (i < (l - 1))
					{
						html += ', ';
					}
				});
			}
			if ($this.children('duration').text())
			{
				html += ' ('+$this.children('duration').text()+')';
			}
			var $extras = $this.children('extraartists').children('artist');
			l = $extras.length;
			if (l > 0)
			{	
				html += '<a class="toggle" /><span class="hidden"><br />'
				$extras.each(function(i){
					var $this = $(this), name = $this.children('name').text();
					var className = (i === (l-1)) ? 'extra last' : 'extra'; 
					html += '<span class="'+className+'">'+$this.children('role').text()+': ';
					html += '<a href="http://www.discogs.com/artist/'+encodeURIComponent(name)+'">'+name+'</a></span><br />';									
				});
				html += '</span>';
			}
			html += '</li>';
		});
		$block.append(html+'</ul>');
	},
	createSearchHeader : function(config) {
		var kSelectors = Kaiten.selectors;						
		var className = kSelectors.items.itemsClass+' search-header';
		if (config['class'])
		{
			className += ' '+config['class'];
		}
		config.id = config.id || '';
		var html = '<div id="'+config.id+'" class="'+className+'">';
		if (config.iconURL)
		{
			html += '<div class="head"><img src="'+config.iconURL+'" /></div>';
		}
		html += '<div class="'+kSelectors.items.labelClass+'">'+config.label+'</div>';
		if (config.info)
		{
		   html += '<div class="'+kSelectors.items.infoClass+'">'+config.info+'</div>';
		}
		html += '</div>';
		return $(html);
	},
	createSearchForm : function(type, $navBlock, $kaiten) {
		var currentTypeData = _d.searchTypesData[type];
		$navBlock.append(this.createSearchHeader({
			label : currentTypeData.searchLabel,
			iconURL	: currentTypeData.icon
		}));
		$navBlock.append(kTemplater.jQuery('line.search').submit( function(e) {
			e.preventDefault();
			var $this = $(this),
				q = $this.find('input:text').val();
			if (!q)
			{
				return;
			}
			var loadData = {
				kConnector:'discogs.search', 
				q:q,
				p:1
			};
			if (type != 'general')
			{
				loadData.type = type;
			}
			$kaiten.kaiten('load', loadData, $this);
			$this.closest('.block-nav').append(kTemplater.jQuery('line.navigation', {
				label : 'Search: ' + q,
				data : loadData,
				iconURL : currentTypeData.icon
			}));
		}));
	}
};