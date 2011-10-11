/*
 * Kaiten jQuery plugin
 * Copyright (c) 2011 Nectil SA. François Dispaux, Boris Verdeyen, Marc Mignonsin, Jonathan Sanchez, Julien Gonzalez
 * 
 * E-Mail : support@officity.com
 * Web site : http://www.officity.com/kaiten/
 * Licence: GPL, http://www.gnu.org/licenses/gpl.html
 * 
 * Kaiten is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
 * as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * Kaiten is distributed in the hope that they will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with Sushee. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @name jQuery
 * @exports $ as jQuery
 */

/**
 * @name jQuery.fn
 * @exports $.fn as jQuery.fn
 */

/**
 * @name jQuery.ui
 * @exports $.ui as jQuery.ui
 */

/**
 * @name window.console
 * @exports window.console as console
 */

/**
 * Kaiten Widget
 *
 * Kaiten is a jQuery plug-in which offers a new navigation model 
 * for web applications.
 *
 * You can tailor Kaiten to fit your needs.
 *
 * @class
 * @name kaiten
 * @memberOf jQuery.ui
 * @widget
 */
jKaiten = /**@lends jQuery.ui.kaiten.prototype*/{
	version : '1.1 (2011-10-07)',
	
	/* DEFAULT PROPERTIES/METHODS */
		
	/**
	 * Default Kaiten options, a mix of defaults with settings provided by the user
	 */
	options : {
		/**#@+
		 * @widgetoption
		 * @memberOf jQuery.ui.kaiten
		 */
		/**
		 * Animations Firing Rate
		 *
		 * Foobar 
		 *
		 * Bar Baz
		 *
		 * @type		Number
		 * @default		13
		 */		
		animsFiringRate		: 13,		
		
		/**
		 * Column Width
		 * @type		String
		 * @default		'320px'
		 */
		columnWidth			: '320px',
		
		/**
		 * Options Selector
		 * @type		String
		 * @default		''
		 */
		optionsSelector		: '',
		
		/**
		 * Startup
		 * @type		Function
		 * @default		null
		 */
		startup				: null,
		
		/**
		 * The connectors are objects responsible for retrieving the HTML content that will be displayed in the panels. 
		 * @type		Array
		 * @default		[]
		 * @see			jQuery.ui.kaiten#getConnector
		 * @see			jQuery.ui.kaiten#registerConnector
		 * @see			jQuery.ui.kaiten#unRegisterConnector
		 */
		connectors			: [],
		
		/**
		 * The HTML that will be inserted by default in each panel title bar options.
		 * These options can be toggled when double-clicking on the panel title bar and usually holds a navigation block with navigable items.
		 * @type		String
		 * @default		'<div class="block-nav"><div class="items clickable remove-panel"><div class="label">Remove this panel</div></div></div>'
		 */
		defaultPanelTitleBarOptions	: '<div class="block-nav"><div class="items clickable remove-panel"><div class="label">Remove this panel</div></div></div>'
		/**#@-*/
	},
	
	/**
	 * Default widget creation method
	 * @ignore
	 * @private
	 */
	_create : function() {
		//console.log('jKaiten._create', arguments);
		
		/* 0. check for requirements */
		
		if (this._check4Requirements() === false)
		{
			var $failure = $('<p style="text-align:center;margin-top:20%;">'+
								'Unfortunately, your browser is not supported by Kaiten.<br/>'+
								'Please use '+
								'<a href="http://www.firefox.com/" target="_blank"><strong>Firefox</strong></a>, '+
								'<a href="http://www.apple.com/safari/" target="_blank"><strong>Safari</strong></a>, '+
								'<a href="http://www.google.com/chrome" target="_blank"><strong>Chrome</strong></a>, '+
								'<a href="http://www.opera.com/" target="_blank"><strong>Opera</strong></a>, or '+
								'<a href="http://www.microsoft.com/ie/" target="_blank"><strong>IE version 9 or later</strong></a>.'+
							'</p>');
			$failure.appendTo(this.element);
			return;
		}
		
		/* 0. Basic HTML markup */
		
		var html = '<div id="k-window">'+
			'<div id="k-topbar">'+
				'<div id="mask" class="'+jKaiten.selectors.maskClass+'-20" />'+
				'<div id="k-breadcrumb"></div>'+
			'</div>'+
			'<div id="k-slider"></div>'+
		'</div>';
		$(html).appendTo(this.element);
		
		this.$kWindow = this.element.find(this.selectors.window);
		this.$slider = this.element.find(this.selectors.slider);
		
		// prepare Kaiten's container positioning and dimensions, if needed
		var cssPos = this.element.css('position');
		if (!cssPos || (cssPos === 'static'))
		{
			this.element.css('position', 'relative');
		}
		if (!this.element.width())
		{
			this.element.css({ "width":"100%" });
		}
		if (!this.element.height())
		{
			this.element.css({ "height":"100%" });
		}
		
		/* 1. define state */
		
		var fullPath = $('script[src*="jkaiten.js"]').prop('src');
		
		this._state = {
			columnsCount				: 1,
			prevColumnsCount			: 1,
			columnWidth					: 320,
			hasTouchScreen				: ('ontouchstart' in window),
			tabID						: Math.floor(Math.random()*99999999999).toString(),
			panelsCount					: 0,
			anims						: {
				count			: 0,
				delayedLayout	: false
			},
			focus						: {
				panelIndex		: 0,
				navItemIndex	: null,
				typing			: ''
			},
			connectors 					: jKaiten._state.connectors || { }, // allows connectors registration before Kaiten is initialized
			css							: { },
			basePath					: fullPath.substring(0, fullPath.lastIndexOf('jkaiten.js')),
			execPanelDestroyCallbacks	: true,
			panelDestroyActions			: []
		};
		
		// touchscreen device
		if (this._state.hasTouchScreen)
		{
			$.getScript(this._state.basePath+'/scrollability/scrollability-min.js');
			this._setOption('animsFiringRate', 50);
		}
		
		// compute columns count and widths (desired and real)
		var containerWidth = this.$kWindow.width();
		var intWidth = parseInt(this.options.columnWidth, 10);
		if (/[0-9]%$/.test(this.options.columnWidth)) // desired width in %
		{			
			if ((intWidth > 100) || (intWidth <= 0)) // limitations
			{
				intWidth = 100;
			}
			// compute the desired column width in px
			//this.options.columnWidth = Math.floor(containerWidth * intWidth / 100.0);
			this.options.columnWidth = containerWidth * intWidth / 100.0;
		}
		else // desired width in px
		{
			// limitations
			if ((intWidth <= 0) || (intWidth > containerWidth))
			{
				this.options.columnWidth = containerWidth;
			}
			else if (intWidth < this._constants.minColumnWidth)
			{
				this.options.columnWidth = this._constants.minColumnWidth;
			}
			this.options.columnWidth = intWidth;
		}
				
		// compute real columns count
		this._state.columnsCount = Math.floor(containerWidth / this.options.columnWidth);
		this._state.prevColumnsCount = this._state.columnsCount; // save for later
		
		// compute real column width
		//this._state.columnWidth = Math.floor(containerWidth/this._state.columnsCount);
		this._state.columnWidth = containerWidth / this._state.columnsCount;
		
		/* 2. Additional HTML components */
		
		this._createAppMenu();

		this.$breadcrumb = this.element.find(this.selectors.breadcrumb).kbreadcrumb({}); // init breadcrumb

		// create an iframe for the download links
		$('<iframe />', {
			"id"	: "iframe-download",
			"class"	: "hidden",
			"src"	: ""
		}).prependTo(this.element).load(function(){
			var $this = $(this), response = $this.contents().find('html body').html();
			if (response !== '')
			{
				var msg = 'Download error ('+$this.attr('src')+') !\n\n'+response;
				alert(msg);
			}
		});
		
		this._constants.topBarHeight = $(this.selectors.topbar).outerHeight(true); // save this for later - see _computeDimensions

		/* 3. bind events */
		
		var self = this;
		
		// use Ben Alman jQuery resize event plugin
		this.element.resize(function(e){
			self._doLayout();
		});
		
		$(window).bind('orientationchange', function(e){
			self._doLayout();
		});
		
		// panels titlebar tools (icons)
		var allTools = this._constants.panelLeftTools.concat(this._constants.panelRightTools);
		this.element.delegate(this.selectors.panelItems.titleBar, 'click', function(e){				
			var $target = $(e.target), 
				$panel = $(this).closest(self.selectors.panel),
				focused = $panel.hasClass(self.selectors.focusClass);
			
			if (focused)
			{
				/*if (!$target.hasClass(self.selectors.panelItems.toolClass))
				{
					$panel.kpanel('toggleOptions');
					return;
				}*/
			}
			else
			{
				var tSel = self.selectors.panelItems.tools, dSel = ':not(.'+self.selectors.disabledClass+')';
				if (!$target.is(tSel.prev+dSel) && !$target.is(tSel.next+dSel))
				{
					self.setPanelFocus($panel);
				}
			}
			
			var t, callback = null, i;					
			for (i=allTools.length-1; i>=0; i--)
			{
				t = allTools[i];
				if ($.isFunction(t.callback) && $target.hasClass(t.cssClass))
				{
					t.callback.call($target[0], e, $panel, self.element);	
					return;
				}
			}				
		});
		
		// panel titlebar options
		this.element.delegate(this.selectors.panelItems.titleBar, 'dblclick', function(e){
			var $target = $(e.target), 
			$panel = $(this).closest(self.selectors.panel),
			focused = $panel.hasClass(self.selectors.focusClass);
			
			if (!$target.hasClass(self.selectors.panelItems.toolClass))
			{
				$panel.kpanel('toggleOptions');
				return;
			}
		});
		this.element.delegate(this.selectors.items.removePanel, 'click', function(e){
			self.remove($(this).closest(self.selectors.panel));
		});
		
		// panel animation start/complete
		this.element.bind('animstart.kpanel', function(e){
			self._state.anims.count += 1;
		});
		this.element.bind('animcomplete.kpanel', function(e){
			self._state.anims.count -= 1;
			if (self._state.anims.count <= 0)
			{
				if (self._state.anims.delayedLayout === true)
				{
					console.info('Kaiten layout retry...');
					self._state.anims.delayedLayout = false;
					self._doLayout();
				}
			}
		});
		
		// next panels placement
		this.element.bind('nextplacement.kaiten', function(e, $panel, posInc, callback){
			self._nextPlacement($panel, posInc, callback);
		});
		
		// prev panels placement
		this.element.bind('prevplacement.kaiten', function(e, $panel, posInc, callback){
			self._prevPlacement($panel, posInc, callback);
		});
		
		//panel destruction
		this.element.bind('afterdestroy.kpanel', function(e, isLast){
			self._state.panelsCount -= 1;
			// if there are no visible panels, display the last one that was created
			if (isLast && (self._getVisiblePanels().length === 0) && (self._state.panelsCount > 0))
			{
				self.slideTo(self.getPanel(self._state.panelsCount-1));
			}
		});
		
		// keyboard navigation
		if (!this._state.hasTouchScreen)
		{
			this._initKeyboardNavigation();
		}

		/* 4. Layout */
		
		this._doLayout();
		
		/* 5. Connectors and click delegation */
		
		var m, n;
		for (m in this._constants.connectors)
		{
			this.registerConnector(this._constants.connectors[m]);
		}
		for (n in this.options.connectors)
		{
			this.registerConnector(this.options.connectors[n]);
		}
		//console.log('registered connectors', this._state.connectors);
		
        // non-navigable elements
		this.element.delegate(this.selectors.items.nonavigable, 'click', function(e){
			e.stopPropagation();
		});
		
		// "navigable" elements and "connectable" <a> elements inside a panel
		var clickSelectors = [  
			this.selectors.items.navigable,
			this.selectors.panel+' '+this.selectors.connectable
		];
		this.element.delegate(clickSelectors.join(), 'click', function(e){
			var $this = $(this);
			if ($this.is('a') && !$this.data('load'))
			{
				//console.log('link click', arguments, this);
				self._onClickLink(e, $this);
			}
			else
			{
				//console.log('navitem click', arguments, this);
				self._onClickNavItem(e, $this);
			}
		});
		
		// downloadable elements
		this.element.delegate(this.selectors.downloadable, 'click', function(e){
			var $this = $(this), src;
			if ($this.is('a') && !$this.data('load'))
			{
				e.preventDefault();
				src = $this.attr('href');
			}
			else
			{
				src = $this.data('load').url;
			}
			self.element.children(self.selectors.iFrameDownload).attr('src', src);
		});
		
		/* 6. Startup loading */

		if ($.isFunction(this.options.startup))
		{
			var dataFromURL = null;
			if (window.location.search !== '')
			{	
				dataFromURL = {};
				var dataParts = window.location.search.split('?').pop().split('&');
				var i, l, p;			
				for (i=0, l=dataParts.length; i<l; i++)
				{
					p = dataParts[i].split('=');
					dataFromURL[p[0]] = decodeURIComponent(p[1]).replace(/\+/g, ' ');
				}	
				if (dataFromURL.kURL)
				{
					dataFromURL = this.findLoaderData(dataFromURL.kURL);
				}
			}
			this.options.startup.call(this.element, dataFromURL);
		}
		
		//console.log('options/state', this.options, this._state);
	},
	
	/**
	 * Default widget "set option" method
	 * @ignore
	 * @private
	 */
	_setOption : function(key, value) {
		console.log('jKaiten._setOption', arguments);
		
		switch (key)
		{
			case 'columnWidth':
				this.setColumnWidth(value);
				break;
				
			case 'animsFiringRate':
				jQuery.fx.interval = value;
				break;
				
			case 'connectors':
				if ($.isPlainObject(value))
				{
					for (n in value)
					{
						if (value.hasOwnProperty(n))
						{
							this.registerConnector(n, value[n]); 
						}
					}
				}
				break;
				
			case 'optionsSelector':
				if (value !== '')
				{
					var $custom = $(value);
					if ($custom.length === 0)
					{
						break;
					}
					var customHTML = '<div id="options-custom" class="line">'+$custom.html()+'</div>';
					$custom.remove();
					this.element.find(this.selectors.optionsCustom).html(customHTML);
				}
				break;
			
			default:
				break;
		}
		
		$.Widget.prototype._setOption.apply(this, arguments);
	},
	
	/**
	 * Default destruction method, removes the instance from the encapsulated DOM element, which was stored on instance creation
	 * @ignore
	 * @private
	 */
	destroy : function() {
		console.log('jKaiten.destroy', arguments);
		this.element.find(this.selectors.panel).kpanel('destroy');
		this.element.unbind().undelegate().empty();
		$.Widget.prototype.destroy.apply(this, arguments);
	},
	
	/* PROPERTIES, CONSTANTS, ... */
	
	selectors : {
		window				: '#k-window',
		slider				: '#k-slider',
		topbar				: '#k-topbar',
		topbarMask			: '#k-topbar #mask',
		appMenuBorder		: '#k-topbar #menu-border',
		appMenuContainer	: '#k-topbar #menu-container',
		optionsButton		: '#k-topbar #options-button',
		optionsDialog		: '#k-topbar #options-dlg',
		optionsCustom		: '#k-topbar #options-custom',
		columnsCount		: '#k-topbar #columns-count',
		columnsInc			: '#k-topbar #columns-inc',
		columnsDec			: '#k-topbar #columns-dec',
		breadcrumb			: '#k-breadcrumb',
		breadcrumbItems		: {
			homeClass		: 'home',
			lastClass		: 'last',
			itemIDPrefix	: 'crumb',
			rVisibleClass	: 'r-visible',
			rInvisibleClass	: 'r-invisible'
		},
		iFrameDownload		: '#iframe-download',
		loaderClass			: 'loader',
		maskClass			: 'mask',
		panel				: '.k-panel',
		panelClass			: 'k-panel',
		panelIDPrefix		: 'kp',
		panelItems			: {
			mask				: '.mask',
			loader				: '.loader',
			titleBarClass		: 'titlebar',
			titleBar			: '.titlebar',
			title				: '.titlebar .title',
			titleClass			: 'title',
			titleContainerClass	: 'center',
			leftToolbarClass	: 'left',
			rightToolbarClass	: 'right',
			toolClass			: 'tool',
			tools				: {
				all			: '.titlebar .tool',
				prev		: '.titlebar .nav-prev',
				prevClass	: 'nav-prev',
				next		: '.titlebar .nav-next',
				nextClass	: 'nav-next',
				reload		: '.titlebar .reload',
				newtab		: '.titlebar .newtab',
				maximize	: '.titlebar .maximize'
			},
			optionsClass		: 'panel-options',
			options				: '.panel-options',
			headerClass			: 'panel-header',
			header				: '.panel-header',
			bodyClass			: 'panel-body',
			body				: '.panel-body',
			blockClass			: 'block',
			blockNavClass		: 'block-nav',
			blockIFrameClass	: 'block-iframe',
			blockExitClass		: 'block-exit'
		},
		items				: {
			itemsClass			: 'items',			
			label				: '.label',
			labelClass			: 'label',
			infoClass			: 'info',
			info				: '.info',
			head				: '.head',
			headClass			: 'head',
			tailClass			: 'tail',
			summaryClass		: 'summary',
			separatorClass		: 'separator',
			navigable			: '.navigable:visible',
			navigableClass		: 'navigable',
			nonavigable			: '.no-nav',
			nonavigableClass	: 'no-nav',
			clickable			: '.clickable',
			clickableClass		: 'clickable',
			removePanel			: '.clickable.remove-panel',
			removePanelClass	: 'remove-panel'
		},		
		connectable			: 'a[href]:visible:not(.no-nav,.k-download)',
		activeClass			: 'k-active',
		focusClass			: 'k-focus',
		externalClass		: 'k-external',
		exitClass			: 'k-exit',
		newTabClass			: 'k-newtab',
		disabledClass		: 'disabled',
		visibleClass		: 'visible',
		invisibleClass		: 'invisible',
		downloadableClass	: 'k-download',
		downloadable		: '.k-download'
	},
	
	_state : {
		anims		: { },
		focus		: { },
		connectors	: { },
		css			: { }
	},
	
	_constants : {
		minColumnWidth	: 200,
		clearTypeDelay	: 1000,
		panelLeftTools : [
         {
        	 cssClass	: 'nav-prev',
        	 title		: 'Previous panel',
        	 callback	: function(e, $panel, $kaiten){
 				e.preventDefault();
				$kaiten.kaiten('prev');
			}
         },
         {
         	cssClass	: 'remove',
         	title		: 'Remove',
         	callback	: function(e, $panel, $kaiten){
         		e.preventDefault();         		
         		$kaiten.kaiten('remove', $panel);
         	}
         },
         {
        	 cssClass	: 'reload',
        	 title		: 'Reload',
        	 callback	: function(e, $panel, $kaiten){
 				e.preventDefault();
 				$panel.kpanel('reload');
			}
         }],
         panelRightTools : [
         {
			cssClass	: 'maximize',
			title		: 'Resize',
			callback	: function(e, $panel, $kaiten){
				e.preventDefault();
				if (!$(this).hasClass(jKaiten.selectors.activeClass))
				{
					$panel.kpanel('maximize', self.element);
				}
				else
				{
					$panel.kpanel('originalSize', self.element);
				}
				$(this).toggleClass(jKaiten.selectors.activeClass);
			}
		},
        {
       	 cssClass	: 'newtab',
       	 title		: 'Open this panel in a new tab',
       	 callback	: function(e, $panel, $kaiten){
				e.preventDefault();
				$panel.kpanel('newTab');
			}
        },
		{
			cssClass	: 'nav-next',
			title		: 'Next panel',
			callback	: function(e, $panel, $kaiten){
				e.preventDefault();
				$kaiten.kaiten('next');
			}
		}],
		/**@ignore*/
		connectors		: [
		    // HTML connectors collection
		    {
		    	collectionName	: "html",
		    	connectors		: [
					// get content from a page (url)
					{
						name : "page",
						loader : function(data, $panel, $kaiten) {
							//console.log('html.page loader', arguments);
							return $.get(data.url, data.data);
						}
					},
					// get content from a string/jQuery element
					{
						name : "string",
						loader : function(data, $panel, $kaiten) {
							//console.log('html.string loader', arguments);
							var html = data.html;
							var $html = $('<div />', {
								"class" : jKaiten.selectors.panelItems.bodyClass
							}).append(html);
							if (html instanceof jQuery)
							{
								return $html.clone(true, true); // avoid loss of events/data when panel content removed from DOM
							}
							return $html;
						}
					},
					// get content from DOM
					{
						name : "dom",
						loader : function(data, $panel, $kaiten) {
							//console.log('html.dom loader', arguments);
							var $elem = $(data.contentSelector);
							if (!$elem.length)
							{
								throw new Error('Cannot find DOM element! (selector="'+data.contentSelector+'")');
							}
							return $elem.children().clone(true, true); // avoid loss of events/data when panel content removed from DOM
						}
					} // last connector
				] // end of "html" connectors
		    },
			// load content (referenced by a url) in an iframe
			{			
				name : "iframe",
				loader : function(data, $panel, $kaiten) {
					if (!data.url)
					{
						throw new Error('Missing URL! Cannot load content in an iframe.');
					}
					var title = data.kTitle || data.url;
					$panel.kpanel('setTitle', title);
					var panelSelectors = jKaiten.selectors.panelItems;
					var html = '<div class="'+panelSelectors.headerClass+'">'+
									'<div class="'+panelSelectors.blockExitClass+'">'+
										'<span class="warning"/>This is an external Website.<br/>'+
										'<span style="font-size:80%;">'+
											'<a href="'+data.url+'" class="'+jKaiten.selectors.exitClass+'">Click here open this link in a new window.</a>'+
										'</span>'+
									'</div>'+
								'</div>'+
								'<div class="'+panelSelectors.bodyClass+'" optimal-width="980px">'+
									'<div class="shadow"></div>'+
									'<div class="'+panelSelectors.blockIFrameClass+'">'+
										'<iframe src="'+data.url+'" width="100%" height="100%" class="loader" onload="$(this).removeClass(\'loader\');" />'+
									'</div>'+
								'</div>';
					return html;
				},
				connectable : function(href, $link) {
					return $link.hasClass(jKaiten.selectors.externalClass);
				},
				getData	: function(href, $link) {
					return { url : href };
				}
			} // last connector
		] // end of connectors
	},
	
	/* INTERNAL FUNCTIONS */
	
	/**#@+
	 * @ignore
	 */
	_check4Requirements : function() {
		return (($.browser.mozilla === true) || ($.browser.webkit === true) || ($.browser.opera === true) || ($.browser.msie === true && parseInt($.browser.version, 10) > 8));
	},
	
	_onClickLink : function(e, $link) {
		//console.log('jKaiten._onClickLink', arguments);
		var $panel = $link.closest(this.selectors.panel);
		
		// anchor?
        var href = $link.attr('href');
        if (!href || (href === '#') || (/[ ]*javascript[ ]*:/.test(href) === true))
        {
        	return true;
        }
		if (href[0] === '#')
		{				
			var $body = $link.closest(this.selectors.panelItems.body);
			var $target = $body.find(href.replace(/\./g, '\\.')); // some IDs may contain dots (yes...)		
			if ($target.length > 0)
			{
				e.preventDefault();
				$body.scrollTop($target.position().top + $body.scrollTop() - 8);
				return false;
			}
			$target = $body.find('a[name='+href.substr(1)+']');
			if ($target.length > 0)
			{
				e.preventDefault();
				$body.scrollTop($target.position().top + $body.scrollTop() - 8);
				return false;
			}
		    return true;
		}
		
		// mailto?
		if (/mailto:.+/.test(href) === true)
		{
			return true;
		}
		
		// we'll take it from here
		e.preventDefault();
		
		// exit Kaiten?
		if ($link.hasClass(this.selectors.exitClass))
		{
			// open a new window with a sanitized name
			window.open(href, $link.text().replace(/([^\w])/g, ''));
			return false;
		}
		
        // already active?
        if ($link.hasClass(this.selectors.activeClass) 
        		&& (e.shiftKey === false)
        		&& (e.metaKey === false))
        {
        	var $nextPanel = $panel.next(this.selectors.panel);
        	if ($nextPanel.is(':hidden'))
        	{
        		this.next();
        	}
        	else
        	{
        		this.setPanelFocus($nextPanel);
        	}
        	return false;
        }

		var defaultData = {};
		if ($link.text())
		{
			defaultData.kTitle = $link.text();
		}
		
        // loop through all connectors to determine which one this link will use to load content
        var loadData = this.findLoaderData(href, $link, $(e.target));
		loadData = $.extend({}, defaultData, loadData);
								
		// new tab?
		if ((e.metaKey === true) || $link.hasClass(this.selectors.newTabClass))
		{
			this.newTab(loadData);
			return false;
		}
		
    	// load
    	this.load(loadData, $link);
	},
	
	_onClickNavItem : function(e, $navItem) {
		//console.log('jKaiten._onClickNavItem', arguments);		
		var $target = $(e.target), navItemData = $navItem.data('load');	
		// no data
		if (!navItemData)
		{
			return false;
		}
        // already active?
        if ($navItem.hasClass(this.selectors.activeClass) 
        		&& (e.shiftKey === false)
        		&& (e.metaKey === false))
        {
        	var $nextPanel = $navItem.closest(this.selectors.panel).next(this.selectors.panel);
        	if ($nextPanel.is(':hidden'))
        	{
        		this.next();
        	}
        	else
        	{
        		this.setPanelFocus($nextPanel);
        	}
        	return false;
        }
        
		var label = $navItem.find(this.selectors.items.label).text();
		var defaultData = {
			kTitle : label
		};
		var loadData = $.extend({}, defaultData, navItemData);
					
		// new tab?
		if ((e.metaKey === true) || $navItem.hasClass(this.selectors.newTabClass))
		{
			this.newTab(loadData);
			return false;
		}
    	
    	this.load(loadData, $navItem);
	},
	
	_initKeyboardNavigation : function(){
		//console.log('jKaiten._initKeyboardNavigation', arguments);
		var self = this, focusState = this._state.focus;
		
		// keydown
		$(document).keydown(function(e) {
			//console.log('keydown', e);
			if (self._state.anims.count > 0)
			{
				return;
			}
			if ($(e.target).is(':input'))
			{
				return;
			}

			var keyCode = (e === null) ? event.keyCode : e.which; // mozilla
			var keyChar = String.fromCharCode(keyCode);
			//console.log(keyCode,keyChar);

			switch (keyCode)
			{
				case 37: // left					
					if (focusState.panelIndex > 0)
					{	
						if (focusState.panelIndex <= self._getFirstPanel().kpanel('getState').index)
						{
							self.prev();
				  		}
						else
						{
							self._setPanelFocus(focusState.panelIndex-1);
						}
					}					
			  		break;
			  		
				case 39: // right
					if (focusState.navItemIndex !== null)
					{	
						var $focusedPanel = self._getFocusedPanel();
						var $navItems = $focusedPanel.kpanel('getState').$navItems || $focusedPanel.kpanel('buildNavItemsCollection');
						$navItems.eq(focusState.navItemIndex).trigger('click');
						break;
					}
					if (focusState.panelIndex < (self._state.panelsCount-1))
					{
						if (focusState.panelIndex >= self._getLastPanel().kpanel('getState').index)
						{
							self.next();
						}
						else
						{
							self._setPanelFocus(focusState.panelIndex+1);
						}
					}					
					break;
					
				case 38: // up
					if (focusState.navItemIndex === null) // first focus
					{
						self._setNavItemFocus('firstup');
					}
					else
					{
						
						self._setNavItemFocus(focusState.navItemIndex-1);
					}					
					e.preventDefault();	
					break;
					
				case 40: // down
					if (focusState.navItemIndex === null) // first focus
					{
						self._setNavItemFocus('firstdown');
					}
					else
					{						
						self._setNavItemFocus(focusState.navItemIndex+1);
					}
					e.preventDefault();
					break;
					
				case 97: // 1-9 > columns
				case 98:
				case 99:
				case 100:
				case 101:
				case 102:
				case 103:
				case 104:
				case 105:
					self.setColumnsCount(keyCode-96);
					break;
					
				case 107: // + mozilla
				case 187: // + webkit
					self.setColumnsCount(self._state.columnsCount+1);
					break;
					
				case 109: // - mozilla
				case 189: // - webkit
					self.setColumnsCount(self._state.columnsCount-1);
					break;
					
				default:
					if ((keyCode > 47) && (keyCode < 91))
					{
						if (e.metaKey === true)
						{
							return;
						}
						self._onType(keyChar);
					}
			}
		});
	},
	
	_createAppMenu : function(){
		//console.log('jKaiten._createAppMenu', arguments);

		/* 1. HTML markup */

		var customHTML = '';
		if (this.options.optionsSelector !== '')
		{
			var $custom = $(this.options.optionsSelector);
			customHTML = '<div id="options-custom" class="line">'+$custom.html()+'</div>';
			$custom.remove();
		}
		
		var html = '<div id="menu-border" />'+
					'<div id="menu-container">'+
						'<button id="newtab-button" title="Open the application in a new tab" accesskey="t" onclick="window.open(document.location.href, \'\');" />'+
						'<button id="options-button" title="Options" accesskey="o" />'+
					'</div>'+
					'<div id="options-dlg" class="box-shadow">'+
						'<div id="columns-controls" class="line">'+
							'<strong id="columns-count"></strong>'+
							'<button id="columns-inc" accesskey="p" title="+"/></button><button id="columns-dec" accesskey="m" title="-"/>'+
						'</div>'+
						customHTML+
						'<div class="line footer">'+
							'<p>Kaiten v'+this.version+'</p>'+
							'<p>© 2004-2011 Nectil S.A. all rights reserved.</p>'+
						'</div>'+
					'</div>';
		this.element.find(this.selectors.topbar).append(html);
				
		// update columns count and column width
		this._updateSliderDetails();
		
		/* 2. Events */
		
		var self = this;

		// columns count +/-
		this.element.find(this.selectors.columnsInc).click(function(){
			if (self._state.anims.count > 0) // disable during animations
			{
				return;
			}
			self.setColumnsCount(self._state.columnsCount+1);
			self._updateSliderDetails();
		});
		this.element.find(this.selectors.columnsDec).click(function(){
			if (self._state.anims.count > 0) // disable during animations
			{
				return;
			}
			self.setColumnsCount(self._state.columnsCount-1);
			self._updateSliderDetails();
		});
		
		// options dialog : toggle on click
		this.element.find(this.selectors.optionsButton).click(function(e){
			var $this = $(this), $optionsDialog = self.element.find(self.selectors.optionsDialog);
			if ($optionsDialog.is(':hidden'))
			{
				e.stopPropagation();
				$optionsDialog.fadeIn(125);				
				$(document).bind('click', function(e){						
					var $target = $(e.target);
					if ($target.closest(self.selectors.optionsDialog).length === 0)
					{
						$(document).unbind('click');
						$optionsDialog.hide();
						$this.toggleClass(self.selectors.activeClass);
					}
				});
			}
			else
			{
				$(document).unbind('click');
				$optionsDialog.hide();
			}
			$this.toggleClass(self.selectors.activeClass);
		});
	},
	
	_updateSliderDetails : function() {
		if ((Math.floor(this.$kWindow.width() / (this._state.columnsCount+1)) < this._constants.minColumnWidth) || 
			(this._state.columnWidth < this._constants.minColumnWidth)) // limitation
		{
			this.element.find(this.selectors.columnsInc).attr('disabled', 'disabled').addClass(this.selectors.disabledClass);
		}
		else
		{
			this.element.find(this.selectors.columnsInc).removeAttr('disabled').removeClass(this.selectors.disabledClass);
		}
		if (this._state.columnsCount <= 1) // limitation
		{
			this.element.find(this.selectors.columnsDec).attr('disabled', 'disabled').addClass(this.selectors.disabledClass);
		}
		else
		{
			this.element.find(this.selectors.columnsDec).removeAttr('disabled').removeClass(this.selectors.disabledClass);
		}
		this.element.find(this.selectors.columnsCount).html(this._state.columnsCount+' column(s)');
	},
	
	_computeDimensions : function() {
		//console.log('jKaiten._computeDimensions', arguments);
		this._state.prevWidth = this._state.width; // for breadcrumb layout
		this._state.width = this.$kWindow.width();
		this._state.height = this.$kWindow.height() - this._constants.topBarHeight;

		/* 1. save columns count for later (expand / reduce strategies - see _doLayout) */

		this._state.prevColumnsCount = this._state.columnsCount;		

		/* 2. compute new columns count */

		if (this.options.columnWidth <= 0)
		{
			console.error('Error computing dimensions!', this.options.columnWidth);
			throw new Error('Column width must be a positive number!');
		}

		this._state.columnsCount = Math.floor(this._state.width / this.options.columnWidth);
		if (this._state.columnsCount == 0)
		{
			this._state.columnsCount = 1;
		}

		/* 3. compute new column width */
		
		//this._state.columnWidth = Math.floor(this._state.width / this._state.columnsCount);
		this._state.columnWidth = this._state.width / this._state.columnsCount;
		
		//console.log(this._state.width+'x'+this._state.height+' / '+this._state.columnWidth, this._state.columnsCount, this._state.prevColumnsCount, this.options.columnWidth);
		
		/* 4. update options slider */
		
		if (this._state.columnsCount !== this._state.prevColumnsCount)
		{
			this._updateSliderDetails();
		}
	},
	
	_doLayout : function() {
		//console.log('jKaiten._doLayout', arguments);
		if (this._state.anims.count > 0)
		{
			console.warn('Kaiten layout delayed!');
			this._state.anims.delayedLayout = true; // try again when animations are finished
			return;
		}
		if (this.$slider.is(':hidden'))
		{
			//console.info('Kaiten layout discarded!');
			return;
		}
		
		this._computeDimensions();
		
		this.$slider.css({ 
			height : this._state.height+'px'
		});
		
		// breadcrumb
		if (this._state.width !== this._state.prevWidth)
		{
			this.$breadcrumb.trigger('layout.kbreadcrumb');
		}
		
		// display more/less panels?
		var columnsDiff = this._state.columnsCount - this._state.prevColumnsCount, $anchor;
		if (columnsDiff > 0)
		{
			$anchor = this._getFirstPanel();
			this._expand($anchor, columnsDiff);
		}
		else if (columnsDiff < 0)
		{
			$anchor = this._getLastPanel();
			// do we have to reduce?				
			if ($anchor.kpanel('getEdgePosition') > this._state.columnsCount)
			{
				this._reduce($anchor, $anchor.kpanel('getEdgePosition')-this._state.columnsCount);
			}
		}

		// trigger visible panels layout
		this._getVisiblePanels().trigger('layout.kpanel');
	},
	
	_expand : function($anchor, colsDiff) {
		//console.log('jKaiten._expand', arguments);
		var i;
		
		// can we expand the anchor panel..?
		var remainingCols = this._expandPanel($anchor, colsDiff);
		if (remainingCols <= 0) // done
		{
			return;
		}
		
		// let's try to expand the panels@right...
		var $visibleSiblings = this._getNextPanels(':visible', $anchor);
		for (i=0; i<$visibleSiblings.length; i++)
		{
			remainingCols = this._expandPanel($visibleSiblings.eq(i), remainingCols);
			if (remainingCols <= 0) // done
			{
				return;
			}
		}
			
		// ...or the hidden panels@right come back on stage
		var lastPos = this._getLastPanel().kpanel('getEdgePosition');	
		var $nextHiddenSiblings = this._getNextPanels(':hidden', $anchor);
		
		var $targetPanel, newWidth, optimalWidth;
		for (i=0; i<$nextHiddenSiblings.length; i++)
		{
			$targetPanel = $nextHiddenSiblings.eq(i);
			newWidth = remainingCols;
			optimalWidth = $targetPanel.kpanel('getState').optimalWidth;
			if (newWidth > optimalWidth) 
			{
				newWidth = optimalWidth; // upper limitation
			}
			
			$targetPanel.kpanel('setPosition', lastPos, this._state);
			$targetPanel.kpanel('setWidth', newWidth, this._state);				
							
			remainingCols -= newWidth;
			if (remainingCols <= 0)
			{
				return; 
			}
	
			lastPos += newWidth;
		}
		
		// ...or strategy goes backwards : panels@left come back on stage
		var expandWidth = 0, croppedWidth;
		var $prevHiddenSiblings = this._getPrevPanels(':hidden', $anchor); // jQuery returns them from right to left
		
		for (i=0; i<$prevHiddenSiblings.length; i++)
		{
			$targetPanel = $prevHiddenSiblings.eq(i);
			optimalWidth = $targetPanel.kpanel('getState').optimalWidth;
			
			if ((expandWidth + optimalWidth) < remainingCols)
			{
				// include this panel
				$targetPanel.kpanel('setWidth', optimalWidth, this._state);					
				expandWidth += optimalWidth;
				$targetPanel.kpanel('setPosition', -expandWidth, this._state);
			}
			else					
			{
				// include this panel and crop it
				croppedWidth = remainingCols - expandWidth;
				$targetPanel.kpanel('setWidth', croppedWidth, this._state);
				expandWidth = remainingCols;
				$targetPanel.kpanel('setPosition', -expandWidth, this._state);
				break;
			}
		}
		
		if (expandWidth > 0)
		{
			// move visible panels to the right, add anchor becuz a previous setPosition may have hidden it
			this._getVisiblePanels().add($anchor).each(function(){
				$(this).kpanel('incPosition', expandWidth, this._state);
			});
			
			// move hidden panels to the right
			if (i === $prevHiddenSiblings.length) 
			{
				i--;
			}			
			for (i; i>=0; i--)
			{
				$targetPanel = $prevHiddenSiblings.eq(i);
				$targetPanel.kpanel('incPosition', expandWidth,  this._state);
				$targetPanel.kpanel('show');
			}
		}
	},
	
	_expandPanel: function($panel, colsDiff) {
		//console.log('jKaiten._expandPanel', arguments);
		var ps = $panel.kpanel('getState');
		var originalWidth = ps.width, optimalWidth = ps.optimalWidth;
		if (originalWidth < optimalWidth) // can we expand this panel?
		{				
			var newWidth = originalWidth + colsDiff;
			if (newWidth > optimalWidth) 
			{
				newWidth = optimalWidth; // upper limitation
			}
			$panel.kpanel('setWidth', newWidth, this._state);
			
			var self = this, widthInc = newWidth - originalWidth;
			this._getNextPanels(':visible', $panel).each(function() {
				$(this).kpanel('incPosition', widthInc, self._state);
			});
			
			return (colsDiff - widthInc); // return the remaining number of columns to expand
		}		
		return colsDiff;
	},
	
	_reduce : function($anchor, colsDiff) {
		//console.log('jKaiten._reduce', arguments);
		var i, remainingCols = colsDiff;
		
		// let's try to reduce the panels@left...
		var $visibleSiblings = this._getPrevPanels(':visible', $anchor); // jQuery returns them from right to left
		for (i=0; i<$visibleSiblings.length; i++)
		{
			remainingCols = this._reducePanel($visibleSiblings.eq(i), remainingCols);
			if (remainingCols <= 0) // done
			{
				return;
			}
		}
		
		// ...or hide them
		var totalPos = 0;
		for (i=0; i<$visibleSiblings.length; i++)
		{
			totalPos += $visibleSiblings.eq(i).kpanel('getState').width;
			//console.log(panelWidth, totalPos);
			if (totalPos >= remainingCols)
			{
				break;
			}
		}			
		remainingCols -= totalPos;
		
		// move visible panels to the left, add anchor becuz a previous setPosition may have hidden it
		this._getVisiblePanels().add($anchor).each(function() {
			$(this).kpanel('incPosition', -totalPos, this._state);
		});
		
		if (remainingCols <= 0)
		{
			return;
		}
		
		// ...or finally we can reduce the anchor panel
		remainingCols = this._reducePanel($anchor, remainingCols);
	},
	
	_reducePanel: function($panel, colsDiff) {
		//console.log('jKaiten._reducePanel', arguments);
		var ps = $panel.kpanel('getState');
		var originalWidth = ps.width;
		if (originalWidth > 1) // can we reduce this panel?
		{				
			var newWidth = originalWidth - colsDiff;
			if (newWidth < 1) 
			{
				newWidth = 1; // lower limitation
			}
			$panel.kpanel('setWidth', newWidth, this._state);
			
			var self = this, widthInc = originalWidth - newWidth;
			this._getNextPanels(':visible', $panel).each(function() {
				$(this).kpanel('incPosition', -widthInc, self._state);
			});

			return (colsDiff - widthInc); // return the remaining number of columns to reduce
		}
		return colsDiff;
	},
	
	_createNewPanel : function(connector, data, $src, $reusedPanel) {
		//console.log('jKaiten._createNewPanel', arguments);
		var $newPanel, optimalWidth = data.kWidth || 1;
		var options;
		
		if ($reusedPanel.length > 0)
		{
			$newPanel = $reusedPanel;
			
			options = {
				$src				: $src,
				optimalWidth		: optimalWidth,
				connector			: connector,				
				cssClass			: connector.cssClass||'',
				titleBarOptions		: this.options.defaultPanelTitleBarOptions,
				afterload			: null,
				afterlayout			: null,
				beforedestroy		: null,
				onrefresh			: null
			};
			
			var fs = $newPanel.kpanel('getState', true);
			if ((fs.position < 0) || (fs.position >= this._state.columnsCount))
			{
				options.position = this._state.columnsCount; // previous slideTo calls may have changed its position
				options.width = 1; // must be for the placement strategy				
			}
			
			// update options
			$newPanel.kpanel(options);
			
			var visible = (fs.position >= 0) && (fs.position < this._state.columnsCount);
			this.$breadcrumb.kbreadcrumb('toggleVisibility', fs.index, visible);
		}
		else // create a brand new one
		{
			var newIndex = this._state.panelsCount;
			this._state.panelsCount += 1;
			var newID = this.selectors.panelIDPrefix + this._state.panelsCount;
			var newPosition = this._getLastAvailablePos();
			
			$newPanel = $('<div/>').appendTo(this.$slider);
			
			options = {
				$src			: $src,
				index			: newIndex,
				id				: newID,
				position		: newPosition,
				width			: 1,
				optimalWidth	: optimalWidth,
				connector		: connector,				
				cssClass		: connector.cssClass||'',
				titleBarOptions	: this.options.defaultPanelTitleBarOptions
			};
			
			$newPanel.kpanel(options);
			
			// add to breadcrumb
			this.$breadcrumb.kbreadcrumb('add', options);
		}
		
		this.setPanelFocus($newPanel);
				
		return $newPanel;
	},
	
	_nextPlacement : function($panel, widthDiff, callback){
		//console.log('jKaiten._nextPlacement', arguments);		
		// resize
		$panel.kpanel('animate', null, widthDiff, this._state, callback);	
		// place panels @right
		var self = this;
		this._getNextPanels(':visible', $panel).each(function(){
			self._nextPanelPlacement($(this), widthDiff);
		});
	},
	
	_nextPanelPlacement : function($panel, posInc){
		//console.log('jKaiten._nextPanelPlacement', arguments);
		var futureState = $panel.kpanel('getState', true);		
		var targetPos = futureState.position + posInc, targetRightEdge = targetPos + futureState.width;					
		if (targetRightEdge > this._state.columnsCount)
		{
			// check if panel overlaps on the right edge of the visible area
			if (targetPos < this._state.columnsCount)
			{
				// go to right edge or already @ right edge?
				var resizeInc = ((futureState.position + futureState.width) < this._state.columnsCount) ? -(targetRightEdge - this._state.columnsCount) : -posInc;
				$panel.kpanel('animate', posInc, resizeInc, this._state);
				return; // done
			}
			else if (targetPos >= this._state.columnsCount) // animation cosmetics
			{
				// exit position : go hide just outside of the visible area		
				posInc = this._state.columnsCount - futureState.position; 
			}
		}
		
		// slide
		$panel.kpanel('animate', posInc, null, this._state);
	},
	
	_prevPlacement : function($panel, posInc, callback) {
		//console.log('jKaiten._prevPlacement', arguments);
		// resize
		$panel.kpanel('animate', posInc, null, this._state, callback);			
		// place panels @left
		var self = this;
		this._getPrevPanels(':visible', $panel).each(function(){
			self._prevPanelPlacement($(this), posInc);
		});
	},
	
	_prevPanelPlacement: function($panel, posInc) {	
		//console.log('jKaiten._prevPanelPlacement', arguments);
		// we use future state when dealing with animations
		var futureState = $panel.kpanel('getState', true);			
		var targetPos = futureState.position + posInc;
		if (targetPos < 0)
		{
			var targetRightEdge = targetPos + futureState.width;		
			// check if panel overlaps on the left edge of the visible area
			if (targetRightEdge > 0)
			{
				if (futureState.position > 0) // go to left edge?
				{
					// go to left edge and resize
					$panel.kpanel('animate', -futureState.position, targetPos, this._state); 
				}
				else // already @ left edge (position=0)
				{
					$panel.kpanel('animate', null, posInc, this._state); // stay there and resize
				}					
				return; // done
			}
			else if (targetRightEdge < 0) // animation cosmetics
			{
				// exit position : go hide just outside of the visible area		
				posInc = -(futureState.position + futureState.width); 
			}
		}

		// slide
		$panel.kpanel('animate', posInc, null, this._state);
	},	
	
	// TODO: DOMless?
	_getVisiblePanels : function(index) {
		//console.log('jKaiten._getVisiblePanels', arguments);
		var $collection = this.$slider.children(this.selectors.panel+':visible');
		if (index)
		{
			$collection = $collection.eq(index);
		}
		return $collection;
	},
	
	// TODO: DOMless?
	_getHiddenPanels : function(index) {
		//console.log('jKaiten._getHiddenPanels', arguments);
		var $collection = this.$slider.children(this.selectors.panel+':hidden');
		if (index)
		{
			$collection = $collection.eq(index);
		}
		return $collection;
	},
	
	// TODO: DOMless?
	_getFirstPanel : function() {
		//console.log('jKaiten._getFirstPanel', arguments);
		return this._getVisiblePanels().first();
	},
	
	// TODO: DOMless?
	_getLastPanel : function() {
		//console.log('jKaiten._getLastPanel', arguments);
		return this._getVisiblePanels().last();
	},
	
	// TODO: DOMless?
	_getNextPanels : function(visibilitySelector, baseSelector, andSelf) {
		//console.log('jKaiten._getNextPanels', arguments);
		if (andSelf === true)
		{
			return $(baseSelector).nextAll(this.selectors.panel+visibilitySelector).andSelf();
		}
		return $(baseSelector).nextAll(this.selectors.panel+visibilitySelector);
	},

	// TODO: DOMless?
	_getPrevPanels : function(visibilitySelector, baseSelector) {
		//console.log('jKaiten._getPrevPanels', arguments);
		return $(baseSelector).prevAll(this.selectors.panel+visibilitySelector);
	},	
	
	_getLastAvailablePos : function() {
		//console.log('jKaiten._getLastAvailablePos', arguments);
		var pos = 0; // default
		var $p = this._getLastPanel();
		if ($p.length > 0)
		{
			pos = $p.kpanel('getEdgePosition');
			if (pos > this._state.columnsCount) // just in case
			{
				pos = this._state.columnsCount;
			}
		}
		//console.log('available', pos);
		return pos;
	},
	
	// TODO: DOMless?
	_sortHiddenPanels: function($panels, startPos)
	{
		//console.log('jKaiten._sortHiddenPanels', arguments);
		var optimalWidth;
		
		var currentPos = startPos;
		if (currentPos > 0)
		{
			$panels.each(function(){
				optimalWidth = $(this).kpanel('getState').optimalWidth;
				$(this).kpanel('setPosition', currentPos);
				$(this).kpanel('setWidth', optimalWidth);
				currentPos += optimalWidth;
			});
		}
		else
		{
			$panels.each(function(){
				optimalWidth = $(this).kpanel('getState').optimalWidth;
				currentPos -= optimalWidth;
				$(this).kpanel('setPosition', currentPos);					
				$(this).kpanel('setWidth', optimalWidth);
			});
		}
	},

	_setPanelFocus : function(panelIndex) {
		this._setNavItemFocus(null);
		if (document.activeElement)
		{
			document.activeElement.blur();
		}
		
		var selPrefix = '#'+this.selectors.panelIDPrefix;
		this.element.find(selPrefix+(this._state.focus.panelIndex+1)).removeClass(this.selectors.focusClass);
		this._state.focus.panelIndex = panelIndex;
		this.element.find(selPrefix+(panelIndex+1)).addClass(this.selectors.focusClass).children(this.selectors.panelItems.body).focus();
	},

	_getFocusedPanel : function() {
		var selPrefix = '#'+this.selectors.panelIDPrefix;
		return this.element.find(selPrefix+(this._state.focus.panelIndex+1));
	},

	_setNavItemFocus : function(newIndex, noScroll) {
		//console.log('jKaiten._setNavItemFocus', arguments);
		var $focusedPanel = this._getFocusedPanel();
		var panelState = $focusedPanel.kpanel('getState');
		var $navItems = panelState.$navItems || $focusedPanel.kpanel('buildNavItemsCollection');
		var l = $navItems.length;
		if (l === 0)
		{
			this._state.focus.navItemIndex = null;
			return;
		}
		
		if (this._state.focus.navItemIndex !== null)
		{
			$navItems.eq(this._state.focus.navItemIndex).removeClass(this.selectors.focusClass).removeAttr('tabindex');
		}

		if (newIndex === null)
		{
			this._state.focus.navItemIndex = null; // null case ok
			return;
		}
				
		if (newIndex === 'firstdown')
		{
			newIndex = (panelState.$activeItem.length > 0) ? $navItems.index(panelState.$activeItem) + 1 : 0;
		}
		else if (newIndex ===  'firstup')
		{
			newIndex = (panelState.$activeItem.length > 0) ? $navItems.index(panelState.$activeItem) - 1 : l - 1;
		}
		
		if (newIndex >= l)
		{
			this._state.focus.navItemIndex = 0;
		}
		else if (newIndex < 0)
		{
			this._state.focus.navItemIndex = l - 1;
		}
		else
		{
			this._state.focus.navItemIndex = newIndex;
		}
		
		var $focusedItem = $navItems.eq(this._state.focus.navItemIndex);
		$focusedItem.addClass(this.selectors.focusClass).attr('tabindex', -1).focus();
		
		if (noScroll === true)
		{
			return;
		}

		var $body = $focusedItem.closest(this.selectors.panelItems.body);
		var top = $focusedItem.offset().top - $body.offset().top;
		var height = $focusedItem.height(), bottom = top + height;
		var bodyHeight = $body.height(), bodyScroll = $body.scrollTop();

		if (bottom > bodyHeight)
		{
			$body.scrollTop(bottom + 8 + bodyScroll - bodyHeight);
		}
		else if (top < 0)
		{
			$body.scrollTop(top + bodyScroll - 8);
		}	
	},
	
	_onType : function(keychar) {
		//console.log('jKaiten._onType', arguments);
		var $focusedPanel = this._getFocusedPanel();
		var $navItems = $focusedPanel.kpanel('getState').$navItems || $focusedPanel.kpanel('buildNavItemsCollection');
		if ($navItems.length === 0)
		{
			this._state.focus.typing = '';
			return;
		}
		var self = this;
		
		this._state.focus.typing += keychar.toLowerCase();
		
		clearTimeout(this._state.focus.timeoutID);
		this._state.focus.timeoutID = setTimeout(function() {
			self._state.focus.typing = '';
		}, this._constants.clearTypeDelay);

		//console.log('typing', this._state.focus.typing);
		
		// here we find the link starting with this._state.focus.typing...		
		$navItems.each(function(i){
			if ($(this).text().toLowerCase().indexOf(self._state.focus.typing) === 0)
			{
				self._setNavItemFocus(i);
				return false;
			}
		});
	},
	
	_prepareConnectorRegistration : function(connector, collection) {
		//console.log('jKaiten._prepareConnectorRegistration', arguments);
		// basic checks
		if (!$.isPlainObject(connector))
		{
			throw new Error('Cannot register connector: invalid object!');
		}
		
		if (!connector.name)
		{
			var errMsg = (!collection) ? 
							'Cannot register connector: no name!' : 
							'Cannot register connectors collection "'+collection.collectionName+'": no connector name!';
			throw new Error(errMsg);
		}
		
		if (this._state.connectors[connector.name])
		{
			var errMsg = (!collection) ? 
							'Cannot register connector: "'+connector.name+'" already exists!' : 
							'Cannot register connectors collection "'+collection.collectionName+'": "'+connector.name+'" already exists!';
			throw new Error(errMsg);		
		}
		
		// API check
		if (!connector.loader)
		{
			var errMsg = (!collection) ? 
					'Cannot register connector "'+connector.name+'": no loader function!' : 
					'Cannot register connectors collection "'+collection.collectionName+'": "'+connector.name+'" has no loader function!';
			throw new Error(errMsg);
		}
		
		var funcs = ['init', 'destroy', 'loader', 'connectable', 'getData'],
			i, f;
		
		for (i in funcs)
		{
			f = funcs[i];
			if (connector[f] && !$.isFunction(connector[f]))
			{
				throw new Error('Cannot register connector "'+connector.name+'": "'+f+'" is not a function!');
			}
		}
		
		// load connector's CSS file dynamically
		if (connector.cssFile && !this._state.css[connector.cssFile])
		{
			this._state.css[connector.cssFile] = true;
			$('<link />', {
				"rel" : "stylesheet",
				"type": "text/css",
				"href": connector.cssFile
			}).appendTo($('head'));
		}
		
		// prepare the final version of the connector, by adding some properties
		var extendedData = {
			initialized	: false,
			cssClass	: ''
		};
		
		if (!collection)
		{
			// prepare the CSS classes, using the connector name
			extendedData.cssClass = connector.name.replace(/[^a-zA-Z0-9]/g, '-');
		}
		else
		{	
			// prepare the CSS classes, using the connector and collection names
			var collName = collection.collectionName.replace(/[^a-zA-Z0-9]/g, '-');
			extendedData.cssClass = collName;
			extendedData.cssClass += ' ' + collName+'-'+connector.name.replace(/[^a-zA-Z0-9]/g, '-');
			
			// store these collection data this for later
			extendedData.fullName = collection.collectionName+'.'+connector.name; 
			extendedData.collectionName = collection.collectionName;
			extendedData.collectionInitialized = false;
		}
		
		// return an updated version of the connector
		return $.extend(connector, extendedData);
	},
	/**#@-*/
	
	/* PUBLIC API */

	/**
	 * Retrieves and returns the appropriate connector from the url and the data for its loader, packed in a single data object.
	 *
	 * @param	{String} url, the URL being processed
	 * @param	{jQuery} $link, the link which has been clicked
	 * @param	{jQuery} $target, the target element of the click event
	 * @returns	Object
	 */
	findLoaderData : function(url, $link, $target) {
		//console.log('jKaiten.findLoaderData', arguments);
		var i, j, c, cn,
			connectorFound = null;
		
		// prevent connectables functions to test null objects
		$link = $link || $();
		$target = $target || $();
		
		// loop through all connectors/collection of connectors, trying to resolve which connector should be used for the link
		for (i in this._state.connectors)
		{
			c = this._state.connectors[i];
			//console.log('Checking', c);
			if ($.isFunction(c.connectable) && c.connectable(url, $link, $target) === true)
			{
				// is it a collection of connectors?				
				if (c.connectors)
				{
					//console.log('Checking collection "'+c.collectionName+'"...');
					// loop through all connectors in this collection
					for (j in c.connectors)
					{
						cn = c.connectors[j];
						//console.log('Checking', cn);
						if ($.isFunction(cn.connectable) && cn.connectable(url, $link, $target) === true)
						{
							connectorFound = cn;
							break; // exit collection loop
						}
					}
					if (connectorFound)
					{
						break; // exit main loop
					}
				}
				else // it is a single connector
				{
					connectorFound = c;
					break; // exit main loop
				}
			}
		}
		
		if (connectorFound)
		{
			// set load data
			var loadData = { kConnector : connectorFound };
			if ($.isFunction(connectorFound.getData))
			{
				// extract data from the link
				var linkData = connectorFound.getData(url, $link, $target);
				$.extend(loadData, linkData);
			}
		}
		else
		{
			loadData = { kConnector : 'iframe', url : url };
		}
		
		//console.log('Resolved on connector=', loadData.kConnector, 'data=', loadData);		
		return loadData;
	},
	
	/**
	 * Registers a connector.
	 *
	 * @param	{Object} c, the connector to register. If the argument passed is a collection of connectors, the collection will be registered
	 */
	registerConnector : function(c) {
		//console.log('jKaiten.registerConnector', arguments);
		// check if it's a collection
		if (c.connectors)
		{
			this.registerConnectorsCollection(c);
			return;
		}		
		// single connector: prepare & store
		this._state.connectors[c.name] = this._prepareConnectorRegistration(c);
		//console.log(this._state.connectors);
	},
	
	/**
	 * Registers a collection of connectors.
	 *
	 * @param	{Object} collection, the collection of connectors to register
	 */
	registerConnectorsCollection : function(collection) {
		//console.log('jKaiten.registerConnectorsCollection', arguments);
		// basic checks
		if (!$.isPlainObject(collection))
		{
			throw new Error('Cannot register connectors collection: invalid object!');
		}
		if (!$.isArray(collection.connectors))
		{
			throw new Error('Cannot register connectors collection: connectors is not an array!');
		}
		if (!collection.collectionName)
		{
			throw new Error('Cannot register connectors collection: no collection name!');			
		}
		if (this._state.connectors[collection.collectionName])
		{
			throw new Error('Cannot register connectors collection: "'+collection.collectionName+'": already exists!');			
		}
		
		// API check
		var funcs = ['init', 'destroy', 'connectable'],
			i, f;
		
		for (i in funcs)
		{
			f = funcs[i];
			if (collection[f] && !$.isFunction(collection[f]))
			{
				throw new Error('Cannot register connectors collection "'+collection.collectionName+'": "'+f+'" is not a function!');
			}
		}
		
		// prepare each connector
		for (i in collection.connectors)
		{
			// update the connector in the collection
			collection.connectors[i] = this._prepareConnectorRegistration(collection.connectors[i], collection);
		}
		
		// load the collection's CSS file dynamically
		if (collection.cssFile && !this._state.css[collection.cssFile])
		{
			this._state.css[collection.cssFile] = true;
			$('<link />', {
				"rel" : "stylesheet",
				"type": "text/css",
				"href": collection.cssFile
			}).appendTo($('head'));
		}
		
		// store the collection
		this._state.connectors[collection.collectionName] = $.extend(collection, { initialized : false });
		//console.log(this._state.connectors);
	},
	
	/**
	 * Removes a connector from Kaiten.
	 *
	 * @param	{String} name, the full name of the connector to remove. If the argument passed is a collection of connectors, it will be removed
	 */
	unRegisterConnector : function(name) {
		//console.log('jKaiten.unRegisterConnector', arguments);
		var c = this._state.connectors[name];		
		// check if it's a collection
		if (c && c.connectors)
		{
			this.unRegisterConnectorsCollection(name);
			return;
		}
		
		// single connector
		if (!c) // not found...
		{
			// ...is it a in collection?
			var dotPosition = name.indexOf('.');			
			if (dotPosition > -1) 
			{
				var collectionName = name.substring(0, dotPosition),
					collection = this.getConnectorsCollection(collectionName),
					connectorName = name.substring(dotPosition+1),
					i;
				
				for (i in collection.connectors)
				{
					c = collection.connectors[i];
					if (c.name === connectorName)
					{
						delete collection.connectors[i];
						return;
					}
				}
			}
			
			throw new Error('Cannot remove connector "'+name+'": not found!');
		}
		
		if ($.isFunction(c.destroy))
		{
			c.destroy(this.element);
		}		
		delete this._state.connectors[name];
	},
	
	/**
	 * Removes a collection of connectors from Kaiten.
	 *
	 * @param	{String} name, the name of the collection to remove
	 */
	unRegisterConnectorsCollection : function(name) {
		//console.log('jKaiten.unRegisterConnectorsCollection', arguments);
		// basic check
		if (!this._state.connectors[name])
		{
			console.info('Cannot remove connectors collection "'+name+'": not found!');
			return;
		}
		
		// remove all connectors
		var connectors = this._state.connectors[name].connectors, i;		
		for (i in connectors)
		{
			if ($.isFunction(connectors[i].destroy))
			{
				connectors[i].destroy(this.element);
			}
		}
		
		// remove the collection
		if (this._state.connectors[name].destroy)
		{
			this._state.connectors[name].destroy(this.element);
		}
		delete this._state.connectors[name];
	},
	
	/**
	 * Returns a connector that has been previously registered.
	 *
	 * @param	{String} name, the name of the connector to retrieve. If the argument passed is a collection of connectors, Kaiten will try to retrieve and return the collection
	 * @returns	{Object} 
	 */
	getConnector : function(name) {
		//console.log('jKaiten.getConnector', arguments);
		//console.log(this._state.connectors);
		if (!name)
		{
			throw new Error('Cannot retrieve connector: name is undefned!');
		}
		
		if (!this._state.connectors[name]) // not found...
		{
			// ...is it in a collection?
			var dotPosition = name.indexOf('.');			
			if (dotPosition > -1) 
			{
				var collectionName = name.substring(0, dotPosition),
					collection = this.getConnectorsCollection(collectionName),
					connectorName = name.substring(dotPosition+1),
					i;
				
				for (i in collection.connectors)
				{
					if (collection.connectors[i].name === connectorName)
					{
						return collection.connectors[i];
					}
				}
			}
			
			throw new Error('Connector "'+name+'" not found!');
		}
		
		return this._state.connectors[name];
	},
	
	/**
	 * Returns a collection of connectors that has been previously registered.
	 *
	 * @param	{String} name, the name of the collection to retrieve
	 * @returns	{Object} 
	 */
	getConnectorsCollection : function(name) {
		//console.log('jKaiten.getConnectorsCollection', arguments);
		//console.log(this._state.connectors);
		if (!this._state.connectors[name])
		{
			throw new Error('Connectors collection "'+name+'" not found!');
		}
		return this._state.connectors[name];
	},

	/**
	 * Creates a new panel and loads its content
	 *
	 * @signature
	 * @param	{Object} data, an object containing at least the "kConnector" or the "kLoader" property. The rest of the data properties will be passed as an argument to the loading function
	 * @param	{String} data.kConnector, the name of the connector to use to perform the loading
	 * @param 	{Object} data.kConnector, the connector to use to perform the loading
	 * @param	{Function} data.kLoader, a function that will reurn the panel content, as HTML or as a jQuery element
	 * @param	{jQuery} [$src], the element at the origin of the load (e.g.: the link that has been clicked)
	 *
	 * @signature
	 * @param	{Function} function, the function that will return the panel content, as HTML or as a jQuery element.
	 * @param	{Object}   [data], the data to pass as an argument to the loading function
	 * @param	{jQuery}   [$src], the element at the origin of the load (e.g.: the link that has been clicked)
	 *
	 * @signature
	 * @param	{String} HTML, the panel content
	 * @param	{jQuery} [$src], the element at the origin of the load (e.g.: the link that has been clicked)
	 *
	 * @signature
	 * @param	{jQuery} jQuery element, the panel content
	 * @param	{jQuery} [$src], the element at the origin of the load (e.g.: the link that has been clicked)
	 */
	load : function() {
		//console.log('jKaiten.load', arguments);
		/* 0. a little preparation: determine or create the connector to use */
		var connector, data, $src, 
			args = arguments;
		
		if ($.isPlainObject(args[0]))
		{
			data = args[0];
			if (data.kConnector)
			{
				if ($.type(data.kConnector) === 'string')
				{
					connector = this.getConnector(data.kConnector);
				}
				else if ($.isPlainObject(data.kConnector))
				{
					connector = data.kConnector;
					// data cannot hold any reference to the connector object, because data could be serialized by the loader using jQuery
					// in this case, jQuery will make operations that will lead to the execution of the connectors methods in the wrong context and passing the wrong arguments
					data.kConnector = connector.fullName;
				}

				// if the connector is part of a collection, initialize the collection only once
				if (connector.collectionName && !connector.collectionInitialized)
				{
					var collection = this.getConnectorsCollection(connector.collectionName);
					if ($.isFunction(collection.init))
					{
						collection.init(this.element);
						collection.initialized = true;
						// optim purpose only
						for (var i in collection.connectors)
						{
							collection.connectors[i].collectionInitialized = true;
						}
					}
				}
				// initialize the connector only once
				if ((connector.initialized === false) && $.isFunction(connector.init))
				{
					connector.init(this.element);
					connector.initialized = true;
				}
			}
			else if ($.isFunction(data.kLoader))
			{
				// we create a connector on-the-fly
				connector = {
					loader		: data.kLoader,
					name		: 'On-the-fly (function)'
				};
				delete data.kLoader;
			}
			$src = args[1] || $();
		}
		else if ($.isFunction(args[0]))
		{
			// we create a connector on-the-fly
			connector = {
				loader		: args[0],
				name		: 'On-the-fly (function)'
			};
			data = args[1] || {};
			$src = args[2] || $();
		}
		else if (($.type(args[0]) === 'string') || (args[0] instanceof jQuery))
		{
			// we create a connector on-the-fly
			connector = {
				/**@ignore*/
				loader		: function(){ return args[0]; },
				name		: 'On-the-fly (content)'
			};
			data = {};
			$src = args[1] || $();
		}
		
		if (!connector)
		{
			throw new Error('Cannot load. No connector!');
		}
		/*console.log('connector=', connector);
		console.log('data=', data);
		console.log('$src=', $src);*/
    	
    	// add this Kaiten's data
		data.kTabID = this._state.tabID;
		
		/* 1. panel creation */
		
		// retrieve child panel in order to reuse it, if any (TODO: DOMless?)
		var $childPanel = ($src.length > 0) ? $src.closest(this.selectors.panel).next(this.selectors.panel) : $();		
		if ($childPanel.length > 0)
		{
			// we save some information for the destroy callbacks
			// this will be useful if the load/children destruction process is aborted and needs to be restarted later (e.g. after a user confirmation)
			this.pushPanelDestroyAction({ type : 'kaiten.load', params : { args : args } });
						
			// then we remove its children panels
			if (!this.removeChildren($childPanel))
			{
				return false;
			}
			
			this.popPanelDestroyAction(); // pop the action that has been correctly performed
		}
		
		var $newPanel = this._createNewPanel(connector, data, $src, $childPanel);
		
		/* 2. placement strategy, if necessary */
		
		var dfdAnim = null;
		
		// NB: use panel's future state when dealing with animations
		if ($newPanel.kpanel('getState', true).position >= this._state.columnsCount)
		{	
			if (($childPanel.length === 0) || !$childPanel.kpanel('isAnimated'))
			{
				$newPanel.show();
				
				// create a deferred animation to sync with content loading			
				dfdAnim = $.Deferred();
				$newPanel.kpanel('animate', -1, null, this._state, function(){
					dfdAnim.resolve();
				});
				
				var $prevPanels = this._getPrevPanels(':visible', $newPanel);
				var $leftMostPanel = $prevPanels.last();
				if ($leftMostPanel.kpanel('getState', true).width > 1) // check if leftmost panel can be resized
				{
					var i;
					$leftMostPanel.kpanel('animate', null, -1, this._state);
					for (i=0, l=$prevPanels.length; i<l-1; i++)
					{
						$prevPanels.eq(i).kpanel('animate', -1, null, this._state);		
					}
				}
				else // eject leftMost panel
				{
					$prevPanels.kpanel('animate', -1, null, this._state);
				}
			}
		}

		/* 3. ask panel to load its content */
		
		try
		{
			$newPanel.kpanel('load', data, $src, dfdAnim);
			return $newPanel;
		}
		catch (e)
		{
			throw e;
		}
		
		return $newPanel;
	},
	
	/**
	 * Reloads a panel content
	 * 
	 * @param		{jQuery} $panel
	 * @param		{Object} [data], some custom data that will be merged to the data used for the previous loading
	 */
	reload : function($panel, data) {
		//console.log('jKaiten.reload', arguments);
		$panel.kpanel('reload', data);
	},
	
	/**
	 * Removes a panel and all its children (the panel located at its right)
	 * 
	 * @param		{jQuery} $panel
	 */
	remove : function($panel) {
		//console.log('jKaiten.remove', arguments);
		var $prevPanel = $panel.prev(this.selectors.panel),
			result = $panel.kpanel('destroy'); // this will also destroy all children panels
		if (result === true)
		{			
     		this.setPanelFocus($prevPanel);
		}		
		return result;
	},
	
	 // TODO: DOMless?
	/**
	 * Removes all panels after (at the right of) the given panel
	 *
	 * @param		{jQuery} $panel
	 */
	 // TODO: DOMless?
	removeChildren : function($panel) {
		//console.log('jKaiten.removeChildren', arguments);
		return this.remove($panel.next(this.selectors.panel));
	},
	
	/**
	 * Opens a new tab using the current document location and the serialized data as the URL query string
	 * 
	 * @param		{Object} data, the data that will be serialized and used as the URL query string
	 */
	newTab : function(data) {
		//console.log('jKaiten.newTab', arguments);
		var newTabData = $.extend({}, data);
		if (newTabData.kTabID)
		{
			delete newTabData.kTabID;
		}
		
		// prevent bug
		var i;
		for (i in newTabData)
		{
			if ($.isFunction(newTabData[i]))
			{
				delete newTabData[i];
				continue;
			}
			if (newTabData[i] instanceof jQuery)
			{
				console.warn('Parameter "'+i+'" is an instance of jQuery. You may encounter navigation issues.');
				newTabData[i] = $('<div />').append(newTabData[i].clone()).html(); // "outerHTML"
				continue;
			}
		}
		
		var newURL = document.location.protocol + '//' +  document.location.host + document.location.pathname;
		var params = $.param(newTabData);
		newURL += '?' + params;
		
		// open a new window with a sanitized name
		window.open(newURL, params.replace(/([^\w])/g, ''));
	},
	
	/**
	 * Skip to the next panel (the hidden panel at right, outside of the visible area)
	 */
	next : function() {
		//console.log('jKaiten.next', arguments);
		// discard if animation is in progress
		if (this._state.anims.count > 0)
		{
			return;
		}
		
		var $p = this._getLastPanel().next(this.selectors.panel); // TODO: DOMless?
		if ($p.length > 0)
		{	
			this.setPanelFocus($p);
			
			// place just outside and expand to optimal width
			$p.kpanel('setPosition', this._state.columnsCount);
			var newWidth = $p.kpanel('setWidthToOptimal', this._state);
			$p.kpanel('toggle', true);
			
			// slide and place panels @left
			var self = this;
			
			$p.kpanel('animate', -newWidth, null, this._state, function(){
				this.children(self.selectors.panelItems.body).focus(); // autofocus
			});			
			
			this._getPrevPanels(':visible', $p).each(function(){
				self._prevPanelPlacement($(this), -newWidth);
			});
		}
	},
	
	/**
	 * Skip to the previous panel (the hidden panel at left, outside of the visible area)
	 */
	prev : function() {
		//console.log('jKaiten.prev', arguments);
		// discard if animation is in progress
		if (this._state.anims.count > 0)
		{
			return;
		}
		
		var $p = this._getFirstPanel().prev(this.selectors.panel); // TODO: DOMless?
		if ($p.length > 0)
		{
			this.setPanelFocus($p);
			
			// expand to optimal width
			var newWidth = $p.kpanel('setWidthToOptimal', this._state);
			$p.kpanel('setPosition', -newWidth);
			$p.kpanel('toggle', true);
			
			// slide and place panels @right
			var self = this;
			
			$p.kpanel('animate', newWidth, null, this._state, function(){
				this.children(self.selectors.panelItems.body).focus(); // autofocus
			});
						
			this._getNextPanels(':visible', $p).each(function(){
				self._nextPanelPlacement($(this), newWidth);
			});
		}
	},
	
	/**
	 * Maximizes a panel width
	 * 
	 * @param		{jQuery} $panel
	 */
	maximize : function($panel) {
		//console.log('jKaiten.maximize', arguments);
		// discard if animation is in progress
		if (this._state.anims.count > 0)
		{
			return;
		}
		
		var self = this, $this, ps;
		
		this._getPrevPanels(':visible', $panel).each(function(){
			$this = $(this);
			$this.kpanel('animate', -$this.kpanel('getEdgePosition', true), null, self._state);
		});
		
		this._getNextPanels(':visible', $panel).each(function(){
			$this = $(this);
			ps = $this.kpanel('getState', true);
			$this.kpanel('animate', self._state.columnsCount-ps.position, null, self._state);
		});
		
		ps = $panel.kpanel('getState', true);
		$panel.kpanel('animate', -ps.position, this._state.columnsCount-ps.width, this._state);
	},
	
	/**
	 * Restores a panel to its original width
	 *
	 * @param		{jQuery} $panel
	 */
	originalSize : function($panel) {
		//console.log('jKaiten.originalSize', arguments);
		if (this._state.anims.count > 0)
		{
			return;
		}
		this.slideTo($panel);
	},
	
	/**
	 * Slides to a panel
	 *
	 * @param		{jQuery} $targetPanel
	 */
	slideTo : function($targetPanel) {
		//console.log('jKaiten.slideTo', arguments);
		// discard if animation is in progress
		if (!$targetPanel.length || (this._state.anims.count > 0))
		{
			//console.info('slideTo discarded!', $targetPanel);
			return;
		}
		
		this.setPanelFocus($targetPanel);
		
		var $visiblePanels = this._getVisiblePanels(); // TODO: DOMless?
		var $firstPanel = $visiblePanels.first();

		/* 1st : update hidden positions and widths : panels outside of the visible area */
		
		// check if there are visible panels on the screen, indeed, maybe we're here becuz of the kpanel.afterdestroy event handler
		var $leftSet = $firstPanel.length ? 
						this._getPrevPanels(':hidden', $firstPanel) : 
						this._getHiddenPanels().reverse();
						
		this._sortHiddenPanels($leftSet, 0);
		this._sortHiddenPanels(this._getNextPanels(':hidden', $firstPanel), this._state.columnsCount);		
		
		/* 2nd : fit a max. number of panels in the visible area, the target being leftmost */
		
		var $currentPanel = $targetPanel;
		var totalWidth = this._state.columnsCount, optimalWidth;
		var animsParams = [];
		var panelsIDs = [];
		
		// from the anchor, to the right...
		
		do
		{
			panelsIDs.push($currentPanel.attr('id')); // for later...
			optimalWidth = $currentPanel.kpanel('getState').optimalWidth;
			animsParams.push({
				$panel : $currentPanel,
				futureWidth : optimalWidth
			});
			totalWidth -= optimalWidth;
			$currentPanel = $currentPanel.next(this.selectors.panel); // TODO: DOMless?
		}
		while ((totalWidth > 0) && ($currentPanel.length > 0));
		
		// crop last panel?
		if (totalWidth < 0)
		{
			animsParams[animsParams.length-1].futureWidth += totalWidth;			
		}
		else if (totalWidth > 0) 
		{
			// from the anchor, to the left...
			$currentPanel = $targetPanel.prev(this.selectors.panel); // TODO: DOMless?
			while ((totalWidth > 0) && ($currentPanel.length > 0))
			{
				panelsIDs.push($currentPanel.attr('id')); // for later...
				optimalWidth = $currentPanel.kpanel('getState').optimalWidth;
				animsParams.unshift({
					$panel : $currentPanel,
					futureWidth : optimalWidth
				});
				totalWidth -= optimalWidth;
				$currentPanel = $currentPanel.prev(this.selectors.panel); // TODO: DOMless?
			}
			// crop first panel?
			if (totalWidth < 0)
			{
				animsParams[0].futureWidth += totalWidth;
			}
		}
			
		//console.log(animsParams);
		
		/* 3rd : animate */
		
		// a) visible panels not concerned by the previous computation : eject them
		var $visibleSubset = [];
		$visiblePanels.each(function(){
			if ($.inArray($(this).attr('id'), panelsIDs) === -1)
			{
				$visibleSubset.push($(this));
			}
		});
		//console.log($visibleSubset);
				
		var i, l = $visibleSubset.length;
		if (l > 0)
		{
			var ejectPosInc;
			if ($visibleSubset[0].nextAll('#'+$targetPanel.attr('id')).length > 0) // target @right? (TODO: DOMless?)
			{
				ejectPosInc = -$visibleSubset[l-1].kpanel('getEdgePosition', true);
				for (i=0; i<l; i++)
				{
					$currentPanel = $visibleSubset[i];
					$currentPanel.kpanel('animate', ejectPosInc, null, this._state);
				}
			}
			else // target @left? 
			{
				ejectPosInc = this._state.columnsCount - $visibleSubset[0].kpanel('getState', true).position;
				for (i=0; i<l; i++)
				{
					$currentPanel = $visibleSubset[i];
					$currentPanel.kpanel('animate', ejectPosInc, null, this._state);
				}
			}
		}
		
		// b) panels concerned
		var futurePos = 0;
		for (i=0, l=animsParams.length; i<l; i++)
		{				
			var ap = animsParams[i];
			var fs = ap.$panel.kpanel('getState', true);
			//console.log(ap.$panel);
			//console.log('p='+fs.position, futurePos, 'w='+fs.width, ap.futureWidth);
			ap.$panel.show().kpanel('animate', futurePos-fs.position, ap.futureWidth-fs.width, this._state);
			futurePos += ap.futureWidth;
		}
	},
	
	/**
	 * Sets focus to a panel
	 *
	 * @param		{jQuery} $panel
	 */
	setPanelFocus : function($panel){
		//console.log('jKaiten.setPanelFocus', arguments);
		if ($panel.length)
		{
			this._setPanelFocus($panel.kpanel('getState').index);
		}
	},
	
	/**
	 * @ignore
	 */
	prepareKeyboardNavigation : function(){
		//console.log('jKaiten.prepareKeyboardNavigation', arguments);
		this._setNavItemFocus('firstdown', true); // no scroll
	},
	
	/**
	 * @ignore
	 */
	toggleTopbar : function(enableOrDisable){
		//console.log('jKaiten.toggleTopbar', arguments);
		this.element.find(this.selectors.topbarMask).toggle(!enableOrDisable);
	},
	
	/**
	 * Sets the maximum number of columns
	 * 
	 * @param		{jQuery} count
	 */
	setColumnsCount : function(count) {
		//console.log('jKaiten.setColumnsCount', arguments);
		if (this._state.anims.count > 0)
		{
			return;
		}
		// update the column width option and let _computeDimensions calculate the new columns count
		if (!count || (count <= 0))
		{
			console.error('Error setting columns count!', count);
			throw new Error('New columns count must be a positive number!');
		}
	
		// optimal ratio to avoid direct snap to higher or lower columns
		// 1 cols -> 66% , 2 cols -> 75% , 3 cols -> 80% , etc.
		var ratio = (1 - ( 1 / (2+count)));
		
		// compute optimal width for panels
		//this.options.columnWidth = Math.floor( (this.$kWindow.width()/count) * ratio );
		this.options.columnWidth = (this.$kWindow.width() / count) * ratio;

		this._doLayout();
	},
	
	/**
	 * Sets the width of each column, in pixels. The width will be automatically adjusted to provide an integer number of columns
	 * 
	 * @param		{jQuery} width, the new width in pixels
	 */
	setColumnWidth : function(width) {
		//console.log('jKaiten.setColumnWidth', arguments);
		if (this._state.anims.count > 0)
		{
			return;
		}
		// update the column width option and let _computeDimensions calculate the new columns count
		if (!width || (width <= 0))
		{
			console.error('Error setting column width!', width);
			throw new Error('New column width must be a positive number!');
		}
		this.options.columnWidth = width;
		this._doLayout();
	},
	
	/**
	 * Returns Kaiten state
	 *
	 * @returns		{Object}
	 */
	getState : function() {
		//console.log('jKaiten.getState', arguments);
		return this._state;
	},
	
	/**
	 * Returns the panel element at the given index
	 *
	 * @param		{Number} index
	 * @returns		{jQuery}, the panel, as a jQuery element
	 */
	getPanel : function(index){
		//console.log('jKaiten.getPanel', arguments);
		return this.$slider.children(this.selectors.panel).eq(index);
	},
	
	/**
	 * @ignore
	 */
	pushPanelDestroyAction : function(actionObject){
		//console.log('jKaiten.pushPanelDestroyAction', arguments, this._state.panelDestroyActions);
		this._state.panelDestroyActions.push(actionObject);
	},
	
	/**
	 * @ignore
	 */
	popPanelDestroyAction : function(){
		//console.log('jKaiten.popPanelDestroyAction', this._state.panelDestroyActions);
		return this._state.panelDestroyActions.pop();
	},

	/**
	 * Discards the action at the origin of the destruction of a panel or a group of panels
	 */	
	discardPanelDestroyAction : function(){
		//console.log('jKaiten.discardPanelDestroyAction', arguments, this._state.panelDestroyActions);
		// clear the actions array
		this._state.panelDestroyActions.length = 0;
	},
	
	/**
	 * Executes the action at the origin of the destruction of a panel or a group of panels
	 */
	execPanelDestroyAction : function(){
		//console.log('jKaiten.execPanelDestroyAction', arguments, this._state.panelDestroyActions);
		if (!this._state.panelDestroyActions.length)
		{
			console.warn('No panel destroy action saved!');
			return;
		}
		
		// retrieve the action at the origin of the destruction process
		var actionObject = this._state.panelDestroyActions[0],
			params = actionObject.params;
		
		// clear the actions array
		this._state.panelDestroyActions.length = 0;
		
		// force the action to be executed without any handler/callback calls
		this._state.execPanelDestroyCallbacks = false;
		
		switch (actionObject.type)
		{
			case 'kpanel.destroy':
				var $panel = params.$srcPanel,
					$prevPanel = $panel.prev(this.selectors.panel);
				$panel.kpanel('destroy');
	     		this.setPanelFocus($prevPanel);
				break;
				
			case 'kpanel.load':
				params.$srcPanel.kpanel('load', params.data, params.$src);
				break;
				
			case 'kpanel.reload':
				params.$srcPanel.kpanel('reload', params.data);
				break;
				
			case 'kaiten.load':
				this.load.apply(this, params.args);
				break;
				
			default:
				break;
		}
		
		// re-enable the execution of the handlers/callbacks
		this._state.execPanelDestroyCallbacks = true;
	}
};

