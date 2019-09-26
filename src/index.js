(function (doc, win, syn) {

    if ('undefined' === typeof syn) {
        return console.warn('Unable to find synthetix object, exiting installation.');
    }

    var Get = function (Request, Session) {

        var categories = function (cb) {

            /**
             * @name Get.categories
             **/

            var params = {
                method: 'GET',
                url: syn.environment + 'external/categories',
                success: typeof cb === 'function' ? cb : console.log,
            };

            Request(params);

        };

        var article = function (Label, cb) {

            /**
             * @name Get.article
             **/

            if ('string' !== typeof Label) {
                throw new Error('Get.article `label` @param must be a string; not ' + typeof label + '. e.g. qed00006');
            }

            var rqt = {
                label: Label,
                userid: Session,
                origin_url: win.location.href.replace(win.location.hash, ''),
                channel: 14,
            };

            var params = {
                method: 'POST',
                url: syn.environment + 'external/article',
                data: rqt,
                headers: { 'Content-Type': 'application/json' },
                success: typeof cb === 'function' ? cb : console.log,
            };

            Request(params);

        };

        var search = function (Query, cb, suggest) {

            /**
             * @name Get.search
             **/

            if ('string' !== typeof Query) {
                throw new Error();
            }

            if ('boolean' !== typeof suggest) { suggest = true; }

            var params = {
                method: 'POST',
                url: syn.environment + 'external/search',
                data: {
                    autosuggest: suggest,
                    channel: 14,
                    count: 6,
                    index: 0,
                    origin_url: win.location.href.replace(win.location.hash, ''),
                    query: Query,
                    userid: Session
                },
                headers: { 'Content-Type': 'application/json' },
                success: function (res) {
                    if (typeof cb === 'function') {
                        cb(res.results);
                    }

                    else {
                        console.log(res.results);
                    }
                },
            };

            Request(params);

        };

        var views = function (cb) {

            /**
             * @name Get.views
             **/

            var params = {
                method: 'GET',
                url: syn.environment + 'external/views',
                success: typeof cb === 'function' ? cb : console.log,
            };

            Request(params);
        };

        var popular = function (dataObject, cb) {

            /**
             * @name Get.popular
             **/

            if ('object' !== typeof dataObject) {
                throw new Error('Get.popular `dataObject` @param must be an object; not ' + typeof dataObject);
            }

            var params = {
                method: 'GET',
                url: syn.environment + 'external/all_faqs',
                data: dataObject,
                success: typeof cb === 'function' ? cb : console.log,
            };

            Request(params);

        };

        var resource = function (dataURL, cb) {

            /**
             * @name Get.resource
             **/

            var params = {
                method: 'GET',
                url: dataURL,
                success: typeof cb === 'function' ? cb : console.log,
            };

            Request(params);

        };

        return {
            categories: categories,
            article: article,
            views: views,
            popular: popular,
            resource: resource,
            search: search
        };

    }(syn.request, syn.session);

    var Component = function () {

        var __store = {};

        var transform = function (str) {

            /**
             * @name Component.transform
             **/

            var fragment = doc.createDocumentFragment(),
                store = doc.createElement('div');

            store.innerHTML = str.toString();

            var children = store.children;
            [].forEach.call(children, function (el) { fragment.appendChild(el); });

            return fragment;
        };

        var get = function (sel, context) {

            /**
             * @name Component.get
             **/

            if ('string' !== typeof sel) {
                throw new Error('Selector @param must be a string');
            }

            var dom = (context || doc);
            var elm = dom.getElementById(sel);
            return !elm ? null : elm.innerHTML;
        };

        var store = function (object) {

            /**
             * @name Component.store
             **/

            if ('string' === typeof object) {
                var item = __store[object];

                if ('undefined' === typeof item) {
                    throw new Error('Unable to find `' + object + '` item.');
                }

                return item;
            }

            else if ('object' === typeof object) {
                return Object.assign(__store, object);
            }

            else {
                throw new Error('Something went wrong with Component.store; please view trance.');
            }

        };

        return {
            get: get,
            transform: transform,
            store: store
        };

    }();

    var Parse = function () {

        var component = function (str, array) {

            /**
             * @name Parse.component
             **/

            var $string = str;

            if ('string' !== typeof $string) {
                throw new Error();
            }

            if (!Array.isArray(array)) {
                throw new Error();
            }

            for (var i = 0, len = array.length; i < len; i++) {
                var item = array[i];
                var find = 'undefined' !== typeof item.name ? item.name : '';
                var reg = new RegExp('\{\{(?:\\s+)?(' + find + ')(?:\\s+)?\}\}', 'g');

                if ((/[a-zA-Z\_]+/g).test($string)) {
                    $string = $string.replace(reg, item.value);
                }

                else {
                    throw new Error('Find statement does not match regular expression: /[a-zA-Z\_]+/');
                }
            }

            return $string;
        };

        var url = function (url, elem) {

            /**
             * @name Parse.url
             **/

            if ('string' !== typeof url) {
                throw new Error();
            }

            var lookup = '#!/synthetix/knowledge/component/';

            var structured = doc.createElement('a');
                structured.href = url;

            if (!structured.hash) { return false; }

            if (structured.hash.indexOf(lookup) === -1) {
                return false;
            }

            var formated = url.split(lookup)[1],
                parsed   = formated.split(/\//);
            
            var key   = parsed[0],
                value = parsed[1];

            if (!value) { return false; }

            switch (key) {
                case 'article':
                    Get.article(value, function (res) {
                        Render.article(res);
                    });
                break;

                case 'search':
                    Get.search(value, Render.search, false);
                break;

                case 'category':
                    value = decodeURIComponent(value);
                    Get.popular({
                        limitno: 4,
                        category: value
                    }, function (res) {
                        Render.popular(res.items,
                            el('[data-top-knowledge-list]'), elem);
                    });
                break;
            }

            return { name: key, value: value };
        };

        return { url: url, component: component }

    }();

    var Render = function () {

        var placeholder = function () {

            var category = function (elem) {

                /**
                 * @name Render.placeholder.category
                 **/

                var fragment   = doc.createDocumentFragment(),
                    components = Component.store('components');

                var categoryWrapper     = Component.get('category-wrapper-componet', components);
                var categoryWrapperFrag = Component.transform(
                    Parse.component(categoryWrapper, [{
                        name: 'Heading',
                        value: 'Categories'
                    }])
                );

                fragment.appendChild(categoryWrapperFrag);

                if (elem instanceof Element) {
                    return elem.appendChild(fragment);
                }

                return fragment;
            };

            var search = function (elem) {

                /**
                 * @name Render.placeholder.search
                 **/

                var fragment   = doc.createDocumentFragment(),
                    components = Component.store('components');

                var search     = Component.get('search-template-componet', components);
                var searchFrag = Component.transform(
                    Parse.component(search, [{
                        name: 'SearchPlaceholder',
                        value: 'Search our FAQs'
                    } ,{
                        name: 'FilterStatus',
                        value: 'Searching in:'
                    }, {
                        name: 'FilterPlaceholder',
                        value: 'All categories'
                    }, {
                        name: 'FilterTitle',
                        value: 'Filters'
                    }])
                );

                var SearchForm = el('form', searchFrag);
                
                on(SearchForm, 'submit', function (e) {
                    e.preventDefault();

                    var Form  = this,
                        Query = Form.query.value.trim();

                    if (!Query) { return; }

                    var params = [Query, function () {
                        history.pushState({ }, null,
                        '#!/synthetix/knowledge/component/search/' + 
                            Query.toLowerCase()
                            .replace(/[^\w\s]/gi, '')
                            .replace(/ /g, '-')
                        );
                    }];

                    if (e.isTrusted) { params.push(false); }

                    Get.search.apply(null, params);
                });

                var timeout = null;

                on(SearchForm.query, 'keyup', function (e) {

                    if ([13].indexOf(e.which) !== -1) { return; }

                    console.log(e.which);

                    var Form = this.form;

                    clearTimeout(timeout);

                    timeout = setTimeout(function () {
                        var action = document.createEvent('Event');

                        // work around for .submit() function causing `submit`
                        // event listener to be ignore
                        action.initEvent('submit', false, true);
                        Form.dispatchEvent(action);
                    }, 500);
                });

                fragment.appendChild(searchFrag);

                if (elem instanceof Element) {
                    return elem.appendChild(fragment);
                }

                return fragment;
            };

            var article = function (elem) {

                /**
                 * @name Render.placeholder.article
                 **/

                var fragment   = doc.createDocumentFragment(),
                    components = Component.store('components');

                var articleListWrapper     = Component.get('article-list-wrapper-componet', components);
                var articleListWrapperFrag = Component.transform(
                    Parse.component(articleListWrapper, [{
                        name: 'Heading',
                        value: 'Popular questions'
                    }])
                );

                fragment.appendChild(articleListWrapperFrag);

                if (elem instanceof Element) {
                    return elem.appendChild(fragment);
                }

                return fragment;
            };

            return { category: category, search: search, article: article };

        }();

        var placeholders = function (elem) {

            /**
             * @name Render.placeholders
             **/

            if (!elem instanceof Element) {
                throw new Error('DOM elemenet needs to be specified.');
            }

            var fragments  = doc.createDocumentFragment();

            // Search component

            fragments.appendChild(placeholder.search());

            // Categories component

            fragments.appendChild(placeholder.category());

            // Article component

            fragments.appendChild(placeholder.article());


            return elem.appendChild(fragments);
        };

        var template = function (elem) {

            var fragment   = doc.createDocumentFragment(),
                components = Component.store('components');

            var template     = Component.get('template-componet', components);
            var templateFrag = Component.transform(
                Parse.component(template, [{
                    name: 'HeadingCategory',
                    value: 'Categories'
                }, {
                    name: 'HeadingPopular',
                    value: 'Popular questions'
                }, {
                    name: 'HeadingSearch',
                    value: 'Search results'
                }])
            );

            fragment.appendChild(templateFrag);

            if (elem instanceof Element) {
                return elem.appendChild(fragment);
            }

            return fragment;
        };

        var styles = function () {

            /**
             * @name Render.styles
             **/

            Get.resource('src/main.css', function (res) {
                var style = doc.createElement('style');
                style.innerHTML = res;
                doc.body.appendChild(style);
            });

        };

        var categories = function (items, elem) {

            /**
             * @name Render.categories
             **/

            var components        = Component.store('components');
            var categoryComponent = Component.get('category-componet', components);

            if (!Array.isArray(items)) {
                throw new Error('Something has went wrong with rendering category items.');
            }

            if (!elem instanceof Element) {
                throw new Error('DOM elemenet not passed, please specify Element.');
            }

            var fragments = doc.createDocumentFragment();

            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];

                if (!item.displaytxt) { continue; }

                var html = Parse.component(
                    categoryComponent, [{
                        name: 'Name',
                        value: item.displaytxt
                    }, {
                        name: 'NameEncoded',
                        value: encodeURIComponent(item.category)
                    }]
                );
                
                var frag = Component.transform(html);

                fragments.appendChild(frag);
            }

            return elem.appendChild(fragments);
        };

        var article = function (item, elem) {

            /**
             * @name Render.article
             **/

            var components       = Component.store('components'),
                articleComponent = Component.get('article-content-componet', components);
       
            if (Array.isArray(item)) {
                throw new Error('Article must be an object not an array.');
            }

            var fragment = doc.createDocumentFragment();

            var html = Parse.component(
                articleComponent, [{
                    name: 'ArticlePlaceholder',
                    value: 'Your selected question'
                }, {
                    name: 'ArticleHeading',
                    value: item.question
                }, {
                    name: 'ArticleContent',
                    value: item.answer
                }]
            );

            var frag = Component.transform(html);

            fragment.appendChild(frag);

            elem = !elem ? el('[data-article-content]') : elem;

            elem.innerHTML = '';

            return elem.appendChild(fragment);
        };

        var feedback = function () {

            /**
             * @name Render.feedback
             **/

            var component = Component.get('');
        };

        var popular = function (items, elem) {

            /**
             * @name Render.popular
             **/

            var components               = Component.store('components');
            var articleListItemComponent = Component.get('article-list-item-componet', components);

            var fragments = doc.createDocumentFragment();

            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];

                var html = Parse.component(
                    articleListItemComponent, [{
                        name: 'Label',
                        value: item.label
                    }, {
                        name: 'Question',
                        value: item.question
                    }, {
                        name: 'QuestionEncoded',
                        value: (
                            (item.question)
                            .toLowerCase()
                            .replace(/[^\w\s]/gi, '')
                            .replace(/ /g, '-')
                        )
                    }]
                );

                var frag = Component.transform(html);

                fragments.appendChild(frag);
            }

            elem.innerHTML = '';
            return elem.appendChild(fragments);
        };

        var search = function (items, elem) {

            /**
             * @name Render.popular
             **/

            var components               = Component.store('components');
            var articleListItemComponent = Component.get('article-list-item-componet', components);

            var fragments = doc.createDocumentFragment();

            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];

                var html = Parse.component(
                    articleListItemComponent, [{
                        name: 'Label',
                        value: item.label
                    }, {
                        name: 'Question',
                        value: item.question
                    }, {
                        name: 'QuestionEncoded',
                        value: (
                            (item.question)
                            .toLowerCase()
                            .replace(/[^\w\s]/gi, '')
                            .replace(/ /g, '-')
                        )
                    }]
                );

                var frag = Component.transform(html);

                fragments.appendChild(frag);
            }

            elem.innerHTML = '';
            return elem.appendChild(fragments);
        };

        return {
            categories: categories,
            article: article,
            feedback: feedback,
            popular: popular,
            placeholders: placeholders,
            placeholder: placeholder,
            styles: styles,
            template: template,
        };

    }();

    var Send = function (Request) {

        var feedback = function (dataObject) {

            /**
             * @name Send.feedback
             **/

            var params = {
                method: 'POST',
                url: syn.environment + 'external/article_feedback',
                data: dataObject,
                headers: { 'Content-Type': 'application/json' },
                success: typeof cb === 'function' ? cb : console.log,
            };

            Request(params);

        };

        return { feedback: feedback };

    }(syn.request);

    var init = (function (wrapper) {

        if (!wrapper) {
            return console.warn('Unable to find `.synthetix-iso` wrapper elemenet.');
        }

        Render.styles();
        
        Get.resource('src/components.html', function (res) {
            var fragment = Component.transform(res);

            Component.store({ components: fragment });
        
            Render.placeholder.search(wrapper);

            Render.template(wrapper);

            Get.categories(function (res) {
                var elem = el('[data-knowledge-categories]', wrapper);
                Render.categories(res, elem);
            });

            var url = Parse.url(win.location.href, wrapper);

            if (url === false || url.name == 'category') { return; }

            Get.popular({ limitno: 4 }, function (res) {
                var elem  = el('[data-top-knowledge-list]', wrapper);
                var items = res.items;
                Render.popular(items, elem);
            });
        });

    }(el('.synthetix-iso')));

    function el (sel, context) {
        if (sel.charAt(0) == '#' && sel.indexOf(' ') === -1) {
            return (context || document).getElementById(sel.slice(1));
        }
        return (context || document).querySelector(sel);
    }

    function on (el, type, handler) {
        el.addEventListener(type, handler);
    }

    function off (el, type, handler) {
        el.removeEventListener(type, handler);
    }

    on(win, 'popstate', function (e) {
        var path = doc.location.hash;
        Parse.url(path);
    });

}(document, window, synthetix));