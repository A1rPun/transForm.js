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
    function serialize(formEl, nodeCallback, options) {
        var el = typeof formEl === 'string' ? document.querySelector(formEl) : formEl;
        if (!el) throw new Error("Parent element not found.");
        var result = {},
			inputs = getFields(el),
            opts = getOptions(options);

        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id;

            if (!key || (opts.skipDisabled && input.disabled))
                continue;

            var entry = null;
            if (nodeCallback) entry = nodeCallback(input);
            if (!entry) entry = getEntryFromInput(input);

            if ((opts.skipFalsy && !entry.value)
                || typeof entry.value === "undefined" || entry.value === null)
                continue;
            saveEntryToResult(result, entry, input, opts);
        }
        return result;
    }

    function getEntryFromInput(input) {
        var entry = {
            name: input.name,
            value: null
        },
            nodeName = input.nodeName.toLowerCase();

        switch (nodeName) {
            case 'input':
            case 'textarea':
                var type = input.type.toLowerCase();
                switch (type) {
                    case 'radio':
                        if (input.checked) {
                            entry.value = input.value === 'on' ? true : input.value;
                        }
                        break;
                    case 'checkbox':
                        entry.value = input.checked ? (input.value === 'on' ? true : input.value) : false;
                        break;
                    default:
                        entry.value = input.value;
                }
                break;
            case 'select':
                if (input.multiple) {
                    entry.value = [];
                    for (var i = 0, l = input.options.length; i < l; i++) {
                        if (input.options[i].selected) entry.value.push(input.options[i].value);
                    }
                } else {
                    entry.value = input.value;
                }
                break;
            default:
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

            if (arrayPartIndex.test(part)) {
                //array
                var split = part.split('['),
					index = split[1].slice(0, -1);
                part = split[0];
                //if parent is not an array, make one
                if (!isArray(parent[part])) {
                    parent[part] = [];
                }
                //which action depending on last
                if (last) {
                    //multiple select exception
                    if (input.multiple) {
                        parent[part] = entry.value;
                    } else if (isNumber(index)) {
                        parent[part].splice(index, 0, entry.value);
                    } else {
                        parent[part].push(entry.value);
                    }
                } else {
                    if (isNumber(index)) {
                        if (typeof parent[part][index] === "undefined") {
                            parent[part][index] = {};
                        }
                        parent = parent[part][index];
                    } else {
                        throw new Error("Index not set for " + name);
                    }
                }
            } else {
                //normal
                if (last) {
                    parent[part] = entry.value;
                } else {
                    if (typeof parent[part] === "undefined") {
                        parent[part] = {};
                    }
                    parent = parent[part];
                }
            }
        }
    }

    /* Deserialize */
    function deserialize(formEl, data, nodeCallback, options) {
        var el = typeof formEl === 'string' ? document.querySelector(formEl) : formEl;
        if (!el) throw new Error("Parent element not found.");
        var inputs = getFields(el),
            opts = getOptions(options);
        data = data || {};

        var fieldNames = getFieldNames(data, opts);
        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id,
				value = fieldNames[key];

            if (typeof value === "undefined" || value === null) {
                input.value = "";
                continue;
            }

            var mutated = nodeCallback && nodeCallback(input, value);
            if (!mutated) {
                setValueToInput(input, value);
            }
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
                } else if (isObject(item)) {
                    recursion(root + name + options.delimiter, item);
                } else if (obj[name] !== null) {
                    fieldNames[root + name] = item;
                }
            }
        }
        recursion(root, obj);
        return fieldNames;
    }

    function setValueToInput(input, value) {
        var nodeName = input.nodeName.toLowerCase();

        switch (nodeName) {
            case 'input':
            case 'textarea':
                var type = input.type.toLowerCase();
                switch (type) {
                    case 'radio':
                        if (value === input.value) input.checked = true;
                        break;
                    case 'checkbox':
                        if (isArray(value)) {
                            input.checked = value.indexOf(input.value) !== -1;
                        } else {
                            input.checked = value === true || value === input.value;
                        }
                        break;
                    case 'button':
                    case 'reset':
                    case 'submit':
                    case 'image':
                        return;
                    default:
                        input.value = value;
                }
                break;
            case 'select':
                if (input.multiple && isArray(value)) {
                    for (var i = input.options.length; i--;) {
                        input.options[i].selected = value.indexOf(input.options[i].value) !== -1;
                    }
                } else {
                    input.value = value;
                }
                break;
            default:
        }
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

    function getFields(parent) {
        return parent.querySelectorAll('input,select,textarea');
    }

    function getOptions(options) {
        if (!isObject(options))
            return _defaults;
        var o, opts = {};
        for (o in _defaults)
            opts[o] = _defaults[o];
        for (o in options)
            opts[o] = options[o];
        return opts;
    }

    function setDefaults(defaults) {
        _defaults = getOptions(defaults);
    }
    
    /* Exposed functions */
    return {
        serialize: serialize,
        deserialize: deserialize,
        setDefaults: setDefaults
    };
}));