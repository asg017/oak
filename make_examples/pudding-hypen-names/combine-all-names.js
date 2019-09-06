const fs = require('fs');
const d3 = require('d3');
const _ = require('lodash');

const OUT_PATH = './output/'
const CON_IN = './output/congress/names.csv'
const MLB_IN = './output/mlb/names.csv'
const MLS_IN = './output/mls/names.csv'
const NBA_IN = './output/nba/names.csv'
const NFL_IN = './output/nfl/names.csv'
const NHL_IN = './output/nhl/names.csv'
const NWLS_IN = './output/nwls/names.csv'
const WNBA_IN = './output/wnba/names.csv'

const files = [CON_IN, MLB_IN, MLS_IN, NBA_IN, NFL_IN, NHL_IN, NWLS_IN, WNBA_IN]
let combinedNames = []
let withDecades = []

function processCSV(filename) {
	let raw = fs.readFileSync(filename, 'utf-8')
	let csv = d3.csvParse(raw)
	let newdb = _.unionBy(combinedNames, csv, 'name')
	combinedNames = newdb
}

function assignDecade(num){
	if (num >= 1880 && num < 1890) { return 1880}
	else if (num >= 1890 && num < 1900) { return 1890}
	else if (num >= 1900 && num < 1910) { return 1900}
	else if (num >= 1910 && num < 1920) { return 1910}
	else if (num >= 1920 && num < 1930) { return 1920}
	else if (num >= 1930 && num < 1940) { return 1930}
	else if (num >= 1940 && num < 1950) { return 1940}
	else if (num >= 1950 && num < 1960) { return 1950}
	else if (num >= 1960 && num < 1970) { return 1960}
	else if (num >= 1970 && num < 1980) { return 1970}
	else if (num >= 1980 && num < 1990) { return 1980}
	else if (num >= 1990 && num < 2000) { return 1990}
	else if (num >= 2000 && num < 2010) { return 2000}
	else if (num >= 2010 && num < 2020) { return 2010}
	else { return null }
}

function addDecade(data){
	withDecades = data.map(d => ({
		...d,
		decade: assignDecade(d.startDate),
		lastName: (d.name).split(' ')[((d.name).split(' ')).length-1],
		nameLength: ((d.name).split(' ')[((d.name).split(' ')).length-1]).length,
		reason: null
	}))
}

function init() {
	_.each(files, filename => processCSV(filename))

	addDecade(combinedNames)
	console.log(withDecades)

	const all = d3.csvFormat(withDecades)
	fs.writeFileSync(`${OUT_PATH}/allCombinedNames.csv`, all)

	const noCongress = _.filter(withDecades, function(d) { return d.league !== 'congress'; });
	const allSports = d3.csvFormat(noCongress)
	fs.writeFileSync(`${OUT_PATH}/sportsCombinedNames.csv`, allSports)

	const withHyphens = _.filter(allSports, ['hyphen', 'true'])
	const allHyphens = d3.csvFormat(withHyphens)
	fs.writeFileSync(`${OUT_PATH}/hyphensCombinedNames.csv`, allHyphens)
}

init();
