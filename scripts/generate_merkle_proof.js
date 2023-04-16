const fs = require("fs");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

async function generateMPT() {
  const indexmap = JSON.parse(fs.readFileSync("data/erc721ConfigLeafsIndexMap.json"));
  const values = JSON.parse(fs.readFileSync("data/erc721ConfigLeafs.json"));

  const tree = StandardMerkleTree.load(values);

  console.log(`Merkle root: ${tree.root}`);

  const address = "0x03ef30e1aee25abd320ad961b8cd31aa1a011c97";
  const i = indexmap[address];

  const proof = tree.getProof(i);
  console.log("Value:", values.values[i].value);
  console.log("Proof:", proof);
}

generateMPT().catch((err) => {
  console.log(err);
});
