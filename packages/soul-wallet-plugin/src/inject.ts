// @ts-nocheck
import Web3 from "web3";
import Bus from "./lib/bus";
import config from "./config";
import ProviderEngine from "web3-provider-engine";
import CacheSubprovider from "web3-provider-engine/subproviders/cache.js";
import FixtureSubprovider from "web3-provider-engine/subproviders/fixture.js";
import FilterSubprovider from "web3-provider-engine/subproviders/filters.js";
import VmSubprovider from "web3-provider-engine/subproviders/vm.js";
import HookedWalletSubprovider from "web3-provider-engine/subproviders/hooked-wallet.js";
import NonceSubprovider from "web3-provider-engine/subproviders/nonce-tracker.js";
import RpcSubprovider from "web3-provider-engine/subproviders/rpc.js";

var engine = new ProviderEngine();

window.web3 = new Web3(config.provider);

// static results
engine.addProvider(
    new FixtureSubprovider({
        web3_clientVersion: "ProviderEngine/v0.0.0/javascript",
        net_listening: true,
        eth_hashrate: "0x00",
        eth_mining: false,
        eth_syncing: true,
    }),
);

// cache layer
engine.addProvider(new CacheSubprovider());

// filters
engine.addProvider(new FilterSubprovider());

// pending nonce
engine.addProvider(new NonceSubprovider());

// vm
engine.addProvider(new VmSubprovider());

// id mgmt
engine.addProvider(
    new HookedWalletSubprovider({
        getAccounts: async function (cb) {
            const res = await Bus.send("getAccounts", "getAccounts");
            cb(null, [res]);
        },
        approveTransaction: async function (txData, cb) {
            await Bus.send("approve", "approveTransaction");
            cb(null, [txData]);
        },
        sendTransaction: async function (txData, cb) {
            console.log("sendTransaction");
            cb(null, txData);
        },
        signTransaction: async function (txData, cb) {
            console.log("tx data", txData);
            const res = await Bus.send("signTx", "signTransaction", txData);
            cb(null, res);
        },
    }),
);

// data source
engine.addProvider(
    new RpcSubprovider({
        rpcUrl: config.provider,
    }),
);

// log new blocks
// engine.on("block", function (block) {
//     console.log("BLOCK CHANGED:", "#" + block.number.toString("hex"));
// });

// network connectivity error
engine.on("error", function (err) {
    // report connectivity errors
    console.error(err.stack);
});

// start polling for blocks
// engine.start();

window.soul = {
    enable: () => {
        engine.start();
        window.soul = engine;
    },
};
