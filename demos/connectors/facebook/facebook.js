/* FACEBOOK CONNECTORS COLLECTION

embed.ly regular expression : http://embed.ly/tools/generator

/((http:\/\/(www\.facebook\.com\/photo\.php.*|www\.facebook\.com\/video\/video\.php.*|www\.facebook\.com\/v\/.*))|(https:\/\/(www\.facebook\.com\/photo\.php.*|www\.facebook\.com\/video\/video\.php.*|www\.facebook\.com\/v\/.*)))/i

https://graph.facebook.com/officity

*/

// namespace
if (!window.kConnectors){
	window.kConnectors = {};
}

// co will be used as a handy shortcut, but that is yet another global variable
var co = window.kConnectors.facebook = {
	// the collection name
	collectionName : 'facebook',

	// (optional) the relative path to the CSS file used by this collection (relative to the document)
	cssFile		: 'connectors/facebook/facebook.css',
	
	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	// by inspecting the link, this function decides if Kaiten has to check the connectors in this collection
	connectable	: function(href, $link){
		var facebook_domain = /https?:\/\/.*facebook\.com\/.*/i;	  
		return facebook_domain.test(href);
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
	// 	markup = [
	//		'<div class="whatever">',
 	//			... do your stuff here
	// 		'</div>'
	// 	];
	// 	return markup.join('');
	// },

	markPageUp : function(jsonxml){
		var $xml,markup;
		markup +=  '<ul class="channel" id="facebook-channel">';

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
	name : 'page',
	connectable : function(href, $link){
		var facebook_user = /https?:\/\/.*facebook\.com\/user\/[a-zA-Z_0-9]*/i;	  
		return facebook_user.test(href);
	},
	getData : function(href, $link){
		var facebook_user_get = /https?:\/\/.*facebook\.com\/user\/([a-zA-Z_0-9]*)(\/.*)?/i;	  
		return {
			user:href.match(facebook_user_get)[1]
		};
	},
	loader : function(data, $panel, $kaiten){
		if (!data.pageid){
			throw new Error('No User/Channel Defined');
		}
		return $.ajax({
			url			: 'http://www.facebook.com/feeds/page.php?id=' + data.pageid + '&format=rss20&callback=?',
			type		: 'get',
			dataType	: 'json',
			converters	: {
				'json' : function(jsonData){
					if (jsonData.error){
						throw new Error(jsonData.error);
					}
					//$panel.kpanel('setTitle', data.user);
					//return co.markPageUp(jsonData);
				}
			}
		});
	}
});
