(function() {
    'use strict';

    var $Cache = {};
    var $History = [];
    var $JSON;
    var $Type;
    var $Window = $(window);

    function isUndefined($Temp) {
        return typeof $Temp === 'undefined';
    }

    function Get($Query) {
        if (isUndefined($Cache[$Query]) === true) {
            $Cache[$Query] = $($Query);
        }
        return $Cache[$Query];
    }

    function Prepare($Function, $Arguments, $ID) {
        var $Temp = {
            'function': $Function
            , 'arguments': $Arguments
        };

        $JSON = null;

        Get('#spinner-modal').addClass('is-active');
        Get('#container').children().addClass('is-hidden').eq($ID).removeClass('is-hidden');
        Get('#online-iframe').attr('src', '');

        if ($History.length === 0) {
            Get('.navbar-item').eq(0).addClass('is-hidden');
        } else {
            Get('.navbar-item').eq(0).removeClass('is-hidden');
        }

        $History.push($Temp);

        window.sessionStorage.setItem('CurrentPage-' + $Type, JSON.stringify($Temp));
    }

    function Page() {
        var $Temp = JSON.parse(window.sessionStorage.getItem('CurrentPage-' + $Type));

        if ($Temp === null) {
            PageMain();
        } else if ($Temp['arguments'].length === 0) {
            window[$Temp['function']]();
        } else if ($Temp['arguments'].length === 1) {
            window[$Temp['function']]($Temp['arguments'][0]);
        } else if ($Temp['arguments'].length === 2) {
            window[$Temp['function']]($Temp['arguments'][0], $Temp['arguments'][1]);
        } else if ($Temp['arguments'].length === 3) {
            window[$Temp['function']]($Temp['arguments'][0], $Temp['arguments'][1], $Temp['arguments'][2]);
        } else {
            PageMain();
        }
    }

    function Error($Temp) {
        Get('#error-modal').addClass('is-active');
        Get('#error-modal-text').text($Temp);
    }

    function CardTag($Temp) {
        return '<span class="tag is-white is-radiusless">' + $Temp + '</span><br>';
    }

    function Card($Temp) {
        return '' +
            '<div class="column is-6-mobile is-3-tablet is-3-desktop is-2-widescreen is-2-fullhd">' +
            '<a>' +
            '<figure class="image is-3by4 is-centered x-overlay-toggle">' +
            '<img src="' + ImageSource($Temp['KINOPOISK_ID'], $Temp['WORLDART_ID']) + '">' +
            '<div class="is-overlay x-filter x-centered">' +
            '<span class="icon is-large">' +
            '<i class="fas fa-play fa-2x"></i>' +
            '</span>' +
            '</div>' +
            '<div class="is-overlay">' +
            (isUndefined($Temp['YEAR']) === true ? '' : CardTag('Год: ' + $Temp['YEAR'])) +
			(isUndefined($Temp['SOURCE_TYPE']) === true ? '' : CardTag('Качество: ' + $Temp['SOURCE_TYPE'])) +
            (isUndefined($Temp['TRANSLATOR']) === true ? '' : CardTag('Перевод: ' + $Temp['TRANSLATOR'])) +
			(isUndefined($Temp['SEASON']) === true ? '' : CardTag('Сезон: ' + $Temp['SEASON'])) +
			(isUndefined($Temp['EPISODE']) === true ? '' : CardTag('Серия: ' + $Temp['EPISODE'])) +
			(isUndefined($Temp['RATING_KINOPOISK']) === true ? '' : CardTag('КиноПоиск: ' + $Temp['RATING_KINOPOISK'])) +
			(isUndefined($Temp['RATING_IMDB']) === true ? '' : CardTag('IMDb: ' + $Temp['RATING_IMDB'])) +
            (isUndefined($Temp['BAD_QUALITY']) === true || $Temp['BAD_QUALITY'] === '0' ? '' : CardTag('Плохое качество')) +
            (isUndefined($Temp['INSTREAM_ADS']) === true || $Temp['INSTREAM_ADS'] === '0' ? '' : CardTag('Встроенная реклама')) +
            (isUndefined($Temp['DIRECTORS_VERSION']) === true || $Temp['DIRECTORS_VERSION'] === '0' ? '' : CardTag('Расширенная версия')) +
            '</div>' +
            '</figure>' +
            '</a>' +
            '<p class="has-text-centered x-text-truncate">' + $Temp['TITLE'] + '</p>' +
            '</div>';
    }

    function ImageSource($KINOPOISK_ID, $WORLDART_ID) {
        return $KINOPOISK_ID === null ? '' : '/jpeg/' + $KINOPOISK_ID;
    }

    window['Back'] = function() {
        $History.pop();
        window.sessionStorage.setItem('CurrentPage-' + $Type, JSON.stringify($History.pop()));
        Page();
    }

    window['PageGuest'] = function() {
        Prepare('PageGuest', [], 0);

        Get('#spinner-modal').removeClass('is-active');
    };

    window['PageOnline'] = function($KINOPOISK_ID, $WORLDART_ID) {
        Get('#online-player').addClass('is-hidden');
        Get('#online-iframe-container').addClass('is-hidden');
        Get('#online-menu').addClass('is-hidden');
        Get('#online-sources').empty();

        Prepare('PageOnline', [$KINOPOISK_ID, $WORLDART_ID], 1);

        function Tag($Boolean, $Text) {
            return isUndefined($Boolean) === false && $Boolean === true ? '<span class="tag is-white">' + $Text + '</span>' : '';
        }

        $.post('/api/v1/online.php', {
            'KINOPOISK_ID': ($KINOPOISK_ID === null ? '0' : $KINOPOISK_ID)
            , 'WORLDART_ID': ($WORLDART_ID === null ? '0' : $WORLDART_ID)
        }, function($Response) {

            if (isUndefined($Response['GUEST']) === false) {
                PageGuest();
            } else if (isUndefined($Response['ERROR']) === false) {
                Error($Response['TEXT']);
            } else if ($Type === '0') {
                var $SelectedSource = null;
                var $SourcesHTML = '';

                $.each($Response, function($This, $Value) {
                    $SourcesHTML +=
                        '<div class="notification is-black is-radiusless">' +
                        '<div class="columns">' +
                        '<div class="column is-10">' +
                        '<p class="subtitle is-5">' + ($Value['TRANSLATOR'] === null ? 'Неизвестно' : $Value['TRANSLATOR']) + '</p>' +
                        '<div class="tags">' +
                        Tag(true, 'Сервер №' + $Value['SERVER']) +
                        Tag($Value['TIMESTAMP'] !== null, $Value['TIMESTAMP']) +
                        Tag($Value['SOURCE_TYPE'] !== null, $Value['SOURCE_TYPE']) +
                        Tag($Value['BAD_QUALITY'], 'Плохое качество') +
                        Tag($Value['DIRECTORS_VERSION'], 'Расширенная версия') +
                        Tag($Value['INSTREAM_ADS'], 'Встроенная реклама') +
                        '</div>' +
                        '</div>' +
                        '<div class="column is-2 x-centered">' +
                        '<button class="js-online-source-button button is-white is-outlined">' +
                        '<span>Воспроизвести</span>' +
                        '<span class="is-hidden">Воспроизводится</span>' +
                        '</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                });

                Get('#online-sources').html($SourcesHTML);

                $Cache['.js-online-source-button'] = undefined;

                Get('.js-online-source-button').off('click').on('click', function() {
                    if ($SelectedSource !== null) {
                        Get('.js-online-source-button').eq($SelectedSource).attr('disabled', false).children().toggleClass('is-hidden');
                    }

                    $SelectedSource = Get('.js-online-source-button').index($(this));

                    Get('.js-online-source-button').eq($SelectedSource).removeClass('is-loading').attr('disabled', true).children().toggleClass('is-hidden');

                    Get('#online-iframe').attr('src', 'https://egeria.space/?' + $Response[$SelectedSource]['DATA']);

                    Get('#online-iframe-container').removeClass('is-hidden');

                    $Window.scrollTop(0);
                });
            } else if ($Type === '1') {
                var $HTML = '';

                Get('.js-online-menu').empty();

                $.each($Response, function($Index, $Value) {
                    $HTML += '<li><a>' + ($Value['TRANSLATOR'] === null ? 'Неизвестно' : $Value['TRANSLATOR']) + '</a></li>';
                });

                var $Translators = Get('.js-online-menu').eq(0).html($HTML).children().children();
                $Translators.off('click').on('click', function() {
                    var $HTML = '';
                    var $TranslatorID = $Translators.removeClass('is-active').index($(this).addClass('is-active'));

                    $.each($Response[$TranslatorID]['SEASONS'], function($Index, $Value) {
                        $HTML += '<li><a>' + $Value['SEASON'] + ' сезон</a></li>';
                    });

                    Get('.js-online-menu').eq(2).empty();

                    var $Seasons = Get('.js-online-menu').eq(1).html($HTML).children().children();
                    $Seasons.off('click').on('click', function() {
                        var $HTML = '';
                        var $SeasonID = $Seasons.removeClass('is-active').index($(this).addClass('is-active'));

                        $.each($Response[$TranslatorID]['SEASONS'][$SeasonID]['EPISODES'], function($Index, $Value) {
                            $HTML += '<li><a>' + $Value['EPISODE'] + ' серия</a></li>';
                        });

                        var $Episodes = Get('.js-online-menu').eq(2).html($HTML).children().children();
                        $Episodes.off('click').on('click', function() {
                            Get('#online-iframe').attr('src', 'https://egeria.space/?' + $Response[$TranslatorID]['SEASONS'][$SeasonID]['EPISODES'][$Episodes.removeClass('is-active').index($(this).addClass('is-active'))]['DATA']);
                            Get('#online-iframe-container').removeClass('is-hidden');
                            $Window.scrollTop(0);
                        });
                    });
                });

                Get('#online-menu').removeClass('is-hidden');
            }
            Get('#spinner-modal').removeClass('is-active');
        });
    };

    window['PageContent'] = function($CONTENT_ID) {
        Prepare('PageContent', [$CONTENT_ID], 2);

        function Tag($Type, $Name) {
            return '<a class="tag js-content-tag-' + $Type + '">' + $Name + '</a>';
        }

        $.post('/api/v1/content.php', {
            'CONTENT_ID': $CONTENT_ID
        }, function($Response) {
            if (isUndefined($Response['GUEST']) === false) {
                PageGuest();
            } else if (isUndefined($Response['ERROR']) === false) {
                Error($Response['TEXT']);
            } else {
                $JSON = $Response;

                var $TagsHTML = Tag('year', $Response['CONTENT']['YEAR']);

                $.each(['GENRES', 'COUNTRIES', 'ACTORS', 'DIRECTORS', 'STUDIOS'], function($Index, $Value) {
                    if (isUndefined($Response[$Value]) === false) {
                        $.each($Response[$Value], function($Index, $Value2) {
                            $TagsHTML += Tag($Value.toLowerCase(), $Value2['NAME']);
                        });
                    }
                });

                Get('#content-tags').html($TagsHTML);

                $.each(['genres', 'countries', 'actors', 'directors', 'studios'], function($Index, $Value) {
                    Get('.js-content-tag-' + $Value).off('click').on('click', function() {
                        console.log($Response[$Value.toUpperCase()][Get('.js-content-tag-' + $Value).index($(this))]);
                    });
                });

                Get('.js-content-tag-year').off('click').on('click', function() {
                    console.log($Response['CONTENT']['YEAR']);
                });

                var $CommentsHTML = '';
                if (isUndefined($Response['COMMENTS']) === false) {
                    $.each($Response['COMMENTS'], function() {
                        //$CommentsHTML += '';
                    });
                }

                Get('#content-poster').attr('src', ImageSource($Response['CONTENT']['KINOPOISK_ID']));

                // TODO: replace witch class
                $.each(['title', 'tagline', 'description', 'rating-kinopoisk', 'rating-imdb', 'hits', 'bookmarks', 'views', 'comments', 'likes', 'dislikes'], function($Index, $Value) {
                    Get('#content-' + $Value).text($Response['CONTENT'][$Value.toUpperCase().replace('-', '_')]);
                });

                Get('.js-content-button').slice(2).children().addClass('is-hidden');

                $.each(['bookmark', 'view'], function($Index, $Value) {
                    Get('.js-content-button').slice(2).eq($Index).children().eq($JSON[$Value.toUpperCase() + 'ED'] === null ? 0 : 1).removeClass('is-hidden');
                });

                Get('.js-content-vote-icon').children().addClass('is-hidden');
                Get('.js-content-vote-button').attr('disabled', false);

                $.each(['like', 'dislike'], function($Index, $Value) {
                    var $Temp = isUndefined($JSON['VOTE']) === true || $JSON['VOTE'][$Value.toUpperCase()] === null;

                    Get('.js-content-vote-icon').eq($Index).children().eq($Temp === true ? 0 : 1).removeClass('is-hidden');
                    Get('.js-content-vote-button').eq($Index).attr('disabled', $Temp === false);
                });
            }
            Get('#spinner-modal').removeClass('is-active');
        });
    };

    window['PageMain'] = function() {
        Prepare('PageMain', [], 3);

        $.getJSON('/json/main-' + $Type, function($Response) {
            $.each($Response, function($Index, $Value) {
                var $HTML = '';

                $.each($Value, function($Index, $Value) {
                    $HTML += Card($Value);
                });

                Get('.js-main-cards').eq($Index).html($HTML);
            });

            Get('.js-main-cards').children().off('click').on('click', function() {
                var $This = $(this);
                var $Index = Get('.js-main-cards').index($This.parent());

                PageContent($Response[$Index][Get('.js-main-cards').eq($Index).children().index($This)]['CONTENT_ID']);
            });

            Get('#spinner-modal').removeClass('is-active');
        });
    };

    window['PageSearch'] = function() {
        Prepare('PageSearch', [], 4, 'Поиск');

        $.getJSON('/json/search-' + $Type, function($Response) {
            $JSON = $Response;
            Get('#spinner-modal').removeClass('is-active');
        });
    };

    window['PageUser'] = function() {
        Prepare('PageUser', [], 5);

        $.getJSON('/api/v1/user.php', function($Response) {
            if (isUndefined($Response['GUEST']) === false) {
                PageGuest();
            } else if (isUndefined($Response['ERROR']) === false) {
                Error($Response['TEXT']);
            } else {
                $.each($Response, function($Index, $Value) {
                    var $HTML = '';

                    $.each($Value, function($Index, $Value) {
                        $HTML += Card($Value);
                    });

                    Get('.js-user-cards').eq($Index).html($HTML);
                });

                Get('.js-user-cards').children().off('click').on('click', function() {
                    var $This = $(this);
                    var $Index = Get('.js-user-cards').index($This.parent());

                    PageContent($Response[$Index][Get('.js-user-cards').eq($Index).children().index($This)]['CONTENT_ID']);
                });
            }

            Get('#spinner-modal').removeClass('is-active');
        });
    };

    $Window.one('load', function() {
        $.each([0, 1, 2], function($Index, $Value) {
            Get('.js-sites-modal-button').eq($Index).off('click').on('click', function() {
                Get('.js-sites-modal').eq($Index).addClass('is-active');
            });
        });

        Get('.js-copy-button').off('click').on('click', function() {
            Get('.js-copy-text').eq(Get('.js-copy-button').index($(this))).select();
            document.execCommand('copy');
        });

        Get('.js-modal-close').off('click').on('click', function() {
            $(this).parent().removeClass('is-active');
        });

        $.each(['0', '1'], function($Index, $Value) {
            Get('.js-sites-button').eq($Index).off('click').on('click', function() {
                $Type = $Value;
                Get('#sites-modal').removeClass('is-active');
                $.ajaxSetup({
                    headers: {
                        'X-API': $Value
                    }
                });
                Page();
            });
        });

        Get('#error-modal-close').off('click').on('click', PageMain);

        Get('#navbar-burger').off('click').on('click', function() {
            Get('#navbar-menu').toggleClass('is-active');
        });

        Get('.js-tabs').children().off('click').on('click', function() {
            var $This = $(this);
            var $IndexA = Get('.js-tabs').index($This.parent());
            var $IndexB = Get('.js-tabs').eq($IndexA).children().index($This);

            Get('.js-tabs').eq($IndexA).children().removeClass('is-active').eq($IndexB).addClass('is-active');
            Get('.js-tabs-data').eq($IndexA).children().addClass('is-hidden').eq($IndexB).removeClass('is-hidden');
        });

        Get('#guest-modal-close').off('click').on('click', function() {
            Get('#guest-modal').removeClass('is-active');
        });

        $.each(['login', 'signup'], function($Index, $Value) {
            Get('.js-guest-button').eq($Index).off('click').on('click', function() {
                Get('.js-guest-form').addClass('is-hidden').eq($Index).removeClass('is-hidden');
                Get('#guest-error').addClass('is-hidden');
                Get('#guest-modal').addClass('is-active');
            });

            Get('.js-guest-form').eq($Index).on('submit', function($Event) {
                $Event.preventDefault();

                Get('.js-guest-form-button').addClass('is-loading');

                $.post('/api/v1/' + $Value + '.php', Get('.js-guest-form').eq($Index).serialize(), function($JSON) {
                    Get('.js-guest-form-button').removeClass('is-loading');

                    if (isUndefined($JSON['GUEST']) === false) {
                        PageGuest();
                    } else if (isUndefined($JSON['ERROR']) === false) {
                        Get('#guest-error').text($JSON['TEXT']).removeClass('is-hidden');
                    } else {
                        PageMain();
                    }
                });
            });
        });

        $.each(['bookmark', 'view'], function($Index, $Value) {
            var $Temp = Get('.js-content-button').slice(2).eq($Index);

            $Temp.off('click').on('click', function() {
                $.post('/api/v1/' + $Value + '.php', {
                    'CONTENT_ID': $JSON['CONTENT']['CONTENT_ID']
                }, function($Response) {
                    if (isUndefined($Response['GUEST']) === false) {
                        PageGuest();
                    } else if (isUndefined($JSON['ERROR']) === false) {
                        Error($Response['TEXT']);
                    } else {
                        $Temp.children().toggleClass('is-hidden');
                    }
                });
            });
        });

        $.each(['like', 'dislike'], function($Index, $Value) {
            Get('.js-content-vote-button').eq($Index).off('click').on('click', function() {
                $.post('/api/v1/vote.php', {
                    'CONTENT_ID': $JSON['CONTENT']['CONTENT_ID']
                    , 'VOTE': $Index.toString()
                }, function($Response) {
                    if (isUndefined($Response['GUEST']) === false) {
                        PageGuest();
                    } else if (isUndefined($JSON['ERROR']) === false) {
                        Error($Response['TEXT']);
                    } else {
                        if (isUndefined($JSON['VOTE']) === false) {
                            Get('.js-content-vote-icon').children().toggleClass('is-hidden');
                            Get('.js-content-vote-button').attr('disabled', function($Null, $Attr) {
                                return !$Attr
                            });
                            var $InvertedIndex = $Index === 1 ? 0 : 1;
                            Get('.js-content-vote-counter').eq($InvertedIndex).text((parseInt(Get('.js-content-vote-counter').eq($InvertedIndex).text()) - 1).toString());
                        } else {
                            Get('.js-content-vote-icon').eq($Index).children().toggleClass('is-hidden');
                            Get('.js-content-vote-button').eq($Index).attr('disabled', function($Null, $Attr) {
                                return !$Attr
                            });
                        }
                        Get('.js-content-vote-counter').eq($Index).text((parseInt(Get('.js-content-vote-counter').eq($Index).text()) + 1).toString());
                    }
                });
            });
        });

        Get('#content-online').off('click').on('click', function() {
            PageOnline($JSON['CONTENT']['KINOPOISK_ID'], $JSON['CONTENT']['WORLDART_ID']);
        });

        Get('#search-input').on('keyup', function() {
            Get('#search-control').addClass('is-loading');
            var $Temp = Get('#search-input').val().toLowerCase().replace(/[^0-9a-zа-я]/g, '');
            if ($Temp.length !== 0) {
                var $HTML = '';
                var $Index = 0;
                var $SearchJSON = [];
                while ($JSON[0].length !== $Index && $SearchJSON.length !== 60) {
                    if ($JSON[0][$Index]['SEARCH'].indexOf($Temp) !== -1) {
                        $SearchJSON.push($JSON[0][$Index]);
                        $HTML += Card($JSON[0][$Index]);
                    }
                    $Index++;
                }
                var $Cards = Get('#search-cards').html($HTML).children();
                $Cards.off('click').on('click', function() {
                    PageContent($SearchJSON[$Cards.index($(this))]['CONTENT_ID']);
                });
                Get('#search-control').removeClass('is-loading');
            }
        });

        $.each(['Back', 'PageMain', 'PageUser', 'PageSearch'], function($Index, $Value) {
            Get('.navbar-item').eq($Index).off('click').on('click', window[$Value]);
        });

        Get('#spinner-modal').removeClass('is-active');
    });
})();