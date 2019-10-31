const fs = require('fs');
const d3 = require('d3');

const IN_PATH = './output/mls/csvs/';
const OUT_PATH = './output/mls';
const years = d3.range(1996, 2020)
let seasonsData = [];
let flatData = [];
const names = [];

function loadData(year) {
	const file = d3.csvParse(fs.readFileSync(`${IN_PATH}season-${year}.csv`, 'utf-8'));

	const withSeasons = file.map(d => ({
    ...d,
    season: +year
  }));
	seasonsData.push(withSeasons)

}

function getNames(d) {
	const name = (d.Player).split('\\')[0]
	const season = +d.season

	names.push({name, season})
}

function init() {
	years.map(loadData)
	flatData = [].concat(...seasonsData)
	flatData.map(getNames)

	const allNames = [].concat(...names).map(d => ({
		...d
	}));

	const csv = d3.csvFormat(allNames);
	fs.writeFileSync(`${OUT_PATH}/names-no-years.csv`, csv)
}

init();
