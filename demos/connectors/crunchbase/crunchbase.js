/* CRUNCHBASE CONNECTORS COLLECTION */

/* 1. home
 * 2. search
 * 3. company
 * 4. financialorganization
 * 5. product
 * 6. person
 * */

// namespace
if (!window.kConnectors)
{
	window.kConnectors = {};
}

//_c will be used as a handy shortcut
_c = window.kConnectors.crunchbase = {
	// the collection name
	collectionName : "crunchbase",
	
	// (optional) the relative path to the CSS file used by this collection (relative to the document)
	cssFile		: 'connectors/crunchbase/crunchbase.css',
	
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
	labels: {
		homepage_url: 			'Website',
		twitter_username: 		'Twitter',
		category_code: 			'Category',
		blog_url: 				'Blog',
		email_address: 			'Email',
		founded: 				'Founded in',
		launched: 				'Launched in',
		number_of_employees: 	'Number of employees',
		company:				'Company',
		person:					'People',
		product:				'Product',
		'financial-organization':'Financial Organization'	 
	},
	months:["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	markupInfo : function(data,info){
		var value, label=this.labels[info];
		if (info=='homepage_url' && data.homepage_url)
		{
			value = '<a href="'+data.homepage_url+'">'+data.homepage_url+'</a>';
		}
		else if (info=='founded' && data.founded_month && data.founded_year)
		{
			value = this.months[data.founded_month-1] + ' ' + data.founded_year;
		}
		else if (info=='launched' && data.launched_month && data.launched_year)
		{
			value = this.months[data.launched_month-1] + ' ' + data.launched_year;
		}
		else if (info == 'twitter_username' && data.twitter_username)
		{
			value = '<a href="http://twitter.com/#!/'+data.twitter_username+'">@'+data.twitter_username+'</a>';
		}
		else if (info == 'blog_url' && data.blog_url)
		{
			value = '<a href="'+data.blog_url+'">'+data.blog_url+'</a>';
		}
		else if (info == 'email_address' && data.email_address)
		{
			value = '<a href="mailto:'+data.email_address+'">'+data.email_address+'</a>';
		}
		else if (data[info])
		{
			value = data[info];
		}
		else
		{
			return;
		}
		return '<p class="infoline">'+label+': <strong>'+value+'</strong></p>';
	},
	markupNavigable : function(json){
		if (json.person)
		{
			return kTemplater.jQuery('line.navigation', {
				label : json.person.first_name+' '+json.person.last_name,
				info : json.title,
				data : { kConnector:'crunchbase.person', permalink:json.person.permalink }
			});
		}
		else if (json.firm)
		{
			return kTemplater.jQuery('line.navigation', {
				label : json.firm.name,
				data : { kConnector:'crunchbase.company', permalink:json.firm.permalink }
			});
		}
		else
		{
			var label = json.name||(json.last_name+' '+json.first_name);
			var config = {
				label:label,
				info:_c.labels[json.namespace],
				iconURL:'connectors/crunchbase/images/'+json.namespace+'-16.png',
				 data:{
					kConnector:'crunchbase.' +json.namespace.replace('-',''),
					kTitle:label,
					permalink:json.permalink
				}
			};
			if (json.image)
			{
				config.iconURL = 'http://www.crunchbase.com/' + json.image.available_sizes[0][1];
			}
			return kTemplater.jQuery('line.navigation', config);
		}
	},
	convertCompanyData : function(jsonData, $body, $kaiten) {
		var n, limit = 5, $block = kTemplater.jQuery('block.content');

		$block.append('<h1>'+jsonData.name+'</h1>');

		if (jsonData.image)
		{
			$block.append('<img class="company-img" src="http://www.crunchbase.com/'+jsonData.image.available_sizes[0][1]+'"/>');
		}

		if (jsonData.description)
		{
			$block.append('<h3>'+jsonData.description+'</h3>');
		}

		if (jsonData.overview)
		{
			$block.append(jsonData.overview);
		}

		$block.append('<h2>General informations</h2>');
		$block.append(_c.markupInfo(jsonData,'homepage_url'));
		$block.append(_c.markupInfo(jsonData,'blog_url'));
		$block.append(_c.markupInfo(jsonData,'number_of_employees'));
		$block.append(_c.markupInfo(jsonData,'twitter_username'));
		$block.append(_c.markupInfo(jsonData,'category_code'));
		$block.append(_c.markupInfo(jsonData,'email_address'));
		$block.append(_c.markupInfo(jsonData,'founded'));

		$body.append($block);

		$block = kTemplater.jQuery('block.navigation');
		$body.append($block);
		
		// tags
		if (jsonData.tag_list)
		{
			var tagsArray = jsonData.tag_list.split(', ');
			tagsArray.sort(function(a, b){
				return a > b;
			});
			
			var $tagsBlock = kTemplater.jQuery('block.navigation');
			kTemplater.jQuery('line.summary',{
				iconURL:'connectors/crunchbase/images/tag-32.png',
				label:'Tags',
				info:''
			}).appendTo($tagsBlock);
			
			$.each(tagsArray, function(ind, tag){
				$tagsBlock.append(kTemplater.jQuery('line.navigation', {
					iconURL:'connectors/crunchbase/images/tag-16.png',
					label : tag,
					data : { kConnector:'crunchbase.search', query:tag }
				}));
			});
			kTemplater.jQuery('line.navigation',{
				iconURL:'connectors/crunchbase/images/tag-16.png',
				label:'Tags',
				info:$tagsBlock.children('.items').size(),
				data:{
					kConnector:'html.string',
					html:kTemplater.jQuery('panel.body').append($tagsBlock),
					kTitle:'Tags'
				}
			}).appendTo($block);
		}

		// -- peoples --
		if (jsonData.relationships)
		{
			if (jsonData.relationships.length)
			{
				$block.append(kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/persons.png',
					label:'People',
					info:''
				}));

				var $allActivePeople = kTemplater.jQuery('block.navigation');
				$allActivePeople.append(kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/persons.png',
					label:'All Active People',
					info:''
				}));
			
				var $allFormerPeople = kTemplater.jQuery('block.navigation');
				$allFormerPeople.append(kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/persons.png',
					label:'All Former People',
					info:''
				}));

				var line, count = 0;

				$.each(jsonData.relationships,function(ind,relation){
					line = _c.markupNavigable(relation);
					if (relation.is_past == false)
					{
						$allActivePeople.append(line);
						if (count < limit)
						{
							$block.append(line.clone(true));
						}
						count++;
					}
					else
					{
						$allFormerPeople.append(line);
					}
				});

				if (count > limit)
				{
					kTemplater.jQuery('line.navigation',{
						iconURL:'connectors/crunchbase/images/persons.png',
						label:'All people...',
						info:$allActivePeople.children('.items').size(),
						data:{
							kConnector:'html.string',
							html:kTemplater.jQuery('panel.body').append($allActivePeople),
							kTitle : 'All Active People'
						}
					}).appendTo($block);
				}
			
				if ($allFormerPeople.children('.items').size()){
					kTemplater.jQuery('line.navigation',{
						iconURL:'connectors/crunchbase/images/persons.png',
						label:'Former people',
						info:$allFormerPeople.children('.items').size(),
						data:{
							kConnector:'html.string',
							html:kTemplater.jQuery('panel.body').append($allFormerPeople),
							kTitle : 'All Former People'
						}
					}).appendTo($block);
				}
			}
		}
		
		// -- products --
		if (jsonData.products)
		{
			if (jsonData.products.length)
			{
				$block.append(kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/product-32.png',
					label:'Products',
					info:''
				}));

				var $productsBlock = kTemplater.jQuery('block.navigation');
				kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/product-32.png',
					label:'Products',
					info:''
				}).appendTo($productsBlock);

				var count = 0;
				$.each(jsonData.products,function(ind,product){
					if (count < limit)
					{
						$block.append(kTemplater.jQuery('line.navigation', {
							//iconURL:'connectors/crunchbase/images/product-16.png',
							label : product.name,
							data : { kConnector:'crunchbase.product', permalink:product.permalink }
						}));
					};

					$productsBlock.append(kTemplater.jQuery('line.navigation', {
						//iconURL:'connectors/crunchbase/images/product-16.png',
						label : product.name,
						data : { kConnector:'crunchbase.product', permalink:product.permalink }
					}));

					count++;
				});

				if (count > limit) {
					kTemplater.jQuery('line.navigation',{
						iconURL:'connectors/crunchbase/images/product-16.png',
						label:'All Products...',
						info:$productsBlock.children('.items').size(),
						data:{
							kConnector:'html.string',
							html:kTemplater.jQuery('panel.body').append($productsBlock),
							kTitle : 'Products'
						}
					}).appendTo($block);
				}

			}
		}

		// -- competitors --
		if (jsonData.competitions)
		{
			if (jsonData.competitions.length)
			{
				$block.append(kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/company-32.png',
					label:'Competitors',
					info:''
				}));

				var $competitorsBlock = kTemplater.jQuery('block.navigation');
				kTemplater.jQuery('line.summary',{
					iconURL:'connectors/crunchbase/images/company-32.png',
					label:'Competitors',
					info:''
				}).appendTo($competitorsBlock);
			
				var count = 0;
				$.each(jsonData.competitions,function(ind,competition){
					if (count < limit)
					{
						$block.append(kTemplater.jQuery('line.navigation', {
							//iconURL:'connectors/crunchbase/images/company-16.png',
							label : competition.competitor.name,
							data : { kConnector:'crunchbase.company', permalink:competition.competitor.permalink }
						}));
					};

					$competitorsBlock.append(kTemplater.jQuery('line.navigation', {
						//iconURL:'connectors/crunchbase/images/company-16.png',
						label : competition.competitor.name,
						data : { kConnector:'crunchbase.company', permalink:competition.competitor.permalink }
					}));
				
					count++;
				});

				if (count > limit)
				{
					kTemplater.jQuery('line.navigation',{
						iconURL:'connectors/crunchbase/images/company-16.png',
						label:'All Competitors...',
						info:$competitorsBlock.children('.items').size(),
						data:{
							kConnector:'html.string',
							html:kTemplater.jQuery('panel.body').append($competitorsBlock),
							kTitle : 'Competitors'
						}
					}).appendTo($block);
				}
			}
		}

		$body.append('<div class="spacer"/>');
		return $body;
	}
};

