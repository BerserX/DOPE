TYPE = {	
	'byte': 1,
	'char': 2,
	'int': 4,
	'long': 8,
	'max_length': 64
};

function New (length) {
	bytes = new Int8Array (new ArrayBuffer (length));
	return bytes;
}

function Copy (bytes) {
	var result = New (bytes.length);
	for (var x = 0; x < bytes.length; x++) {
		result[x] = bytes[x]
	}
	return result;
}

function Trim (bytes) {
	var last_bit,
		last_byte,
		offset,
		result;
	last_bit = LMB (bytes);
	//console.log ("last bit: "+last_bit);
	offset = last_bit%8;
	last_byte = (last_bit-offset)/8;
	result = Slice (bytes, bytes.length-1-last_byte);
	return result;
}

function Truncate (bytes, length) {
	var result;
	result = New (length);
	for (var x in bytes) {
		if (x < length) {
			result[x] = bytes[x];
		}
	}
	return result;
}

function MinLength () {
	var length;
	for (var x = 0; x < arguments.length; x++) {
		if (!isSet (length) || arguments[x].length < length) {
			length = arguments[x].length;
		}
	}
	return length;
}

function MaxLength () {
	var length;
	for (var x = 0; x < arguments.length; x++) {
		if (!isSet (length) || arguments[x].length > length) {
			length = arguments[x].length;
		}
	}
	return length;
}

function Merge () {
	var length, 
		pointer,
		result;
	for (var x = 0; x < arguments.length; x++) {
		length += arguments[x].length;
	}
	result = New (length);
	pointer = 0;
	for (var x = 0; x < arguments.length; x++) {
		for (var y = 0; y < arguments[x].length; y++) {
			bytes[pointer] += arguments[x][y];
			pointer++;
		}
	}
	return result;
}

function Slice (bytes, offset, length) {
	var result;
	if (!isSet(offset)) {
		offset = 0;
	}
	if (!isSet (length)) {
		length = bytes.length-offset;
	}
	result = New (length);
	for (var x = offset; x < length+offset; x++) {
		if (x < bytes.length) {
			result[x-offset] = bytes[x];
		}
	}
	return result;
}

function Add () {
	var result,
	result = New (TYPE.max_length),
	bit_a,
	bit_b,
	bit_c,
	bit_r = 0;
	if (isNegative (arguments[0])) {
		result = Not (result);
	}
	for (var x = 0; x < MaxLength (arguments[0], arguments[1])*8; x++) {
		bit_a = Bit (arguments[0], x);
		bit_b = Bit (arguments[1], x);
		bit_c = (bit_r&~(bit_a^bit_b))|(~bit_r&(bit_a^bit_b));
		bit_r = (bit_a&bit_b)|(bit_r&(bit_a|bit_b));
		Bit (result, x, bit_c);
		//console.log ("bit_a: "+bit_a+", bit_b: "+bit_b+", rest: "+bit_r+", result: "+bit_c);
		/*
		1r 1 1 > 1 + 1r : 
		1r 1 0 > 0 + 1r :
		1r 0 1 > 0 + 1r :
		1r 0 0 > 1 + 0r :
		0r 1 1 > 0 + 1r : 
		0r 1 0 > 1 + 0r :
		0r 0 1 > 1 + 0r :
		0r 0 0 > 0 + 0r :
		r = (a&b)|(r&(a|b))
		c = (r&!(a^b))|(!r&(a^b))
		*/
	}
	//console.log (Bin (Trim (result)));
	
	if (bit_r == 1) {
		result = Add (result, Byte(bit_r));
	}
	return Trim (result);
}

