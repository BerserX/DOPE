
DOPE.prototype.Memory = function () {

	var _self = this;

	VAS = {
		'device': [],
		'lba': [],
		'mapping': [],
		'allocated': [],
		'first': null,
		'last': null
	};

	BUFFER = {
		'index': [],
		'length': [],
		'offset': []
	};

	return {
		'init': init,
		'buildVas': buildVAS,
		'getVasStart': getVasStart,
		'getVASEnd': getVASEnd,
		'getVASAllocation': getVASAllocation,
		'isAllocated': isAllocated,
		'isAddress': isAddress,
		'isSector': isSector,
		'getLBAByAddress': getLBAByAddress,
		'getDeviceByAddress': getDeviceByAddress,
		'getSectorByAddress': getSectorByAddress,
		'getAddressBySector': getAddressBySector,
		'readSectorData': readSectorData,
		'writeSectorData': writeSectorData
	};

	function init () {
		require ("STATE");
	}

	function buildVAS () {
		var devices,
			address,
			x;
		devices = Device.listDevices ();
		address = 0;
		VAS.first = address;
		for (x = 0; x < devices.length; x++) {
			VAS.device[x] = devices[x];
			VAS.lba[x] = Device.getFirstLBA(devices[x]);
			VAS.mapping[x] = address;
			VAS.allocated[x] = Device.getLastLBA(devices[x])-Device.getFirstLBA(devices[x]);
			address += VAS.allocated[x];
		}
		VAS.last = address;
		return address;
	}

	function getVASStart (device) {
		var x;
		for (x = 0; x < VAS.devices.length; x++) {
			if (VAS.devices[x] == device) {
				return VAS.mapping[x];
			}
		}
	}

	function getVASEnd (device) {
		var x;
		for (x = 0; x < VAS.devices.length; x++) {
			if (VAS.devices[x] == device) {
				return VAS.mapping[x]+VAS.allocated[x];
			}
		}
	}

	function getVASAllocation (device) {
		var x;
		for (x = 0; x < VAS.devices.length; x++) {
			if (VAS.devices[x] == device) {
				return VAS.allocated[x];
			}
		}
	}

	function isAllocated (device) {
		var x;
		for (x = 0; x < VAS.devices.length; x++) {
			if (VAS.devices[x] == device) {
				return true;
			}
		}
		return false;
	}

	function isAddress (address) {
		if (address >= VAS.first && address < VAS.last) {
			return true;
		}
		return false;
	}

	function isSector (device, sector) {
		var address;
		if (isAllocated (device)) {
			address = Device.getSectorSize(device)*sector;
			return true;
		}
		return false;
	}

	function getLBAByAddress (address) {
		var lba,
			x;
		lba = -1;
		if (isAddress(address)) {
			for (x = 0; x < VAS.mapping.length; x++) {
				if (address >= VAS.mapping[x] && address < VAS.mapping[x]+VAS.allocated[x]) {
					lba = VAS.lba[x]+(VAS.mapping[x]-address);
					break;
				}
			}
		}
		return lba;
	}

	function getDeviceByAddress (address) {
		var device,
			x;
		device = -1;
		if (isAddress(address)) {
			for (x = 0; x < VAS.mapping.length; x++) {
				if (address >= VAS.mapping[x] && address < VAS.mapping[x]+VAS.allocated[x]) {
					device = VAS.device[x];
					break;
				}
			}
		}
		return device;
	}

	function getSectorByAddress (address) {
		var sector;
		sector = -1;
		if (isAddress(address)) {
			sector = (getLBAFromVAS(address)-(address%Device.getSectorSize(device)))/Device.getSectorSize(device);
		}
		return sector;
	}

	function getAddressBySector (device, sector) {
		var address;
		address = -1;
		if (isSector (device, sector)) {
			address = Device.getSectorSize (device)*sector;
			if (address < getVASAllocation(device)) {
				address += getVASStart (device);
			} else {
				address = -1;
			}
		}
		return address;
	}
};