/* 1. home */
_c.addConnector({
	name : "home",
	connectable : function(href, $link) {
		var isCrunchbaseHome = /^https?:\/\/www\.crunchbase\.com\/?$/;	  
		return isCrunchbaseHome.test(href);
	},
	loader : function(data, $panel, $kaiten){
		$panel.kpanel({
			afterload : function(){
				$(this).find(':text').first().focus();
			}
		});
		
		var $header = kTemplater.jQuery('panel.header');
		var $block = kTemplater.jQuery('block.navigation');
		
		$block.append(kTemplater.jQuery('line.search').submit( function(e) {
				e.preventDefault();
				var $this = $(this),
					query = $this.find('input:text').val();
				$K.kaiten('load', { kConnector:'crunchbase.search', query:query }, $this);

				$panel.find('.panel-body .block-nav').append(kTemplater.jQuery('line.navigation', {
					label : 'Search: ' + query,
					data : { kConnector:'crunchbase.search', query:query }
				}));

			})
		);
		$header.append($block);

		var $body = kTemplater.jQuery('panel.body');
		$block = kTemplater.jQuery('block.navigation');

		$block.append(kTemplater.jQuery('line.navigation', {
			label : 'Company',
			data : { kConnector:'crunchbase.company', permalink:'apple' }
		}));

		$block.append(kTemplater.jQuery('line.navigation', {
			label : 'Person',
			data : { kConnector:'crunchbase.person', permalink:'steve-jobs' }
		}));

		$block.append(kTemplater.jQuery('line.navigation', {
			label : 'Product',
			data : { kConnector:'crunchbase.product', permalink:'iphone' }
		}));

		$body.append($block);
		return $header.add($body);
	}
});

