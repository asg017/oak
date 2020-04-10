from sys import argv
import urllib3
import sqlite3
import json
import time

args = argv[1:3]
db_path, slack_webhook = args

http = urllib3.PoolManager()

conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT COUNT(*) as count FROM vehicle_readings;")
readings_count = c.fetchone()[0]

recent_time = round((time.time() - (15*60)) * 1000)
c.execute("""SELECT 
    COUNT(*) as count 
    FROM vehicle_readings 
    WHERE recordTime > ?;""",
          (recent_time,))
recent_readings_count = c.fetchone()[0]

message = {
    "text": "Total: {}\nLast 15 minutes: {}".format(readings_count, recent_readings_count)
}

print("Posting to slack", message)
http.request('POST', slack_webhook, headers={
    "Content-type": "application/json",
}, body=json.dumps(message).encode('utf8'))
