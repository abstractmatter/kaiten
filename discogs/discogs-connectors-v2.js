/* DISCOGS CONNECTORS COLLECTION */

/* 1. home
 * 2. search
 * 3. label
 * 4. artist
 * 5. release
 * 6. master
 * 7. master verions
 * 8. videos
 * */

_d = window.kConnectors.discogs = {
	collectionName : "discogs",
	mainURL		: 'http://www.discogs.com/',
	mainAPIURL	: 'http://api.discogs.com/',
	searchResultsPerPage : 50,
	
	// (optional) the CSS file used by this connectors collection
	cssFile		: 'discogs.css',
	
	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	// by inspecting the link, this function decides if Kaiten has to check the connectors in this collection
	connectable	: function(href, $link){
		return (href.indexOf(_d.mainURL) === 0 || href.indexOf(_d.mainAPIURL) === 0);
	},
	
	// (optional) initialization function executed only once, the first time the connectors collection is used
	init		: function($kaiten){
	},
	
	// (optional) desttroy function executed only once, when the connectors collection is unregistered
	destroy		: function($kaiten){
	},
	
	checkOldRequestResponse : function(resp){
		console.log('response', resp);
		if (resp.error)
		{
			throw new Error("Request error: "+resp.error);
		}
	},
	
	checkRequestResponse : function(resp){
		console.log('response', resp.meta, resp);
		if (resp.meta.status != 200)
		{
			throw new Error("Request error: "+resp.meta.status);
		}
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
      			   /*var release = new _b.Release(_soul2.resp.release);
      			   return new _b.ReleaseView({ model : release }).render($kaiten);*/
      			   return new _b.HomeView().render($kaiten);
      		   }
      	   },
  	   	  // 2. search
          {
       	  	name : "search",
       	  	connectable : function(href, $link) {								
				if (href && href.indexOf(_d.mainAPIURL+'search') > -1)
				{
					return true;
				}
				return false;
   		   	},
			getData : function(href, $link) {
				console.log('search.getData', arguments);
				var dataFromURL = {},
					dataParts = href.split('?').pop().split('&'),
					i, l, p;
				for (i=0, l=dataParts.length; i<l; i++)
				{
					p = dataParts[i].split('=');
					dataFromURL[p[0]] = decodeURIComponent(p[1]).replace(/\+/g, ' ');
				}	
				console.log(dataFromURL);
				var loadData = {
					page	: dataFromURL.page || 1,
					per_page: dataFromURL.per_page || _d.searchResultsPerPage
				};
				if (dataFromURL.type)
				{
					loadData.type = dataFromURL.type;
				}
				if (dataFromURL.q)
				{
					loadData.q = dataFromURL.q;
				}
				if (dataFromURL.year)
				{
					loadData.year = dataFromURL.year;
				}
				return loadData;
			},
			loader : function(data, $panel, $kaiten) {
				var data2Send = {
					page	: data.page || 1,
					per_page: data.per_page || _d.searchResultsPerPage
				};
				if (data.type)
				{
					data2Send.type = data.type;
				}
				if (data.q)
				{
					data2Send.q = data.q;
				}
				if (data.year)
				{
					data2Send.year = data.year;
				}

				var searchURL = _d.mainAPIURL+'database/search?callback=?';
				
				return $.ajax({
					url			: searchURL,
					type		: 'get',
					dataType	: 'json html',
					data		: data2Send,
					converters	: {
						"json html" : function(resp){
							_d.checkRequestResponse(resp);
							var search = new _b.Search(resp.data),
								searchView = new _b.SearchView({ model : search });							
							if (resp.data.pagination.page < resp.data.pagination.pages)
							{
								$panel.kpanel({
									afterload : function(){
										searchView.initScrollLoader($kaiten, searchURL, data2Send);
									}
								});
							}
							return searchView.render($kaiten);							
						}
					}
				});
			}
          },
          // 3. labels
          {
        	  name : "label",
        	  connectable : function(href, $link) {								
        		  if (href && href.indexOf(_d.mainURL) > -1)
        		  {
        			  var parts = href.split('/'),
        			  	  idOrName = parts.pop(),
        			  	  type = parts.pop();
        			  return (type === 'label');
        		  }
        		  return false;
        	  },
        	  getData : function(href, $link) {
        		  return {
        			  name 	: href.split('/').pop()
        		  };
        	  },
        	  loader : function(data, $panel, $kaiten) {
        		  var data2Send = {
      				 f			: 'json',
        			 releases	: '1'
        		  };
        		  
        		  return $.ajax({
        			  url			: _d.mainAPIURL+'label/'+data.name+'?callback=?',
        			  type		: 'get',
        			  dataType	: 'json html',
        			  data		: data2Send,
        			  converters	: {
        				  "json html" : function(resp){
        					  _d.checkOldRequestResponse(resp);
        					  var label = new _b.Label(resp.resp.label);
        					  return new _b.LabelView({ model : label }).render();
        				  }
        			  }
        		  });
        	  }
          },
          {
      	  	name : "label2",
				connectable : function(href, $link) {
					if (href.indexOf(_d.mainAPIURL) > -1)
					{
						var parts = href.split('/'),
							id = parts.pop(),
							type = parts.pop();
						return (type === 'labels');
					}
					return false;
				},
				getData : function(href, $link) {
					return {
						id	: href.split('/').pop().replace(/^(.*)(\?.*)$/, '$1')
					};
				},
				loader : function(data, $panel, $kaiten) {
	        		  var data2Send = {
	           			 f			: 'json',
	                	 releases	: '1'
           		  };
           		  
           		  return $.ajax({
           			  url			: _d.mainAPIURL+'labels/'+data.id+'?callback=?',
           			  type		: 'get',
           			  dataType	: 'json html',
           			  data		: data2Send,
           			  converters	: {
           				  "json html" : function(resp){
           					  _d.checkRequestResponse(resp);
        					  var label = new _b.Label(resp.data);
        					  return new _b.LabelView({ model : label }).render();
           				  }
           			  }
           		  });
				}
        },
          // 4. artists
          {
        	  name : "artist",
        	  connectable : function(href, $link) {
        		  if (href.indexOf(_d.mainURL) > -1)
        		  {
        			  var parts = href.split('/'),
        			  name = parts.pop(),
        			  type = parts.pop();
        			  return (type === 'artist');
        		  }
        		  return false;
        	  },
        	  getData : function(href, $link) {
        		  return {
        			  name	: href.split('/').pop().replace(/^(.*)(\?.*)$/, '$1')
        		  };
        	  },
        	  loader : function(data, $panel, $kaiten) {
        		  var data2Send = {
        				  f			: 'json',
        				  releases	: '1'
        		  };
        		  
        		  return $.ajax({
        			  url			: _d.mainAPIURL+'artist/'+data.name+'?callback=?',
        			  type		: 'get',
        			  dataType	: 'json html',
        			  data		: data2Send,
        			  converters	: {
        				  "json html" : function(resp){
        					  _d.checkOldRequestResponse(resp);
        					  var artist = new _b.Artist(resp.resp.artist);
        					  return new _b.ArtistView({ model : artist }).render($panel);
        				  }
        			  }
        		  });
        	  }
          },
          {
        	  	name : "artist2",
				connectable : function(href, $link) {
					if (href.indexOf(_d.mainAPIURL) > -1)
					{
						var parts = href.split('/'),
							id = parts.pop(),
							type = parts.pop();
						return (type === 'artists');
					}
					return false;
				},
				getData : function(href, $link) {
					return {
						id	: href.split('/').pop().replace(/^(.*)(\?.*)$/, '$1')
					};
				},
				loader : function(data, $panel, $kaiten) {
	        		  var data2Send = {
	           			 f			: 'json',
	                	 releases	: '1'
             		  };
             		  
             		  return $.ajax({
             			  url			: _d.mainAPIURL+'artists/'+data.id+'?callback=?',
             			  type		: 'get',
             			  dataType	: 'json html',
             			  data		: data2Send,
             			  converters	: {
             				  "json html" : function(resp){
             					  _d.checkRequestResponse(resp);
             					  var artist = new _b.Artist(resp.data);
             					  return new _b.ArtistView({ model : artist }).render($panel);
             				  }
             			  }
             		  });
				}
          },
          // 5. release
          {
        	  name : "release",
        	  connectable : function(href, $link) {
        		  if (href.indexOf(_d.mainURL) > -1)
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
        	  loader : function(data, $panel, $kaiten) {
        		  var data2Send = {
        		  };
        		  
        		  return $.ajax({
        			  url			: _d.mainAPIURL+'releases/'+data.id+'?callback=?',
        			  type		: 'get',
        			  dataType	: 'json html',
        			  data		: data2Send,
        			  converters	: {
        				  "json html" : function(resp){
        					  _d.checkRequestResponse(resp);
        					  var release = new _b.Release(resp.data);
        					  return new _b.ReleaseView({ model : release }).render($kaiten);
        				  }
        			  }
        		  });
        	  }
          },
          // 6. master
          {
        	  	name : "master",
				connectable : function(href, $link) {
					if (href.indexOf(_d.mainURL) > -1)
					{
						var parts = href.split('/');
						var id = parts.pop();
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
				loader : function(data, $panel, $kaiten) {
	        		  var data2Send = {
	          		  };
              		  
              		  return $.ajax({
              			  url			: _d.mainAPIURL+'masters/'+data.id+'?callback=?',
              			  type		: 'get',
              			  dataType	: 'json html',
              			  data		: data2Send,
              			  converters	: {
              				  "json html" : function(resp){
              					  _d.checkRequestResponse(resp);
              					  var release = new _b.Release(resp.data);
              					  release.set({'is_master':true});
              					  return new _b.ReleaseView({ model : release }).render($kaiten);
              				  }
              			  }
              		  });
				}
          },
          // 7. master versions
          {
        	  name : "versions",
        	  connectable : function(href, $link) {
        		  if (href.indexOf(_d.mainURL) > -1)
        		  {
        			  var parts = href.split('/');						
        			  var versions = parts.pop();
        			  var id = parts.pop();
        			  var masters = parts.pop();
        			  return (masters == 'masters' && versions === 'versions');
        		  }
        		  return false;
        	  },
        	  getData : function(href, $link) {
        		  var parts = href.split('/');						
        		  var versions = parts.pop();
        		  return {
        			  id : parts.pop()
        		  };
        	  },
        	  loader : function(data, $panel, $kaiten) {
        		  var data2Send = {
        		  };
        		  
        		  return $.ajax({
        			  url			: _d.mainAPIURL+'masters/'+data.id+'/versions?callback=?',
        			  type		: 'get',
        			  dataType	: 'json html',
        			  data		: data2Send,
        			  converters	: {
        				  "json html" : function(resp){
        					  _d.checkRequestResponse(resp);
        					  var versionsData = resp.data.versions,
        					  releasesView = new _b.ReleasesView({ 
        						  type 			: 'versions', 
        						  releasesData 	: versionsData,
        						  main_release_id	: data.main_release_id
        					  }),
        					  $body = $('<div class="panel-body" />');
        					  
        					  $block = $(Mustache.to_html(_kTpls.navBlock));
        					  $block.append(Mustache.to_html(_kTpls.summary, { label	: 'Versions ('+versionsData.length+')' }));
        					  $body.append($block);
        					  releasesView.initScrollLoader($body);
        					  
        					  return $body;	
        				  }
        			  }
        		  });
        	  }
          },
          // 8. Videos
          {
        	  	name : "videos",
				connectable : function(href, $link) {
					if (href.indexOf('youtube.com/watch') > -1 || href.indexOf('player.vimeo.com') > -1)
					{
						return true;
					}
					return false;
				},
				getData : function(href, $link) {
					var player = null;
					if (href.indexOf('youtube.com/watch') > -1)
					{
						player = Popcorn.youtube;
					}
					else if (href.indexOf('player.vimeo.com') > -1)
					{
						player = Popcorn.vimeo;
					}
					return {
						player	: player,
						url		: href
					};
				},
				loader : function(data, $panel, $kaiten) {
					var blockID = 'video-'+$panel.attr('id'),
						html = '<div class="panel-body"><div id="'+blockID+'" class="block" /></div>';
					
					$panel.kpanel('option', 'afterload', function(){
						var player = null;
						if (data.url.indexOf('youtube.com/watch') > -1)
						{
							player = Popcorn.youtube;
						}
						else if (data.url.indexOf('player.vimeo.com') > -1)
						{
							player = Popcorn.vimeo;
						}
						if (!player)
						{
							throw new Error('Missing video player for URL "'+data.url+'"!');
						}
						player(blockID, data.url);
					});
					
					return html;
				}
          } // last connector
	] // end of connectors array
};