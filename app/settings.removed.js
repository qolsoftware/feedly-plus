settings['feedlyplus_speedgiant'] =
{
	id : 'feedlyplus_speedgiant',
	label : "Faster giant mark as read button",
	description : 'Speed up giant mark as read button.',
	volatile : true,  //Needs to wait for the #aboutArea element and has a MutationObserver.
	order : 7,
	apply : function()
	{
		$('#bigMarkAsReadHandle').click(this.clickHandler);
		this.mutationObserver.observe(document.querySelector("#aboutArea"), {childList : true, subtree : true});		
	},
	revert : function()
	{
		this.mutationObserver.disconnect();
		$('#bigMarkAsReadHandle').unbind('click');
	},
	mutationObserver : new MutationObserver(function(mutations)
	{
		var addedNode = findAddedNode(mutations, function(n) { return n.id == 'bigMarkAsReadHandle';});
		if (addedNode)
		{
			$(addedNode).click(settings['feedlyplus_speedgiant'].clickHandler);
		}
	}),
	clickHandler : function()
	{
		$('#pageActionMarkAsRead').click();
		return false;
	}
};


settings['feedlyplus_pagewidth'] =
{
	id : 'feedlyplus_pagewidth',
	label : 'Full width on all pages',
	description : 'Full width on all pages (Index, Organize, etc).  Page widths changing all the time made us dizzy.',
	volatile : false,
	order : 5,
	apply : function()
	{
		insertCss(this.id, '#feedlyFrame{ width:auto!important; } \
							#feedlyPage{ width:100%!important; }');
	},
	revert : function()
	{
		removeStyle(this.id);
	}
};


settings['feedlyplus_removeCategoryCountLink'] =
{
	id : 'feedlyplus_removeCategoryCountLink',
	label : 'Remove category count link',
	description : "Remove 'mark all as read' links on unread counts to avoid marking the category as read by accident.",
	volatile : true,  //Needs to run after unread counts are all fully loaded asynchronously and has a MutationObserver.
	order : 3,
	apply : function()
	{
		insertCss(this.id, '#feedlyTabsHolder:hover div.LeftnavListRow__count:hover { text-decoration: none; background-color: inherit; }');
		this.mutationObserver.observe(document.querySelector('#feedlyTabs'), {childList : true, subtree : true});
		this.disableLinks();
	},
	revert : function()
	{
		removeStyle(this.id);
		this.mutationObserver.disconnect();
		$('.LeftnavListRow__count').unbind('click');
	},
	mutationObserver : new MutationObserver(function(mutations)
	{
		settings['feedlyplus_removeCategoryCountLink'].disableLinks();
	}),
	disableLinks : function()
	{
		//Removes the link that lets you mark a category as read when you click on the unread count.
		$('.LeftnavListRow__count').each(function()
		{
			$(this).bind('click', function()
			{
				var sibSelector = $(this).hasClass('categoryUnreadCount') ? '.label' : '.feedIndexTitleHolder';
				$(this).siblings(sibSelector).click();
				return false; 
			});
			$(this).removeAttr('title');
		});
	}
};