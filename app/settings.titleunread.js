/* Copyright 2013 Qol Software Inc. All Rights Reserved. */

settings['feedlyplus_titleunread'] =
{
	id : 'feedlyplus_titleunread',
	label : 'Unread count in tab title',
	description : 'Add unread count in tab title.',
	volatile : true,  //Needs to run after unread counts are all fully loaded asynchronously and has mutation observers.
	order : 8,
	apply : function()
	{
		countPublisher.add(this.id);
		
		chrome.runtime.onMessage.addListener(this.onMessageListener);
		this.sendRefreshUnreadMessage();
	
		this.titleMutationObserver.observe(document.querySelector('#feedlyTitleBar'), {childList : true});
	},
	revert : function()
	{
		countPublisher.remove(this.id);
	
		chrome.runtime.onMessage.removeListener(this.onMessageListener);

		
		this.lastCount = null;		
		this.setTitle(null);
	},
	titleMutationObserver : new MutationObserver(function(mutations)
	{
		//Set the title to the last count since the user may have changed category.
		settings['feedlyplus_titleunread'].setTitle(settings['feedlyplus_titleunread'].lastCount);
		
		//Just in case, make sure the count is up to date.
		settings['feedlyplus_titleunread'].sendRefreshUnreadMessage();
	}),
	sendRefreshUnreadMessage : function()
	{	
		chrome.runtime.sendMessage({command: "refreshBadgeText"});
	},
	onMessageListener : function(request, sender, sendResponse)
	{
		if (request.command == 'unreadcount')
		{
			//console.log('*** titleunread.onMessageListener receeived unreadcount: ' + request.value);
			settings['feedlyplus_titleunread'].setTitle(request.value);
			settings['feedlyplus_titleunread'].lastCount = request.value;
		}
	},
	lastCount : null,
	setTitle : function(unreadCount, delta)
	{
		if (delta && this.lastCount != null)
		{
			unreadCount = parseInt(this.lastCount) + delta;
			this.lastCount = unreadCount;
		}
		var prefix = (unreadCount == null) ? '' : '(' + unreadCount + ') ';
		document.title = prefix + this.getCleanTitle();
	},
	getCleanTitle : function()
	{
		var title = document.title;
		var pindex = title.indexOf(') ');
		return title[0] == '(' && pindex > 0 ? title.substring(pindex + 2) : title;
	}
};