/* 2. search */
_c.addConnector({
	name : "search",
	loader : function(data, $panel, $kaiten){
		if (!data.query)
		{
			throw new Error('No query!');
		}

		var url = 'http://api.crunchbase.com/v/1/search.js?query='+data.query+'&callback=?';

		// uncomment for offline development
		// var url = 'connectors/crunchbase/json/search.js';

		return $.ajax({
			url			: url,
			type		: 'get',
			dataType	: 'json html',
			//data		: data,
			converters	: {
				'json html' : function(jsonData) {
					if (jsonData.error)
					{
						throw new Error(jsonData.error);
					}
					$panel.kpanel('setTitle', 'Search '+data.query);

					var $header = kTemplater.jQuery('panel.header');
					var $body = kTemplater.jQuery('panel.body');

					// -- search input --
					var $block = kTemplater.jQuery('block.navigation');
					$block.append(kTemplater.jQuery('line.search',{text:data.query}).submit(function(e) {
						e.preventDefault();
						var query = $(this).find('input:text').val();
						$panel.kpanel('reload',{ query:query , kTitle:'Search: '+query });
					}));
					$header.append($block);

					// here loop in results
					var total = jsonData.total;
					if (total === 0)
					{
						$body.append(kTemplater.jQuery('block.noresults', { content : 'No results' }));
					}
					else
					{
						var $results = kTemplater.jQuery('block.navigation');

						if (total > 25) 
						{
							// paginate
						}

						for (var i=0, l=jsonData.results.length; i<l; i++)
						{
							$results.append(_c.markupNavigable(jsonData.results[i]));
						}

						if (total > 25) 
						{
							// paginate
						}
						$body.append($results);
					}
					
					return $header.add($body);
				}
			}
		});
	}
});

