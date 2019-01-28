const fs = require('fs');

const path = require('path');
const os = require('os');

const parseString = require('xml2js').parseString;
const xpath = require("xml2js-xpath");

const async = require('async');
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);

const readMeTableFile = path.join(__dirname, '../README-table.md');
ensureDirectoryExistence(readMeTableFile);
fs.writeFileSync(readMeTableFile, '');

const readMeLinksFile = path.join(__dirname, '../README-links.md');
ensureDirectoryExistence(readMeLinksFile);
fs.writeFileSync(readMeLinksFile, '');

/**
 *
 * @param xmlFile
 * @param outDir
 * @param {generateJsonCallback} cb
 */
function generateJson(xmlFile, outDir, cb) {
	const xml = fs.readFileSync(xmlFile);
	parseString(xml, function (err, json) {

		/** JSON from build/data.template.json */
		const outJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/data.template.json')).toString());
		outJson.themeName = getThemeName(xmlFile);

		const html = xpath.evalFirst(json, "/NotepadPlus/LexerStyles/LexerType[@name='html']");
		const js = xpath.evalFirst(json, "/NotepadPlus/LexerStyles/LexerType[@name='javascript']");


		const wsDEFAULT = xpath.evalFirst(html, "./WordsStyle[@name='DEFAULT']");
		outJson.default.fgColor = wsDEFAULT.$.fgColor;
		outJson.default.bgColor = wsDEFAULT.$.bgColor;

		/** Dark Theme ? @type {bool} */
		const dark = +outJson.default.bgColor[0] < 8;
		outJson.header.fgColor = dark ? 'FF8040' : ''; // TODO

		outJson.emphasis.fgColor = getFgColor(html, 'TAG');
		outJson.orderedList.fgColor = getFgColor(html, 'NUMBER');
		outJson.unorderedList.fgColor = getFgColor(js, 'SYMBOLS');
		outJson.code.fgColor = getFgColor(js, 'KEYWORD');
		outJson.link.fgColor = getFgColor(html, 'TAGUNKNOWN');
		outJson.comment.fgColor = getFgColor(html, 'COMMENT');

		const baseName = getBaseName(xmlFile);
		outDir = outDir || './theme-'+baseName;
		const outFile = path.join(outDir, 'data.'+baseName+'.json');
		ensureDirectoryExistence(outFile);
		// Generate file only with Unix line separator (and file ends with it)
		fs.writeFileSync(outFile, JSON.stringify(outJson, undefined, '\t').replace(os.EOL, '\n') + '\n');

		const all = Promise.all([
			// json
			writeFile(outFile, JSON.stringify(outJson, undefined, '\t').replace(os.EOL, '\n') + '\n'),
			// README-table.md
			appendFile(readMeTableFile,
				`	| ${outJson.themeName} | [userDefinedLang-markdown.${baseName}.classic.xml][${baseName}_modern_xml] | [userDefinedLang-markdown.${baseName}.classic.xml][${baseName}_classic_xml] |` +
				'\n'
			),
			// README-links.md
			appendFile(readMeLinksFile,
				`[${baseName}_modern_xml]: https://raw.githubusercontent.com/Edditoria/markdown-plus-plus/master/theme-${baseName}/userDefinedLang-markdown.${baseName}.modern.xml` +
				'\n' +
				`[${baseName}_classic_xml]: https://raw.githubusercontent.com/Edditoria/markdown-plus-plus/master/theme-${baseName}/userDefinedLang-markdown.${baseName}.classic.xml` +
				'\n'
			)
		]).then(() => {
			return cb ? cb(null, outFile, outJson) : outJson;
		});

	});
}

/**
 * @callback generateJsonCallback
 * @param {Error} error
 * @param {string} generatedJsonFile
 * @param {mppJson} generatedJsonData
 */

/**
 * @typedef mppJson
 * @property emphasis
 * @property {HexColor} emphasis.fgColor
 */

/**
 * Hex Color without #. Example : 'DCDCCC'
 * @typedef {string} HexColor
 */

/** @author https://stackoverflow.com/a/34509653/1655155 */
function ensureDirectoryExistence(filePath) {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return true;
	}
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
}

/**
 * @return {string} 'Hello Kitty' for '.../Hello Kitty.xml'
 */
function getThemeName(xmlFile) {
	return path.basename(xmlFile, '.xml');
}

/**
 * @return {string} 'hello-kitty' for '.../Hello Kitty.xml'
 */
function getBaseName(xmlFile) {
	return getThemeName(xmlFile).toLowerCase().replace(/ /g, '-');
}

const getFgColor = (lexerType, name) => xpath.evalFirst(lexerType, "./WordsStyle[@name='" + name + "']", "fgColor");

module.exports = {
	generateJson,
	getBaseName
};
