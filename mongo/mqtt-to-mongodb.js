const mqtt = require("mqtt");
const { MongoClient } = require("mongodb");
const fs = require("fs");

console.log("Reading config file /app/config.json");
const config = JSON.parse(fs.readFileSync("/app/config.json", "utf-8"));

const mqttBrokerUrl = "mqtt://mqtt-broker:1883";
const mongoUrl = "mongodb://mongo:27017";
const dbName = "mqttData";
const collectionName = "messages";

const mongoClient = new MongoClient(mongoUrl);
try {
  mongoClient.on("connect", () => {
    console.log("Connected to MongoDB");
  });
  mongoClient.connect();

  const client = mqtt.connect(mqttBrokerUrl);
  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client.subscribe("#", (err) => {
      if (err) {
        console.error("Failed to subscribe to topic", err);
      }
    });

    client.on("message", async (topic, message) => {
      try {
        const data = { topic, message: JSON.parse(message.toString()) };
        const collectionName =
          config.topicMappings[topic] || "dead_letter_queue";
        const result = await mongoClient
          .db(dbName)
          .collection(collectionName)
          .insertOne(data);
        console.log(
          `Inserted message with ID: ${result.insertedId} into MongoDB ${collectionName} collection`
        );
      } catch (err) {
        console.error("Failed to insert message into MongoDB", err);
      }
    });
  });

  client.on("error", (err) => {
    console.error("Failed to connect to MQTT broker", err);
  });
} catch (err) {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
}
