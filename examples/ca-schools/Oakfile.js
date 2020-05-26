COUNTY = "Los Angeles";

COUNTY_SNAKE = COUNTY.toLowerCase().replace(" ", "_");

cde_txt = new Task({
  target: "pubschools.txt",
  run: target =>
    shell`curl -o ${target}  https://raw.githubusercontent.com/datadesk/california-k12-notebooks/master/input/pubschls.txt`
});

public_schools = new Task({
  target: "public_schools.csv",
  run: target =>
    shell`pipenv run python clean_cde.py --input=${cde_txt} --output=${target}`
});

charter_schools = new Task({
  target: "charter_schools.csv",
  run: target => shell`csvgrep -c is_charter -m Y ${public_schools} > ${target}`
});

public_schools_in_county = new Task({
  target: `public_schools_in_${COUNTY_SNAKE}_county.csv`,
  run: target =>
    shell`csvgrep -c county -m "${COUNTY}" ${public_schools} > ${target}`
});

charter_schools_in_county = new Task({
  target: `charter_schools_in_${COUNTY_SNAKE}_county.csv`,
  run: target =>
    shell`csvgrep -c county -m "${COUNTY}" ${charter_schools} > ${target}`
});

to_geo = (input, output) =>
  shell`pipenv run python to_geo.py --input ${input} --output ${output}`;

charter_schools_geo = new Task({
  target: "charter_schools.geojson",
  run: target => to_geo(charter_schools, target)
});

public_schools_in_county_geo = new Task({
  target: `public_schools_in_${COUNTY_SNAKE}_county.geojson`,
  run: target => to_geo(public_schools_in_county, target)
});

charter_schools_in_county_geo = new Task({
  target: `charter_schools_in_${COUNTY_SNAKE}_county.geojson`,
  run: target => to_geo(charter_schools_in_county, target)
});
