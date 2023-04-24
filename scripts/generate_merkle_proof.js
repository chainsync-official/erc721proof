const fs = require("fs");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const { batchInsertNFTConfig, TruncateNFTConfig } = require("../src/dbmysql");

async function generateMPT() {
  const values = JSON.parse(fs.readFileSync("data/erc721ConfigLeafs.json"));

  const tree = StandardMerkleTree.load(values);

  console.log(`Merkle root: ${tree.root}`);

  const nftConfigs = [];

  for (const [i, v] of tree.entries()) {
    const proof = tree.getProof(i);
    nftConfigs.push({
      chainId: v[0],
      contract: v[1],
      name: v[2],
      symbol: v[3],
      owner_slot_type: v[4],
      owner_slot_index: v[5],
      owner_unpack_type: v[6],
      proof: JSON.stringify(proof),
    });
  }

  await TruncateNFTConfig();
  await batchInsertNFTConfig(nftConfigs);
}

generateMPT().catch((err) => {
  console.log(err);
});
