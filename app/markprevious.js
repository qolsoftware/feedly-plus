/* Copyright 2013 Qol Software Inc. All Rights Reserved. */

function getArticleById(id)
{
	return $('#mainArea').find('div.u4Entry, div.u0Entry, div.topRecommendedEntry').filter(function(index, element) 
	{
		return $(element).data('actionable') == id;
	});
}

function getPreviousUnread(articleId)
{
	var article = getArticleById(articleId);
	var unreadSelector = 'a.title.unread';
	
	var stop = false;
	var previous = $('div#mainArea div.u4Entry, div#mainArea div.u0Entry, div#mainArea div.topRecommendedEntry').filter(function(index, element)
	{
		var jElem = $(element);

		if (jElem.data('actionable') == articleId)
		{
			//Found the clicked element so reject all subsequent siblings.
			stop = true;
		}
		else if (jElem.find(unreadSelector).length == 0)
		{
			//Make sure it hasn't already been read.  The reason we need to do this
			//here, instead of the above filter selector, is because the user could
			//have clicked on the mark previous link of an open article.
			return false;
		}

		return !stop;
	});

	return previous;
}

function markAsRead(articles)
{
	markAs(articles, true);
}

function markAsUnread(articles)
{
	markAs(articles, false);
}

function markAs(articles, read)
{
	//console.log('**** MarkAs: ' + articles.length);

	//This is just a terrible hack to get around the slider issue in Magazine view.  When you have 3 featured
	//articles at the top, then try to mark previous on any u4Entry, any articles between the u4Entry and
	//the featured articles will not get clicked properly because of the slider.  So, as a work around,
	//here we reverse the order so that the featured articles with sliders get clicked last.
	if (articles.filter('div.topRecommendedEntry').length > 0)
	{
		articles = $(articles.get().reverse());
	}
	
	articles.each(function()
	{
		clickArticle($(this));

		if (!read)
		{
			$("span[data-page-entry-action='keepEntryAsUnread']").click();
		}
	});
}

function getCurrentView()
{
	var timeline = $('#timeline');
	return timeline.hasClass('u0EntryList') ? 'title' : timeline.hasClass('u4EntryList') ? 'magazine' : 'unknown';
}

function clickArticle(element)
{
	//This function used to do more until we found a simpler way to click
	//articles.  But still good to leave the click abstracted out because
	//multiple functions call this.
	element.find('span:first').click();
}

function getOpenArticle()
{
	var openArticle = $('div.inlineFrame');
	openArticle.getArticleId = function()
	{
		return this.data('uninlineentryid');
	};
	return openArticle;
}

function canMarkPreviousAsRead(articleId)
{
	var view = getCurrentView();

	if (view != 'magazine' && view != 'title')
	{
		return false;
	}
	
	//Needs to have some previous unread items.
	var previous = getPreviousUnread(articleId);
	if (previous.length == 0)
	{
		return false;
	}
	
	return true;
}
