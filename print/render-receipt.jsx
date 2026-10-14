import React from 'react';
import { createRoot } from 'react-dom/client';

const rasterize = async (svg, content, width) => {
	await Promise.all([...content.querySelectorAll('img')].map(image => image.decode()));

	const height = Math.max(1, Math.ceil(content.getBoundingClientRect().height));
	const copy = svg.cloneNode(true);
	copy.removeAttribute('style');
	copy.setAttribute('height', height);
	copy.firstElementChild.setAttribute('height', height);

	// Keep the image independent of the page's stylesheets and inherited styles.
	const originals = [content, ...content.querySelectorAll('*')];
	const copies = [copy.firstElementChild.firstElementChild, ...copy.firstElementChild.firstElementChild.querySelectorAll('*')];
	originals.forEach((element, i) => {
		const styles = getComputedStyle(element);
		copies[i].setAttribute('style', [...styles].map(name => `${name}:${styles.getPropertyValue(name)};`).join(''));
		if (element.tagName === 'IMG') {
			const imageCanvas = document.createElement('canvas');
			imageCanvas.width = element.naturalWidth;
			imageCanvas.height = element.naturalHeight;
			imageCanvas.getContext('2d').drawImage(element, 0, 0);
			copies[i].setAttribute('src', imageCanvas.toDataURL());
			copies[i].removeAttribute('srcset');
		}
	});

	const image = new Image();
	image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
	await image.decode();

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	context.fillStyle = '#fff';
	context.fillRect(0, 0, width, height);
	context.drawImage(image, 0, 0);

	const pixels = context.getImageData(0, 0, width, height);
	const bytes = new Uint8Array(width / 8 * height);
	for (let pixel = 0; pixel < width * height; pixel++) {
		const offset = pixel * 4;
		const black = pixels.data[offset] * 0.2126 + pixels.data[offset + 1] * 0.7152 + pixels.data[offset + 2] * 0.0722 < 128;
		if (black) bytes[pixel >> 3] |= 0x80 >> (pixel & 7);
		pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = black ? 0 : 255;
		pixels.data[offset + 3] = 255;
	}

	return {pixels, bitmap: {width, height, data: bytes}};
};

// Runs in the browser/WebView. Remote images need crossOrigin="anonymous".
export const renderReceiptAsync = async (children, {width = 576} = {}) => {
	if (!Number.isInteger(width) || width <= 0 || width % 8) {
		throw new Error('Receipt width must be a positive multiple of 8 pixels');
	}

	const host = document.createElement('div');
	host.style = {position: 'fixed', left: -100000, top: 0, opacity: 0, pointerEvents: 'none'};
	document.body.append(host);
	let root;
	try {
		const content = await new Promise((resolve, reject) => {
			root = createRoot(host, {onUncaughtError: reject});
			root.render(
				<svg xmlns="http://www.w3.org/2000/svg" width={width}>
					<foreignObject width={width}>
						<div
							ref={resolve}
							xmlns="http://www.w3.org/1999/xhtml"
							style={{
								display: 'flow-root', width, background: '#fff', color: '#000',
								fontFamily: 'system-ui, sans-serif', fontSize: 26,
							}}
							children={children}
						/>
					</foreignObject>
				</svg>,
			);
		});
		return await rasterize(host.firstElementChild, content, width);
	} finally {
		root.unmount();
		host.remove();
	}
};
