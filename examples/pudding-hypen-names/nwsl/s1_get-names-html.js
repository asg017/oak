const fs = require('fs');
const d3 = require('d3');
const request = require('request');

const OUT_PATH = './output/nwsl'
const years = d3.range(2016, 2020)

async function getNamesHTML(year) {
	const url = `http://www.nwslsoccer.com/stats?season=${year}#players`

	return new Promise((resolve, reject) => {
		request(url, (err, response, body) => {
			fs.writeFileSync(`${OUT_PATH}/season-${year}.html`, body);
		})
	})
}

function init() {
  years.map(getNamesHTML)
}

init();
