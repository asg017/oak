const fs = require('fs');
const d3 = require('d3');
const request = require('request');
const cheerio = require('cheerio');

const IN_PATH = './output/mlb/';
const OUT_PATH = './output/mlb';
const names = [];
const abcs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

function getNames(letter) {
	const file = fs.readFileSync(`${IN_PATH}names-${letter}.html`, 'utf-8');
	const $ = cheerio.load(file)

	$('#div_players_ p')
		.each((i, el) => {
			const name = $(el)
				.find('a')
				.text()
			let dates = $(el)
				.text()
			dates = dates.slice((dates.length - 10), (dates.length - 1))
			let startDate = dates.split('-')[0];
			let endDate = dates.split('-')[1];
			const league = 'mlb'
			const last = name.substr(name.indexOf(' ')+1)
			const hyphen = last.includes('-') ? true : false
			if (name) names.push({name, startDate, endDate, league, hyphen})
		});
		//console.log(names)
		return names;
}

function init() {
	abcs.map(getNames)

	const allNames = [].concat(...names).map(d => ({
		...d
	}));

	const csv = d3.csvFormat(allNames);
	fs.writeFileSync(`${OUT_PATH}/names.csv`, csv)
}

init();
