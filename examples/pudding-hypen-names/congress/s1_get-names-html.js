const fs = require('fs');
const d3 = require('d3');
const request = require('request');

const OUT_PATH = './output/congress'
const pages = d3.range(1, 11)

async function getNamesHTML(page) {
	const url = `https://www.congress.gov/members?pageSize=250&page=${page}`

	return new Promise((resolve, reject) => {
		request(url, (err, response, body) => {
			fs.writeFileSync(`${OUT_PATH}/names-${page}.html`, body);
		})
	})
}

function init() {
  pages.map(getNamesHTML)
}

init();
