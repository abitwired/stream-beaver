from fastapi import FastAPI, HTTPException, Query
from pymongo import MongoClient
from bson import ObjectId
from typing import List, Optional
import json

app = FastAPI(
    title="Stream Beaver API",
    description="API for consuming MQTT messages and storing them in MongoDB, with endpoints to retrieve the data.",
    version="1.0.0",
)

# Load configuration
with open("/app/config.json", "r") as f:
    config = json.load(f)

mongo_client = MongoClient("mongodb://mongo:27017")
db = mongo_client.mqttData

@app.get("/", summary="Root Endpoint", description="Welcome message for the MQTT MongoDB FastAPI")
def read_root():
    return {"message": "Welcome to the MQTT MongoDB FastAPI"}

@app.get("/messages/collection/{collection_name}", response_model=List[dict], summary="Get Messages by Collection", description="Retrieve all messages from a specified collection with pagination")
def get_messages(collection_name: str, skip: int = 0, limit: int = 10):
    messages = list(db[collection_name].find({}).skip(skip).limit(limit))
    for message in messages:
        message["_id"] = str(message["_id"])
    return messages

@app.get("/messages/{message_id}", response_model=dict, summary="Get Message by ID", description="Retrieve a specific message by its ID with reverse lookup to find the correct collection")
def get_message(message_id: str):
    for collection_name in config["topicMappings"].values():
        message = db[collection_name].find_one({"_id": ObjectId(message_id)})
        if message:
            message["_id"] = str(message["_id"])
            return message
    raise HTTPException(status_code=404, detail="Message not found")

@app.get("/messages/topic/{topic}", response_model=List[dict], summary="Get Messages by Topic", description="Retrieve all messages for a specific topic with pagination and collection lookup")
def get_messages_by_topic(topic: str, skip: int = 0, limit: int = 10):
    collection_name = config["topicMappings"].get(topic, "default_collection")
    messages = list(db[collection_name].find({"topic": topic}).skip(skip).limit(limit))
    if messages:
        for message in messages:
            message["_id"] = str(message["_id"])
        return messages
    raise HTTPException(status_code=404, detail="No messages found for the given topic")

@app.post("/messages/collection/{collection_name}", response_model=dict, summary="Create Message", description="Create a new message in the specified collection")
def create_message(collection_name: str, message: dict):
    result = db[collection_name].insert_one(message)
    new_message = db[collection_name].find_one({"_id": result.inserted_id})
    new_message["_id"] = str(new_message["_id"])
    return new_message

@app.delete("/messages/{message_id}", response_model=dict, summary="Delete Message by ID", description="Delete a specific message by its ID with reverse lookup to find the correct collection")
def delete_message(message_id: str):
    for collection_name in config["topicMappings"].values():
        result = db[collection_name].delete_one({"_id": ObjectId(message_id)})
        if result.deleted_count == 1:
            return {"message": "Message deleted successfully"}
    raise HTTPException(status_code=404, detail="Message not found")
