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
		"static": "#"
	},
	TRANSLATION = {
		"none": 0,
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
		"static": 2048,
		"rangeA": 4096,
		"rangeB": 8192
	},
	ACTION = {
		"none": 0,
		"getIdentifier": 1,
		"getStatic": 2,
		"getParent": 4,
		"getChild": 8
	},
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

function setFlag (flag, bitmask) {
	return (flag|bitmask);
}

function hasFlag (flag, bitmask) {
	return ((flag & bitmask) == flag);
}

function clearFlag (flag, bitmask) {
	return (~flag & bitmask);
}

function execute(record, args) {
	var target_stack = [],
		arg_stack = [],
		scope_trace = [],
		token, tokenCode, tokenMask, record, data, attr, offset, expect, logic,
		clause = 0,
		identifier = "",
		entryRecord = record,
		scope = getScope(record),
		data = getData(record),
		attr = getAttributes(record),
		_lastToken = false;
	for (var x = 0; x < data.length; x++) {
		token = data[x];
		tokenCode = data.charCodeAt (x);
		if (attr & ATTRIBUTES.binary) {
			// Binary
		} else {
			console.log (token);
			if (x == data.length-1) {
				_lastToken = true;
			}
			// Determine token
			switch (token) {
				case TOKENS.root: tokenFlag = TRANSLATION.root; break;
				case TOKENS.relative: tokenFlag = TRANSLATION.relative; break;
				case TOKENS.feeder: tokenFlag = TRANSLATION.feeder; break;
				case TOKENS.bouncer: tokenFlag = TRANSLATION.bouncer; break;
				case TOKENS.separator: tokenFlag = TRANSLATION.separator; break;
				case TOKENS.clause_start: tokenFlag = TRANSLATION.clause_start; break;
				case TOKENS.clause_end: tokenFlag = TRANSLATION.clause_end; break;
				case TOKENS.anchor: tokenFlag = TRANSLATION.anchor; break;
				case TOKENS.binary: tokenFlag = TRANSLATION.binary; break;
				case TOKENS.capsule: tokenFlag = TRANSLATION.capsule; break;
				case TOKENS.static: tokenFlag = TRANSLATION.static; break;
				default: 
				console.log ("TokenCode: "+tokenCode);
				if (hasFlag (TRANSLATION.static, tokenMask) && (tokenCode >= 48 || tokenCode <= 57)) {
					// Range [0-9]
					tokenFlag = TRANSLATION.rangeB;
				} else if (!hasFlag (TRANSLATION.static, tokenMask) && (tokenCode >= 48 || tokenCode <= 57 || tokeCode == 95 || tokeCode >= 97 || tokenCode <= 122)) {
					// Range [a-z0-9_]
					tokenFlag = TRANSLATION.rangeA;
				} else {
					expect = tokenFlag = TRANSLATION.none;
				}
			}
			setFlag (tokenFlag, tokenMask);
			
			/*if (token == TOKENS.root) {
				// Root
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.root);
			} else if (token == TOKENS.relative) {
				// Self or parent
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.relative);
			} else if (token == TOKENS.feeder) {
				// Feeder
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.feeder);
			} else if (token == TOKENS.bouncer) {
				// Bouncer
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.bouncer);
			} else if (token == TOKENS.separator) {
				// Separator
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.separator);
			} else if (token == TOKENS.clause_start) {
				// Nesting start
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.clause_start);
			} else if (token == TOKENS.clause_end) {
				// Nesting end
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.clause_end);
			} else if (token == TOKENS.anchor) {
				// Anchor
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.anchor);
			} else if (token == TOKENS.binary) {
				// Binary reference
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.binary);
			} else if (token == TOKENS.capsule) {
				// Capsule
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.capsule);
			} else if (token == TOKENS.static) {
				// Static
				tokenMask = tokenMask|(tokenFlag = TRANSLATION.static);
			} else {
				// Identifier ranges
				console.log ("TokenCode: "+tokenCode);
				if (hasFlag (TRANSLATION.static, tokenMask) && (tokenCode >= 48 || tokenCode <= 57)) {
					// Range [0-9]
					tokenMask = tokenMask|(tokenFlag = TRANSLATION.rangeB);
					_rangeB = true;
				} else if (!hasFlag (TRANSLATION.static, tokenMask) && (tokenCode >= 48 || tokenCode <= 57 || tokeCode == 95 || tokeCode >= 97 || tokenCode <= 122)) {
					// Range [a-z0-9_]
					tokenMask = tokenMask|(tokenFlag = TRANSLATION.rangeA);
					_rangeA = true;
				} else {
					expect = tokenFlag = TRANSLATION.none;
				}
			}
			*/
			// Validate expectations for token
			if (!isSet (expect)) {
				// If no expectations are set (default)
				expect = TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static;
				logic = ACTION.none;
			}
			console.log ("Flag: "+tokenFlag+", Mask: "+tokenMask+", Expect: "+expect);
			if (!hasFlag (tokenFlag, expect)) {
				console.log ("Unexpected token '"+token+"'");
				break;
			}
			
			// Set expectations for token and implement logic
			if (hasFlag (TRANSLATION.root, tokenMask)) {
			//if (tokenFlag == TRANSLATION.root) {
				// Root
				expect = TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
			}
			if (hasFlag (TRANSLATION.relative, tokenMask)) {
			//} else if (tokenFlag == TRANSLATION.relative) {
				// Self or parent
				if (hasFlag (TRANSLATION.static, tokenMask)) {
					logic = setFlag(ACTION.getStatic, logic);
					logic = clearFlag (ACTION.aquire, logic);
				}
				expect = TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
				tokenMask = clearFlag (ACTION.relative, tokenMask);
			//} else if (hasFlag (TRANSLATION.feeder, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.feeder) {
				// Feeder
				expect = TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA|TRANSLATION.static;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
			//} else if (hasFlag (TRANSLATION.bouncer, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.bouncer) {
				// Bouncer
				expect = TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA|TRANSLATION.static;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
			//} else if (hasFlag (TRANSLATION.separator, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.separator) {
				// Separator
				expect = TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static;
			//} else if (hasFlag (TRANSLATION.clause_start, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.clause_start) {
				// Nesting start
				expect = TRANSLATION.root|TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
				clause++;
			//} else if (hasFlag (TRANSLATION.clause_end, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.clause_end) {
				// Nesting end
				expect = TRANSLATION.relative|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.rangeA|TRANSLATION.static|TRANSLATION.separator;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
				clause--;
			//} else if (hasFlag (TRANSLATION.anchor, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.anchor) {
				// Anchor
				
			//} else if (hasFlag (TRANSLATION.binary, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.binary) {
				// Binary reference
				
			//} else if (hasFlag (TRANSLATION.capsule, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.capsule) {
				// Capsule
				
			//} else if (hasFlag (TRANSLATION.static, tokenMask)) {
			}
			if (tokenFlag == TRANSLATION.static) {
				// Static
				expect = TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeB;
				if (clause > 0) {
					expect = expect|TRANSLATION.clause_end;
				}
			}
			// Read to target all other characters
			if (hasFlag (TRANSLATION.rangeA, tokenMask)) {
			//if (tokenFlag == TRANSLATION.rangeA) {
				// Range [a-z0-9_]
				if (hasFlag (TRANSLATION.static, tokenMask)) {
					if (isRecord (parseInt (identifier))) {
						console.log ("Record exists");
						tokenMask = clearFlag (TRANSLATION.static, tokenMask);
					}
				}
				expect = TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeA;
				logic = logic|ACTION.aquire;
			}
			if (hasFlag (TRANSLATION.rangeB, tokenMask)) {
			//} else if (tokenFlag == TRANSLATION.rangeB) {
				// Range [0-9]
				expect = TRANSLATION.relative|TRANSLATION.clause_start|TRANSLATION.feeder|TRANSLATION.bouncer|TRANSLATION.separator|TRANSLATION.rangeB;
				logic = logic|ACTION.aquire;
			}
			if (_lastToken) {
				
			}
			// Perform action from logic
			if (hasFlag (ACTION.aquire, logic)) {
				identifier += token;
			}
			if (hasFlag (ACTION.getStatic, logic)) {
				if (isRecord (parseInt (identifier))) {
					console.log ("Record exists");
					tokenMask = clearFlag (TRANSLATION.static, tokenMask);
					identifier = "";
				}
				logic = clearFlag (ACTION.getStatic, logic);
			}
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