(function($, window) {
	if (!window.console)
	{
		window.console = 
		{
			log				: function() {},
			debug			: function() {},
			info			: function() {},
			warn			: function() {},
			exception		: function() {},
			assert			: function() {},
			dir				: function() {},
			dirxml			: function() {},
			trace			: function() {},
			group			: function() {},
			groupEnd		: function() {},
			groupCollapsed	: function() {},
			time			: function() {},
			timeEnd			: function() {},
			profile			: function() {},
			profileEnd		: function() {},
			count			: function() {},
			clear			: function() {},
			table			: function() {},
			error			: function() {},
			notifyFirebug	: function() {}
		};
	}
	
	/**
	 * Get the panel containing the element that matches the selector
	 * @name jQuery.fn.getPanel
	 */
    $.fn.getPanel = function (){
        var $p;
        if (!this.length)
        {
            console.warn('Panel Not Found: jQuery object is empty!');
            return;
        }
        if (this.hasClass(jKaiten.selectors.panel))
        {
            return this;
        }
        $p = this.closest(jKaiten.selectors.panelClass);
        if (!$p.length)
        {
        	console.log(this);
            $.error('Panel Not Found!');
        }
        return $p;
    };
    
	/**
	 * Reverses a collection of jQuery elements
	 * @name jQuery.fn.reverse
	 */
	$.fn.reverse = function() {
    	return this.pushStack(this.get().reverse(), arguments);
    };

	if (!window.kConnectors)
	{
		window.kConnectors = {};
	}
	
	$.widget("ui.kaiten", jKaiten);
}(jQuery, window));

