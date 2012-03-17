/* YOUTUBE CONNECTORS COLLECTION

embed.ly regular expression : http://embed.ly/tools/generator

/((http:\/\/(.*youtube\.com\/watch.*|.*\.youtube\.com\/v\/.*|youtu\.be\/.*|.*\.youtube\.com\/user\/.*|.*\.youtube\.com\/.*#.*\/.*|m\.youtube\.com\/watch.*|m\.youtube\.com\/index.*|.*\.youtube\.com\/profile.*|.*\.youtube\.com\/view_play_list.*|.*\.youtube\.com\/playlist.*))|(https:\/\/(.*youtube\.com\/watch.*|.*\.youtube\.com\/v\/.*)))/i

*/

// namespace
if (!window.kConnectors){
	window.kConnectors = {};
}

// co will be used as a handy shortcut, but that is yet another global variable
var co = window.kConnectors.youtube = {
	// the collection name
	collectionName : 'youtube',

	// (optional) the relative path to the CSS file used by this collection (relative to the document)
	cssFile		: 'connectors/youtube/youtube.css',
	
	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	// by inspecting the link, this function decides if Kaiten has to check the connectors in this collection
	connectable	: function(href, $link){
		var youtube_domain = /https?:\/\/.*youtube\.com\/.*/i;	  
		return youtube_domain.test(href);
	},

	// the connectors array
	connectors	: [],

	// helper
	addConnector : function(connector){
		this.connectors.push(connector);
	},

	// markup functions
	// markmeup : function(jsonObject){
	// 	var markup;
	// 	markup +=  '<div class="whatever">';
	// 	
	// 	// ... do your stuff here
	// 	
	// 	markup += '</div>';
	// 	return markup;
	// },

	markChannelUp : function(jsonxml){
		var $xml,markup;
		markup +=  '<ul class="channel" id="youtube-channel">';

		/*
		<media:thumbnail url="http://i.ytimg.com/vi/vo6GM_r42C8/default.jpg" height="90" width="120" time="00:02:07.500" yt:name="default"/>
		<yt:statistics favoriteCount="1" viewCount="23"/>
		<yt:rating numDislikes="0" numLikes="2"/>
		*/

		$xml = $(jsonxml);
		$xml.find('entry').each(function(){
			var $me=$(this),author,image,title,url,entry;

			author = $me.find('author name').text();
			image = $me.find('media\\:thumbnail:first').attr('url');
			title = $me.find('title').text();
			stats = $me.find('yt\\:statistics').attr('viewCount');
			url = $me.find('media\\:player').attr('url');

			entry = [
				'<li class="video">',
					'<a href="' + url + '">',
						'<div class="thumb">',
							'<img src="' + image +'" />',
						'</div>',
						'<div class="description">',
							'<h4>' + title +'</h4>',
							'<p class="author">by <strong>' + author + '</strong></p>',
							'<p class="meta">' + stats + ' views</p>',
						'</div>',
					'</a>',
				'</li>'
			];

			markup += entry.join('');

		});

		markup += '</ul>';
		return markup;
	},

	markVideoUp : function(jsonxml){
		var $xml,markup,title,author,video,description='',keywords='',keys;

		$xml = $(jsonxml);

		title = $xml.find('title').text();
		author = $xml.find('author name').text();
		date = $xml.find('published').text();
		video = $xml.find('media\\:content[type="application/x-shockwave-flash"]').attr('url');

		description = $xml.find('media\\:description').text();
		description = description.replace('\n','<br /><br />');

		keys = $xml.find('media\\:keywords').text().split(',');
		keywords = '<p class="keywords"><strong>Keywords: </strong>';
		$.each(keys,function(number){
			var k = keys[number];
			keywords += '<a href="http://www.youtube.com/results?search_query=' + k + '">' + k + '</a>, ';
		});
		keywords += '</p>';

		markup = [
			'<div id="youtube-video">',
				'<h1>' + title + '</h1>',
				'<p class="author">added by <a href="http://www.youtube.com/user/' + author + '">' + author + '</a> on ' + date + '</p>',
				'<iframe class="youtube-player" src="' + video + '"></iframe>',
				keywords,
				'<p class="description">' + co.linkText(description) + '</p>',
			'</div>',
			'<script type="text/javascript">',
				'var $panel = $(this);',
					'$video = $panel.find("#youtube-video"),',
					'$player = $video.find("iframe.youtube-player"),',
					'sizeme = function() {',
						'var h = $player.width() * 9 / 16;',
						'if($player.height() != h)',
							'$player.height( ($player.width() * 9 / 16) + "px" );',
					'};',
					'$player.resize(sizeme);',
					'sizeme();',
			'</script>'
		];

		// to avoid <script> tag, we can use:
		// $panel.bind('kpanelafterload', function(e, $p, $K){...}); - OR -
		// $panel.kpanel('option', 'afterload', function($p, $K){...}); - OR -
		// $panel.kpanel({afterload:function(...){...}});

		return markup.join('');
	},

	linkText : function(string){
		if (!string){
			return;
		}
		string = string.replace(/http([^\s)]+)/g, function(m, c){
			return m.link('http'+c);
		}).replace(/\B@(\w+)/g, function(m, c){
			return m.link('http://twitter.com/#!/'+c);
		}).replace(/\B#(\w+)/g, function(m, c){
			return m.link('http://twitter.com/search?q=#'+c);
		}).replace(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g, function(m, c){
			 return '<a href="mailto:'+m+'">'+m+'</a>';
		});
		return string;
	},
};

