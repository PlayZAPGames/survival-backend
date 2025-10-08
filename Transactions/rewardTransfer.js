import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, TonClient, internal } from "@ton/ton";

import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();

router.get('/sendTon', async function (req, res) {

  if (process.env.API_CALL_KEY == req.headers['key']) {
    const mnemonic = process.env.mnemonic_DEV;
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });


    let receiverAddress = req.body.ReceiverAddress;
    let amount = req.body.Amount;

    // make sure wallet is deployed
    if (!await client.isContractDeployed(wallet.address)) {
      return console.log("wallet is not deployed");
    }

    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();
    await  walletContract.sendTransfer({
      seqno: seqno,
      secretKey: key.secretKey,
      messages: [
        internal({
          to: receiverAddress,
          value:  amount * 1e9, 
          bounce: false,
        })
      ]
    });
    // const txn = await walletContract.send(walletContract, transfer);
    // wait until confirmed
    // console.log(walletContract.waitConfirmation())
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = await walletContract.getSeqno();
    }

    res.status(200).json({
      "hash": "Success: "+currentSeqno,
    })
  }
  else{
    res.status(403).json({
      "msg": "Invalid Key!"
    })
  }
});
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;