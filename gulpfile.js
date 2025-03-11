const { src, dest } = require('gulp');

// Copy node icons
function buildIcons() {
	return src('./nodes/**/*.svg').pipe(dest('./dist/nodes'));
}

exports['build:icons'] = buildIcons;