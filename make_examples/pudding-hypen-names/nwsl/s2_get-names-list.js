const fs = require('fs');
const d3 = require('d3');
const request = require('request');
const cheerio = require('cheerio');

const IN_PATH = './output/nwsl/';
const OUT_PATH = './output/nwsl';
const names = [];
const years = d3.range(2016, 2020)

function getNames(year) {
	const file = fs.readFileSync(`${IN_PATH}season-${year}.html`, 'utf-8');
	const $ = cheerio.load(file)

	$('.fullstats tbody tr .player-name')
		.each((i, el) => {
			let name = $(el)
				.find('a')
				.text()
			if (name) {
				let firstName = name.split('\n')[1].trim()
				console.log(firstName)
				let lastName = $(el)
					.find('a span')
					.text()
				name = firstName.concat(' ', lastName)
			}
			let season = year
			if (name) names.push({name, season})
		});
		//console.log(names)
		return names;
}

function init() {
	years.map(getNames)

	const allNames = [].concat(...names).map(d => ({
		...d
	}));

	const csv = d3.csvFormat(allNames);
	fs.writeFileSync(`${OUT_PATH}/names-no-years.csv`, csv)
}

init();
