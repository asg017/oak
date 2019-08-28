import argparse
from os import path
from bs4 import BeautifulSoup
from urllib.request import urlopen, unquote
import json

WB_LINK_BASE = 'http://rmp-wapps.ucsd.edu/TS/Survey/Parking%20Space%20Inventory/Quarterly%20Tables/'


def parse_args():
    parser = argparse.ArgumentParser(description='Process CLI arguments...')
    parser.add_argument('--input-html')
    parser.add_argument('--output-dir')
    parser.add_argument('--output-list')
    return parser.parse_args()


def parse_quarter(href):
    month = href.split(' ')[2]

    if month in set(['January', 'April']):
        year = href.split(' ')[1].split('-')[1]
    elif month in set(['July', 'October']):
        year = href.split(' ')[1].split('-')[0]
    else:
        raise Exception('wtf', href)

    return {"month": month, "year": year}


def main():
    args = parse_args()
    dir_path = path.dirname(path.realpath(__file__))

    INPUT_HTML_FILE = path.join(dir_path, args.input_html)
    OUTPUT_LIST_DIR = path.join(dir_path, args.output_dir)
    OUTPUT_LIST_FILE = path.join(dir_path, args.output_list)

    in_html = open(INPUT_HTML_FILE, 'r')
    out_list = []

    soup = BeautifulSoup(in_html, 'html.parser')
    all_links = soup.find_all('a')
    for link in all_links:
        if 'xls' in link['href']:
            wb_link = WB_LINK_BASE + link['href']
            wb_data = urlopen(wb_link).read()
            qtr = parse_quarter(unquote(link['href']))
            wb_out_file = path.join(
                OUTPUT_LIST_DIR, "{year}-{month}.xls".format(year=qtr.get('year'), month=qtr.get('month')))

            with open(wb_out_file, 'wb+') as f:
                f.write(wb_data)

            out_list.append(wb_out_file)

    with open(OUTPUT_LIST_FILE, 'w+') as f:
        f.write(('\n').join(out_list))


if __name__ == '__main__':
    main()
