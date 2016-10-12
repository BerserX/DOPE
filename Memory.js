
DOPE.prototype.Memory = function () {

	var _self = this;

	VAS = {
		'device': [],
		'lba': [],
		'mapping': []
	};

	return {
		'init': init,
		'isAddress': isAddress,
		'getAddressFromSector': getAddressFromSector,
		'isSector': isSector,
		'getSectorByAddress': getSectorByAddress,
		'readSectorData': readSectorData,
		'writeSectorData': writeSectorData,
		'getSectorOffset': getSectorOffset,
		'getAddressByOffset': getAddressByOffset
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
		for (x = 0; x < devices.length; x++) {
			VAS.device[x] = devices[x];
			VAS.lba[x] = Device.getFirstLBA(devices[x]);
			VAS.mapping = address;
			address += Device.getLastLBA(devices[x])-Device.getFirstLBA(devices[x]);
		}
		return address;
	}

	function getLBAFromVAS (address) {
		var lba,
			x;
		vas = -1;
		if (address > 0) {
			for (x = 0; x < VAS.mapping.length; x++) {
				if (address < VAS.mapping[x]) {
					lba = VAS.lba[x-1]+(VAS.mapping[x-1]-address);
					break;
				}
			}
		}
		return lba;
	}

	function getDeviceFromVAS (address) {
		var vas;
		for (var x = 0, vas = address; x < STATE.devices.length; x++) {
			if (vas > STATE.devices[x].size) {
				return x;
			}
			vas -= STATE.devices[x].size;
		}
		return;
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
}
