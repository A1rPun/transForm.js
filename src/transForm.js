(function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition();
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition);
    else {
        var noConflict = this[name];
        this[name] = definition();
        if (noConflict) this[name].noConflict = noConflict;
    }
}('transForm', function () {
    var _defaults = {
            bindListener: 'change',
            delimiter: '.',
            skipDisabled: true,
            skipReadOnly: false,
            skipFalsy: false,
            useIdOnEmptyName: true,
            triggerChange: false
        },
        binding = false;

    /* Bind */
    function bind(formEl, options, serializeCallback, deserializeCallback) {
        var el = makeElement(formEl),
            opts = getOptions(options),
            inputs = getFields(el, opts.skipDisabled, opts.skipReadOnly),
            lookup = {}, obj,
            result = {};
        binding = true;

        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id;

            if (!key) continue;
            var entry = getEntry(input, key, serializeCallback);
            obj = lookup[entry.name];

            if (obj) {
                obj.inputs.push(input);
                if (isValidValue(entry.value, opts.skipFalsy)) obj.entries.push(entry);
            } else {
                lookup[entry.name] = { entries: [entry], inputs: [input] }
            }
        }

        for (var name in lookup) {
            obj = lookup[name];

            if (obj.inputs.length > 1) {
                //multiple inputs
                var pointers = saveEntryToResult(result, {
                    name: name,
                    value: getValueFromInputs(obj.inputs, name, serializeCallback, opts.skipFalsy)
                }, opts.delimiter);
                createProperty(pointers.pointer, pointers.prop, (function (inputs) {
                    return function (value) {
                        for (var i = 0, l = inputs.length; i < l; i++) {
                            var input = inputs[i],
                                mutated = deserializeCallback && deserializeCallback(input, value);
                            if (!mutated) setValueToInput(input, value, false);
                        }
                        return value;
                    }
                }(obj.inputs)));
                for (var i = 0, l = obj.inputs.length; i < l; i++) {
                    obj.inputs[i].addEventListener(opts.bindListener, (function (p, key, inputs) {
                        return function () {
                            binding = true;
                            p.pointer[p.prop] = getValueFromInputs(inputs, key, serializeCallback, opts.skipFalsy);
                            binding = false;
                        }
                    }(pointers, name, obj.inputs)));
                }
            } else {
                //single input
                var pointers = saveEntryToResult(result, obj.entries[0], opts.delimiter);
                createProperty(pointers.pointer, pointers.prop, (function (input) {
                    return function (value) {
                        var mutated = deserializeCallback && deserializeCallback(input, value);
                        if (!mutated) setValueToInput(input, value, false);
                        return value;
                    }
                }(obj.inputs[0])));
                obj.inputs[0].addEventListener(opts.bindListener, (function (p, key) {
                    return function () {
                        binding = true;
                        var value = getEntry(this, key, serializeCallback).value;
                        if (isValidValue(value, opts.skipFalsy)) p.pointer[p.prop] = value;
                        binding = false;
                    }
                }(pointers)));
            }
        }
        binding = false;
        return result;
    }

    function getValueFromInputs(inputs, key, serializeCallback, skipFalsy) {
        var result = [];
        for (var i = 0, l = inputs.length; i < l; i++) {
            var value = getEntry(inputs[i], key, serializeCallback).value;
            if (isValidValue(value, skipFalsy)) result.push(value);
        }
        return result.length < 2 ? result[0] : result;
    }

    function createProperty(object, prop, setter) {
        var _value = object[prop];
        Object.defineProperty(object, prop, {
            configurable: true,
            enumerable: true,
            get: function () { return _value; },
            set: function (val) { _value = binding ? val : setter(val); }
        });
    }

    /* Serialize */
    function serialize(formEl, options, nodeCallback) {
        var el = makeElement(formEl),
            opts = getOptions(options),
            inputs = getFields(el, opts.skipDisabled, opts.skipReadOnly),
            result = {};

        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id;

            if (!key) continue;
            var entry = getEntry(input, key, nodeCallback);

            if (!isValidValue(entry.value, opts.skipFalsy)) continue;
            saveEntryToResult(result, entry, opts.delimiter);
        }
        return result;
    }

    function getEntry(input, key, nodeCallback) {
        return nodeCallback ? nodeCallback(input, key) : getEntryFromInput(input, key);
    }

    function isValidValue(value, skipFalsy) {
        return !(typeof value === 'undefined' || value === null || (skipFalsy && (!value || (isArray(value) && !value.length))))
    }

    function getEntryFromInput(input, key) {
        var nodeType = input.type && input.type.toLowerCase(),
            entry = { name: key, value: null };

        switch (nodeType) {
            case 'radio':
                if (input.checked)
                    entry.value = input.value === 'on' ? true : input.value;
                break;
            case 'checkbox':
                entry.value = input.checked ? (input.value === 'on' ? true : input.value) : false;
                break;
            case 'select-multiple':
                entry.value = [];
                for (var i = 0, l = input.options.length; i < l; i++)
                    if (input.options[i].selected) entry.value.push(input.options[i].value);
                break;
            case 'file':
                //Only interested in the filename (Chrome adds C:\fakepath\ for security anyway)
                entry.value = input.value.split('\\').pop();
                break;
            case 'button':
            case 'submit':
            case 'reset':
                break;
            default:
                entry.value = input.value;
        }
        return entry;
    }

    function parseString(str, delimiter) {
        var result = [],
            split = str.split(delimiter),
            len = split.length;
        for (var i = 0; i < len; i++) {
            var s = split[i].split('['),
                l = s.length;
            for (var j = 0; j < l; j++) {
                var key = s[j];
                if (!key) {
                    //if the first one is empty, continue
                    if (j === 0) continue;
                    //if the undefined key is not the last part of the string, throw error
                    if (j !== l - 1)
                        error('Undefined key is not the last part of the name > ' + str);
                }
                //strip "]" if its there
                if (key && key[key.length - 1] === ']')
                    key = key.slice(0, -1);
                result.push(key);
            }
        }
        return result;
    }

    function saveEntryToResult(parent, entry, delimiter) {
        //not not accept falsy values in array collections
        if (/\[\]$/.test(entry.name) && !entry.value) return;
        var parts = parseString(entry.name, delimiter);
        for (var i = 0, l = parts.length; i < l; i++) {
            var part = parts[i];
            //if last
            if (i === l - 1) {
                parent[part] = entry.value;
            } else {
                //check if the next part is an index
                var index = parts[i + 1];
                if (!index || isNumber(index)) {
                    if (!isArray(parent[part]))
                        parent[part] = [];
                    //if second last
                    if (i === l - 2) {
                        //array of values
                        parent[part].push(entry.value);
                    } else {
                        //array of objects
                        if (!isObject(parent[part][index]))
                            parent[part][index] = {};
                        parent = parent[part][index];
                    }
                    i++;
                } else {
                    if (!isObject(parent[part]))
                        parent[part] = {};
                    parent = parent[part];
                }
            }
        }
        return { pointer: parent, prop: part };
    }

    /* Deserialize */
    function deserialize(formEl, data, options, nodeCallback) {
        var el = makeElement(formEl),
            opts = getOptions(options),
            inputs = getFields(el, opts.skipDisabled, opts.skipReadOnly);

        if (!isObject(data)) {
            if (!isString(data)) return;
            try { //Try to parse the passed data as JSON
                data = JSON.parse(data);
            } catch (e) {
                error('Passed string is not a JSON string > ' + data);
            }
        }

        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || opts.useIdOnEmptyName && input.id,
                value = getFieldValue(key, opts.delimiter, data);

            if (typeof value === 'undefined' || value === null) {
                clearInput(input, opts.triggerChange);
                continue;
            }
            var mutated = nodeCallback && nodeCallback(input, value);
            if (!mutated) setValueToInput(input, value, opts.triggerChange);
        }
    }

    function getFieldValue(key, delimiter, ref) {
        if (!key) return;
        var parts = parseString(key, delimiter);
        for (var i = 0, l = parts.length; i < l; i++) {
            if (!ref) return;
            var part = ref[parts[i]];

            if (typeof part === 'undefined' || part === null) return;
            //if last
            if (i === l - 1) {
                return part;
            } else {
                var index = parts[i + 1];
                if (index === '') {
                    return part;
                } else if (isNumber(index)) {
                    //if second last
                    if (i === l - 2)
                        return part[index];
                    else
                        ref = part[index];
                    i++;
                } else {
                    ref = part;
                }
            }
        }
    }

    function contains(array, value) {
        for (var i = array.length; i--;)
            if (array[i] == value) return true;
        return false;
    }

    function setValueToInput(input, value, triggerChange) {
        var nodeType = input.type && input.type.toLowerCase();

        switch (nodeType) {
            case 'radio':
                if (value == input.value) input.checked = true;
                break;
            case 'checkbox':
                input.checked = isArray(value)
                    ? contains(value, input.value)
                    : value === true || value == input.value;
                break;
            case 'select-multiple':
                if (isArray(value))
                    for (var i = input.options.length; i--;)
                        input.options[i].selected = contains(value, input.options[i].value);
                else
                    input.value = value;
                break;
            case 'button':
            case 'submit':
            case 'reset':
            case 'file':
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
            inputs = getFields(el, opts.skipDisabled, opts.skipReadOnly);

        for (var i = 0, l = inputs.length; i < l; i++)
            clearInput(inputs[i], opts.triggerChange);
    }

    function clearInput(input, triggerChange) {
        var nodeType = input.type && input.type.toLowerCase();

        switch (nodeType) {
            case 'select-one':
                input.selectedIndex = 0;
                break;
            case 'radio':
            case 'checkbox':
                if (input.checked) input.checked = false;
                break;
            case 'button':
            case 'submit':
            case 'reset':
            case 'file':
                break;
            default:
                input.value = '';
        }
        if (triggerChange)
            triggerEvent(input, 'change');
    }

    /* Submit */
    function submit(formEl, html5Submit) {
        var el = makeElement(formEl);

        if (!html5Submit) {
            if (isFunction(el.submit))
                el.submit();
            else
                error('The element is not a form element > ' + formEl);
            return;
        }

        var clean, btn = el.querySelector('[type="submit"]');
        if (!btn) {
            clean = true;
            btn = document.createElement('button');
            btn.type = 'submit';
            btn.style.display = 'none';
            el.appendChild(btn);
        }
        triggerEvent(btn, 'click');
        if (clean) el.removeChild(btn);
    }

    /* Helper functions */
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }
    function isNumber(n) {
        return n - parseFloat(n) + 1 >= 0;
    }
    function isArray(arr) {
        return !!(arr && arr.shift); //If it shifts like an array, its a duck.
    }
    function isFunction(fn) {
        return typeof fn === 'function';
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
    }

    function makeElement(el) {
        var element = isString(el) ? document.querySelector(el) || document.getElementById(el) : el;
        if (!element) error('Element not found with ' + el);
        return element;
    }

    function getFields(parent, skipDisabled, skipReadOnly) {
        var fields = ['input', 'select', 'textarea'];
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (skipDisabled) field += ':not([disabled])';
            if (skipReadOnly) field += ':not([readonly])';
            field += ':not([data-trans-form="ignore"])';
            fields[i] = field;
        }
        return parent.querySelectorAll(fields.join(','));
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

    function error(e) {
        throw new Error('transForm.js ♦ ' + e);
    }
    /* Exposed functions */
    return {
        bind: bind,
        serialize: serialize,
        deserialize: deserialize,
        clear: clear,
        submit: submit,
        setDefaults: setDefaults
    };
}));
