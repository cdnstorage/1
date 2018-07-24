(function() {
	'use strict';

	var selectedTab = {};
	var selectedTabContent = {};

	var appOnline;
	var appPageJSON;

	var appHistory = [];
	var appHistoryIndex = 0;

	var appType;

	var isUndefined = function(variable) {
		return typeof variable === 'undefined';
	};

	var ajaxGet = function(path, callback) {
		var ajax = new XMLHttpRequest();
		ajax.open('get', path, true);
		ajax.setRequestHeader('x-api', appType);
		if (callback !== null) {
			ajax.addEventListener('readystatechange', callback);
		}
		ajax.send();
	};

	var ajaxPost = function(path, data, callback) {
		var ajax = new XMLHttpRequest();
		ajax.open('post', path, true);
		ajax.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
		ajax.setRequestHeader('x-api', appType);
		if (callback !== null) {
			ajax.addEventListener('readystatechange', callback);
		}
		ajax.send(data);
	};

	var preload = function() {
		ajaxPost('/api/v1/content.php', 'CONTENT_ID=' + this.getAttribute('data-id'), null);
		this.removeEventListener('mouseenter', preload);
	};

	var getImageSource = function(KINOPOISK_ID, WORLDART_ID) {
		return KINOPOISK_ID === null ? '/png/0' : '/jpeg/' + KINOPOISK_ID;
	};

	var select = function(textContent, dataId, id) {
		var li = document.createElement('li');
		var a = document.createElement('a');

		a.textContent = textContent;
		a.setAttribute('data-id', dataId);
		li.appendChild(a);
		window[id].appendChild(li);
		return window[id].lastElementChild.lastElementChild;
	};

	var sourceTagHTML = function(textContent) {
		var span = document.createElement('span');
		span.classList.add('tag', 'is-dark');
		span.textContent = textContent;
		return span;
	};

	var tagHTML = function(textContent) {
		var a = document.createElement('a');
		a.classList.add('tag');
		a.textContent = textContent;
		return a;
	};

	var cardTextHTML = function(element, strongText, textValue) {
		if (isUndefined(textValue) === false) {
			var strong = document.createElement('strong');
			var text = document.createTextNode(textValue);
			var br = document.createElement('br');
			strong.textContent = strongText;
			element.appendChild(strong);
			element.appendChild(text);
			element.appendChild(br);
		}
	};

	var insertCard = function(id, data) {
		window[id].appendChild(window['x-card-template'].content.cloneNode(true));

		var node = window[id].lastElementChild;
		var text = node.querySelector('.js-text');
		
		node.querySelector('.js-poster').setAttribute('src', getImageSource(data['KINOPOISK_ID'], data['WORLDART_ID']));
		node.querySelector('.js-title').textContent = data['TITLE'];

		cardTextHTML(text, 'Год: ', data['YEAR']);
		cardTextHTML(text, 'Качество: ', data['SOURCE_TYPE']);
		cardTextHTML(text, 'Перевод: ', data['TRANSLATOR']);
		cardTextHTML(text, 'Сезон: ', data['SEASON']);
		cardTextHTML(text, 'Серия: ', data['EPISODE']);
		cardTextHTML(text, 'КиноПоиск: ', data['RATING_KINOPOISK']);
		cardTextHTML(text, 'IMDb: ', data['RATING_IMDB']);
		
		node.setAttribute('data-id', data['CONTENT_ID']);
		node.addEventListener('click', function() {
			showContentPage(this.getAttribute('data-id'), null);
		});
		node.addEventListener('mouseenter', preload);
	};

	var insertCards = function(prefix) {
		for (var i = 0, iMax = appPageJSON.length; i !== iMax; i++) {
			var id = prefix + i.toString();

			while (window[id].firstChild !== null) {
				window[id].removeChild(window[id].firstChild);
			}

			for (var j = 0, jMax = appPageJSON[i].length; j !== jMax; j++) {
				insertCard(id, appPageJSON[i][j]);
			}
		}
	};

	var insertContentTags = function(argument) {
		if (isUndefined(argument) === false) {
			for (var i = 0, length = argument.length; i !== length; i++) {
				window['x-content-tags'].appendChild(tagHTML(argument[i]['NAME']));
			}
		}
	};

	var showError = function(errorText) {
		window['x-error-modal'].classList.add('is-active');
		window['x-error-modal-text'].textContent = errorText;		
	};

	var startApp = function(type) {
		appType = type;
		window['x-sites-modal'].classList.remove('is-active');
		var historyJSON = window.sessionStorage.getItem('history-' + appType);
		if (historyJSON !== null) {
			appHistory = JSON.parse(historyJSON);
			appHistoryIndex = appHistory.length - 1;
		}
		showPageFromCache();
	};

	var activateTab = function(pageId, tabId, contentId) {
		window[tabId].addEventListener('click', function() {
			window[selectedTab[pageId]].classList.remove('is-active');
			selectedTab[pageId] = tabId;
			window[selectedTab[pageId]].classList.add('is-active');

			window[selectedTabContent[pageId]].classList.add('is-hidden');
			selectedTabContent[pageId] = contentId;
			window[	selectedTabContent[pageId]].classList.remove('is-hidden');
		});
	};

	var preparePage = function(functionName, argumentsArray, pageId) {
		window['x-pageloader'].classList.add('is-active');
		window['x-guest-page'].classList.add('is-hidden');
		window['x-online-page'].classList.add('is-hidden');
		window['x-content-page'].classList.add('is-hidden');
		window['x-main-page'].classList.add('is-hidden');
		window['x-search-page'].classList.add('is-hidden');
		window['x-user-page'].classList.add('is-hidden');

		window[pageId].classList.remove('is-hidden');

		window['x-online-iframe'].removeAttribute('src');

		if (appHistoryIndex === 0) {
			window['x-previous'].classList.add('is-hidden');
		} else {
			window['x-previous'].classList.remove('is-hidden');
		}

		appHistory[appHistoryIndex++] = {
			'function': functionName,
			'arguments': argumentsArray
		};

		window.sessionStorage.setItem('history-' + appType, JSON.stringify(appHistory));
	};

	var showPageFromCache = function() {
		if (appHistoryIndex === 0) {
			return showMainPage();
		} else if (appHistory[appHistoryIndex]['arguments'].length === 0) {
			return window[appHistory[appHistoryIndex]['function']]();
		} else if (appHistory[appHistoryIndex]['arguments'].length === 1) {
			return window[appHistory[appHistoryIndex]['function']](appHistory[appHistoryIndex]['arguments'][0]);
		} else if (appHistory[appHistoryIndex]['arguments'].length === 2) {
			return window[appHistory[appHistoryIndex]['function']](appHistory[appHistoryIndex]['arguments'][0], appHistory[appHistoryIndex]['arguments'][1]);
		} else {
			return showMainPage();
		}
	};

	var showPreviousPage = function() {
		appHistoryIndex--;
		appHistoryIndex--;
		appHistory.pop();
		window.sessionStorage.setItem('history-' + appType, JSON.stringify(appHistory));
		
		return showPageFromCache();
	};

	window['showGuestPage'] = function() {
		preparePage('showGuestPage', [], 'x-guest-page');

		window['x-pageloader'].classList.remove('is-active');
	};

	window['showOnlinePage'] = function(argument) {
		if (typeof argument === 'string') {
			appOnline = argument;
		}

		window['x-online-iframe-container'].classList.add('is-hidden');
		window['x-online-sources'].classList.add('is-hidden');
		window['x-online-menu'].classList.add('is-hidden');

		preparePage('showOnlinePage', [appOnline], 'x-online-page');

		var selectedSource = null;
		var selectedTranslator = null;
		var selectedSeason = null;
		var selectedEpisode = null;
		ajaxPost('/api/v1/online.php', appOnline, function() {
			if (this.readyState === 4 && this.status === 200) {
				appPageJSON = JSON.parse(this.response);

				if (isUndefined(appPageJSON['GUEST']) === false) {
					showGuestPage();
				} else if (isUndefined(appPageJSON['ERROR']) === false) {
					showError(appPageJSON['TEXT']);
				} else if (appType === '0') {
					while (window['x-online-sources'].firstChild !== null) {
						window['x-online-sources'].removeChild(window['x-online-sources'].firstChild);
					}

					for (var i = 0, iMax = appPageJSON.length; i !== iMax; i++) {
						window['x-online-sources'].appendChild(window['x-source-template'].content.cloneNode(true));
						
						var node = window['x-online-sources'].lastElementChild;
						var tags = node.querySelector('.js-tags');
						var button = node.querySelector('.js-button');

						node.querySelector('.js-translator').textContent = appPageJSON[i]['TRANSLATOR'];
						tags.appendChild(sourceTagHTML('Сервер №' + appPageJSON[i]['SERVER']));
						tags.appendChild(sourceTagHTML('Дата: ' + appPageJSON[i]['TIMESTAMP']));
						tags.appendChild(sourceTagHTML('Качество: ' + appPageJSON[i]['SOURCE_TYPE']));

						if (isUndefined(appPageJSON[i]['BAD_QUALITY']) === false && appPageJSON[i]['BAD_QUALITY'] === '1') {
							tags.appendChild(sourceTagHTML('Плохое качество'));
						}
						if (isUndefined(appPageJSON[i]['INSTREAM_ADS']) === false && appPageJSON[i]['INSTREAM_ADS'] === true) {
							tags.appendChild(sourceTagHTML('Встроенная реклама'));
						}
						if (isUndefined(appPageJSON[i]['DIRECTORS_VERSION']) === false && appPageJSON[i]['DIRECTORS_VERSION'] === '1') {
							tags.appendChild(sourceTagHTML('Расширенная версия'));
						}

						button.setAttribute('data-url', appPageJSON[i]['DATA']);
						button.addEventListener('click', function() {
							if (selectedSource !== null) {
								selectedSource.removeAttribute('disabled');
								selectedSource.children[0].classList.remove('is-hidden');
								selectedSource.children[1].classList.add('is-hidden');
							}

							selectedSource = this;
							
							selectedSource.setAttribute('disabled', '');
							selectedSource.children[0].classList.add('is-hidden');
							selectedSource.children[1].classList.remove('is-hidden');

							window['x-online-iframe'].setAttribute('src', 'https://egeria.space/?' + selectedSource.getAttribute('data-url'));
							window['x-online-iframe-container'].classList.remove('is-hidden');
							
							window.scrollTo(0, 0);
						});
					}

					window['x-online-sources'].classList.remove('is-hidden');
				} else if (appType === '1') {
					while (window['x-online-translators'].firstChild !== null) {
						window['x-online-translators'].removeChild(window['x-online-translators'].firstChild);
					}
					while (window['x-online-seasons'].firstChild !== null) {
						window['x-online-seasons'].removeChild(window['x-online-seasons'].firstChild);
					}
					while (window['x-online-episodes'].firstChild !== null) {
						window['x-online-episodes'].removeChild(window['x-online-episodes'].firstChild);
					}

					for (var i = 0, iMax = appPageJSON.length; i !== iMax; i++) {
						select(appPageJSON[i]['TRANSLATOR'], i, 'x-online-translators').addEventListener('click', function() {
							if (selectedTranslator !== null) {
								selectedTranslator.classList.remove('is-active');

								while (window['x-online-seasons'].firstChild !== null) {
									window['x-online-seasons'].removeChild(window['x-online-seasons'].firstChild);
								}
								while (window['x-online-episodes'].firstChild !== null) {
									window['x-online-episodes'].removeChild(window['x-online-episodes'].firstChild);
								}
							}

							selectedTranslator = this;

							selectedTranslator.classList.add('is-active');

							for (var iCache = selectedTranslator.getAttribute('data-id'), j = 0, jMax = appPageJSON[iCache]['SEASONS'].length; j !== jMax; j++) {
								select(appPageJSON[iCache]['SEASONS'][j]['SEASON'] + ' сезон', j, 'x-online-seasons').addEventListener('click', function() {
									if (selectedSeason !== null) {
										selectedSeason.classList.remove('is-active');
		
										while (window['x-online-episodes'].firstChild !== null) {
											window['x-online-episodes'].removeChild(window['x-online-episodes'].firstChild);
										}
									}

									selectedSeason = this;

									selectedSeason.classList.add('is-active');

									for (var jCache = selectedSeason.getAttribute('data-id'), k = 0, kMax = appPageJSON[iCache]['SEASONS'][jCache]['EPISODES'].length; k !== kMax; k++) {
										select(appPageJSON[iCache]['SEASONS'][jCache]['EPISODES'][k]['EPISODE'] + ' серия', k, 'x-online-episodes').addEventListener('click', function() {
											if (selectedEpisode !== null) {
												selectedEpisode.classList.remove('is-active');
											}
		
											selectedEpisode = this;
		
											selectedEpisode.classList.add('is-active');

											window['x-online-iframe'].setAttribute('src', 'https://egeria.space/?' + appPageJSON[iCache]['SEASONS'][jCache]['EPISODES'][selectedEpisode.getAttribute('data-id')]['DATA']);
											window['x-online-iframe-container'].classList.remove('is-hidden');

											window.scrollTo(0, 0);
										});
									}
								});
							}
						});
					}

					window['x-online-menu'].classList.remove('is-hidden');
				}

				window['x-pageloader'].classList.remove('is-active');
			}
		});
	};

	window['showContentPage'] = function(CONTENT_ID, noPrepare) {
		if (noPrepare === null) {
			preparePage('showContentPage', [CONTENT_ID], 'x-content-page');
		}
		
		ajaxPost('/api/v1/content.php', 'CONTENT_ID=' + CONTENT_ID, function() {
			if (this.readyState === 4 && this.status === 200) {
				appPageJSON = JSON.parse(this.response);

				if (isUndefined(appPageJSON['GUEST']) === false) {
					showGuestPage();
				} else if (isUndefined(appPageJSON['ERROR']) === false) {
					showError(appPageJSON['TEXT']);
				} else {
					var KINOPOISK_ID;
					var WORLDART_ID;

					if (appPageJSON['CONTENT']['KINOPOISK_ID'] === null) {
						KINOPOISK_ID = '';
					} else {
						KINOPOISK_ID = appPageJSON['CONTENT']['KINOPOISK_ID'];
					}
					if (appPageJSON['CONTENT']['WORLDART_ID'] === null) {
						WORLDART_ID = '';
					} else {
						WORLDART_ID = appPageJSON['CONTENT']['WORLDART_ID'];
					}

					appOnline = 'KINOPOISK_ID=' + KINOPOISK_ID + '&WORLDART_ID=' + WORLDART_ID;

					if (isUndefined(appPageJSON['TRAILER']) === true) {
						window['x-content-trailer'].classList.add('is-hidden');
					} else {
						window['x-content-trailer'].classList.remove('is-hidden');
					}

					ajaxPost('/api/v1/online.php', appOnline, null);

					while (window['x-content-tags'].firstChild !== null) {
						window['x-content-tags'].removeChild(window['x-content-tags'].firstChild);
					}

					window['x-content-tags'].appendChild(tagHTML(appPageJSON['CONTENT']['YEAR']));

					insertContentTags(appPageJSON['GENRES']);
					insertContentTags(appPageJSON['COUNTRIES']);
					insertContentTags(appPageJSON['ACTORS']);
					insertContentTags(appPageJSON['DIRECTORS']);
					insertContentTags(appPageJSON['STUDIOS']);

					window['x-content-poster'].setAttribute('src', getImageSource(appPageJSON['CONTENT']['KINOPOISK_ID']));
					window['x-content-title'].textContent = appPageJSON['CONTENT']['TITLE'];
					window['x-content-tagline'].textContent = appPageJSON['CONTENT']['TAGLINE'];
					window['x-content-description'].textContent = appPageJSON['CONTENT']['DESCRIPTION'];
					window['x-content-rating-kinopoisk'].textContent = appPageJSON['CONTENT']['RATING_KINOPOISK'];
					window['x-content-rating-imdb'].textContent = appPageJSON['CONTENT']['RATING_IMDB'];
					window['x-content-hits'].textContent = appPageJSON['CONTENT']['HITS'];
					window['x-content-bookmarks'].textContent = appPageJSON['CONTENT']['BOOKMARKS'];
					window['x-content-views'].textContent = appPageJSON['CONTENT']['VIEWS'];
					window['x-content-comments'].textContent = appPageJSON['CONTENT']['COMMENTS'];
					window['x-content-likes'].textContent = appPageJSON['CONTENT']['LIKES'];
					window['x-content-dislikes'].textContent = appPageJSON['CONTENT']['DISLIKES'];
					
					if (appPageJSON['VIEWED'] === null) {
						window['x-content-view-add'].classList.remove('is-hidden');
						window['x-content-view-remove'].classList.add('is-hidden');
					} else {
						window['x-content-view-add'].classList.add('is-hidden');
						window['x-content-view-remove'].classList.remove('is-hidden');
					}

					if (appPageJSON['BOOKMARKED'] === null) {
						window['x-content-bookmark-add'].classList.remove('is-hidden');
						window['x-content-bookmark-remove'].classList.add('is-hidden');
					} else {
						window['x-content-bookmark-add'].classList.add('is-hidden');
						window['x-content-bookmark-remove'].classList.remove('is-hidden');
					}

					if (isUndefined(appPageJSON['VOTE']) === true) {
						window['x-content-dislike'].removeAttribute('disabled');
						window['x-content-dislike-add'].classList.remove('is-hidden');
						window['x-content-dislike-remove'].classList.add('is-hidden');

						window['x-content-like'].removeAttribute('disabled');
						window['x-content-like-add'].classList.remove('is-hidden');
						window['x-content-like-remove'].classList.add('is-hidden');
					} else if (appPageJSON['VOTE']['LIKE'] === null) {
						window['x-content-dislike'].setAttribute('disabled', '');
						window['x-content-dislike-add'].classList.add('is-hidden');
						window['x-content-dislike-remove'].classList.remove('is-hidden');

						window['x-content-like'].removeAttribute('disabled');
						window['x-content-like-add'].classList.remove('is-hidden');
						window['x-content-like-remove'].classList.add('is-hidden');
					} else if (appPageJSON['VOTE']['DISLIKE'] === null) {
						window['x-content-dislike'].removeAttribute('disabled');
						window['x-content-dislike-add'].classList.remove('is-hidden');
						window['x-content-dislike-remove'].classList.add('is-hidden');

						window['x-content-like'].setAttribute('disabled', '');
						window['x-content-like-add'].classList.add('is-hidden');
						window['x-content-like-remove'].classList.remove('is-hidden');
					}
				}

				window['x-pageloader'].classList.remove('is-active');
			}
		});
	};

	window['showMainPage'] = function() {
		preparePage('showMainPage', [], 'x-main-page');

		ajaxGet('json/search-' + appType, null);

		ajaxGet('/json/main-' + appType, function() {
			if (this.readyState === 4 && this.status === 200) {
				appPageJSON = JSON.parse(this.response);

				insertCards('x-main-cards-');
				
				window['x-pageloader'].classList.remove('is-active');
			}
		});
	};

	window['showSearchPage'] = function() {
		preparePage('showSearchPage', [], 'x-search-page');
		
		ajaxGet('/json/search-' + appType, function() {
			if (this.readyState === 4 && this.status === 200) {
				appPageJSON = JSON.parse(this.response);
				
				window['x-pageloader'].classList.remove('is-active');
			}
		});
	};

	window['showUserPage'] = function() {
		preparePage('showUserPage', [], 'x-user-page');

		ajaxGet('/api/v1/user.php', function() {
			if (this.readyState === 4 && this.status === 200) {
				appPageJSON = JSON.parse(this.response);

				if (isUndefined(appPageJSON['GUEST']) === false) {
					showGuestPage();
				} else if (isUndefined(appPageJSON['ERROR']) === false) {
					showError(appPageJSON['TEXT']);
				} else {
					insertCards('x-user-cards-');
				}

				window['x-pageloader'].classList.remove('is-active');
			}
		});
	};

	var pageContentButton = function(id, method, data = '') {
		var buttonId = 'x-content-' + id;
		window[buttonId].addEventListener('click', function() {
			window[buttonId].classList.add('is-loading');

			ajaxPost('/api/v1/' + method + '.php', 'CONTENT_ID=' + appPageJSON['CONTENT']['CONTENT_ID'] + data, function() {
				if (this.readyState === 4 && this.status === 200) {
					var responseJSON = JSON.parse(this.response);

					if (isUndefined(responseJSON['GUEST']) === false) {
						showGuestPage();
					} else if (isUndefined(responseJSON['ERROR']) === false) {
						showError(responseJSON['TEXT']);
					} else {
						showContentPage(appPageJSON['CONTENT']['CONTENT_ID'], true);
						window[buttonId].classList.remove('is-loading');
					}
				}
			});
		});
	};

	var activateModal  = function(open, modal, close) {
		window[open].addEventListener('click', function() {
			window[modal].classList.add('is-active');
		});
		window[close].addEventListener('click', function() {
			window[modal].classList.remove('is-active');
		});
	};

	var activateCopy = function(copy, value) {
		window[copy].addEventListener('click', function() {
			window[value].select();
			document.execCommand('copy');
		});
	};

	var activateGuestForm = function(method) {
		var buttonId = 'x-guest-' + method;
		var formId = buttonId + '-form';

		window[buttonId].addEventListener('click', function() {
			window[formId].classList.remove('is-hidden');
			window['x-guest-modal'].classList.add('is-active');
		});
		
		window[formId].addEventListener('submit', function(event) {
			event.preventDefault();

			window[formId + '-submit'].classList.add('is-loading');

			ajaxPost('/api/v1/' + method + '.php', 'EMAIL=' + window[formId + '-email'].value + '&PASSWORD=' + window[formId + '-password'].value, function() {
				if (this.readyState === 4 && this.status === 200) {
					var responseJSON = JSON.parse(this.response);

					window[formId + '-submit'].classList.remove('is-loading');
					window['x-guest-error'].classList.add('is-hidden');

					if (isUndefined(responseJSON['ERROR']) === false) {
						window['x-guest-error'].classList.remove('is-hidden');
						window['x-guest-error'].textContent = responseJSON['TEXT'];
					} else {
						window['x-guest-modal'].classList.remove('is-active');
						showPreviousPage();
					}
				}
			});
		});
	};

	document.addEventListener('DOMContentLoaded', function() {
		window['x-sites-0'].addEventListener('click', function() {
			startApp('0');
		});

		window['x-sites-1'].addEventListener('click', function() {
			startApp('1');
		});

		window['x-previous'].addEventListener('click', showPreviousPage);
		window['x-main'].addEventListener('click', showMainPage);
		window['x-user'].addEventListener('click', showUserPage);
		window['x-search'].addEventListener('click', showSearchPage);

		window['x-error-modal-close'].addEventListener('click', function() {
			window['x-error-modal'].classList.remove('is-active');
			showPreviousPage();
		});

		window['x-guest-modal-close'].addEventListener('click', function() {
			window['x-guest-modal'].classList.remove('is-active');
			window['x-guest-signin-form'].classList.add('is-hidden');
			window['x-guest-signup-form'].classList.add('is-hidden');
			window['x-guest-error'].classList.add('is-hidden');
		});

		window['x-navbar-burger'].addEventListener('click', function() {
			window['x-navbar-menu'].classList.toggle('is-active');
		});

		window['x-search-input'].addEventListener('keyup', function() {
			window['x-search-control'].classList.add('is-loading');

			var search = window['x-search-input'].value.toLowerCase().replace(/[^0-9a-zа-я]/g, '');

			if (search.length !== 0) {
				while (window['x-search-cards'].firstChild !== null) {
					window['x-search-cards'].removeChild(window['x-search-cards'].firstChild);
				}

				for (var i = 0, iMax = appPageJSON[0].length, results = 0; i !== iMax && results !== 60; i++) {
					if (appPageJSON[0][i]['SEARCH'].indexOf(search) !== -1) {
						insertCard('x-search-cards', appPageJSON[0][i]);
						results++;
					}
				}

				window['x-search-control'].classList.remove('is-loading');
			}
		});

		window['x-content-online'].addEventListener('click', showOnlinePage);

		window['x-content-trailer'].addEventListener('click', function() {
			window['x-trailer-iframe'].setAttribute('src', 'https://egeria.space/?' + appPageJSON['TRAILER']);
			window['x-trailer-modal'].classList.add('is-active');
		});
		window['x-trailer-modal-close'].addEventListener('click', function() {
			window['x-trailer-iframe'].removeAttribute('src');
			window['x-trailer-modal'].classList.remove('is-active');
		});

		selectedTab['main'] = 'x-main-tab-0';
		selectedTabContent['main'] = 'x-main-cards-0';

		activateTab('main', 'x-main-tab-0', 'x-main-cards-0');
		activateTab('main', 'x-main-tab-1', 'x-main-cards-1');
		activateTab('main', 'x-main-tab-2', 'x-main-cards-2');
		activateTab('main', 'x-main-tab-3', 'x-main-cards-3');

		activateModal('x-support', 'x-support-modal', 'x-support-modal-close');
		activateModal('x-help', 'x-help-modal', 'x-help-modal-close');
		activateModal('x-abuse', 'x-abuse-modal', 'x-abuse-modal-close');

		pageContentButton('like', 'vote', '&VOTE=0');
		pageContentButton('dislike', 'vote', '&VOTE=1');
		pageContentButton('bookmark', 'bookmark');
		pageContentButton('view', 'view');

		activateCopy('x-support-copy-0', 'x-support-value-0');
		activateCopy('x-support-copy-1', 'x-support-value-1');
		activateCopy('x-support-copy-2', 'x-support-value-2');

		activateGuestForm('signin');
		activateGuestForm('signup');

		window['x-pageloader'].classList.remove('is-active');
	});
})();