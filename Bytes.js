TYPE = {
	'byte': 1,
	'char': 2,
	'int': 4,
	'long': 8,
	'max_length': 64
};

function New(length) {
	bytes = new Int8Array(new ArrayBuffer(length));
	return bytes;
}

function Copy(bytes) {
	var result = New(Length(bytes));
	for (var x = 0; x < Length(bytes); x++) {
		result[x] = bytes[x];
	}
	return result;
}

function Trim(bytes) {
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
	offset = last_bit % 8;
	last_byte = (last_bit - offset) / 8;
	result = Slice(bytes, Length(bytes) - 1 - last_byte);
	return result;
}

function Truncate(bytes, length) {
	var result,
		offset = length - Length(bytes);
	result = New(length);
	if (isNegative(bytes)) {
		result = Not(result);
	}
	for (var x = Length(bytes) - 1; x >= 0 && x + offset >= 0; x--) {
		result[x + offset] = bytes[x];
	}
	return result;
}

function MinLength() {
	var length,
		bytes;
	for (var x = 0; x < arguments.length; x++) {
		bytes = arguments[x];
		if (!isSet(length) || Length(bytes) < length) {
			length = Length(bytes);
		}
	}
	return length;
}

function MaxLength() {
	var length;
	for (var x = 0; x < arguments.length; x++) {
		bytes = arguments[x];
		if (!isSet(length) || Length(bytes) > length) {
			length = Length(bytes);
		}
	}
	return length;
}

function Merge() {
	var length,
		pointer,
		result;
	for (var x = 0; x < arguments.length; x++) {
		length += Length(arguments[x]);
	}
	result = New(length);
	pointer = 0;
	for (var x = 0; x < arguments.length; x++) {
		bytes = arguments[x];
		for (var y = 0; y < Length(bytes); y++) {
			bytes[pointer] += bytes[y];
			pointer++;
		}
	}
	return result;
}

