const fs = require("fs");
const { getAllContractsByOwnerSlotType } = require("../src/dblite");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

async function generateMPT() {
  const ownerSlotType = "0";
  const contracts = await getAllContractsByOwnerSlotType(ownerSlotType);

  const leafs = [];

  let i = 0;
  for (const contract of contracts) {
    leafs.push([
      contract.chain_id,
      contract.contract_address,
      contract.name,
      contract.symbol,
      contract.owner_slot_type,
      contract.owner_slot_index,
      contract.owner_unpack_type,
    ]);
    i++;
  }

  const tree = StandardMerkleTree.of(leafs, [
    "uint256",
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
}

generateMPT().catch((err) => {
  console.log(err);
});
