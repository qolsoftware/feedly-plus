/* Copyright 2013 Qol Software Inc. All Rights Reserved. */

function getArticleById(id)
{
	return $("div.u0[data-entryid='" + id + "']");
}

function getArticleId(article)
{
	var id = article.attr('id');
	return id.substr(0, id.length - "_main".length);
}

function getPreviousUnread(articleId)
{
	var article = getArticleById(articleId);

	var stop = false;
	var previous = $('div.u0, div.u4, div.u5').filter(function(index, element)
	{
		var jElem = $(element);

		if (getArticleId(jElem) == articleId)
		{
			//Found the clicked element so reject all subsequent siblings.
			stop = true;
		}
		else if (jElem.hasClass('read'))
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

function markAs(articles, read, callbackStack)
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
	
	var view = getCurrentView();

	var time = 0;
	
	//2016-02-29 - Feedly or maybe even Chrome  made an update where clicking the article was happening
	//too fast and not registering the events.  So here we add a 1 millisecond delay.
	var timeIncrement = 5;

	articles.each(function()
	{
		time += timeIncrement;
		
		var article = $(this);
		setTimeout
		(
			function() 
			{
				clickArticle(article, view);
			}, 
			time
		);
		
		if (!read)
		{
			time += timeIncrement;
			
			setTimeout
			(
				function() 
				{
					$("span[data-page-entry-action='keepEntryAsUnread']").click();
				}, 
				time
			);			
		}
	});
	
	if (callbackStack)
	{
		while((c = callbackStack.shift()) != null)
		{
			time += timeIncrement;
			setTimeout(c, time);
		}		
	}
}


function getCurrentView()
{
	var board = $('.board');

	if (board.hasClass('presentation-0'))
	{
		return 'title';
	}
	else if (board.hasClass('presentation-4'))
	{
		return 'magazine';
	}
	else if (board.hasClass('presentation-5'))
	{
		return 'cards';
	}
	return 'unknown';
}

function clickArticle(element, view)
{
	if (view == null)
	{
		view = getCurrentView();
	}
	
	if (view == 'magazine' || view == 'cards')
	{
		element.find('button.mark-as-read:first').click();
		return;
	}

	//console.log('**** Clicking: ' + element.find('span:first'));
	element.find('span:first').trigger('click');
}


function sleepFor( sleepDuration )
{
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}


function getOpenArticle()
{
	var openArticle = $('div.inlineFrame.selected.u0, div.inlineFrame.selected.u4');
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
