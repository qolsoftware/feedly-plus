/* Copyright 2013 Qol Software Inc. All Rights Reserved. */

mystorage = chrome.storage.local;

function insertCss( id, code )
{
    $('head').append('<style id="' + id + '">' + code + '</style>');
}

function removeStyle(id)
{
	$("style#" + id).remove();
}

function toggleSetting(id, value)
{
	var s = settings[id];

	if (value)
	{
		s.apply();
	}
	else if (typeof s.revert === "function")
	{
		s.revert();
	}
}

function applySettings(volatile, value)
{
	var keys = new Array();

	for (var k in settings)
	{
		var s = settings[k];
		if (s.volatile == volatile)
		{
			keys.push(s.id);
		}
	}

	mystorage.get(keys, function(storesettings)
	{
		for (var i=0; i<keys.length; i++)
		{
			var k = keys[i];
			if (storesettings[k])
			{
				toggleSetting(k, value);
			}
		}
	});
}

/**
 * Helper method for finding an added node in mutations.
 */
function findAddedNode(mutations, isMatch)
{
	var match = null;
	
	mutations.forEach(function(mutation)
	{
		if (mutation.addedNodes)
		{
			for (var i=0; i<mutation.addedNodes.length; i++)
			{
				var addedNode = mutation.addedNodes[i];

				if (isMatch(addedNode))
				{
					match = addedNode;
					return false;
				}
			}
		}
	});
	return match;
}

function getOrderedSettingKeys()
{
    var keys = [];
	
	for(var key in settings)
	{
		keys.push(key);
	}
    return keys.sort(function(a, b) { return settings[a].order - settings[b].order; });
}

settings = {};

settings['feedlyplus_boldcat'] =
{
	id : 'feedlyplus_boldcat',
	label : 'Bold counts',
	description : 'Bold counts on left for easier reading.',
	volatile : false,
	order : 1,
	apply : function()
	{
		insertCss(this.id, '#feedlyTabs div.emptyAware:not(.primary), #feedlyTabsHolder div.simpleUnreadCount { font-weight:bold!important; }');
	},
	revert : function()
	{
		removeStyle(this.id);
	}
};

settings['feedlyplus_blackcat'] =
{
	id : 'feedlyplus_blackcat',
	label : 'Black categories & counts',
	description : 'Black categories on left for easier reading.',
	volatile : false,
	order : 1,
	apply : function()
	{
		insertCss(this.id, '#feedlyTabs div.emptyAware:not(.primary), #feedlyTabsHolder div.simpleUnreadCount { color:black!important; opacity:1!important; }');
	},
	revert : function()
	{
		removeStyle(this.id);
	}
};

settings['feedlyplus_removeAllCategory'] =
{
	id : 'feedlyplus_removeAllCategory',
	label : "Remove 'All' category",
	description : "Remove 'All' category and page to avoid marking everything as read by accident.  The 'All' page gets redirected to the 'Index' page.",
	volatile : true,
	order : 2,
	apply : function()
	{
		insertCss(this.id, '#latesttab {display:none;}');

		this.mutationObserver.observe(document.querySelector("#feedlyTitleBar"), {childList : true});
	},
	revert : function()
	{
		removeStyle(this.id);
		this.mutationObserver.disconnect();
	},
	mutationObserver : new MutationObserver(function(mutations)
	{
		titleText = $.trim(document.querySelector("#feedlyTitleBar").firstChild.nodeValue);

		//Redirect to the Index page if the application goes to the All page.
		if (titleText == 'All')
		{
			document.location.href= location.protocol + '//' + location.host + '/#index';
		}
	})
};

settings['feedlyplus_articlesleft'] =
{
	id : 'feedlyplus_articlesleft',
	label : 'Articles align left',
	description : 'Articles align left.',
	volatile : true,
	order : 6,
	apply : function()
	{
		//For Title view articles.
		insertCss(this.id, '.fx .inlineFrame.u0 .u100Entry { margin-left:0; }');
		
		//For Magazine view articles.
		insertCss(this.id, '.fx .container { margin-left:0; }');
	},
	revert : function()
	{
		removeStyle(this.id);
	}
};

settings['feedlyplus_iconunread'] =
{
	id : 'feedlyplus_iconunread',
	label : 'Unread count in icon',
	description : 'Add unread count in icon.',
	volatile : true,
	order : 9,
	apply : function()
	{
		countPublisher.add(this.id);
		chrome.runtime.sendMessage({command: "refreshBadgeText"});
	},
	revert : function()
	{
		countPublisher.remove(this.id);
		chrome.runtime.sendMessage({command: "clearBadgeText"});
	}
};

settings['feedlyplus_iconopen'] =
{
	id : 'feedlyplus_iconopen',
	label : 'Icon click opens Feedly first',
	description : 'If Feedly is already opened, these settings are shown instead.',
	volatile : false,
	order : 10,
	apply : function()
	{
	},
	revert : function()
	{
	}
};

settings['feedlyplus_usehttps'] =
{
	id : 'feedlyplus_usehttps',
	label : 'Use HTTPS',
	description : 'Use secure HTTPS instead of HTTP when opening and contacting Feedly.',
	volatile : false,
	order : 11,
	apply : function()
	{
	},
	revert : function()
	{
	}
};

settings['feedlyplus_4cards'] =
{
	id : 'feedlyplus_4cards',
	label : 'Cards view to 4 columns',
	description : 'Expand Cards view from 3 to 4 columns.',
	volatile : true,
	order : 12,
	apply : function()
	{
		var css = '.fx .entry.u5:nth-child(3n+1) { clear:none; }';
		css += '.fx .entry.u5:nth-child(4n+1) { clear:left; }';
		css += 'div.list-entries { width:1200px; }';
		insertCss(this.id, css);
	},
	revert : function()
	{
		removeStyle(this.id);
	}
};

countPublisher =
{
	names : [],
	add : function(name)
	{
		if (this.names.length == 0)
		{
			this.mutationObserver.observe(document.querySelector('#feedlyChrome__leftnav-wrapper').parentNode, {childList : true, subtree : true, characterData : true, characterDataOldValue : true});
			$(document).on("markPrevious", this.markPreviousListener);	
		}
		this.names.push(name);		
	},
	remove : function(name)
	{
		this.names.splice(this.names.indexOf(name), 1);
		
		if (this.names.length == 0)
		{
			this.mutationObserver.disconnect();
			$(document).off("markPrevious", this.markPreviousListener);
		}
	},
	mutationObserver : new MutationObserver(function(mutations)
	{
		for (var i=0; i<mutations.length; i++)
		{
			var m = mutations[i];

			if (m.target.className.indexOf && m.target.className.indexOf("LeftnavListRow__count") != -1)
			{
				chrome.runtime.sendMessage({command: "setBadgeText", value: m.target.textContent});
			}
		}
	}),
	markPreviousListener : function(e)
	{
		if (e.status == 'begin')
		{
			countPublisher.markLock = true;
		}
		else if (e.status == 'end')
		{
			countPublisher.markLock = false;
			
			//2014-12-13 - Added 3 second delay otherwise Feedly doesn't respond with the updated count.
			//             Will need to add the delta code back in.
			chrome.runtime.sendMessage({command: "refreshBadgeText", delay: 3000});
		}
	},
	markLock : false
};