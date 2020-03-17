#include <Adafruit_SHT31.h>

//TMP36 Pin Variables
//int sensorPin = 0;      // TMP36

Adafruit_SHT31 sht = Adafruit_SHT31();
                            
int relayPin = 13;
int doorPin = 12;
                            
int delayTime = 1000;
bool on = false;
bool doorOpen = false;

float temperatureC = 0.0;
float humidity = 0.0;
     
void setup()
{
  sht.begin(0x44);
  Serial.begin(9600);
  pinMode(relayPin, OUTPUT);
  pinMode(doorPin, INPUT_PULLUP);
  doorOpen = digitalRead(doorPin);
}
     
void loop() 
{
  if(Serial.available() > 0) {

    byte cmd = Serial.read();

    switch(cmd) {
      case '1':
        digitalWrite(relayPin, HIGH);
        on = true;
        break;
      case '0':
        digitalWrite(relayPin, LOW);
        on = false;
        break;
      case 's':
      
      /* TMP36
        int reading = analogRead(sensorPin);  
     
        // converting that reading to voltage, for 3.3v arduino use 3.3
        float voltage = reading * 5.0;
        voltage /= 1024.0; 
        
        temperatureC = (voltage - 0.5) * 100 ;  //converting from 10 mv per degree wit 500 mV offset
                                                   //to degrees ((voltage - 500mV) times 100)

      */

      /* SHT31-D  */

        temperatureC = sht.readTemperature();
        humidity = sht.readHumidity();
      
        Serial.print("{");
        Serial.print("\"Temp\":");
        Serial.print(temperatureC);
        Serial.print(",\"Hum\":");
        Serial.print(humidity);
        Serial.print(",\"Door\":");
        Serial.print(doorOpen);
        Serial.print(", \"State\":");
        Serial.print(on ? 1 : 0);
        Serial.print("}\n");
        break;

      case 'r':
        sht.reset();
        break;

      default:
        break;
    }
  }

  doorOpen = digitalRead(doorPin);
  
}
