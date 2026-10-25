import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'meteor/poon';
import { renderReceiptAsync } from './render-receipt';
import { ReceiptSvg } from './ReceiptSvg';

export const ReceiptPreview = ({children, width = 576, padding = 10, showRasterized}) => {
	const [height, setHeight] = useState(0);
	const canvasEl = useRef();

	useEffect(() => {
		if (canvasEl.current) renderReceiptAsync(children, {width}).then(({pixels, bitmap}) => {
			canvasEl.current.height = bitmap.height;
			canvasEl.current.getContext('2d').putImageData(pixels, 0, 0);
		}).catch(err => {
			toast(err.toString());
		});
	}, [showRasterized, children, width]);

	const elWidth = (width / 2) + (padding * 2); // element width with border
	const elHeight = (height / 2) + (padding * 2); // element width with border

	if (showRasterized) return (
		<canvas
			ref={canvasEl}
			className="receipt-preview"
			width={width}
			style={{width: elWidth, height: elHeight}}
		/>
	);

	const onRenderSvg = el => {
		if (el) setHeight(el.clientHeight);
	};

	return (
		<ReceiptSvg
			className="receipt-preview"
			width={width}
			height={height}
			style={{width: elWidth, height: elHeight}}
			preserveAspectRatio="xMidYMid meet"
			viewBox={`0 0 ${width} ${height}`}
			contentRef={onRenderSvg}
			children={children}
		/>
	);
};