/* 3. company */
_c.addConnector({
	name : "company",
	connectable : function(href, $link) {
		var parts = href.split('/');
		var permalink = parts.pop();
		if ((href[0] == '/') || (href.indexOf('http://www.crunchbase.com/') > -1))
		{
			var namespace = parts.pop();
			return (namespace == 'company');
		}
		return false;
	},
	getData : function(href, $link) {
		return {
			permalink : href.split('/').pop()
		};
	},
	loader : function(data, $panel, $kaiten){
		var defaultData = {
		};

		// merge default data with custom data
		var data2Send = $.extend({}, defaultData, data);
		if (!data2Send.permalink)
		{
			throw new Error('No permalink! Cannot retrieve company details.');
		}

		var self = this;

		// the API requires to dynamically build the URL, we have no data to send
		var url = 'http://api.crunchbase.com/v/1/company/'+data2Send.permalink+'.js?callback=?';

		// uncomment for offline development
		// var url = 'connectors/crunchbase/json/company.js';

		// perform our cross-domain AJX request to the public API and
		// use a custom function to convert JSON received into proper HTML
		return $.ajax({
			url			: url,
			type		: 'get',
			dataType	: 'json html',
			converters	: {
				'json html' : function(jsonData){
					if (jsonData.error)
					{
						throw new Error(jsonData.error);
					}
					$panel.kpanel('setTitle', jsonData.name);
					var $body = kTemplater.jQuery('panel.body');
					var $html = _c.convertCompanyData(jsonData, $body, $kaiten);
					return $html;
				}
			}
		});
	}
});

/* 4. financialorganization */
_c.addConnector({
	name : "financialorganization",
	connectable : function(href, $link) {
		var parts = href.split('/');
		var permalink = parts.pop();
		if ((href[0] == '/') || (href.indexOf('http://www.crunchbase.com/') > -1))
		{
			var namespace = parts.pop();
			return (namespace == 'financial-organization');
		}
		return false;
	},
	getData : function(href, $link) {
		return {
			permalink : href.split('/').pop()
		};
	},
	loader : function(data, $panel, $kaiten){
		var defaultData = {
		};

		// merge default data with custom data
		var data2Send = $.extend({}, defaultData, data);
		if (!data2Send.permalink)
		{
			throw new Error('No permalink! Cannot retrieve financial organization details.');
		}

		var self = this;

		// the API requires to dynamically build the URL, we have no data to send
		var url = 'http://api.crunchbase.com/v/1/financial-organization/'+data2Send.permalink+'.js?callback=?';

		// uncomment for offline development
		// var url = 'connectors/crunchbase/json/financial-organization.js';

		// perform our cross-domain AJX request to the public API and
		// use a custom function to convert JSON received into proper HTML
		return $.ajax({
			url			: url,
			type		: 'get',
			dataType	: 'json html',
			converters	: {
				'json html' : function(jsonData){
					if (jsonData.error)
					{
						throw new Error(jsonData.error);
					}
					$panel.kpanel('setTitle', jsonData.name);
					var $body = kTemplater.jQuery('panel.body');
					var $html = _c.convertCompanyData(jsonData, $body, $kaiten);
					return $html;
				}
			}
		});
	}
});

