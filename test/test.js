(function () {
    var out = document.getElementById('output'),
        myForm = document.getElementById('myForm'),
		btnSerialize = document.getElementById('serialize'),
		btnDeserialize = document.getElementById('deserialize'),
		btnClear = document.getElementById('clear'),
		btnSubmit = document.getElementById('submit');
	btnSerialize.addEventListener('click', serialize);
	btnDeserialize.addEventListener('click', deserialize);
	btnClear.addEventListener('click', clear);
	btnSubmit.addEventListener('click', submit);
	myForm.addEventListener('submit', function (e) { e.preventDefault() });

    var allInputs = myForm.querySelectorAll('input,textarea,select'),
        handler = function () {
            var me = this;
            me.style.backgroundColor = '#BADA55';
            setTimeout(function () {
                me.style.backgroundColor = '';
            }, 1000);
        };
	for (var i = allInputs.length; i--;)
	    allInputs[i].addEventListener('change', handler);

	function getOptions() {
		return transForm.serialize('#options', { useIdOnEmptyName: true });
	}

	function deserialize() {
        //TODO: validate
		transForm.deserialize(myForm, out.value, getOptions());
	}

	function serialize() {
		var obj = transForm.serialize(myForm, getOptions());
		out.value = JSON.stringify(obj, null, 4);
	}

	function clear() {
		transForm.clear(myForm, getOptions());
	}

	function submit() {
	    transForm.submit(myForm, true);
	}

	serialize();
}());
