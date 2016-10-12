CONFIG = {
	'byte': 1,
	'char': 2,
	'int': 4,
	'long': 8,
	'max_length': 64,
	'type': 8,
	'ram': new Int8Array(new ArrayBuffer(1000)),
	'alloc': 0
};

function Var (length) {
	var alloc = CONFIG.alloc;
	if (alloc >= 0 && alloc+length+1 < CONFIG.ram.length) {
		CONFIG.ram[alloc] = alloc+length+1;
		CONFIG.ram[alloc+length+1] = alloc;
		CONFIG.alloc = alloc+length+2;
	} else {
		alloc = -1;
		console.log ("unable to allocate variable");
	}
	return alloc;
}

function Set (alloc, offset, value) {
	if (alloc >= 0 && CONFIG.ram[alloc] < CONFIG.ram.length && CONFIG.ram[CONFIG.ram[alloc]] === alloc) {
		if (offset >= 0 && alloc+offset+1 < CONFIG.ram[alloc]) {
			CONFIG.ram[alloc+offset+1] = value;
			return offset+1;
		} else {
			console.log ("variable pointer out of range");
			return -1;
		}
	} else {
		console.log ("unallocated variable");
	}
}

function Get (alloc, offset) {
	if (alloc >= 0 && CONFIG.ram[alloc] < CONFIG.ram.length && CONFIG.ram[CONFIG.ram[alloc]] == alloc) {
		console.log (alloc+offset+1 < CONFIG.ram[alloc]);
		if (offset >= 0 && alloc+offset+1 < CONFIG.ram[alloc]) {
			return CONFIG.ram[alloc+offset+1];
		} else {
			console.log ("variable pointer out of range");
			return;
		}
	} else {
		console.log ("unallocated variable");
	}
}

function Len (alloc) {
	if (alloc >= 0 && CONFIG.ram[alloc] < CONFIG.ram.length && CONFIG.ram[CONFIG.ram[alloc]] == alloc) {
		return (CONFIG.ram[alloc]-alloc)-1;
	}
}

function New(length) {
	// return length of specified byte array
	if (CONFIG.type == 8) {
		bytes = new Int8Array(new ArrayBuffer(length));
	} else if (CONFIG.type == 16){
		length = length+(length%2);
		bytes = new Int16Array(new ArrayBuffer(length));
	} else if (CONFIG.type == 32){
		if (length%4 > 0) {
			length = length+(4-(length%4));
		}
		bytes = new Int32Array(new ArrayBuffer(length));
		CONFIG.type = 24;
	} else {
		bytes = new Int8Array(new ArrayBuffer(length));
		CONFIG.type = 8;
	}
	return bytes;
}

function Copy(bytes) {
	// return copy of specified byte array
	var result = New(Length(bytes));
	for (var x = 0; x < Length(bytes); x++) {
		result[x] = bytes[x];
	}
	return result;
}

function Trim(bytes) {
	// return copy of specified byte array where leading blank bytes have been trimmed off
	var last_bit,
		last_byte,
		offset,
		result;
	if (isUndefined(bytes)) {
		// accomodate undefined values
		return bytes;
	}
	last_bit = MSB(bytes);
	//console.log ("last bit: "+last_bit);
	offset = last_bit % CONFIG.type;
	last_byte = (last_bit - offset) / CONFIG.type;
	result = Slice(bytes, Length(bytes) - 1 - last_byte);
	return result;
}

function Truncate(bytes, length) {
	// return copy of specified byte array truncated from the left to specified length
	var result,
		offset = length - Length(bytes),
		x;
	result = New(length);
	if (isNegative(bytes)) {
		result = Not(result);
	}
	//console.log (bytes+"/"+Length(bytes)+":"+offset+":"+length);
	for (x = Length(bytes) - 1; x >= 0 && x + offset >= 0; x--) {
		result[x + offset] = bytes[x];
	}
	return result;
}

