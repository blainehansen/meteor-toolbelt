Package.describe({
	summary: "A utility library.",
	version: "1.1.0",
	name: "toolbelt"
});

Package.onUse(function (api) {
	api.use('ecmascript');

	api.mainModule('toolbelt.js');
	// If no version is specified for an 'api.use' dependency, use the
	// one defined in Meteor 0.9.0.
	// api.versionsFrom('0.9.0');
	
	// Version not specified, so it will be as of Meteor 0.9.0.
	// api.use('underscore', 'server');

	// Give users of this package access to the Templating package.
	// api.imply('templating')

	// api.export('Belt');

	// // Specify the source code for the package.
	// api.addFiles('toolbelt.js');
});