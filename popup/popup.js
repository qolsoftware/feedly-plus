/* Copyright 2013 Qol Software Inc. All Rights Reserved. */

function save_options()
{
	$(':checkbox').each(function()
	{
		var cb = $(this);
		var obj= {};
		obj[cb.attr('id')] = cb.prop('checked');
		mystorage.set(obj);
	});
}

function restore_options()
{
	$(':checkbox').each(function()
	{
		var cb = $(this);
		var obj= {};
		var id = cb.attr('id');
		mystorage.get(id, function(settings)
		{
			cb.prop('checked', settings[id]);
		});
	});
}

function createEventCode(id, value)
{
	var code = "var evt = document.createEvent('Event');";
	code += "evt.initEvent('FeedlyPlusEvent', true, false);";
	code += "evt.settingid = '" + id + "';";
	code += "evt.settingvalue = " + value + ";";
	code += "document.dispatchEvent(evt);";
	
	return code;
}

function closePopup()
{
	window.close();
}

function goToFeedlyTab(usehttps)
{
	//Go to the first Feedly tab or create one.
	chrome.tabs.query({'url': '*://feedly.com/*'}, function (tabs)
	{
		if (tabs.length > 0)
		{
			var tab = tabs[0];
			chrome.tabs.update(tab.id, {active:true}, closePopup);
		}
		else
		{
			var scheme = usehttps ? 'https' : 'http';
			chrome.tabs.create({url:scheme + '://feedly.com', active:true}, closePopup);
		}
	});
}

function init()
{
	var keys = getOrderedSettingKeys();
	for (var i=0; i<keys.length; i++)
	{
		var s = settings[keys[i]];
		var description = s.description ? s.description : '';
		$('#userSettings').append('<li title="' + description + '"><a><label><input id="' + s.id + '" type="checkbox"/> ' + s.label + '</label></a></li>');
	}
	
	restore_options();
	
	$(':checkbox').click(function()
	{
		save_options();
		var settings_id = $(this).attr('id');
		var settings_value = $(this).prop('checked');
		var eventCode = createEventCode(settings_id, settings_value);
		
		chrome.tabs.query({'url': '*://feedly.com/*'}, function (tabs)
		{
			for (var i=0; i<tabs.length; i++)
			{
				var tab = tabs[i];
				chrome.tabs.executeScript(tab.id, {code:eventCode});
			}
		});
	});
	
	$('#moreLinks').append('<li title="See what\'s new in this version."><a id="' + chrome.extension.getURL("") + 'version.html"><label>Version: ' + chrome.app.getDetails().version + '</label></a></li>');
	$('#moreLinks').append('<li title="Send us feedback!"><a id="mailto:qolsoftware@gmail.com?subject=Feedly%20Plus"><label>qolsoftware@gmail.com</label></a></li>');
	
	$('#moreLinks a').click(function()
	{
		openLocalHtml(this.id);
	});
}

function openLocalHtml(url)
{
	chrome.tabs.create({url: url});
	window.close();
}

$(function()
{
    chrome.tabs.getSelected(window.id,function(tab)
	{
        chrome.browserAction.getBadgeText({tabId:tab.id}, function(text)
		{
			if(text == 'New')
			{
				chrome.browserAction.setBadgeText({text:""});
				localStorage['isClickedOnNew'] = 'true';
				localStorage['version'] = chrome.app.getDetails().version;
            }
        });
    });


	chrome.storage.local.get(['feedlyplus_iconopen', 'feedlyplus_usehttps'], function(settings)
	{
		if (localStorage['isClickedOnNew'] && settings['feedlyplus_iconopen'])
		{
			chrome.tabs.query({currentWindow: true, active: true }, function (tabs)
			{
				var tab = tabs[0];
				
				//If the current tab is not Feedly, go to the first Feedly tab or create one.
				if (tab.url.indexOf('feedly.com') < 0)
				{
					goToFeedlyTab(settings['feedlyplus_usehttps']);
				}
			});
		}
		init();
	});
});

