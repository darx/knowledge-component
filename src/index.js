(function (doc, win, syn) {

    if ('undefined' === typeof syn) {
        return console.warn('Unable to find synthetix object, exiting installation.');
    }

    var KnowledgeComponent = (function () {

        var Wrapper = undefined;
        var Settings = syn();

        function Loading (state) {
            var Root = doc.documentElement;
            if (!state) { return Root.classList.remove('synthetix-loading'); }
            Root.classList.add('synthetix-loading');
        }

        function Container (state, elem) {
            var Container = !elem 
                ? el('[data-slide]', Wrapper) 
                : elem;

            if (Container) { Container.dataset.slide = state; }
        }

        var Get = function (Request, Session) {

            var store = {};

            var categories = (cb) => {

                /**
                 * @name Get.categories
                 **/

                var params = {
                    method: 'GET',
                    url: Settings.environment + 'external/categories',
                    success: 'function' === typeof cb ? cb : console.log,
                };

                Request(params);

            };

            var trigger = (Identifier, cb) => {

                /**
                 * @name Get.trigger
                 **/

                var value = !isNaN(+('' + Identifier))
                    ? +Identifier
                    : Identifier;

                var params = {
                    method: 'GET',
                    url: Settings.environment + 'external/trigger',
                    data: { name: [ value ] },
                };

                params.success = (res) => {
                    var trigger = res.triggers && res.triggers.length 
                        ? res.triggers[0] : null;
                    if ('function' === typeof cb) { cb(trigger); }
                };

                Request(params);
            };

            var article = (Label, cb) => {

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
                    userid: syn().session,
                    origin_url: url(),
                    channel: 14,
                };

                var params = {
                    method: 'POST',
                    url: Settings.environment + 'external/article',
                    data: rqt,
                    headers: { 'Content-Type': 'application/json' },
                };

                params.success = (res) => {
                    store.article[Label] = res;
                    if ('function' === typeof cb) { cb(res); }
                };

                Request(params);

            };

            var search = (Query, cb, Suggest, Topic) => {

                /**
                 * @name Get.search
                 **/

                if ('string' !== typeof Query) {
                    throw new Error();
                }

                if ('boolean' !== typeof Suggest) { suggest = true; }

                if ('string' !== typeof Topic) { Topic = 'All'; }

                var payload = {
                    autosuggest: Suggest,
                    channel: 14,
                    count: 6,
                    index: 0,
                    origin_url: url(),
                    query: Query,
                    userid: syn().session,
                    category: Topic,
                };

                var params = {
                    method: 'POST',
                    url: Settings.environment + 'external/search',
                    data: payload,
                    headers: { 'Content-Type': 'application/json' },
                };

                params.success = (res) => {
                    if ('function' === typeof cb) {
                        cb(!res.results ? [] : res.results);
                    }
                };

                Request(params);

            };

            var popular = (dataObject, cb) => {

                /**
                 * @name Get.popular
                 **/

                if ('object' !== typeof dataObject) {
                    throw new Error('Get.popular `dataObject` @param must be an object; not ' + typeof dataObject);
                }

                var name = !dataObject.category 
                    ? 'all' 
                    : dataObject.category;

                if (dataObject.subcategory) {
                    name = `${name}/${dataObject.subcategory}`;
                }

                if (!store.popular && 'function' === typeof cb) {
                    store.popular = {};
                }

                else if (store.popular[name] && 'function' === typeof cb) {
                    // Network request doesn't need 
                    // to be sent for repeated clicks
                    return cb(store.popular[name]);
                }

                var params = {
                    method: 'GET',
                    url: Settings.environment + 'external/all_faqs',
                    data: dataObject,
                };

                params.success = (res) => {
                    store.popular[name] = !res.items ? { items: [] } : res;
                    if ('function' === typeof cb) { cb(store.popular[name]); }
                };

                Request(params);

            };

            var resource = (dataURL, cb) => {

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

            Request = (function () {
                var SynthetixRequest = Request;

                return function (options) {

                    if ('function' === typeof options.success) {
                        Loading(true);

                        var Response = options.success;
                        options.success = function (res) {
                            // posible GA event to be sent here
                            Loading(false);
                            return Response.apply(this, arguments);
                        }
                    }

                    SynthetixRequest.apply(this, arguments);

                }
            })();

            return { categories, article, popular, resource, search, trigger };

        }(syn.request, Settings.session);

        var Component = function () {

            var __store = {};

            var transform = (str) => {

                /**
                 * @name Component.transform
                 **/

                var fragment = doc.createDocumentFragment(),
                    store = doc.createElement('div');

                store.innerHTML = str.toString();

                var children = store.children;
                [].forEach.call(children, (el) => { fragment.appendChild(el); });

                return fragment;

            };

            var scroll = (elem, dir, speed, distance, step) => {

                /**
                 * @name Component.scroll
                 **/
                
                var scrollAmount = 0;

                var slideTimer = setInterval(() => {
                    if (dir == 'left') {
                        elem.scrollLeft -= step;
                    }

                    else {
                        elem.scrollLeft += step;
                    }

                    scrollAmount += step;

                    if (scrollAmount >= distance) {
                        window.clearInterval(slideTimer);
                    }

                    if ((elem.scrollLeft + elem.offsetWidth) === elem.scrollWidth) {
                        elem.dataset.scroll = 'right';
                    }

                    else if (elem.scrollLeft === 0) {
                        elem.dataset.scroll = 'left';
                    }

                    else {
                        elem.dataset.scroll = '';
                    }

                    if (elem.offsetWidth === elem.scrollWidth) {
                        elem.dataset.scroll = 'hide';
                    }

                }, speed);
            };

            var get = (sel, context) => {

                /**
                 * @name Component.get
                 **/

                if ('string' !== typeof sel) {
                    throw new Error('Selector @param must be a string');
                }

                var dom = (context || doc);
                var elm = dom.querySelector('#' + sel);
                return !elm ? null : elm.innerHTML;
            };

            var store = (object) => {

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

            return { get, transform, store, scroll };

        }();

        var Parse = function () {

            var component = (str, array) => {

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

            var url = (url, run) => {

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

                var catPlaceholder = el('[data-knowledge-category-select]', Wrapper);

                switch (key) {
                    case 'article':
                        Get.article(value, (res) => {
                            if (!Component.store('feedback')) {
                                var btn = el('.article__navigation [data-navigation-back]', Wrapper);
                                on(btn, 'click', () => {
                                    win.history.back();
                                });
                                Component.store({ feedback: Parse.feedback(res.newfeedback) });
                            }

                            catPlaceholder.innerText = '';
                            Render.article(Object.assign({}, res, { label: value }));

                            if (syn.checkTriggers) {
                                syn.checkTriggers({
                                    interval: false,
                                    synthetixWindow: false,
                                    inpage: true,
                                    global: true
                                });
                            }
                        });
                    break;

                    case 'search':
                        var Query = value.replace(/-/g, ' '),
                            Form  = el('[data-knowledge-search-actions] form', Wrapper);
                        
                        if (Form) { Form.query.value = Query; }

                        Get.search(Query, (res) => {
                            Render.search(res, null, Query);
                        }, false);
                    break;

                    case 'category':
                    case 'subcategory':
                        value = decodeURIComponent(value);

                        var params = { limitno: 5, };

                        var Container = el('[data-knowledge-categories]', Wrapper);

                        var Cat = el('[data-category="' + value + '"]', Container);

                        var Active = el('[data-active="true"]', Container);

                        var State = el('[data-slide*="category"]', Wrapper);

                        if (Active && key != 'subcategory') { Active.dataset.active = ''; }

                        if (Cat.subcategories) {
                            Render.subcategories(value, Cat.subcategories);
                            State.dataset.slide = 'subcategory';
                        } else { State.dataset.slide = 'category'; }

                        if (key == 'subcategory') {

                            value = [decodeURIComponent(parsed[1]), decodeURIComponent(parsed[2])]

                            Container = el('[data-subcategories-container]', Wrapper);
                            var Sub = el('[data-subcategory="' + value[1] + '"]', Container);

                            if (catPlaceholder.innerText.replace(/"/g, '') != value[1]) {

                                params.category = value[0];
                                params.subcategory = value[1];
                                
                                catPlaceholder.innerText = value[1];

                                Sub.dataset.active = 'true';
                                State.dataset.slide = 'subcategory';
                            }

                            else {
                                State.dataset.slide = 'category';
                                catPlaceholder.innerText = '';
                            }
                        }

                        else if (catPlaceholder.innerText.replace(/"/g, '') != value) {
                            params.category = value;
                            catPlaceholder.innerText = value;
                            Cat.dataset.active = 'true';
                        }

                        else {
                            catPlaceholder.innerText = '';
                        }

                        Get.popular(params, (res) => {
                            Render.popular(res.items, el('[data-top-knowledge-list]'), Wrapper);
                        });

                        var back = el('.category__navigation [data-navigation-back]', Wrapper);
                        one(back, 'click', () => {
                            win.location.hash = win.location.hash;
                            Get.popular({ limitno: 5 }, (res) => {
                                win.location.hash = '';
                                catPlaceholder.innerText = '';
                                Render.popular(res.items, el('[data-top-knowledge-list]'), Wrapper);
                            });
                        });
                    break;
                }

                return { name: key, value: value };
            };

            var text = (txt, char) => {

                /**
                 * @name Parse.text
                 **/

                if ('string' !== typeof txt) {
                    throw new Error('@param `txt` must be a string');
                }

                return (txt.trim().toLowerCase()).replace(/[^\w\s]/gi, '').replace(/ /g, char);
            };

            var results = function () {

                var search = (items, filter) => {

                    /**
                     * @name Parse.results.search
                     **/

                    if (!Array.isArray(items)) {
                        throw new Error('Parse.results.search @param `arr` must be an array.')
                    }

                    var findOne = (haystack, arr) => {
                        return arr.some((v) => {
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

                return { search };

            }();

            var feedback = (items) => {

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
                        answers: Answers.map((item) => {
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

            var form = (elem) => {

                /**
                 * @name Parse.form
                 **/

                if (!(elem instanceof Element) && elem.tagName != 'FORM') {
                    throw new Error('The first @param must be an <FROM> elemenet');
                }

                var Form = elem;

                var Inputs = Array.from(Form.elements).filter((e) => {
                    if (e.name && ((['checkbox', 'radio'].indexOf(e.type) === -1) || e.checked)) {
                        return e;
                    }
                });

                var contains_file = el('[type="file"]', Form);

                if (contains_file) { return new FormData(Form); }

                var params = {};

                for (var i = 0, len = Inputs.length; i < len; i++) {
                    var Input = Inputs[i];

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
                            params[Arr[0]].forEach((e) => {
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
            };

            var style = (str, id) => {

                /**
                 * @name Parse.style
                 **/

                if (!('string' !== typeof str || !Array.isArray(str))) {
                    throw new Error('The `str` @param must be a string or an array');
                }

                if (Array.isArray(str)) { str = str.join(''); }

                var s = doc.createElement('style');
                    s.innerHTML = str;
                if ('string' === typeof id) { s.id = id; }
                return s;
            };

            var article = (str) => {

                /**
                 * @name Parse.article
                 **/

                var Frag       = Component.transform(str),
                    Components = Component.store('components');

                // list of html selectors i.e. h1,p,a,string
                var Selectors = Component.get('selectors-componet', Components);

                // getElementsByTagName doesn't work DocumentFragment
                var elems = Frag.querySelectorAll(Selectors);
                [].forEach.call(elems, (elem) => {

                    // removing white space
                    if (elem.innerHTML.trim() == '&nbsp;') {
                        elem.remove();
                    }

                    if (elem.href && elem.href.indexOf('synthetix:') !== -1) {
                        var start = '#!/synthetix/knowledge/component/article/',
                            label = elem.href.split(/:/)[1],
                            text  = Parse.text(elem.innerText, '-');
     
                        elem.href = start + label + '/' + text;
                    }
                });

                return Frag;
            };

            return { url, component, text, results, feedback, style, form, article };

        }();

        var Render = function () {

            var placeholder = function () {

                var category = (elem) => {

                    /**
                     * @name Render.placeholder.category
                     **/

                    var fragment   = doc.createDocumentFragment(),
                        Components = Component.store('components');

                    var categoryWrapper     = Component.get('category-wrapper-componet', Components);
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

                var search = (elem) => {

                    /**
                     * @name Render.placeholder.search
                     **/

                    var Fragment   = doc.createDocumentFragment(),
                        Components = Component.store('components');

                    var search     = Component.get('search-template-componet', Components);
                    var searchFrag = Component.transform(
                        Parse.component(search, [{
                            name: 'SearchPlaceholder',
                            value: 'Type your question here'
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

                        var params = [Query, (res) => {
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

                        timeout = setTimeout(() => {
                            var action = document.createEvent('Event');

                            // work around for .submit() function causing `submit`
                            // event listener to be ignore
                            action.initEvent('submit', false, true);
                            Form.dispatchEvent(action);
                        }, 500);
                    });

                    on(FilterBtn, 'click', () => {
                        var wrapper = SearchWrapper;

                        wrapper.dataset.knowledgeSearchActions = 
                            !wrapper.dataset.knowledgeSearchActions || 
                            wrapper.dataset.knowledgeSearchActions != 'filter' 
                                ? 'filter'
                                : '';
                    });

                    Fragment.appendChild(searchFrag);

                    if (elem instanceof Element) {
                        return elem.appendChild(Fragment);
                    }

                    return Fragment;
                };

                var article = (elem) => {

                    /**
                     * @name Render.placeholder.article
                     **/

                    var Fragment   = doc.createDocumentFragment(),
                        Components = Component.store('components');

                    var articleListWrapper     = Component.get('article-list-wrapper-componet', Components);
                    var articleListWrapperFrag = Component.transform(
                        Parse.component(articleListWrapper, [{
                            name: 'Heading',
                            value: 'Popular questions'
                        }])
                    );

                    Fragment.appendChild(articleListWrapperFrag);

                    if (elem instanceof Element) {
                        return elem.appendChild(Fragment);
                    }

                    return Fragment;
                };

                return { category, search, article };

            }();

            var template = (elem) => {

                var Fragment   = doc.createDocumentFragment(),
                    Components = Component.store('components');

                var params = [{
                    name: 'HeadingCategory',
                    value: 'Categories'
                }, {
                    name: 'HeadingSearch',
                    value: 'Search results for '
                }, {
                    name: 'FeedbackSubmit',
                    value: 'Send feedback'
                }];

                var Template     = Component.get('template-componet', Components),
                    TemplateFrag = Component.transform(Parse.component(Template, params));

                Fragment.appendChild(TemplateFrag);

                if (elem instanceof Element) {
                    return elem.appendChild(Fragment);
                }

                return Fragment;
            };

            var styles = () => {

                /**
                 * @name Render.styles
                 **/

                doc.body.insertBefore(Parse.style(
                    '.synthetix-loading *{cursor:wait}',
                    'synthetix-loading-style'
                ), doc.body.firstChild);

                Loading(true);

                Get.resource('src/main.css', (res) => {
                    var style = doc.createElement('style');
                    style.innerHTML = res;
                    doc.body.insertBefore(style, doc.body.firstChild);
                });

            };

            var categories = (items, elem) => {

                /**
                 * @name Render.categories
                 **/

                var Components        = Component.store('components'),
                    CategoryComponent = Component.get('category-componet', Components);

                if (!Array.isArray(items)) {
                    throw new Error('Something has went wrong with rendering category items.');
                }

                if (!(elem instanceof Element)) { 
                    elem = el('[data-knowledge-categories]', Wrapper);
                }

                var Fragments = doc.createDocumentFragment();

                for (var i = 0, len = items.length; i < len; i++) {
                    var Item = items[i];

                    if (!Item.displaytxt) { continue; }

                    var params = [{
                        name: 'Name',
                        value: Item.category.trim()
                    }, {
                        name: 'NameEncoded',
                        value: encodeURIComponent(Item.category.trim())
                    }, {
                        name: 'NameClass',
                        value: Parse.text(Item.category, '_')
                    }, {
                        name: 'ImageURL',
                        value: Item.imageurl
                    }];

                    var html = Parse.component(CategoryComponent, params),
                        frag = Component.transform(html);

                    if (Item.subcategory && !!Item.subcategory.length) {
                        el('[data-category]', frag).subcategories = Item.subcategory;
                    }

                    Fragments.appendChild(frag);
                }

                var scroll = {
                    left: el('[data-scroll-left]', Wrapper),
                    right: el('[data-scroll-right]', Wrapper)
                };
                
                on(elem, 'scroll', () => {
                    Component.scroll(elem, '', 0, 0, 0);
                });

                on(scroll.right, 'click', () => {
                    Component.scroll(elem, 'right', 25, 100, 10);
                });

                on(scroll.left, 'click', () => {
                    Component.scroll(elem, 'left', 25, 100, 10);
                });

                elem.appendChild(Fragments);

                Component.scroll(elem, '', 0, 0, 0);
            };

            var subcategories = (category, items, elem) => {

                /**
                 * @name Render.subcategories
                 **/

                var Components        = Component.store('components');
                var CategoryComponent = Component.get('subcategory-componet', Components);
                
                if (!(elem instanceof Element)) { 
                    elem = el('[data-subcategories-container]', Wrapper);
                }

                var Fragments = doc.createDocumentFragment();

                var Heading = el('[data-subcategory-select]', Wrapper);

                if (Heading) {
                    Heading.innerText = category;
                }

                for (var i = 0, len = items.length; i < len; i++) {
                    var Item = items[i];

                    var params = [{
                        name: 'Name',
                        value: Item.category
                    }, {
                        name: 'NameEncoded',
                        value: encodeURIComponent(category) 
                            + '/' 
                            + encodeURIComponent(Item.category)
                    }, {
                        name: 'NameClass',
                        value: Parse.text(Item.category, '_')
                    }]

                    var html = Parse.component(CategoryComponent, params),
                        frag = Component.transform(html);

                    Fragments.appendChild(frag);
                }

                elem.innerHTML = '';
                return elem.appendChild(Fragments);
            };

            var filters = (items, elem) => {

                /**
                 * @name Render.filters
                 **/

                var Components     = Component.store('components');
                var FilterComponet = Component.get('filter-item-componet', Components);

                if (!Array.isArray(items)) {
                    throw new Error('Something has went wrong with rendering category items.');
                }

                if (!(elem instanceof Element)) { 
                    elem = el('[data-knowledge-filters]', Wrapper);
                }

                var Fragments  = doc.createDocumentFragment();

                var FilterItem = Component.get('filter-list-item-componet', Components);

                for (var i = 0, len = items.length; i < len; i++) {
                    var Item = items[i];

                    if (!Item.displaytxt) { continue; }

                    var params = [{
                        name: 'Name',
                        value: Item.category.trim()
                    }, {
                        name: 'Category',
                        value: Item.category
                    }];

                    var html = Parse.component(FilterComponet, params),
                        frag = Component.transform(html);

                    on(el('input', frag), 'change', function () {
                        var wrapper = el('[data-filter-list]', Wrapper);

                        var Item  = this,
                            Form  = Item.form,
                            Name  = Item.dataset.filter,
                            Label = Item.parentElement;

                        var State = Label.dataset.active == 'false' ? true : false;

                        Label.dataset.active = State;

                        if (!State){
                            var sel  = `[data-filter-active="${Item.value}"]`,
                                elem = el(sel, Wrapper);

                            wrapper.removeChild(elem);
                        }

                        else {
                            var html = Parse.component(
                                FilterItem, [{ name: 'Name', value: Name }]
                            );
                            
                            var frag = Component.transform(html);

                            wrapper.appendChild(frag);
                        }

                        wrapper.dataset.filterList = 
                            wrapper.children.length !== 1 ? 'active' : '';

                        Render.search(Render.search.filter(), null, null, true);
                    });

                    Fragments.appendChild(frag);
                }

                return elem.appendChild(Fragments);
            };

            var article = (item, elem) => {

                /**
                 * @name Render.article
                 **/

                var Components       = Component.store('components'),
                    ArticleComponent = Component.get('article-content-componet', Components);

                Render.feedback(null, null, item.label);

                if (Array.isArray(item)) {
                    throw new Error('Article must be an object not an array.');
                }

                var fragment = doc.createDocumentFragment();

                var params = [{
                    name: 'ArticlePlaceholder',
                    value: 'Your selected question'
                }, {
                    name: 'ArticleHeading',
                    value: item.question
                }, {
                    name: 'ArticleContent',
                    value: item.answer
                }];

                var html = Parse.component(ArticleComponent, params),
                    frag = Parse.article(html);

                fragment.appendChild(frag);

                elem = !elem ? el('[data-article-content]', Wrapper) : elem;

                elem.innerHTML = '';
                elem.appendChild(fragment);

                Container('article');
            };

            var feedback = (items, elem, qed) => {

                /**
                 * @name Render.feedback
                 **/

                var Components      = Component.store('components'),
                    FeedbackWrapper = Component.get('feedback-item-wrapper-componet', Components);

                var FeedbackChoice  = Component.get('feedback-item-choice-componet', Components);
                var FeedbackText    = Component.get('feedback-item-text-componet', Components);

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

                    Send.feedback(params, (err, res) => {
                        Form.submit.disabled = false;
                        if (err) { console.warn('Article feedback was not submited'); }
                        else { console.log(res); }
                    });
                });

                on(elem.form, 'reset', () => {
                    var elems = elem.form.querySelectorAll('[data-feedback-route]');
                    [].forEach.call(elems, (elem) => {
                        elem.dataset.feedbackRoute = false;
                    });
                });

                items = !items ? Component.store('feedback').Store : items;

                var fragment = doc.createDocumentFragment();

                for (var i = 0, len = items.length; i < len; i++) {
                    var Item = items[i];

                    var html = Parse.component(FeedbackWrapper, [{
                        name: 'Question',
                        value: Item.question
                    }, {
                        name: 'Index',
                        value: Item.index
                    }]);

                    var wrap = Component.transform(html);

                    if (Item.answers.length >= 2) {
                        Item.answers.forEach((answer, index) => {
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

                            var htmlc = Parse.component(FeedbackChoice, options);

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
                                [].forEach.call(elems, (elem) => {
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
                        var params = [{
                            name: 'Index',
                            value: Item.index
                        }, {
                            name: 'Answer',
                            value: Item.answers[0].value
                        }, {
                            name: 'Value',
                            value: Item.answers[0].name
                        }];

                        var htmlt = Parse.component(FeedbackText, params);

                        var text = Component.transform(htmlt);
                        el('.sx_form_group', wrap).appendChild(text);
                    }

                    fragment.appendChild(wrap);
                }

                var htmls = Parse.component(FeedbackWrapper, [{
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

            var popular = (items, elem) => {

                /**
                 * @name Render.popular
                 **/

                var Components               = Component.store('components'),
                    ArticleListItemComponent = Component.get('article-list-item-componet', Components);

                var Fragments = doc.createDocumentFragment();

                for (var i = 0, len = items.length; i < len; i++) {
                    var Item = items[i];

                    var params = [{
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
                    }];

                    var html = Parse.component(ArticleListItemComponent, params),
                        frag = Component.transform(html);

                    Fragments.appendChild(frag);
                }

                elem.innerHTML = '';
                elem.appendChild(Fragments);

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

                    var Components               = Component.store('components'),
                        ArticleListItemComponent = Component.get('article-list-item-componet', Components);

                    var Fragments = doc.createDocumentFragment();

                    if (!(elem instanceof Element)) {
                        elem = el('[data-search-results]', Wrapper);
                    }

                    else if ('string' === typeof elem) {
                        Query = elem;
                    }

                    var QueryPlaceholder = el('[data-knowledge-search-query]', Wrapper);

                    if ('string' === typeof Query) { QueryPlaceholder.innerText = Query; }

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

                        var params = [{
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
                        }];

                        var html = Parse.component(ArticleListItemComponent, params),
                            frag = Component.transform(html);

                        Fragments.appendChild(frag);
                    }

                    elem.innerHTML = '';
                    elem.appendChild(Fragments);

                    return Container('questions');
                }

                search.filter = (data, options) => {

                    /**
                     * @name Render.search.filter
                     **/

                    var Items = !data ? results : data;

                    if (!Items) {
                        return console.warn('No search results to filter');
                    }

                    if (!Array.isArray(Items)) {
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

            return { categories, article, feedback, popular, placeholder, styles, template, search, filters, subcategories };

        }();

        var Send = function (Request) {

            var feedback = (dataObject, cb) => {

                /**
                 * @name Send.feedback
                 **/

                var params = {
                    method: 'POST',
                    url: Settings.environment + 'external/article_feedback',
                    data: dataObject,
                    error: 'function' === typeof cb ? cb : console.log,
                };

                params.success = (res) => {
                    if ('function' === typeof cb) { cb(null, res); }
                };

                Request(params);

            };

            var trigger = (data) => {

                /**
                 * @name Send.trigger
                 **/

                var params = {
                    method: 'PUT',
                    url: Settings.environment + 'external/trigger',
                    data: data,
                    headers: { 'Content-Type': 'application/json' },
                    success: 'function' === typeof cb ? cb : console.log,
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

                ga.setup = (tag) => {

                    /**
                     * @name Send.ga.setup
                     **/

                    if (!funcName) { return; }
                    var clientId = __ga.getAll()[0].get('clientId');
                    Component.store({ ga: clientId });
                    return __ga.apply(null, ['create', tag, { 'clientId': clientId }]);
                };

                ga.trackingId = () => {
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

                adobe.setup = () => {
                    var check = !win.s ? false : true;
                    Component.store({ adobe: check });
                    return check;
                };

                return adobe;

            }());

            return { feedback, ga, adobe, trigger };

        }(syn.request);

        var ready = (fn) => {

            if ('function' === typeof syn && syn().environment) {
                if ('function' === typeof fn) { fn(true); }
            }

            var __syn__new = syn.session.new;
            syn.session.new = (data, cb) => {
                __syn__new.apply(this, arguments);

                if ('function' === typeof cb) {
                    var __syn__new_cb = cb;
                    cb = function (res) {
                        __syn__new_cb.apply(this, arguments);
                        if ('function' === typeof fn) { fn(true); }
                    };
                }
            };

            var __syn__get = syn.session.get;
            syn.session.get = (data, __cb) => {
                __syn__get.apply(this, arguments);

                if ('function' === typeof __cb) {
                    var __syn__get_cb = __cb;
                    __cb = function (res) {
                        __syn__get_cb.apply(this, arguments);
                        if ('function' === typeof fn) { fn(true); }
                    };
                    if ('function' === typeof fn) { fn(true); }
                }
            };

        };

        var init = (wrapper = el('.synthetix-iso'), fn) => {

            if (!wrapper) {
                return console.warn('Unable to find `.synthetix-iso` wrapper elemenet.');
            }

            console.log('testtesttest')

            Wrapper = wrapper;

            Render.styles();

            Get.resource('src/icons.html', (res) => {
                Wrapper.appendChild(Component.transform(res));
            });
            
            Get.resource('src/components.html', (res) => {
                var fragment = Component.transform(res);

                Component.store({ components: fragment });
            
                Render.placeholder.search(Wrapper);

                Render.template(Wrapper);

                // using hash change event if <= IE11 due to weird behaviour
                on(win, (!doc.documentMode ? 'popstate' : 'hashchange'), () => {
                    var path = doc.location.hash;

                    var url = Parse.url(path, true);
                    if (!url) { 
                        Container('questions');
                        Container('category', el('[data-slide*="category"]', Wrapper));
                    }
                });

                Get.categories((res) => {
                    Render.filters(res);
                    Render.categories(res);

                    Get.trigger('inpageknowledge', (data) => {
                        if (!data) { return false; }

                        var params = {
                            name: data.name,
                            action: 'accept',
                            channel: data.type,
                            triggerid: data.id
                        };

                        Send.trigger(params);
                    });

                    var url = Parse.url(win.location.href, true);
                    if (url && ['category', 'subcategory'].indexOf(url.name) !== -1) { 
                        if ('function' === typeof fn) { fn(); }
                        return;
                    }

                    Get.popular({ limitno: 5 }, (res) => {
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

        };

        return { init, ready };

    }());

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

    function one (el, type, handler) {
        var handle = {};
        var handler = handler;

        var _handler = function () {
            off(el, type, _handler);
            handler.apply(this, arguments);
        };

        on(el, type, _handler);

        handle.cancel = () => {
            off(el, type, _handler);
        };

        return handle;
    }

    function url (str) {
        if (!str) { return win.location.href.replace(win.location.hash, ''); }
    }

    if ('function' === typeof define && define.amd) {
        define(() => { return KnowledgeComponent; });
    }

    else if ('object' === typeof module && module.exports) {
        module.exports = KnowledgeComponent;
    }

    else {
        window.KnowledgeComponent = KnowledgeComponent;
    }

}(document, window, synthetix));