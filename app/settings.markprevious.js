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
		this.titleViewObserver.observe(document.querySelector('#feedlyPart0'), {childList : true, subtree : true});
		this.magazineViewObserver.observe(document.querySelector('#feedlyPart0'), {childList : true, subtree : true});
		this.cardsViewObserver.observe(document.querySelector('#feedlyPart0'), {childList : true, subtree : true});
		this.createArticleMarkPreviousLink();
		
		insertCss(this.id, 'div.u5Entry { height:auto!important; }');
	},
	revert : function()
	{
		document.removeEventListener('keypress', this.handleKeyPress);
		this.titleViewObserver.disconnect();
		this.magazineViewObserver.disconnect();
		this.cardsViewObserver.disconnect();
		$('#feedlyplus_markpreviouslink').remove();
		
		removeStyle(this.id);
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
	titleViewObserver : new MutationObserver(function(mutations)
	{
		if (findAddedNode(mutations, function(n) { return n.id && n.id.match("_inlineframe$");}) != null)
		{
			settings['feedlyplus_markprevious'].createArticleMarkPreviousLink();
		}
	}),
	magazineViewObserver : new MutationObserver(function(mutations)
	{
		if (findAddedNode(mutations, function(n) { var a = $(n); return a.hasClass('u4Entry') || a.hasClass('topRecommendedEntry');}))
		{
			var spn = $('<span class="action" id="magMarkPrevious" title="mark previous as read">mark previous as read</span>');
			spn.click(function(event) 
			{
				event.stopPropagation();
				
				var article = $(event.target).closest('div.u4Entry, div.topRecommendedEntry');
				
				var callbackStack = [];
				callbackStack.push(function()
				{
					//Close any sliders as it interferes.  Magazine view featured articles have sliders.
					if ($('div.floatingEntryOverlay').length > 0)
					{
						clickArticle(getArticleById($('div.floatingEntryScroller div.u100Entry').data('entryid')));
					}
				});
				
				//Open and close the article because in magazine view we mark the current as read too.
				callbackStack.push(function() {clickArticle(article);});
				callbackStack.push(function() {clickArticle(article);});
				callbackStack.push(function() {settings['feedlyplus_markprevious'].unlock();});
					
				settings['feedlyplus_markprevious'].markPreviousAs(true, article.data('actionable'), callbackStack);
			});
			
			//Need to change the overflow style because a lot of times the source and author names are already
			//so long that the mark previous gets cut off if the overflow is hidden.  This can't be done in CSS
			//because the style is right on the element itself.
			$('div.metadata').css('overflow', 'visible');
			
			//Make sure the mark previous span hasn't already been added.
			$('div.metadata .wikiBar:not(:has(span#magMarkPrevious))').append('<span style="color:#CFCFCF">&nbsp;//&nbsp;</span>').append(spn);
		}
	}),
	cardsViewObserver : new MutationObserver(function(mutations)
	{
		if (findAddedNode(mutations, function(n) { var a = $(n); return a.hasClass('u5Entry') || a.hasClass('topRecommendedEntry');}))
		{
			var spn = $('<span class="action" id="cardMarkPrevious" title="mark previous as read">mark previous as read</span>');
			spn.click(function(event) 
			{
				event.stopPropagation();
				
				var article = $(event.target).closest('div.u5Entry, div.topRecommendedEntry');

				var callbackStack = [];
				
				//Mark the clicked on article as read too.
				callbackStack.push(function() {	clickArticle(article); });
				
				callbackStack.push(function() {	settings['feedlyplus_markprevious'].unlock(); });
					
				settings['feedlyplus_markprevious'].markPreviousAs(true, article.data('actionable'), callbackStack);
			});
			
			//Make sure the mark previous span hasn't already been added.
			$('div.u5Entry div.wikiBar:not(:has(span#cardMarkPrevious))').append('<br/>').append(spn);
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
			var callbackStack = [];
			callbackStack.push(function ()
			{
				//Go back and expand the original.
				clickArticle(getArticleById(articleId));
			});

			settings['feedlyplus_markprevious'].markPreviousAs($(this).text().indexOf('undo') != 0, articleId, callbackStack);
		});

		var wrapper = $('<span id="feedlyplus_markpreviouslink"> &nbsp;//&nbsp; </span>');
		wrapper.append(span);

		//Need to set delay because Feedly changed something again that causes a timing issue.
		setTimeout(function()
		{
			openArticle.find('div.entryHeader div.metadata').append(wrapper);
		}, 1);
	},
	markPreviousAs : function(read, articleId, callbackStack)
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
			
			if (!callbackStack)
			{
				callbackStack = [];
			}

			callbackStack.push(function()
			{
				if (read)
				{
					sett.undoArticles = previous;
				}

				modal.remove();
				
				$(document).scrollTop(scrollPos);
			});

			markAs(previous, read, callbackStack);
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