# transForm.js
Javascript library for manipulating html forms.
It's goal is to easily transform html forms to structured javascript objects and vice versa.

## Functions

- [`transForm.serialize()`](#serialize)
- [`transForm.deserialize()`](#deserialize)
- [`transForm.clear()`](#clear)
- [`transForm.submit()`](#submit)
- [`transForm.setDefaults()`](#setdefaults)

## Installation

Just add `transForm.js` to your HTML page like this
```html
<script src="transForm.js"></script>
```
Then use the `transForm` namespace to use the awesome!

### Install with NPM
```
npm install --save trans-form
```
Add the source to the HTML:
```html    
<script src="node_modules/trans-form/dist/transForm.min.js"></script>
```
### Install with bower
```
bower install --save trans-form
```
Add the source to the HTML:
```html    
<script src="bower_components/trans-form/dist/transForm.min.js"></script>
```
## Usage

Basic example:
```html
<form id="transform">
  <input name="test" value="transform">
</form>
```
Pass a query string or an `HTMLElement` to any of the functions.
The parent element can be any element but `.submit()` will only work with `<form>` elements.
```js
var obj = transForm.serialize('#transform');
```
Variable `obj` now holds this object:
```js
{ test: 'transform' }
```
To deserialize this object into the form use the same structure

	transForm.deserialize('#transform', obj);

Using the `.` delimiter, one can specify an object inside the result object.
Other structures:
```html
<form id="transform">
  <input name="person.name" value="Thom Bakker">
  <input name="person[job]" value="Programmer">
  <input name="person.hobbies[]" type="checkbox" value="Programming" checked>
  <input name="person.hobbies[]" type="checkbox" value="Gaming">
  <input name="person.address[0].street" value="Inspirationstreet">
  <input name="person.address[1].street" value="Objectionlane">
  <input name="t.r.a.n.s.f.o.r.m" value="foo">
</form>
```
Outputs:
```js
{
  person: {
    name: 'Thom Bakker',
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
  t:{r:{a:{n:{s:{f:{o:{r:{m: 'foo' }}}}}}}}
}
```
To ignore an input, select or textarea you can add the ignore data attribute like this:
```html
<input name="ignoreme" data-transform-ignore />
```
## History
This project is inspired by [maxatwork/form2js](https://github.com/maxatwork/form2js).  
transForm is even compatible with the object notation of form2js/js2form.
transForm is a more flexible & faster library build for HTML5. 

## Functions

## <a name="serialize"></a>`transForm.serialize()`
Serializes all child inputs from any HTML element to a JavaScript object

### Params

- parentElement - Can be a `HTMLElement` or a querySelector string
- options - An object containing the serialize options
- nodeCallback - Function that will be executed for every input (param: `input`, `entry`). Return the entry `{ name, value }` object where the `name` is the property string of the resulting object & the `value` is any value (Ex: `{ name: 'text.input', value: true }` results in `{ text: { input: true } }` ). 

### Example
```html
<form id="myForm">
  <input name="test" value="transform">
</form>
```
```js
var myFormObject = transForm.serialize('#myForm');
console.log(myFormObject.test); //'transform'
```
## <a name="deserialize">`transForm.deserialize()`
Deserializes a JavaScript object or a valid JSON string to the child inputs from any HTML element

### Params

- parentElement - Can be a `HTMLElement` or a querySelector string
- data - The object that needs to be deserialized
- options - An object containing the deserialize options
- nodeCallback - Function that will be executed for every input (params: `input`, `value`) return a truthy value (Ex: `return true`) to skip deserializing that input, return nothing to apply the default deserialization.

### Example
```html
<form id="myForm">
  <input name="test">
</form>
```
```js
transForm.deserialize('#myForm', { test: 'transform' });
```
## <a name="clear">`transForm.clear()`
Clears the value of all child inputs from any HTML element. Selects & Radio's will be defaulted to the first option.

### Params

- parentElement - Can be a `HTMLElement` or a querySelector string
- options - An object containing the clear options

### Example
```js
transForm.clear('#myForm');
```
## <a name="submit">`transForm.submit()`
Submits a form element which triggers the `submit` event of the form. You can programmatically trigger the HTML5 validation of the form by passing `true` as 2nd param, this creates a button on the fly when there is no submit button inside the form.

### Params

- parentElement - Can be a `HTMLElement` or a querySelector string
- HTML5Submit - HTML5 validation triggers only on submit button click, if there is no submit button it will create one (destroyed afterwards).

### Example
```js
transForm.submit('#myForm', true);
```
## <a name="setdefaults">`transForm.setDefaults()`
Overrides the default options in the `transForm` instance.

### Params

- defaults - An object containing the default options

### Example
```js
// These are the current defaults
transForm.setDefaults({
  delimiter: '.', //The delimiter seperates the object keys (serialize, deserialize)
  skipDisabled: true, //Skip inputs that are disabled (serialize, deserialize, clear)
  skipReadOnly: false, //Skip inputs that are readonly (serialize, deserialize, clear)
  skipFalsy: false, //Skip inputs that have falsy values (0, false, null, undefined, '') (serialize)
  useIdOnEmptyName: false, //If an input has no name attribute it will fallback to its id attribute (serialize, deserialize)
  triggerChange: false, //Fires the change listener for every field when deserializing (even if the value is not changed) (deserialize)
});
```
# TODO's

- Npm for automated
    - Distribution
    - Unit tests
	- Code coverage
- Online examples / docs
	

# Browser support
Supports >=IE9 and latest versions of modern browsers.
