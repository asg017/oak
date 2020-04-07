import sys
import json
import sqlite3
from os.path import getmtime

vehicles_path, db_path = sys.argv[1:3]

record_time = round(getmtime(vehicles_path) * 100)

vehicles = json.load(open(vehicles_path))
conn = sqlite3.connect(db_path)


def serialize_item(item):
    return (
        record_time,
        item.get('id'),
        item.get('route_id'),
        item.get('predictable'),
        item.get('run_id'),
        item.get('latitude'),
        item.get('longitude'),
        item.get('heading'),
        item.get('seconds_since_report')
    )


readings = list(map(serialize_item, vehicles.get('items')))

c = conn.cursor()
c.executemany('''INSERT INTO vehicle_readings (
    recordTime,
    vehicle,
    route,
    predictable,
    run,
    latitude,
    longitude,
    heading,
    secs_since_report
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', readings)
conn.commit()

conn.close()
