#transForm.js
Javascript library for manipulating html forms.
It's goal is to easily transform html forms to structured javascript objects and vice versa.

##Functions

- [`transForm.serialize()`](#serialize)
- [`transForm.deserialize()`](#deserialize)
- [`transForm.clear()`](#clear)
- [`transForm.submit()`](#submit)
- [`transForm.bind()`](#bind)
- [`transForm.setDefaults()`](#setdefaults)

##Installation

Just add `transForm.js` to your HTML page like this

	<script src="transForm.js"></script>
    
Then use the `transForm` namespace to use the awesome!


### Install with bower

    bower install --save trans-form
    
Add the source to the HTML:
    
    <script src="bower_components/trans-form/src/transForm.js"></script>

##Usage

Basic example:

	<form id="transform">
		<input type="text" name="transform" value="transform">
	</form>

Pass a query string or an `HTMLElement` to any of the functions.
The parent element can be any element but `.submit()` will only work with `<form>` elements.

	var obj = transForm.serialize('#transform');

Variable `obj` now holds this object:

	{ transform: 'transform' }

To deserialize this object into the form use the same structure

	transForm.deserialize('#transform', obj);

Using the `.` delimiter, one can specify an object inside the result object.
Other structures:

	<form id="transform">
		<input type="text" name="person.name" value="Gino Dino">
		<input type="text" name="person[job]" value="Programmer">
		<input type="checkbox" name="person.hobbies[]" value="Programming" checked>
		<input type="checkbox" name="person.hobbies[]" value="Gaming">
		<input type="text" name="person.address[0].street" value="Inspirationstreet">
		<input type="text" name="person.address[1].street" value="Objectionlane">
		<input type="text" name="t.r.a.n.s.f.o.r.m" value="transform">
	</form>

Outputs:

	{
		person: {
			name: 'Gino Dino',
			job: 'Programmer',
			hobbies: [
				'Programming'
			],
			address: [{
				street: 'Inspirationstreet'
			},{
				street: 'Objectionlane'
			}]
		},
		t:{r:{a:{n:{s:{f:{o:{r:{m:{}}}}}}}}}
	}

To ignore an input, select or textarea you can add the ignore data attribute like this:

    data-trans-form="ignore"

##History
This project is inspired by [maxatwork/form2js](https://github.com/maxatwork/form2js).  
transForm is even compatible with the object notation of form2js/js2form.
transForm is a more flexible & faster library build for HTML5. 

##Functions

##<a name="serialize"></a>`transForm.serialize()`
Serializes all child inputs from any HTML element to a JavaScript object

###Params

- formElement - Can be a `HTMLElement` or a querySelector string
- options - An object containing the serialize options
- nodeCallback - Function that will be executed for every input (param: `input`, `key`). Return an `{ name: key, value: null }` object where the `name` is the property string of the resulting object & the `value` is any truthy JavaScript value (Ex: `{ name: text.input, value: true }` results in `{ text: { input: true } }` ). 

###Example

	<form id="myForm">
		<input name="test" value="transform">
	</form>

	var myFormObject = transForm.serialize('#myForm');
	console.log(myFormObject.test); //'transform'

##<a name="deserialize">`transForm.deserialize()`
Deserializes a JavaScript object or a valid JSON string to the child inputs from any HTML element

###Params

- formElement - Can be a `HTMLElement` or a querySelector string
- data - The object that needs to be deserialized
- options - An object containing the deserialize options
- nodeCallback - Function that will be executed for every input (params: `input`, `value`) return a truthy value to skip deserializing that input, return nothing to apply the default deserialization.

###Example

	<form id="myForm">
		<input name="test">
	</form>

	transForm.deserialize('#myForm', { test: 'transform' });

##<a name="clear">`transForm.clear()`
Clears the value of all child inputs from any HTML element. Selects & Radio's will be defaulted to the first option.

###Params

- formElement - Can be a `HTMLElement` or a querySelector string
- options - An object containing the clear options

###Example

	transForm.clear('#myForm');

##<a name="submit">`transForm.submit()`
Submits a form element which triggers the `submit` event of the form. You can programmatically trigger the HTML5 validation of the form by passing `true` as 2nd param, this creates a button on the fly when there is no submit button inside the form.

###Params

- formElement - Can be a `HTMLElement` or a querySelector string
- HTML5Submit - HTML5 validation triggers only on submit button click, if there is no submit button it will create one (destroyed afterwards).

###Example

	transForm.submit('#myForm', true);

##<a name="bind">`transForm.bind()`
Creates a two-way data binding for all child inputs from any HTML element.

###Params

- formElement - Can be a `HTMLElement` or a querySelector string
- options - An object containing the bind options
- serializeCallback - The nodeCallback from the serialize function (triggers on change, can be overwritten by the `bindListener` option)
- deserializeCallback - The nodeCallback from the deserialize function (triggers on the setter of the property)

###Example

	<form id="myForm">
		<input name="test" value="transform">
	</form>

	var myFormObject = transForm.bind('#myForm');
	myFormObject.test = 'instant';
	

##<a name="setdefaults">`transForm.setDefaults()`
Overrides the default options in the `transForm` instance.

###Params

- defaults - An object containing the default options

###Example

	//These are the current defaults
	transForm.setDefaults({
		delimiter: '.', //The delimiter seperates the object keys (serialize, deserialize, bind)
		skipDisabled: true, //Skip inputs that are disabled (serialize, deserialize, clear, bind)
		skipReadOnly: false, //Skip inputs that are readonly (serialize, deserialize, clear, bind)
		skipFalsy: false, //Skip inputs that have falsy values (0, false, null, undefined, '') (serialize)
		useIdOnEmptyName: false, //If an input has no name attribute it will fallback to its id attribute (serialize, deserialize, bind)
        triggerChange: false, //Fires the change listener for every field when deserializing (even if the value is not changed) (deserialize)
		bindListener: 'change' //The event where the bind fnuction updates its object (bind)
	});

#TODO's

- Gulp for automated
	- Distribution
	- Testing & Code coverage
- Online examples / docs
	

#Browser support
Supports >=IE9 and latest versions of modern browsers.