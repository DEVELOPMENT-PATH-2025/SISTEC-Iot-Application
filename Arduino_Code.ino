#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- CONFIGURATION ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://YOUR-APP-URL.run.app"; // Update with your actual URL

// Sensor & Display Pins
#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// LCD Settings: Address 0x27, 16 chars, 2 lines
// SDA = D2, SCL = D1
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT
  dht.begin();
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  
  // Connect to WiFi
  lcd.setCursor(0, 0);
  lcd.print("CONNECTING TO WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    lcd.print(".");
    Serial.print(".");
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONNECTED TO WiFi");
  Serial.println("CONNECTED");
  
  lcd.setCursor(0, 1);
  lcd.print("-- WELCOME--");
  delay(2000);
}

void loop() {
  // Read Data
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Check if reading failed
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // 1. Display Temperature
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TEMPERATURE");
  lcd.setCursor(0, 1);
  lcd.print(String(t) + " 'C");
  delay(2000);

  // 2. Display Humidity
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("HUMIDITY");
  lcd.setCursor(0, 1);
  lcd.print(String(h) + " %");
  delay(2000);

  // 3. Fetch LCD Text from Server
  String lcdMsg = fetchLcdText();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SISTec DISPLAY");
  lcd.setCursor(0, 1);
  lcd.print(lcdMsg);
  delay(3000);

  // 4. Send Data to Server
  sendSensorData(t, h);

  delay(1000);
}

String fetchLcdText() {
  WiFiClientSecure client;
  client.setInsecure(); // Use library in insecure mode for simplicity (no cert check)
  HTTPClient http;
  
  String url = String(serverUrl) + "/api/lcd";
  http.begin(client, url);
  
  int httpCode = http.GET();
  String payload = "Error";
  
  if (httpCode > 0) {
    payload = http.getString();
  }
  
  http.end();
  return payload;
}

void sendSensorData(float temp, float hum) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SENDING DATA TO");
  lcd.setCursor(0, 1);
  lcd.print("WEB SERVER....");
  
  String url = String(serverUrl) + "/api/sensor";
  
  // Create JSON Payload
  String jsonPayload = "{\"temp\": " + String(temp) + ", \"hum\": " + String(hum) + "}";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("DATA SENT...!!");
    Serial.println("Data Sent Successfully");
  } else {
    Serial.println("Error sending data");
  }
  
  http.end();
}
