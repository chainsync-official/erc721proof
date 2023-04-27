const { Sequelize, QueryTypes, DataTypes } = require("sequelize");
const {
  getDB,
  WalletCollection,
  WalletNFT,
  NFTConfig,
  MirrorCollections,
  MirrorNFTs,
  MirrorChains,
} = require("./defines");

const sequelize = getDB();

const getWalletInfo = async (walletAddress, chain_id) => {
  return await sequelize.query("SELECT * FROM walletinfo WHERE wallet = $1 AND chainId = $2", {
    bind: [walletAddress, chain_id],
    type: QueryTypes.SELECT,
  });
};

const setWalletInfo = async (walletAddress, chain_id, lastCollectoinBlock, lastNFTBlock) => {
  return await sequelize.query(
    "INSERT INTO walletinfo (wallet, chainId, lastCollectionBlock, lastNFTBlock) VALUES ($1, $2, $3, $4) ON DUPLICATE KEY UPDATE lastCollectionBlock = $3, lastNFTBlock = $4",
    {
      bind: [walletAddress, chain_id, lastCollectoinBlock, lastNFTBlock],
      type: QueryTypes.INSERT,
    }
  );
};

const cleanWalletCollections = async (walletAddress, chain_id) => {
  return await sequelize.query("DELETE FROM walletCollections WHERE wallet = $1 AND chainId = $2", {
    bind: [walletAddress, chain_id],
    type: QueryTypes.DELETE,
  });
};

const batchInsertWalletCollections = async (walletAddress, chain_id, collections) => {
  let data = [];
  for (let index = 0; index < collections.length; index++) {
    if (collections[index].tokenType == "ERC721") {
      data.push({
        wallet: walletAddress,
        chainId: chain_id,
        contract: collections[index].contract,
        name: collections[index].name,
        symbol: collections[index].symbol,
      });
    }
  }

  return await WalletCollection.bulkCreate(data);
};

const getWalletCollections = async (walletAddress, chain_id, lastId, nonSynced, dstChainId) => {
  const data = await sequelize.query(
    "SELECT * FROM walletCollections WHERE wallet = $1 AND chainId = $2 " +
      (lastId > 0 ? "AND id < " + lastId : "") +
      " ORDER BY id DESC LIMIT 40",
    {
      bind: [walletAddress, chain_id, lastId],
      type: QueryTypes.SELECT,
    }
  );
  for (let i = 0; i < data.length; i++) {
    data[i].mirror = 0;
    data[i].mirrorData = {};

    if (!nonSynced) {
      if (i % 5 == 0) {
        data[i].mirror = 1;
        data[i].mirrorData = {
          chain_id: chain_id == 1 ? 137 : 1,
          contract: data[i].contract,
          name: "Bored Ape Yacht Club",
          symbol: "BAYC",
        };
      }
    }
  }
  return data;
};

const cleanWalletNFTs = async (walletAddress, chain_id) => {
  return await sequelize.query("DELETE FROM walletNFTs WHERE wallet = $1 AND chainId = $2", {
    bind: [walletAddress, chain_id],
    type: QueryTypes.DELETE,
  });
};

const batchInsertWalletNFTs = async (walletAddress, chain_id, nfts) => {
  let data = [];
  for (let index = 0; index < nfts.length; index++) {
    if (nfts[index].type == "ERC721" && nfts[index].metadata != null) {
      data.push({
        wallet: walletAddress,
        chainId: chain_id,
        contract: nfts[index].contract,
        tokenId: nfts[index].tokenId,
        metadata: JSON.stringify(nfts[index].metadata),
      });
    }
  }

  await WalletNFT.bulkCreate(data);
};

const getWalletNFTs = async (walletAddress, chain_id, lastId, nonSynced, dstChainId) => {
  const data = await sequelize.query(
    "SELECT * FROM walletNFTs WHERE wallet = $1 AND chainId = $2 " +
      (lastId > 0 ? "AND id < " + lastId : "") +
      " ORDER BY id DESC LIMIT 40",
    {
      bind: [walletAddress, chain_id, lastId],
      type: QueryTypes.SELECT,
    }
  );
  for (let i = 0; i < data.length; i++) {
    const metadata = JSON.parse(data[i].metadata);
    if (metadata.image != null) {
      const urldata = new URL(metadata.image);
      if (urldata.protocol == "ipfs:") {
        metadata.image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
    }

    data[i].mirror = data[i].mirrored = 0;
    data[i].mirrorData = data[i].mirroredData = {};

    if (!nonSynced) {
      if (i % 5 == 0) {
        data[i].mirror = 1;
        data[i].mirrorData = {
          chain_id: chain_id == 1 ? 137 : 1,
          contract: data[i].contract,
          name: "Bored Ape Yacht Club",
          symbol: "BAYC",
        };
      } else if (i % 5 == 1) {
        data[i].mirrored = 1;
        data[i].mirroredData = {
          chain_id: chain_id == 5 ? 80001 : 5,
          contract: data[i].contract,
          name: "Bored Ape Yacht Club",
          symbol: "BAYC",
        };
      } else if (i % 5 == 2) {
        data[i].mirrored = 2;
      }
    }

    data[i].metadata = metadata;
  }
  return data;
};

const TruncateNFTConfig = async () => {
  return await sequelize.query("TRUNCATE TABLE nftConfigs", {
    type: QueryTypes.DELETE,
  });
};

const batchInsertNFTConfig = async (nftConfigs) => {
  await NFTConfig.bulkCreate(nftConfigs);
};

const getNFTConfig = async (chain_id, contract) => {
  const res = await sequelize.query(
    "SELECT * FROM nftConfigs WHERE chainId = $1 AND contract = $2",
    {
      bind: [chain_id, contract],
      type: QueryTypes.SELECT,
    }
  );
  if (res.length == 0) {
    return null;
  }
  return res[0];
};

const batchInsertMirrorCollections = async (mirrorCollections) => {
  await MirrorCollections.bulkCreate(mirrorCollections);
};

const InsertMirrorCllection = async (mirrorCollection) => {
  await MirrorCollections.create(mirrorCollection);
};

const batchInsertMirrorNFTs = async (mirrorNFTs) => {
  await MirrorNFTs.bulkCreate(mirrorNFTs);
};

const InsertMirrorNFT = async (mirrorNFT) => {
  await MirrorNFTs.create(mirrorNFT);
};

const getMirrorChains = async () => {
  const res = await sequelize.query("SELECT * FROM mirrorChains", {
    type: QueryTypes.SELECT,
  });
  return res;
};

const getMirrorChain = async (chainId) => {
  const res = await sequelize.query("SELECT * FROM mirrorChains WHERE chainId = $1", {
    bind: [chainId],
    type: QueryTypes.SELECT,
  });
  if (res.length == 0) {
    return null;
  }
  return res[0];
};

const updateMirrorChain = async (chainId, data) => {
  return await MirrorChains.update(data, {
    where: {
      chainId: chainId,
    },
  });
};

module.exports = {
  getWalletInfo,
  setWalletInfo,
  cleanWalletCollections,
  batchInsertWalletCollections,
  getWalletCollections,
  cleanWalletNFTs,
  batchInsertWalletNFTs,
  getWalletNFTs,
  TruncateNFTConfig,
  batchInsertNFTConfig,
  getNFTConfig,
  batchInsertMirrorCollections,
  InsertMirrorCllection,
  batchInsertMirrorNFTs,
  InsertMirrorNFT,
  getMirrorChains,
  getMirrorChain,
  updateMirrorChain,
};
