function DOPE () {
	if (!(this instanceof DOPE)) {
		throw new Error ("Constructor cannot be called as a function.");
	}
	
	var _self = this;
	
	require = function require (module) {
		console.log ("Required module: '"+module+"'.");
		if (!isSet (_self[module])) {
			console.log ("Required module: '"+module+"' missing.");
		} else {
			console.log ("Required module: '"+module+"' found.");
		}
	}
	
	isSet = function isSet (variable) {
		if (variable !== null && typeof variable != "undefined") {
			return true;
		}
	}
	
	hash32 = function (str) {
		var hash = 0;
		for (var x = 0; x < str.length; x++) {
			hash = ((hash << 5) | (hash >> 27)) + str.codePointAt (x);
		}
		return hash;
	}
	
	setFlag = function (flag, bitmask) {
		return (flag|bitmask);
	}

	hasFlag = function (flag, bitmask) {
		return ((flag & bitmask) == flag);
	}

	clearFlag = function (flag, bitmask) {
		return (~flag & bitmask);
	}
	
	// initialize all modules
	for (var module in _self) {
		console.log ("Module: '"+module+"' found.");
		if (_self[module] instanceof Function) {
			_self[module] = new _self[module] ();
			if (isSet (_self[module].init)) {
				_self[module].init (module);
				console.log ("Module: '"+module+"' initiated.");
			}
		}
		eval (module+" = _self[module];");
	}
}
