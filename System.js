DOPE.prototype.System = function () {
	
	var _self = this,
	register = [];
	
	ATTRIBUTES = {
		"temporary": 1,
		"ascending": 2,
		"descending": 4,
		"diverging": 8,
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
	};
	
	TOKENS = {
		"root": ":",
		"relative": ".",
		"feeder": "<",
		"bouncer": ">",
		"separator": "|",
		"clause_start": "(",
		"clause_end": ")",
		"anchor": "&",
		"binary": "@",
		"capsule": "!",
		"static": "#"
	};
	
	TRANSLATION = {
		"none": 0,
		"root": 1,
		"relative": 2,
		"parent": 4,
		"feeder": 8,
		"bouncer": 16,
		"separator": 32,
		"clause_start": 64,
		"clause_end": 128,
		"anchor": 256,
		"binary": 512,
		"capsule": 1024,
		"static": 2048,
		"rangeA": 4096,
		"rangeB": 8192,
		"arguments": 16384,
		"fault": 32768
	};
	
	EXPECTATIONS = {
		"none": TRANSLATION.none,
		"default": TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static,
		"root": TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA,
		"relative": TRANSLATION.relative|TRANSLATION.parent|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA,
		"parent": TRANSLATION.relative|TRANSLATION.parent|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA,
		"feeder": TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA|TRANSLATION.static,
		"bouncer": TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA|TRANSLATION.static,
		"separator": TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static,
		"clause_start": TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static,
		"clause_end": TRANSLATION.relative|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static|TRANSLATION.separator,
		"anchor": 256,
		"binary": 512,
		"capsule": 1024,
		"static": TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeB,
		"rangeA": TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA,
		"rangeB": TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeB
	};
	
	ACTION = {
		"none": 0,
		"aquire": 1,
		"root": 2,
		"relative": 4,
		"parent": 8,
		"static": 16,
		"separator": 32,
		"self": 64,
		"feeder": 128,
		"bouncer": 256
	};
	
	OPERATION = {
		"read": 128,
		"write": 256,
		"execute": 512,
		"read_write": 128|256,
		"read_execute": 128|512,
		"write_execute": 256|512,
		"read_write_execute": 128|256|512
	};
	
	return {
		'init': init,
		'addRecord': addRecord,
		'isRecord': isRecord,
		'getRecordPath': getRecordPath,
		'getRecordByScope': getRecordByScope,
		'getRecordById': getRecordById,
		'getRecordByIdAndScope': getRecordByIdAndScope,
		'getId': getId,
		'getScope': getScope,
		'getData': getData,
		'getAttributes': getAttributes,
		'isRoot': isRoot,
		'isChild': isChild,
		'isParent': isParent,
		'isSibling': isSibling,
		'isDivergent': isDivergent,
		'isDescendant': isDescendant,
		'isAscendant': isAscendant,
		'isFamily': isFamily,
		'isAccessible': isAccessible,
		'execute': execute
	};
		
	function init (module) {

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

	function getRecordPath (record, relativeRecord) {
		// Compile complete hierarchy path of record
		var path;
		if (!isRecord (record)) {
			return false;
		}
		if (!isSet(relativeRecord)) {
			relativeRecord = 1;
		}
		if (record == relativeRecord) {
			path = ".";
		} else if (isDescendant (record, relativeRecord)) {
			path = getId (record);
			while (isRecord(record = getRecordById (scope = getScope (record)))) {
				path = "."+path;
				if (record == relativeRecord) {
					return path;
				}
				path = scope+path;
			}
		} else if (isAscendant (record, relativeRecord)) {
			path = ".";
			while (isRecord(record = getRecordById (scope = getScope (record)))) {
				path = "."+path;
				if (record == relativeRecord) {
					return path;
				}
			}
		} else if (isSibling (record, relativeRecord)) {
			path = ".."+getId (record);
		}
		return path;	
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

	function isRoot (record) {
		return (record == 1);
	}

	function isChild (srcRecord, dstRecord) {
		// Check if child
		var record = srcRecord;
		while (isRecord(record = getRecordById (getScope (record)))) {
			if (record == dstRecord) {
				return (getRecordById (getScope (srcRecord)) == dstRecord);
			}
			if (isRoot (record) || getId(record) == getScope(record)) {
				break;
			}
		}
		return false;
	}

	function isParent (srcRecord, dstRecord) {
		// Check if parent
		return isChild (dstRecord, srcRecord);
	}

	function isSibling (srcRecord, dstRecord) {
		// Check if visible as a sibling
		if (srcRecord == dstRecord) {
			return false;
		}
		while (isRecord(srcRecord = getRecordById (getScope (srcRecord))) && isRecord(dstRecord = getRecordById (getScope (dstRecord)))) {
			if (srcRecord == dstRecord) {
				return true;
			}
			if (isRoot (srcRecord) || isRoot (dstRecord)) {
				break;
			}
		}
		return false;
	}

	function isDivergent (srcRecord, dstRecord) {
		// same tier ?
	}

	function isDescendant (srcRecord, dstRecord) {
		// Check if descendant
		var record = srcRecord;
		while (isRecord(record = getRecordById (getScope (record)))) {
			if (record == dstRecord) {
				return true;
			}
			if (isRoot (record) || getId(record) == getScope(record)) {
				break;
			}
		}
		return false;
	}

	function isAscendant (srcRecord, dstRecord) {
		// Check if ascendant
		return isDescendant (dstRecord, srcRecord);
	}

	function isFamily (srcRecord, dstRecord) {
		var srcAttribute = getAttributes (srcRecord),
			dstAttribute = getAttributes (dstRecord);
		if (hasFlag (ATTRIBUTES.ascending, dstAttribute) && isDescendant (srcRecord, dstRecord)) {
			// Check if descendant
			return true;
		}
		if (hasFlag(ATTRIBUTES.descending, dstAttribute) && isAscendant (srcRecord, dstRecord)) {
			// Check if ascendant
			return true;
		}
		if (hasFlag(ATTRIBUTES.diverging, dstAttribute) && isSibling (srcRecord, dstRecord)) {
			// Check if sibling
			return true;
		}
		return false;
	}

	function isAccessible (srcRecord, dstRecord, operation) {
		var accessible = false,
			srcAttribute = getAttributes (srcRecord),
			dstAttribute = getAttributes (dstRecord);
		if (srcRecord == dstRecord || hasFlag (ATTRIBUTES.dope, srcAttribute)) {
			return true;
		}
		if (isFamily (srcRecord, dstRecord)) {
			if (hasFlag (ATTRIBUTES.private, dstAttribute)) {
				// Check if accessible as family
				accessible = true;
			}
		} else {
			if (hasFlag (ATTRIBUTES.public, dstAttribute)) {
				// Check if accessible as non family
				accessible = true;
			}
		}
		if (accessible) {
			if (operation == ((OPERATION.read | OPERATION.write | OPERATION.execute) & dstAttribute & operation)) {
				return true;
			}
		}
		console.log ("Access ("+operation+") to '"+getId (dstRecord)+"' by '"+getId(srcRecord)+"' denied. ("+(isFamily (srcRecord, dstRecord) ? "family" : "non-family")+")");
		return false;
	}

	function execute(record, arguments) {
		var target_stack = [],
			trace = [],
			stack = [],
			instances = [],
			arg_stack = [],
			clauses = [],
			symbol, symbolCode, flags, record, data, attr, offset, expect, logic,
			clause = 0,
			identifier = "",
			entryRecord = record,
			scope = getScope(record),
			data = getData(record),
			attr = getAttributes(record),
			_lastToken = false;
		for (var x = 0; x < data.length; x++) {
			symbol = data[x];
			symbolCode = data.charCodeAt (x);
			if (attr & ATTRIBUTES.binary) {
				// Binary
			} else {
				// Determine token
				switch (symbol) {
					case TOKENS.root: token = TRANSLATION.root; break;
					case TOKENS.relative:
					if (hasFlag (TRANSLATION.relative, flags) || hasFlag (TRANSLATION.parent, flags)) {
						token = TRANSLATION.parent;
					} else {
						token = TRANSLATION.relative;
					}
					break;
					case TOKENS.feeder: token = TRANSLATION.feeder; break;
					case TOKENS.bouncer: token = TRANSLATION.bouncer; break;
					case TOKENS.separator: token = TRANSLATION.separator; break;
					case TOKENS.clause_start: token = TRANSLATION.clause_start; break;
					case TOKENS.clause_end: token = TRANSLATION.clause_end; break;
					case TOKENS.anchor: token = TRANSLATION.anchor; break;
					case TOKENS.binary: token = TRANSLATION.binary; break;
					case TOKENS.capsule: token = TRANSLATION.capsule; break;
					case TOKENS.static: token = TRANSLATION.static; break;
					default: 
					//console.log ("SymbolCode: "+symbolCode);
					if ((hasFlag (TRANSLATION.rangeB, flags) || hasFlag (TRANSLATION.static, flags)) && (symbolCode >= 48 || symbolCode <= 57)) {
						// Range [0-9]
						token = TRANSLATION.rangeB;
					} else if (((symbolCode >= 48 && symbolCode <= 57) || symbolCode == 95 || (symbolCode >= 97 && symbolCode <= 122))) {
						// Range [a-z0-9_]
						token = TRANSLATION.rangeA;
					} else {
						expect = action = token = TRANSLATION.fault;
					}
					if (x == data.length-1) {
						expect = TRANSLATION.none;
					}
				}
				flags = setFlag (token, flags);
				
				// Validate expectations for symbol
				if (!isSet (expect)) {
					// If no expectations are set (default)
					expect = EXPECTATIONS.default;
					logic = ACTION.none;
				}
				console.log ("Symbol: '"+symbol+"', Token: "+token+", Flags: "+flags+", Expect: "+expect);
				if (!hasFlag (token, expect)) {
					console.log ("Unexpected symbol '"+symbol+"'");
					break;
				}
				
				// Set expectations for symbol and implement logic
				if (token == TRANSLATION.root) {
					// Root
					logic = setFlag(ACTION.root, logic);
					expect = EXPECTATIONS.root;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
				}
				if (token == TRANSLATION.relative) {
					// Relative
					if (hasFlag (TRANSLATION.rangeA, flags)) {
						logic = setFlag(ACTION.relative, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.rangeA, flags);
					}
					if (hasFlag (TRANSLATION.rangeB, flags)) {
						logic = setFlag(ACTION.static, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.rangeB, flags);
					}
					if (hasFlag (TRANSLATION.separator, flags)) {
						logic = setFlag(ACTION.self, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.separator, flags);
					}
					if (hasFlag (TRANSLATION.feeder, flags)) {
						logic = setFlag(ACTION.self, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.feeder, flags);
						flags = setFlag (TRANSLATION.arguments, flags)
					}
					expect = EXPECTATIONS.relative;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
				}
				if (token == TRANSLATION.parent) {
					// Parent
					logic = setFlag (ACTION.parent, logic);
					expect = EXPECTATIONS.parent;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
					flags = clearFlag (TRANSLATION.relative, flags);
				}
				if (token == TRANSLATION.feeder) {
					// Feeder
					if (hasFlag (TRANSLATION.rangeB, flags)) {
						logic = setFlag(ACTION.feeder, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.rangeB, flags);
					}
					if (hasFlag (TRANSLATION.rangeA, flags)) {
						logic = setFlag(ACTION.feeder, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.rangeA, flags);
					}
					if (hasFlag (TRANSLATION.relative, flags)) {
						logic = setFlag(ACTION.feeder, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.relative, flags);
					}
					if (hasFlag (TRANSLATION.parent, flags)) {
						logic = setFlag(ACTION.feeder, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.parent, flags);
					}
					flags = setFlag (TRANSLATION.arguments, flags);
					expect = EXPECTATIONS.feeder;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
				}
				if (token == TRANSLATION.bouncer) {
					// Bouncer
					expect = EXPECTATIONS.bouncer;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
				}
				if (token == TRANSLATION.separator) {
					// Separator
					if (hasFlag (TRANSLATION.rangeA, flags)) {
						logic = setFlag(ACTION.relative, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.rangeA, flags);
					}
					if (hasFlag (TRANSLATION.rangeB, flags)) {
						logic = setFlag(ACTION.static, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.rangeB, flags);
					}
					if (hasFlag (TRANSLATION.root, flags)) {
						logic = setFlag(ACTION.root, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.root, flags);
					}
					if (hasFlag (TRANSLATION.parent, flags)) {
						logic = setFlag(ACTION.parent, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.parent, flags);
					}
					if (hasFlag (TRANSLATION.feeder, flags)) {
						console.log ("FEEDER IS SET");
						logic = setFlag(ACTION.feeder, logic);
						logic = clearFlag (ACTION.aquire, logic);
						flags = clearFlag (TRANSLATION.feeder, flags);
						flags = clearFlag (TRANSLATION.arguments, flags);
					}
					logic = setFlag(ACTION.separator, logic);
					expect = EXPECTATIONS.separator;
				}
				if (token == TRANSLATION.clause_start) {
					// Nesting start
					expect = EXPECTATIONS.clause_start;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
					clause++;
				}
				if (token == TRANSLATION.clause_end) {
					// Nesting end
					expect = EXPECTATIONS.clause_end;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
					clause--;
				}
				if (token == TRANSLATION.anchor) {
					// Anchor
					
				}
				if (token == TRANSLATION.binary) {
					// Binary reference

				}
				if (token == TRANSLATION.capsule) {
					// Capsule

				}
				if (token == TRANSLATION.static) {
					// Static
					expect = EXPECTATIONS.static;
					if (clause > 0) {
						expect = expect|TRANSLATION.clause_end;
					}
				}
				if (token == TRANSLATION.rangeA) {
					// Range [a-z0-9_]
					expect = EXPECTATIONS.rangeA;
					logic = logic|ACTION.aquire;
					flags = clearFlag (TRANSLATION.relative, flags);
					flags = clearFlag (TRANSLATION.root, flags);
					flags = clearFlag (TRANSLATION.parent, flags);
					flags = clearFlag (TRANSLATION.feeder, flags);
				}
				if (token == TRANSLATION.rangeB) {
					// Range [0-9]
					expect = EXPECTATIONS.rangeB;
					logic = logic|ACTION.aquire;
					flags = clearFlag (TRANSLATION.static, flags);
				}
				if (_lastToken) {
					console.log ("LAST_TOKEN");
					if (hasFlag (TRANSLATION.rangeB, flags)) {
						logic = setFlag(ACTION.static, logic);
						//logic = clearFlag (ACTION.aquire, logic);
					}
					if (hasFlag (TRANSLATION.rangeA, flags)) {
						logic = setFlag(ACTION.relative, logic);
						//logic = clearFlag (ACTION.aquire, logic);
					}
				}
				// Perform action from logic
				//console.log ("Logic: "+logic);
				if (hasFlag (ACTION.aquire, logic)) {
					identifier += symbol;
				}
				if (hasFlag (ACTION.root, logic)) {
					identifier = "root";
					if (isAccessible (entryRecord, getRecordById(identifier), OPERATION.read)) {
						console.log ("Record '"+identifier+"' exists.");
						trace.push (record = getRecordById(identifier));
						scope = getScope (record);
					}
					identifier = "";
				}
				if (hasFlag (ACTION.static, logic)) {
					identifier = parseInt (identifier);
					if (isRecord (identifier) && isAccessible (entryRecord, identifier, OPERATION.read)) {
						console.log ("Record '"+getId (identifier)+"' exists");
						trace.push (record = identifier);
						scope = getScope (record);
					}
					identifier = "";
				}
				if (hasFlag (ACTION.relative, logic)) {
					console.log ("RELATIVE");
					if (isRecord (getRecordById (identifier)) && isChild (getRecordById (identifier), record)) {// && isAccessible (record, getRecordById(identifier), OPERATION.read)) {
						console.log ("Record '"+identifier+"' exists.");
						while ((offset = getRecordById (identifier, offset)) != -1) {
							// Loop through all instances
							instances.push (offset);
							offset++;
						}
						trace.push (record = getRecordById (identifier));
						scope = getScope (record);
					}
					identifier = "";
				}
				if (hasFlag (ACTION.parent, logic)) {
					trace.pop ();
					identifier = trace.pop ();
					//console.log ("PARENT");
					if (isRecord (identifier) && isParent (identifier, record)) {// && isAccessible (identifier, record, OPERATION.read)) {
						// if trace is not empty
						console.log ("Record '"+getId (identifier)+"' exists.");
						trace.push (record = identifier);
						scope = getScope (record);
					} else if (isRecord (identifier = getRecordById (getScope (record))) && isAccessible (entryRecord, identifier, OPERATION.read)) {
						// if trace is empty
						console.log ("Record '"+getId (identifier)+"' exists.");
						trace.push (record = identifier);
						scope = getScope (record);
					}
					identifier = "";
				}
				if (hasFlag (ACTION.self, logic)) {
					identifier = entryRecord;
					if (isRecord (identifier) && isAccessible (entryRecord, identifier, OPERATION.read)) {
						console.log ("Record '"+getId (identifier)+"' exists.");
						trace.push (record = identifier);
						scope = getScope (record);
					}
					identifier = "";
				}
				if (hasFlag (ACTION.separator, logic)) {
					if (isAccessible (record, entryRecord, OPERATION.read)) {
						console.log ("Access '"+getId(record)+"' from '"+getId(entryRecord)+"'");
					}
					if (hasFlag (TRANSLATION.arguments, flags)) {
						arg_stack.push (record);
					} else {
						stack.push (record);
						//stack.push (trace);
					}
					trace = [];
					record = entryRecord;
				}
				if (hasFlag (ACTION.feeder, logic)) {
					//console.log ("EXECUTE");
					if (isAccessible (entryRecord, record, OPERATION.execute)) {
						console.log ("Execute '"+getId(record)+"' from '"+getId(entryRecord)+"'");
					}
					stack.push (record);
					//stack.push (trace);
					trace = [];
				}
				logic = ACTION.none;
			}
		}
		console.log ("Trace: "+trace+", Stack: "+stack+", Instances: "+instances+", Arguments: "+arg_stack);
	}
};