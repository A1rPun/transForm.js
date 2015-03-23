#transForm.js
Javascript library for manipulating html forms

##`transForm.serialize()`
Serializes the HTML form to a JavaScript object

###Params

- formElement - Can be an HTMLElement or querySelector string
- options - An object containing serialize options
- nodeCallback - Function that will be executed for every input (param: input)

###Example

	var myFormObject = transForm.serialize('#myForm');

##`transForm.deserialize()`
Deserializes a JavaScript object to a HTML form

###Params

- formElement - Can be an HTMLElement or querySelector string
- data - The data that needs to be deserialized
- options - An object containing deserialize options
- nodeCallback - Function that will be executed for every input (params: input, value)

###Example

	transForm.deserialize('#myForm', { myInputName: 'myValue' });

##`transForm.clear()`
Clears a form so that every input has no value.

###Params

- formElement - Can be an HTMLElement or querySelector string
- options - An object containing clear options

###Example

	transForm.clear('#myForm');

##`transForm.setDefaults()`
Overrides the default options in the `transForm` instance.

###Params

- defaults - An object containing the default options

###Example

	//These are the current defaults
	transForm.setDefaults({
		delimiter: '.', //The delimiter seperates the object keys (serialize, deserialize)
		skipDisabled: true, //Skip inputs that are disabled (serialize, deserialize, clear)
		skipFalsy: false, //Skip inputs that have falsy values (0, false, null, undefined, '') (serialize)
		useIdOnEmptyName: false, //If an input has no name attribute it will fallback to its id attribute (serialize, deserialize)
        triggerChange: false //Fires the change listener for every field when deserializing (even if the value is not changed)
	});

#TODO's

- Unit test
- Performance test
- jQuery/Zepto plugin

#Browser support
Supports >=IE9 and latest versions of modern browsers.