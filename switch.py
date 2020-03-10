#!/srv/pl-app/bin/python

import sys
import serial

ser = serial.Serial('/dev/ttyUSB0')
ser.write(bytes(sys.argv[1], 'utf-8'));
ser.close();

print ("Moromorot")