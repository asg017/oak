const fs = require('fs');
const d3 = require('d3');

const IN_FILE = './output/mls/names-no-years.csv';
const OUT_PATH = './output/mls';
let nestedData = null;
let seasonsData = null;

function loadData() {
	const file = d3.csvParse(fs.readFileSync(IN_FILE, 'utf-8'));

	nestedData = d3.nest()
		.key(d => d.name)
		.rollup(values => {
			const last = (values[0].name).substr((values[0].name).indexOf(' ')+1)
			const hyphen = last.includes('-') ? true : false
			const [startDate, endDate] = d3.extent(values, v => +v.season)
			return {startDate, endDate, hyphen}
		})
		.entries(file)

	//console.log(nestedData)
}

function minMaxSeasons(data) {
	seasonsData = [].concat(...data).map(d => ({
		name: d.key,
		startDate: d.value.startDate,
		endDate: d.value.endDate,
		league: 'mls',
		hyphen: d.value.hyphen
	}));
}

function init() {
	loadData()
	minMaxSeasons(nestedData)

	const allNames = [].concat(...seasonsData)

	const csv = d3.csvFormat(allNames);
	fs.writeFileSync(`${OUT_PATH}/names.csv`, csv)
}

init();
