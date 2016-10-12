
DOPE.prototype.Device = function () {

	BYTES = {
			'byte': 1,
			'char': 2,
			'int': 4,
			'long': 8
	};

	GPT_MAPPING_OFFSET = {
	'signature': 0,
	'revision': 8,
	'header_size': 12,
	'header_crc32': 16,
	'reserved1': 20,
	'current_lba': 24,
	'backup_lba': 32,
	'first_lba': 40,
	'last_lba': 48,
	'guid': 56,
	'partition_array_start_lba': 72,
	'partition_array_length': 80,
	'partition_array_entries_size': 84,
	'partition_array_crc32': 88,
	'reserved2': 92
	};

	GPT_MAPPING_SIZE = {
	'signature': BYTES.long,
	'revision': BYTES.int,
	'header_size': BYTES.int,
	'header_crc32': BYTES.int,
	'reserved1': BYTES.int,
	'current_lba': BYTES.long,
	'backup_lba': BYTES.long,
	'first_lba': BYTES.long,
	'last_lba': BYTES.long,
	'guid': 16,
	'partition_array_start_lba': BYTES.long,
	'partition_array_entries': BYTES.int,
	'partition_array_entry_size': BYTES.int,
	'partition_array_crc32': BYTES.int,
	'reserved2': -1
	};

	return {
		'init': init,
		'initDevices': initDevices,
		'isDevice': isDevice,
		'listDevices': listDevices,
		'getFirstLBA': getFirstLBA,
		'getLastLBA': getLastLBA,
		'hasGPT': hasGPT,
		'parseGPT': parseGPT,
		'storeGPT': storeGPT
	};

	function init () {
		require ("STATE");
	}

	function initDevices () {
		var x;
		for (x = 0; x < STATE.devices.length; x++) {
			STATE.devices[x].data = new Int8Array(new ArrayBuffer(STATE.devices[x].size));
		}
	}

	function isDevice (device) {
		if (device >= 0 && device < STATE.devices.length) {
			return true;
		}
		return false;
	}

	function hasGPT (device) {
		if (STATE.devices[device].gpt !== null) {
			return true;
		} else {
			return false;
		}
	}

	function listDevices (offset) {
		var x,
		list = [];
		if (!isSet (offset)) {
			offset = 0;
		} else if (isDevice (offset)) {
			for (x = offset; x < STATE.devices.length; x++) {
				if (STATE.devices[x].data !== null) {
					list.push (x);
				}
			}
		}
		return list;
	}

	function getFirstLBA (device) {
		if (isDevice(device)) {
			if (hasGPT(device)) {
				return STATE.devices[device].gpt.first_lba;
			} else {
				return 0;
			}
		} else {
			return -1;
		}
	}

	function getLastLBA (device) {
		if (isDevice(device)) {
			if (hasGPT(device)) {
				return STATE.devices[device].gpt.last_lba;
			} else {
				return STATE.devices[device].size-1;
			}
		} else {
			return -1;
		}
	}

	function parseGPT (device, sector) {
		var x,
			header_crc32,
			partition_array_crc32,
			gpt = {};
		if (isDevice (device)) {
			readData (device, getAddressFromSector (sector), STATE.devices[device].sector_size);
			for (x in GPT_MAPPING_OFFSET) {
				if (x == "guid") {
					gpt[x] = readString (GPT_MAPPING_OFFSET[x], GPT_MAPPING_SIZE[x]);
				} else if (GPT_MAPPING_SIZE[x] > 0) {
					gpt[x] = readBytes (GPT_MAPPING_OFFSET[x], GPT_MAPPING_SIZE[x]);
				}
			}
			writeBytes (GPT_MAPPING_OFFSET.header_crc32, 0, BYTES.int);
			header_crc32 = hash32 (readString (GPT_MAPPING_OFFSET.signature, gpt.header_size));
			console.log (header_crc32);
			readData (device, getSectorByAddress (device, gpt.partition_array_start_lba), gpt.partition_array_entries*gpt.partition_array_entry_size);
			partition_array_crc32 = hash32 (readString (0, gpt.partition_array_entries*gpt.partition_array_entry_size));
			if (gpt.header_crc32 != header_crc32) {
				console.log ("Faulty GPT header checksum!"+header_crc32+":"+gpt.header_crc32);
			}
			if (gpt.partition_array_crc32 != partition_array_crc32) {
				console.log ("Faulty GPT header checksum!");
			}
			STATE.devices[device].gpt = gpt;
			return true;
		}
		return false;
	}

	function storeGPT (device, sector) {
		var x,
			header_crc32,
			partition_array_crc32,
			gpt;
		if (isDevice (device)) {
			gpt = STATE.devices[device].gpt;
			for (x in GPT_MAPPING_OFFSET) {
				if (x == "guid") {
					writeString (GPT_MAPPING_OFFSET[x], gpt[x]);
				} else if (GPT_MAPPING_SIZE[x] > 0) {
					writeBytes (GPT_MAPPING_OFFSET[x], gpt[x],GPT_MAPPING_SIZE[x]);
				}
			}
			writeBytes (GPT_MAPPING_OFFSET.header_crc32, 0, BYTES.int);

			readData (device, getSectorByAddress (device, gpt.partition_array_start_lba), gpt.partition_array_entries*gpt.partition_array_entry_size);
			partition_array_crc32 = hash32 (readString (0, gpt.partition_array_entries*gpt.partition_array_entry_size));

			readData (device, getAddressFromSector (sector), STATE.devices[device].sector_size);
			writeBytes (GPT_MAPPING_OFFSET.partition_array_crc32, partition_array_crc32, BYTES.int);

			header_crc32 = hash32 (readString (GPT_MAPPING_OFFSET.signature, gpt.header_size));
			writeBytes (GPT_MAPPING_OFFSET.header_crc32, header_crc32, BYTES.int);

			writeData (device, getAddressFromSector (sector), STATE.devices[device].sector_size);
			gpt.header_crc32 = header_crc32;
			gpt.partition_array_crc32 = partition_array_crc32;
			return true;
		}
		return false;
	}

	function generateGPT (device) {

	}
};
