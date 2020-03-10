    //TMP36 Pin Variables
    int sensorPin = 0; //the analog pin the TMP36's Vout (sense) pin is connected to
                            //the resolution is 10 mV / degree centigrade with a
                            //500 mV offset to allow for negative temperatures
     
    /*
     * setup() - this function runs once when you turn your Arduino on
     * We initialize the serial connection with the computer
     */

     int delayTime = 60000;

     bool on = false;
     
    void setup()
    {
      Serial.begin(9600);  //Start the serial connection with the computer
                           //to view the result open the serial monitor 
      pinMode(13, OUTPUT);
    }
     
    void loop()                     // run over and over again
    {
      //getting the voltage reading from the temperature sensor

      if(Serial.available() > 0) {

        byte cmd = Serial.read();

        switch(cmd) {
          case '1':
            digitalWrite(13, HIGH);
            on = true;
            break;
          case '0':
            digitalWrite(13, LOW);
            on = false;
            break;
        }
      }
      if(on) {
        int reading = analogRead(sensorPin);  
     
        // converting that reading to voltage, for 3.3v arduino use 3.3
        float voltage = reading * 5.0;
        voltage /= 1024.0; 
     
        // print out the voltage
        //Serial.print(voltage); Serial.println(" volts");
     
        // now print out the temperature
        float temperatureC = (voltage - 0.5) * 100 ;  //converting from 10 mv per degree wit 500 mV offset
                                                   //to degrees ((voltage - 500mV) times 100)
        //Serial.print(temperatureC); Serial.println(" degrees C");
     
        // now convert to Fahrenheit
        float temperatureF = (temperatureC * 9.0 / 5.0) + 32.0;
        Serial.print("{");
        Serial.print("\"Temp\":");
        Serial.print(temperatureC);
        Serial.print(",\"Moist\":0");
        Serial.print("}\n");
     
     
        delay(1000);
      }
    }