function Subtract () {
	var result,
	result = New (TYPE.max_length),
	bit_a,
	bit_b,
	bit_c,
	bit_r = 0;
	if (isNegative (arguments[0])) {
		result = Not (result);
	}
	for (var x = 0; x < MaxLength (arguments[0], arguments[1])*8; x++) {
		bit_a = Bit (arguments[0], x);
		bit_b = Bit (arguments[1], x);
		//console.log ("bit_a: "+bit_a+", bit_b: "+bit_b+", rest: "+bit_r+", result: "+bit_c);
		bit_c = (~bit_r&(bit_a^bit_b))|(bit_r&~(bit_a^bit_b));
		//bit_r = (bit_r&bit_a&bit_b)|(~bit_r&(bit_a|bit_b));
		bit_r = (bit_r&bit_b)|(bit_r&~(bit_a|bit_b))|(~bit_r&bit_b&~bit_a);
		Bit (result, x, bit_c);
		/*
		x1r 1 1 > 1 + 1r : 
		x1r 1 0 > 0 + 0r :
		y1r 0 1 > 0 + 0r : r = 1?
		x1r 0 0 > 1 + 0r : r = 1?
		x0r 1 1 > 0 + 1r : r = 0?
		x0r 1 0 > 1 + 1r : r = 0?
		x0r 0 1 > 1 + 1r :
		x0r 0 0 > 0 + 0r :
		r = (r&b)|(r&!(a|b))|(!r&b&!a)
		c = (!r&(a^b))|(r&!(a^b))
		*/
	}
	//console.log (Bin (Trim (result)));
	if (bit_r == 1) {
		result = Subtract (result, Byte(bit_r));
	}
	return Trim (result);
}

function Multiply (multiplicand, multiplier) {
	var result,
	negative = false;
	if (isNegative (multiplicand)) {
		multiplicand = Not (multiplicand);
		negative = true;
	}
	if (isNegative (multiplier)) {
		multiplier = Not (multiplier);
		negative = negative ^ true;
	}
	result = New (TYPE.max_length);
	for (var x = 0; x < MaxLength (multiplier)*8; x++) {
		if (Bit (multiplier, x) == 1) {
			result = Add (result, Shift (multiplicand, x));
		}
	}
	if (negative) {
		result = Not (result);
	}
	return Trim (result);
}

function Divide (dividend, divisor) {
	var remainder = Copy (dividend),
	result = New (dividend.length),
	offset = (LMB (dividend)-LMB (divisor)),
	zero = Byte (-1),
	negative = false;
	if (isNegative (dividend)) {
		dividend = Not (dividend);
		remainder = Not (remainder);
		negative = true;
	}
	if (isNegative (divisor)) {
		divisor = Not (divisor);
		negative = negative ^ true;
	};
	for (var x = LMB (dividend); x >= 0 && !isZero (remainder); x--) {
		//console.log ("index: "+x+", bit_a: "+Bit(remainder, x)+", bit_b: "+Bit(divisor, x)+", lmb: "+offset+", remainder: "+Bin(remainder)+", divisor: "+Bin(Shift (divisor, offset))+", quotient: "+Bin(quotient));
		remainder = Subtract (remainder, Shift (divisor, offset));
		if (!isNegative (remainder)) {
			result = Shift (result, 1);
			Bit (result, offset, 1);
			console.log (offset);
		} else {
			result = Shift (result, 1);
			Bit (result, offset, 0);
		}
		offset--;
	}
	//console.log (Bin (result));
	/*      
	100|10100|(101)
	   -100<<
	   ------
	    00100
	   -0100<
	   ------
	    00100
	   -00100
	   ------
	    00000
		
	101|100()
	   -101
	   ----
	   1111
		
	*/
	if (negative) {
		result = Not (result);
	}
	return Trim(result);
}

function Modulo (dividend, divisor) {
	var result = Subtract (dividend, Multiply (Divide (dividend, divisor), divisor));
	return Trim (result);
}

function Power (base, exponent) {
	var odd = Byte (1),
		result = Byte (1),
		even = Byte (2);
	while (!isZero (exponent)) {
		if (isEqual(Modulo (exponent, even), odd)) {
			result = Multiply (result, base);
		}
		exponent = Divide (exponent, even);
		base = Multiply (base, base);
	}
	//result = Math.pow (base, exponent);
	//console.log (Bin (result));
	return result;
}

function Root (radicand, degree) {
	var result,
	result = e*Math.log (radicand)/degree;
	return result;
}

function Logarithm (antilogarithm, base) {
	return Math.log (antilogarithm)/Math.log (base);
}

