/*global ko*/
// Copyright 2012 Sune Simonsen
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function () {
    var keys = {
        up: 38,
        down: 40,
        pageUp: 33,
        pageDown: 34,
        enter: 13
    };

    function createElement(name, attributes) {
        var element = document.createElement(name);
        if (attributes) {
            for (var prop in attributes) {
                if (attributes.hasOwnProperty(prop)) {
                    element.setAttribute(prop, attributes[prop]);
                }
            }
        }
        return element;
    }

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var bindingValue = ko.utils.unwrapObservable(value);
            var allBindings = allBindingsAccessor();

            bindingValue.onSelect = bindingValue.onSelect || function (item) {
                return item.toString();
            };

            var dropdown = createElement('ul', {'data-bind': 'foreach: items, visible: items().length'});
            dropdown.appendChild((function () {
                var li = createElement('li', {'data-bind': 'css: {selected: selected}'});
                li.appendChild(createElement('span', {'data-bind': 'text: before'}));
                li.appendChild(createElement('strong', {'data-bind': 'text: match'}));
                li.appendChild(createElement('span', {'data-bind': 'text: after'}));
                return li;
            }()));

            document.body.appendChild(dropdown);

            var query = ko.observable('');

            var suggestions = ko.computed(function () {
                var data = ko.utils.unwrapObservable(bindingValue.data);
                var queryText = (ko.utils.unwrapObservable(query) || '').toLowerCase();
                if (queryText.length < 2) {
                    return [];
                } else {
                    var matches = ko.utils.arrayFilter(data, function (item) {
                        return item.toString().toLowerCase().indexOf(queryText) !== -1;
                    }).slice(0, 6);

                    var first = true;
                    return ko.utils.arrayMap(matches, function (item) {
                        var index = item.toString().toLowerCase().indexOf(queryText);
                        var suggestion = {
                            item: item,
                            before: item.substring(0, index),
                            match: queryText,
                            after: item.substring(index + queryText.length),
                            selected: ko.observable(first)
                        };
                        first = false;
                        return suggestion;
                    });
                }
            });

            function findSelectedIndex() {
                var items = suggestions();
                for (var i = 0; i < items.length; i += 1) {
                    if (items[i].selected()) {
                        return i;
                    }
                }
                return -1;
            }
            function wrapIndex(index, length) {
                if (index < 0) {
                    return Math.max(0, suggestions().length - 1);
                }
                if (suggestions().length <= index) {
                    return 0;
                }
                return index;
            }

            function selectPrevious() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    items[i].selected(false);
                    items[wrapIndex(i - 1)].selected(true);
                }
                return hasSelection;
            }

            function selectNext() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    items[i].selected(false);
                    items[wrapIndex(i + 1)].selected(true);
                    return true;
                }
                return hasSelection;
            }

            function select() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    element.value = bindingValue.onSelect(items[i].item) || '';
                    query('');
                }
                return hasSelection;
            }

            ko.utils.registerEventHandler(element, "keydown", function (e) {
                switch (e.which) {
                case keys.up:
                    if (selectPrevious()) {
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                    break;
                case keys.down:
                    if (selectNext()) {
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                    break;
                case keys.enter:
                    if (select()) {
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                }
                return true;
            });

            ko.utils.registerEventHandler(element, "keyup", function (e) {
                if (e.which === keys.enter) {
                    if (e.preventDefault) e.preventDefault();
                    return false;
                }
                var text = element.value;
                query(text);
            });

            ko.applyBindings({
                items: suggestions
            }, dropdown);
        }
    };
}());