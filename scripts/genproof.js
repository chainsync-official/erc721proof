const fs = require("fs");
const Trie = require("merkle-patricia-tree").BaseTrie;
const mptData = require("../erc721mpt.json");

async function generateMPT() {
  const trie = new Trie();
  const promises = [];
  for (const index in mptData.leafs) {
    const item = mptData.leafs[index];
    promises.push(
      new Promise((resolve, reject) => {
        const key = Buffer.from(item.key.slice(2), "hex");
        const encodedValue = Buffer.from(item.value.slice(2), "hex");

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

  mptData.root = trie.root.toString("hex");
  console.log(`MPT root: 0x${mptData.root}`);

  const proofs = await Trie.createProof(trie, Buffer.from(mptData.leafs[0].key.slice(2), "hex"));
  for (const proof in proofs) {
    console.log(proofs[proof].toString("hex"));
  }
}

generateMPT().catch((err) => {
  console.log(err);
});
