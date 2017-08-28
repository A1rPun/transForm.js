(function (name, definition) {
    if (typeof module != 'undefined')
        module.exports = definition();
    else if (typeof define == 'function' && typeof define.amd == 'object')
        define(definition);
    else {
        var noConflict = this[name];
        this[name] = definition();
        if (noConflict) this[name].noConflict = noConflict;
    }
}('transForm', function () {
    var _defaults = {
        attributeIgnore: 'data-transform-ignore',
        attributeText: 'data-transform-text',
        delimiter: '.',
        deserializeClean: true,
        inputs: ['input', 'select', 'textarea'],
        skipDisabled: true,
        skipFalsy: false,
        skipReadOnly: false,
        triggerChange: false,
        useIdOnEmptyName: true,
    };

    /* Serialize */
    function serialize(formEl, options, nodeCallback) {
        var parent = makeElement(formEl),
            opts = getOptions(options),
            elements = getElements(parent, opts.skipDisabled, opts.skipReadOnly),
            result = {},
            el, key, textKey;
        for (var i = 0, l = elements.length; i < l; i++) {
            el = elements[i];
            entry = null;
            if (textKey = el.getAttribute(_defaults.attributeText)) {
                var textEntry = getTextEntryFromInput(el, textKey);
                if (isValidValue(textEntry.value, opts.skipFalsy))
                    saveEntryToResult(result, textEntry, opts.delimiter);
            }
            if (!isInput(el))
                continue;
            if (!(key = (el.name || opts.useIdOnEmptyName && el.id)))
                continue;
            var entry = getEntryFromInput(el, key);
            if (nodeCallback)
                entry = nodeCallback(el, entry);
            if (entry && isValidValue(entry.value, opts.skipFalsy))
                saveEntryToResult(result, entry, opts.delimiter);
        }
        return result;
    }

    function isValidValue(value, skipFalsy) {
        return !isType(value, 'undefined') && (!skipFalsy || (value && (!isType(value, 'array') || value.length)));
    }

    function getEntryFromInput(el, key) {
        var nodeType = el.type && el.type.toLowerCase(), value;
        switch (nodeType) {
            case 'radio':
                if (el.checked)
                    value = el.value === 'on' ? true : el.value;
                break;
            case 'checkbox':
                value = el.checked ? (el.value === 'on' ? true : el.value) : false;
                break;
            case 'select-multiple':
                value = [];
                for (var i = 0, l = el.options.length; i < l; i++)
                    if (el.options[i].selected)
                        value.push(el.options[i].value);
                break;
            case 'file':
                // Only interested in the filename (Chrome adds C:\fakepath\ for security anyway)
                value = el.value.split('\\').pop();
                break;
            case 'button':
            case 'submit':
            case 'reset':
                break;
            default:
                value = el.value;
        }
        return { name: key, value: value };
    }

    function getTextEntryFromInput(el, textKey) {
        var nodeType = el.type && el.type.toLowerCase(), textValue;
        switch (nodeType) {
            case 'select-one':
                textValue = el.options[el.selectedIndex].text;
                break;
            case 'select-multiple':
                textValue = [];
                for (var i = 0, l = el.options.length; i < l; i++)
                    if (el.options[i].selected)
                        textValue.push(el.options[i].text);
                break;
            default:
                textValue = el.textContent;
        }
        return { name: textKey, value: textValue };
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
                    // if the first one is empty, continue
                    if (j === 0)
                        continue;
                    // if the undefined key is not the last part of the string, throw error
                    if (j !== l - 1)
                        error('Undefined key is not the last part of the name > ' + str);
                }
                // strip "]" if its there
                if (key && key[key.length - 1] === ']')
                    key = key.slice(0, -1);
                result.push(key);
            }
        }
        return result;
    }

    function saveEntryToResult(parent, entry, delimiter) {
        // Don't accept falsy values in array collections. Check name first, then value
        if (/\[\]$/.test(entry.name) && !entry.value)
            return;
        var part;
        var parts = parseString(entry.name, delimiter);
        for (var i = 0, l = parts.length; i < l; i++) {
            part = parts[i];
            // if last
            if (i === l - 1) {
                parent[part] = entry.value;
            } else {
                // check if the next part is an index
                var index = parts[i + 1];
                if (!index || isType(index, 'number')) {
                    if (!isType(parent[part], 'array'))
                        parent[part] = [];
                    // if second last
                    if (i === l - 2) {
                        // array of values
                        parent[part].push(entry.value);
                    } else {
                        // array of objects
                        if (!isType(parent[part][index], 'object'))
                            parent[part][index] = {};
                        parent = parent[part][index];
                    }
                    i++;
                } else {
                    if (!isType(parent[part], 'object'))
                        parent[part] = {};
                    parent = parent[part];
                }
            }
        }
        return { pointer: parent, prop: part };
    }

    /* Deserialize */
    function deserialize(formEl, data, options, nodeCallback) {
        var parent = makeElement(formEl),
            opts = getOptions(options),
            elements = getElements(parent, opts.skipDisabled, opts.skipReadOnly);
        if (!isType(data, 'object')) {
            if (!isType(data, 'string'))
                return;
            try { // Try to parse the passed data as JSON
                data = JSON.parse(data);
            } catch (e) {
                error('Passed string is not a JSON string > ' + data);
            }
        }
        for (var i = 0, l = elements.length; i < l; i++) {
            var el = elements[i], textKey;
            if (!isInput(el)) {
                if (textKey = el.getAttribute(_defaults.attributeText))
                    el.textContent = getObjectValue(textKey, opts.delimiter, data);
                continue;
            }
            var key = el.name || opts.useIdOnEmptyName && el.id,
                value = getObjectValue(key, opts.delimiter, data);
            if (isType(value, 'undefined') || value === null) {
                opts.deserializeClean && clearInput(el, opts.triggerChange);
                continue;
            }
            var mutated = nodeCallback && nodeCallback(el, value);
            if (!mutated)
                setValueToInput(el, value, opts.triggerChange);
        }
    }

    function getObjectValue(key, delimiter, ref) {
        if (!key)
            return;
        var parts = parseString(key, delimiter);
        for (var i = 0, l = parts.length; i < l; i++) {
            if (!ref)
                return;
            var part = ref[parts[i]];
            if (isType(part, 'undefined') || part === null)
                return;
            // if last
            if (i === l - 1) {
                return part;
            } else {
                var index = parts[i + 1];
                if (index === '') {
                    return part;
                } else if (isType(index, 'number')) {
                    // if second last
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
            if (array[i].toString() === value)
                return true;
        return false;
    }

    function setValueToInput(el, value, triggerChange) {
        var nodeType = el.type && el.type.toLowerCase(),
            doChange = true;
        // In some cases 'value' will be converted toString because el.value is always a string.
        switch (nodeType) {
            case 'radio':
                if (value.toString() === el.value)
                    el.checked = true;
                else
                    doChange = false;
                break;
            case 'checkbox':
                el.checked = isType(value, 'array')
                    ? contains(value, el.value)
                    : value === true || value.toString() === el.value;
                break;
            case 'select-multiple':
                if (isType(value, 'array'))
                    for (var i = el.options.length; i--;)
                        el.options[i].selected = contains(value, el.options[i].value);
                else
                    el.value = value;
                break;
            case 'button':
            case 'submit':
            case 'reset':
            case 'file':
                break;
            default:
                el.value = value;
        }
        if (doChange && triggerChange)
            triggerEvent(el, 'change');
    }

    /* Clear */
    function clear(formEl, options) {
        var parent = makeElement(formEl),
            opts = getOptions(options),
            elements = getElements(parent, opts.skipDisabled, opts.skipReadOnly);
        for (var i = 0, l = elements.length; i < l; i++)
            clearInput(elements[i], opts.triggerChange);
    }

    function clearInput(el, triggerChange) {
        var nodeType = el.type && el.type.toLowerCase();
        switch (nodeType) {
            case 'select-one':
                el.selectedIndex = 0;
                break;
            case 'select-multiple':
                for (var i = el.options.length; i--;)
                    el.options[i].selected = false;
                break;
            case 'radio':
            case 'checkbox':
                if (el.checked)
                    el.checked = false;
                break;
            case 'button':
            case 'submit':
            case 'reset':
            case 'file':
                break;
            default:
                el.value = '';
        }
        if (triggerChange)
            triggerEvent(el, 'change');
    }

    /* Submit */
    function submit(formEl, html5Submit) {
        var el = makeElement(formEl);
        if (!html5Submit) {
            if (isType(el.submit, 'function'))
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
        if (clean)
            el.removeChild(btn);
    }

    /* Helper functions */
    function isType(t, str) {
        // This function gets the type of `t`, typeof and instanceof are unreliable (typeof null === 'object')
        return Object.prototype.toString.call(t).match(/\s([a-zA-Z]+)/)[1].toLowerCase() === str;
    }

    function isInput(el) {
        return _defaults.inputs.indexOf(el.tagName.toLowerCase()) !== -1;
    }

    function triggerEvent(el, type) {
        var e;
        if (document.createEvent) {
            e = document.createEvent('HTMLEvents');
            e.initEvent(type, true, true);
            el.dispatchEvent(e);
        } else { // old IE
            e = document.createEventObject();
            el.fireEvent('on' + type, e);
        }
    }

    function makeElement(el) {
        var element = isType(el, 'string') ? document.querySelector(el) || document.getElementById(el) : el;
        if (!element)
            error('Element not found > ' + el);
        return element;
    }

    function getElements(parent, skipDisabled, skipReadOnly) {
        var query = '[' + _defaults.attributeText + '],';
        for (var i = 0, l = _defaults.inputs.length; i < l; i++) {
            query += _defaults.inputs[i];
            if (skipDisabled)
                query += ':not([disabled])';
            if (skipReadOnly)
                query += ':not([readonly])';
            query += ':not([' + _defaults.attributeIgnore + '])';
            if (i !== l - 1)
                query += ',';
        }
        return parent.querySelectorAll(query);
    }

    function getOptions(options) {
        if (!isType(options, 'object'))
            return _defaults;
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
        serialize: serialize,
        deserialize: deserialize,
        clear: clear,
        submit: submit,
        setDefaults: setDefaults
    };
}));
