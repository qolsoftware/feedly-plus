/* Copyright 2013 Qol Software Inc. All Rights Reserved. */


function startVolatileSettingsObserver()
{
	//Volatile settings need to added after the page has fully rendered.
    var observer = new MutationObserver(function(mutations)
	{
		if ($('.simpleUnreadCount').length > 0)
		{
			applySettings(true, true);
			observer.disconnect();
		}
    });
    
    observer.observe(document.body, {childList: true, subtree: true});
}

function startLoginObserver()
{
	//This observer runs forever to monitor logging in and outs.  There are very few
	//document body childList observations so this is should have no performance impact.
    var observer = new MutationObserver(function(mutations)
	{
		if ($('.streamUnreadCount').length == 0 && loggedIn)
		{
			//We just logged out so disable the volatile observers.
			loggedIn = false;
			applySettings(true, false);
		}
		else if ($('.streamUnreadCount').length > 0 && !loggedIn)
		{
			//We just logged in.
			loggedIn = true;
			startVolatileSettingsObserver();
		}	
    });
    
    observer.observe(document.body, {childList: true});
}

function init()
{
	startLoginObserver();
	
	//Apply settings that aren't volatile.
	applySettings(false, true);
	
	document.addEventListener('FeedlyPlusEvent', function(e)
	{
		toggleSetting(e.settingid, e.settingvalue);
	});
}

loggedIn = false;

init();
