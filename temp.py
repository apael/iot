#!/srv/pl-app/bin/python

import serial
import json
import requests

while True:

  try:

    ser = serial.Serial('/dev/ttyUSB0')

    js = ser.readline()

    r = requests.post("http://localhost:9999/data", headers={"content-type" : "application/json"}, data=js)

    #r = requests.post(url = "http://localhost:9999", data = js)

    print(r.text)

  except:

    print("err")

