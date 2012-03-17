$(function(){
	$.fn.oTabs = function(){
		var $tabs = $(this),
			$nav = $tabs.find('#nav'),
			select = 0,
			state = { activeSelector: '' };
		
		/*
		Allows us to know if the tabs have already been initialized.
		When you refresh the panel for example.
		*/
		var alreadyInitialized = $nav.children().length>0;
		
		/**
		 * Copy attributes from one element to another.
		 *
		 * Tested with
		 * - Firefox 8.0.1
		 * - Safari 5.1.2
		 * - Google Chrome 15.0.874.121
		 * - Windows Internet Explorer 9
		 *
		 * @param jQuery from Element from which we will copy attributes
		 * @param jQuery to Element on which attributes will be copied
		 * @param Array [exclude] Attributes names that should not be copied
		 * @author julien@nectil.com
		 * @since Dec 06, 2011
		 */
		function copyAttrs(from, to, exclude){
			var nocopy = ['id', 'title', 'class'],
				attrs = from.get(0).attributes,
				attr,
				i = 0,
				n = attrs.length;
			if (exclude){ Array.prototype.push.apply(nocopy, exclude); }
			for (;i<n; i++){
				attr = attrs.item(i);
				if ($.inArray(attr.nodeName, nocopy)<0){
					to.attr(attr.nodeName, attr.nodeValue);
				}																
			}
		}		
		
		/*
		Disabled.
		This is problematic. I have been in a case where tabs are created on the fly
		but the "state" is still on the panel (or whatever element on which the plugin runs)
		preventing the plugin to execute!
		@author julien@nectil.com
		@since Dec 06, 2011
		*/
		// if ($tabs.data('state'))
		// {
		// 	return;
		// }
		
		if (!alreadyInitialized){			
			$tabs.find('.o-tab:not(#admin)').each(function(i){
				var $this = $(this),
					$a = $('<a class="tab-button no-nav" />').text($this.attr('title')).attr('href', '#'+$this.attr('id')),
						$li = $('<li />').append($a);
			
				copyAttrs($(this), $li);
				
				if (i == select)
				{
					$li.addClass('active');
					state.activeSelector = '#'+$this.attr('id')+'.o-tab';
				}
				else
				{
					$this.hide();
				}
				
				$li.appendTo($nav);
			});
		}
		
		/**
		 * @author julien@nectil.com
		 * @todo state should be on #nav and not on tabs.
		 */
		$tabs.data('state', state);
		
		$tabs.delegate('.tab-button', 'click', function(e){
			var $this = $(this),
				tabSelector = $this.attr('href'),
				$targetTab = $tabs.find(tabSelector),
				state = $tabs.data('state'),
				$prevTab = $tabs.find(state.activeSelector);
				
			e.preventDefault();
			
			if ($this.parent().is('.active') || !$targetTab.length)
			{
				return;
			}
			
			$tabs.trigger('selecttab.otabs', [$targetTab, $prevTab]);
			
			$prevTab.hide();
			$tabs.find('.active').removeClass('active');
			$targetTab.show();
			
			if (!$this.is('.admin-button'))
			{
				$this.parent().addClass('active');
			}
			else
			{
				$this.addClass('active');
				if ($this.data('loaded') === false)
				{
					$this.data('loaded', true);
		        	$targetTab.load(_o.systemURL+'call-operation.php', {
						path		: 'system/class/ElementOperation.class.php',
						className	: 'ElementOperation',
						operation	: 'adminInfo',
						format		: 'html',
						module		: $this.data('module'),
						ID			: $this.data('id')
					}, function(response){						
		        		$(this).removeClass('ajax-loader');		        		
		        	}); 
				}
			}
			
			$tabs.data('state', { activeSelector : tabSelector+'.o-tab' });
		});
				
		return this;
	};
});