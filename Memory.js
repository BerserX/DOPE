
DOPE.prototype.Memory = function () {

	var _self = this;
	
		BUFFER = {
			'sector': "",
			'data': ""
		};
		
		BYTES = {
			'string': 0,
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
		'debug': debug,
		'isDevice': isDevice,
		'listDevices': listDevices,
		'parseGPT': parseGPT,
		'storeGPT': storeGPT,
		'isAddress': isAddress,
		'getAddressFromSector': getAddressFromSector,
		'isSector': isSector,
		'getSectorByAddress': getSectorByAddress,
		'readSectorData': readSectorData,
		'writeSectorData': writeSectorData,
		'getSectorOffset': getSectorOffset,
		'getAddressByOffset': getAddressByOffset,
		'readData': readData,
		'writeData': writeData,
		'readBytes': readBytes,
		'writeBytes': writeBytes,
		'readString': readString,
		'writeString': writeString
	};
	
	function init (module) {
		require ("STATE");
	}
	
	function debug () {
		console.log ("//Sector buffer:\n"+BUFFER.sector+"\n//Data buffer:\n"+BUFFER.data);
	}
	
	function isDevice (device) {
		if (device >= 0 && device < STATE.devices.length) {
			return true;
		}
		return false;
	}
	
	function VASAddress (address) {
		var vas;
		for (var x = 0, vas = address; x < STATE.devices.length; x++) {
			if (vas > STATE.devices[x].size) {
				return vas;
			}
			vas -= STATE.devices[x].size;
		}
		return;
	}
	
	function VASDevice (address) {
		var vas;
		for (var x = 0, vas = address; x < STATE.devices.length; x++) {
			if (vas > STATE.devices[x].size) {
				return x;
			}
			vas -= STATE.devices[x].size;
		}
		return;
	}
	
	function listDevices (offset) {
		var x,
		list = [];
		if (!isSet (offset)) {
			offset = 0;
		} else if (isDevice (offset)) {
			for (x = offset; x < STATE.devices.length; x++) {
				list.push (x);
			}
		}
		return list;
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
	
	// Parse GPT header into object
	function _parseGPT () {
		var gpt = {}, tmp_buffer;
		// Loop throught sectors from LBA 0 in search for header
		for (var x = 0; x < storage[active_drive].length; x++) {
			if (storage[active_drive][x] instanceof String) {
				// Extract header information
				tmp_buffer = storage[active_drive][x];
				gpt.signature = tmp_buffer.substr (0, 8);
				gpt.verstion = tmp_buffer.substr (8, 4);
				gpt.header_size = tmp_buffer.substr (12, 4);
				gpt.header_crc = tmp_buffer.substr (16, 4);
				gpt.reserved = tmp_buffer.substr (20, 4);
				gpt.current_lba = tmp_buffer.substr (24, 8);
				gpt.backup_lba = tmp_buffer.substr (32, 8);
				gpt.first_lba = tmp_buffer.substr (40, 8);
				gpt.last_lba = tmp_buffer.substr (48, 8);
				gpt.disk_guid = tmp_buffer.substr (56, 16);
				gpt.partition_array_lba = tmp_buffer.substr (72, 8);
				gpt.partition_array_length = tmp_buffer.substr (80, 4);
				gpt.partition_entry_size = tmp_buffer.substr (84, 4);
				gpt.partition_array_crc = tmp_buffer.substr (88, 4);
				gpt.parition_array = [];
				// Check if EFI Partition
				if (gpt.signature == "EFI PART") {
					console.log ("GPT header found.");
					// Check integrity of header
					tmp_buffer = tmp_buffer.substr (0, 16)+"0000"+tmp_buffer.substr (20, gpt.header_size-20);
					if (gpt.header_crc == _self.device.crc32 (tmp_buffer)) {
						console.log ("GPT primary header intact.");
						// Check integrity of partition array
						tmp_buffer = "";
						for (var y = gpt.partition_array_lba; y < (gpt.partition_array_lba+gpt.partition_array_length*gpt.partition_entry_size/sector_size); y++) {
							tmp_buffer += storage[active_drive][y];
						}
						tmp_buffer = tmp_buffer.substr (0, gpt.partition_array_length*gpt.partition_entry_size);
						if (gpt.partition_array_crc == _self.device.crc32 (tmp_buffer)) {
							console.log ("GPT partition array intact.");
							for (var y = 0; y < gpt.partition_array_length; y++) {
								// Extract partition entries
								gpt.partition_array.push ({
									type_guid: tmp_buffer.substr (y*gpt.partition_entry_size, 16),
									unique_guid: tmp_buffer.substr (y*gpt.partition_entry_size+16, 16),
									first_lba: tmp_buffer.substr (y*gpt.partition_entry_size+32, 8),
									last_lba: tmp_buffer.substr (y*gpt.partition_entry_size+40, 8),
									attribute_flags: tmp_buffer.substr (y*gpt.partition_entry_size+48, 8),
									utf16_name: tmp_buffer.substr (y*gpt.partition_entry_size+56, 72)
								});
							}
							console.log ("Found "+pgt.partition_array.length+" partitions.");
							return gpt;
						}
					} else if (gpt.current_header < gpt.backup_header) {
						// If corrupted primary header, check secondary
						console.log ("GPT primary header corrupt.");
						x = gpt.backup_lba;
						continue;
					} else {
						// If both GPT headers are corrupt, stop searching (possibly try to repair with interpolation)
						console.log ("GPT secondary header corrupt.");
						return false;
					}
				}
			}
		}
	}
	
	function isAddress (device, address) {
		if (isDevice (device)) {
			if (address >= 0 && address < STATE.devices[device].size) {
				return true;
			}
		}
		return false;
	}
	
	function getAddressFromSector (device, sector) {
		if (isSector (device, sector)) {
			return STATE.devices[device].sector_size*sector;
		}
		return -1;
	}
	
	function isSector (device, sector) {
		if (isDevice (device)) {
			if (sector >= 0 && sector < STATE.devices[device].size/STATE.devices[device].sector_size) {
				if (STATE.devices[device].data.length < sector) {
					STATE.devices[device].data.length = sector;
				}
			}
			return true;
		}
		return false;
	}
	
	function getSectorByAddress (device, address) {
		if (isAddress (device, address)) {
			return ((address-(address%STATE.devices[device].sector_size))/STATE.devices[device].sector_size);
		}
		return -1;
	}
	
	function getReadBuffer () {
		return BUFFER.data;
	}
	
	function setWriteBuffer (data) {
		BUFFER.data = data;
		return true;
	}
	
	function writeBuffer (buffer, offset, bytes) {
		for (var x = 0; x < buffer.length; x++) {
			buffer[x] = 0;
		}
		return offset+1;
	}
	
	function copyBuffer (srcBuffer, dstBuffer) {
		for (var x = 0; x < buffer.length; x++) {
			dstBuffer[x] = srcBuffer[x];
		}
		return true;
	}
	
	function readBuffer (buffer, offset, length) {
		for (var x = 0; x < length; x++) {
			
		}
	}
	
	function 
	
	function readSectorData (device, sector) {
		if (isSector (device, sector)) {
			if (!isSet(STATE.devices[device].data[sector])) {
				//STATE.devices[device].data[sector] = "";
				STATE.devices[device].data[sector] = new ArrayBuffer (STATE.devices[device].sector_size);
			}
			BUFFER.sector = STATE.devices[device].data[sector];
			BUFFER.sector += new Array (STATE.devices[device].sector_size-BUFFER.sector.length+1).join ("0");
			return true;
		}
		return false;
	}
	
	function writeSectorData (device, sector) {
		if (isSector (device, sector)) {
			if (!isSet(STATE.devices[device].data[sector])) {
				//STATE.devices[device].data[sector] = "";
				STATE.devices[device].data[sector] = new ArrayBuffer (STATE.devices[device].sector_size);
			}
			STATE.devices[device].data[sector] = BUFFER.sector;
			return true;
		}
		return false;
	}
	
	function getSectorOffset (device, address, sector) {
		if (!isSet (sector) || !isSector (sector)) {
			sector = 0;
		}
		if (isAddress (device, address)) {
			return address-(sector*STATE.devices[device].sector_size);
		}
		return 0;
	}
	
	function getAddressByOffset (device, offset, sector) {
		var address;
		if (!isSet (sector) || !isSector (sector)) {
			sector = 0;
		}
		if (!isSet (offset) || !isSector (offset)) {
			offset = 0;
		}
		if (isAddress (device, address = offset+getAddressBySector (device, sector))) {
			return address;
		}
		return 0;
	}

	function readData (device, pointer, length) {
		var sector,
			start_offset,
			stop_offset,
			start_sector,
			stop_sector;
		if (!isAddress (device, pointer)) {
			return false;
		}
		if (length == -1) {
			length = STATE.devices[device].size-pointer;
		}
		if (isAddress (device, pointer+length)) {
			BUFFER.data = ""; 
			start_offset = pointer%STATE.devices[device].sector_size;
			stop_offset = (pointer+length)%STATE.devices[device].sector_size;
			start_sector = getSectorByAddress (device, pointer);
			stop_sector = getSectorByAddress (device, pointer+length);
			sector = start_sector;
			while (sector <= stop_sector) {
				readSectorData (device, sector);
				if (sector == start_sector && sector == stop_sector) {
					BUFFER.data += BUFFER.sector.substr (start_offset, stop_offset-start_offset);
				} else if (sector == start_sector) {
					BUFFER.data += BUFFER.sector.substr (start_offset);
				} else if (sector == stop_sector) {
					BUFFER.data += BUFFER.sector.substr (0, stop_offset);
				} else {
					BUFFER.data += BUFFER.sector;
				}
				sector++;
			}
			return true;
		}
		return false;
	}
	
	function writeData (device, pointer) {
		var sector,
			start_offset,
			stop_offset,
			start_sector,
			stop_sector,
			length = BUFFER.data.length;
		if (!isAddress (device, pointer)) {
			return false;
		}
		if (length == 0) {
			return true;
		}
		if (isAddress (device, pointer+length)) {
			start_offset = pointer%STATE.devices[device].sector_size;
			stop_offset = (pointer+length)%STATE.devices[device].sector_size;
			start_sector = getSectorByAddress (device, pointer);
			stop_sector = getSectorByAddress (device, pointer+length);
			sector = start_sector;
			while (sector <= stop_sector) {
				BUFFER.sector = new Array (STATE.devices[device].sector_size+1).join ("0");
				if (sector == start_sector) {
					BUFFER.sector = BUFFER.sector.substr (0, start_offset)+BUFFER.data.substr (start_offset, length)+BUFFER.sector.substr (start_offset+length);
				} else if (sector == stop_sector) {
					BUFFER.sector = BUFFER.data.substr ((sector-start_sector)*STATE.devices[device].sector_size, stop_offset)+BUFFER.sector.substr (stop_offset);
				} else {
					BUFFER.sector = BUFFER.data.substr ((sector-start_sector)*STATE.devices[device].sector_size, STATE.devices[device].sector_size);
				}
				writeSectorData (device, sector);
				sector++;
			}
			BUFFER.data = "";
			return pointer+length;
		}
		return false;
	}
	
	function readBytes (pointer, length) {
		var bytes = "";
		for (var x = pointer; x < pointer+length; x++) {
			bytes += BUFFER.data[x];
		}
		return parseInt (bytes, 16);
	}
	
	function writeBytes (pointer, bytes, length) {
		var diff;
		bytes = bytes.toString (16);
		if (!isSet (length)) {
			length = bytes.length;
		}
		if (length > bytes.length) {
			diff = length-bytes.length;
		} else {
			diff = 0;
		}
		if (BUFFER.data.length < pointer+length) {
			BUFFER.data += new Array (pointer+length-BUFFER.data.length+1).join ("0");
		}
		BUFFER.data = BUFFER.data.substr (0, pointer+diff)+bytes+BUFFER.data.substr (pointer+length+diff);
		return pointer+length;
	}
	
	function readString (pointer, length) {
		var string = "";
		var test;
		for (var x = 0; x < length; x++) {
			console.log (test = readBytes (pointer+(x*BYTES.char), BYTES.char));
			string += String.fromCodePoint (parseInt (test, 10));
		}
		return string;
	}
	
	function writeString (pointer, string) {
		for (var x = 0; x < string.length; x++) {
			writeBytes (pointer+(x*BYTES.char), string.codePointAt (x), BYTES.char);
		}
	}
}

function Byte (length) {
	var bits,
		value = 0;
	switch (length) {
		case BYTES.byte: bits = BYTES.byte; break;
		case BYTES.char: bits = BYTES.char; break;
		case BYTES.int: bits = BYTES.int; break;
		case BYTES.long: bits = BYTES.long; break;
		default: bits = 1;
	}
	
	function __or__ () {
		
}
