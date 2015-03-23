(function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition();
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition);
    else this[name] = definition();
}('transForm', function () {
    var _defaults = {
        delimiter: '.',
        skipDisabled: true,
        skipFalsy: false,
        useIdOnEmptyName: false,
        triggerChange: false
    };

    /* Serialize */
    function serialize(formEl, options, nodeCallback) {
        var el = makeElement(formEl),
            result = {},
            opts = getOptions(options),
			inputs = getFields(el, opts.skipDisabled);

        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id;

            if (!key) continue;

            var entry = null;
            if (nodeCallback) entry = nodeCallback(input);
            if (!entry) entry = getEntryFromInput(input, key);

            if ((opts.skipFalsy && !entry.value || isArray(entry.value) && !entry.value.length)
                || typeof entry.value === "undefined" || entry.value === null)
                continue;
            saveEntryToResult(result, entry, input, opts);
        }
        return result;
    }

    function getEntryFromInput(input, key) {
        var nodeType = input.type && input.type.toLowerCase(),
            entry = { name: key, value: null };

        switch (nodeType) {
            case 'radio':
                if (input.checked) entry.value = input.value === 'on' ? true : input.value;
                break;
            case 'checkbox':
                entry.value = input.checked ? (input.value === 'on' ? true : input.value) : false;
                break;
            case 'select-multiple':
                entry.value = [];
                for (var i = 0, l = input.options.length; i < l; i++)
                    if (input.options[i].selected) entry.value.push(input.options[i].value);
                break;
            default:
                entry.value = input.value;
        }
        return entry;
    }

    function saveEntryToResult(result, entry, input, options) {
        var name = entry.name,
			arrayPart = /\[\]$/,
			arrayPartIndex = /\[\d*\]/,
			parts = name.split(options.delimiter),
			parent = result;
        //not not accept falsy values in array collections
        if (arrayPart.test(name) && !entry.value) return;

        for (var i = 0, l = parts.length; i < l; i++) {
            var part = parts[i],
				last = i === l - 1;
            //check if the part is in array notation
            if (arrayPartIndex.test(part)) {
                var split = part.split('['),
					index = split[1].slice(0, -1);
                part = split[0];
                //if parent is not an array, make one
                if (!isArray(parent[part]))
                    parent[part] = [];
                //which action depending on last
                if (last) {
                    //multiple select exception
                    if (input.multiple)
                        parent[part] = entry.value;
                    else if (isNumber(index))
                        parent[part].splice(index, 0, entry.value);
                    else
                        parent[part].push(entry.value);
                } else {
                    if (isNumber(index)) {
                        if (typeof parent[part][index] === "undefined") {
                            parent[part][index] = {};
                        }
                        parent = parent[part][index];
                    } else
                        throw new Error("Index not set for " + name);
                }
            } else {//normal
                if (last)
                    parent[part] = entry.value;
                else {
                    if (typeof parent[part] === "undefined") {
                        parent[part] = {};
                    }
                    parent = parent[part];
                }
            }
        }
    }

    /* Deserialize */
    function deserialize(formEl, data, options, nodeCallback) {
        var el = makeElement(formEl),
            opts = getOptions(options),
            triggerChange = opts.triggerChange,
            inputs = getFields(el, opts.skipDisabled);

        if (!isObject(data)) {
            if (!isString(data)) return;
            try {//Try to parse the passed data as JSON
                data = JSON.parse(data);
            } catch (e) {
                throw new Error("Passed string is not a JSON string.");
            }
        }
        var fieldNames = getFieldNames(data, opts);
        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id,
				value = fieldNames[key];

            if (typeof value === "undefined" || value === null) {
                clearInput(input, triggerChange);
                continue;
            }
            var mutated = nodeCallback && nodeCallback(input, value);
            if (!mutated) setValueToInput(input, value, triggerChange);
        }
    }

    function getFieldNames(obj, options) {
        var root = '',
			fieldNames = {};

        function recursion(root, obj) {
            for (var name in obj) {
                var item = obj[name];

                if (isArray(item)) {
                    //if array of objects
                    if (isObject(item[0])) {
                        for (var i = item.length; i--;) {
                            recursion(root + name + '[' + i + '].', item[i]);
                        }
                    } else {
                        //If the user forgets to type "[]" on multiselects
                        fieldNames[root + name] = item;
                        fieldNames[root + name + '[]'] = item;
                    }
                } else if (isObject(item))
                    recursion(root + name + options.delimiter, item);
                else if (obj[name] !== null)
                    fieldNames[root + name] = item;
            }
        }
        recursion(root, obj);
        return fieldNames;
    }

    function setValueToInput(input, value, triggerChange) {
        var nodeType = input.type && input.type.toLowerCase();

        switch (nodeType) {
            case 'radio':
                if (value === input.value) input.checked = true;
                break;
            case 'checkbox':
                input.checked = isArray(value)
                    ? value.indexOf(input.value) !== -1
                    : value === true || value === input.value
                break;
            case 'select-multiple':
                if (isArray(value))
                    for (var i = input.options.length; i--;)
                        input.options[i].selected = value.indexOf(input.options[i].value) !== -1;
                break;
            default:
                input.value = value;
        }
        if (triggerChange)
            triggerEvent(input, 'change');
    }

    /* Clear */
    function clear(formEl, options) {
        var el = makeElement(formEl),
            opts = getOptions(options),
            triggerChange = opts.triggerChange,
            inputs = getFields(el, opts.skipDisabled);

        for (var i = 0, l = inputs.length; i < l; i++)
            clearInput(inputs[i], triggerChange);
    }

    function clearInput(input, triggerChange) {
        var nodeType = input.type && input.type.toLowerCase();

        switch (nodeType) {
            case 'radio':
            case 'checkbox':
                if (input.checked) input.checked = false;
                break;
            case 'select-one':
            case 'select-multiple':
                input.selectedIndex = -1;
                break;
            default:
                input.value = '';
        }
        if (triggerChange)
            triggerEvent(input, 'change');
    }

    /* Helper functions */
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }
    function isNumber(n) {
        return n - parseFloat(n) + 1 >= 0;
    }
    function isArray(arr) {
        return !!(arr && arr.shift);
    }
    function isString(s) {
        return typeof s === 'string' || s instanceof String;
    }

    function triggerEvent(el, type) {
        var e;
        if (document.createEvent) {
            e = document.createEvent('HTMLEvents');
            e.initEvent(type, true, true);
            el.dispatchEvent(e);
        } else { //old IE
            e = document.createEventObject();
            el.fireEvent('on' + type, e);
        }
    };

    function makeElement(el) {
        el = isString(el) ? document.querySelector(el) || document.getElementById(el) : el;
        if (!el) throw new Error("Element not found.");
        return el;
    }

    function getFields(parent, skipDisabled) {
        var fieldQuery = skipDisabled
            ? 'input:not([disabled]),select:not([disabled]),textarea:not([disabled])'
            : 'input,select,textarea';
        return parent.querySelectorAll(fieldQuery);
    }

    function getOptions(options) {
        if (!isObject(options)) return _defaults;
        var o, opts = {};
        for (o in _defaults) opts[o] = _defaults[o];
        for (o in options) opts[o] = options[o];
        return opts;
    }

    function setDefaults(defaults) {
        _defaults = getOptions(defaults);
    }

    /* Exposed functions */
    return {
        serialize: serialize,
        deserialize: deserialize,
        clear: clear,
        setDefaults: setDefaults
    };
}));