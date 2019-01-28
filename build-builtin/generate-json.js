const generator = require('./generator');
const fs = require('fs');
const path = require('path');
const async = require('async');

let xmlsDir = path.join(__dirname, 'xml');
let ok = 0;
let n = 0;
fs.readdir(xmlsDir, (err, xmlFiles) => {
	async.each(xmlFiles, xmlFile => {
		const baseName = generator.getBaseName(xmlFile);
		const outDir = path.join(__dirname, '../theme-' + baseName);
		return generator.generateJson(path.join(xmlsDir, xmlFile), outDir, (error, generatedJsonFile, generatedJsonData) => {
			if (error) {
				console.error("Error : ", error)
			} else {
				console.log("JSON file generated :", generatedJsonFile);
				++ok;
			}
			++n;
		});
	}, (err) => {
		console.log(`${ok}/${n} files generated`);
	})
});
