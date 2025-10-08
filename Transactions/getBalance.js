
import express from 'express';
import prisma from '../prisma/db.js';
const router = express.Router();
import dotenv from 'dotenv';
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { makeResponse } from "../helpers/index.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { getUserWallet } from "../utility/walletService.js";
import { getBalance } from '../utility/walletService.js';
import { getWalletBalance } from '../utility/blockChainServices.js';

dotenv.config();

const asFixedString = (value, decimals = 8) => {
  if (value == null) return "0";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(decimals);
};


router.get('/get-crypto-balance', UserMiddleware, handleRequest(async function (req, res) {
  const { walletAddress, user_papi } = await getUserWallet(req.user.id);
  if (!walletAddress || !user_papi) {
    return makeResponse(res, 400, false, "Wallet address or balance key not found for user", {});
  }
  const pzp_core = await getWalletBalance(walletAddress, "pzp_core")
  const pzp = await getWalletBalance(walletAddress, "pzp")
  return makeResponse(res, 200, true, "Balance fetched successfully", {pzp_core, pzp});
}));

router.get('/wallet-withdraw-instruction', UserMiddleware, handleRequest(async function (req, res) {
  let info = await prisma.master.findFirst({
    where: {
      key: "walletWithdraw",
    },
  });


  return makeResponse(res, 200, true, "Record found", info?.data1 || {}  );
}));


// router.get('/swap', UserMiddleware, handleRequest(async function (req, res) {
//     let minSwap = await prisma.master.findUnique({
//     where: {
//       key: "ticketMinSwap",
//     },
//   });

//   const minSwapValue = minSwap?.data2 || 0;

//   if(minSwapValue <= 0) {

//     return makeResponse(res, 400, false, "Minimum swap value not configured", { minSwap: 0 });
//   }

//   const userBalane = await getBalance(req.user.id);

//   const availableForSwap = userBalane.virtual1;
//   if(availableForSwap < minSwapValue) {

//     return makeResponse(res, 400, false, "Insufficient balance for swap", { minSwap: minSwapValue,  availableForSwap});
//   }

//   console.log("userBalane", availableForSwap);

  
//   return makeResponse(res, 200, true, "Balance fetched successfully", {minSwap} );
// }));

export default router;