co.addConnector({
	name : 'user',
	connectable : function(href, $link){
		var youtube_user = /https?:\/\/.*youtube\.com\/user\/[a-zA-Z_0-9]*/i;	  
		return youtube_user.test(href);
	},
	getData : function(href, $link){
		var youtube_user_get = /https?:\/\/.*youtube\.com\/user\/([a-zA-Z_0-9]*)(\/.*)?/i;	  
		return {
			user:href.match(youtube_user_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		if (!data.user){
			throw new Error('No User/Channel Defined');
		}
		return $.ajax({
			url			: 'https://gdata.youtube.com/feeds/api/videos?v=2&author=' + data.user + '&callback=?',
			type		: 'get',
			dataType	: 'json xml',
			converters	: {
				'json xml' : function(jsonData){
					if (jsonData.error){
						throw new Error(jsonData.error);
					}

					$panel.kpanel('setTitle', data.user);

					return co.markChannelUp(jsonData);
				}
			}
		});
	}
});

co.addConnector({
	name : 'video',
	connectable : function(href, $link){
		var youtube_video = /https?:\/\/.*youtube\.com\/watch.*/i;	  
		return youtube_video.test(href);
	},
	getData : function(href, $link){
		var youtube_video_get = /.*v=([a-zA-Z_0-9]*)(&.*)?/i;
		return {
			video:href.match(youtube_video_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		if (!data.video){
			throw new Error('No Video Defined');
		}
		return $.ajax({
			url			: 'https://gdata.youtube.com/feeds/api/videos/' + data.video + '?v=2&callback=?',
			type		: 'get',
			dataType	: 'json xml',
			data		: data,
			converters	: {
				'json xml' : function(jsonData){
					if (jsonData.error){
						throw new Error(jsonData.error);
					}

					$panel.kpanel('setTitle', data.video);

					return co.markVideoUp(jsonData);
				}
			}
		});
	}
});


co.addConnector({
	name : 'search',
	connectable : function(href, $link){
		var youtube_search = /https?:\/\/.*youtube\.com\/results?.*/i;	  
		return youtube_search.test(href);
	},
	getData : function(href, $link){
		var youtube_search_get = /.*search_query=([^&]*)(&.*)?/i;
		return {
			search:href.match(youtube_search_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		if (!data.search){
			throw new Error('No Search Defined');
		}
		return $.ajax({
			url			: 'https://gdata.youtube.com/feeds/api/videos?q=' + data.search + '&v=2&callback=?',
			type		: 'get',
			dataType	: 'json xml',
			data		: data,
			converters	: {
				'json xml' : function(jsonData){
					if (jsonData.error){
						throw new Error(jsonData.error);
					}

					$panel.kpanel('setTitle', data.search);

					return co.markChannelUp(jsonData);
				}
			}
		});
	}
});