function Slice(bytes, offset, length) {
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

function Add(augend, addend) {
	var result,
		bit_a,
		bit_b,
		bit_c,
		bit_r = 0;
	result = New(MaxLength(augend, addend));
	if (isNegative(augend)) {
		result = Not(result);
	}
	for (var x = 0; x < Length(result) * 8; x++) {
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
	var result,
		bit_a,
		bit_b,
		bit_c,
		bit_r = 0;
	result = New(MaxLength(minuend, subtrahend));
	if (isNegative(minuend)) {
		result = Not(result);
	}
	//console.log (MaxLength (arguments[0], arguments[1]));
	for (var x = 0; x < Length(result) * 8; x++) {
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
	for (var x = 0; x < Length(multiplier) * 8; x++) {
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
	var remainder = Copy(dividend),
		result = New(MaxLength(dividend, divisor)),
		offset = (MSB(dividend) - MSB(divisor)),
		negative = false;
	dividend = Truncate(dividend, MaxLength(dividend, divisor));
	divisor = Truncate(divisor, MaxLength(dividend, divisor));
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
	var result = Subtract(dividend, Multiply(Divide(dividend, divisor), divisor));
	//return Trim (result);
	return result;
}

function Power(base, exponent) {
	var odd = Byte(1),
		result = Truncate(Byte(1), Length(base) * Length(exponent)),
		even = Byte(2),
		negative = isNegative(exponent);
	if (negative) {
		exponent = Not(exponent);
		// Might just as well return 0 if only integer math,
		// otherwise store decimals in other variable
	}
	while (!isZero(exponent)) {
		/*
		if (isOdd(exponent)) {
			result = Multiply (result, base);
			exponent = Subtract (exponent, odd);
		}
		exponent = Divide (exponent, even);
		base = Multiply (base, base);
		*/
		result = Multiply(result, base);
		exponent = Subtract(exponent, odd);
	}
	if (negative) {
		result = Divide(Byte(1), result);
		// See comment above about decimals
	}
	return result;
}

function Root(radicand, degree) {
	var result;
	result = e * Math.log(radicand) / degree;
	return result;
}

function Logarithm(antilogarithm, base) {
	return Math.log(antilogarithm) / Math.log(base);
}

function MSB(bytes, offset) {
	// bit position of most significant bit
	var bit = 0,
		negative;
	negative = isNegative(bytes);
	for (var x = Length(bytes) * 8 - 1; x >= 0; x--) {
		bit = Bit(bytes, x);
		if ((negative && bit === 0) || (!negative && bit == 1)) {
			return x;
		}
	}
	return 0;
}

function isEven(bytes) {
	if (isUndefined(bytes)) {
		return false;
	}
	return (Bit(bytes, 0) === 0);
}

function isOdd(bytes) {
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
	for (var x = 0; x < Length(bytes) * 8; x++) {
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
	if (((bytes[0] & 0b10000000) >>> 7) == 1) {
		return true;
	}
	return false;
}

function isPositive(bytes) {
	return !isNegative(bytes);
}

function isUndefined(bytes) {
	if (Length(bytes) === 0) {
		return true;
	}
	return false;
}

function Bit(bytes, index, new_value) {
	// return bit at index in bytes <and replace with new_value>
	var offset,
		x,
		pointer,
		negative = ((bytes[0] & 0b10000000) >>> 7);
	if (index < 0) {
		return 0;
	} else if (index >= Length(bytes) * 8) {
		return (negative & 1);
	}
	offset = index % 8;
	x = (index - offset) / 8;
	pointer = (Length(bytes) - 1) - x;
	if (isSet(new_value)) {
		bytes[pointer] = (bytes[pointer] & ~(0b00000001 << offset)) | ((new_value & 0b00000001) << offset);
	}
	return (bytes[pointer] >> offset) & 0b00000001;
}

function Length(bytes) {
	return bytes.length;
}

function Range() {}

function Isolate(bytes, offset, length) {
	var result;
	if (!isSet(offset)) {
		offset = 0;
	}
	if (!isSet(length) || offset + length > Length(bytes) * 8) {
		length = Length(bytes) * 8 - offset;
	}
	result = Copy(bytes);
	for (var x = 0; x < Length(bytes) * 8; x++) {
		//console.log ("index: "+x+", offset: "+offset+", length: "+length+", result: "+Bin(result));
		if (x < offset || x >= offset + length) {
			Bit(result, x, 0);
		}
	}
	return result;
}

function Exclude(bytes, offset, length) {
	var result;
	if (!isSet(offset)) {
		offset = 0;
	}
	if (!isSet(length) || offset + length > Length(bytes) * 8) {
		length = Length(bytes) * 8 - offset;
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
	// positive steps shifts left
	var result = New(Length(bytes));
	for (var x = 0; x < Length(bytes) * 8; x++) {
		Bit(result, x, Bit(bytes, x - steps));
	}
	return result;
}

function Pad(bytes, steps, bit) {
	// positive steps shifts left
	// shift in specified bit
	var result = New(Length(bytes));
	for (var x = 0; x < Length(bytes) * 8; x++) {
		//if (x-steps < 0 ||
		Bit(result, x, Bit(bytes, x - steps));
	}
	return result;
}

function And(bytes_a, bytes_b) {
	// bitwise bytes_a AND bytes_b
	var result = New(MaxLength(bytes_a, bytes_b));
	bytes_a = Truncate(bytes_a, Length(result));
	bytes_b = Truncate(bytes_b, Length(result));
	for (var x = 0; x < Length(result) * 8; x++) {
		Bit(result, x, Bit(bytes_a, x) & Bit(bytes_b, x));
	}
	return result;
}

function Or(bytes_a, bytes_b) {
	// bitwise bytes_a OR bytes_b
	var result = New(MaxLength(bytes_a, bytes_b));
	bytes_a = Truncate(bytes_a, Length(result));
	bytes_b = Truncate(bytes_b, Length(result));
	for (var x = 0; x < Length(result) * 8; x++) {
		Bit(result, x, Bit(bytes_a, x) | Bit(bytes_b, x));
	}
	return result;
}

function Xor(bytes_a, bytes_b) {
	// bitwise bytes_a XOR bytes_b
	var result = New(MaxLength(bytes_a, bytes_b));
	bytes_a = Truncate(bytes_a, Length(result));
	bytes_b = Truncate(bytes_b, Length(result));
	for (var x = 0; x < Length(result) * 8; x++) {
		Bit(result, x, Bit(bytes_a, x) ^ Bit(bytes_b, x));
	}
	return result;
}

function Not(bytes) {
	// bitwise inverting of bytes
	var result = New(Length(bytes)),
		bit;
	for (var x = 0; x < Length(result) * 8; x++) {
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
			bytes[x] = number & 0xff;
			number = number >>> 8;
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
	return Type(number, TYPE.byte);
}

function Char(number) {
	return Type(number, TYPE.char);
}

function Int(number) {
	return Type(number, TYPE.int);
}

function Long(number) {
	return Type(number, TYPE.long);
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
	for (var x = 0; x < Length(bytes) * 8; x++) {
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

function Parse(number, radix) {
	// Cast into bytes according to length from numeric number
	var bytes,
		symbol_table = "0123456789ABCDEF",
		negative = false,
		integer;
	if (!isSet(radix)) {
		radix = 10;
	}
	radix = Byte(radix);
	bytes = New(TYPE.max_length);
	if (isSet(number)) {
		for (var x = number.length - 1; x >= 0; x--) {
			if (x === 0 && number[x] == "-") {
				negative = true;
				bytes = Not(bytes);
			} else {
				integer = Byte(symbol_table.indexOf(number[x]));
				bytes = Add(bytes, Multiply(integer, Power(radix, Byte(number.length - 1 - x))));
			}
		}
	}
	return bytes;
}

function Number(bytes) {
	var number,
		negative;
	if (isSet(bytes)) {
		negative = isNegative(bytes);
		number = 0;
		if (negative) {
			bytes = Not(bytes);
		}
		for (var x = 0; x < Length(bytes); x++) {
			number = (number << 8) | bytes[x];
		}
		if (negative) {
			number *= -1;
		}
	} else {
		return 0;
	}
	return number;
}
