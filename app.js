(function () {
	'use strict';
	var appType;
	var appOnline;
	var appPageJSON;
	var appHistory = [];
	var appHistoryIndex = 0;
	var appElements = {};
	var appSelectedTab = {};
	var appSelectedTabContent = {};
	var isUndefined = function (variable) {
		return typeof (variable) === 'undefined';
	};
	var getElement = function (id) {
		if (appElements.hasOwnProperty(id) === false) {
			appElements[id] = document.getElementById(id);
		}
		return appElements[id];
	};
	var ajaxGet = function (path, callback) {
		var ajax = new XMLHttpRequest();
		ajax.open('get', path, true);
		ajax.setRequestHeader('x-api', appType);
		if (isUndefined(callback) === false) {
			ajax.addEventListener('readystatechange', callback);
		}
		ajax.send();
	};
	var ajaxPost = function (path, data, callback) {
		var ajax = new XMLHttpRequest();
		ajax.open('post', path, true);
		ajax.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
		ajax.setRequestHeader('x-api', appType);
		if (isUndefined(callback) === false) {
			ajax.addEventListener('readystatechange', callback);
		}
		ajax.send(data);
	};
	var preload = function () {
		ajaxPost('/api/v1/content.php', 'CONTENT_ID=' + this.getAttribute('data-id'));
		this.removeEventListener('mouseenter', preload);
	};
	var getImageSource = function (KINOPOISK_ID, WORLDART_ID) {
		return KINOPOISK_ID === null ? '/png/0' : '/jpeg/' + KINOPOISK_ID;
	};
	var select = function (textContent, dataId, id) {
		var li = document.createElement('li');
		var a = document.createElement('a');
		a.textContent = textContent;
		a.setAttribute('data-id', dataId);
		li.appendChild(a);
		getElement(id).appendChild(li);
		return getElement(id).lastElementChild.lastElementChild;
	};
	var sourceTagHTML = function (textContent) {
		var span = document.createElement('span');
		span.className = 'tag is-dark';
		span.textContent = textContent;
		return span;
	};
	var tagHTML = function (textContent) {
		var a = document.createElement('a');
		a.className = 'tag';
		a.textContent = textContent;
		return a;
	};
	var cardTextHTML = function (element, strongText, textValue) {
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
	var insertCard = function (id, data) {
		getElement(id).appendChild(getElement('x-card-template').content.cloneNode(true));
		var node = getElement(id).lastElementChild;
		var text = node.querySelector('.js-text');
		node.querySelector('.js-poster').src = getImageSource(data['KINOPOISK_ID'], data['WORLDART_ID']);
		node.querySelector('.js-title').textContent = data['TITLE'];
		cardTextHTML(text, 'Год: ', data['YEAR']);
		cardTextHTML(text, 'Качество: ', data['SOURCE_TYPE']);
		cardTextHTML(text, 'Перевод: ', data['TRANSLATOR']);
		cardTextHTML(text, 'Сезон: ', data['SEASON']);
		cardTextHTML(text, 'Серия: ', data['EPISODE']);
		cardTextHTML(text, 'КиноПоиск: ', data['RATING_KINOPOISK']);
		cardTextHTML(text, 'IMDb: ', data['RATING_IMDB']);
		node.setAttribute('data-id', data['CONTENT_ID']);
		node.addEventListener('click', function () {
			showContentPage(this.getAttribute('data-id'));
		});
		node.addEventListener('mouseenter', preload);
	};
	var insertCards = function (prefix) {
		for (var i = 0, iMax = appPageJSON.length; i !== iMax; i++) {
			var id = prefix + i.toString();
			while (getElement(id).lastElementChild !== null) {
				getElement(id).lastElementChild.remove();
			}
			for (var j = 0, jMax = appPageJSON[i].length; j !== jMax; j++) {
				insertCard(id, appPageJSON[i][j]);
			}
		}
	};
	var insertContentTags = function (argument) {
		if (isUndefined(argument) === false) {
			for (var i = 0, length = argument.length; i !== length; i++) {
				getElement('x-content-tags').appendChild(tagHTML(argument[i]['NAME']));
			}
		}
	};
	var showError = function (errorText) {
		getElement('x-error-modal').classList.add('is-active');
		getElement('x-error-modal-text').textContent = errorText;
	};
	var startApp = function (type) {
		appType = type;
		getElement('x-sites-modal').classList.remove('is-active');
		var historyJSON = window.sessionStorage.getItem('history-' + appType);
		if (historyJSON !== null) {
			appHistory = JSON.parse(historyJSON);
			appHistoryIndex = appHistory.length - 1;
		}
		showPageFromCache();
	};
	var activateTab = function (pageId, tabId, contentId) {
		getElement(tabId).addEventListener('click', function () {
			getElement(appSelectedTab[pageId]).classList.remove('is-active');
			getElement(appSelectedTabContent[pageId]).classList.add('is-hidden');
			appSelectedTab[pageId] = tabId;
			appSelectedTabContent[pageId] = contentId;
			getElement(appSelectedTab[pageId]).classList.add('is-active');
			getElement(appSelectedTabContent[pageId]).classList.remove('is-hidden');
		});
	};
	var preparePage = function (functionName, argumentsArray, pageId) {
		getElement('x-pageloader').classList.add('is-active');
		getElement('x-guest-page').classList.add('is-hidden');
		getElement('x-online-page').classList.add('is-hidden');
		getElement('x-content-page').classList.add('is-hidden');
		getElement('x-main-page').classList.add('is-hidden');
		getElement('x-search-page').classList.add('is-hidden');
		getElement('x-user-page').classList.add('is-hidden');
		getElement(pageId).classList.remove('is-hidden');
		getElement('x-online-iframe').src = 'data:,';
		if (appHistoryIndex === 0) {
			getElement('x-previous').classList.add('is-hidden');
		} else {
			getElement('x-previous').classList.remove('is-hidden');
		}
		appHistory[appHistoryIndex++] = [functionName, argumentsArray];
		window.sessionStorage.setItem('history-' + appType, JSON.stringify(appHistory));
	};
	var showPageFromCache = function () {
		if (appHistoryIndex === 0) {
			return showMainPage();
		} else if (appHistory[appHistoryIndex][1].length === 0) {
			return window[appHistory[appHistoryIndex][0]]();
		} else if (appHistory[appHistoryIndex][1].length === 1) {
			return window[appHistory[appHistoryIndex][0]](appHistory[appHistoryIndex][1][0]);
		} else if (appHistory[appHistoryIndex][1].length === 2) {
			return window[appHistory[appHistoryIndex][0]](appHistory[appHistoryIndex][1][0], appHistory[appHistoryIndex][1][1]);
		} else {
			return showMainPage();
		}
	};
	var showPreviousPage = function () {
		appHistoryIndex--;
		appHistoryIndex--;
		appHistory.pop();
		window.sessionStorage.setItem('history-' + appType, JSON.stringify(appHistory));
		return showPageFromCache();
	};
	window['showGuestPage'] = function () {
		preparePage('showGuestPage', [], 'x-guest-page');
		getElement('x-pageloader').classList.remove('is-active');
	};
	window['showOnlinePage'] = function (argument) {
		if (typeof argument === 'string') {
			appOnline = argument;
		}
		getElement('x-online-iframe-container').classList.add('is-hidden');
		getElement('x-online-sources').classList.add('is-hidden');
		getElement('x-online-menu').classList.add('is-hidden');
		preparePage('showOnlinePage', [appOnline], 'x-online-page');
		var selectedSource = null;
		var selectedTranslator = null;
		var selectedSeason = null;
		var selectedEpisode = null;
		ajaxPost('/api/v1/online.php', appOnline, function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					appPageJSON = JSON.parse(this.response);
					if (appPageJSON.hasOwnProperty('GUEST') === true) {
						showGuestPage();
					} else if (appPageJSON.hasOwnProperty('ERROR') === true) {
						showError(appPageJSON['TEXT']);
					} else if (appType === '0') {
						while (getElement('x-online-sources').lastElementChild !== null) {
							getElement('x-online-sources').lastElementChild.remove();
						}
						for (var i = 0, iMax = appPageJSON.length; i !== iMax; i++) {
							getElement('x-online-sources').appendChild(getElement('x-source-template').content.cloneNode(true));
							var node = getElement('x-online-sources').lastElementChild;
							var tags = node.querySelector('.js-tags');
							var play = node.querySelector('.js-play');
							if(appPageJSON[i].hasOwnProperty('PROXY') === true) {
								var proxy = node.querySelector('.js-proxy');
								proxy.href = 'http://egeria.space/?' + appPageJSON[i]['PROXY'];
								proxy.classList.remove('is-static');
							}
							node.querySelector('.js-translator').textContent = appPageJSON[i]['TRANSLATOR'];
							tags.appendChild(sourceTagHTML('Сервер №' + appPageJSON[i]['SERVER']));
							tags.appendChild(sourceTagHTML('Дата: ' + appPageJSON[i]['TIMESTAMP']));
							tags.appendChild(sourceTagHTML('Качество: ' + appPageJSON[i]['SOURCE_TYPE']));
							if (appPageJSON[i].hasOwnProperty('BAD_QUALITY') === true && appPageJSON[i]['BAD_QUALITY'] === '1') {
								tags.appendChild(sourceTagHTML('Плохое качество'));
							}
							if (appPageJSON[i].hasOwnProperty('INSTREAM_ADS') === true && appPageJSON[i]['INSTREAM_ADS'] === '1') {
								tags.appendChild(sourceTagHTML('Встроенная реклама'));
							}
							if (appPageJSON[i].hasOwnProperty('DIRECTORS_VERSION') === true && appPageJSON[i]['DIRECTORS_VERSION'] === '1') {
								tags.appendChild(sourceTagHTML('Расширенная версия'));
							}
							play.setAttribute('data-url', appPageJSON[i]['DATA']);
							play.addEventListener('click', function () {
								if (selectedSource !== null) {
									selectedSource.removeAttribute('disabled');
									selectedSource.children[0].classList.remove('is-hidden');
									selectedSource.children[1].classList.add('is-hidden');
								}
								selectedSource = this;
								selectedSource.setAttribute('disabled', '');
								selectedSource.children[0].classList.add('is-hidden');
								selectedSource.children[1].classList.remove('is-hidden');
								getElement('x-online-iframe').src = 'https://egeria.space/?' + selectedSource.getAttribute('data-url');
								getElement('x-online-iframe-container').classList.remove('is-hidden');
								window.scrollTo(0, 0);
							});
						}
						getElement('x-online-sources').classList.remove('is-hidden');
					} else if (appType === '1') {
						while (getElement('x-online-translators').lastElementChild !== null) {
							getElement('x-online-translators').lastElementChild.remove();
						}
						while (getElement('x-online-seasons').lastElementChild !== null) {
							getElement('x-online-seasons').lastElementChild.remove();
						}
						while (getElement('x-online-episodes').lastElementChild !== null) {
							getElement('x-online-episodes').lastElementChild.remove();
						}
						for (var i = 0, iMax = appPageJSON.length; i !== iMax; i++) {
							select(appPageJSON[i]['TRANSLATOR'], i, 'x-online-translators').addEventListener('click', function () {
								if (selectedTranslator !== null) {
									selectedTranslator.classList.remove('is-active');
									while (getElement('x-online-seasons').lastElementChild !== null) {
										getElement('x-online-seasons').lastElementChild.remove();
									}
									while (getElement('x-online-episodes').lastElementChild !== null) {
										getElement('x-online-episodes').lastElementChild.remove();
									}
								}
								selectedTranslator = this;
								selectedTranslator.classList.add('is-active');
								for (var iCache = selectedTranslator.getAttribute('data-id'), j = 0, jMax = appPageJSON[iCache]['SEASONS'].length; j !== jMax; j++) {
									select(appPageJSON[iCache]['SEASONS'][j]['SEASON'] + ' сезон', j, 'x-online-seasons').addEventListener('click', function () {
										if (selectedSeason !== null) {
											selectedSeason.classList.remove('is-active');
											while (getElement('x-online-episodes').lastElementChild !== null) {
												getElement('x-online-episodes').lastElementChild.remove();
											}
										}
										selectedSeason = this;
										selectedSeason.classList.add('is-active');
										for (var jCache = selectedSeason.getAttribute('data-id'), k = 0, kMax = appPageJSON[iCache]['SEASONS'][jCache]['EPISODES'].length; k !== kMax; k++) {
											select(appPageJSON[iCache]['SEASONS'][jCache]['EPISODES'][k]['EPISODE'] + ' серия', k, 'x-online-episodes').addEventListener('click', function () {
												if (selectedEpisode !== null) {
													selectedEpisode.classList.remove('is-active');
												}
												selectedEpisode = this;
												selectedEpisode.classList.add('is-active');
												getElement('x-online-iframe').src = 'https://egeria.space/?' + appPageJSON[iCache]['SEASONS'][jCache]['EPISODES'][selectedEpisode.getAttribute('data-id')]['DATA'];
												getElement('x-online-iframe-container').classList.remove('is-hidden');
												window.scrollTo(0, 0);
											});
										}
									});
								}
							});
						}
						getElement('x-online-menu').classList.remove('is-hidden');
					}
					getElement('x-pageloader').classList.remove('is-active');
				} else {
					showError(this.statusText);
				}
			}
		});
	};
	window['showContentPage'] = function (CONTENT_ID, noPrepare) {
		if (isUndefined(noPrepare) === true) {
			preparePage('showContentPage', [CONTENT_ID], 'x-content-page');
		}
		ajaxPost('/api/v1/content.php', 'CONTENT_ID=' + CONTENT_ID, function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					appPageJSON = JSON.parse(this.response);
					if (appPageJSON.hasOwnProperty('GUEST') === true) {
						showGuestPage();
					} else if (appPageJSON.hasOwnProperty('ERROR') === true) {
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
						if (appPageJSON.hasOwnProperty('TRAILER') === true) {
							getElement('x-content-trailer').classList.remove('is-hidden');
						} else {
							getElement('x-content-trailer').classList.add('is-hidden');
						}
						ajaxPost('/api/v1/online.php', appOnline);
						while (getElement('x-content-tags').lastElementChild !== null) {
							getElement('x-content-tags').lastElementChild.remove();
						}
						getElement('x-content-tags').appendChild(tagHTML(appPageJSON['CONTENT']['YEAR']));
						insertContentTags(appPageJSON['GENRES']);
						insertContentTags(appPageJSON['COUNTRIES']);
						insertContentTags(appPageJSON['ACTORS']);
						insertContentTags(appPageJSON['DIRECTORS']);
						insertContentTags(appPageJSON['STUDIOS']);
						getElement('x-content-poster').src = getImageSource(appPageJSON['CONTENT']['KINOPOISK_ID']);
						getElement('x-content-title').textContent = appPageJSON['CONTENT']['TITLE'];
						getElement('x-content-tagline').textContent = appPageJSON['CONTENT']['TAGLINE'];
						getElement('x-content-description').textContent = appPageJSON['CONTENT']['DESCRIPTION'];
						getElement('x-content-rating-kinopoisk').textContent = appPageJSON['CONTENT']['RATING_KINOPOISK'];
						getElement('x-content-rating-imdb').textContent = appPageJSON['CONTENT']['RATING_IMDB'];
						getElement('x-content-hits').textContent = appPageJSON['CONTENT']['HITS'];
						getElement('x-content-bookmarks').textContent = appPageJSON['CONTENT']['BOOKMARKS'];
						getElement('x-content-views').textContent = appPageJSON['CONTENT']['VIEWS'];
						getElement('x-content-comments').textContent = appPageJSON['CONTENT']['COMMENTS'];
						getElement('x-content-likes').textContent = appPageJSON['CONTENT']['LIKES'];
						getElement('x-content-dislikes').textContent = appPageJSON['CONTENT']['DISLIKES'];
						if (appPageJSON['VIEWED'] === null) {
							getElement('x-content-view-add').classList.remove('is-hidden');
							getElement('x-content-view-remove').classList.add('is-hidden');
						} else {
							getElement('x-content-view-add').classList.add('is-hidden');
							getElement('x-content-view-remove').classList.remove('is-hidden');
						}
						if (appPageJSON['BOOKMARKED'] === null) {
							getElement('x-content-bookmark-add').classList.remove('is-hidden');
							getElement('x-content-bookmark-remove').classList.add('is-hidden');
						} else {
							getElement('x-content-bookmark-add').classList.add('is-hidden');
							getElement('x-content-bookmark-remove').classList.remove('is-hidden');
						}
						if (appPageJSON.hasOwnProperty('VOTE') === false) {
							getElement('x-content-dislike').removeAttribute('disabled');
							getElement('x-content-dislike-add').classList.remove('is-hidden');
							getElement('x-content-dislike-remove').classList.add('is-hidden');
							getElement('x-content-like').removeAttribute('disabled');
							getElement('x-content-like-add').classList.remove('is-hidden');
							getElement('x-content-like-remove').classList.add('is-hidden');
						} else if (appPageJSON['VOTE']['LIKE'] === null) {
							getElement('x-content-dislike').setAttribute('disabled', '');
							getElement('x-content-dislike-add').classList.add('is-hidden');
							getElement('x-content-dislike-remove').classList.remove('is-hidden');
							getElement('x-content-like').removeAttribute('disabled');
							getElement('x-content-like-add').classList.remove('is-hidden');
							getElement('x-content-like-remove').classList.add('is-hidden');
						} else if (appPageJSON['VOTE']['DISLIKE'] === null) {
							getElement('x-content-dislike').removeAttribute('disabled');
							getElement('x-content-dislike-add').classList.remove('is-hidden');
							getElement('x-content-dislike-remove').classList.add('is-hidden');
							getElement('x-content-like').setAttribute('disabled', '');
							getElement('x-content-like-add').classList.add('is-hidden');
							getElement('x-content-like-remove').classList.remove('is-hidden');
						}
					}
					getElement('x-pageloader').classList.remove('is-active');
				} else {
					showError(this.statusText);
				}
			}
		});
	};
	window['showMainPage'] = function () {
		preparePage('showMainPage', [], 'x-main-page');
		ajaxGet('json/search-' + appType);
		ajaxGet('/json/main-' + appType, function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					appPageJSON = JSON.parse(this.response);
					insertCards('x-main-cards-');
					getElement('x-pageloader').classList.remove('is-active');
				} else {
					showError(this.statusText);
				}
			}
		});
	};
	window['showSearchPage'] = function () {
		preparePage('showSearchPage', [], 'x-search-page');
		ajaxGet('/json/search-' + appType, function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					appPageJSON = JSON.parse(this.response);
					getElement('x-pageloader').classList.remove('is-active');
				} else {
					showError(this.statusText);
				}
			}
		});
	};
	window['showUserPage'] = function () {
		preparePage('showUserPage', [], 'x-user-page');
		ajaxGet('/api/v1/user.php', function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					appPageJSON = JSON.parse(this.response);
					if (appPageJSON.hasOwnProperty('GUEST') === true) {
						showGuestPage();
					} else if (appPageJSON.hasOwnProperty('ERROR') === true) {
						showError(appPageJSON['TEXT']);
					} else {
						insertCards('x-user-cards-');
					}
					getElement('x-pageloader').classList.remove('is-active');
				} else {
					showError(this.statusText);
				}
			}
		});
	};
	var pageContentButton = function (id, method, data) {
		var buttonId = 'x-content-' + id;
		getElement(buttonId).addEventListener('click', function () {
			getElement(buttonId).classList.add('is-loading');
			ajaxPost('/api/v1/' + method + '.php', 'CONTENT_ID=' + appPageJSON['CONTENT']['CONTENT_ID'] + data, function () {
				if (this.readyState === 4) {
					if (this.status === 200) {
						var responseJSON = JSON.parse(this.response);
						if (responseJSON.hasOwnProperty('GUEST') === true) {
							showGuestPage();
						} else if (responseJSON.hasOwnProperty('ERROR') === true) {
							showError(responseJSON['TEXT']);
						} else {
							showContentPage(appPageJSON['CONTENT']['CONTENT_ID'], true);
							getElement(buttonId).classList.remove('is-loading');
						}
					} else {
						showError(this.statusText);
					}
				}
			});
		});
	};
	var activateModal = function (open, modal, close) {
		getElement(open).addEventListener('click', function () {
			getElement(modal).classList.add('is-active');
		});
		getElement(close).addEventListener('click', function () {
			getElement(modal).classList.remove('is-active');
		});
	};
	var activateCopy = function (copy, value) {
		getElement(copy).addEventListener('click', function () {
			getElement(value).select();
			document.execCommand('copy');
		});
	};
	var activateGuestForm = function (method) {
		var buttonId = 'x-guest-' + method;
		var formId = buttonId + '-form';
		getElement(buttonId).addEventListener('click', function () {
			getElement(formId).classList.remove('is-hidden');
			getElement('x-guest-modal').classList.add('is-active');
		});
		getElement(formId).addEventListener('submit', function (event) {
			event.preventDefault();
			getElement(formId + '-submit').classList.add('is-loading');
			ajaxPost('/api/v1/' + method + '.php', 'EMAIL=' + getElement(formId + '-email').value + '&PASSWORD=' + getElement(formId + '-password').value, function () {
				if (this.readyState === 4) {
					if (this.status === 200) {
						var responseJSON = JSON.parse(this.response);
						getElement(formId + '-submit').classList.remove('is-loading');
						getElement('x-guest-error').classList.add('is-hidden');
						if (responseJSON.hasOwnProperty('ERROR') === true) {
							getElement('x-guest-error').classList.remove('is-hidden');
							getElement('x-guest-error').textContent = responseJSON['TEXT'];
						} else {
							getElement('x-guest-modal').classList.remove('is-active');
							showPreviousPage();
						}
					} else {
						showError(this.statusText);
					}
				}
			});
		});
	};
	document.addEventListener('DOMContentLoaded', function () {
		getElement('x-sites-0').addEventListener('click', function () {
			startApp('0');
		});
		getElement('x-sites-1').addEventListener('click', function () {
			startApp('1');
		});
		getElement('x-previous').addEventListener('click', showPreviousPage);
		getElement('x-main').addEventListener('click', showMainPage);
		getElement('x-user').addEventListener('click', showUserPage);
		getElement('x-search').addEventListener('click', showSearchPage);
		getElement('x-error-modal-close').addEventListener('click', function () {
			getElement('x-error-modal').classList.remove('is-active');
			showPreviousPage();
		});
		getElement('x-guest-modal-close').addEventListener('click', function () {
			getElement('x-guest-modal').classList.remove('is-active');
			getElement('x-guest-signin-form').classList.add('is-hidden');
			getElement('x-guest-signup-form').classList.add('is-hidden');
			getElement('x-guest-error').classList.add('is-hidden');
		});
		getElement('x-navbar-burger').addEventListener('click', function () {
			getElement('x-navbar-menu').classList.toggle('is-active');
		});
		getElement('x-search-input').addEventListener('keyup', function () {
			getElement('x-search-control').classList.add('is-loading');
			var search = getElement('x-search-input').value.toLowerCase().replace(/[^0-9a-zа-я]/g, '');
			if (search.length !== 0) {
				while (getElement('x-search-cards').lastElementChild !== null) {
					getElement('x-search-cards').lastElementChild.remove();
				}
				for (var i = 0, iMax = appPageJSON[0].length, results = 0; i !== iMax && results !== 60; i++) {
					if (appPageJSON[0][i]['SEARCH'].indexOf(search) !== -1) {
						insertCard('x-search-cards', appPageJSON[0][i]);
						results++;
					}
				}
				getElement('x-search-control').classList.remove('is-loading');
			}
		});
		getElement('x-content-online').addEventListener('click', showOnlinePage);
		getElement('x-content-trailer').addEventListener('click', function () {
			getElement('x-trailer-iframe').src = 'https://egeria.space/?' + appPageJSON['TRAILER'];
			getElement('x-trailer-modal').classList.add('is-active');
		});
		getElement('x-trailer-modal-close').addEventListener('click', function () {
			getElement('x-trailer-iframe').src = 'data:,';
			getElement('x-trailer-modal').classList.remove('is-active');
		});
		appSelectedTab['main'] = 'x-main-tab-0';
		appSelectedTabContent['main'] = 'x-main-cards-0';
		appSelectedTab['user'] = 'x-user-tab-0';
		appSelectedTabContent['user'] = 'x-user-cards-0';
		activateTab('main', 'x-main-tab-0', 'x-main-cards-0');
		activateTab('main', 'x-main-tab-1', 'x-main-cards-1');
		activateTab('main', 'x-main-tab-2', 'x-main-cards-2');
		activateTab('main', 'x-main-tab-3', 'x-main-cards-3');
		activateTab('user', 'x-user-tab-0', 'x-user-cards-0');
		activateTab('user', 'x-user-tab-1', 'x-user-cards-1');
		activateModal('x-support', 'x-support-modal', 'x-support-modal-close');
		activateModal('x-help', 'x-help-modal', 'x-help-modal-close');
		activateModal('x-abuse', 'x-abuse-modal', 'x-abuse-modal-close');
		pageContentButton('like', 'vote', '&VOTE=0');
		pageContentButton('dislike', 'vote', '&VOTE=1');
		pageContentButton('bookmark', 'bookmark', '');
		pageContentButton('view', 'view', '');
		activateCopy('x-support-copy-0', 'x-support-value-0');
		activateCopy('x-support-copy-1', 'x-support-value-1');
		activateCopy('x-support-copy-2', 'x-support-value-2');
		activateGuestForm('signin');
		activateGuestForm('signup');
		getElement('x-pageloader').classList.remove('is-active');
	});
})();