function Merge(bytes_a, bytes_b) {
	// return a merged byte array from the specified byte arrays in specified order
	var length,
		pointer,
		result,
		x;
	length = Length (bytes_a)+Length(bytes_b);
	result = New(length);
	for (x = 0; x < Length(bytes_a); x++) {
		result[x] = bytes_a[x];
	}
	pointer = Length(bytes_a);
	for (x = 0; x < Length(bytes_b); x++) {
		result[x+pointer] = bytes_b[x];
	}
	return result;
}

function Slice(bytes, offset, length) {
	// return a new byte array from selection
	var result;
	if (!isSet(offset)) {
		offset = 0;
	}
	if (!isSet(length)) {
		length = Length(bytes) - offset;
	}
	result = New(length);
	for (var x = offset; x < length + offset; x++) {
		if (x < Length(bytes)) {
			result[x - offset] = bytes[x];
		}
	}
	return result;
}

function Find (bytes_a, bytes_b, index) {
	// return byte array index of first occurence of bytes_b in bytes_a <optionally starting after index>, if not found return -1
	var x,
		y;
	if (Length(bytes_b) > Length(bytes_a)) {
		return -1;
	} else {
		if (!isSet(index) || index < 0) {
			index = 0;
		}
		if (Length(bytes_a)-(index+1) < Length(bytes_b)) {
			//console.log(Length(bytes_a)+":"+index+":"+Length(bytes_b));
			return -1;
		}
		for (x = index; x < Length(bytes_a)-index && x <= Length(bytes_a)-Length(bytes_b); x++) {
			for (y = 0; y < Length(bytes_b); y++) {
				if (bytes_a[x+y] != bytes_b[y]) {
					index = -1;
					break;
				}
				index = x;
			}
			if (index == x) {
				break;
			}
		}
	}
	return index;
}

