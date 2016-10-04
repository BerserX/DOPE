// JavaScript Document
/*
Syntax: :root<|.name.space|>global

(.asd.ads|asdf.asdf|(.asdf|:asdf)<.a.asd)<(asdf.asdf|:asdf.a<asdf.d)
into
(#3000|#4000)<#5000|#7000<@80.d|(#1000|#2000|#3000|#4000)<(@60.asdf|#7000)
*/

var register = [],
	ATTRIBUTES = {
		"temporary": 1,
		"ascending": 2,
		"descending": 4,
		"omnious": 8,
		"entangled": 16,
		"public": 32,
		"private": 64,
		"read": 128,
		"write": 256,
		"execute": 512,
		"dope": 1024,
		"anchor": 2048,
		"arguments": 4096,
		"instance": 8192,
		"binary": 16384,
		"executed": 32768,
		"default": 5067,
		"null": 160,
		"read_only": 5067-256-512
	},
	TOKENS = {
		"root": ":",
		"relative": ".",
		"scope": "..",
		"feeder": "<",
		"bouncer": ">",
		"separator": "|",
		"clause_start": "(",
		"clause_end": ")",
		"anchor": "&",
		"binary": "@",
		"capsule": "!",
		"target": "#",
	},
	TRANSLATION = {
		"root": 1,
		"relative": 2,
		"scope": 4,
		"feeder": 8,
		"bouncer": 16,
		"separator": 32,
		"clause_start": 64,
		"clause_end": 128,
		"anchor": 256,
		"binary": 512,
		"capsule": 1024,
		"target": 2048,
		"rangeA": 4096,
		"rangeB": 8192
	}
	OPERATION = {
		"read": 128,
		"write": 256,
		"execute": 512,
		"read_write": 128|256,
		"read_execute": 128|512,
		"write_execute": 256|512,
		"read_write_execute": 128|256|512
	};

function isSet (variable) {
	if (variable !== null && typeof variable != "undefined") {
		return true;
	}
}

function addRecord(id, scope, data, attr) {
	var record = {
		'id': id,
		'scope': scope,
		'data': (!isSet (data) ? "#0" : data),
		'attributes': (!isSet (attr) ? ATTRIBUTES.default : attr) 
	};
	register.push(record);
	return register.length-1;
}

function isRecord (record) {
	if (record >= 0 && register.length > record) {
		return true;
	}
	console.log ("Record: "+record+" does not exist in register.");
	return false;
}

function getRecordByScope(scope, offset) {
	for (var x = (offset ? offset : 0); x >= 0 && x < register.length; x++) {
		if (register[x].scope == scope) {
			return x;
		}
	}
	return -1;
}

function getRecordById(id, offset) {
	for (var x = (offset ? offset : 0); x >= 0 && x < register.length; x++) {
		if (register[x].id == id) {
			return x;
		}
	}
	return -1;
}

function getRecordByIdAndScope(id, scope, offset) {
	for (var x = (offset ? offset : 0); x >= 0 && x < register.length; x++) {
		if (register[x].id == id && register[x].scope == scope) {
			return x;
		}
	}
	return -1;
}

function getId(record) {
	if (isRecord (record)) {
		return register[record].id;
	}
	return -1;
}

function getScope(record) {
	if (isRecord (record)) {
		return register[record].scope;
	}
	return -1;
}

function getData(record) {
	if (isRecord (record)) {
		return register[record].data;
	}
	return "";
}

function getAttributes(record) {
	if (isRecord (record)) {
		return register[record].attributes;
	}
	return -1;
}

function expandScope(id, scope) {
	return (scope+id)/2;
}

function retractScope(id, scope) {
	return scope*2-id;
}

function hash32(str) {
	var hash = 0;
	for (var x = 0; x < str.length; x++) {
		hash = ((hash << 5) | (hash >> 27)) + str[x];
	}
	return hash;
}

