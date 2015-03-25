#transForm.js
Javascript library for manipulating html forms.
It's goal is to easily transform html forms to structured javascript objects and vice versa.

##Functions

- [`transForm.serialize()`](#serialize)
- [`transForm.deserialize()`](#deserialize)
- [`transForm.clear()`](#clear)
- [`transForm.submit()`](#submit)
- [`transForm.setDefaults()`](#setdefaults)

##Usage

Basic example:

	<form id="transform">
		<input type="text" name="transform" value="transform">
	</form>

The parent element can be any element but `.submit()` will only work with `<form>` elements.

	var obj = transForm.serialize('#transform');

Variable `obj` holds this object:

	{ transform: 'transform' }

To deserialize this object into the form use the same structure

	transForm.deserialize('#transform', obj);

Using the "." delimiter one can specify an object inside the result object.
Other structures:

	<form id="transform">
		<input type="checbox" name="checked" checked>
		<input type="text" name="person.name" value="Gino Dino">
		<input type="text" name="person[job]" value="Programmer">
		<input type="text" name="person.hobbies[]" value="Programming">
		<input type="text" name="person.hobbies[]" value="Gaming">
		<input type="text" name="person.address[0].street" value="Inspirationstreet">
		<input type="text" name="person.address[1].street" value="Objectionlane">
		<input type="text" name="t.r.a.n.s.f.o.r.m" value="transform">
	</form>

Outputs:

	{
		checked: true,
		person: {
			name: 'Gino Dino',
			job: 'Programmer',
			hobbies: [
				'Programming',
				'Gaming'
			],
			address: [{
				street: 'Inspirationstreet'
			},{
				street: 'Objectionlane'
			}]
		},
		t:{r:{a:{n:{s:{f:{o:{r:{m:{}}}}}}}}}
	}


###An example with the object notation

###History
This project is inspired by [maxatwork/form2js](https://github.com/maxatwork/form2js).  
`transForm.js` is even compatible with the object notation of form2js/js2form.

##Installation

(Optional) With Bower:

    bower install --save trans-form

Just add `transForm.js` to your HTML page like this

	<script src="transForm.js"></script>
    <!-- (Optional) Bower -->
    <script src="bower_components/trans-form/src/transForm.js"></script>

Then use the `transForm` namespace to use the awesome!

##Functions

##<a name="serialize"></a>`transForm.serialize()`
Serializes the HTML form to a JavaScript object

###Params

- formElement - Can be an HTMLElement or querySelector string
- options - An object containing serialize options
- nodeCallback - Function that will be executed for every input (param: input)

###Example

	var myFormObject = transForm.serialize('#myForm');

##<a name="deserialize">`transForm.deserialize()`
Deserializes a JavaScript object to a HTML form

###Params

- formElement - Can be an HTMLElement or querySelector string
- data - The data that needs to be deserialized
- options - An object containing deserialize options
- nodeCallback - Function that will be executed for every input (params: input, value)

###Example

	transForm.deserialize('#myForm', { myInputName: 'myValue' });

##<a name="clear">`transForm.clear()`
Clears a form so that every input has no value.

###Params

- formElement - Can be an HTMLElement or querySelector string
- options - An object containing clear options

###Example

	transForm.clear('#myForm');

##<a name="submit">`transForm.submit()`
Submits a form which triggers the submit event of the form.
If the HTML5 flag is true, It will validate the form the HTML5 way. Ex: with the `required` and `pattern` attributes.

###Params

- formElement - Can be an HTMLElement or querySelector string
- HTML5Submit - HTML5 validation triggers only on submit button click, with this param one can submit a form without a button.

###Example

	transForm.submit('#myForm', true);

##<a name="setdefaults">`transForm.setDefaults()`
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