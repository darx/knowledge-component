(function (doc, win, syn) {

    if ('undefined' === typeof syn) {
        return console.warn('Unable to find synthetix object, exiting installation.');
    }

    var Wrapper = undefined;

    function Loading (state) {
        var Root = doc.documentElement;
        if (!state) {
            return Root.removeClass('synthetix-loading');
        }
        Root.addClass('synthetix-loading');
    }

    function Container (state) {
        var Container = el('[data-slide]', Wrapper);
        if (Container) {
            one(Container, 'transitionend', function () {

            });

            Container.dataset.slide = state;
        }
    }

    var Get = function (Request, Session) {

        var store = {};

        var categories = function (cb) {

            /**
             * @name Get.categories
             **/

            var params = {
                method: 'GET',
                url: syn.environment + 'external/categories',
                success: 'function' === typeof cb ? cb : console.log,
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

            if (!store.article) {
                store.article = {};
            }

            else if (store.article[Label] && 'function' === typeof cb) {
                cb(store.article[Label]);
            }

            var rqt = {
                label: Label,
                userid: Session,
                origin_url: url(),
                channel: 14,
            };

            var params = {
                method: 'POST',
                url: syn.environment + 'external/article',
                data: rqt,
                headers: { 'Content-Type': 'application/json' },
                success: function (res) {
                    if ('function' === typeof cb) {
                        store.article[Label] = res;
                        cb(res);
                    }
                },
            };

            Request(params);

        };

        var search = function (Query, cb, Suggest, Topic) {

            /**
             * @name Get.search
             **/

            if ('string' !== typeof Query) {
                throw new Error();
            }

            if ('boolean' !== typeof Suggest) { suggest = true; }

            if ('string' !== typeof Topic) { Topic = 'All'; }

            var params = {
                method: 'POST',
                url: syn.environment + 'external/search',
                data: {
                    autosuggest: Suggest,
                    channel: 14,
                    count: 6,
                    index: 0,
                    origin_url: url(),
                    query: Query,
                    userid: Session,
                    category: Topic,
                },
                headers: { 'Content-Type': 'application/json' },
                success: function (res) {
                    if ('function' === typeof cb) {
                        cb(!res.results ? [] : res.results);
                    }

                    else {
                        console.log(res.results);
                    }
                },
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

            var name = !dataObject.category 
                ? 'all' 
                : dataObject.category;

            if (!store.popular && 'function' === typeof cb) {
                store.popular = {};
            }

            else if (store.popular[name]) {
                // Network request doesn't need 
                // to be sent for repeated clicks
                return cb(store.popular[name]);
            }

            var params = {
                method: 'GET',
                url: syn.environment + 'external/all_faqs',
                data: dataObject,
                success: function (res) {
                    if ('function' === typeof cb) {
                        store.popular[name] = res;
                        cb(res);
                    }
                }
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
                globalHeaders: false,
                success: 'function' === typeof cb ? cb : console.log,
            };

            Request(params);

        };

        var SynthetixRequest = Request;
        Request = function (options) {
            if ('function' === typeof options.success) {
                Loading(true);

                var Response = options.success;
                options.success = function () {

                    // posible GA event to be sent here

                    Loading(false);
                    return Response.apply(null, arguments);
                }
            }
            
            return SynthetixRequest.apply(null, arguments);
        };

        return {
            categories: categories,
            article: article,
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
                    return undefined;
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

        var url = function (url, run) {

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

            if (!run) { return { name: key, value: value }; }

            if (Component.store('ga')) {
                Send.ga('send', {
                    hitType: 'event',
                    eventCategory: 'Synthetix knowledge component',
                    eventAction: 'Click',
                    eventLabel: url
                });
            }

            if (Component.store('adobe')) {
                Send.adobe(url);
            }

            var link = el('[href*="' + structured.hash + '"]', Wrapper);

            // firefox doesn't register repeated clicks on the same hash
            if (link && navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
                var num  = +(parsed[parsed.length - 1]);

                link.hash = isNaN(num) 
                    ? link.hash + '/1'
                    : link.hash.replace(('/' + num), ('/' + (num + 1)));
            }

            switch (key) {
                case 'article':
                    Get.article(value, function (res) {
                        if (!Component.store('feedback')) {
                            Component.store({ feedback: Parse.feedback(res.newfeedback) });
                        }
                        Render.article(Object.assign({}, res, { label: value }));
                    });
                break;

                case 'search':
                    var Query = value.replace(/-/g, ' '),
                        Form  = el('[data-knowledge-search-actions] form', Wrapper);
                    
                    if (Form) { Form.query.value = Query; }

                    Get.search(Query, function (res) {
                        Render.search(res, null, Query);
                    }, false);
                break;

                case 'category':
                    value = decodeURIComponent(value);

                    var placeholder = el('[data-knowledge-category-select]', Wrapper);

                    var params = { limitno: 5, };

                    var Container = el('[data-knowledge-categories]', Wrapper);

                    var Cat = el('[data-category="' + value + '"]', Container);

                    var Active = el('[data-active="true"]', Container);

                    if (Active) { Active.dataset.active = ''; }

                    if (placeholder.innerText.replace(/"/g, '') != value) {
                        params.category = value;
                        placeholder.innerText = '"' + value + '"';
                        Cat.dataset.active = 'true';
                    }

                    else {
                        placeholder.innerText = '';
                    }

                    Get.popular(params, function (res) {
                        Render.popular(res.items,
                            el('[data-top-knowledge-list]'), Wrapper);
                    });
                break;
            }

            return { name: key, value: value };
        };

        var text = function (txt, char) {
            /**
             * @name Parse.text
             **/

            if ('string' !== typeof txt) {
                throw new Error('@param `txt` must be a string');
            }

            return (txt.trim().toLowerCase()).replace(/[^\w\s]/gi, '').replace(/ /g, char);
        };

        var results = function () {

            var search = function (items, filter) {

                /**
                 * @name Parse.results.search
                 **/

                if (!Array.isArray(items)) {
                    throw new Error('Parse.results.search @param `arr` must be an array.')
                }

                var findOne = function (haystack, arr) {
                    return arr.some(function (v) {
                        return -1 !== haystack.indexOf(v);
                    });
                };

                for (var i = 0, len = items.length; i < len; i++) {
                    var Article = items[i];

                    if (Article.taxonomy && Article.taxonomy.category) {
                        console.log(findOne(Article.taxonomy.category, filter));
                    }
                }

            };

            return { search: search };

        }();

        var feedback = function (items) {
            /**
             * @name Parse.feedback
             **/

            var keys   = Object.keys(items),
                Logic  = syn.config.fb_log,
                Sorted = [], Desc = {};

            for (var i = 0, len = keys.length; i < len; i++) {
                
                var Question = Object.keys(items[keys[i]])[0];
                var Answers  = items[keys[i]][Question];

                var param = {
                    question: Question,
                    index: keys[i],
                    answers: Answers.map(function (item) {
                        var key = Object.keys(item)[0],
                            answer = item[key];

                            if (Logic) {
                                var Qs = Object.keys(Logic);
                                if (Logic[Qs[i]][answer]) {
                                    var N = Logic[Qs[i]][answer];
                                    Desc[+key] = N == 'quit' 
                                        ? 'quit'
                                        : (+N.slice(1, N.length));
                                }
                                
                            }

                        return { name: +key, value: answer };
                    })
                };

                Sorted.push(param);
            }

            return { Store: Sorted, Logic: Desc };
        };

        var form = function (elem) {

            /**
             * @name Parse.form
             **/

            if (!(elem instanceof Element) && elem.tagName != 'FORM') {
                throw new Error('The first @param must be an <FROM> elemenet');
            }

            var Form = elem;

            var Inputs = Array.from(Form.elements).filter(function (e) {
                if (e.name && ((['checkbox', 'radio'].indexOf(e.type) === -1) || e.checked)) {
                    return e;
                }
            });

            var params = {};

            for (var i = 0, len = Inputs.length; i < len; i++) {
                var Input = Inputs[i];

                if (!Input.value) { continue; }

                Input.value = Input.value.trim();

                var Arr = Input.name.split(/\[]/);

                if (Arr.length === 1) {
                    params[Arr[0]] = Input.value;
                }

                else if (Arr.length === 2 && !Arr[1]) {
                    if (!params[Arr[0]]) { params[Arr[0]] = []; }
                    params[Arr[0]].push(Input.value); 
                }

                else {

                    if (!params[Arr[0]]) { params[Arr[0]] = []; }

                    var temp = {};

                    if (!params[Arr[0]].length) {
                        temp[Arr[1]] = Input.value;
                        params[Arr[0]].push(temp);
                    }

                    else {
                        params[Arr[0]].forEach(function (e) {
                            if (e && !e[Arr[1]]) {
                                e[Arr[1]] = Input.value;
                            }

                            else {
                                temp[Arr[1]] = Input.value;
                                params[Arr[0]].push(temp);
                            }
                        });
                    }
                }
            }

            return params;
        }

        var style = function (str, id) {

            if (!('string' !== typeof str || !Array.isArray(str))) {
                throw new Error('The `str` @param must be a string or an array');
            }

            if (Array.isArray(str)) { str = str.join(''); }

            var s = doc.createElement('style');
                s.innerHTML = str;
            if ('string' === typeof id) { s.id = id; }
            return s;
        };

        return { url: url, component: component, text: text, results: results, feedback: feedback, style: style, form: form };

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

                var SearchWrapper = el('[data-knowledge-search-actions]', searchFrag);

                var SearchForm = el('form', searchFrag);
                var FilterBtn  = el('.filter-bar__menu-btn', searchFrag);
                
                on(SearchForm, 'submit', function (e) {
                    e.preventDefault();

                    var Form  = this,
                        Query = Form.query.value.trim();

                    if (!Query) {
                        var Search = el('[data-search-state]');
                        if (Search) {
                            Search.dataset.searchState = 'hidden';
                        }

                        return Container('questions');
                    }

                    var params = [Query, function (res) {
                        history.pushState({ }, null,
                        '#!/synthetix/knowledge/component/search/' + 
                            Parse.text(Query, '-')
                        );

                        var Container = el('[data-knowledge-filters]', Wrapper),
                            Filters   = [].slice.call(Container.querySelectorAll('[data-active="true"]'));

                        if (Filters.length) {
                            Parse.results.search
                        }


                        Render.search(res, null, Query);
                    }];

                    if (e.isTrusted) { params.push(false); }

                    Get.search.apply(null, params);
                });

                var timeout = null;

                on(SearchForm.query, 'keyup', function (e) {

                    if ([9, 13].indexOf(e.which) !== -1) { return; }

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

                on(FilterBtn, 'click', function () {
                    var wrapper = SearchWrapper;

                    wrapper.dataset.knowledgeSearchActions = 
                        !wrapper.dataset.knowledgeSearchActions || 
                        wrapper.dataset.knowledgeSearchActions != 'filter' 
                            ? 'filter'
                            : '';
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

        var template = function (elem) {

            var fragment   = doc.createDocumentFragment(),
                components = Component.store('components');

            var template     = Component.get('template-componet', components);
            var templateFrag = Component.transform(
                Parse.component(template, [{
                    name: 'HeadingCategory',
                    value: 'Categories'
                }, {
                    name: 'HeadingSearch',
                    value: 'Search results for '
                }, {
                    name: 'FeedbackSubmit',
                    value: 'Send feedback'
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

            doc.body.insertBefore(Parse.style(
                '.synthetix-loading *{cursor:wait}',
                'synthetix-loading-style'
            ), doc.body.firstChild);

            Loading(true);

            Get.resource('src/main.css', function (res) {
                var style = doc.createElement('style');
                style.innerHTML = res;
                doc.body.insertBefore(style, doc.body.firstChild);
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

            if (!(elem instanceof Element)) { 
                elem = el('[data-knowledge-categories]', Wrapper);
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
                    }, {
                        name: 'NameClass',
                        value: Parse.text(item.category, '_')
                    }, {
                        name: 'ImageURL',
                        value: item.imageurl
                    }]
                );
                
                var frag = Component.transform(html);

                fragments.appendChild(frag);
            }

            return elem.appendChild(fragments);
        };

        var filters = function (items, elem) {

            /**
             * @name Render.filters
             **/

            var components     = Component.store('components');
            var filterComponet = Component.get('filter-item-componet', components);

            console.log(filterComponet);

            if (!Array.isArray(items)) {
                throw new Error('Something has went wrong with rendering category items.');
            }

            if (!(elem instanceof Element)) { 
                elem = el('[data-knowledge-filters]', Wrapper);
            }

            var fragments  = doc.createDocumentFragment();

            var filterItem = Component.get('filter-list-item-componet', components);

            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];

                if (!item.displaytxt) { continue; }

                var html = Parse.component(
                    filterComponet, [{
                        name: 'Name',
                        value: item.displaytxt.trim()
                    }, {
                        name: 'Category',
                        value: item.category
                    }]
                );
                
                var frag = Component.transform(html);

                on(el('input', frag), 'change', function () {
                    var wrapper = el('[data-filter-list]', Wrapper);

                    var Item  = this,
                        Form  = Item.form,
                        Name  = Item.dataset.filter,
                        Label = Item.parentElement;

                    var State = Label.dataset.active == 'false' ? true : false;

                    Label.dataset.active = State;

                    if (!State){
                        var name = Item.value;
                        var sel  = '[data-filter-active="' + name + '"]';
                        var elem = el(sel, Wrapper);

                        wrapper.removeChild(elem);
                    }

                    else {
                        var html = Parse.component(
                            filterItem, [{ name: 'Name', value: Name }]
                        );
                        
                        var frag = Component.transform(html);

                        wrapper.appendChild(frag);
                    }

                    wrapper.dataset.filterList = 
                        wrapper.children.length !== 1 ? 'active' : '';

                    Render.search(Render.search.filter(), null, null, true);
                });

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

            Render.feedback(null, null, item.label);

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

            elem = !elem ? el('[data-article-content]', Wrapper) : elem;

            elem.innerHTML = '';
            elem.appendChild(fragment);

            Container('article');
            // Wrapper.scrollIntoView({ behavior: 'smooth' });
        };

        var feedback = function (items, elem, qed) {

            /**
             * @name Render.feedback
             **/

            var components      = Component.store('components'),
                feedbackWrapper = Component.get('feedback-item-wrapper-componet', components);

            var feedbackChoice  = Component.get('feedback-item-choice-componet', components);
            var feedbackText    = Component.get('feedback-item-text-componet', components);

            elem = !elem ? el('[data-feedback] form', Wrapper) : elem;

            if (elem.label && 'string' == typeof qed) {
                elem.reset();
                elem.label.value = qed;
            }

            elem.dataset.successSubmit = false;

            if (elem.tagName != 'FORM') {
                throw new Error('The `elem` @param must be a form due to the attached submit event');
            }

            elem = el('fieldset', elem);

            if (!elem) {
                throw new Error('The `elem` @param must contain a fieldset');
            }

            // Preventing re-rendering of feedback
            if (!items && (!elem || elem.children.length > 2)) { return; }

            on(elem.form, 'submit', function (e) {
                e.preventDefault();

                var Form = this;
                var params = Parse.form(Form);

                Form.submit.disabled = false;
                Form.dataset.manualSubmit = false;
                Form.dataset.successSubmit = true;

                Send.feedback(params, function (err, res) {
                    Form.submit.disabled = false;
                    if (err) { console.warn('Article feedback was not submited'); }

                    else {
                        console.log(res);
                    }
                });
            });

            on(elem.form, 'reset', function () {
                var elems = elem.form.querySelectorAll('[data-feedback-route]');
                [].forEach.call(elems, function (elem) {
                    elem.dataset.feedbackRoute = false;
                });
            });

            items = !items ? Component.store('feedback').Store : items;

            var fragment = doc.createDocumentFragment();

            for (var i = 0, len = items.length; i < len; i++) {
                var Item = items[i];

                var html = Parse.component(feedbackWrapper, [{
                    name: 'Question',
                    value: Item.question
                }, {
                    name: 'Index',
                    value: Item.index
                }]);

                var wrap = Component.transform(html);

                if (Item.answers.length >= 2) {
                    Item.answers.forEach(function (answer, index) {
                        var options = [{
                            name: 'Index',
                            value: Item.index
                        }, {
                            name: 'Answer',
                            value: answer.value
                        }, {
                            name: 'Value',
                            value: answer.name
                        }];

                        if (Item.answers.length === 2) {
                            options.push({ name: 'Type', value: index === 0 ? 'up' : 'down' });
                        }

                        var htmlc = Parse.component(feedbackChoice, options);

                        var choice = Component.transform(htmlc);

                        on(el('input', choice), 'change', function () {
                            var Input = this,
                                Group = Input.dataset.checkboxGroup,
                                Form  = Input.form;

                            var Logic = Component.store('feedback').Logic;

                            if (Logic[+Input.value] == 'quit' && Input.checked) {
                                var action = document.createEvent('Event');

                                action.initEvent('submit', false, true);
                                return Form.dispatchEvent(action);
                            }

                            var Next = el('[id*="answer_' + Logic[+Input.value] + '"]', Form);

                            Form.dataset.manualSubmit = 
                                Next && Next.tagName == 'TEXTAREA' && Input.checked ? true : false;

                            var Container = el('[data-feedback-group="' + Logic[+Input.value] + '"]', Form);

                            Container.dataset.feedbackRoute = !Input.checked ? false : true;

                            var elems = doc.querySelectorAll('[data-checkbox-group="' + Group + '"]');
                            [].forEach.call(elems, function (elem) {
                                if (Input != elem) {
                                    var ElemsInput = el('[data-feedback-group="' + Logic[+elem.value] + '"]', Form);
                                    if (!isNaN(+elem.value) && ElemsInput) {
                                        ElemsInput.dataset.feedbackRoute = false;

                                        var checks = ElemsInput.querySelectorAll('input[type="checkbox"]');
                                        [].forEach.call(checks, function (e) {
                                            e.checked = false;
                                        });
                                    }
                                    elem.checked = false;
                                }
                            });
                        });

                        el('.sx_form_group', wrap).appendChild(choice);
                    });

                }

                else {
                    var htmlt = Parse.component(feedbackText, [{
                        name: 'Index',
                        value: Item.index
                    }, {
                        name: 'Answer',
                        value: Item.answers[0].value
                    }, {
                        name: 'Value',
                        value: Item.answers[0].name
                    }]);

                    var text = Component.transform(htmlt);
                    el('.sx_form_group', wrap).appendChild(text);
                }

                fragment.appendChild(wrap);
            }

            var htmls = Parse.component(feedbackWrapper, [{
                name: 'Question',
                value: 'Thank you for your feedback'
            }, {
                name: 'Index',
                value: 99
            }]);

            var success = Component.transform(htmls);

            fragment.appendChild(success);

            elem.innerHTML = '';
            elem.appendChild(fragment);
        };

        var popular = function (items, elem) {

            /**
             * @name Render.popular
             **/

            var components               = Component.store('components');
            var articleListItemComponent = Component.get('article-list-item-componet', components);

            var fragments = doc.createDocumentFragment();

            for (var i = 0, len = items.length; i < len; i++) {
                var Item = items[i];

                var html = Parse.component(
                    articleListItemComponent, [{
                        name: 'Label',
                        value: Item.label
                    }, {
                        name: 'Question',
                        value: Item.question
                    }, {
                        name: 'QuestionEncoded',
                        value: Parse.text(Item.question, '-')
                    }, {
                        name: 'Category',
                        value: Item.category
                    }]
                );

                var frag = Component.transform(html);

                fragments.appendChild(frag);
            }

            elem.innerHTML = '';
            elem.appendChild(fragments);

            var url = Parse.url(win.location.href, false);
            if (url && url.name != 'article') {
                Container('questions');
            }

            return;
        };

        var search = (function () {

            var results = undefined;

            function search (items, elem, Query, Filtered) {

                /**
                 * @name Render.search
                 **/

                var components               = Component.store('components');
                var articleListItemComponent = Component.get('article-list-item-componet', components);

                var fragments = doc.createDocumentFragment();

                if (!(elem instanceof Element)) {
                    elem = el('[data-search-results]', Wrapper);
                }

                else if ('string' === typeof elem) {
                    Query = elem;
                }

                var QueryPlaceholder = el('[data-knowledge-search-query]', Wrapper);

                if ('string' === typeof Query) { QueryPlaceholder.innerText = '"' + Query + '"'; }

                var Search = el('[data-search-state]', Wrapper);

                if (Search) {
                    Search.dataset.searchState = 'show';
                }

                if (!items) { return; }

                if (!Filtered) {
                    results = items;
                    items   = search.filter(items);
                }
                
                for (var i = 0, len = items.length; i < len; i++) {
                    var Item = items[i];

                    var html = Parse.component(
                        articleListItemComponent, [{
                            name: 'Label',
                            value: Item.label
                        }, {
                            name: 'Question',
                            value: Item.faq
                        }, {
                            name: 'QuestionEncoded',
                            value: Parse.text(Item.faq, '-')
                        }, {
                            name: 'Category',
                            value: Item.taxonomy.category[0]
                        }]
                    );

                    var frag = Component.transform(html);

                    fragments.appendChild(frag);
                }

                elem.innerHTML = '';
                elem.appendChild(fragments);

                return Container('questions');
            }

            search.filter = function (data, options) {

                /**
                 * @name Render.search.filter
                 **/

                var Items = !data ? results : data;

                if (!Items || !Array.isArray(Items)) {
                    throw new Error('Search data must be an array to filter');
                }

                var Form   = el('[data-form="knowledge-filter"]', Wrapper),
                    Filter = !options ? Parse.form(Form).filter : options;

                if (!Array.isArray(Filter)) { return Items; }
                if (!Filter.length) { return Items; }

                var Filtered = Items.filter(function (item) {
                    if (Filter.indexOf(item.taxonomy.category[0].trim()) !== -1) { return item; }
                });

                return Filtered;
            };

            return search;

        }());

        return {
            categories: categories,
            article: article,
            feedback: feedback,
            popular: popular,
            placeholder: placeholder,
            styles: styles,
            template: template,
            search: search,
            filters: filters,
        };

    }();

    var Send = function (Request) {

        var feedback = function (dataObject, cb) {

            /**
             * @name Send.feedback
             **/

            var params = {
                method: 'POST',
                url: syn.environment + 'external/article_feedback',
                data: dataObject,
                headers: { 'Content-Type': 'application/json' },
                success: function (res) {
                    if ('function' === typeof cb) { cb(null, res); }
                },
                error: 'function' === typeof cb ? cb : console.log,
            };

            Request(params);

        };

        var ga = (function (string) {

            var funcName = string,
                __ga     = win[funcName];

            function ga (action, options) {

                /**
                 * @name Send.ga
                 **/

                if (!funcName) { return; }

                if ('string' !== typeof action) {
                    throw new Error('The `action` @param must be a string. i.e. \'send\'');
                }

                if ('object' !== typeof options) {
                    throw new Error('')
                }

                if (-1 === ['create', 'send', 'require'].indexOf(action)) {
                    throw new Error('Not a valid action `' + action + 
                        '`, you can only send the following actions', whitelist.actions);
                }

                return __ga.apply(null, [ action, options ]);
            }

            ga.setup = function (tag) {

                /**
                 * @name Send.ga.setup
                 **/

                if (!funcName) { return; }
                var clientId = __ga.getAll()[0].get('clientId');
                Component.store({ ga: clientId });
                return __ga.apply(null, ['create', tag, { 'clientId': clientId }]);
            };

            ga.trackingId = function () {
                if (!funcName) { return false; }
                var id = win[GoogleAnalyticsObject].getAll()[0].get('trackingId');
                return id;
            };

            return ga;
        }(win.GoogleAnalyticsObject));

        var adobe = (function () {

            function adobe (name) {
                s.linkTrackVars = 'eVar16,eVar17';
                s.eVar16 = name;
                s.eVar17 = s.pageName;
                s.tl(true, 'o', name);
            }

            adobe.setup = function () {
                var check = !win.s ? false : true;
                Component.store({ adobe: check });
                return check;
            };

            return adobe;

        }());

        return { feedback: feedback, ga: ga, adobe: adobe };

    }(syn.request);

    var init = (function (wrapper) {

        if (!wrapper) {
            return console.warn('Unable to find `.synthetix-iso` wrapper elemenet.');
        }

        Wrapper = wrapper;

        Render.styles();

        Get.resource('src/icons.html', function (res) {
            Wrapper.appendChild(Component.transform(res));
        });
        
        Get.resource('src/components.html', function (res) {
            var fragment = Component.transform(res);

            Component.store({ components: fragment });
        
            Render.placeholder.search(Wrapper);

            Render.template(Wrapper);

            Get.categories(function (res) {
                Render.filters(res);
                Render.categories(res);

                var url = Parse.url(win.location.href, true);
                if (url && url.name == 'category') { return; }

                Get.popular({ limitno: 5 }, function (res) {
                    var elem  = el('[data-top-knowledge-list]', Wrapper);
                    var items = res.items;
                    Render.popular(items, elem);
                });
            });

            var trackingId = Send.ga.trackingId();
            if (trackingId) {
                Send.ga.setup(trackingId);
            }

            Send.adobe.setup();
        });

    }(el('.synthetix-iso')));

    function el (sel, context) {
        if (sel.charAt(0) == '#' && sel.indexOf(' ') === -1) {
            return (context || document).getElementById(sel.slice(1));
        }
        return (context || document).querySelector(sel);
    }

    function one (el, type, handler) {
        var handle = {};
        var handler = handler;

        var _handler = function () {
            off(el, type, _handler);
            handler.apply(this, arguments);
        };

        on(el, type, _handler);

        handle.cancel = function () {
            off(el, type, _handler);
        };

        return handle;
    };

    function on (el, type, handler) {
        el.addEventListener(type, handler);
    }

    function off (el, type, handler) {
        el.removeEventListener(type, handler);
    }

    function url (str) {
        if (!str) {
            return win.location.href.replace(win.location.hash, '');
        }
    }

    on(win, 'popstate', function (e) {
        var path = doc.location.hash;

        var url = Parse.url(path, true);
        if (!url) { Container('questions'); }
    });

}(document, window, synthetix));