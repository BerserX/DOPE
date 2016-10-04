
DOPE.prototype.Register = function () {
	
	POSITION = {
		id: 0,
		scope: 4,
		attributes: 12,
		checksum: 14,
		size: 18,
		vas: 22,
		offset: 30
	};
	
	LENGTH = {
		record: 32,
		id: 4,
		scope: 8,
		attributes: 2,
		checksum: 4,
		size: 4,
		vas: 8,
		offset: 2
	}
	memory = 0;
	
	return {
		'init': init,
		'getRecordOffset': getRecordOffset,
		'getRecordLimit': getRecordLimit, 
		'getRecordByID': getRecordByID,
		'getRecordByParent': getRecordByParent, 
		'getRecordByIDAndParent': getRecordByIDAndParent, 
		'getRecordByAddress': getRecordByAddress,
		'getRecordData': getRecordData,
		'setRecordData': setRecordData,
		'getID': getID, 
		'getParent': getParent, 
		'getAttributes':getAttributes, 
		'getChecksum': getChecksum, 
		'getSize':getSize, 
		'getVAS': getVAS, 
		'getLength': getLength, 
		'getOffset': getOffset, 
		'setID': setID, 
		'setParent': setParent, 
		'setAttributes':setAttributes, 
		'setChecksum': setChecksum, 
		'setSize':setSize, 
		'setVAS': setVAS, 
		'setLength': setLength, 
		'setOffset': setOffset
	};

	function init () {
		
	}

	function getRecordOffset (record) {
		var record_offset = 0,
			register_size = 0,
			devices = _self.device.getDevices ();
		for (var x = 0; x < devices; x++) {
			register_size += _self.device.getDeviceSize (x)/10/length.record;
			if (record >= register_size) {
				record_offset += _self.device.getDeviceSize (x);
			} else {
				break;
			}
		}
		return record_offset;
	}

	function getRecordLimit () {
		var register_size = 0, 
			devices = _self.device.getDevices ();
		for (var x = 0; x < devices; x++) {
			register_size += _self.device.getDeviceSize (x)/10/36;
		}
		return register_size;
	}

	function getField (record, field_offset, field_length) {
		return _self.device.dread (memory, getRecordOffset (record)+length.record*record+field_offset, field_length);
	}
	
	function getID (record) {
		return parseInt (getField(record, POSITION.id, length.id));
	}

	function getParent (record) {
		return parseInt (getField(record, POSITION._PARENTid, length._PARENTid));
	}

	function getAttributes (record) {
		return parseInt (getField(record, POSITION.attributes, length.attributes));
	}

	function getChecksum (record) {
		return parseInt (getField(record, POSITION.checksum, length.checksum));
	}

	function getSize (record) {
		return parseInt (getField(record, POSITION.size, length.size));
	}

	function getVAS (record) {
		return parseInt (getField(record, POSITION.vas, length.vas));
	}

	function getLength (record) {
		return parseInt (getField(record, POSITION._LENGTH, length._LENGTH));
	}

	function getOffset (record) {
		return parseInt (getField(record, POSITION.offset, length.offset));
	}
	
	function getAddressStart (record) {
		var address = parseInt (_self.device.dread (memory, getRecordOffset (record)+length.record*record+POSITION.vas, length.vas));
		address += parseInt (_self.device.dread (memory, getRecordOffset (record)+length.record*record+POSITION.offset, length.offset));
		return address;
	}

	function getAddressEnd (record) {
		var address = parseInt (_self.device.dread (memory, getRecordOffset (record)+length.record*record+POSITION.vas, length.vas));
		address += parseInt (_self.device.dread (memory, getRecordOffset (record)+length.record*record+POSITION._LENGTH, length._LENGTH));
		address += parseInt (_self.device.dread (memory, getRecordOffset (record)+length.record*record+POSITION.offset, length.offset));
		return address;
	}

	function setField (record, field_offset, field_length, value) {
		_self.device.dwrite (memory, getRecordOffset (record)+length.record*record+field_offset, value.toBytes (field_length));
	}
	
	function setID (record, id) {
		setField (record, POSITION.id, length.id, id);
	}

	function setParent (record, parent_id) {
		setField (record, POSITION._PARENTid, length._PARENTid, parent_id);
	}

	function setAttributes (record, attributes) {
		setField (record, POSITION.attributes, length.attributes, attributes);
	}

	function setChecksum (record, checksum) {
		setField (record, POSITION.checksum, length.checksum, checksum);
	}
	
	function setSize (record, size) {
		setField (record, POSITION.size, length.size, size);
	}
	
	function setVAS (record, vas) {
		setField (record, POSITION.vas, length.vas, vas);
	}
	
	function setLength (record, vas_length) {
		setField (record, POSITION._LENGTH, length._LENGTH, vas_length);
	}
	
	function setOffset (record, vas_offset) {
		setField (record, POSITION.offset, length.offset, vas_length);
	}
	
	function setAddressStart (record, address, vas_offset) {
		_self.device.dwrite (memory, getRecordOffset (record)+length.record*record+POSITION.vas, address.toBytes (length.vas));
		_self.device.dwrite (memory, getRecordOffset (record)+length.record*record+POSITION.offset, vas_POSITION.toBytes (length.offset));
	}

	function setAddressEnd (record, address, vas_offset) {
		var length = getAddressStart (record);
		_self.device.dwrite (memory, getRecordOffset (record)+length.record*record+POSITION._LENGTH, address.toBytes (length._LENGTH));
	}
	
	function setNextAddress (address, next_vas, next_length, next_offset) {
		_self.device.dwrite (memory, address, next_vas.toBytes (length.vas));
		_self.device.dwrite (memory, address+length.vas, next_length.toBytes (length._LENGTH));
		_self.device.dwrite (memory, address+length.vas+length._LENGTH, next_POSITION.toBytes (length.offset));
	}
	
	function getNextAddress (address, add_length) {
		var vas = parseInt (_self.device.dread (memory, address, length.vas)),
			length = (add_length == 1 ? parseInt (_self.device.dread (memory, address+length.vas, length._LENGTH)) : add_length),
			offset = parseInt (_self.device.dread (memory, address+length.vas+length._LENGTH, length.offset));
		return vas+length+offset;
	}
	
	function getRecordData (record, data_length, data_offset) {
		var address_start = getVAS (record)+getOffset (record), 
			address_end = address_start+getLength (record), 
			alloc_size = getSize (record), 
			alloc_span = 0, 
			alloc_needle = 0,
			data = "";
		if (data_offset < 0) {
			data_offset = alloc_size-(data_offset%alloc_size);
		} else if (data_offset > alloc_size) {
			data_length = 0;
		}
		if (data_length+data_offset > alloc_size) {
			data_length = alloc_size-data_offset;
		}
		while ((address_start != address_end) && (data.length < data_length)) {
			alloc_span = address_end-address_start-(length.vas+length._LENGTH+length.offset);
			
			if (data_offset < alloc_span) {
				data += _self.device.dread (memory, address_end-(alloc_span-offset), data_length-alloc_needle);
			}
			alloc_needle += alloc_span;
			address_start = getNextAddress (address_start, 0);
			address_end = getNextAddress (address_end, 1);
		}
		return data;
	}
	
	function setRecordData (record, data, data_offset) {
		var data_length = data.length*2, 
			address_start = getVAS (record)+getOffset (record), 
			address_end = address_start+getLength (record), 
			alloc_size = getSize (record), 
			alloc_needle = 0, 
			data_needle = 0;
		if (data_offset < 0) {
			data_offset = alloc_size-(data_offset%alloc_size);
		}
		if (data_length+data_offset > alloc_size) {
			if (record == 0) {
				throw new Error ("Unable to allocate from source to source!");
			} else {
				_self.system.allocate (0, (data_length+data_offset)-alloc_size, record);
				alloc_size = getSize (record);
			}
		}
		while ((address_start != address_end) && (alloc_needle < data_length+data_offset)) {
			alloc_needle += address_end-address_start-(length.vas+length._LENGTH+length.offset);
			if (data_offset < alloc_needle) {
				_self.device.dwrite (memory, address_end-(alloc_needle-data_offset), data.substr (data_offset, alloc_needle));
			}
			data_offset = alloc_needle;
			address_start = getNextAddress (address_start, 0);
			address_end = getNextAddress (address_end, 1);
		}
	}

	function getRecordByID (id, record_offset) {
		if (record_offset < 0) {
			record_offset = 0;
		}
		for (var record = record_offset; record < getRecordLimit (); record++) {
			if (getID (record) == id) {
				return record;
			}
		}
		return -1;
	}

	function getRecordByParent (parent_id, record_offset) {
		if (record_offset < 0) {
			record_offset = 0;
		}
		for (var record = record_offset; record < getRecordLimit (); record++) {
			if (getParent (record) == parent_id) {
				return record;
			}
		}
		return -1;
	}

	function getRecordByIDAndParent (id, parent_id, record_offset) {
		if (record_offset < 0) {
			record_offset = 0;
		}
		for (var record = record_offset; record < getRecordLimit (); record++) {
			if (getID (record) == id && getParent (record) == parent_id) {
				return record;
			}
		}
		return -1;
	}

	function getRecordByAddress (address, record_offset) {
		var address_start, 
			address_end;
		if (record_offset < 0) {
			record_offset = 0;
		}
		for (var record = record_offset; record < getRecordLimit (); record++) {
			address_start = getAddressStart (record);
			address_end = getAddressEnd (record);
			while (address_start != -1 && address_end != -1) {
				if (address >= address_start && address <= address_end) {
					return record;
				}
				_self.memory.seek (address_start);
				address_start = _self.memory.readInt ();
				_self.memory.seek (address_end);
				address_end = _self.memory.readInt ();
			}
		}
		return -1;
	}
}