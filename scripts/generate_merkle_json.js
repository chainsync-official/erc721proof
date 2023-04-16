const fs = require("fs");
const { getAllContractsByOwnerSlotType } = require("../src/db");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

async function generateMPT() {
  const ownerSlotType = "0";
  const contracts = await getAllContractsByOwnerSlotType(ownerSlotType);

  const leafs = [];
  const leafsIndexMap = {};

  let i = 0;
  for (const contract of contracts) {
    leafs.push([
      contract.contract_address,
      contract.name,
      contract.symbol,
      contract.owner_slot_type,
      contract.owner_slot_index,
      contract.owner_unpack_type,
    ]);
    leafsIndexMap[contract.contract_address] = i;
    i++;
  }

  const tree = StandardMerkleTree.of(leafs, [
    "address",
    "string",
    "string",
    "uint256",
    "uint256",
    "uint256",
  ]);

  console.log("Merkle Root:", tree.root);

  fs.writeFileSync("data/erc721ConfigLeafs.json", JSON.stringify(tree.dump()));
  console.log("NFT config data saved to erc721ConfigLeafs.json");

  fs.writeFileSync("data/erc721ConfigLeafsIndexMap.json", JSON.stringify(leafsIndexMap, null, 2));
  console.log("NFT config index map data saved to erc721ConfigLeafsIndexMap.json");
}

generateMPT().catch((err) => {
  console.log(err);
});
