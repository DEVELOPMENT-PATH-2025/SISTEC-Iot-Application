// Update this file in your Arduino IDE
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- CONFIGURATION ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Use your actual App URL from the browser address bar (without the trailing slash)
const char* serverUrl = "https://ais-pre-pdgtmb6cobgqdojacn2oe7-37659524039.asia-east1.run.app"; 

#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  dht.begin();
  lcd.init();
  lcd.backlight();
  
  // FIXED: Shorter message for 16x2 LCD
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connecting");
  lcd.setCursor(0, 1); // Move to second line for dots
  
  WiFi.begin(ssid, password);
  int count = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    lcd.print("."); 
    count++;
    if(count > 15) { lcd.setCursor(0, 1); lcd.print("                "); lcd.setCursor(0, 1); count = 0; }
  }
  
  lcd.clear();
  lcd.print("WiFi CONNECTED!");
  delay(1000);
  lcd.setCursor(0, 1);
  lcd.print("-- WELCOME --");
  delay(2000);
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) return;

  // 1. Temp Display
  lcd.clear();
  lcd.print("TEMPERATURE");
  lcd.setCursor(0, 1);
  lcd.print(String(t) + " 'C");
  delay(2000);

  // 2. Humidity Display
  lcd.clear();
  lcd.print("HUMIDITY");
  lcd.setCursor(0, 1);
  lcd.print(String(h) + " %");
  delay(2000);

  // 3. Fetch LCD Text from Web Dashboard
  String lcdMsg = fetchLcdText();
  lcd.clear();
  lcd.print("SISTec DISPLAY");
  lcd.setCursor(0, 1);
  lcd.print(lcdMsg);
  delay(3000);

  // 4. Send Data to Firestore Cloud
  sendSensorData(t, h);
  delay(10000); // Wait 10 seconds before next loop
}

String fetchLcdText() {
  WiFiClientSecure client;
  client.setInsecure(); 
  HTTPClient http;
  http.begin(client, String(serverUrl) + "/api/lcd");
  int httpCode = http.GET();
  String payload = (httpCode == 200) ? http.getString() : "Sync Error";
  http.end();
  return payload;
}

void sendSensorData(float temp, float hum) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  
  lcd.clear();
  lcd.print("SYNCING DATA...");
  
  http.begin(client, String(serverUrl) + "/api/sensor");
  http.addHeader("Content-Type", "application/json");
  
  String json = "{\"temp\":" + String(temp) + ",\"hum\":" + String(hum) + "}";
  int httpCode = http.POST(json);
  
  lcd.setCursor(0, 1);
  if (httpCode == 200) lcd.print("DATA SENT!");
  else lcd.print("SERVER ERR: " + String(httpCode));
  
  http.end();
}
