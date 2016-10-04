DOPE.prototype.STATE = {
	"devices": [
		{
			"type": "RAM",
			"size": 1*1024*1024,
			"data": ["34564563"],
			"gpt": {
				'signature': 0,
				'revision': 1001,
				'header_size': 92,
				'header_crc32': 0,
				'reserved1': 0,
				'current_lba': 0,
				'backup_lba': 1,
				'first_lba': 32,
				'last_lba': 48,
				'guid': "DEFIPART",
				'partition_array_start_lba': 2,
				'partition_array_length': 120,
				'partition_array_entries_size': 128,
				'partition_array_crc32': 0,
				'reserved2': 0
			},
			"sector_size": 512
		},
		{
			"type": "HDD",
			"size": 10*1024*1024,
			"data": [],
			"gpt": null,
			"sector_size": 512
		}
	]
};