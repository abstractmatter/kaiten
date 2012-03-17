// Templates for mustache.js

// Kaiten templates
_kTpls = {
	"header"		: '<div class="panel-header">{{{content}}}</div>',
	"body"			: '<div class="panel-body">{{{content}}}</div>',
	"block"			: '<div class="block">{{{content}}}</div>',
	"navBlock"		: '<div class="block block-nav">{{{content}}}</div>',
	"summary"		: '<div class="summary"><img src="{{iconURL}}"><div class="label">{{{label}}}</div><div class="info">{{{info}}}</div></div>',
	"separator"		: '<div title="{{label}} /// {{info}}" class="items separator"><div class="head"><img src="{{iconURL}}" /></div><div class="label">{{{label}}}</div><div class="info">{{{info}}}</div></div>',
	"navigable"		: '<div title="{{label}} /// {{info}}" class="items navigable {{cssClass}}"><div class="head"><img src="{{iconURL}}"></div><div class="label">{{{label}}}</div><div class="info">{{{info}}}</div><div class="tail" /></div>',
	"searchForm"	: '<form onsubmit="return false;" class="quicksearch"><div class="container rounded-corners"><button class="head search" /><input type="text" value="" class="input" placeholder="{{placeholder}}"/><button onclick="$(this).prev().val(\'\');return false;" class="tail reset" /></div></form>',
	"searchHeader"	: '<div class="items search-header"><div class="head"><img src="{{iconURL}}" /></div><div class="label">{{{label}}}</div></div>',
	"blockNoHits"	: '<div class="no-hits">No hits</div>'
};

// Discogs templates
_dTpls = {
	"searchForms"	: '<form onsubmit="return false;" class="quicksearch k-active" style=""><div class="container rounded-corners border-box-sizing" style="display: inline-block; width: 75%;"><button class="head search" /><input type="text" value="" class="input q" placeholder="{{placeholder}}" /><button class="tail reset" onclick="$(this).prev().val(\'\'); return false;"/></div><div class="container rounded-corners border-box-sizing" style="display:inline-block;width:24%;position:relative;left:1%;"><input type="text" value="" class="input year" placeholder="Year..." /><button class="tail reset" onclick="$(this).prev().val(\'\'); return false;"/></div></form>',
	"Label"			: '{{#thumb}}<div class="details-thumb"><img src="{{thumb.uri150}}" /><br /><a href="#" class="navigable link-gallery">[more images]</a></div>{{/thumb}}<h1>{{name}}</h1><p>{{{profile}}}</p>{{#has_contactinfo}}<p><strong>Contact:</strong><br/><address>{{{contactinfo}}}</address></p>{{/has_contactinfo}}<p>{{#has_urls}}<strong>Links:</strong> <ul>{{#urls}}<li><a href="{{.}}">{{.}}</a></li>{{/urls}}</ul>{{/has_urls}}</p>',
	"GalleryThumb"	: '<div class="gallery-thumb"><a href="#" class="navigable link-image"><img src="{{uri150}}" /></a></div>',
	"Artist"		: '{{#thumb}}<div class="details-thumb"><img src="{{thumb.uri150}}" /><br /><a href="#" class="navigable link-gallery">[more images]</a></div>{{/thumb}}<h1>{{name}}</h1>{{#has_realname}}<strong>Real name:</strong> {{realname}}<br /><br />{{/has_realname}}{{#has_namevariations}}<strong>Name variations:</strong> <ul class="enums">{{#namevariations}}<li>{{.}}</li>{{/namevariations}}</ul><br /><br />{{/has_namevariations}}{{#has_aliases}}<strong>Alias(es):</strong> <ul class="links">{{#aliases}}<li>{{#artist_url}}{{.}}{{/artist_url}}</li>{{/aliases}}</ul><br /><br />{{/has_aliases}}{{#has_members}}<strong>Members:</strong> <ul class="links">{{#members}}<li>{{#artist_url}}{{.}}{{/artist_url}}</li> {{/members}}</ul><br /><br />{{/has_members}}{{#has_groups}}<strong>Groups:</strong> <ul class="links">{{#groups}}<li>{{#artist_url}}{{.}}{{/artist_url}}</li> {{/groups}}</ul><br /><br />{{/has_groups}}{{#has_profile}}<strong>Profile:</strong> <p>{{{profile}}}</p><br />{{/has_profile}}{{#has_urls}}<strong>URLs:</strong> <ul>{{#urls}}<li><a href="{{.}}">{{.}}</a></li> {{/urls}}</ul>{{/has_urls}}',
	"Release"		: '{{#thumb}}<div class="details-thumb"><img src="{{thumb.uri150}}" /><br /><a href="#" class="navigable link-gallery">[more images]</a></div>{{/thumb}}<h1>{{title}}{{#is_master}} (master){{/is_master}}</h1>{{#released_formatted}}<strong>Released:</strong> {{released_formatted}}{{#country}}, {{country}}{{/country}}<br /><br />{{/released_formatted}}{{#has_genres}}<strong>Genres:</strong> <ul class="enums">{{#genres}}<li>{{.}}</li>{{/genres}}</ul>{{/has_genres}}<br />{{#has_styles}}<strong>Styles:</strong> <ul class="enums">{{#styles}}<li>{{.}}</li>{{/styles}}</ul><br /><br />{{/has_styles}}{{#has_formats}}<strong>Formats:</strong> <ul class="enums">{{#formats}}<li>{{qty}} x {{name}} {{#descriptions}}{{.}} {{/descriptions}}</li>{{/formats}}</ul><br /><br />{{/has_formats}}<strong>Tracklist:</strong><ul>{{#tracklist}}<li>{{position}}. {{#artists}}{{#artist_url}}{{name}}{{/artist_url}}- {{/artists}}{{title}}{{#duration}} ({{duration}}){{/duration}}{{#has_extraartists}}<a href="#" class="toggle"/><ul class="extra">{{#extraartists}}<li>{{role}}: {{#artist_url}}{{name}}{{/artist_url}}</li>{{/extraartists}}</ul>{{/has_extraartists}}</li>{{/tracklist}}</ul><br />{{#has_notes}}<strong>Release notes:</strong> <p>{{{notes}}}</p>{{/has_notes}}',
};

