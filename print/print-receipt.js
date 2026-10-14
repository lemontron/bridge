import { call } from '../imports/bridge';
import { buildReceipt } from './build-receipt';

const base64 = data => {
	let binary = '';
	for (let offset = 0; offset < data.length; offset += 0x8000) {
		binary += String.fromCharCode(...data.subarray(offset, offset + 0x8000));
	}
	return btoa(binary);
};

export const print = (printUrl, bitmap) => {
	const {hostname, port} = new URL(printUrl);
	return call('network.write', {
		'host': hostname,
		'port': Number(port),
		'data': base64(buildReceipt(bitmap)),
	});
};
