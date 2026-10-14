// Encode one monochrome bitmap, then feed and cut the receipt.
export const buildReceipt = ({width, height, data}) => {
	const widthBytes = width / 8;
	const output = new Uint8Array(data.length + 17);
	output.set([
		0x1b, 0x40, // Initialize.
		0x1d, 0x76, 0x30, 0, // Raster image at native resolution.
		widthBytes & 0xff, widthBytes >> 8, height & 0xff, height >> 8,
	]);
	output.set(data, 10);
	output.set([10, 10, 10, 0x1d, 0x56, 0x41, 0x10], data.length + 10);
	return output;
};