function LMB (bytes, offset) {
	var bit = 0,
		negative;
	negative = isNegative (bytes);
	for (var x = bytes.length*8-1; x >= 0; x--) {
		bit = Bit (bytes, x);
		if (!negative && bit == 1) {
			bit = x;
			break;
		} else if (negative && bit == 0) {
			bit = x+1;
			break;
		}
	}
	//console.log ("LMB: "+bit+", bytes: "+Bin(bytes));
	return bit;
}

function RMB (bytes, offset) {
	var bit = 0;
	for (var x = 0; x < bytes.length*8; x++) {
		if (Bit (bytes, x) == 1) {
			bit = x;
			break;
		}
	}
	return bit;
}

function isZero (bytes) {
	var negative = isNegative (bytes);
	for (var x = 0; x < bytes.length*8; x++) {
		if (!negative && Bit (bytes, x) == 1) {
			return false;
		} else if (negative && Bit (bytes, x) == 0) {
			return false;
		}
	}
	return true;
}

function isEqual (bytes_a, bytes_b) {
	var lmb_a = LMB (bytes_a),
		lmb_b = LMB (bytes_b);
	if (lmb_a != lmb_b) {
		return false;
	}
	for (var x = lmb_a; x >= 0; x--) {
		if (Bit (bytes_a, x) != Bit (bytes_b, x)) {
			return false;
		}
	}
	return true;
}

function isIdentical (bytes_a, bytes_b) {
	if (bytes_a.length == bytes_b.length) {
		return isEqual (bytes_a, bytes_b)
	}
	return false;
}

function isGreater (bytes_a, bytes_b) {
	var lmb_a = LMB (bytes_a),
		lmb_b = LMB (bytes_b),
		negative_a = isNegative (bytes_a),
		negative_b = isNegative (bytes_b),
		result = true;
	if (isZero (bytes_a) && isZero (bytes_b)) {
		return false;
	} else if (negative_a && !negative_b) {
		return false;
	} else if (!negative_a && negative_b) {
		return true;
	} else if (negative_a && negative_b) {
		result = false;
	}
	if (isZero (bytes_a) && negative_b) {
		return true;
	} else if (isZero (bytes_b) && negative_a) {
		return false;
	}
	if (result) {
		if (lmb_a > lmb_b) {
			return true;
		} else if (lmb_a != lmb_b) {
			return false;
		}
	}
	for (var x = lmb_a; x >= 0; x--) {
		//console.log ("index: "+x+", bitA: "+Bit (bytes_a, x)+", bitB: "+Bit (bytes_b, x));
		if (Bit (bytes_a, x) > Bit (bytes_b, x)) {
			return true;
		} else if (Bit (bytes_a, x) < Bit (bytes_b, x)) {
			return false;
		}
	}
	return false;
}

function isLesser (bytes_a, bytes_b) {
	return isGreater (bytes_b, bytes_a);
}

function isNegative (bytes) {
	//console.log ("Signed: "+(bytes.length*8-1));
	if (((bytes[0] & 0b10000000) >> 7) == 1) {
		return true;
	}
	return false;
}

function Bit (bytes, index, new_value) {
	var offset,
		x,
		pointer,
		negative = ((bytes[0] & 0b10000000) >> 7);
		if (index < 0) {
			return 0;
		} else if (index >= bytes.length*8) {
			return (negative & 1);
		}
		offset = index%8;
		x = (index-offset)/8;
		pointer = (bytes.length-1)-x;
		if (isSet (new_value)) {
			bytes[pointer] = (bytes[pointer] & ~(0b00000001 << offset)) | ((new_value & 0b00000001) << offset);
		}
	return (bytes[pointer] >> offset) & 0b00000001;
}

function Range () {
}

function Isolate (bytes, offset, length) {
	var result;
	if (!isSet (offset)) {
		offset = 0;
	}
	if (!isSet (length) || offset+length > bytes.length*8) {
		length = bytes.length*8-offset;
	}
	result = Copy (bytes);
	for (var x = 0; x < bytes.length*8; x++) {
		//console.log ("index: "+x+", offset: "+offset+", length: "+length+", result: "+Bin(result));
		if (x < offset || x >= offset+length) {
			Bit (result, x, 0);
		}
	}
	return result;
}

