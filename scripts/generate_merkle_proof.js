const fs = require("fs");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

async function generateMPT() {
  const indexmap = JSON.parse(fs.readFileSync("data/erc721ConfigLeafsIndexMap.json"));
  const values = JSON.parse(fs.readFileSync("data/erc721ConfigLeafs.json"));

  const tree = StandardMerkleTree.load(values);

  console.log(`Merkle root: ${tree.root}`);

  const address = "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7";
  const chain_id = 1;
  const i = indexmap[packAddressAndChainId(address, chain_id)];

  if (i > 0) {
    const proof = tree.getProof(i);
    console.log("Value:", values.values[i].value);
    console.log("Proof:", proof);
  } else {
    console.log("Not found");
  }
}

generateMPT().catch((err) => {
  console.log(err);
});

function packAddressAndChainId(token, chainId) {
  const maxChainId = BigInt(2) ** BigInt(96);

  if (BigInt(chainId) >= maxChainId) {
    throw new Error("chainId is too large");
  }

  const addressBigInt = BigInt(parseInt(token.slice(2), 16));
  const chainIdBigInt = BigInt(chainId);

  const packedData = (addressBigInt << BigInt(96)) | chainIdBigInt;
  return packedData.toString();
}