function Add(augend, addend) {
	// return new byte array with value from math operation
	var result,
		bit_a,
		bit_b,
		bit_c,
		bit_r = 0;
	result = New(Max(Length(augend), Length(addend)));
	if (isNegative(augend)) {
		result = Not(result);
	}
	for (var x = 0; x < Length(result) * CONFIG.type; x++) {
		bit_a = Bit(augend, x);
		bit_b = Bit(addend, x);
		bit_c = (bit_r & ~(bit_a ^ bit_b)) | (~bit_r & (bit_a ^ bit_b));
		bit_r = (bit_a & bit_b) | (bit_r & (bit_a | bit_b));
		Bit(result, x, bit_c);
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
	if (bit_r == 1) {
		result = Add(result, Byte(bit_r));
	}
	//return Trim (result);
	return result;
}

function Subtract(minuend, subtrahend) {
	// return new byte array with value from math operation
	var result,
		bit_a,
		bit_b,
		bit_c,
		bit_r = 0;
	result = New(Max(Length(minuend), Length(subtrahend)));
	if (isNegative(minuend)) {
		result = Not(result);
	}
	for (var x = 0; x < Length(result) * CONFIG.type; x++) {
		bit_a = Bit(minuend, x);
		bit_b = Bit(subtrahend, x);
		//console.log ("bit_a: "+bit_a+", bit_b: "+bit_b+", rest: "+bit_r+", result: "+bit_c);
		bit_c = (~bit_r & (bit_a ^ bit_b)) | (bit_r & ~(bit_a ^ bit_b));
		//bit_r = (bit_r&bit_a&bit_b)|(~bit_r&(bit_a|bit_b));
		bit_r = (bit_r & bit_b) | (bit_r & ~(bit_a | bit_b)) | (~bit_r & bit_b & ~bit_a);
		Bit(result, x, bit_c);
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
	if (bit_r == 1) {
		result = Subtract(result, Byte(bit_r));
	}
	//return Trim (result);
	return result;
}

function Multiply(multiplicand, multiplier) {
	// return new byte array with value from math operation
	var result,
		negative = false;
	if (isNegative(multiplicand)) {
		multiplicand = Not(multiplicand);
		negative = true;
	}
	if (isNegative(multiplier)) {
		multiplier = Not(multiplier);
		negative = negative ^ true;
	}
	result = New(Length(multiplicand) + Length(multiplier));
	multiplicand = Truncate(multiplicand, Length(result));
	multiplier = Truncate(multiplier, Length(result));
	for (var x = 0; x < Length(multiplier) * CONFIG.type; x++) {
		if (Bit(multiplier, x) == 1) {
			result = Add(result, Shift(multiplicand, x));
		}
	}
	if (negative) {
		result = Not(result);
	}
	//return Trim (result);
	return result;
}

function Divide(dividend, divisor) {
	// return new byte array with value from math operation
	var remainder = Copy(dividend),
		result = New(Max(Length(dividend), Length(divisor))),
		offset = (MSB(dividend) - MSB(divisor)),
		negative = false;
	dividend = Truncate(dividend, Max(Length(dividend), Length(divisor)));
	divisor = Truncate(divisor, Max(Length(dividend), Length(divisor)));
	if (isZero(divisor)) {
		// Produce a undefined value (zero length)
		console.log("undefined");
		return Undefined();
	}
	if (isNegative(dividend)) {
		dividend = Not(dividend);
		remainder = Not(remainder);
		negative = true;
	}
	if (isNegative(divisor)) {
		divisor = Not(divisor);
		negative = negative ^ true;
	}
	while (offset >= 0) {
		remainder = Subtract(remainder, Shift(divisor, offset));
		if (isPositive(remainder)) { // || isEqual (remainder, divisor) || isZero (remainder)
			Bit(result, offset, 1);
		} else {
			Bit(result, offset, 0);
			remainder = Add(remainder, Shift(divisor, offset));
		}
		offset--;
	}
	/*
	100|10110|(101)
		 -100<< offset = 2 ... (1xx)
		 ------
		  00110
		 -0100< offset = 1 ... (10x)
		 ------
		  00110
		 -00100 offset = 0 ... (101)
		 ------
		  00010


	100|10100|(101)
	   -100<<	offset = 2 ... (1xx)
	   ------
	    00100
	   -0100<	offset = 1 ... (10x)
	   ------
	    00100
	   -00100	offset = 0 ... (101)
	   ------
	    00000

	101|100()
	   -101
	   ----
	   1111
	*/
	if (negative) {
		result = Not(result);
	}
	//return Trim (result);
	return result;
}

function Modulo(dividend, divisor) {
	// return new byte array with value from math operation
	var result = Subtract(dividend, Multiply(Divide(dividend, divisor), divisor));
	return result;
}

function Power(base, exponent) {
	// return new byte array with value from math operation
	var odd = Byte(1),
		result = Byte(1),//Truncate(Byte(1), CONFIG.max_length);//Length(base) * Length(exponent)),
		even = Byte(2),
		negative = isNegative(exponent);
	if (negative) {
		exponent = Not(exponent);
		// Might just as well return 0 if only integer math,
		// otherwise store decimals in other variable
	}
	while (!isZero(exponent)) {
		if (isOdd(exponent)) {
			result = Multiply (result, base);
			exponent = Subtract (exponent, odd);
		}
		exponent = Divide (exponent, even);
		base = Multiply (base, base);
		//result = Multiply(result, base);
		//exponent = Subtract(exponent, odd);
	}
	if (negative) {
		result = Divide(Byte(1), result);
		// See comment above about decimals
	}
	return result;
}

function Root(radicand, degree) {
	// implement ?
	var result;
	result = e * Math.log(radicand) / degree;
	return result;
}

function Logarithm(antilogarithm, base) {
	// implement ?
	return Math.log(antilogarithm) / Math.log(base);
}

function MSB(bytes, offset) {
	// bit position of most significant bit
	var bit = 0,
		negative;
	negative = isNegative(bytes);
	for (var x = (Length(bytes) * CONFIG.type) - 1; x >= 0; x--) {
		bit = Bit(bytes, x);
		if ((negative && bit === 0) || (!negative && bit == 1)) {
			return x;
		}
	}
	return 0;
}

function isEven(bytes) {
	// bytes%2 == 0
	if (isUndefined(bytes)) {
		return false;
	}
	return (Bit(bytes, 0) === 0);
}

function isOdd(bytes) {
	// bytes%2 == 1
	if (isUndefined(bytes)) {
		return false;
	}
	return (Bit(bytes, 0) == 1);
}

function isZero(bytes) {
	// bytes == 0 (one's complement)
	if (isUndefined(bytes)) {
		return false;
	}
	var negative = isNegative(bytes);
	for (var x = 0; x < Length(bytes) * CONFIG.type; x++) {
		if (!negative && Bit(bytes, x) == 1) {
			return false;
		} else if (negative && Bit(bytes, x) === 0) {
			return false;
		}
	}
	return true;
}

function isEqual(bytes_a, bytes_b) {
	// bytes_a == bytes_b
	if (isUndefined(bytes_a) ^ isUndefined(bytes_b)) {
		return false;
	} else if (isUndefined(bytes_a) & isUndefined(bytes_b)) {
		return true;
	}
	return isZero(Xor(bytes_a, bytes_b));
}

function isIdentical(bytes_a, bytes_b) {
	// bytes_a === bytes_b
	if (isUndefined(bytes_a) ^ isUndefined(bytes_b)) {
		return false;
	} else if (isUndefined(bytes_a) & isUndefined(bytes_b)) {
		return true;
	}
	if (Length(bytes_a) == Length(bytes_b)) {
		return isEqual(bytes_a, bytes_b);
	}
	return false;
}

function isGreater(bytes_a, bytes_b) {
	// bytes_a > bytes_b
	if (isUndefined(bytes_a) ^ isUndefined(bytes_b)) {
		return false;
	} else if (isUndefined(bytes_a) & isUndefined(bytes_b)) {
		return false;
	}
	var negative_a = isNegative(bytes_a),
		negative_b = isNegative(bytes_b),
		zero_a = isZero(bytes_a),
		zero_b = isZero(bytes_b),
		result,
		msb;
	if (isEqual(bytes_a, bytes_b)) {
		return false;
	} else if (zero_a && zero_b) {
		return false;
	} else if (zero_a && negative_b) {
		return true;
	} else if (zero_b && negative_a) {
		return false;
	} else if (negative_a && !negative_b) {
		return false;
	} else if (!negative_a && negative_b) {
		return true;
	}
	result = Xor(bytes_a, bytes_b);
	msb = MSB(result);
	if (Bit(bytes_a, msb) == 1) {
		return true;
	} else {
		return false;
	}
}

function isLesser(bytes_a, bytes_b) {
	// bytes_a < bytes_b
	return isGreater(bytes_b, bytes_a);
}

function isNegative(bytes) {
	// bytes < 0
	if (isUndefined(bytes)) {
		return false;
	}
	if (((bytes[0] >>> CONFIG.type-1) & 1) == 1) {
		return true;
	}
	return false;
}

function isPositive(bytes) {
	// bytes > 0
	return !isNegative(bytes);
}

function isUndefined(bytes) {
	// check if byte array is undefined
	if (Length(bytes) === 0) {
		return true;
	}
	return false;
}

function Bit(bytes, index, value) {
	// return integer bit value at index in byte array <and replace with optional value>, if index is greater than bit count return signed value or if less than zero return zero
	var offset,
		x,
		pointer,
		//negative = ((bytes[0] & (0b00000001 << CONFIG.type-1)) >>> CONFIG.type-1),
		negative = ((bytes[0] >>> CONFIG.type-1) & 1),
		length = Length(bytes);
	if (index < 0) {
		return 0;
	} else if (index >= length * CONFIG.type) {
		return (negative & 1);
	}
	offset = index % CONFIG.type;
	x = (index - offset) / CONFIG.type;
	pointer = (length - 1) - x;
	//console.log (bytes+": x: "+x+" offset: "+offset+" pointer: "+pointer);
	if (isSet(value)) {
		bytes[pointer] = (bytes[pointer] & ~(1 << offset)) | ((value & 1) << offset);
	} else {
		value = (bytes[pointer] >>> offset) & 1;
	}
	return value;
}

function Length(bytes) {
	// return number of bytes in byte array
	return bytes.length*(CONFIG.type/8);
}

function Flip (bytes) {
	// return byte array in reverse order
	var result,
		length,
		x;
	length = Length (bytes);
	result = New (length);
	length *= CONFIG.type;
	for (x = 0; x < length; x++) {
		Bit(result, x, Bit(bytes, (length-1)-x));
	}
	return result;
}

function Range(bytes, index, length, value) {
	// return byte array copy where bits in specified range are replaced with optional value
	var result,
		pointer,
		negative = ((bytes[0] >>> CONFIG.type-1) & 1),
		x;
	result = Copy(bytes);
	if (isSet (value)) {
		if (index < 0 || index+length < 0) {
			return result;
		} else if (index >= Length(bytes) * CONFIG.type || index+length > Length(bytes) * CONFIG.type) {
			return result;
		}
		for (x = index; x < index+length; x++) {
			Bit (result, x, value);
		}
	}
	return result;
}

function Isolate(bytes, offset, length) {
	// return byte array copy where all bits except in specified range are replaced with zeroes
	var result;
	if (!isSet(offset)) {
		offset = 0;
	}
	if (!isSet(length) || offset + length > Length(bytes) * CONFIG.type) {
		length = Length(bytes) * CONFIG.type - offset;
	}
	result = Copy(bytes);
	for (var x = 0; x < Length(bytes) * CONFIG.type; x++) {
		//console.log ("index: "+x+", offset: "+offset+", length: "+length+", result: "+Bin(result));
		if (x < offset || x >= offset + length) {
			Bit(result, x, 0);
		}
	}
	return result;
}

function Exclude(bytes, offset, length) {
	// return byte array copy where all bits in specified range are replaced with zeroes
	var result;
	if (!isSet(offset)) {
		offset = 0;
	}
	if (!isSet(length) || offset + length > Length(bytes) * CONFIG.type) {
		length = Length(bytes) * CONFIG.type - offset;
	}
	result = Copy(bytes);
	for (var x = offset; x < offset + length; x++) {
		if (x >= offset && x <= offset + length) {
			Bit(result, x, 0);
		}
	}
	return result;
}

function Shift(bytes, steps) {
	// return byte array copy where positive/negative steps shifts left/right and shift in new bits with zero/sign value
	var result = New(Length(bytes));
	for (var x = 0; x < Length(bytes) * CONFIG.type; x++) {
		Bit(result, x, Bit(bytes, x - steps));
	}
	return result;
}

function Pad(bytes, steps, value) {
	// return byte array copy where positive/negative steps shifts left/right and shift in new bits with specified value
	var length = Length (bytes),
		result = New(length);
	length *= CONFIG.type;
	for (var x = 0; x < length; x++) {
		if (steps < 0 && x >= length+steps) {
			Bit(result, x, value);
		} else if (steps > 0 && x < steps) {
			Bit(result, x, value);
		} else {
			Bit(result, x, Bit(bytes, x - steps));
		}
	}
	return result;
}

function And(bytes_a, bytes_b) {
	// bitwise bytes_a AND bytes_b
	var result = New(Max(Length(bytes_a), Length(bytes_b)));
	bytes_a = Truncate(bytes_a, Length(result));
	bytes_b = Truncate(bytes_b, Length(result));
	for (var x = 0; x < Length(result) * CONFIG.type; x++) {
		Bit(result, x, Bit(bytes_a, x) & Bit(bytes_b, x));
	}
	return result;
}

function Or(bytes_a, bytes_b) {
	// bitwise bytes_a OR bytes_b
	var result = New(Max(Length(bytes_a), Length(bytes_b)));
	bytes_a = Truncate(bytes_a, Length(result));
	bytes_b = Truncate(bytes_b, Length(result));
	for (var x = 0; x < Length(result) * CONFIG.type; x++) {
		Bit(result, x, Bit(bytes_a, x) | Bit(bytes_b, x));
	}
	return result;
}

function Xor(bytes_a, bytes_b) {
	// bitwise bytes_a XOR bytes_b
	var result = New(Max(Length(bytes_a), Length(bytes_b)));
	bytes_a = Truncate(bytes_a, Length(result));
	bytes_b = Truncate(bytes_b, Length(result));
	for (var x = 0; x < Length(result) * CONFIG.type; x++) {
		Bit(result, x, Bit(bytes_a, x) ^ Bit(bytes_b, x));
	}
	return result;
}

function Not(bytes) {
	// bitwise inverting of bytes
	var result = New(Length(bytes)),
		bit;
	for (var x = 0; x < Length(result) * CONFIG.type; x++) {
		bit = Bit(bytes, x);
		if (bit == 1) {
			bit = 0;
		} else {
			bit = 1;
		}
		Bit(result, x, bit);
	}
	return result;
}

function Type(number, length) {
	// Cast into bytes according to length from native number
	var bytes,
		negative;
	if (isSet(number)) {
		negative = number < 0;
		if (negative) {
			number = -1 * number;
		}
		bytes = New(length);
		for (var x = Length(bytes) - 1; x >= 0; x--) {
			bytes[x] = number & ((1 << CONFIG.type)-1);
			//console.log (((0x00000001 << CONFIG.type)));
			number = number >>> CONFIG.type;
		}
		//if (isNegative (bytes) && number === 0) {
		if (negative && number === 0) {
			bytes = Not(bytes);
			//bytes = Subtract (bytes, Byte (1));
		}
	}
	return bytes;
}

function Undefined() {
	return Type(0, 0);
}

function Byte(number) {
	return Type(number, CONFIG.byte);
}

function Char(number) {
	return Type(number, CONFIG.char);
}

function Int(number) {
	return Type(number, CONFIG.int);
}

function Long(number) {
	return Type(number, CONFIG.long);
}

function Text(string) {
	var result;
	result = New(string.length);
	for (var x = 0; x < string.length; x++) {
		result[x] = string.charCodeAt(x);
	}
	return result;
}

function Textual(bytes, encoding) {
	var result = "";
	for (var x = 0; x < Length(bytes); x++) {
		result += String.fromCharCode(bytes[x]);
	}
	return result;
}

function Bin(bytes) {
	var result = "";
	for (var x = 0; x < Length(bytes) * CONFIG.type; x++) {
		result = Bit(bytes, x) + result;
	}
	return result;
}

function Numeric(bytes, radix) {
	var result,
		symbol_table = "0123456789ABCDEF",
		copy = Copy(bytes),
		integer,
		negative = isNegative(copy);
	if (isUndefined(bytes)) {
		return "undefined";
	}
	if (!isSet(radix)) {
		radix = 10;
	}
	result = "";
	radix = Byte(radix);
	if (negative) {
		copy = Not(copy);
	}
	do { //isGreater (copy, radix) || isEqual (copy, radix)) {
		integer = Modulo(copy, radix);
		//copy = Subtract (copy, integer);
		copy = Divide(copy, radix);
		result = symbol_table[Number(integer)] + result;
		//console.log (Bin(integer)+":"+Bin (copy)+":"+result);
	} while (!isZero(copy));
	if (negative) {
		result = "-" + result;
	}
	return result;
}

function Parse(numeric, radix) {
	// Cast into bytes according to length from numeric number
	var bytes,
		length,
		symbol_table = "0123456789ABCDEF",
		negative = false,
		integer;
	if (!isSet(radix)) {
		radix = 10;
	}
	radix = Byte(radix);
	length = CONFIG.max_length;//Math.ceil((numeric.length/(Math.log10(10)/Math.log2(10)))/8);
	bytes = New(length);//CONFIG.max_length);
	if (isSet(numeric)) {
		for (var x = numeric.length - 1; x >= 0; x--) {
			if (x === 0 && numeric[x] == "-") {
				negative = true;
				bytes = Not(bytes);
			} else {
				integer = Byte(symbol_table.indexOf(numeric[x]));
				bytes = Add(bytes, Multiply(integer, Power(radix, Byte((numeric.length - 1) - x))));
			}
		}
	}
	return bytes;
}

function Number(bytes) {
	var number,
		negative,
		x;
	if (isSet(bytes)) {
		negative = isNegative(bytes);
		number = 0;
		if (negative) {
			bytes = Not(bytes);
		}
		for (x = 0; x < Length(bytes); x++) {
			number = (number << CONFIG.type) | bytes[x];
		}
		if (negative) {
			number *= -1;
		}
	} else {
		return 0;
	}
	return number;
}