// backbone.js : models and views
_b  = {
	/* useful data */
	"releaseIcons" : {
		"Appearance"		: "images/artist-16.png",
		"TrackAppearance"	: "images/track-16.png",
		"Producer"			: "images/artist-16.png",
		"Co-producer"		: "images/artist-16.png",
		"Remix"				: "images/remix-16.png",
		"UnofficialRelease"	: "images/unofficial-16.png",
		"Mixed by"			: "images/mixed-16.png",
		"DJ Mix"			: "images/mixed-16.png",
		"Scratches"			: "images/scratch-16.png",						
		"Main"				: "images/release-16.png"	
	},
	"initExtraProps" : function(model, propsArray){
		var currentAttr, newAttr;		
		_.each(propsArray, function(e){
			currentAttr = model.get(e);
			newAttr = {};
			newAttr['has_'+e] = currentAttr != undefined || !_.isEmpty(currentAttr);
			model.set(newAttr);
		});
	},
	"replaceTags" : function(text){
		function encodeReplacer(str, p1){
			var type, uri;
			switch (str[1])
			{
				case 'a':
					type = 'artist';
					text = p1;
					break;
					
				case 'l':
					type = 'label';
					text = p1;
					break;
					
				case 'r':
					type = 'release';
					text = '[release]';
					break;
					
				default:
					break;
			}
			
			if (type)
			{
				return '<a href="'+_d.mainURL+type+'/'+encodeURIComponent(p1)+'">'+text+'</a>';
			}
			
			return str;
		}
		
		if (!text) return '';
		
		text = text.replace(/\[url=([^\]]*)\](.*?)\[\/url\]/g, '<a href="$1">$2</a>');
		text = text.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
		text = text.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
		text = text.replace(/\[a=([^\[]*)\]/g, encodeReplacer);
		text = text.replace(/\[l=([^\[]*)\]/g, encodeReplacer);
		text = text.replace(/\[r=([^\[]*)\]/g, encodeReplacer);
		
		return text;
	},
	"nl2br" : function(text){
		return (text+'').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
	},
	genTplAnchorFunc	: function(type) {
		return function(){
			return function(text, render) {				
				text = render(text);
				var href = $('<span>'+text+'</span>').text();
				return '<a href="'+_d.mainURL+type+'/'+encodeURIComponent(href)+'">'+text+'</a>';
			};
		};
	},
	/* 0. Home */
	"HomeView" : Backbone.View.extend({
		initialize : function(){
			this.$el = $(this.el);
		},
		render : function($kaiten) {
			var summaryHTML = Mustache.to_html(_kTpls.summary, {
					label	: 'Discogs database search and browse v2 beta.',
					info	: 'Search for your favorite labels, artists and releases!<br><br>New features : Discogs API v2, improved search/browsing, scroll loading on results, video player integration, ...<br><br>Version : 2011-11-03<br>Feedback/suggestions : Marc Mignonsin, <a href="mailto:marc@nectil.com">marc@nectil.com</a><br><br />See <a class="k-exit" href="http://kaitenbrowser.com">kaitenbrowser.com</a> for more...<br /><br />Many many thanx to <a href="http://documentcloud.github.com/backbone/">Backbone.js</a>, <a href="http://mustache.github.com/">Mustache.js</a> and <a href="http://popcornjs.org/">Popcorn.js</a> !',
					iconURL	: 'images/release-32.png'
				}),
				navBlockHTML = Mustache.to_html(_kTpls.navBlock, { content : summaryHTML }),
				headerHTML = Mustache.to_html(_kTpls.header, { content : navBlockHTML }),
				$body,
				$form,
				$navBlock = $(Mustache.to_html(_kTpls.navBlock));
						
			_.each([
			       	{ label:'General search', iconURL:'images/search-16.png', tpl:_dTpls.searchForms, tplView:{placeholder:'Keywords...'} },  
			       	{ type:'release', label:'Search for releases', iconURL:'images/release-16.png', tpl:_dTpls.searchForms, tplView:{placeholder:'Release title...'} },
			        { type:'artist', label:'Search for artists', iconURL:'images/artist-16.png', tpl:_kTpls.searchForm, tplView:{placeholder:'Artist name...'} },
			       	{ type:'label', label:'Search for labels', iconURL:'images/label-16.png', tpl:_kTpls.searchForm, tplView:{placeholder:'Label name...'} }
		        ], function(e){
					$navBlock.append(Mustache.to_html(_kTpls.searchHeader, {
						label : e.label,
						iconURL : e.iconURL
					}));
					// NB : View events will not work becuz this.$el will hold a set of 2 elements : panel header + panel body
					$form = $(Mustache.to_html(e.tpl, e.tplView)).submit(function(evt){
						evt.preventDefault();
						
						var $this = $(this),
							$q  = $this.find(':text').first(),
							$y = $this.find(':text.year'),
							q = $q.val(),
							y = $y.val(),
							$navigable;
						
						$this.siblings('form').find(':text').val('');
						
						if (!q && !y)
						{
							return;
						}
						
						var loadData = {
							kConnector	: 'discogs.search',
							q			: q
						};
						var label = 'Search for '+q;
						if (y)
						{
							loadData.year  = y;
							label += ' ('+y+')';
						}
						loadData.kTitle = label;
						if (e.type)
						{
							loadData.type = e.type;
						}
						
						$navigable = $(Mustache.to_html(_kTpls.navigable, {
							label : label,
							iconURL : e.iconURL
						})).data('load', loadData).click(function(e) {
							$q.val(q);
							if (y) $y.val(y);
							$this.siblings('form').find(':text').val('');
						});
						
						$kaiten.kaiten('load', loadData, $this);
						$this.closest('.block-nav').append($navigable);
					});
					$navBlock.append($form);
				}
			);
			
			$body = $(Mustache.to_html(_kTpls.body)).append($navBlock);
			this.$el = $(headerHTML).add($body);
			
			return this.$el;
		}
	}),
	/* 1. Search */
	"Search" : Backbone.Model.extend({
		initialize : function(){
			console.log('Search', this.attributes);
		}
	}),
	"SearchView" : Backbone.View.extend({
		el : '<div class="panel-body" />',
		initialize : function(){
			this.$el = $(this.el);
		},
		initScrollLoader : function($kaiten, url, data, isLast){
			$(this.$el).scrollLoader({
				autoLoad: false,
				loader	: function($block, onComplete){
					data.page++;
					$.ajax({
						url			: url,
						type		: 'get',
						dataType	: 'json html',
						data		: data,
						converters	: {
							"json html" : function(resp){
								_d.checkRequestResponse(resp);
								var search = new _b.Search(resp.data),
									searchView = new _b.SearchView({ model : search }),
									isLast = (resp.data.pagination.page == resp.data.pagination.pages);
								onComplete(searchView.render($kaiten), isLast);							
							}
						}
					});
				}
			});
		},
		render : function($kaiten){
			//console.log('SearchView.render');
			var pagination = this.model.get('pagination'),
				$navBlock = $(Mustache.to_html(_kTpls.navBlock));
			
			if (!pagination.items)
			{
				$navBlock.append(Mustache.to_html(_kTpls.blockNoHits));
			}
			else
			{	
				$navBlock.append(Mustache.to_html(_kTpls.separator, {
					label	: (pagination.pages == 1) ? '1 page' : 'page '+ pagination.page+'/'+pagination.pages, 
					info	: (pagination.items == 1) ? '1 result' : (pagination.pages == 1) ? pagination.items+' results' : _d.searchResultsPerPage+' out of '+pagination.items+' results',
					iconURL	: 'images/search-16.png'
				}));				
				
				_.each(_.sortBy(this.model.get('results'), function(e){ return e.title; }), function(e){
					var nameOrID = e.uri.split('/').pop(); // faster than Kaiten findLoaderData()
					
					var $result = $(Mustache.to_html(_kTpls.navigable, {
						label	: e.title,
						info	: e.type,
						iconURL	: 'images/'+e.type+'-16.png'
					})).data('load', {
						kConnector	: 'discogs.'+e.type,
						kTitle		: e.title,
						name		: nameOrID,
						id			: nameOrID
					});
					
					$navBlock.append($result);
				});
				
				// TODO : scroll loading
			}
			
			this.$el.html($navBlock);
			
			return this.$el;
		}
	}),
	/* Misc */
	"GalleryView" : Backbone.View.extend({
		el : '<div class="block" />',
		initialize : function(){
			this.$el = $(this.el);
		},
		render : function(){
			var $thumb, 
			$el = this.$el;
			
			if (this.options.imagesData.length == 1)
			{
				this.$el.html('<div class="block"><img style="max-width:100%;" src="'+this.options.imagesData[0].uri+'" /></div>');
			}
			else
			{
				_.each(this.options.imagesData, function(e){
					$thumb = $(Mustache.to_html(_dTpls.GalleryThumb, e));
					$thumb.find('.link-image').data('load', {
						kConnector	: 'html.string', 
						kTitle		: e.uri.split('/').pop(),
						html		: '<div class="block"><img style="max-width:100%;" src="'+e.uri+'" /></div>'
					});
					$el.append($thumb);
				});
			}
			
			return this.$el;
		}
	}),
	"ReleasesView" : Backbone.View.extend({
		el : '<div class="block block-nav" />',
		initialize : function(){
			var i, r, a, y;
			this.$el = $(this.el);
			
			switch (this.options.type)
			{
				case 'label_artists':
					this.options.releasesData = this.extractReleases('artist');
				case 'label':
					this.options.releasesData = _.sortBy(this.options.releasesData, function(e){
						return e.artist; 
					});
					break;
					
				case 'label_releases_by_artist':
				case 'artist_releases_by_year':
				case 'artist_releases_by_label':
					this.options.releasesData = _.sortBy(this.options.releasesData, function(e){
						return e.title; 
					});
					break;
					
				case 'artist_labels':
					this.options.releasesData = this.extractReleases('label');
					this.options.releasesData = _.sortBy(this.options.releasesData, function(e){
						return e.label; 
					});
					break;
					
				case 'artist_years':
					this.options.releasesData = this.extractReleases('year');
					this.options.releasesData = _.sortBy(this.options.releasesData, function(e){
						return e.year||''; 
					});
					break;
					
				case 'artist':
					this.options.releasesData = _.sortBy(this.options.releasesData, function(e){
						return e.title; 
					});
					break;
					
				case 'versions':
					this.options.releasesData = _.sortBy(this.options.releasesData, function(e){
						if (!e.released) { return ''; }
						return e.released+e.country+e.label; 
					});
					break;
					
				default:
					break;
			}
		},
		extractReleases : function(field){
			var releases = {}, currentRelease, currentField, e;
			for (i in this.options.releasesData)
			{
				currentRelease = this.options.releasesData[i];
				currentField = currentRelease[field];
				currentField = currentField || '';
				e = releases[currentField];
				if (e)
				{
					e.releases.push(currentRelease);
				}
				else
				{
					releases[currentField]  = { releases : [currentRelease] };
					releases[currentField][field] = currentField;
				}
			}
			return releases;
		}, 
		initScrollLoader : function($container, page){
			var self = this,
				page = page || 1;
			this.options.pages = Math.ceil(self.options.releasesData.length/_d.searchResultsPerPage);
			$container.scrollLoader({
				autoLoad: true,
				loader	: function($block, onComplete){
					var isLast = page >= self.options.pages;
					onComplete(self.render(page), isLast);
					$container.closest('.k-panel').trigger('layout');
					page++;
				}
			});
		},
		render : function(page){
			var $el = $(''),
				i, e, previousValue = '',
				label, $navigable,
				start, end,
				page = page || 1,
				info = (this.options.pages) ? 'page '+page+'/'+this.options.pages : '';
			
			if (this.options.type == 'label' || this.options.type == 'label_releases_by_artist')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];
					if (e.artist != previousValue)
					{	
						$navigable = $(Mustache.to_html(_kTpls.separator, {
							label	: e.artist,
							iconURL	: 'images/artist-16.png',
							info	: info
						}));
						$el = $el.add($navigable);
						previousValue = e.artist;
					}
					
					label = e.artist+' - '+e.title+' ('+e.format+')';
					type = (e.type)?e.type:'release';
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: label,
						//iconURL	: 'images/'+type+'-16.png',
						info	: e.catno
					})).data('load', {
						kConnector	: 'discogs.'+type,
						kTitle		: label,
						id			: e.id
					});
					$el = $el.add($navigable);
				}
			}
			else if (this.options.type == 'label_artists')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: e.artist,
						iconURL	: 'images/artist-16.png',
						info	: e.releases.length
					})).data('load', {
						kLoader	: (function(releases){
							var l = function(data, $panel, $kaiten){
								var releasesView = new _b.ReleasesView({ type : 'label_releases_by_artist', releasesData : releases }),
									$body = $('<div class="panel-body" />');
							
								$panel.kpanel({
									afterload : function(){
										releasesView.initScrollLoader($panel.find('.panel-body'));
									}
								});
							
								return $body;
							};
							return l;
						}(e.releases)),
						kTitle		: e.artist+' releases'
					});
					$el = $el.add($navigable);
				}
			}
			else if (this.options.type == 'artist')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				var c;
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];
					label = e.title;
					c = label.charAt(0);
					if (c != previousValue)
					{	
						$el = $el.add(Mustache.to_html(_kTpls.separator, { 
							label : c , 
							iconURL : 'images/release-16.png',
							info	: info
						}));
						previousValue = c;
					}					
					type = (e.type)?e.type:'release';
					
					if (e.trackinfo) label += ' / '+e.trackinfo;
					label += ' ('+e.role+')';
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: label,
						iconURL	: _b.releaseIcons[e.role],
						info	: (e.label) ? (e.label + ((e.year) ? ', '+e.year : '')) : e.year
					})).data('load', {
						kConnector	: 'discogs.'+type,
						kTitle		: label,
						id			: e.id
					});
					$el = $el.add($navigable);
				}
			}
			else if (this.options.type == 'artist_releases_by_year')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];
					if (e.year != previousValue)
					{	
						$el = $el.add(Mustache.to_html(_kTpls.separator, { 
							label : e.year || '? (unknown)', 
							iconURL : 'images/calendar-16.png',
							info	: info
						}));
						previousValue = e.year;
					}
					label = e.title;
					type = (e.type)?e.type:'release';
					
					if (e.trackinfo) label += ' / '+e.trackinfo;
					label += ' ('+e.role+')';
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: label,
						iconURL	: _b.releaseIcons[e.role],
						info	: (e.label) ? (e.label + ((e.year) ? ', '+e.year : '')) : e.year
					})).data('load', {
						kConnector	: 'discogs.'+type,
						kTitle		: label,
						id			: e.id
					});
					$el = $el.add($navigable);
				}
			}
			else if (this.options.type == 'artist_releases_by_label')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];
					if (e.label != previousValue)
					{	
						$navigable = $(Mustache.to_html(_kTpls.separator, {
							label	: e.label|| '? (unknown)',
							iconURL	: 'images/label-16.png',
							info	: info
						}));
						$el = $el.add($navigable);
						previousValue = e.label;
					}
					label = e.title;
					type = (e.type)?e.type:'release';
					
					if (e.trackinfo) label += ' / '+e.trackinfo;
					label += ' ('+e.role+')';
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: label,
						iconURL	: _b.releaseIcons[e.role],
						info	: (e.label) ? (e.label + ((e.year) ? ', '+e.year : '')) : e.year
					})).data('load', {
						kConnector	: 'discogs.'+type,
						kTitle		: label,
						id			: e.id
					});
					$el = $el.add($navigable);
				}
			}
			else if (this.options.type == 'artist_years')
			{
				start = (page > 1) ? 
						this.options.releasesData.length - 1 - ((page - 1) * _d.searchResultsPerPage) :
							this.options.releasesData.length - 1;
						end = start - _d.searchResultsPerPage + 1;
						if (end < 0) end = 0;
						
						for (i=start; i>=end ; i--)
						{
							e = this.options.releasesData[i];
							label = e.year || '? (unknown)';
							
							$navigable = $(Mustache.to_html(_kTpls.navigable, {
								label	: label,
								iconURL	: 'images/calendar-16.png',
								info	: e.releases.length
							})).data('load', {
								kLoader	: (function(releases){
									var l = function(data, $panel, $kaiten){
										var releasesView = new _b.ReleasesView({ type : 'artist_releases_by_year', releasesData : releases }),
										$body = $('<div class="panel-body" />');
										
										$panel.kpanel({
											afterload : function(){
												releasesView.initScrollLoader($panel.find('.panel-body'));
											}
										});
										
										return $body;
									};
									return l;
								}(e.releases)),
								kTitle		: label+' releases ('+e.releases.length+')'
							});
							$el = $el.add($navigable);
						}
			}
			else if (this.options.type == 'artist_labels')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];
					label = e.label || '? (unknown)';
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: label,
						iconURL	: 'images/label-16.png',
						info	: e.releases.length
					})).data('load', {
						kLoader	: (function(releases){
							var l = function(data, $panel, $kaiten){
								var releasesView = new _b.ReleasesView({ type : 'artist_releases_by_label', releasesData : releases }),
									$body = $('<div class="panel-body" />');
							
								$panel.kpanel({
									afterload : function(){
										releasesView.initScrollLoader($panel.find('.panel-body'));
									}
								});
							
								return $body;
							};
							return l;
						}(e.releases)),
						kTitle		: label+' releases ('+e.releases.length+')'
					});
					$el = $el.add($navigable);
				}
			}
			else if (this.options.type == 'versions')
			{
				start = (page > 1) ? (page - 1) * _d.searchResultsPerPage : 0;				
				end = start + _d.searchResultsPerPage ;
				if (end > this.options.releasesData.length) end = this.options.releasesData.length;
				
				for (i=start; i<end ; i++)
				{
					e = this.options.releasesData[i];					
					label = e.format;
					if (e.released || e.country)
					{
						label += ' (';
						if (e.released) label += e.released;
						if (e.country) label += (e.released) ? ', '+e.country : e.country;
						label += ')';
					}
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: label,
						iconURL	: (e.id == this.options.main_release_id) ? 
									'images/release-16.png' :
									'images/version-16.png',
						info	: e.label+' / '+e.catno
					})).data('load', {
						kConnector	: 'discogs.release',
						kTitle		: label,
						id			: e.id
					});
					$el = $el.add($navigable);
				}
			}

			return $el;
		}
	}),
	/* 2. Label */
	"Label" : Backbone.Model.extend({
		initialize : function(){
			if (this.get('contact_info'))
			{
				this.set({ contactinfo : this.get('contact_info') });
			}
			if (this.get('parent_label'))
			{
				this.set({ parentLabel : this.get('parent_label') });
			}
			
			_b.initExtraProps(this, ['contactinfo', 'profile', 'urls']);
			var images = this.get('images');
			if (images)
			{
				this.set({'thumb':images[0]});
			}
			if (this.get('has_profile'))
			{
				this.set({ profile : _b.replaceTags(_b.nl2br(this.get('profile'))) });
			}
			if (this.get('has_contactinfo'))
			{
				this.set({ contactinfo : _b.replaceTags(_b.nl2br(this.get('contactinfo'))) });
			}
			console.log('Label', this.attributes);
		}
	}),
	"LabelView" : Backbone.View.extend({
		el : '<div class="panel-body" />',
		initialize : function(){
			this.$el = $(this.el);
		},
		render : function(){
			//console.log('LabelView.render');
			var model = this.model.attributes,
				labelHTML = Mustache.to_html(_dTpls.Label, model),
				$block = $(Mustache.to_html(_kTpls.block, { content : labelHTML })),
				$navigable, 
				name;

			if (model.images)
			{
				$block.find('.link-gallery').data('load', {
					kConnector	: 'html.string', 
					kTitle		: 'Images',
					html		: new _b.GalleryView({ imagesData : model.images }).render()
				});
			}			
			this.$el.append($block);
			
			$block = $(Mustache.to_html(_kTpls.navBlock));
			
			if (model.parentLabel || model.sublabels)
			{						
				$block.append(Mustache.to_html(_kTpls.summary, { label	: 'Related labels' }));
				
				if (model.parentLabel)
				{
					name = model.parentLabel.name ? model.parentLabel.name : model.parentLabel;
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: name,
						iconURL	: 'images/label-16.png',
						info	: 'parent label'
					})).data('load', {
						kConnector	: 'discogs.label',
						kTitle		: name,
						name		: name
					});
					$block.append($navigable);
				}
				
				_.each(_.sortBy(model.sublabels, function(e){ return e; }), function(e){
					name = e.name ? e.name : e;
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: name,
						iconURL	: 'images/label-16.png',
						info	: '<em>sub label</em>'
					})).data('load', {
						kConnector	: 'discogs.label',
						kTitle		: name,
						name		: name
					});
					$block.append($navigable);
				});
			}
			this.$el.append($block);
			
			if (model.releases)
			{
				$block = $(Mustache.to_html(_kTpls.navBlock));
				$block.append(Mustache.to_html(_kTpls.summary, { label	: 'Releases ('+model.releases.length+')' }));
				
				if (model.releases.length < _d.searchResultsPerPage / 2)
				{	
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'Browse by artist...',
						iconURL	: 'images/artist-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'label_artists', releasesData : model.releases }),
								$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'Releases by artists ('+model.releases.length+')'
					});
					$block.append($navigable);
					
					var releasesView = new _b.ReleasesView({ type : 'label', releasesData : model.releases });
					$block.append(releasesView.render());
				}
				else
				{
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'View all releases...',
						iconURL	: 'images/release-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'label', releasesData : model.releases }),
								$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'All releases ('+model.releases.length+')'
					});
					$block.append($navigable);
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'Browse by artist...',
						iconURL	: 'images/artist-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'label_artists', releasesData : model.releases }),
								$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'Releases by artists ('+model.releases.length+')'
					});
					$block.append($navigable);
				}
				
				this.$el.append($block);
			}
			
			return this.$el;
		}
	}),
	/* 3. Artist */
	"Artist" : Backbone.Model.extend({
		initialize : function(){
			_b.initExtraProps(this, ['realname', 'namevariations', 'aliases', 'members', 'groups', 'profile', 'urls']);
			var images = this.get('images');
			if (images)
			{
				this.set({'thumb':images[0]});
			}
			if (this.get('has_profile'))
			{
				this.set({ profile : _b.replaceTags(_b.nl2br(this.get('profile'))) });
			}
			console.log('Artist', this.attributes);
		}
	}),
	"ArtistView" : Backbone.View.extend({
		el : '<div class="panel-body" />',
		initialize : function(){
			this.$el = $(this.el);
		},
		render		: function() {
			//console.log('ArtistView.render');			
			var model = this.model.attributes;
			
			model.artist_url = _b.genTplAnchorFunc('artist');
			
			var artistHTML = Mustache.to_html(_dTpls.Artist, model),
				$block = $(Mustache.to_html(_kTpls.block, { content : artistHTML }));
			
			if (model.images)
			{
				$block.find('.link-gallery').data('load', {
					kConnector	: 'html.string', 
					kTitle		: 'Images',
					html		: new _b.GalleryView({ imagesData : model.images }).render()
				});
			}			
			this.$el.html($block);
			
			if (model.releases)
			{
				$block = $(Mustache.to_html(_kTpls.navBlock));
				$block.append(Mustache.to_html(_kTpls.summary, { label	: 'Releases ('+model.releases.length+')' }));
				
				if (model.releases.length < _d.searchResultsPerPage / 2)
				{
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'Browse by year...',
						iconURL	: 'images/calendar-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'artist_years', releasesData : model.releases }),
							$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'Releases by years'
					});
					$block.append($navigable);
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'Browse by label...',
						iconURL	: 'images/label-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'artist_labels', releasesData : model.releases }),
								$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'Releases by labels'
					});
					$block.append($navigable);
					
					var releasesView = new _b.ReleasesView({ type : 'artist', releasesData : model.releases });
					$block.append(releasesView.render());
				}
				else
				{
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'View all releases...',
						iconURL	: 'images/release-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'artist', releasesData : model.releases }),
								$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'All releases ('+model.releases.length+')'
					});
					$block.append($navigable);
					
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'Browse by year...',
						iconURL	: 'images/calendar-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'artist_years', releasesData : model.releases }),
							$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'Releases by years'
					});
					$block.append($navigable);
					$navigable = $(Mustache.to_html(_kTpls.navigable, {
						label	: 'Browse by label...',
						iconURL	: 'images/label-16.png'
					})).data('load', {
						kLoader	: function(data, $panel, $kaiten){
							var releasesView = new _b.ReleasesView({ type : 'artist_labels', releasesData : model.releases }),
								$body = $('<div class="panel-body" />');
							
							$panel.kpanel({
								afterload : function(){
									releasesView.initScrollLoader($panel.find('.panel-body'));
								}
							});
							
							return $body;
						},
						kTitle	: 'Releases by labels'
					});
					$block.append($navigable);
				}
				
				this.$el.append($block);
			}
						
			return this.$el;
		}
	}),
	/* 4. Release */
	"Release" : Backbone.Model.extend({
		initialize : function(){
			_b.initExtraProps(this, [ 'genres', 'styles', 'formats', 'notes', 'videos' ]);
			var images = this.get('images');
			if (images)
			{
				this.set({'thumb':images[0]});
			}
			if (this.get('has_notes'))
			{
				this.set({ profile : _b.replaceTags(this.get('notes')) });
			}
			console.log('Release', this.attributes);
		}
	}),
	"ReleaseView" : Backbone.View.extend({
		el : '<div class="panel-body" />',
		initialize : function(){
			var tracklist = this.model.get('tracklist'),
				i, e;
			
			this.$el = $(this.el);
			
			for (i in tracklist)
			{
				e = tracklist[i];
				if (e.extraartists)
				{
					e.has_extraartists = true;
				}
			}
		},
		events : {
			"click a.toggle" : "toggleExtra"
		},
		toggleExtra : function(e){
			$(e.target).toggleClass('active').next().toggle();			
		},
		render		: function($kaiten) {
			//console.log('ReleaseView.render');
			var model = this.model.attributes;
			model.artist_url = _b.genTplAnchorFunc('artist');
			
			var releaseHTML = Mustache.to_html(_dTpls.Release, model),
				$block = $(Mustache.to_html(_kTpls.block, { content : releaseHTML }));
			
			if (model.images)
			{
				$block.find('.link-gallery').data('load', {
					kConnector	: 'html.string', 
					kTitle		: 'Images',
					html		: new _b.GalleryView({ imagesData : model.images }).render()
				});
			}
			
			this.$el.html($block);
			
			$block = $(Mustache.to_html(_kTpls.navBlock));
			if (model.master_id)
			{
				$block.append($(Mustache.to_html(_kTpls.navigable, {
					label	: 'Master',
					iconURL	: 'images/master-16.png'
				})).data('load', {
					kConnector	: 'discogs.master',
					kTitle		: 'Master',
					id			: model.master_id
				}));
			}
			if (model.main_release)
			{
				$block.append($(Mustache.to_html(_kTpls.navigable, {
					label	: 'Main release',
					iconURL	: 'images/release-16.png'
				})).data('load', {
					kConnector	: 'discogs.release',
					kTitle		: 'Main release',
					id			: model.main_release
				}));
			}
			if (model.versions_url)
			{
				$block.append($(Mustache.to_html(_kTpls.navigable, {
					label	: 'Versions',
					iconURL	: 'images/version-16.png'
				})).data('load', {
					kConnector		: 'discogs.versions',
					kTitle			: 'Versions',
					id				: model.id,
					main_release_id	: model.main_release
				}));
			}
			
			$block.append(Mustache.to_html(_kTpls.summary, { label : 'Artists' }));
			
			_.each(_.sortBy(model.artists, function(e){ return e.name+e.role; }), function(e){
				var $r = $(Mustache.to_html(_kTpls.navigable, {
					label	: e.name,
					iconURL	: 'images/artist-16.png',
					info	: e.role
				})).data('load', {
					kConnector	: 'discogs.artist',
					kTitle		: e.name,
					name		: e.name
				});
				$block.append($r);
			});
			if (model.extraartists)
			{
				_.each(_.sortBy(model.extraartists, function(e){ return e.name+e.role; }), function(e){
					var $r = $(Mustache.to_html(_kTpls.navigable, {
						label	: e.name,
						iconURL	: 'images/star-16.png',
						info	: e.role
					})).data('load', {
						kConnector	: 'discogs.artist',
						kTitle		: e.name,
						name		: e.name
					});
					$block.append($r);
				});
			}
			if (model.labels)
			{
				$block.append(Mustache.to_html(_kTpls.summary, { label : 'Labels' }));
				_.each(_.sortBy(model.labels, function(e){ return e.name+e.catno; }), function(e){
					var $r = $(Mustache.to_html(_kTpls.navigable, {
						label	: e.name,
						iconURL	: 'images/label-16.png',
						info	: e.catno
					})).data('load', {
						kConnector	: 'discogs.label',
						kTitle		: e.name,
						name		: e.name
					});
					$block.append($r);
				});
			}
			if (model.companies && model.companies.length)
			{
				$block.append(Mustache.to_html(_kTpls.summary, { label : 'Companies' }));
				_.each(_.sortBy(model.companies, function(e){ return e.entity_type_name+e.name; }), function(e){
					var $r = $(Mustache.to_html(_kTpls.navigable, {
						label	: e.entity_type_name+' '+e.name,
						iconURL	: 'images/company-16.png',
						info	: e.catno
					})).data('load', $.extend($kaiten.kaiten('findLoaderData', e.resource_url), { kTitle : e.name }));
					$block.append($r);
				});
			}
			if (model.has_videos)
			{
				$block.append(Mustache.to_html(_kTpls.summary, { label : 'Videos' }));
				_.each(_.sortBy(model.videos, function(e){ return e.title; }), function(e){
					var $r = $(Mustache.to_html(_kTpls.navigable, {
						label	: e.title,
						iconURL	: 'images/video-16.png',
						info	: e.duration+'s.'
					})).data('load', {
						kConnector : 'discogs.videos',
						kTitle : 'Video: '+e.title,
						url : e.uri
					});
					$block.append($r);
				});
			}
			
			this.$el.append($block);
			return this.$el;
		}
	})
};