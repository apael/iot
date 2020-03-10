//TMP36 Pin Variables
int sensorPin = 0;      //the analog pin the TMP36's Vout (sense) pin is connected to
                            //the resolution is 10 mV / degree centigrade with a
                            //500 mV offset to allow for negative temperatures
int relayPin = 13;
int doorPin = 12;
                            
int delayTime = 1000;
bool on = true;
bool doorOpen = false;
     
void setup()
{
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
        int reading = analogRead(sensorPin);  
     
        // converting that reading to voltage, for 3.3v arduino use 3.3
        float voltage = reading * 5.0;
        voltage /= 1024.0; 
        
        float temperatureC = (voltage - 0.5) * 100 ;  //converting from 10 mv per degree wit 500 mV offset
                                                   //to degrees ((voltage - 500mV) times 100)
        Serial.print("{");
        Serial.print("\"Temp\":");
        Serial.print(temperatureC);
        Serial.print(",\"Moist\":0");
        Serial.print(",\"Door\":");
        Serial.print(doorOpen);
        Serial.print(", \"State\":");
        Serial.print(on ? 1 : 0);
        Serial.print("}\n");
        break;

      default:
        break;
    }
  }

  doorOpen = digitalRead(doorPin);
  
}
