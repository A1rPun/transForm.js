#transForm.js
Javascript library for manipulating html forms

##`transForm.serialize()`
Serializes the HTML form to a JavaScript object

###Params

- formElement - Can be an HTMLElement or querySelector string
- nodeCallback - Function that will be executed for every input (param: input)
- options - An object containing serialize options

###Example

	var myFormObject = transForm.serialize('#myForm');

##`transForm.deserialize()`
Deserializes a JavaScript object to a HTML form

###Params

- formElement - Can be an HTMLElement or querySelector string
- data - The data that needs to be deserialized
- nodeCallback - Function that will be executed for every input (params: input, value)
- options - An object containing deserialize options

###Example

	transForm.deserialize('#myForm', { myInputName: 'myValue' });

##`transForm.setDefaults()`
Overrides the default options in the `transForm` instance.

###Params

- defaults - An object containing the default options

###Example

	//These are the current defaults
	transForm.setDefaults({
		delimiter: '.', //The delimiter seperates the object keys (serialize, deserialize)
		skipDisabled: true, //Skip inputs that are disabled (serialize, deserialize)
		skipFalsy: false, //Skip inputs that have falsy values (0, false, null, undefined, '') (serialize)
		useIdOnEmptyName: false, //If an input has no name attribute it will fallback to its id attribute (serialize, deserialize)
		triggerChange: false//TODO: implement fireevent (deserialize)
	});

#TODO's

- better playground/examples :)
- performance test
- unittest
- trigger change event after setting its value (option)
- own indexOf function that matches == and not === (for values)
- jQuery/Zepto plugin

#Browser support
Supports >=IE9 and latest versions of modern browsers.