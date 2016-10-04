
DOPE.prototype.Device = function () {
	
	var list = [],
		pipes = 2, 
		tlb = {
			entries: 4096,
			vas: [],
			device: [],
			lba_start: [],
			lba_end: [],
			attributes: [],
			raid_array: [],
			raid_element: [],
			raid_type: []
		};
		
	return {
		'init': init,
		'addDevice': addDevice,
		'listDevices': listDevices,
		'queue': queue,
		'read': read,
		'write': write,
		'dread': dread,
		'dwrite': dwrite
	};
	
	function init () {
		console.log ("Device module loaded.");
	}
	
	// Add device data image
	function addDevice (image) {
		list.push (image);
		return 1;
	}

	function listDevices () {
		// Ask BIOS for devices
		tlb.vas = [];
		tlb.device = [];
		tlb.lba_start = [];
		tlb.lba_end = [];
		tlb.attributes = [];
		tlb.raid_array = [];
		tlb.raid_element = [];
		tlb.raid_type = [];
		var tlb_index = 0,
			devices = list.length, 
			tmp_signature = "";
		// Iterate devices
		for (var x = 0; x < devices; x++) {
			// Check for GPT signature
			tmp_signature = dread (x, 512, 16);
			if (tmp_signature === "EFI PART") {
				// Get header info
				var partition_entry_start = parseInt (dread (x, 584, 8)), 
					partition_count = parseInt (dread (x, 592, 4)), 
					partition_entry_size = parseInt (dread (x, 596, 4));
				// Validate header integrity
				// *TO BE IMPLEMENTED*
					// Fall back to secondary GPT
					// *TO BE IMPLEMENTED*
				// Iterate partition entries
				for (var y = 0; y < partition_count; y++) {
					// Check for DOPE partition signature
					tmp_signature = dread (x, partition_entry_start+(y*partition_entry_size), 16);
					if (tmp_signature == "DOPE MK1") {
						// Store device in TLB tags
						tlb.device[tlb_index] = x;
						// Store VAS in TLB tags
						tlb.vas[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+56), 8));
						// Store LBA start in TLB tags
						tlb.lba_start[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+32), 8));
						// Store LBA end in TLB tags
						tlb.lba_end[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+40), 8));
						// Store attributes in TLB tags
						tlb.attributes[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+48), 8));
						// Store RAID array in TLB tags
						tlb.raid_array[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+64), 4));
						// Store RAID element in TLB tags
						tlb.raid_element[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+68), 4));
						// Store RAID type in TLB tags
						tlb.raid_type[tlb_index] = parseInt (dread (x, partition_entry_start+(y*partition_entry_size+72), 4));
						// Advance TLB pointer
						tlb_index++;
					}
				}
				devices--;
			}
		}
		// Validate address spaces, alter overlapping
		// *TO BE IMPLEMENTED*
		alert(JSON.stringify (tlb));
	}

	// Calculate checksum from string
	function crc32 (str) {
		var hash = 0;
		for (var x = 0; x < str.length; x++) {
			hash =((hash << 5)|(hash >> 27)) + str[x];
		}
		return hash;
	}

	function size (device) {
		if (device < 0 || device >= list.length) {
			return 0;
		} else {
			return list[device];
		}
	}

	function type (device) {
		return 0;
	}

	function anchor (device) {
		return 0;
	}

	function queue (vas_start, vas_end, pipe) {
		// Validate pipe range
		if (pipe >= 0 && pipe < pipes) {
			// Lookup partitions for operation
			var op_array_index = tlb.entries*pipe, 
				op_span_vas = [], 
				op_span_size = [], 
				op_span_index = 0, 
				op_span_sum = 0;
			for (var x = 0; x < tlb.entries; x++) {
				// Populate the OP span to verify the VAS exists
				var op_size = tlb.lba_end[x]-tlb.lba_start[x];
				if (tlb.vas[x] <= vas_end && tlb.vas[x]+op_size >= vas_start) {
					if (vas_start < tlb.vas[x]) {
						op_span_vas[op_span_index] = tlb.vas[x];
					} else {
						op_span_vas[op_span_index] = vas_start;
					}
					if (vas_end < tlb.vas[x]+op_size) {
						op_span_size[op_span_index] = vas_end-op_span_vas[op_span_index];
					} else {
						op_span_size[op_span_index] = tlb.vas[x]+op_size-op_span_vas[op_span_index];
					}
					// Subtract overlapping segments
					for (var y = 0; y < tlb.entries; y++) {
						if (y != op_span_index && op_span_vas[y] <= op_span_vas[op_span_index]+op_span_size[op_span_index]  && (op_span_size[y]+op_span_size[y]) >= op_span_vas[op_span_index]) {
							op_span_size[y] -= op_span_size[op_span_index];
						}
					}
					op_span_index++;
					op_array[op_array_index] = x;
					op_array_index++;
				}
			}
			if (op_span_sum < vas_end-vas_start) {
				return 2;
			} else {
				return 1;
			}
		} else {
			return 0;
		}
	}

	function read (vas_start, offset, length, pipe) {
		var buffer = [];
		// Queue all operation partitions
		if (queue (vas_start, vas_start+length, pipe) == 1) {
			// If queueing is successful, start reading
			for (var x = 0; x < op_array.length; x++) {
				var op = op_array[x];
				
			}
			return 1;
		} else {
			return 0;
		}
	}

	function write (vas, offset, data, pipe) {
		return 0;
	}
	
	function dread (device, address, length) {
		if (list[device].length < address+length) {
			return 0;
		} else {
			return list[device].substr (address, length);
		}
	}
	
	function dwrite (device, address, data) {
		if (list[device].length < address+data.length) {
			return 0;
		} else {
			list[device] = list[device].substr (0, address)+data+list[device].substr (address);
			return 1;
		}
	}
} ();
