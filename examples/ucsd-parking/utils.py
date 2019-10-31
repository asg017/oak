def sort_qtr(qtr):
  qtr = qtr['quarter']
  year_val = int(qtr['year'][:2]) * 10
  qtr_val = None
  term = qtr['term']
  if term == 'WI':
    qtr_val = 3
  elif term == 'SP':
    qtr_val = 4
  elif term == 'SU':
    qtr_val = 1
  elif term == 'FA':
    qtr_val = 2
  return year_val + qtr_val