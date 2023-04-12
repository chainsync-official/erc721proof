const fs = require("fs");
const { getAllContractsByOwnerSlotType } = require("../src/db");
const Trie = require("merkle-patricia-tree").BaseTrie;
const Web3 = require("web3");
const abiCoder = new Web3().eth.abi;
const utils = new Web3().utils;

async function generateMPT() {
  const trie = new Trie();
  const ownerSlotType = "0";
  const contracts = await getAllContractsByOwnerSlotType(ownerSlotType);

  const mptData = {
    root: null,
    leafs: [],
    datas: {},
  };

  const promises = [];

  for (const contract of contracts) {
    const key = Buffer.from(contract.contract_address.slice(2), "hex");
    const types = ["string", "string", "string", "uint256", "uint256", "uint256"];
    const values = [
      contract.contract_address,
      contract.name,
      contract.symbol,
      contract.owner_slot_type,
      contract.owner_slot_index,
      contract.owner_unpack_type,
    ];

    const leaf = utils.keccak256(abiCoder.encodeParameters(types, values));
    const encodedValue = Buffer.from(leaf.slice(2), "hex");

    mptData.leafs.push({ key: contract.contract_address, value: leaf });
    mptData.datas[contract.contract_address] = values;

    promises.push(
      new Promise((resolve, reject) => {
        trie
          .put(key, encodedValue)
          .then((res) => {
            resolve();
          })
          .catch((err) => {
            console.log(err);
            reject();
          });
      })
    );
  }

  await Promise.all(promises);

  const leaf = Buffer.from(contracts[0].contract_address.slice(2), "hex");
  const proofs = await Trie.createProof(trie, leaf);

  for (const proof of proofs) {
    console.log(proof.toString("hex"));
  }

  mptData.root = trie.root.toString("hex");
  console.log(`MPT root: 0x${mptData.root}`);

  const value = await Trie.verifyProof(trie.root, leaf, proofs);
  console.log(value.toString("hex"));

  fs.writeFileSync("erc721mpt.json", JSON.stringify(mptData, null, 2));
  console.log("MPT data saved to erc721mpt.json");
}

generateMPT().catch((err) => {
  console.log(err);
});
