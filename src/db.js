// db.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("data/erc721proof.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the erc721proof database.");
});

const createERC721ContractsTable = () => {
  const query = `
  CREATE TABLE IF NOT EXISTS erc721_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_address TEXT UNIQUE,
    name TEXT,
    symbol TEXT,
    owner_slot_type INTEGER,
    owner_slot_index INTEGER,
    owner_unpack_type INTEGER
  );`;

  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log("erc721_contracts table created");
        resolve();
      }
    });
  });
};

const createTable = async () => {
  await createERC721ContractsTable();
};

const insertErc721Contract = (
  contractAddress,
  name,
  symbol,
  owner_slot_type,
  owner_slot_index,
  owner_unpack_type
) => {
  const query = `
  INSERT OR IGNORE INTO erc721_contracts (contract_address, name, symbol, owner_slot_type, owner_slot_index, owner_unpack_type)
  VALUES (?, ?, ?, ?, ?, ?);`;

  return new Promise((resolve, reject) => {
    db.run(
      query,
      [contractAddress, name, symbol, owner_slot_type, owner_slot_index, owner_unpack_type],
      function (err) {
        if (err) {
          console.error(err.message);
          reject(err);
        } else {
          console.log(`New ERC721 contract added: ${contractAddress}`);
          resolve(this.lastID);
        }
      }
    );
  });
};

const getContractData = (contractAddress) => {
  const query = `
    SELECT * FROM erc721_contracts WHERE contract_address = ?;`;

  return new Promise((resolve, reject) => {
    db.get(query, [contractAddress], (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const updateContractData = (contractAddress, data) => {
  const query = `
  UPDATE erc721_contracts
  SET name = ?, symbol = ?, owner_slot_type = ?, owner_slot_index = ?, owner_unpack_type = ?
  WHERE contract_address = ?;`;

  return new Promise((resolve, reject) => {
    db.run(
      query,
      [
        data.name,
        data.symbol,
        data.owner_slot_type,
        data.owner_slot_index,
        data.owner_unpack_type,
        contractAddress,
      ],
      function (err) {
        if (err) {
          console.error(err.message);
          reject(err);
        } else {
          console.log(`Updated ERC721 contract data for address: ${contractAddress}`);
          resolve(this.changes);
        }
      }
    );
  });
};

const getAllContractsByOwnerSlotType = (ownerSlotType) => {
  const query = `
  SELECT * FROM erc721_contracts WHERE owner_slot_type != ?;`;

  return new Promise((resolve, reject) => {
    db.all(query, [ownerSlotType], (err, rows) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  createTable,
  insertErc721Contract,
  getContractData,
  updateContractData,
  getAllContractsByOwnerSlotType,
};
