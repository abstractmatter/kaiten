/*
YOUTUBE CONNECTORS COLLECTION
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

	markChannelUp : function(jsonxml,items){
		var $xml = $(jsonxml), markup = '';

		markup += '<ul class="channel" id="youtube-channel">';
		$xml.find('entry').each(function(i){
			if (items && i == items) return false;

			markup += co.markVideoItemUp(this);
		});
		markup += '</ul>';
		return markup;
	},

	markVideoItemUp : function(jsonxml){
		var $xml=$(jsonxml),author,image,title,url,entry;
		author = $xml.find('author name').text();
		image = $xml.find('media\\:thumbnail:first').attr('url');
		title = $xml.find('title').text();
		stats = $xml.find('yt\\:statistics').attr('viewCount');
		url = $xml.find('media\\:player').attr('url');
		markup = [
			'<li class="video">',
				'<a class="notext" href="' + url + '">',
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
		return markup.join('');
	},

	markVideoPanelUp : function(jsonxml){
		var $xml,markup,title,author,video,description,keywords='',keys;

		$xml = $(jsonxml);

		title = $xml.find('title').text();
		author = $xml.find('author name').text();
		date = $xml.find('published').text();
		video = $xml.find('media\\:content[type="application/x-shockwave-flash"]').attr('url');

		description = $xml.find('media\\:description').text();
		if (description != '') {
			description = description.replace('\n','<br /><br />');
			description = '<p class="description">' + co.linkText(description) + '</p>';
		}

		console.log(description);
		
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
				description,
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

	loadChannel : function(data, converter){
		if (!data.user){
			throw new Error('No User/Channel Defined');
		}
		return $.ajax({
			url			: 'https://gdata.youtube.com/feeds/api/videos?v=2&author=' + data.user + '&callback=?',
			type		: 'get',
			dataType	: 'json xml',
			converters	: {'json xml' : converter}
		});
	},

	loadVideo : function(data, converter){
		if (!data.video){
			throw new Error('No Video Defined');
		}
		return $.ajax({
			url			: 'https://gdata.youtube.com/feeds/api/videos/' + data.video + '?v=2&callback=?',
			type		: 'get',
			dataType	: 'json xml',
			converters	: {'json xml' : converter}
		});
	},

	loadSearch : function(data, converter){
		if (!data.search){
			throw new Error('No Search Defined');
		}
		return $.ajax({
			url			: 'https://gdata.youtube.com/feeds/api/videos?q=' + data.search + '&v=2&callback=?',
			type		: 'get',
			dataType	: 'json xml',
			converters	: {'json xml' : converter}
		});
	}
};

co.addConnector({
	name : 'user',
	connectable : function(href, $link){
		var youtube_user = /https?:\/\/.*youtube\.com\/user\/[a-zA-Z_0-9]*/i;	 
		console.log('youtube_user.test(href): ' + youtube_user.test(href)); 
		return youtube_user.test(href);
	},
	getData : function(href, $link){
		var youtube_user_get = /https?:\/\/.*youtube\.com\/user\/([a-zA-Z_0-9\-]*)(\/.*)?/i;	  
		return {
			user:href.match(youtube_user_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		return co.loadChannel(data,function(jsonData){
			if (jsonData.error){
				throw new Error(jsonData.error);
			}
			$panel.kpanel('setTitle', data.user);
			return co.markChannelUp(jsonData);
		});
	}
});

co.addConnector({
	name : 'video',
	connectable : function(href, $link){
		var youtube_video = /https?:\/\/.*youtube\.com\/watch.*/i;	  
		console.log('youtube_video.test(href): ' + youtube_video.test(href)); 
		return youtube_video.test(href);
	},
	getData : function(href, $link){
		var youtube_video_get = /.*v=([a-zA-Z_0-9\-]*)(&.*)?/i;
		return {
			video:href.match(youtube_video_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		return co.loadVideo(data,function(jsonData){
			if (jsonData.error){
				throw new Error(jsonData.error);
			}
			$panel.kpanel('setTitle', data.video);
			return co.markVideoPanelUp(jsonData);
		});
	}
});

co.addConnector({
	name : 'search',
	connectable : function(href, $link){
		var youtube_search = /https?:\/\/.*youtube\.com\/results?.*/i;	  
		console.log('youtube_search.test(href): ' + youtube_search.test(href)); 
		return youtube_search.test(href);
	},
	getData : function(href, $link){
		var youtube_search_get = /.*search_query=([^&]*)(&.*)?/i;
		return {
			search:href.match(youtube_search_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		return co.loadSearch(data,function(jsonData){
			if (jsonData.error){
				throw new Error(jsonData.error);
			}
			$panel.kpanel('setTitle', data.search);
			return co.markChannelUp(jsonData);
		});
	}
});