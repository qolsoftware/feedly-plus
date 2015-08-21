/* Copyright 2013 Qol Software Inc. All Rights Reserved. */

settings['feedlyplus_markprevious'] =
{
	id : 'feedlyplus_markprevious',
	label : 'Mark previous as read &nbsp;(shift+w)',
	description : ' Mark previous as read link and keyboard shortcut (shift+w).',
	volatile : true,  //Needs to be run last to wait for the #feedlyPart0 element to appear and has a MutationObserver.
	order : 4,
	apply : function()
	{
		document.addEventListener('keypress', this.handleKeyPress);
		this.mutationObserver.observe(document.querySelector('#feedlyPart0'), {childList : true, subtree : true});
		this.magazineObserver.observe(document.querySelector('#feedlyPart0'), {childList : true, subtree : true});
		this.createArticleMarkPreviousLink();
	},
	revert : function()
	{
		document.removeEventListener('keypress', this.handleKeyPress);
		this.mutationObserver.disconnect();
		this.magazineObserver.disconnect();
		$('#feedlyplus_markpreviouslink').remove();
	},
	handleKeyPress : function(e)
	{
		//Obviously if they are typing text we ignore.
		if (e.target.nodeName.match(/^(textarea|input)$/i))
		{
			return;
		}

		//Can only do the keyboard command if there is an open article.
		var openArticle = getOpenArticle();
		if (e.shiftKey && String.fromCharCode(e.charCode||e.which).toLowerCase() == 'w' && openArticle.length > 0 && canMarkPreviousAsRead(openArticle.getArticleId()))
		{
			$('#feedlyplus_markpreviouslink .action').click();
		}
	},
	mutationObserver : new MutationObserver(function(mutations)
	{
		if (findAddedNode(mutations, function(n) { return n.id && n.id.match("_inlineframe$");}) != null)
		{
			settings['feedlyplus_markprevious'].createArticleMarkPreviousLink();
		}
	}),
	magazineObserver : new MutationObserver(function(mutations)
	{
		if (findAddedNode(mutations, function(n) { var a = $(n); return a.hasClass('u4Entry') || a.hasClass('topRecommendedEntry');}))
		{
			var spn = $('<span class="action" id="magMarkPrevious" title="mark previous as read">mark previous as read</span>');
			spn.click(function(event) 
			{
				event.stopPropagation();
				
				var article = $(event.target).closest('div.u4Entry, div.topRecommendedEntry');
				settings['feedlyplus_markprevious'].markPreviousAs(true, article.data('actionable'), function()
				{
					//Close any sliders as it interferes.  Magazine view featured articles have sliders.
					if ($('div.floatingEntryOverlay').length > 0)
					{
						clickArticle(getArticleById($('div.floatingEntryScroller div.u100Entry').data('entryid')));
					}
				
					//Open and close the article because in magazine view we mark the current as read too.
					clickArticle(article);
					clickArticle(article);
					
					settings['feedlyplus_markprevious'].unlock();
				});
			});
			
			//Need to change the overflow style because a lot of times the source and author names are already
			//so long that the mark previous gets cut off if the overflow is hidden.  This can't be done in CSS
			//because the style is right on the element itself.
			$('div.metadata').css('overflow', 'visible');
			
			//Make sure the mark previous span hasn't already been added.
			$('div.metadata .wikiBar:not(:has(span#magMarkPrevious))').append('<span style="color:#CFCFCF">&nbsp;//&nbsp;</span>').append(spn);
		}
	}),

	createArticleMarkPreviousLink : function()
	{
		var markReadStatus = this.markReadStatus;
		var openArticle = getOpenArticle();
		var articleId = openArticle.getArticleId();
		var markLabel = 'mark previous as read';
		
		if (openArticle.length == 0)
		{
			return;
		}
		
		//Check if we are in the middle of a mark transaction.
		if (markReadStatus.lock)
		{
			//The original article is showing so end the transaction.
			if (markReadStatus.id == articleId)
			{
				markLabel =  markReadStatus.read ? 'undo mark previous' : markLabel;
				this.unlock();
			}
			else
			{
				//No need to render anything since we are in a transaction and thus clicking
				//through potentially hundreds of items.
				return;
			}
		}
		//Not in a transaction so check if the mark previous link is allowed here.
		else if (!canMarkPreviousAsRead(articleId))
		{
			return;
		}
		else
		{
			//Free up memory since a new article has opened.
			this.undoArticles = null;
		}
	
		var span = $('<span class="action">' + markLabel + '</span>');
		span.click(function()
		{
			settings['feedlyplus_markprevious'].markPreviousAs($(this).text().indexOf('undo') != 0, articleId, function ()
			{
				//Go back and expand the original.
				clickArticle(getArticleById(articleId));
			});
		});
		
		var wrapper = $('<span id="feedlyplus_markpreviouslink"> &nbsp;//&nbsp; </span>');
		wrapper.append(span);
		openArticle.find('div.entryHeader div.metadata').append(wrapper);
	},
	markPreviousAs : function(read, articleId, callback)
	{
		var scrollPos = $(document).scrollTop();
		
		var modal = $("<div class='modal'></div>");
		modal.prependTo(document.body);
		
		var previous = read ? getPreviousUnread(articleId) : this.undoArticles;

		//Delay it some milliseconds to give the browser a chance to render
		//the modal loading image when there is a larger number of articles.
		var delay = previous.length < 20 ? 30 : 80;		
		setTimeout(function ()
		{
			var sett = settings['feedlyplus_markprevious'];
			
			sett.lock(read, articleId);
			
			if (read)
			{
				markAsRead(previous);
				sett.undoArticles = previous;
			}
			else
			{
				markAsUnread(previous);
			}
			
			if (callback)
			{
				callback();
			}
			
			modal.remove();
			
			$(document).scrollTop(scrollPos);

		}, delay);
	},
	markReadStatus : {lock : false, read : null, id : ''},
	lock : function(read, id)
	{
		this.markReadStatus.lock = true;
		this.markReadStatus.id = id;
		this.markReadStatus.read = read;
		$.event.trigger({type: "markPrevious", status: "begin"});
	},
	unlock : function()
	{
		this.markReadStatus = {lock : false, read : null, id : ''};
		$.event.trigger({type: "markPrevious", status: "end"});
	},
	undoArticles : null
};