const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readDB(collection) {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeDB(collection, data) {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function findById(collection, id) {
  return readDB(collection).find(item => item.id === id) || null;
}

function findOne(collection, predicate) {
  return readDB(collection).find(predicate) || null;
}

function insertOne(collection, doc) {
  const data = readDB(collection);
  data.push(doc);
  writeDB(collection, data);
  return doc;
}

function updateById(collection, id, updates) {
  const data = readDB(collection);
  const idx = data.findIndex(item => item.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  writeDB(collection, data);
  return data[idx];
}

function deleteById(collection, id) {
  const data = readDB(collection);
  const filtered = data.filter(item => item.id !== id);
  writeDB(collection, filtered);
  return filtered.length < data.length;
}

function findAll(collection, predicate) {
  const data = readDB(collection);
  return predicate ? data.filter(predicate) : data;
}

module.exports = { readDB, writeDB, findById, findOne, insertOne, updateById, deleteById, findAll };