/* 5. product */
_c.addConnector({
	name : "product",
	connectable : function(href, $link) {
		var parts = href.split('/');
		var permalink = parts.pop();
		if ((href[0] == '/') || (href.indexOf('http://www.crunchbase.com/') > -1))
		{
			var namespace = parts.pop();
			return (namespace == 'product');
		}
		return false;
	},
	getData : function(href, $link) {
		return {
			permalink : href.split('/').pop()
		};
	},
	loader : function(data, $panel, $kaiten){
		var defaultData = {
		};

		// merge default data with custom data
		var data2Send = $.extend({}, defaultData, data);
		if (!data2Send.permalink)
		{
			throw new Error('No permalink! Cannot retrieve product details.');
		}

		var self = this;

		// the API requires to dynamically build the URL, we have no data to send
		var url = 'http://api.crunchbase.com/v/1/product/'+data2Send.permalink+'.js?callback=?';

		// uncomment for offline development
		// var url = 'connectors/crunchbase/json/product.js';

		// perform our cross-domain AJX request to the public API and
		// use a custom function to convert JSON received into proper HTML
		return $.ajax({
			url			: url,
			type		: 'get',
			dataType	: 'json html',
			converters	: {
				'json html' : function(jsonData){
					if (jsonData.error)
					{
						throw new Error(jsonData.error);
					}
					$panel.kpanel('setTitle', jsonData.name);
					var $body = kTemplater.jQuery('panel.body');
					var $html = self.convertProductData(jsonData, $body, $kaiten);
					return $html;
				}
			}
		});
	},
	// tool
	convertProductData : function(jsonData, $body, $kaiten) {
		var n, $block = kTemplater.jQuery('block.content');
		// general description
		if (jsonData.image)
		{
			$block.append('<img class="product-img" src="http://www.crunchbase.com/'+jsonData.image.available_sizes[0][1]+'"/>');
		}
		$block.append('<h1>'+jsonData.name+'</h1>');

		if (jsonData.overview)
		{
			$block.append(jsonData.overview);
		}

		$block.append('<h2>General informations</h2>');
		$block.append(_c.markupInfo(jsonData,'launched'));
		$block.append(_c.markupInfo(jsonData,'homepage_url'));
		$block.append(_c.markupInfo(jsonData,'twitter_username'));

		$body.append($block);
		// company
		if (jsonData.company)
		{
			$block = kTemplater.jQuery('block.navigation');
			$block.append(kTemplater.jQuery('line.summary',{
				iconURL:'connectors/crunchbase/images/company-32.png',
				label:'Company',
				info:''
			}));
			$body.append($block);

			$block.append(kTemplater.jQuery('line.navigation', {
				label : jsonData.company.name,
				data : { kConnector:'crunchbase.company', permalink:jsonData.company.permalink }
			}));
			$body.append($block);
		}
		return $body;
	}
});

/* 6. person */
_c.addConnector({
	name : "person",
	connectable : function(href, $link) {
		var parts = href.split('/');
		var permalink = parts.pop();
		if ((href[0] == '/') || (href.indexOf('http://www.crunchbase.com/') > -1))
		{
			var namespace = parts.pop();
			return (namespace == 'person');
		}
		return false;
	},
	getData : function(href, $link) {
		return {
			permalink : href.split('/').pop()
		};
	},
	loader : function(data, $panel, $kaiten){
		var defaultData = { 
		};

		// merge default data with custom data
		var data2Send = $.extend({}, defaultData, data);
		if (!data2Send.permalink)
		{
			throw new Error('No permalink! Cannot retrieve person details.');
		}

		var self = this;

		// the API requires to dynamically build the URL, we have no data to send
		var url = 'http://api.crunchbase.com/v/1/person/'+data2Send.permalink+'.js?callback=?';

		// uncomment for offline development
		// var url = 'connectors/crunchbase/json/person.js';

		// perform our cross-domain AJX request to the public API and
		// use a custom function to convert JSON received into proper HTML
		return $.ajax({
			url			: url,
			type		: 'get',
			dataType	: 'json html',
			converters	: {
				'json html' : function(jsonData){
					if (jsonData.error)
					{
						throw new Error(jsonData.error);
					}
					$panel.kpanel('setTitle', jsonData.first_name+' '+jsonData.last_name);
					var $body = kTemplater.jQuery('panel.body');
					var $html = self.convertPersonData(jsonData, $body, $kaiten);
					return $html;
				}
			}
		});
	},
	// tool
	convertPersonData : function(jsonData, $body, $kaiten) {
		var $block = kTemplater.jQuery('block.content');
		// general description
		if (jsonData.image)
		{
			$block.append('<img class="product-img" src="http://www.crunchbase.com/'+jsonData.image.available_sizes[0][1]+'"/>');
		}
		$block.append('<h1>'+jsonData.first_name+' '+jsonData.last_name+'</h1>');
		$body.append($block);
		if (jsonData.overview)
		{
			$block.append(jsonData.overview);
		}
		// companies
		if (jsonData.relationships.length)
		{
			$block = kTemplater.jQuery('block.navigation');
			$block.append(kTemplater.jQuery('line.summary',{
				iconURL:'connectors/crunchbase/images/company-32.png',
				label:'Companies',
				info:''
			}));

			$body.append($block);

			var relation;
			for (var n in jsonData.relationships)
			{
				if (jsonData.relationships.hasOwnProperty(n))
				{
					relation = jsonData.relationships[n];
					$block.append(kTemplater.jQuery('line.navigation', {
						label : relation.firm.name,
						info : relation.title,
						data : { kConnector:'crunchbase.company', permalink:relation.firm.permalink }
					}));
					$body.append($block);
				}
			}
		}
		return $body;
	}
});