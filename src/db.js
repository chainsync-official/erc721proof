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
    chain_id integer,
    contract_address TEXT,
    name TEXT,
    symbol TEXT,
    owner_slot_type INTEGER,
    owner_slot_index INTEGER,
    owner_unpack_type INTEGER
  );`;
  const indexQuery = `CREATE UNIQUE INDEX IF NOT EXISTS chain_contract ON "erc721_contracts" ("chain_id", "contract_address");`;

  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log("erc721_contracts table created");
        db.run(indexQuery, (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
          } else {
            console.log("erc721_contracts index created");
            resolve();
          }
        });
      }
    });
  });
};

const createTable = async () => {
  await createERC721ContractsTable();
};

const insertErc721Contract = (
  chain_id,
  contractAddress,
  name,
  symbol,
  owner_slot_type,
  owner_slot_index,
  owner_unpack_type
) => {
  const query = `
  INSERT OR IGNORE INTO erc721_contracts (chain_id, contract_address, name, symbol, owner_slot_type, owner_slot_index, owner_unpack_type)
  VALUES (?, ?, ?, ?, ?, ?, ?);`;

  return new Promise((resolve, reject) => {
    db.run(
      query,
      [
        chain_id,
        contractAddress,
        name,
        symbol,
        owner_slot_type,
        owner_slot_index,
        owner_unpack_type,
      ],
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

const getContractData = (chain_id, contractAddress) => {
  const query = `
    SELECT * FROM erc721_contracts WHERE chain_id = ? AND contract_address = ?;`;

  return new Promise((resolve, reject) => {
    db.get(query, [chain_id, contractAddress], (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const updateContractData = (chain_id, contractAddress, data) => {
  const query = `
  UPDATE erc721_contracts
  SET name = ?, symbol = ?, owner_slot_type = ?, owner_slot_index = ?, owner_unpack_type = ?
  WHERE chain_id = ? AND contract_address = ?;`;

  return new Promise((resolve, reject) => {
    db.run(
      query,
      [
        data.name,
        data.symbol,
        data.owner_slot_type,
        data.owner_slot_index,
        data.owner_unpack_type,
        chain_id,
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

const getAllContractsByOwnerSlotType = (chain_id, ownerSlotType) => {
  const query = `
  SELECT * FROM erc721_contracts WHERE chain_id = ? AND owner_slot_type != ?;`;

  return new Promise((resolve, reject) => {
    db.all(query, [chain_id, ownerSlotType], (err, rows) => {
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
