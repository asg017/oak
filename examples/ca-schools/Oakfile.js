COUNTY = "Los Angeles";

COUNTY_SNAKE = COUNTY.toLowerCase().replace(" ", "_");

cde_txt = task({
  path: "pubschools.txt",
  run: cde_text =>
    shell`curl -o ${cde_text} https://raw.githubusercontent.com/datadesk/california-k12-notebooks/master/input/pubschls.txt`
});

public_schools = task({
  path: "public_schools.csv",
  run: public_schools =>
    shell`pipenv run python clean_cde.py --input=${cde_txt} --output=${public_schools}`
});

charter_schools = task({
  path: "charter_schools.csv",
  run: charter_schools =>
    shell`csvgrep -c is_charter -m Y ${public_schools} > ${charter_schools}`
});

public_schools_in_county = task({
  path: `public_schools_in_${COUNTY_SNAKE}_county.csv`,
  run: public_schools_in_county =>
    shell`csvgrep -c county -m ${COUNTY} ${public_schools} > ${public_schools_in_county}`
});

charter_schools_in_county = task({
  path: `charter_schools_in_${COUNTY_SNAKE}_county.csv`,
  run: charter_schools_in_county =>
    shell`csvgrep -c county -m ${COUNTY} ${charter_schools} > ${charter_schools_in_county}`
});

to_geo = (input, output) =>
  command("pipenv", [
    "run",
    "python",
    "to_geo.py",
    `--input=${input}`,
    `--output=${output}`
  ]);

charter_schools_geo = task({
  path: "charter_schools.geojson",
  run: charter_schools_geo => to_geo(charter_schools, charter_schools_geo)
});

public_schools_in_county_geo = task({
  path: `public_schools_in_${COUNTY_SNAKE}_county.geojson`,
  run: public_schools_in_county_geo =>
    to_geo(public_schools_in_county, public_schools_in_county_geo)
});

charter_schools_in_county_geo = task({
  path: `charter_schools_in_${COUNTY_SNAKE}_county.geojson`,
  run: charter_schools_in_county_geo =>
    to_geo(charter_schools_in_county, charter_schools_in_county_geo)
});
