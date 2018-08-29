/* Copyright 2013 Qol Software Inc. All Rights Reserved. */


function setFeedlyAccessToken(details)
{
	var requestHeaders = details.requestHeaders;
	for (var i=0; i<requestHeaders.length; i++)
	{
		var h = requestHeaders[i];

		if (h.name === 'Authorization')
		{
			localStorage.setItem('oauth', h.value);
			refreshBadgeText();
			return;
		}
    }
}

function isNumber(n)
{
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function abbreviateNumber(value)
{
    var newValue = value;
    if (value >= 1000)
	{
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--)
		{
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

currentBadgeValue = null;

function setBadgeText(value)
{
	chrome.storage.local.get('feedlyplus_iconunread', function(settings)
	{
		if (typeof localStorage['isClickedOnNew'] != "undefined" && localStorage['isClickedOnNew'] && settings['feedlyplus_iconunread'])
		{
			currentBadgeValue = value;
			
			var badgeText = '';
			
			if (isNumber(value))
			{
				badgeText = value > 9999 ? abbreviateNumber(value) : value.toString();
			}
			
			//console.log('*** setting badge text: ' + badgeText);
			chrome.browserAction.setBadgeText({text: badgeText});
		}
		
		chrome.tabs.query({'url': '*://feedly.com/*'}, function (tabs)
		{
			for (var i=0; i<tabs.length; i++)
			{
				var tab = tabs[i];
				
				chrome.tabs.sendMessage(tabs[i].id, {command: "unreadcount", value: value.toString()});
			}
		});		
	});
}

function parseUnreadCounts(response)
{
	var unreadcounts = JSON.parse(response).unreadcounts;
	for (var i=0; i<unreadcounts.length; i++)
	{
		var uc = unreadcounts[i];

		if (uc.id.match(/^user\/[\da-f-]+?\/category\/global\.all$/))
		{
			return uc.count;
		}
	}
}

function refreshBadgeText()
{
	if(localStorage.getItem('oauth'))
	{
		chrome.storage.local.get('feedlyplus_usehttps', function(settings)
		{
			//2014-12-13 - Disabling https for now because the Feedly api is down.
			//var scheme = settings['feedlyplus_usehttps'] ? 'https' : 'http';
			var scheme = 'http';
			var xhr = new XMLHttpRequest();
			xhr.open('GET', scheme + '://feedly.com/v3/markers/counts');

			xhr.onreadystatechange = function()
			{
				if (this.readyState === 4)
				{
					setBadgeText(this.status === 200 ? parseUnreadCounts(this.response) : '');
				}
			};
			xhr.setRequestHeader('Authorization', localStorage.getItem('oauth'));
			xhr.send();		
		});
	}
	else
	{
		setBadgeText('');
	}
}


//This listener never gets removed because we want the stored token to change
//in incognito mode or when the user logs out.
chrome.webRequest.onBeforeSendHeaders.addListener(setFeedlyAccessToken, {urls: ['*://feedly.com/v3/subscriptions*']}, ['requestHeaders']);

chrome.alarms.onAlarm.addListener(function(alarm)
{
	if (alarm.name === 'feedlyplus_badge')
	{
		refreshBadgeText();
	}
});

chrome.alarms.create('feedlyplus_badge', {periodInMinutes: 5});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	//console.log('***** received message command: ' + request.command);

	if (request.command == "deltaBadgeText")
	{
		setBadgeText(currentBadgeValue + parseInt(request.delta));
	}
	else if (request.command == "setBadgeText")
	{
		setBadgeText(parseInt(request.value));
	}
	else if (request.command == 'refreshBadgeText')
	{
		var delay = request.delay ? request.delay : 0;

		setTimeout(function ()
		{
			refreshBadgeText();
		}, delay);
	}
	else if (request.command == "clearBadgeText")
	{
		chrome.browserAction.setBadgeText({text: ''});
	}
});


if (localStorage['version'] != chrome.app.getDetails().version)
{
	chrome.browserAction.setBadgeText({text:"New"});
}