function Exclude (bytes, offset, length) {
	var result;
	if (!isSet (offset)) {
		offset = 0;
	}
	if (!isSet (length) || offset+length > bytes.length*8) {
		length = bytes.length*8-offset;
	}
	result = Copy (bytes);
	for (var x = offset; x < offset+length; x++) {
		if (x >= offset && x <= offset+length) {
			Bit (result, x, 0);
		}
	}
	return result;
}

function Shift (bytes, steps) {
	// positive steps shifts left
	var result = New (bytes.length);
	for (var x = 0; x < bytes.length*8; x++) {
		Bit (result, x, Bit (bytes, x-steps));
	}
	return result;
}

function And (bytes_a, bytes_b) {
	var result = New (MaxLength (bytes_a, bytes_b));
	for (var x = 0; x < result.length*8; x++) {
		Bit (result, x, Bit (bytes_a, x) & Bit (bytes_b, x));
	}
	return result;
}

function Or (bytes_a, bytes_b) {
	var result = New (MaxLength (bytes_a, bytes_b));
	for (var x = 0; x < result.length*8; x++) {
		Bit (result, x, Bit (bytes_a, x) | Bit (bytes_b, x));
	}
	return result;
}

function Xor (bytes_a, bytes_b) {
	var result = New (MaxLength (bytes_a, bytes_b));
	for (var x = 0; x < result.length*8; x++) {
		Bit (result, x, Bit (bytes_a, x) ^ Bit (bytes_b, x));
	}
	return result;
}

function Not (bytes) {
	var result = New (bytes.length),
		bit;
	for (var x = 0; x < result.length*8; x++) {
		bit = Bit (bytes, x);
		if (bit == 1) {
			bit = 0;
		} else {
			bit = 1;
		}
		Bit (result, x, bit);
	}
	return result;
}

function Type (number, length) {
	var bytes;
	if (isSet (number)) {
		bytes = New (length);
		for (var x = 0; x < bytes.length; x++) {
			bytes[x] = ((0xff << (length-1)*8) & number) >> (length-1)*8;
			number = number << 8;
		}
		
		if (isNegative (bytes)) {
			bytes = Subtract (bytes, Byte (1));
		}
		
		//console.log (number);
	}
	return bytes;
}

function Byte (number) {
	return Type (number, TYPE.byte);
}

function Char (number) {
	return Type (number, TYPE.char);
}

function Int (number) {
	return Type (number, TYPE.int);
}

function Long (number) {
	return Type (number, TYPE.long);
}

function Text (string) {
	var result;
	result = New (string.length);
	for (var x = 0; x < string.length; x++) {
		result[x] = string.charCodeAt (x);
	}
	return result;
}

function Textual (bytes, encoding) {
	var result = "";
	for (var x = 0; x < bytes.length; x++) {
		result += String.fromCharCode (bytes[x]);
	}
	return result;
}

function Bin (bytes) {
	var result = "";
	for (var x = 0; x < bytes.length*8; x++) {
		result = Bit (bytes, x)+result;
	}
	return result;
}

function Numeric (bytes, radix) {
	var result,
		symbol_table = "0123456789ABCDEF",
		copy = Copy (bytes),
		integer = 0;
		
	result = "";
	radix = Byte(radix);
	for (var x = 0; x < !isZero (copy); x++) {
		//console.log ("copy: "+copy+", integer: "+integer+", radix: "+radix);
		copy = Subtract (copy, integer = Modulo (copy, radix));
		//console.log ("copy: "+copy+", integer: "+integer+", radix: "+radix);
		copy = Divide (copy, radix);
		//console.log ("copy: "+copy+", integer: "+integer+", radix: "+radix);
		//result = symbol_table[Number (Modulo (copy, integer *= radix))]+result;
		console.log (Number (integer));
		result = symbol_table[Number (integer)]+result;
	}
	return result;
}

function Number (bytes) {
	var number,
		negative = (number < 0);
	if (isSet (bytes)) {
		number = 0;
		for (var x = 0; x < bytes.length; x++) {
			number = (number << 8) | bytes[x];
		}
	}
	if (negative) {
		
	}
	return number;
}
