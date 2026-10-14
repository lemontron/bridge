Package.describe({
	name: 'bridge',
	version: '1.0.0',
	summary: 'Native bridge and ESC/POS receipt printer utilities',
});

Package.onUse(api => {
	api.use('ecmascript');
	api.use('meteor');
	api.use('random', 'client');
	api.use('modules');

	api.addFiles('print/receipt.css', 'client');
	api.mainModule('index.js', 'client');
});