/**
 * Kaiten panel
 *
 * @version 2011-10-07
 *
 */
/**@ignore*/
(function($) {
	/**
	 * Kaiten Panel Widget
	 *
	 * Each Panel in a Kaiten application is a widget instance that you can configure at will.
	 *
	 * @widget
	 * @class
	 * @name 		kpanel
	 * @memberOf 	jQuery.ui	 
	 */
	$.widget("ui.kpanel", /**@lends jQuery.ui.kpanel.prototype*/{
		/* DEFAULT PROPERTIES/METHODS */
		
		/**
		 * Default panel options, a mix of defaults with settings provided by the user
		 */
		options : {
			
			/**#@+
			 * @widgetoption
			 * @memberOf jQuery.ui.kpanel
			 */			
			/**
			 * The jQuery element that has been clicked, causing this panel to be created.
			 * @type		jQuery
			 * @default		an empty jQuery object
			 */
			$src			: $(),
			
			/**
			 * The panel index, for internal purpose only.
			 * @type		Number
			 * @default		-1
			 */
			index			: -1,
			
			/**
			 * The panel id.
			 * @type		String
			 * @default		''
			 */
			id				: '',
			
			/**
			 * The panel position, a column number.
			 * @type		Number
			 * @default		-1
			 */
			position		: -1,
			
			/**
			 * The panel width, in number of columns.
			 * @type		Number
			 * @default		1
			 */
			width			: 1,
			
			/**
			 * The optimal panel width, in number of columns.
			 * @type		Number
			 * @default		1
			 */
			optimalWidth	: 1,
			
			/**
			 * The panel connector.
			 * @type		Object
			 * @default		null
			 */
			connector		: null,
			
			/**
			 * The panel title.
			 * @type		String
			 * @default		'New panel'
			 */
			title			: 'New panel',
			
			/**
			 * An additional CSS class.
			 * @type		String
			 * @default		''
			 */
			cssClass		: '',
			
			/**
			 * Fires after the panel has loaded but before the layout of the panel is done.
			 * @event 
			 * @name		event:kpanelafterload
			 */
			/**
			 * A callback function that will be executed after the panel has loaded but before the layout of the panel is done.
			 * @type		Function
			 * @default		null
			 * @see			jQuery.ui.kpanel.event:kpanelafterload
			 */
			afterload		: null,
			
			/**
			 * Fires when the layout of the panel is done.
			 * @event
			 * @name		event:kpanelafterlayout
			 */
			/**
			 * A callback function that will be executed after the layout of the panel is done.
			 * @type		Function
			 * @default		null
			 * @see			jQuery.ui.kpanel.event:kpanelafterlayout
			 */
			afterlayout		: null,
			
			/**
			 * Fires before the panel is destroyed.
			 * @event
			 * @name		event:kpanelbeforedestroy
			 */
			/**
			 * A callback function that will be executed before the panel destruction.
			 * @type		Function
			 * @default		null
			 * @see			jQuery.ui.kpanel.event:kpanelbeforedestroy
			 */
			beforedestroy	: null,
			
			/**
			 * Fires when the panel content has to be refreshed.
			 * @event
			 * @name		event:kpanelonrefresh
			 */
			/**
			 * A callback function that will be executed when the panel content has to be refreshed.
			 * @type		Function
			 * @default		null
			 * @see			jQuery.ui.kpanel.event:kpanelonrefresh
			 */
			onrefresh		: null,
			
			/**
			 * The HTML that will be inserted in the panel title bar options.
			 * These options can be toggled when double-clicking on the title bar and usually holds a navigation block with navigable items.
			 * @type		String
			 * @default		'<div class="block-nav"><div class="items clickable remove-panel"><div class="label">Remove this panel</div></div></div>'
			 */
			titleBarOptions		: '<div class="block-nav"><div class="items clickable remove-panel"><div class="label">Remove this panel</div></div></div>'
			/**#@-*/
		},
		
		/**
		 * Default widget creation method
		 * @ignore
		 * @private
		 */
		_create : function() {
			//console.log('kPanel._create', arguments, this.options);
			
			/* 1. define useful variables */
			
			this.$K = $(jKaiten.selectors.window).parent();
			var ks = this.$K.kaiten('getState');
			this.$breadcrumb = this.$K.find(jKaiten.selectors.breadcrumb);
			
			this._state = {
				index				: this.options.index,
				position			: this.options.position,
				width				: (this.options.width > ks.columnsCount) ? ks.columnsCount : this.options.width,
				isVisible			: (this.options.position >= 0) && (this.options.position < ks.columnsCount),
				load 				: {	},
				$activeItem			: $(),
				$navItems			: null
			};
			
			this.setOptimalWidth(this.options.optimalWidth, ks); // crop if needed
			
			// keep track of the future state for calculations during animation
			this._futureState = {				
				position	: this._state.position,
				width		: this._state.width,
				index		: this._state.index // set here just to limit function calls
			};
						
			/* 2. HTML markup and DOM insertion */
			
			// class, id, position attributes
			this.element.addClass(jKaiten.selectors.panelClass).attr({
				'id' 	: this.options.id
			});
			
			// mask and loader animation
			$('<div />', {
				"class" : jKaiten.selectors.maskClass
			}).append($('<div />', { 
				"class" : jKaiten.selectors.loaderClass
			})).appendTo(this.element).show();
			
			// title bar
			this._createTitleBar();
			this._createTitleBarOptions();
			
			// header
			$('<div />', { 
				"class" : jKaiten.selectors.panelItems.headerClass 
			}).appendTo(this.element);
						
			// body
			this.$body = $('<div />', { 
				"class" : jKaiten.selectors.panelItems.bodyClass 
			}).appendTo(this.element);

			/* 3. bind events */
			
			this._bindEvents();
			
			/* 4. Initial layout */
			
			this.element.trigger('layout.kpanel');
			
			//this._log();
		},
		
		/**
		 * Default widget "set option" method
		 * @ignore
		 * @private
		 */
		_setOption : function(key, value) {
			//console.log('kPanel._setOption', arguments);
			switch (key)
			{
				case 'position':
					this.setPosition(value);
					break;
				
				case 'width':
					this.setWidth(value);
					break;
					
				case 'optimalWidth':
					this.setOptimalWidth(value);
					break;
					
				case 'cssClass':
					// do nothing, wait for _insertHTML so that existing content remains correctly displayed
					//this._setCSSClass(value);
					break;
				
				case 'title':
					this.setTitle(value);
					break;
					
				case 'titleBarOptions':
					this.element.find(jKaiten.selectors.panelItems.options).remove();
					this._createTitleBarOptions(value);
					break;
				
				default:
					break;
			}
			
			$.Widget.prototype._setOption.apply(this, arguments);
			
			//console.log(this.options);
		},
		
		/**
		 * Default widget destruction method, removes the instance from the encapsulated DOM element, which was stored on instance creation
		 * @ignore
		 * @private
		 */
		destroy : function($srcPanel) {
			//console.log('kPanel.destroy', this.element, arguments);			
			var destructionCompleted = true, 
				self = this;
			
			$srcPanel = $srcPanel || this.element;
			var isLast = this.element.attr('id') === $srcPanel.attr('id');
			
			// destroy all children, from the last panel to the current one, allowing the process to be interrupted if a child cannot be destroyed
			this.element.nextAll().reverse().each(function(){				
				// pass the source panel (the panel that has initiated the chain of destructions), which could be useful if we want to write a callback
				// that let the user decide if the chain of destructions can happen or not
				if (!$(this).kpanel('destroy', self.element))
				{
					destructionCompleted = false;
					return false; // exit each()
				}
			});
			
			if (!destructionCompleted)
			{
				return false;
			}
			
			// do we have to trigger the event and execute the callback or is it a forced destruction?
			var ks = this.$K.kaiten('getState');
			if (ks.execPanelDestroyCallbacks)
			{
				// we save some information for the callback
				// this will be useful if the destruction process is aborted and needs to be restarted later (e.g. after a user confirmation)
				this.$K.kaiten('pushPanelDestroyAction', { type : 'kpanel.destroy', params : { $srcPanel : $srcPanel } });
				
				if (!this._trigger('beforedestroy', 0, [this.element, this.$K]))
				{
					console.warn('Panel destruction aborted!', this.element);
					this.$K.kaiten('slideTo', this.element);
					return false;
				}
				
				this.$K.kaiten('popPanelDestroyAction'); // pop the action that has been correctly performed
			}
			
			// abort the request in progress
			if (this._state.load.dfd && $.isFunction(this._state.load.dfd.abort))
			{
				this._state.load.dfd.abort(); // abort the current request
			}
						
			// cleanup: handlers, content
			this.element.unbind().undelegate();
			this.element.empty().remove();

			// update the breadcrumb
			this.$breadcrumb.kbreadcrumb('cut', this._state.index);
			
			// deactivate the src element
			this.options.$src.removeClass(jKaiten.selectors.activeClass);
			
			// notify Kaiten
			this.$K.trigger('afterdestroy.kpanel', [isLast]);
			
			// execute default method
			$.Widget.prototype.destroy.apply(this, arguments);
			
			return true;
		},
		
		/* PROPERTIES, CONSTANTS, ... */
		
		_state : {
		},
		
		_constants : {
		},
		
		/* INTERNAL FUNCTIONS */
		
		/**
		 * @ignore
		 * @private
		 */
		_log : function() {
			var state = this._state;
			console.group('Panel ID='+this.options.id);
			console.log(this.element);
			console.log('options', this.options);
			console.log('states', this._state, this._futureState);
			console.log('constants', this._constants);
			console.groupEnd();
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_bindEvents: function() 
		{
			//console.log('kPanel._bindEvents', arguments);
			var self = this;
			
			/* 1. panel/body layout */
			this.element.bind('layout.kpanel', function(e){
				self._doLayout();
			});
		    
	    	if (this.$K.kaiten('getState').hasTouchScreen === true)
			{
	    		// scrollability
		    	this.$body.css({
		    		"height"	: '',
		    		"overflow"	: 'hidden'
	    		}).addClass('scrollable vertical');
			}
			else
			{	
				this.element.bind('bodylayout.kpanel', function(e, kaitenState){
					self._doBodyLayout(kaitenState);
				});
			}
			
			/* 2. change of content */
			this.element.bind('DOMNodeInserted DOMNodeRemoved', function(e){
				//console.log('DOMNode* event', self.element, e.type, e.target, e);
				self._state.$navItems = null; // force rebuild when needed
			});
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_createTitleBar: function(){
			//console.log('kPanel._createTitleBar', arguments);
			var itemsSelectors = jKaiten.selectors.panelItems;
			
			// create title bar
			var html = '<table>'+
							'<tr>'+
								'<td class="'+itemsSelectors.leftToolbarClass+'">'+
								'</td>'+
								'<td class="'+itemsSelectors.titleContainerClass+'">'+
									'<div class="'+itemsSelectors.titleClass+'">'+
										this.options.title+
									'</div>'+
								'</td>'+
								'<td class="'+itemsSelectors.rightToolbarClass+'">'+
								'</td>'+
							'</tr>'+
						'</table>';
			var $table = $(html);
			
			var i, l, t, $tool;
			
			// add left toolbar
			var leftTools = jKaiten._constants.panelLeftTools;
			if (this.options.index === 0) // home panel
			{
				// remove the "remove panel" tool
				leftTools = leftTools.filter(function(e){
					return (e.cssClass != 'remove');
				});
			}
			for (i=0, l=leftTools.length; i<l; i++)
			{
				t = leftTools[i];
				$tool = $('<button />', {
					"class"		: itemsSelectors.toolClass+' '+t.cssClass,
					"title"		: t.title
				});
				$table.find('.left').append($tool);
			}
			
			// add right toolbar
			for (i=0, l=jKaiten._constants.panelRightTools.length; i<l; i++)
			{
				t = jKaiten._constants.panelRightTools[i];
				$tool = $('<button />', {
					"class"		: itemsSelectors.toolClass+' '+t.cssClass,
					"title"		: t.title
				});
				$table.find('.right').append($tool);
			}
			
			// append to DOM
			this.$titleBar = $('<div />', {
				"class" : itemsSelectors.titleBarClass
			}).append($table).appendTo(this.element);
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_createTitleBarOptions: function(options){
			//console.log('kPanel._createTitleBarOptions', arguments);
			var itemsSelectors = jKaiten.selectors.items;
			
			var $optionsBlock = $('<div />', {
				"class" : jKaiten.selectors.panelItems.optionsClass
			});
			
			options = options || this.options.titleBarOptions; // default
			if (options)
			{
				// clone to avoid loss of events/data in case panel content is removed from DOM
				var $options = $(options).clone(true, true);
				if (this.options.index === 0) // home panel
				{
					$options.find(itemsSelectors.removePanel).remove();
				}
				$options.appendTo($optionsBlock);
			}
			
			// append the options to the panel
			$optionsBlock.appendTo(this.element);
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_setCSSClass : function(className) {
			//console.log('kPanel._setCSSClass', arguments);
			var classes = jKaiten.selectors.panelClass;
			if (this.element.hasClass(jKaiten.selectors.focusClass))
			{
				classes += ' '+jKaiten.selectors.focusClass;
			}
			classes += ' '+className;
			this.element.attr('class', classes);
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_insertHTML : function($html) {
			//console.log('kPanel._insertHTML', arguments);
			var self = this, 
				ks = this.$K.kaiten('getState');

			// hide title bar options
			this.element.find(jKaiten.selectors.panelItems.options).hide();

			// remove header + body
			this.element.find(jKaiten.selectors.panelItems.header).unbind().undelegate().remove();
			this.$body.unbind().undelegate().remove();
			
			// remove events handlers
			this.element.unbind().undelegate();
			
			// if no header and no body, create a default body+block
			// this will also handle server-side errors
			if (($html.filter('.'+jKaiten.selectors.panelItems.bodyClass).length === 0) && 
					($html.filter('.'+jKaiten.selectors.panelItems.headerClass).length === 0)) 
			{
				$html = $('<div />', {
					"class": jKaiten.selectors.panelItems.blockClass,
					"html" : $html.html()
				});
				$html = $('<div />', {
					"class" : jKaiten.selectors.panelItems.bodyClass
				}).append($html);
			}

			// append HTML content and set panel CSS class(es)
			this.element.append($html.not('script'));
			this._setCSSClass(this.options.cssClass);
									
			this.$body = this.element.find(jKaiten.selectors.panelItems.body);
			this.$body.scrollTop(0);

			// bind default panel events
			this._bindEvents();
			
			// execute scripts in the panel DOM element context
			$html.filter('script').each(function() {
				if ((this.language === 'javascript') || (!this.language && !this.src))
				{
					var $this = $(this);
					$.globalEval('(function(){'+
						'try {'+
							$this.text()+
						'} catch(e){'+
							'console.group("Exception caught executing panel Javascript!");'+
							'console.warn(e);'+
							'console.trace();'+
							'console.groupEnd();'+
						'}'+
					'}).apply($("#'+self.options.id+'.'+jKaiten.selectors.panelClass+'")[0]);');
				}
			});

			// hide panel loader
			this.toggleLoader(false);
			
			// do panel layout
			this.element.trigger('layout.kpanel');
			
			// prepare keyboard navigation
			if (ks.hasTouchScreen === false)
			{
				this.$K.kaiten('prepareKeyboardNavigation');
			}
			
			// trigger this event and execute the callback
			this._trigger('afterload', 0, [this.element, this.$K]);
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_doLayout : function() {
			//console.log('kPanel._doLayout', this.element, this._state);			
			if (this.isAnimated())
			{
				//console.info('Panel layout discarded! (animation in progress)', this.element);
				return;
			}
			
			var ks = this.$K.kaiten('getState');
			this._setPositionAndWidth(this._state.position, this._state.width, ks);
			
			// toolbar
			this._doToolbarLayout(ks);
			
			// body, according to the layout mode (touchscreen or not)
			this.element.trigger('bodylayout.kpanel', [ks]);
			
			// navitems
			this._doNavItemsLayout();
			
			this._trigger('afterlayout', 0, [this.element, this.$K]);
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_doBodyLayout : function(kaitenState) {
			//console.log('kPanel._doBodyLayout', this.element);
			var ks = kaitenState || this.$K.kaiten('getState');
			
			var bodyHeight = ks.height;
			bodyHeight -= this.element.find(jKaiten.selectors.panelItems.titleBar).outerHeight(true);
			bodyHeight -= this.element.find(jKaiten.selectors.panelItems.header).outerHeight(true);
			
			var $options = this.element.find(jKaiten.selectors.panelItems.options);
			if ($options.is(':visible'))
			{
				bodyHeight -= $options.outerHeight(true);
			}
	    	
	    	this.$body.css({
	    		"height"		: bodyHeight+'px',
	    		"overflow-y"	: "auto"
    		});
		},
		
		// TODO : find a better startegy, for instance only on visible navitems (check scroll) + check .kpanel('buildNavItemsCollection') calls in Kaiten
		/**
		 * @ignore
		 * @private
		 */
		_doNavItemsLayout : function() {
			//console.log('jKaiten._doNavItemsLayout', arguments);
			var $navItems = this._state.$navItems || this.$body.find(jKaiten.selectors.items.navigable+', '+jKaiten.selectors.connectable);
			$navItems.each(function(){
				var $this = $(this), $children = $this.children();
				var $label = $children.filter(jKaiten.selectors.items.label);
				var $info = $children.filter(jKaiten.selectors.items.info);
				var maxLabelWidth = $this.width() - 60; // 30 (head icon) + 30 (tail nav arrow)
				if ($info.length === 0)
				{
					$label.css({
						"max-width": Math.floor(maxLabelWidth)+'px'
					});
					return;
				}
				$label.css({
					"max-width": ''
				});
				var maxInfoWidth = maxLabelWidth - $label.width();
				if (maxInfoWidth <= 20) // threshold
				{
					$label.css({
						"max-width": Math.floor(maxLabelWidth)+'px'
					});
					$info.hide();
					return;
				}
				$info.css({
					"max-width": Math.floor(maxInfoWidth)+'px',
					"display" : "block"
				});
			});
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_doToolbarLayout : function(kaitenState){
			//console.log('kPanel._doToolbarLayout', this.element);
			if (this.isAnimated())
			{
				//console.info('Panel toolbar layout discarded! (animation in progress)', this.element);
				return;
			}
			
			var ks = kaitenState || this.$K.kaiten('getState');
			var toolsSelectors = jKaiten.selectors.panelItems.tools;
			
			// prev
			if (!this.element.prev().length) // home panel : always shown, but disabled
			{
				this.element.find(toolsSelectors.prev).addClass(jKaiten.selectors.disabledClass).show();
			}
			else
			{
				this.element.find(toolsSelectors.prev).removeClass(jKaiten.selectors.disabledClass);
				var $prevPanel = this.element.prev();
				this.element.find(toolsSelectors.prev).toggle(!$prevPanel.kpanel('isVisible', true, ks));
			}
			// next
			if (!this.element.next().length) // last panel: always shown, but disabled
			{
				this.element.find(toolsSelectors.next).addClass(jKaiten.selectors.disabledClass).show();
			}
			else
			{
				this.element.find(toolsSelectors.next).removeClass(jKaiten.selectors.disabledClass);
				var $nextPanel = this.element.next();
				this.element.find(toolsSelectors.next).toggle(!$nextPanel.kpanel('isVisible', true, ks));				
			}			
			// maximize/originalSize
			if (ks.columnsCount === 1)
			{
				this.element.find(toolsSelectors.maximize).hide();
			}
			else
			{
				this.element.find(toolsSelectors.maximize).show();
				if (this._state.width < ks.columnsCount)
				{
					this.element.find(toolsSelectors.maximize).removeClass(jKaiten.selectors.activeClass);
				}
			}
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_hideNavTools : function(){
			//console.log('kPanel_hideNavTools', this.element);
			var ks = this.$K.kaiten('getState');
			var toolsSelectors = jKaiten.selectors.panelItems.tools;
			
			// prev
			if ((this._state.index === 0) || 
					((this._state.position < 0) && (this._futureState.position === 0)))
			{
				this.element.find(toolsSelectors.prev).addClass(jKaiten.selectors.disabledClass).show();
			}
			else
			{
				this.element.find(toolsSelectors.prev).hide();
			}
			// next
			if (this._state.index === (ks.panelsCount - 1) || 
				((this._state.position >= ks.columnsCount) && 
					(this.getEdgePosition(true) === ks.columnsCount)))
			{
				this.element.find(toolsSelectors.next).addClass(jKaiten.selectors.disabledClass).show();
			}
			else
			{
				this.element.find(toolsSelectors.next).hide();
			}
			// maximize/originalSize
			if (ks.columnsCount === 1)
			{
				this.element.find(toolsSelectors.maximize).hide();
			}
		},
		
		/**
		 * All-in-one version, used by _doLayout
		 * @ignore
		 * @private
		 */
		_setPositionAndWidth : function(newPosition, newWidth, kaitenState) {
			//console.log('kPanel._setPositionAndWidth', this.element, arguments);
			var ks = kaitenState || this.$K.kaiten('getState');
			if (newWidth > ks.columnsCount)
			{
				newWidth = ks.columnsCount;
			}
			
			// update state and future state
			this._futureState.position = this._state.position = newPosition;
			this._futureState.width = this._state.width = newWidth;
			this._state.isVisible = this.isVisible(false, ks);
			
			var left = this._state.position * ks.columnWidth;
			var width = (this._state.width * ks.columnWidth);
			this.element.css({
				"left"		: left+'px',
				"width"		: width+'px',
				"display"	: (this._state.isVisible === true) ? 'block' : 'none'
			});
			
			this.$breadcrumb.kbreadcrumb('toggleVisibility', this._state.index, this._state.isVisible);
		},
		
		/* PUBLIC API */
		
		/**
		 * Maximizes the panel width
		 */
		maximize : function(){
			//console.log('kPanel.maximize', arguments);
			this.$K.kaiten('maximize', this.element);
		},
		
		/**
		 * Restores the original panel width
		 */
		originalSize : function(){
			//console.log('kPanel.originalSize', arguments);
			this.$K.kaiten('originalSize', this.element);
		},
		
		/**
		 * Shows or hides a panel loader
		 *
		 * @signature
		 * @param		{Boolean} showOrHide
		 * @param		{String}  where : "body" or "header", if not specified, the loader will cover the whole panel
		 *
		 * @signature
		 * @param		{Boolean} showOrHide
		 * @param		{jQuery}  where, the jQuery element in which the loader must be displayed (useful when (re)loading a block content, for instance)
		 */
		toggleLoader : function(showOrHide, where) {
			//console.log('kPanel.toggleLoader', arguments);
			var $mask = this.element.find(jKaiten.selectors.panelItems.mask), $where;
			switch (where)
			{
				case 'body':
					$where = this.$body;
					break;
			
				case 'header':
					$where = this.element.find(jKaiten.selectors.panelItems.header);
					break;
			
				default:
					$where = (where instanceof jQuery) ? where : this.element;
					break;
			}
			
			if ($where.length === 0)
			{
				return;
			}
			
			$mask.detach().appendTo($where).toggle(showOrHide);
			if (showOrHide === true)
			{
				$where.data('lastOverflowY', $where.css('overflow-y'));
				$where.scrollTop(0).css('overflow-y', 'hidden');
			}
			else
			{
				var currentOverflowY = $where.css('overflow-y');
				if (currentOverflowY !== 'hidden')
				{
					$where.css('overflow-y', currentOverflowY); // layout has changed, keep it
				}
				else
				{
					$where.css('overflow-y', $where.data('lastOverflowY')); // restore previous value
				}
			}
		},
		
		/**
		 * Loads the panel content, using the connector set in the options
		 * 
		 * @param		{Object} data, the data that will be passed as an argument to the connector's loader function
		 * @param		{jQuery} $src, the element at the origin of the load (e.g.: the link that has been clicked)
		 * @param		{Object} dfdAnim, used for internal purpose only
		 */
		load : function(data, $src, dfdAnim) {
			//console.log('kPanel.load', arguments);
			// if a previous load has been made, because its content will be lost, we consider that the panel will be destroyed
			// so, we check if we have to trigger the event and execute the callback or if it's a forced load
			var ks = this.$K.kaiten('getState');
			if (this._state.load.dfd && ks.execPanelDestroyCallbacks)
			{
				// we save some information for the callback
				// this will be useful if the load process is aborted and needs to be restarted later (e.g. after a user confirmation)
				this.$K.kaiten('pushPanelDestroyAction', { type : 'kpanel.load', params : { $srcPanel : this.element, data : data, $src : $src } });
				
				if (!this._trigger('beforedestroy', 0, [this.element, this.$K]))
				{
					console.warn('Panel destruction aborted!', this.element);
					this.$K.kaiten('slideTo', this.element);
					return false;
				}
				
				this.$K.kaiten('popPanelDestroyAction'); // pop the action that has been correctly performed
			}
						
			// set active item
			if ($src.length > 0)
			{			
				$src.closest(jKaiten.selectors.panel).kpanel('setActiveItem', $src);
			}
			
			this.toggleLoader(true); // display loader animation
			
			this.setTitle('Loading...');
			
			/* 0. abort any previous load */
			
			if (this._state.load.dfd)
			{
				if ($.isFunction(this._state.load.dfd.abort))
				{
					this._state.load.dfd.abort();
				}
				else
				{
					this._state.load.dfd.reject(this._state.load.dfd, 'abort');
				}
			}
			if (this._state.load.dfdAnim)
			{
				this._state.load.dfdAnim.reject(this._state.load.dfdAnim, 'abort'); 
			}
			this._state.load.dfdAnim = dfdAnim; 
			
			/* 1. prepare loading */
			
			var self = this, deferreds = [], loaderResult;
			
			this._state.load.data = data; // save data for reload
						
			try
			{
				// just in case we have to abort the request (e.g.: two quick successive loadings)...
				//console.log(this.options.connector);
				loaderResult = this.options.connector.loader(data, this.element, this.$K);
				//console.log('Load result', $.type(loaderResult), loaderResult instanceof jQuery, $.isPlainObject(loaderResult), loaderResult);
				if ($.type(loaderResult) === 'string')
				{
					// create a Deferred and resolve it immediately
					this._state.load.dfd = $.Deferred();
					
					// NB: an exception will be thrown ("Syntax error, unrecognized expression...") if the element cannot be created (e.g.: $('?'))
					this._state.load.dfd.resolve([$(loaderResult)]);
				}
				else if (loaderResult instanceof jQuery)
				{
					// avoid loss of events/data when panel content removed from DOM
					loaderResult = loaderResult.clone(true, true);
					
					// create a Deferred and resolve it immediately with the jQuery element
					this._state.load.dfd = $.Deferred();
					this._state.load.dfd.resolve([loaderResult]);
				}
				else if ($.isPlainObject(loaderResult))
				{
					if (!$.isFunction(loaderResult.isResolved)) // a quick identity check
					{
						throw new Error('Loader function has not returned a proper deferred object!');
					}					
					this._state.load.dfd = loaderResult;
				}
				else
				{
					throw new Error('Loader function has returned a value that cannot be handled! ('+$.type(loaderResult)+')');
				}				
			}
			catch(e)
			{
				this._state.load.dfd = $.Deferred();
				this._state.load.dfd.reject(e.toString(), 'exception');
			}
			
			deferreds.push(this._state.load.dfd);
			
			/* 2. animation */
									
			deferreds.push(this._state.load.dfdAnim || {});
						
			/* 3. launch loading and panel animation */
			
			$.when.apply(this, deferreds).done(function(loadArgs, animArgs){
				//console.log('done', arguments);
				// Retrieve the panel content...
				// "loadArgs" is an array : [data, textStatus, jqXHR]
				// In most cases (AJAX call, "html.string" connector, etc.),
				// the content, a jQuery object (see load), is placed in the first "data" element...
				var $html = $('');
				
				if (loadArgs)
				{
					//console.log(loadArgs[0]);
					if ($.type(loadArgs[0]) === 'string')
					{
						$html = $(loadArgs[0]);
					}
					else if (loadArgs[0] instanceof jQuery)
					{
						$html = loadArgs[0];
					}
					else if (loadArgs[2])
					{
						//console.log(loadArgs[2]);
						// ...in other cases (AJAX calls in a local (filesystem) environment, ...), 
						// we look into the third "jqXHR" element
						$html = $(loadArgs[2].responseText);
					}
				}
				
				if (!$html.length)
				{
					self.setTitle('No content?');
					self._insertHTML($(''));
					return;
				}
				
				// set the panel title, if any
				if (data.kTitle !== undefined)
				{
					self.setTitle(data.kTitle);
				}
				
				// retrieve optimal width, if any
				var ks = self.$K.kaiten('getState'),
					customOptimalWidth;
				
				// from the panel content, i.e. the "optimal-width" attribute of the panel body?
				$html.each(function() {
					var $this = $(this);
					if ($this.attr('optimal-width'))
					{			
						customOptimalWidth = $this.attr('optimal-width');
						return;
					}
				});
				
				// overwritten by the load data?
				if (data.kWidth)
				{
					customOptimalWidth = data.kWidth;
				}
				
				self.setOptimalWidth(customOptimalWidth, ks);
				
				// no resize needed? or will it be an hidden panel?
				var futureState = self.getState(true); // we use future state when dealing with animations
				var widthDiff = self._state.optimalWidth - futureState.width;
				if ((widthDiff === 0) || (!self.isVisible(true, ks)))
				{
					self._insertHTML($html);
					return;
				}
				
				if (widthDiff > 0) // expand
				{					
					// overlaps the right edge?
					if ((futureState.position + self._state.optimalWidth) > ks.columnsCount) 
					{				
						// resize...
						self.setWidthToOptimal(); // no cosmetics
						
						// slide and trigger the placement strategy for all the visible panels @left...
						self.$K.trigger('prevplacement.kaiten', [self.element, ks.columnsCount-self._state.optimalWidth-futureState.position, function(){
							self._insertHTML($html);
						}]);		
						return;
					}
					else
					{
						// resize and trigger the placement strategy for all the visible panels @right...
						self.$K.trigger('nextplacement.kaiten', [self.element, widthDiff, function(){
							self._insertHTML($html);
						}]);
						return;
					}
				}
				else if (widthDiff < 0) // reduce, after a maximize
				{
					// resize and trigger the placement strategy for all the visible panels @right...
					self.$K.trigger('nextplacement.kaiten', [self.element, widthDiff, function(){
						self._insertHTML($html);
					}]);									
					return;
				}
			}).fail(function(jqXHR, textStatus, errorThrown){
				//console.log('fail', arguments);
				// request was not aborted by a new request, carry on
				if (textStatus !== 'abort')
				{
					var errorMsg='', statusMsg='', i;

					if ($.isPlainObject(jqXHR)) // assume it's an AJAX error
					{
						if ($.type(errorThrown) === 'object')
						{
							console.log(errorThrown);
							statusMsg = errorThrown.message;
							statusMsg += '<br /><br />File: '+errorThrown.filename;
							statusMsg += '<br />Line: '+errorThrown.lineNumber;
						}
						else if (jqXHR.status === 0)
						{
							statusMsg = errorThrown+' ('+textStatus+' - '+jqXHR.status+')';
						}
						else
						{
							statusMsg = 'An unexpected <strong>'+textStatus+'</strong> has occured!';
						}
						statusMsg += '<br /><br /><u>Load parameters</u>:<br />';
						for (i in self._state.load.data)
						{
							if (self._state.load.data.hasOwnProperty(i))
							{
								statusMsg += '<br/>&nbsp;&nbsp;&nbsp;'+i+' : '+self._state.load.data[i];
							}
						}
						if ((jqXHR.status !== 0) && (jqXHR.responseText !== ''))
						{
							statusMsg += '<br /><br/><u>Response</u>:<br />'+jqXHR.responseText;
						}
					}
					else
					{
						statusMsg = jqXHR;
					}
					errorMsg = '<div class="'+jKaiten.selectors.panelItems.bodyClass+'">'+
									'<div class="'+jKaiten.selectors.panelItems.blockClass+'">'+
										'<h2>Load error!</h2>'+
										'<p>'+statusMsg+'</p>'+
									'</div>'+
								'</div>';
					
					self.setTitle('Error!');
					self._insertHTML($(errorMsg));
					
					throw new Error(statusMsg);
				}
			});
		},
		
		/**
		 * Reloads the panel content
		 * 
		 * @param		{Object} [data], some custom data that will be merged to the data used for the previous loading
		 */
		reload : function(data) {
			//console.log('kPanel.reload', this.element, arguments);
			// we save some information for the callback
			// this will be useful if the destruction process is aborted and needs to be restarted later (e.g. after a user confirmation)
			this.$K.kaiten('pushPanelDestroyAction', { type : 'kpanel.reload', params : { $srcPanel : this.element, data : data } });
			
			if (!this.$K.kaiten('removeChildren', this.element))
			{
				return false;
			}
			
			this.$K.kaiten('popPanelDestroyAction'); // pop the action that has been correctly performed
			
			if (data)
			{
				$.extend(this._state.load.data, data);
			}
			
			return this.load(this._state.load.data, $());
		},
		
		/**
		 * Opens a new tab using the current document location. The last data passed to the loader function will be serialized and used as the URL query string
		 */				
		newTab : function() {
			//console.log('kPanel.newTab', arguments);
			var newTabData = $.extend({}, this._state.load.data);
			this.$K.kaiten('newTab', newTabData);
		},
		
		/**
		 * Sets the panel title
		 * @param		{String} newTitle
		 */
		setTitle : function(newTitle) {
			//console.log('kPanel.setTitle', arguments);
			newTitle = $('<div />').html(newTitle).text(); // strip tags and decode entities
			this.element.find(jKaiten.selectors.panelItems.title).html(newTitle);
			this.$breadcrumb.kbreadcrumb('updateTitle', this.options.index, newTitle);
		},
		
		/**
		 * @ignore
		 * @param		{Number} newPosition
		 * @param		{Object} [kaitenState]
		 */
		setPosition : function(newPosition, kaitenState) {
			//console.log('kPanel.setPosition', arguments);			
			var ks = kaitenState || this.$K.kaiten('getState');
			
			// update state and future state
			this._futureState.position = this._state.position = newPosition;
			this._state.isVisible = this.isVisible(false, ks);
			
			var left = this._state.position * ks.columnWidth;
			this.element.css({
				"left"		: left+'px',
				"display"	: (this._state.isVisible === true) ? 'block' : 'none'
			});
						
			this.$breadcrumb.kbreadcrumb('toggleVisibility', this._state.index, this._state.isVisible);
		},
		
		/**
		 * @ignore
		 * @param		{Number} inc
		 * @param		{Object} [kaitenState]
		 */
		incPosition : function(inc, kaitenState) {
			//console.log('kPanel.incPosition', arguments);
			this.setPosition(this._state.position+inc, kaitenState);
		},
		
		/**
		 * @ignore
		 * @param		{Number} newWidth
		 * @param		{Object} [kaitenState]
		 */
		setWidth : function(newWidth, kaitenState) {
			//console.log('kPanel.setWidth', arguments);
			var ks = kaitenState || this.$K.kaiten('getState');			
			if (newWidth > ks.columnsCount)
			{
				newWidth = ks.columnsCount;
			}
			
			// update state and future state
			this._futureState.width = this._state.width = newWidth;
			
			var width = (this._state.width * ks.columnWidth);
			this.element.css('width', width+'px');
		},
		
		/**
		 * @ignore
		 * @param 		{Object} [kaitenState]
		 */
		setWidthToOptimal : function(kaitenState) {
			//console.log('kPanel.setWidthToOptimal', arguments);
			this.setWidth(this._state.optimalWidth, kaitenState);
			return this._state.width;
		},
		
		/**
		 * @param		{Number} newWidth
		 * @param 		{Object} [kaitenState]
		 */
		setOptimalWidth : function(newWidth, kaitenState) {
			//console.log('kPanel.setOptimalWidth', arguments);
			var ks = kaitenState || this.$K.kaiten('getState');			
			if (newWidth === 'fullscreen')
			{
				this._state.optimalWidth = ks.columnsCount;
				return;
			}
			else if (newWidth === 'auto')
			{
				var freeColumnsCount = ks.columnsCount - this.element.prev().kpanel('getEdgePosition');
				this._state.optimalWidth = (freeColumnsCount <= 0) ? 1 : freeColumnsCount;
				return;
			}
			
			var intWidth = parseInt(newWidth, 10);
			if (!intWidth)
			{
				this._state.optimalWidth = 1;
				return;
			}

			if (/[0-9]px$/.test(newWidth)) // allows width to be specified in px
			{
				intWidth = Math.ceil(intWidth/ks.columnWidth);
			}
			if (intWidth < 1)
			{
				intWidth = 1;
			}
			else if (intWidth > ks.columnsCount)
			{
				intWidth = ks.columnsCount;
			}
			this._state.optimalWidth = intWidth;
		},
		
		/**
		 * @param			{Number} posInc
		 * @param			{Number} widthInc
		 * @param			{Object} [kaitenState]
		 * @param			{Function} [callback]
		 */
		animate : function(posInc, widthInc, kaitenState, callback) {
			//console.log('kPanel.animate', arguments, this.element);
			var ks = kaitenState || this.$K.kaiten('getState');
			// prepare animation
			var animParms = { };

			if (posInc)
			{
				var leftInc = posInc * ks.columnWidth;
				animParms.left = '+='+leftInc; // > 0 moves to the right				
				this._futureState.position = this._futureState.position + posInc;
			}
			if (widthInc)
			{
				var resizeInc = widthInc * ks.columnWidth;
				animParms.width = '+='+resizeInc;				
				this._futureState.width = this._futureState.width + widthInc;
			}
			
			// animate
			if (posInc || widthInc)
			{
				this.$K.trigger('animstart.kpanel'); // notify Kaiten
				
				this._hideNavTools();
								
				var self = this;
				this.element.animate(animParms, {
					duration	: 500,
					easing		: 'easeOutExpo',
					queue 		: false,
					complete 	: function() {
						self.$K.trigger('animcomplete.kpanel'); // notify Kaiten
						
						// update state
						if (posInc)
						{				
							self.setPosition(self._futureState.position);
						}
						if (widthInc)
						{
							self.setWidth(self._futureState.width);
						}
							
						// layout, if visible		
						if (self.isVisible(false))
						{							
							self.element.trigger('layout.kpanel');
						}
						
						if ($.isFunction(callback))
						{
							callback.call(self.element);
						}
					}
				});
			}
		},
		
		/**
		 * Shows or hides the panel
		 *
		 * @signature
		 * @param		{Boolean} [showOrHide]
		 */
		toggle : function(showOrHide) {
			//console.log('kPanel.toggle', arguments);
			this.element.toggle(showOrHide);
		},
		
		/**
		 * @ignore
		 * @param			{jQuery} $item
		 */
		setActiveItem : function($item) {
			//console.log('kPanel.setActiveItem', arguments);
        	this._state.$activeItem.removeClass(jKaiten.selectors.activeClass);
        	this._state.$activeItem = $item;
        	this._state.$activeItem.addClass(jKaiten.selectors.activeClass);
		},
		
		/**
		 * @ignore
		 * @param			{Boolean} future
		 * @param			{Object} [kaitenState]
		 */
		isVisible : function(future, kaitenState) {
			//console.log('kPanel.isVisible', this.element, future);
			var ks = kaitenState || this.$K.kaiten('getState');
			var p = (future === true) ? this._futureState.position : this._state.position;
			return (p >= 0) && (p < ks.columnsCount);
		},
		
		/**
		 * @ignore
		 */
		isAnimated : function() {
			//console.log('kPanel.isAnimated', this.element, this._state.position, this._futureState.position, this._state.position !== this._futureState.position);
			return (this._state.position !== this._futureState.position);
		},
		
		/**
		 * @ignore
		 * @param			{Boolean} future
		 */
		getState : function(future) {
			//console.log('kPanel.getState', this.element, future, (future === true)?this._futureState:this._state);
			return (future === true) ? this._futureState : this._state;
		},
		
		/**
		 * @ignore
		 * @param			{Boolean} future
		 */
		getEdgePosition : function(future) {
			//console.log('kPanel.getEdgePosition', this.element, future, (future === true)?this._futureState:this._state);
			return (future === true) ? this._futureState.position+this._futureState.width : this._state.position+this._state.width;
		},
		
		/**
		 * @ignore
		 */
		buildNavItemsCollection : function() {
			//console.log('kPanel.buildNavItemsCollection', this.element);
			this._state.$navItems = this.$body.find(jKaiten.selectors.items.navigable+', '+jKaiten.selectors.connectable);
			this._state.$activeItem = this._state.$navItems.filter('.'+jKaiten.selectors.activeClass);
			return this._state.$navItems;
		},
		
		/**
		 * Display or hide the title bar options with a sliding motion
		 */
		toggleOptions : function() {
			//console.log('kPanel.toggleOptions', this.element);
			var self = this;
			this.element.children(jKaiten.selectors.panelItems.options).slideToggle(100, function(){
				self.element.trigger('bodylayout.kpanel');
			});
		}
	});
}(jQuery));

(function( $ ) {
	
	/**
	 * Kaiten Breadcrumb Widget	 
	 *
	 * @class
	 * @name 		jQuery.ui.kbreadcrumb
	 * @version 	2011-10-07
	 * @widget
	 *
	 * @param		{Object} [options]
	 * @param		{Number} [options.minItemWidth]
	 *
	 * @example
	 * //initialize the widget
	 * $(element).kbreadcrumb();	 
	 *
	 * @example
	 * //Override default value for minItemWidth
	 * $(element).kbreadcrumb({minItemWidth: 64});
	 */
	$.widget("ui.kbreadcrumb",/** @lends jQuery.ui.kbreadcrumb.prototype */{
		/* DEFAULT PROPERTIES/METHODS */
		
		/**
		 * Default breadcrumb options, a mix of defaults with settings provided by the user
		 */
		options : {
			/**#@+
			 * @widgetoption
			 * @memberOf jQuery.ui.kbreadcrumb
			 */
			/**
			 * Minimum width for a breadcrumb item
			 * @type		Number
			 * @default		32
			 */
			minItemWidth : 32
			/**#@-*/
		},
		
		/**
		 * Default widget creation method
		 * @ignore
		 * @private
		 */
		_create: function() {
			/* 1. define useful variables and constants */
			
			this.$K = $(jKaiten.selectors.window).parent();
			this.$topBar = this.$K.find(jKaiten.selectors.topbar);
			// we will need this for the layout of the breadcrumb
			this._constants.appMenuWidth = this.$K.find(jKaiten.selectors.appMenuContainer).outerWidth() + this.$K.find(jKaiten.selectors.appMenuBorder).outerWidth();
			
			/* 2. HTML markup */
			
			this.$list = $('<ul />').appendTo(this.element);
			
			/* 3. bind events */
			
			var self = this;

			// Will be triggered when Kaiten's container width change - see Kaiten's layout
			this.element.bind('layout.kbreadcrumb', function(e){
				self._doLayout();
			});
			
			// Breadcrumb links
			this.element.delegate('a', 'click', function(e){
				var $this = $(this), 
					parts = $this.parent().attr('id').split('-'),
					$panel = self.$K.find('#'+parts[1]);
				
				if (e.metaKey === true)
				{
					$panel.kpanel('newTab');
					return false;
				}
				self.$K.kaiten('slideTo', $panel);
			});
			
			//console.log('options/state', this.options, this._state);
		},
		
		/**
		 * Default widget "set option" method
		 * @ignore
		 * @private
		 */
		_setOption : function(key, value) {
			// option must be updated before layout
			$.Widget.prototype._setOption.apply(this, arguments);
			
			switch (key)
			{
				case 'minItemWidth':
					this.element.find('li').css('min-width', value+'px');
					this._doLayout();
					break;
				
				default:
					break;
			}
		},
		
		/**
		 * Default widget destruction method, removes the instance from the encapsulated DOM element, which was stored on instance creation
		 * @ignore
		 * @private
		 */
		destroy : function() {
			this.element.undelegate().unbind().empty().remove();			
			$.Widget.prototype.destroy.apply(this, arguments);
		},
		
		/* PROPERTIES, CONSTANTS, ... */
		
		_state : {
			itemsData : []
		},
		
		_constants : {
			appMenuWidth : 0
		},
		
		/* INTERNAL FUNCTIONS */
		
		/**
		 * @ignore
		 * @private
		 */
		_doLayout : function() {
			//console.log('kBreadcrumb._doLayout', arguments, this.element);
			var maxWidth = this.$topBar.width() - this._constants.appMenuWidth;
			var $listItems = this.element.find('li'), listWidth = 0;
			$listItems.each(function(){
				listWidth += $(this).outerWidth();
			});
			var widthDiff = listWidth - maxWidth;			
			var self = this, items = [], $item, w, wInc, weightedInc, item, i, l, newWidth;
			//console.log('topBar='+this.$topBar.width(), 'appmenu='+this._constants.appMenuWidth, 'listWidth='+listWidth, 'widthDiff='+widthDiff);
			if (widthDiff > 0) // reduce
			{	
				var min = Infinity;
				$listItems.not(':first').each(function(){
					$item = $(this);
					w = $item.width();
					if (w > self.options.minItemWidth)
					{
						items.push({ $elem : $item, width : w });
						min = Math.min(min, w);
					}
				});			
				l = items.length;
				if (l === 0)
				{
					return;
				}
				wInc = widthDiff / l;
				//console.log('l='+l, 'wInc='+wInc, 'min='+min);
				for (i=l-1; i>=0; i--)
				{
					item = items[i];
					weightedInc = Math.round(wInc * (item.width / min));
					newWidth = item.width - weightedInc;
					//console.log('i='+i, item.$elem, 'item.width='+item.width, 'weightedInc='+weightedInc, 'newWidth='+newWidth);
					if (newWidth < this.options.minItemWidth)
					{
						widthDiff -= (item.width - this.options.minItemWidth); // crop
						//console.log('crop, new widthDiff='+widthDiff);
						if ((l === 1) && (widthDiff <= 0))
						{
							newWidth = -widthDiff;
							//console.log('single, newWidth='+newWidth);
						}
						else if (i > 0)
						{
							wInc = widthDiff / i; // we should update min, no?
							//console.log('new wInc='+wInc);
						}
					}
					else
					{
						widthDiff -= weightedInc;
						//console.log('normal, new widthDiff='+widthDiff);
					}				
					this._doItemLayout(item.$elem, newWidth);
					if (widthDiff <= 0)
					{
						break;
					}
				}
			}
			else if (widthDiff < 0) // expand
			{
				var max = 0, origWidth;
				$listItems.not(':first').each(function(){
					$item = $(this);
					w = $item.width();
					origWidth = $item.data('orig-width');
					if (w < origWidth)
					{
						items.push({ $elem : $item, width : w, origWidth : origWidth });
						max = Math.max(max, origWidth);
					}
				});			
				l = items.length;
				if (l === 0)
				{
					return;
				}
				widthDiff = -widthDiff;
				wInc = Math.floor(widthDiff / l);
				//console.log('l='+l, 'wInc='+wInc, 'max='+max);
				for (i=0; i<l; i++)
				{
					item = items[i];
					weightedInc = Math.round(wInc * (max/item.origWidth));
					newWidth = item.width + weightedInc;
					//console.log('i='+i, item.$elem, 'item.width='+item.width, 'item.origWidth='+item.origWidth, 'weightedInc='+weightedInc, 'newWidth='+newWidth);
					if (newWidth > item.origWidth)
					{
						widthDiff -= (item.origWidth - item.width); // crop
						//console.log('crop to '+item.origWidth+', new widthDiff='+widthDiff);
						if (i < (l - 1))
						{
							wInc = widthDiff / (l-1-i); // we should update max, no?
							//console.log('new wInc='+wInc);
						}
					}
					else
					{
						widthDiff -= weightedInc;
						//console.log('normal, new widthDiff='+widthDiff);
					}		
					this._doItemLayout(item.$elem, newWidth);
					if (widthDiff <= 0)
					{
						break;
					}
				}
			}
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_doItemLayout : function($item, newWidth) {
			if (newWidth)
			{
				if (newWidth < this.options.minItemWidth)
				{
					newWidth = this.options.minItemWidth;
				}
				else if (newWidth >= $item.data('orig-width'))
				{
					newWidth = $item.data('orig-width') + 1; // on certain small items, 1px is missing...
				}
				$item.css('width', newWidth+'px');
			}
		},
		
		/**
		 * @ignore
		 * @private
		 */
		_genDocTitle : function() {
		    var docTitle = '', title, i;
		    for (i=this._state.itemsData.length-1; i>0; i--)
		    {
		    	title = this._state.itemsData[i].title;
		        docTitle += title + ' ◀ ';
		    }
		    if (this._state.itemsData.length > 0)
		    {
		    	title = this._state.itemsData[0].title;
		    	docTitle += title;
		    }
		    document.title = docTitle;
		},
		
		/* PUBLIC API */
		
		/**
		 * Adds a new item to the breadcrumb.
		 *
		 * @param	{Object} options, the related panel optoins
		 * @param 	{Number} options.index
		 * @param	{String} options.title
		 */
		add : function(options) {
			this._state.itemsData[options.index] = options;
			this._genDocTitle();
			
			// create new list item and anchor 
			var $listItem = $('<li />', {
				"id"	: jKaiten.selectors.breadcrumbItems.itemIDPrefix+'-'+options.id,
				"class"	: jKaiten.selectors.breadcrumbItems.lastClass+' '+jKaiten.selectors.visibleClass
			});
			var $anchor = $('<a />', {
				"title" : options.title
			});
			
			if (this._state.itemsData.length === 1)
			{
				$listItem.addClass(jKaiten.selectors.breadcrumbItems.homeClass);
				$anchor.attr('accesskey', 'h');
				$listItem = $listItem.append($anchor).appendTo(this.$list);
			}
			else
			{
				$anchor.append(options.title);
				$listItem = $listItem.append($anchor).appendTo(this.$list);
				$listItem.css('min-width', this.options.minItemWidth+'px').data('orig-width', $listItem.width());
				$listItem.prev().removeClass(jKaiten.selectors.breadcrumbItems.lastClass);
				this._doLayout();
			}
		},
		
		/**
		 * Updates the title of the breadcrumb item specified by a given index.
		 *
		 * @param		{Number} index		the index of the breadcrumb item to update
		 * @param		{String} newTitle	the new title
		 */
		updateTitle : function(index, newTitle) {
			this._state.itemsData[index].title = newTitle;
			
			var selector = '#'+jKaiten.selectors.breadcrumbItems.itemIDPrefix+'-'+this._state.itemsData[index].id+' a';
			var $anchor = this.element.find(selector);
			$anchor.attr('title', this._state.itemsData[index].title);
			
			var $listItem = $anchor.parent();
			if (!$listItem.hasClass(jKaiten.selectors.breadcrumbItems.homeClass))
			{
				$listItem.css('width', '');
				$anchor.html(this._state.itemsData[index].title);
				$listItem.data('orig-width', $listItem.width());
				this._doLayout();
			}
			
			this._genDocTitle();											
		},
		
		/**
		 * Removes all breadcrumb items after and including the one specified by the given index.
		 *
		 * @param		{Number} index
		 */
		cut : function(index) {
			var breadcrumbSelectors = jKaiten.selectors.breadcrumbItems;
			var selectorPrefix = '#'+breadcrumbSelectors.itemIDPrefix+'-';
			var itemData, i;
			for (i=this._state.itemsData.length-1; i>=index; i--)
			{			
				itemData = this._state.itemsData.pop();
				this.element.find(selectorPrefix+itemData.id).remove();
			}
			if (index > 0)
			{
				this.element.find(selectorPrefix+this._state.itemsData[index-1].id).removeClass(breadcrumbSelectors.rVisibleClass+' '+breadcrumbSelectors.rInvisibleClass).addClass(breadcrumbSelectors.lastClass);
				this._doLayout();
			}

			this._genDocTitle();
		},
		
		/**
		 * Displays the item specified by the given index as related to a visible panel or not.
		 *
		 * @param		{Number} index
		 * @param		{Boolean} visible
		 */
		toggleVisibility : function(index, visible){
			if (!this._state.itemsData[index])
			{
				return;
			}
			var bcSels = jKaiten.selectors.breadcrumbItems,
				vClass = jKaiten.selectors.visibleClass,
				$item = this.element.find('#'+bcSels.itemIDPrefix+'-'+this._state.itemsData[index].id),
				$prevItem = $item.prev(), 
				$nextItem = $item.next();
		
			$item.toggleClass(vClass, visible);
			
			// the purpose of these tests is to adjust the classes of the current and the previous items
			// so that the background images "melt into each other"
			if (visible) // the current item is visible
			{
				// if the previous item is invisible, add a special class to it
				$prevItem.toggleClass(bcSels.rVisibleClass, !$prevItem.hasClass(vClass)).removeClass(bcSels.rInvisibleClass);
				// if the next item is invisible, add a special class to the current item
				$item.toggleClass(bcSels.rInvisibleClass, $nextItem.length && !$nextItem.hasClass(vClass)).removeClass(bcSels.rVisibleClass);
			}
			else // the current item is invisible
			{
				// if the previous item is visible, add a special class to it
				$prevItem.toggleClass(bcSels.rInvisibleClass, $prevItem.hasClass(vClass)).removeClass(bcSels.rVisibleClass);
				// if the next item is visible, add a special class to the current item
				$item.toggleClass(bcSels.rVisibleClass, $nextItem.length && $nextItem.hasClass(vClass)).removeClass(bcSels.rInvisibleClass);
			}
		}
	});
}(jQuery));

/**
 * Kaiten templater, a basic templating system.
 *
 * @name kTemplater
 * @namespace
 * @version 2011-09-01
 */
kTemplater = (function($, kSelectors){
	/* PRIVATE FUNCTIONS */
	
	/**
	 *  
	 * Builds an HTML div element.
	 * 
	 * @example
	 * A call to :
	 * 
	 * _elem('panel-body', { id:'home', content:'&lt;h1&gt;Home&lt;/h1&gt;&lt;p&gt;Home sweet home!&lt;/p&gt;' }, 'html')
	 * 
	 * will return the HTML string: 
	 * 
	 * &lt;div class="panel-body" id="home"&gt;&lt;h1&gt;Home&lt;/h1&gt;&lt;p&gt;Home sweet home!&lt;/p&gt;&lt;/div&gt;
	 * 
	 * @name _elem
	 * @memberOf kTemplater
	 * @private
	 * @function
	 * @param {String} className The CSS class name to give to the element
	 * @param {Object} [config] The element configuration (class, id, content)
	 * @param {String} [config.id] The ID to give to the element
	 * @param {String} [config.content] The HTML content of the element
	 * @param {String} [config.class] Additional CSS class(es)
	 * @param {String} type The type of the element to create : "html" or "jQuery", if not sepcified, defaults to "html"
	 * @returns {String|jQuery Object} The element created
	 */
	function _elem(className, config, type) {
		//console.log('_elem', arguments);
		if (config['class'])
		{
			className += ' '+config['class'];
		}
		var idAttr = (config.id) ? 'id="'+config.id+'"' : '';
		if (!type || (type == 'html'))
		{	
			config.content = config.content || '';
			return '<div class="'+className+'" '+idAttr+'>'+config.content+'</div>';
		}
		else
		{
			var $html = $('<div class="'+className+'" '+idAttr+' />');
			if (config.content)
			{	
				$html.append(config.content);
			}
			return $html;
		}
	}
	
	/**
     * Builds a panel header.
     * 
     * @name _header
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The header configuration (class, id, content)
     * @param {String} type The type of the element to create : "html" or "jQuery"
     * @returns {String|jQuery Object} The element created
     * @see kTemplater._elem
     */
	function _header(config, type) {
		return _elem(kSelectors.panelItems.headerClass, config, type);
	}	
	
	/**
     * Builds a panel body.
     * 
     * @name _body
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The body configuration (class, id, content)
     * @param {String} type The type of the element to create : "html" or "jQuery"
     * @returns {String|jQuery Object} The element created
     * @see kTemplater._elem
     */
	function _body(config, type) {
		return _elem(kSelectors.panelItems.bodyClass, config, type);
	}	
	
	/**
     * Builds a block.
     * 
     * @name _block
     * @memberOf kTemplater
     * @private
     * @function
     * @param {String} className The class name to give to the block
     * @param {Object} [config] The block configuration (class, id, content)
     * @param {String} type The type of the element to create : "html" or "jQuery"
     * @returns {String|jQuery Object} The element created
     * @see kTemplater._elem
     */
	function _block(className, config, type) {
		return _elem(className, config, type);
	}
	
	/**
     * Creates a title attribute.
     * 
     * @name _titleAttr
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} config The element configuration (title, label, info)
     * @returns {String} An HTML string
     * @see kTemplater._navigable
     * @see kTemplater._clickable
     * @see kTemplater._separator
     */
	function _titleAttr(config) {
		var title = config.title || config.label;
		if (config.info)
		{
			title += ' /// '+config.info;
		}
		title = $('<div />').html(title).text(); // strip tags
		title = title.replace(/\"/g,'&quot;');
		return title;
	}
	
	/**
     * Builds a navigation element, which has to be in a navigation block.
     * 
     * @name _navigable
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The configuration (class, id, content)
     * @param {String} [config.id] The ID to give to the element
     * @param {String} [config.class] Additional CSS class(es)
     * @param {String} [config.label] The label (text) to give to the navigation element
     * @param {String} [config.info] The information text
     * @param {String} [config.iconURL] The URL of the icon image. 
     * @param {String} [config.title] The title attribute. If none is passed, config.label will be used instead. In each case, config.info will be concatenated to create the full title attribute. 
     * @returns {String} An HTML string
     */
	function _navigable(config) {
		var idAttr = (config.id) ? 'id="'+config.id+'"' : '';
		var className = kSelectors.items.itemsClass+' '+kSelectors.items.navigableClass;
		if (config['class'])
		{
			className += ' '+config['class'];
		}
		var html = '<div '+idAttr+' class="'+className+'" title="'+_titleAttr(config)+'">';
		if (config.iconURL)
		{
			html += '<div class="'+kSelectors.items.headClass+'"><img src="'+config.iconURL+'" /></div>';
		}
		html += '<div class="'+kSelectors.items.labelClass+'">'+config.label+'</div>';
		if (config.info)
		{
			html += '<div class="'+kSelectors.items.infoClass+'">'+config.info+'</div>';
		}
		html += '<div class="'+kSelectors.items.tailClass+'" />';
		html += '</div>';
		return html;
	}
	
	/**
     * Builds a clickable element, which has to be in a navigation block.
     * 
     * @name _clickable
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The configuration (class, id, content)
     * @param {String} [config.id] The ID to give to the element
     * @param {String} [config.class] Additional CSS class(es)
     * @param {String} [config.label] The label (text) to give to the navigation element
     * @param {String} [config.info] The information text
     * @param {String} [config.iconURL] The URL of the icon image. 
     * @param {String} [config.title] The title attribute. If none is passed, config.label will be used instead. In each case, config.info will be concatenated to create the full title attribute. 
     * @returns {String} An HTML string
     */
	function _clickable(config) {
		var idAttr = (config.id) ? 'id="'+config.id+'"' : '';
		var className = kSelectors.items.itemsClass+' '+kSelectors.items.clickableClass;
		if (config['class'])
		{
			className += ' '+config['class'];
		}
		var html = '<div '+idAttr+' class="'+className+'" title="'+_titleAttr(config)+'">';
		if (config.iconURL)
		{
			html += '<div class="'+kSelectors.items.headClass+'"><img src="'+config.iconURL+'" /></div>';
		}
		html += '<div class="'+kSelectors.items.labelClass+'">'+config.label+'</div>';
		if (config.info)
		{
			html += '<div class="'+kSelectors.items.infoClass+'">'+config.info+'</div>';
		}
		html += '</div>';
		return html;
	}
	
	/**
     * Builds a downloadable element, which has to be in a navigation block.
     * 
     * @name _downloadable
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The configuration (class, id, content)
     * @param {String} [config.id] The ID to give to the element
     * @param {String} [config.class] Additional CSS class(es)
     * @param {String} [config.label] The label (text) to give to the navigation element
     * @param {String} [config.info] The information text
     * @param {String} [config.iconURL] The URL of the icon image
     * @param {String} [config.url] The URL of the file to download when the element is clicked
     * @param {String} [config.title] The title attribute. If none is passed, config.label will be used instead. In each case, config.info will be concatenated to create the full title attribute. 
     * @returns {String} An HTML string
     */
	function _downloadable(config) {
		config['class'] = (config['class']) ? config['class']+' '+kSelectors.downloadableClass : kSelectors.downloadableClass;
		return _clickable(config);
	}
	
	/**
     * Builds a separator element, which has to be in a navigation block.
     * 
     * @name _separator
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The configuration (class, id, content)
     * @param {String} [config.id] The ID to give to the element
     * @param {String} [config.class] Additional CSS class(es)
     * @param {String} [config.label] The label (text) to give to the navigation element
     * @param {String} [config.info] The information text
     * @param {String} [config.iconURL] The URL of the icon image. 
     * @param {String} [config.title] The title attribute. If none is passed, config.label will be used instead. In each case, config.info will be concatenated to create the full title attribute. 
     * @returns {String} An HTML string
     */
	function _separator(config) {
		var idAttr = (config.id) ? 'id="'+config.id+'"' : '';
		var className = kSelectors.items.itemsClass+' '+kSelectors.items.separatorClass;
		if (config['class'])
		{
			className += ' '+config['class'];
		}
	   var html = '<div '+idAttr+' class="'+className+'" title="'+_titleAttr(config)+'">';
	   if (config.iconURL)
	   {
	       html += '<div class="'+kSelectors.items.headClass+'"><img src="'+config.iconURL+'" /></div>';
	   }
	   html += '<div class="'+kSelectors.items.labelClass+'">'+config.label+'</div>';
	   if (config.info)
	   {
	       html += '<div class="'+kSelectors.items.infoClass+'">'+config.info+'</div>';
	   }
	   html += '</div>';
	   return html;
	}
	
	/**
     * Builds a summary element, which has to be in a navigation block.
     * 
     * @name _summary
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The configuration (class, id, content)
     * @param {String} [config.id] The ID to give to the element
     * @param {String} [config.class] Additional CSS class(es)
     * @param {String} [config.label] The label (text) to give to the navigation element
     * @param {String} [config.info] The information text
     * @param {String} [config.iconURL] The URL of the icon image.  
     * @returns {String} An HTML string
     */
	function _summary(config) {
		var idAttr = (config.id) ? 'id="'+config.id+'"' : '';
		var className = kSelectors.items.summaryClass;
		if (config['class'])
		{
			className += ' '+config['class'];
		}
		var html = '<div '+idAttr+' class="'+className+'">';
		if (config.iconURL)
		{
			html += '<img src="'+config.iconURL+'" />';
		}
		html += '<div class="'+kSelectors.items.labelClass+'">'+config.label+'</div>';
		if (config.info)
		{
			html += '<div class="'+kSelectors.items.infoClass+'">'+config.info+'</div>';
		}
		html += '</div>';
		return html;
	}
	
	/**
     * Builds a search form.
     * 
     * @name _search
     * @memberOf kTemplater
     * @private
     * @function
     * @param {Object} [config] The configuration (class, id, content)
     * @param {String} [config.id] The ID to give to the element
     * @param {String} [config.text] The text to be placed in the input
     * @returns {String} An HTML string
     */
	function _search(config) {
		var idAttr = (config.id) ? 'id="'+config.id+'"' : '';
		var html = '<form '+idAttr+' class="quicksearch" onsubmit="return false;"><div class="container rounded-corners">';
		config.text = config.text || '';
		html += '<button class="'+kSelectors.items.headClass+' search" />';
		html += '<input class="input" type="text" value="'+config.text+'" />';
		html += '<button class="tail reset" onclick="$(this).prev(\'input:text\').val(\'\');return false;" />';
		html += '</div></form>';
		return html;
	}
	
	/**
     * Builds a UI element, either as an HTML string or a jQuery Object.
     * 
     * @name _build
     * @memberOf kTemplater
     * @private
     * @function
     * @param {String} type The type of the element to create : "html" or "jQuery"
     * @param {String} templateName The name of the template that will be used to create the element :
     * <ul>
     * 	<li>panel.body</li>
     * 	<li>panel.header</li>
     * 	<li>block.content</li>
     * 	<li>block.navigation</li>
     * 	<li>block.noresults</li>
     * 	<li>line.navigation</li>
     * 	<li>line.clickable</li>
     * 	<li>line.separator</li>
     * 	<li>line.summary</li>
     * 	<li>line.search</li>
     * </ul>
     * @param {Object} [config] The configuration of the element
     * @returns {String|jQuery Object} The element created
     * @throws {Error} if the template has not been found
     * @see kTemplater._body
     * @see kTemplater._header
     * @see kTemplater._block
     * @see kTemplater._navigable
     * @see kTemplater._clickable
     * @see kTemplater._separator
     * @see kTemplater._summary
     * @see kTemplater._search
     */
	function _build(type, templateName, config) {
		//console.log('kTemplater._build', arguments);
		var item = null;
		config = config || {};
		switch (templateName) 
		{
			case 'panel.body':
				item = (type === 'html') ? _body(config) : $(_body(config, 'jQuery'));
				break;
				
			case 'panel.header':
				item = (type === 'html') ? _header(config) : $(_header(config, 'jQuery'));
				break;
			
			case 'block.content':
				item = (type === 'html') ? _block('block', config) : $(_block('block', config, 'jQuery'));
				break;

			case 'block.navigation':
				item = (type === 'html') ? _block('block-nav', config) : $(_block('block-nav', config, 'jQuery'));
				break;
				
			case 'block.noresults':
				item = (type === 'html') ? _block('block-noresults', config) : $(_block('block-noresults', config, 'jQuery'));
				break;
				
			case 'line.navigation':
				item = _navigable(config);
				if (type === 'html')
				{
					if (config.data)
					{
						throw new Error('Using data on HTML templates is not supported! Please use kTemplater.jQuery() instead.');
					}
				}
				else
				{
					item = $(item);
					item.data('load', config.data);
				}
				break;
				
			case 'line.clickable':
				item = _clickable(config);
				if (type === 'html')
				{
					if (config.data)
					{
						throw new Error('Using data on HTML templates is not supported! Please use kTemplater.jQuery() instead.');
					}
				}
				else
				{
					item = $(item);
					item.data('load', config.data);
				}
				break;
				
			case 'line.downloadable':
				item = _downloadable(config);
				if (type === 'html')
				{
					if (config.url)
					{
						throw new Error('Using data on HTML templates is not supported! Please use kTemplater.jQuery() instead.');
					}
				}
				else
				{
					item = $(item);
					item.data('load', { url : config.url });
				}
				break;

			case 'line.separator':
				item = (type === 'html') ? _separator(config) : $(_separator(config));
				break;
				
			case 'line.summary':
				item = (type === 'html') ? _summary(config) : $(_summary(config));
				break;
				
			case 'line.search':
				item = (type === 'html') ? _search(config) : $(_search(config));
				break;
				
			default:				
				break;
		}
		//console.log(item);
		
		if (item === null)
		{
			throw new Error('Template "'+templateName+'" not available!');
		}
		
		return item;
	}
	
	/* PUBLIC API */
	
	return {
		/**
	     * Creates a UI HTML element.
	     * 
	     * @name html
	     * @memberOf kTemplater
	     * @public
	     * @function
	     * @param {String} templateName The name of the template that will be used to create the element :
	     * <ul>
	     * 	<li>panel.body</li>
	     * 	<li>panel.header</li>
	     * 	<li>block.content</li>
	     * 	<li>block.navigation</li>
	     * 	<li>block.noresults</li>
	     * 	<li>line.navigation</li>
	     * 	<li>line.clickable</li>
	     * 	<li>line.separator</li>
	     * 	<li>line.summary</li>
	     * 	<li>line.search</li>
	     * </ul>
	     * @param {Object} [config] The configuration of the element
	     * @returns {String} An HTML string
	     * @see kTemplater._build
	     */
		html : function(templateName, config) {
			return _build('html', templateName, config);
		},
		/**
	     * Creates a UI jQuery element.
	     * 
	     * @name jQuery
	     * @memberOf kTemplater
	     * @public
	     * @function
	     * @param {String} templateName The name of the template that will be used to create the element :
	     * <ul>
	     * 	<li>panel.body</li>
	     * 	<li>panel.header</li>
	     * 	<li>block.content</li>
	     * 	<li>block.navigation</li>
	     * 	<li>block.noresults</li>
	     * 	<li>line.navigation</li>
	     * 	<li>line.clickable</li>
	     * 	<li>line.separator</li>
	     * 	<li>line.summary</li>
	     * 	<li>line.search</li>
	     * </ul>
	     * @param {Object} [config] The configuration of the element
	     * @returns {jQuery Object} A jQuery object
	     * @see kTemplater._build
	     */
		jQuery : function(templateName, config){
			return _build('jQuery', templateName, config);
		}
	};
}(jQuery, jKaiten.selectors));