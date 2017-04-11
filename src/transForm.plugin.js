/*
//Defaults can be overwritten in $tyle
$.fn.transForm.defaults.useIdOnEmptyName = false;
//Methods can be chained
$('div').transForm('deserialize', {library: 'jQuery/Zepto'}).transForm('submit');
//Return value of serialize is an array of objects
var test = $('div').transForm('serialize');
//TODO:
- Tests
- MOAR $$$ functions!
*/

(function ($) {

    var methods = {
        serialize: serialize,
        deserialize: deserialize,
        clear: clear,
        submit: submit,
    };

    $.extend($.fn, {
        transForm: function (methodOrOptions) {
            if (methods[methodOrOptions]) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (methodOrOptions === 'serialize') {
                    var result = [];
                    this.each(function () {
                        result.push(methods[methodOrOptions].apply(this, args));
                    });
                    return result;
                } else
                    return this.each(function () {
                        methods[methodOrOptions].apply(this, args);
                    });
            } else {
                error('Method ' + methodOrOptions + ' does not exist on transForm.js');
            }
        }
    });

    $.fn.transForm.defaults = {
        delimiter: '.',
        skipDisabled: true,
        skipReadOnly: false,
        skipFalsy: false,
        useIdOnEmptyName: true,
        triggerChange: false
    };

    /* Serialize */
    function serialize(options, nodeCallback) {
        var result = {},
            opts = getOptions(options),
            inputs = getFields(this, opts.skipDisabled, opts.skipReadOnly),
            skipFalsy = opts.skipFalsy,
            delimiter = opts.delimiter,
            useIdOnEmptyName = opts.useIdOnEmptyName;

        for (var i = 0, l = inputs.length; i < l; i++) {
            var input = inputs[i],
                key = input.name || useIdOnEmptyName && input.id;

            if (!key) continue;

            var entry = null;
            if (nodeCallback) entry = nodeCallback(input);
            if (!entry) entry = getEntryFromInput(input, key);

            if (typeof entry.value === 'undefined' || entry.value === null
                || (skipFalsy && (!entry.value || (isArray(entry.value) && !entry.value.length))))
                continue;
            saveEntryToResult(result, entry, input, delimiter);
        }
        return result;
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

    function saveEntryToResult(parent, entry, input, delimiter) {
        //not not accept falsy values in array collections
        if (/\[\]$/.test(entry.name) && !entry.value) return;
        var parts = parseString(entry.name, delimiter);
        for (var i = 0, l = parts.length; i < l; i++) {
            var part = parts[i];
            //if last
            if (i === l - 1) {
                parent[part] = entry.value;
            } else {
                var index = parts[i + 1];
                if (!index || isNumber(index)) {
                    if (!isArray(parent[part]))
                        parent[part] = [];
                    //if second last
                    if (i === l - 2) {
                        parent[part].push(entry.value);
                    } else {
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
    }

    /* Deserialize */
    function deserialize(data, options, nodeCallback) {
        var opts = getOptions(options),
            triggerChange = opts.triggerChange,
            inputs = getFields(this, opts.skipDisabled, opts.skipReadOnly);

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
                clearInput(input, triggerChange);
                continue;
            }
            var mutated = nodeCallback && nodeCallback(input, value);
            if (!mutated) setValueToInput(input, value, triggerChange);
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
            $(input).change();
    }

    /* Clear */
    function clear(options) {
        var opts = getOptions(options),
            triggerChange = opts.triggerChange,
            inputs = getFields(this, opts.skipDisabled, opts.skipReadOnly);

        for (var i = 0, l = inputs.length; i < l; i++)
            clearInput(inputs[i], triggerChange);
    }

    function clearInput(input, triggerChange) {
        var nodeType = input.type && input.type.toLowerCase();

        switch (nodeType) {
            case 'select-one':
                input.selectedIndex = 0;
                break;
			case 'select-multiple':
				for (var i = input.options.length; i--;)
					input.options[i].selected = false;
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
            $(input).change();
    }

    /* Submit */
    function submit(html5Submit) {
        var el = this;
        if (!html5Submit) {
            if (isFunction(el.submit))
                el.submit();
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
        $(btn).click();
        if (clean) el.removeChild(btn);
    }

    /* Helper functions */
    function isObject(obj) {
        return $.type(obj) === 'object';
    }
    function isNumber(n) {
        return $.type(n) === 'number';
    }
    function isArray(arr) {
        return $.type(arr) === 'array';
    }
    function isFunction(fn) {
        return $.type(fn) === 'function';
    }
    function isString(s) {
        return $.type(s) === 'string';
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
        var _defaults = $.fn.transForm.defaults;
        if (!isObject(options)) return _defaults;
        var o, opts = {};
        for (o in _defaults) opts[o] = _defaults[o];
        for (o in options) opts[o] = options[o];
        return opts;
    }

    function error(e) {
        $.error('transForm.js ♦ ' + e);
    }
})(window.Zepto || window.jQuery);
