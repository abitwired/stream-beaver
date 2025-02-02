<img src="./assets/images/stream-beaver-logo.png" width="300" alt="Stream Beaver Logo">

# Stream Beaver

Stream Beaver is a project that provides an API for consuming MQTT messages and storing them in MongoDB, with endpoints to retrieve the data. It includes a FastAPI application for handling HTTP requests and a Node.js script (`mqtt-to-mongodb.js`) for subscribing to MQTT messages and inserting them into MongoDB.

## Features

- **MQTT Broker**: Uses Eclipse Mosquitto as the MQTT broker.
- **MongoDB**: Stores MQTT messages in MongoDB collections based on topic mappings.
- **FastAPI**: Provides HTTP endpoints for interacting with MongoDB collections and retrieving MQTT data.

Use the configuration file `config.json` to map MQTT topics to MongoDB collections. The `mqtt-to-mongodb.js` script subscribes to MQTT topics and inserts messages into the corresponding MongoDB collections. It is also used by the FastAPI application to retrieve messages from MongoDB since we can do a reverse lookup of the collection based on the topic provided. The FastAPI application provides endpoints to retrieve messages by collection, message ID, and topic, as well as create and delete messages.

By default, the FastAPI application runs on port 8000, and the MQTT broker runs on port 1883. You can access the FastAPI documentation at [http://localhost:8000/docs](http://localhost:8000/docs) or [http://localhost:8000/redoc](http://localhost:8000/redoc).

## Architecture

![Stream Beaver Architecture](./assets/images/stream-beaver-diagram.png)

## Requirements

- Docker
- Docker Compose

## Installation and Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Create `config.json`:**

   Create a `config.json` file in the `root` directory with topic mappings:

   ```json
   {
     "topicMappings": {
       "lte_message": "lte_messages",
       "80211_beacon_message": "wifi_messages",
       "gnss_message": "gnss_messages",
       "bluetooth": "bluetooth_messages",
       "device_status_message": "status_messages"
     }
   }
   ```

   _Or you could map all of the messages to a single MongoDB collection:_

   ```json
   {
     "topicMappings": {
       "gsm_message": "network_survey",
       "cdma_message": "network_survey",
       "umts_message": "network_survey",
       "lte_message": "network_survey",
       "nr_message": "network_survey",
       "80211_beacon_message": "network_survey",
       "bluetooth_message": "network_survey",
       "gnss_message": "network_survey"
     }
   }
   ```

3. **Run Docker Compose:**

   ```bash
   docker-compose up -d
   ```

   This command will build and start the services defined in `docker-compose.yml`, including MQTT broker, MongoDB, MQTT-to-MongoDB subscriber, and FastAPI.

4. **Access the FastAPI Documentation:**

   - OpenAPI (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Installing with Kubernetes

```bash
cd stream-beaver-helm
helm install stream-beaver .
```

If you want to rebuild the kubernetes resources, you can install `kompose` and run the following command:

```bash
kompose convert -c -f docker-compose.yaml -o stream-beaver-helm
```

## API Endpoints

### GET /messages/collection/{collection_name}

Retrieve messages from a specified MongoDB collection.

### GET /messages/{message_id}

Retrieve a specific message by its ID with collection lookup.

### GET /messages/topic/{topic}

Retrieve all messages for a specific MQTT topic with collection lookup.

### POST /messages/collection/{collection_name}

Create a new message in the specified MongoDB collection.

### DELETE /messages/{message_id}

Delete a specific message by its ID with collection lookup.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the [MIT License](LICENSE).
