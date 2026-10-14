import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'meteor/poon';
import { renderReceiptAsync } from './render-receipt';

export const ReceiptPreview = ({children, width = 576, isCanvas}) => {
	const [height, setHeight] = useState(0);
	const el = useRef();

	useEffect(() => {
		if (!isCanvas) return;
		let cancelled = false;
		renderReceiptAsync(children, {width}).then(({pixels, bitmap}) => {
			if (cancelled) return;
			el.current.height = bitmap.height;
			el.current.getContext('2d').putImageData(pixels, 0, 0);
		}).catch(err => {
			if (!cancelled) toast(err.toString());
		});
		return () => {
			cancelled = true;
		};
	}, [isCanvas, children, width]);

	const style = {width: width / 2};

	if (isCanvas) return (
		<canvas ref={el} className="receipt-preview" width={width} style={style}/>
	);

	const onRenderSvg = el => {
		if (el) setHeight(el.clientHeight);
	};

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="receipt-preview"
			width={width}
			height={height}
			style={{width, overflow: 'visible', zoom: .5}}
		>
			<foreignObject width={width} height="100%" style={{overflow: 'visible'}}>
				<div
					ref={onRenderSvg}
					xmlns="http://www.w3.org/1999/xhtml"
					style={{
						display: 'flow-root', width, background: '#fff', color: '#000',
						fontFamily: 'system-ui, sans-serif', fontSize: 26,
					}}
					children={children}
				/>
			</foreignObject>
		</svg>
	);
};
