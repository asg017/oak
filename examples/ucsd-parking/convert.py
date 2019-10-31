import os
import xlrd
import pandas

def get_lot_entries(qtr, ws, row_i, num_types):
  lot_name = ws.cell_value(rowx=row_i, colx=0)
  entries = []
  if not lot_name:
    return entries
  for i in range(num_types):
    row = ws.row(row_i+i)
    row = map(lambda x: x.value, row)
    
    for j in range(2,13):
      if not row[j] or type(row[j]) is str or type(row[j]) is unicode:
        row[j] = 0
      else:
        row[j] = int(row[j])
        
    entries.append({
      'quarter':qtr,
      'lot': lot_name,
      'space_type': row[1],
      
      'num_spots': row[2],
      'time_counts': row[3:13],
      '8am_empty_count': row[3],
      '9am_empty_count': row[4],
      '10am_empty_count': row[5],
      '11am_empty_count': row[6],
      '12pm_empty_count': row[7],
      '1pm_empty_count': row[8],
      '2pm_empty_count': row[9],
      '3pm_empty_count': row[10],
      '4pm_empty_count': row[11],
      '5pm_empty_count': row[12],
    })
  return entries

from pprint import pprint as pp
def bylot_df(qtr, ws):
  entries = []
  
  row_i = 6 # starting one
  row_limit = ws.nrows
  
  num_types = 0
  while ws.cell_value(rowx=row_i+num_types, colx=1) != 'Total':
    num_types += 1
  
  while row_i < row_limit:
    lot_name = ws.cell_value(rowx=row_i, colx=0)
    lot_entries = get_lot_entries(qtr, ws, row_i, num_types)
    entries = entries + lot_entries
    row_i += num_types + 1
  return pandas.DataFrame(entries)
  
def convert_wbs():
  
  curr_dir = os.path.dirname(__file__)
  filenames = os.listdir( os.path.join(curr_dir, '../input/parking_occupancy') )
  frames = []
  for filename in filenames:
    print('Converting %s...' % (filename))
    qtr = filename[:4]
    f = open(os.path.join(curr_dir, '../input/parking_occupancy/' + filename) , 'r' )
    wb_data = f.read()
    f.close()
    wb = xlrd.open_workbook(file_contents=wb_data) # xlrd.book.Book object
    try:
      ws_lot = wb.sheet_by_name('By Lot')
    except:
      ws_lot = wb.sheet_by_name('By Lot ') #SU16, wtf
    df = bylot_df(qtr, ws_lot)
    frames.append(df)
    
    #wb.nsheets # 11
    #wb.sheet_names() #[u'University-wide', u'By Location', u'By Area', u'By Neighborhood', u'By Lot', u'By Structure', u'Closed', u'Visitor', u'Allocated', u'Key', u'Schedule']
  df = pandas.concat(frames)
  df.index.name = 'id'
  df.to_csv('test.csv')
def main():
  convert_wbs()

if __name__ == '__main__':
  main()