import prisma from "../prisma/db.js";
import *  as dbQuery from "../database/dbQuery.js";
import { AdminMiddleware } from "../utility/tokenAuthService.js";
import *  as bank from "../utility/walletService.js";
import { numberToSlug, slugToNumber, slugType } from "../utility/cypher.js";
import express from "express";
const router = express.Router();
import { deductEvmBalance, transferPzpReward, transferEvmNativeBalance } from "../controllers/shop.js";
import { makeResponse, responseMessages, statusCodes } from "../helpers/index.js";
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
import { approveWithdrawal } from "../utility/blockChainServices.js";
import { getWalletBalance } from "../utility/blockChainServices.js";
import { decrypt } from "../utility/cypher.js";

import dotenv from 'dotenv';

dotenv.config();

router.get("/admin/whitelisteIds", async function (req, res) {
  let data = await prisma.master.findUnique({
    where: {
      key: "admins",
    },
  });
  return res.status(200).json({ status: 1, ids: data.data1.ids });
});
router.get("/admin/requests/withdraw", AdminMiddleware, async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.perPage) || 10;
  const skip = (page - 1) * limit;

  // Extract query parameters for filtering
  const {
    startDate,
    endDate,
    status = "pending", // Default to pending as per original
    id,
    userId,
  } = req.query;

  // Build filters dynamically
  const filters = {
    transaction_type: bank.transactiontype.withdrawPzp,
  };

  // Add status filter (defaults to "pending" but can be overridden)
  if (status) {
    filters.status = String(status);
  }

   if (id) {
    let numericId = Number(id);
    if (isNaN(numericId)) {
      // Try decoding as slug
      const decodedId = slugToNumber(id, slugType.withdraw);
      if (decodedId) numericId = decodedId;
    }
    if (!isNaN(numericId)) {
      filters.id = numericId;
    }
  }
  if (userId) {
    filters.user_id = Number(userId);
  }

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) {
      filters.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.createdAt.lte = new Date(end);
    }
  }

  try {
    const data = await prisma.userWalletHistory.findMany({
      where: filters,
      include: {
        User: {
          select: {
            username: true,
            Wallets: {
              select: {
                pzpEvmWallet: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    // Get total count for pagination
    const totalCount = await prisma.userWalletHistory.count({
      where: filters,
    });

    return res.status(200).json({
      status: 1,
      data: data,
      pagination: {
        page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
});

router.get("/admin/requests/withdrawPzp", AdminMiddleware, async function (req, res) {
  console.log("--------skdlaksdkl");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.perPage) || 10;

  // Calculate the offset
  const skip = (page - 1) * limit;

  let data = await prisma.userWalletHistory.findMany({
    where: {
      status: "pending",
      transaction_type: bank.transactiontype.withdrawPzp,
    },
    include: {
      User: {
        select: {
          username: true,
          Wallets: {
            select: {
              pzpEvmWallet: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: skip,
  });
  return res.status(200).json({ status: 1, data: data });
});
router.get("/admin/requests/swapV2_core", AdminMiddleware, async function (req, res) {
  let data = await prisma.userWalletHistory.findMany({
    where: {
      status: "pending",
      transaction_type: bank.transactiontype.virtual2_core_conversion,
    },
  });
  console.log(data);

  return res.status(200).json({ status: 1, data: data });
});

// approve withdraw
router.post("/admin/withdrawal/approve", AdminMiddleware, async function (req, res) {
  const { txnId } = req.body;
  let type = bank.transactiontype.withdrawPzp;
  let data = await prisma.userWalletHistory.findFirst({
    where: {
      id: txnId,
      status: "pending",
      transaction_type: type,
    },
    include: {
      User: {
        include: {
          Wallets: {
            select: {
              pzpEvmWallet: true,
              evmWalletPapi: true,
            },
          },
        },
      },
    },
  });


  if (data.length == 0) {
    return res.status(404).json({ status: 0, message: "no pending transactions" });
  }


  let Amount = data.to_amount;
  let CommissionAmount = +(data.from_amount - data.to_amount).toFixed(4);
  let fromAddress = data.User.Wallets.pzpEvmWallet;
  let user = data.User;
  let RecieverAddress = data.to_address;

  const payload = {
    Amount,
    CommissionAmount,
    fromAddress,
    user,
    RecieverAddress,
  }


  if (Amount <= 0) {
    return res.status(500).json({ status: 0, message: "amount can not be negative or zero" });
  }

  const withdrawalResult = await approveWithdrawal({payload})
  console.log("withdrawalResult", withdrawalResult);


  if (!withdrawalResult.success) {
    return res.status(500).json({ status: 0, message: withdrawalResult.error || "Native balance top-up failed" });
  }

  try {
    await prisma.userWalletHistory.update({
      where: {
        id: txnId,
      },
      data: {
        status: "success",
        transaction_hash: withdrawalResult.txHash,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }

 return res.status(200).json({ status: 1, message: "withdraw request processed sucessfully", data: withdrawalResult.txHash });
});

router.post("/admin/withdrawal/reject", AdminMiddleware, async function (req, res) {
  const { txnId } = req.body;
  try {
    await prisma.userWalletHistory.update({
      where: {
        id: txnId,
      },
      data: {
        status: "rejected",
        transaction_hash: "rejected by admin",
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }

 return res.status(200).json({ status: 1, message: "withdraw request rejected sucessfully" });
});

router.post("/admin/swap/approve", AdminMiddleware, async function (req, res) {
  const { txnId } = req.body;
  console.log("txnId", txnId);
  let symbol = "pzp_core";

  try {
    // Fetch the swap transaction - can be pending or failed
    let data = await prisma.userWalletHistory.findFirst({
      where: {
        id: txnId,
        status: {
          in: ["pending", "failed"] // Accept both pending and failed
        },
        transaction_type: bank.transactiontype.coreToBsc,
      },
      include: {
        User: { 
          include: { 
            Wallets: { 
              select: { 
                pzpEvmWallet: true,
                evmWalletPapi: true 
              } 
            } 
          } 
        },
      },
    });

    if (data == null) {
      return res.status(404).json({ status: 0, message: "No pending or failed coreToBsc swap transaction found" });
    }

    const transactionStatus = data.status;
    const actionType = transactionStatus === "failed" ? "Retrying" : "Processing";
    console.log(`${actionType} coreToBsc swap for txnId: ${txnId}, current status: ${transactionStatus}`);

    let toAmount = data.to_amount;
    let commissionAmount = data.from_amount - data.to_amount;
    let walletAddress = data.User.Wallets.pzpEvmWallet;
    let userPapi = decrypt(data.User.Wallets.evmWalletPapi, process.env.EncryptionKey);
    let recipientAddress = data.to_address;
    let id = data.id;

    if (toAmount <= 0) {
      return res.status(400).json({ status: 0, message: "Amount cannot be negative or zero" });
    }

    // Check balance before processing
    let cryptoBallance = await getWalletBalance(walletAddress, symbol);
    const availableBalance = cryptoBallance?.balance || 0;
    const nativeBalance = cryptoBallance?.nativeBalance || 0;

    if (availableBalance < data.from_amount) {
      return res.status(400).json({ status: 0, message: "Insufficient balance" });
    }

    // Import the blockchain service functions
    const { callWithdrawalAPI, callAssignSwappedToken } = await import("../utility/blockChainServices.js");

    try {
      // Step 1: Call Withdrawal API
      const withdrawalPayload = {
        RecieverAddress: recipientAddress,
        Amount: toAmount,
        CommissionAmount: commissionAmount,
        CommissionAddress: process.env.COMMISSION_WALLET,
        walletAddress: walletAddress,
        nativeBalance: nativeBalance,
        symbol: "pzp_core",
      };

      console.log(`${actionType} - Calling Withdrawal API with payload:`, withdrawalPayload);

      const withdrawalResult = await callWithdrawalAPI(userPapi, withdrawalPayload);

      if (!withdrawalResult.success) {
        await prisma.userWalletHistory.update({
          where: { id: txnId },
          data: {
            status: "failed",
            transaction_hash: JSON.stringify({ 
              error: `Withdrawal API failed: ${withdrawalResult.error}`,
              attemptAt: new Date().toISOString()
            })
          },
        });
        return res.status(500).json({ status: 0, message: `Withdrawal failed: ${withdrawalResult.error}` });
      }

      console.log(`${actionType} - Withdrawal API success:`, withdrawalResult);

      // Step 2: Call Escrow/Assign Swapped Token API
      const escrowPayload = {
        FunctionName: "RewardTransfer",
        Amount: toAmount,
        RecieverAddress: walletAddress,
        symbol: "pzp"
      };

      console.log(`${actionType} - Calling Escrow API with payload:`, escrowPayload);

      const escrowResult = await callAssignSwappedToken(escrowPayload);

      if (!escrowResult.success) {
        await prisma.userWalletHistory.update({
          where: { id: txnId },
          data: {
            status: "failed",
            transaction_hash: JSON.stringify({ 
              error: `Escrow API failed: ${escrowResult.error}`,
              attemptAt: new Date().toISOString()
            })
          },
        });
        return res.status(500).json({ status: 0, message: `Escrow failed: ${escrowResult.error}` });
      }

      console.log(`${actionType} - Escrow API success:`, escrowResult);

      // Step 3: Update transaction as success
      await prisma.userWalletHistory.update({
        where: { id: txnId },
        data: {
          status: "success",
          transaction_hash: JSON.stringify({
            withdrawalTx: withdrawalResult.txHash,
            escrowTx: escrowResult.txHash,
            commission: commissionAmount,
            processedAt: new Date().toISOString()
          }),
        },
      });

      let slug = numberToSlug(id, slugType.swap);
      return res.status(200).json({ 
        status: 1, 
        message: `Swap ${transactionStatus === "failed" ? "retry" : "approval"} processed successfully`,
        data: {
          transactionId: txnId,
          slug: slug,
          withdrawalTx: withdrawalResult.txHash,
          escrowTx: escrowResult.txHash,
          amount: toAmount,
          commission: commissionAmount,
          previousStatus: transactionStatus
        }
      });

    } catch (apiError) {
      console.error(`Error during swap ${actionType}:`, apiError);
      await prisma.userWalletHistory.update({
        where: { id: txnId },
        data: {
          status: "failed",
          transaction_hash: JSON.stringify({ 
            error: apiError.message,
            attemptAt: new Date().toISOString()
          })
        },
      });
      return res.status(500).json({ status: 0, message: `Error processing swap: ${apiError.message}` });
    }

  } catch (error) {
    console.error("Error in /admin/swap/approve:", error);
    return res.status(500).json({ status: 0, message: "Internal server error", error: error.message });
  }
});

router.post("/admin/swap/reject", AdminMiddleware, async function (req, res) {
  const { txnId } = req.body;
  try {
    await prisma.userWalletHistory.update({
      where: {
        id: txnId,
      },
      data: {
        status: "rejected",
        transaction_hash: "rejected by admin",
      },
    });
    return res.status(200).json({ status: 1, message: "swap request rejected successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 0, message: "Error rejecting swap request", error: err });
  }
});

router.get("/admin/leaderboard-rewards", AdminMiddleware, async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const {
    startDate,
    endDate,
    status,
    transactionId,
    userId,
  } = req.query;

  // Build filters dynamically
  const filters = {
    transaction_type: bank.transactiontype.weeklyReward,
  };

  if (status) {
    filters.status = String(status);
  }

  if (transactionId) {
    filters.id = Number(transactionId);
  }

  if (userId) {
    filters.user_id = Number(userId);
  }

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) {
      filters.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.createdAt.lte = new Date(end);
    }
  }

  const data = await prisma.userWalletHistory.findMany({
    where: filters,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      User: { select: { username: true } },
    },
    take: limit,
    skip: skip,
  });

  // Optional: total count for pagination
  const totalCount = await prisma.userWalletHistory.count({
    where: filters,
  });

  return res.status(200).json({
    status: 1,
    data,
    pagination: {
      page,
      limit: limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});
router.get("/admin/swap-list", AdminMiddleware, async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.perPage) || 10;
    const txType = req.query.txType; // Can be empty, "coreToBsc", or "bscToCore"

    // Calculate the offset
    const skip = (page - 1) * limit;

    // Build transaction types array based on txType parameter
    let transactionTypes = [];

    if (txType === 'coreToBsc') {
      transactionTypes = ['coreToBsc'];
    } else if (txType === 'bscToCore') {
      transactionTypes = ['bscToCore'];
    } else {
      // If empty or any other value, include both types
      transactionTypes = ['coreToBsc', 'bscToCore'];
    }

    let data = await prisma.userWalletHistory.findMany({
      where: {
        transaction_type: {
          in: transactionTypes
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        User: { select: { username: true } },
      },
      take: limit,
      skip: skip,
    });

    // Get total count for pagination
    const totalCount = await prisma.userWalletHistory.count({
      where: {
        transaction_type: {
          in: transactionTypes
        }
      },
    });

    return res.status(200).json({
      status: 1,
      data: data,
      pagination: {
        currentPage: page,
        perPage: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error in swap-list:", error);
    return res.status(500).json({ status: 0, message: "Internal server error" });
  }
});


router.get("/admin/getSwapRequests", AdminMiddleware, async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.perPage) || 10;

  // Calculate the offset
  const skip = (page - 1) * limit;

  let data = await prisma.userWalletHistory.findMany({
    where: {
      transaction_type: bank.transactiontype.virtual2_core_conversion,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      User: { select: { username: true } },
    },
    take: limit,
    skip: skip,
  });
  return res.status(200).json({ status: 1, data: data });
});

router.patch("/api/admin/decline/rewardSwap", AdminMiddleware, async function (req, res) {
  const { txnId } = req.body;

  try {
    await prisma.userWalletHistory.update({
      where: {
        id: txnId,
      },
      data: {
        status: "declined",
      },
    });
    return res.status(200).json({ status: 1, message: "request declined" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

router.post("/admin/rewardTransfer", AdminMiddleware, async function (req, res) {
  const { tgId, currency, amount } = req.body;
  await dbQuery
    .updateBalance(tgId, amount, currency)
    .then((result) => {
      return res.status(200).json({ status: 1, data: result });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).send("An error occurred while updating the daily rewards. " + error);
    });
});

router.post("/admin/updateNtransferPzp", async function (req, res) {
  const { addresses, amounts } = req.body;

  const myHeaders = new Headers();
  myHeaders.append("Authorization", process.env.Authorization);
  myHeaders.append("WEB", "4");
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    user: {
      wallet_ary: addresses,
      amount_ary: amounts,
    },
  });

  const requestOptions = {
    method: "PATCH",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(`${process.env.BASE_URL}/api/users/tg_rewards`, requestOptions)
    .then((response) => response.text())
    .then(() => {
      const myHeaders = new Headers();
      myHeaders.append("key", process.env.Blockpuri_Key);
      myHeaders.append("papi", process.env.Blockpuri_Papi);
      myHeaders.append("symbol", "pzp_core");
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        FunctionName: "ContestReward",
        AmountWinArray: amounts,
        RecieverArrayAddress: addresses,
        CommissionAmount: 0,
        CommissionAddress: "0xD38bc065113F482D0F07108511b98a198a2B52E9",
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(`${process.env.Blockpuri_BaseUrl}/api/escrowPZP`, requestOptions)
        .then((response) => response.text())
        .then((result) => {
          return res.status(200).json({ status: 1, data: result });
        })
        .catch((error) => console.error(error));
    })
    .catch((error) => console.error(error));
});



export default router;
