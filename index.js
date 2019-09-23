(function (doc, win, syn) {

    if ('undefined' === typeof syn) {
        return console.warn('Unable to find synthetix object, exiting installation.');
    }

    var Get = function (Request, Session) {

        var categories = function (cb) {

            var params = {
                method: 'GET',
                url: syn.environment + 'external/categories',
                success: typeof cb === 'function' ? cb : console.log
            };

            Request(params);

        };

        var article = function (label) {

            if ('string' !== typeof label) {
                throw new Error('Get.article `label` @param must be a string; not ' + typeof label + '. e.g. qed00006');
            }

            var params = {
                method: 'POST',
                url: syn.environment + 'external/article'
            };

            Request(params);

        };

        var views = function (cb) {
            var params = {
                method: 'GET',
                url: syn.environment + 'external/views',
                success: typeof cb === 'function' ? cb : console.log
            };

            Request(params);
        };

        var popular = function (dataObject, cb) {

            if ('object' !== typeof dataObject) {
                throw new Error('Get.popular `dataObject` @param must be an object; not ' + typeof dataObject);
            }

            var params = {
                method: 'GET',
                url: syn.environment + 'external/all_faqs',
                data: dataObject,
                success: typeof cb === 'function' ? cb : console.log
            };

            Request(params);

        };

        var component = function (dataURL, cb) {

            var params = {
                method: 'GET',
                url: dataURL,
                success: typeof cb === 'function' ? cb : console.log
            };

            Request(params);

        };

        return { categories, article, views, popular, component };

    }(syn.request, syn.session);

    var Component = function () {

        var __store = {};

        var parse = function (str, array) {
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

        var transform = function (str) {
            var fragment = document.createDocumentFragment(),
                store = document.createElement("div");

            store.innerHTML = str.toString();

            var children = store.children;
            [].forEach.call(children, function (el) { fragment.appendChild(el); });

            return fragment;
        };

        var get = function (sel, context) {
            if ('string' !== typeof sel) {
                throw new Error('Selector @param must be a string');
            }

            var dom = (context || document);
            var elm = dom.getElementById(sel);
            return !elm ? null : elm.innerHTML;
        };

        var store = function (object) {

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

        return { parse, get, transform, store };

    }();

    var Render = function () {

        var placeholders = function (elem) {

            if (!elem instanceof Element) {
                throw new Error('DOM elemenet needs to be specified.')
            }

            var components = Component.store('components');

            var categoryWrapper     = Component.get('category-wrapper-componet', components);
            var categoryWrapperFrag = Component.transform(
                Component.parse(categoryWrapper, [{
                    name: 'Heading',
                    value: 'This is a test'
                }])
            );

            console.log(categoryWrapperFrag);

            elem.appendChild(categoryWrapperFrag);
        };

        var categories = function (items, elem) {
            var component = Component.get('category-componet');

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

                var html = Component.parse(component, [{
                    name: 'Name', value: item.displaytxt
                }]);
                var frag = Component.transform(html);

                fragments.appendChild(frag);
            }

            return elem.appendChild(fragments);
        };

        var article = function () {
            var component = Component.get('article-componet');
        };

        var feedback = function () {
            var component = Component.get('');
        };

        var popular = function () {
            var component = Component.get('article-list-item-componet'); 
        };

        return { categories, article, feedback, popular, placeholders };

    }();

    var Send = function (Request) {

        var feedback = function (dataObject) {

            var params = {
                method: 'POST',
                url: syn.environment + 'external/article_feedback',
                data: dataObject,
                headers: { 'Content-Type': 'application/json' },
                success: typeof cb === 'function' ? cb : console.log
            };

            Request(params);

        };

        return { feedback };

    }(syn.request);

    var init = (function () {

        var wrapper = doc.querySelector('.synthetix-iso');

        if (!wrapper) {
            return console.warn('Unable to find `.synthetix-iso` wrapper elemenet.');
        }

        Get.component('src/components.html', function (res) {
            var fragment = Component.transform(res);
            
            console.log(fragment);

            Component.store({
                components: fragment
            });
        
            Render.placeholders(wrapper);

            Get.popular({ limitno: 4 }, Render.popular);

            Get.categories(Render.categories);
        });

    }());

}(document, window, synthetix));