import React from 'react';

export const ReceiptSvg = ({children, width, height, contentRef, ...props}) => (
	<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} {...props}>
		<foreignObject width={width} height={height}>
			<div
				ref={contentRef}
				className="receipt-content"
				xmlns="http://www.w3.org/1999/xhtml"
				style={{
					display: 'flow-root',
					width,
					background: '#fff',
					color: '#000',
					fontFamily: 'monospace, arial, system-ui, sans-serif',
					fontSize: 26,
				}}
				children={children}
			/>
		</foreignObject>
	</svg>
);
