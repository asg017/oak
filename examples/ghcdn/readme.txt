GHCN-D is a dataset that contains daily observations over global land areas. 
Like its monthly counterpart, GHCN-Daily is a composite of climate records from 
numerous sources that were merged together and subjected to a common suite of quality 
assurance reviews. The archive includes the following meteorological elements:

    * Daily maximum temperature
    * Daily minimum temperature
    * Temperature at the time of observation
    * Precipitation (i.e., rain, melted snow)
    * Snowfall
    * Snow depth
    * Other elements where available

The format of the GHCN Daily data is different than NCDC's DSI 3200 dataset and may 
necessitate some changes for users accustomed to receiveing monthly updates of 
DSI 3200. The format documentation of the GHCN Daily period of record station 
files and list of country codes can be found in the GHCN Daily "readme.txt" file 
located on the ftp server (http://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt or 
ftp://ftp.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt). 

This by_year directory contains an alternate form of the GHCN Daily dataset.  In this
directory, the period of record station files are parsed into  
yearly files that contain all available GHCN Daily station data for that year 
plus a time of observation field (where available--primarily for U.S. Cooperative 
Observers).  The obsertation times for U.S. Cooperative Observer data 
come from the station histories archived in NCDC's Multinetwork Metadata System (MMS).  
The by_year files are updated daily to be in sync with updates to the GHCN Daily dataset.  
The yearly files are formatted so that every observation 
(i.e.,station/year/month/day/element/observation time) is represented by a single row 
with the following fields:

 station identifier (GHCN Daily Identification Number)
 date (yyyymmdd; where yyyy=year; mm=month; and, dd=day)
 observation type (see ftp://ftp.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt for definitions)
 observation value (see ftp://ftp.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt for units)
 observation time (if available, as hhmm where hh=hour and mm=minutes in local time)
 
The fields are comma delimited.

Further documentation details are provided in the text file ghcn-daily_format.rtf in this 
ftp://ftp.ncdc.noaa.gov/pub/data/ghcn/daily/by_year/ directory.

Users may find data files located on our ftp server at ftp://ftp.ncdc.noaa.gov/pub/data/ghcn/daily/all/. 
NOTE: 
There is no observation time contained in period of record station files. 

GHCN Daily data are currently available to ALL users at no charge. 
All users will continue to have access to directories for ftp/ghcn/ and ftp3/3200 & 3210/ data at no charge.

For detailed information on this dataset visit the GHCN Daily web page at http://www.ncdc.noaa.gov/oa/climate/ghcn-daily/

Please email questions/concerns to nndc.weborder@noaa.gov