function isChild (srcRecord, dstRecord) {
	// Check if child
	var record = srcRecord;
	while (isRecord(record = getRecordById (getScope (record))) && getId (record) != "root" && getId(record) != getScope(record)) {
		//console.log (getId (record));
		if (getId (record) == getId (dstRecord)) {
			return true;
		}
	}
	return false;
}

function isParent (srcRecord, dstRecord) {
	// Check if par
	record = dstRecord;
	while (isRecord (record = getRecordById (getScope (record))) && getId (record) != "root" && getId(record) != getScope(record)) {
		if (getId (record) == getId (srcRecord)) {
			return true;
		}
	}
	return false;
}

function isSibling (srcRecord, dstRecord) {
	// Check if visible as a sibling
	if (getId(srcRecord) != getId(dstRecord) && getScope (srcRecord) == getScope (dstRecord)) {
		return true;
	}
	return false;
}

function isFamily (srcRecord, dstRecord) {
	var srcAttribute = getAttributes (srcRecord),
		dstAttribute = getAttributes (dstRecord);
	if ((dstAttribute & ATTRIBUTES.ascending) == ATTRIBUTES.ascending && isChild (srcRecord, dstRecord)) {
		// Check if child
		return true;
	}
	if ((dstAttribute & ATTRIBUTES.descending) == ATTRIBUTES.descending && isParent (srcRecord, dstRecord)) {
		// Check if parent
		return true;
	}
	if ((dstAttribute & ATTRIBUTES.omnious) == ATTRIBUTES.omnious && isSibling (srcRecord, dstRecord)) {
		// Check if sibling
		return true;
	}
	return false;
}

function isAccessible (srcRecord, dstRecord, operation) {
	var accessible = false,
		srcAttribute = getAttributes (srcRecord),
		dstAttribute = getAttributes (dstRecord);
	if (srcAttribute & ATTRIBUTES.dope) {
		return true;
	}
	if (isFamily (srcRecord, dstRecord)) {
		if ((dstAttribute & ATTRIBUTES.private) == ATTRIBUTES.private) {
			// Check if accessible as family
			accessible = true;
		}
	} else {
		if ((dstAttribute & ATTRIBUTES.public) == ATTRIBUTES.public) {
			// Check if accessible as non family
			accessible = true;
		}
	}
	if (accessible) {
		if (operation == ((OPERATION.read | OPERATION.write | OPERATION.execute) & dstAttribute & operation)) {
			return true;
		}
	}
	return false;
}

