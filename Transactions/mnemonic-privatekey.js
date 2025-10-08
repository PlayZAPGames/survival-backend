import express from 'express';
const router = express.Router();
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import dotenv from 'dotenv';
dotenv.config();

router.get('/getPublicKey', async function (req, res) {

  // open wallet v4 (notice the correct wallet version here)
  const mnemonic = process.env.mnemonic_DEV;
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

  // print wallet address
  console.log(wallet.address.toString({ testOnly: true }));
  console.log(wallet);

  // print wallet workchain
  console.log("workchain:", wallet.address.workChain);
});

export default router;