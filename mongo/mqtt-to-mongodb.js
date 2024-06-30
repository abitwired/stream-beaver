const mqtt = require("mqtt");
const { MongoClient } = require("mongodb");
const AutoIndexer = require("./auto-indexer");
const fs = require("fs");
const autoIndexer = new AutoIndexer();

console.log("Reading config file /app/config.json");
const config = JSON.parse(fs.readFileSync("/app/config.json", "utf-8"));

const mqttBrokerUrl = "mqtt://mqtt-broker:1883";
const mongoUrl = "mongodb://mongo:27017";
const dbName = "mqttData";

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

        // Add document to the auto indexer. This class
        // will analyze the data and create an index based
        // on the data being inserted.
        autoIndexer.addDocument(collectionName, data, mongoClient, dbName);

        // Create index on topic field
        mongoClient
          .db(dbName)
          .collection(collectionName)
          .createIndex({ topic: 1 });

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
