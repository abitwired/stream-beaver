const { deepKeys } = require("./util");

/**
 * Automatically create indexes for collections in the database
 * based on the data being inserted.
 *
 * @class AutoIndexer
 */
const MAX_BUFFER_SIZE = 1_000;
class AutoIndexer {
  // Each collection will have a buffer of documents that will be
  // statistically analyzed to determine the best index to create.
  collections = {};

  constructor() {}

  /**
   * Add a document to the given collection
   * @param {string} collectionName
   * @param {Object} document
   * @param {MongoClient} mongoClient
   * @param {string} dbName
   * @returns {void}
   */
  addDocument(collectionName, document, mongoClient, dbName) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = [];
    }

    this.collections[collectionName].push(document);

    if (this.collections[collectionName].length > MAX_BUFFER_SIZE) {
      this.createIndex(collectionName, mongoClient, dbName);
    }
  }

  /**
   * Create an index for the given collection
   * @param {string} collectionName
   * @param {MongoClient} mongoClient
   * @param {string} dbName
   * @returns {void}
   */
  createIndex(collectionName, mongoClient, dbName) {
    const collection = this.collections[collectionName];
    if (!collection) {
      return;
    }

    const indexes = this.analyzeCollection(collection);
    if (indexes.length > 0) {
      indexes.forEach((index) => {
        // Create an index for the given field in the collection
        mongoClient
          .db(dbName)
          .collection(collectionName)
          .createIndex({ [index]: 1 });
      });
    }
    this.clearCollection(collectionName);
  }

  /**
   * Analyze the collection to determine the best index to create
   * @param {Array} collection
   * @returns {Array}
   */
  analyzeCollection(collection) {
    // Analyze the collection to determine the best index to create
    return this.getTopNFields(collection);
  }

  /**
   * Clear the buffer for the given collection
   * @param {string} collectionName
   */
  clearCollection(collectionName) {
    this.collections[collectionName] = [];
  }

  /**
   * Get the top N fields in the collection
   * @param {Array} collection
   * @param {number} n
   * @returns {Array}
   */
  getTopNFields(collection, n = 5) {
    // Analyze the collection to determine the top N fields to index
    const fields = {};
    for (const document of collection) {
      const keys = deepKeys(document);
      for (const field of keys) {
        if (!fields[field]) {
          fields[field] = 0;
        }

        fields[field]++;
      }
    }

    return Object.keys(fields)
      .sort((a, b) => fields[b] - fields[a])
      .slice(0, n);
  }
}

module.exports = AutoIndexer;
