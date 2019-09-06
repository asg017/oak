const fs = require('fs');
const d3 = require('d3');
const request = require('request');
const cheerio = require('cheerio');

const IN_PATH = './output/congress/';
const OUT_PATH = './output/congress';
const names = [];
const pages = d3.range(1, 11)

function getNames(page) {
	const file = fs.readFileSync(`${IN_PATH}names-${page}.html`, 'utf-8');
	const $ = cheerio.load(file)

	$('#main ol .expanded')
		.each((i, el) => {
			let name = $(el)
				.find('span a')
				.text()
			let firstName = name.split(',')[1].trim()
			let lastName = name.split(',')[0].trim()
			lastName = lastName.replace('Representative ', '')
			lastName = lastName.replace('Senator ', '')
			name = firstName.concat(' ', lastName)
			let stats = $(el)
				.find('.quick-search-member .member-profile')
				.children()
				.last()
			let dates = stats
				.find('span ul li')
				.text()
			let dateArray = dates.match(/\d+/g)
			let dateNums = null
			let startDate = null
			let endDate = null
			if (dateArray !== null) {
				dateNums = dateArray.map(Number)
				startDate = Math.min(...dateNums)
				if (dates.includes("Present")) {
					endDate = 2019
				} else {
					endDate = Math.max(...dateNums)
				}
				const league = 'congress'
				const last = name.substr(name.indexOf(' ')+1)
				const hyphen = last.includes('-') ? true : false
				if (name) names.push({name, startDate, endDate, league, hyphen})
			}
		});
		return names;
}

function init() {
	pages.map(getNames)
	const allNames = [].concat(...names).map(d => ({
		...d
	}));

	const csv = d3.csvFormat(allNames);
	fs.writeFileSync(`${OUT_PATH}/names.csv`, csv)
}

init();
