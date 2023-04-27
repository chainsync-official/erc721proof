const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  "mysql://" +
    process.env.MYSQL_USER +
    ":" +
    process.env.MYSQL_PASSWORD +
    "@" +
    process.env.MYSQL_HOST +
    ":3306/" +
    process.env.MYSQL_DB
);

const WalletCollection = sequelize.define(
  "walletCollections",
  {
    wallet: {
      type: DataTypes.STRING,
    },
    chainId: {
      type: DataTypes.INTEGER,
    },
    contract: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    symbol: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
);

const WalletNFT = sequelize.define(
  "walletNFTs",
  {
    wallet: {
      type: DataTypes.STRING,
    },
    chainId: {
      type: DataTypes.INTEGER,
    },
    contract: {
      type: DataTypes.STRING,
    },
    tokenId: {
      type: DataTypes.STRING,
    },
    metadata: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: false,
  }
);

const NFTConfig = sequelize.define(
  "nftConfig",
  {
    chainId: {
      type: DataTypes.INTEGER,
    },
    contract: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    symbol: {
      type: DataTypes.STRING,
    },
    owner_slot_type: {
      type: DataTypes.INTEGER,
    },
    owner_slot_index: {
      type: DataTypes.INTEGER,
    },
    owner_unpack_type: {
      type: DataTypes.INTEGER,
    },
    proof: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: false,
  }
);

const MirrorCollections = sequelize.define(
  "mirrorCollections",
  {
    chainId: {
      type: DataTypes.INTEGER,
    },
    contract: {
      type: DataTypes.STRING,
    },
    mirrorChainId: {
      type: DataTypes.INTEGER,
    },
    mirrorContract: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
);

const MirrorNFTs = sequelize.define(
  "mirrorNFTs",
  {
    chainId: {
      type: DataTypes.INTEGER,
    },
    contract: {
      type: DataTypes.STRING,
    },
    mirrorChainId: {
      type: DataTypes.INTEGER,
    },
    mirrorContract: {
      type: DataTypes.STRING,
    },
    tokenId: {
      type: DataTypes.BIGINT,
    },
  },
  {
    timestamps: false,
  }
);

const MirrorChainStatus = sequelize.define(
  "mirrorChainStatus",
  {
    chainId: {
      type: DataTypes.INTEGER,
    },
    mirrorFactoryContract: {
      type: DataTypes.STRING,
    },
    lastSyncBlock: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: false,
  }
);

const getDB = () => {
  return sequelize;
};

module.exports = {
  getDB,
  WalletCollection,
  WalletNFT,
  NFTConfig,
  MirrorCollections,
  MirrorNFTs,
  MirrorChainStatus,
};
