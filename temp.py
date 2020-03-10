#!/srv/pl-app/bin/python

import serial
import json
import requests
import time
import sys

try:

  ser = serial.Serial('/dev/ttyUSB0')
  ser.write(bytes('s', 'utf-8'))
  js = ser.readline()
      
  if js:

    r = requests.post("http://localhost:9999/data", headers={"content-type" : "application/json"}, data=js)

    #r = requests.post(url = "http://localhost:9999", data = js)

    print(js.decode())

except:
  print("err: ", sys.exc_info()[0])