function execute(record, args) {
	var target_stack = [],
		arg_stack = [],
		scope_trace = [],
		token, record, data, attr, offset, charInt,
		target = "",
		_address = false;
		_addToStack = false,
		_addToTrace = false,
		_removeFromStack = false,
		_removeFromTrace = false,
		_clearStack = false,
		_clearTrace = false,
		_root = false,
		_self = false,
		_parent = false,
		_feed = false,
		_bounce = false,
		_clause = 0,
		_aquire = false,
		entryRecord = record,
		scope = getScope(record),
		data = getData(record),
		attr = getAttributes(record);
	for (var x = 0; x < data.length; x++) {
		token = data[x];
		charInt = data.charCodeAt (x);
		if (attr & ATTRIBUTES.binary) {
			// Binary
		} else {
			console.log (token);
			
			if (token == TOKENS.root) {
				_expect = TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|
				/*
				// Root
				// .child:API|:parent 
				_root = true;
				if (_aquire) {
					_addToStack = true;
					_aquire = false;
				}*/
			} else if (token == TOKENS.relative) {
				// Self or parent
				if (_self) {
					_parent = true;
					_self = false;
					if (_aquire) {
						_removeFromTrace = true;
						_aquire = false;
					}
				} else {
					_self = true;
					if (_aquire) {
						_addToTrace = true;
						_aquire = false;
					}
				}
			} else if (token == TOKENS.feeder) {
				// Feeder
				_feed = true;
			} else if (token == TOKENS.bouncer) {
				// Bouncer
				_bounce = true;
			} else if (token == TOKENS.separator) {
				// Separator
				_separate = true;
				if (_aquire) {
					_addToStack = true;
				}
			} else if (token == TOKENS.clause_start) {
				// Nesting start
				_clause++;
			} else if (token == TOKENS.end) {
				// Nesting end
				_clause--;
			} else if (token == TOKENS.anchor) {
				// Anchor
				
			} else if (token == TOKENS.binary) {
				// Binary reference
				
			} else if (token == TOKENS.capsule) {
				// Capsule
				
			} else if (token == TOKENS.target) {
				// Target
				// #543.child|#890 
				_address = true;
			} else {
				// Read to target all other characters
				if (token.charCodeAt (0) > )
				target += token;
				_aquire = true;
			}
			if (x == data.length-1) {
				/*
				if (_aquire) {
					_addToTrace = true;
					_addToStack = true;
				}
				_aquire = false;
				*/
			}
			/*
			if (_aquire) {
				continue;
			}
			// Logic based on tokens
			if (_address) {
				console.log (isRecord (parseInt(target)));
			}
			if (_addToTrace) {
				console.log ("addToTrace");
				// Add child to trace
				try {
					console.log (target+"-"+record+"-"+getId (record));
					record = getRecordByIdAndScope (target, getId(record));
					if (isRecord (record)) {
						if (!isAccessible(entryRecord, record, OPERATION.read)) {
							throw "Unable to read child "+getId (record);
						}
					} else {
						record = addRecord (target, getId(record));
						console.log (record);
						if (!isAccessible(entryRecord, getRecordById(scope), OPERATION.write)) {
							throw "Unable to initiate child "+getId (record)+" under parent "+scope;
						}
					}
					scope = getScope(record);
				} catch (e) {
					console.log (e);
				}
				/*
				if (record == -1) {
					console.log (record);
					record = addRecord (btoa(target), scope);
				}
				scope = getScope (record);
				///
				target = "";
				_addToTrace = false;
			}
			if (_addToStack) {
				console.log ("addToStack");
				// Add record to stack
				record = entryRecord;
				scope = getScope (record);
				target = "";
				_addToStack = false;
			}
			if (_removeFromTrace) {
				console.log ("removeFromTrace");
				// Get parent record from stack
				// .parent..child
				// ..child
				try {
					record = getRecordById(scope);
					if (!isAccessible (entryRecord, record, OPERATION.read)) {
						throw "Unable to access parent "+scope;
					}
					scope = getScope (record);
				} catch (e) {
					console.log (e);
				}
				_removeFromTrace = false;
			}
			if (_root) {
				console.log ("root");
				// Get root record 
				record = getRecordByIdAndScope("root", "root");
				scope = getScope (record);
				_addToStack = false;
				_root = false;
			}
			*/
		}
	}
}

function parse(scope) {
	var target_stack = [],
		target_counter_stack = [],
		arg_stack = [],
		arg_counter_stack = [],
		scope_stack = [],
		char, prev_char, id, statements, output = "";
	statements = getData(getRecordByScope(scope));
	scope_stack.push(scope);
	for (var x = 0; x < statements.length; x++) {
		char = statements[x];
		if (char == ".") {
			if (id.length != 0) {
				id = hash32(id);
				if (!scope) {
					scope = getScope(getRecordById(id));
					// fetch all matches
				}
				scope = expandScope(id, scope);
				id = "";
			} else if (prev_char == ".") {
				scope = retractScope(getId(getRecordByScope(scope)), scope);
			} else {
				scope = scope_stack[scope_stack.length-1];
			}
		} else if (char == ":") {
			scope = 0;
		} else if (char == "(") {
			if (feb) {
				target_sub_stack.push(0);
			} else {
				arg_sub_stack.push (0);
			}
		} else if (char == ")") {
			if (prev_char == ")") {
				
			}
		} else if (char == "<") {
			feb = true;
		} else if (char == ">") {
			feb = false;
		} else if (char == "|") {
			if (prev_char == ")") {
				
			}
			if (feb) {
				target_stack.push();
			} else {
				arg_stack.push ();
			}
		} else {
			id += char;
		}
		prev_char = char;
	}
}