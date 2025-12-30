import axios from 'axios';
import dotenv from 'dotenv';
import { decrypt } from "../utility/cypher.js";

dotenv.config();

const BASE_URL = process.env.BLOCKCHAIN_BASE_URL;
const BALANCE_KEY = process.env.BALANCE_KEY;
const DEDUCT_BALANCE_KEY = process.env.DEDUCT_BALANCE_KEY;
const ESCROW_KEY = process.env.ESCROW_KEY;
const SYMBOL = process.env.SYMBOL?.replace(/"/g, '');
const THRESHOLD = parseFloat(process.env.BLOCKCHAIN_THREASHOLD || '0.001');
const TRANSFER_AMOUNT = parseFloat(process.env.BLOCKCHAIN_TRANSFER_AMOUNT || '0.002');

/** format tiny decimals as a plain string (no 6e-8) */
const asFixedString = (value, decimals = 8) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toFixed(decimals);
  return String(value);
};

export const getWalletBalance = async (walletAddress, symbol, refresh = true) => {
  try {
    const res = await axios.post(`${BASE_URL}/getBalance`, null, {
      headers: {
        key: BALANCE_KEY,
        walletaddress: walletAddress,
        symbol: symbol,
        refresh
      }
    });

    console.log(`✅ getWalletBalance response for ${walletAddress}:`, res.data);
    
    return res.data.data;
  } catch (err) {
    logAxiosError('getWalletBalance', err);
    throw err;
  }
};

export const callEscrow = async (functionName, papi = '', body = {}, symbol) => {
  try {
    // Ensure FunctionName is present only once
    const payload = { FunctionName: functionName, ...body };

    console.log(`\n📡 Calling blockchain function: ${functionName}`);
    console.log("Headers:", {
      key: ESCROW_KEY,
      papi,
      symbol: symbol || SYMBOL
    });
    console.log("Payload:", payload);

    // Print equivalent curl for debugging
    const curlCmd = `
curl --location '${BASE_URL}/escrowPZP' \\
--header 'key: ${ESCROW_KEY}' \\
--header 'papi: ${papi}' \\
--header 'symbol: ${symbol}' \\
--header 'Content-Type: application/json' \\
--data '${JSON.stringify(payload)}'
    `.trim();
    console.log("\n🔍 Equivalent cURL:\n", curlCmd, "\n");

    const res = await axios.post(
      `${BASE_URL}/escrowPZP`,
      payload,
      {
        headers: {
          key: ESCROW_KEY,
          papi,
          symbol: symbol,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Blockchain call ${functionName} response:`, res.data);
    return res.data;
  } catch (err) {
    logAxiosError(functionName, err);
    throw err;
  }
};

export const cryptoMining = async ({
  walletAddress,
  functionName,
  user_papi = '',
  body = {},
  delayMs = 3000
}) => {
  try {
    // Step 1: Check balance
    let { nativeBalance } = await getWalletBalance(walletAddress, "pzp_core");
    nativeBalance = parseFloat(asFixedString(nativeBalance));

    // Step 2: Transfer if balance is low
    if (nativeBalance <= THRESHOLD) {
      console.log('Balance low, topping up...');
      const transferRes = await callEscrow('TransferNative', process.env.ADMIN_PAPI, {
        Amount: asFixedString(TRANSFER_AMOUNT),
        RecieverAddress: walletAddress
      },
    "pzp_core");

      const transferOk = transferRes?.success === true || Boolean(transferRes?.hash);
      if (!transferOk) {
        console.error('TransferNative failed payload:', transferRes);
        return { success: false, error: 'TransferNative failed', detail: transferRes };
      }

      await new Promise((res) => setTimeout(res, delayMs));
    }

    // Step 3: Call main blockchain function
    return await callEscrow(functionName, user_papi, body,'pzp_core');
  } catch (err) {
    console.error(`Blockchain call failed for ${functionName}:`, err.message);
    return { success: false, error: err.message };
  }
};


export const approveWithdrawal = async ( {payload}) => {
  try {

    const {  Amount,  fromAddress,  user } = payload;
    const delayMs = 3000;
    let { balance, nativeBalance } = await getWalletBalance( fromAddress, 'pzp');
    nativeBalance = parseFloat(asFixedString(nativeBalance));
    if (balance < Amount) {
        return { 
          success: false, 
          error: "Insufficient token balance" 
        };
    }


    // return payload;


    // Step 2: Transfer if balance is low
    if (nativeBalance <= THRESHOLD) {
      console.log('Balance low, topping up...');
      const transferRes = await callEscrow('TransferNative', process.env.PLAYZAP_MAIN_PAPI, {
        Amount: asFixedString(TRANSFER_AMOUNT),
        RecieverAddress: fromAddress
      }, "pzp");

      const transferOk = transferRes?.success === true || Boolean(transferRes?.hash);
      if (!transferOk) {
        console.error('TransferNative failed payload:', transferRes);
        return { success: false, error: 'TransferNative failed', detail: transferRes };
      }

      await new Promise((res) => setTimeout(res, delayMs));
      return { success: true };
    }

    const userPapi =  decrypt(user.Wallets.evmWalletPapi, process.env.EncryptionKey) ;




    const body = {
      RecieverAddress: payload.RecieverAddress,
      Amount:payload.Amount,
      CommissionAmount:payload.CommissionAmount,
      CommissionAddress:process.env.COMMISSION_WALLET
    }

    const response = await fetch(`${BASE_URL}/Withdrawal`, {
      method: 'POST',
      headers: {
        'key': process.env.DEDUCT_BALANCE_KEY,
        'papi': userPapi,
        'symbol': 'pzp',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // --- Print equivalent curl ---
    console.log(`
    curl -X POST ${BASE_URL}/Withdrawal \\
      -H "Content-Type: application/json" \\
      -H "key: ${process.env.DEDUCT_BALANCE_KEY}" \\
      -H "papi: ${userPapi}" \\
      -H "symbol: pzp" \\
      -d '${JSON.stringify(body)}'
    `);

        const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return {
      success: true,
      txHash: result.txhash,
      data: result
    };





  } catch (err) {
    console.error(`Blockchain call failed for native transfer:`, err.message);
    return { success: false, error: err.message };
  }
};


export const callWithdrawalAPI = async (papi, payload, delayMs = 3000) => {
  try {
    console.log("callWithdrawalAPI called with payload:", { papi, payload });
    
    // Step 1: Check balance
    let nativeBalance = payload.nativeBalance || 0;

    console.log("Initial nativeBalance from payload:", nativeBalance);

    let native_transfer_papi='';
    let threshold, transfer_amount;
    if(payload.symbol === "pzp"){
         threshold=THRESHOLD;
         transfer_amount=TRANSFER_AMOUNT;
         native_transfer_papi=process.env.PLAYZAP_MAIN_PAPI;
    }else{
        threshold=parseFloat(process.env.CORE_THREASHOLD );
         transfer_amount=parseFloat(process.env.CORE_TRANSFER_AMOUNT );
         native_transfer_papi=process.env.ADMIN_PAPI;
    }
    
    // Step 2: Transfer if balance is low
    if (nativeBalance <= threshold) {
      console.log('Balance low, topping up...');
      const transferRes = await callEscrow('TransferNative', native_transfer_papi, {
        Amount: asFixedString(transfer_amount),
        RecieverAddress: payload.walletAddress
      },payload.symbol
    );

      const transferOk = transferRes?.success === true || Boolean(transferRes?.hash);
      if (!transferOk) {
        console.error('TransferNative failed payload:', transferRes);
        return { success: false, error: 'TransferNative failed', detail: transferRes };
      }

      await new Promise((res) => setTimeout(res, delayMs));
    }

    // Prepare the API body with only required fields
    const apiBody = {
      RecieverAddress: payload.RecieverAddress,
      Amount: payload.Amount,
      CommissionAmount: payload.CommissionAmount,
      CommissionAddress: payload.CommissionAddress
    };

    // Prepare the request data
    const url = `${BASE_URL}/Withdrawal`;
    const headers = {
      'key': DEDUCT_BALANCE_KEY,
      'papi': papi,
      'symbol': payload.symbol,
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify(apiBody);

    // Print curl command
    const curlCommand = `curl -X POST ${url} \\\n` +
      Object.entries(headers).map(([key, value]) => `  -H "${key}: ${value}"`).join(' \\\n') +
      ` \\\n  -d '${body}'`;
    
    console.log("CURL command:");
    console.log(curlCommand);
    console.log(""); // Empty line for readability

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // If not JSON, read as text and return error
      const text = await response.text();
      console.log("Withdrawal API returned non-JSON response:", text);
      return {
        success: false,
        error: `Blockchain returned invalid response: ${text.substring(0, 100)}`,
        status: response.status
      };
    }

    console.log("Withdrawal API response:", result);
    

    if (!response.ok) {
      return {
        success: false,
        error: result.message || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return {
      success: true,
      txHash: result.txhash,
      data: result
    };
  } catch (err) {
    console.error(`Blockchain call failed for withdraw:`, err.message);
    console.error(`Stack:`, err.stack);
    return { success: false, error: err.message, status: 500 };
  }
};

export const callAssignSwappedToken = async (payload, delayMs = 3000) => {
  try {

     // Step 1: Check balance
    let { nativeBalance } = await getWalletBalance( payload.RecieverAddress, payload.symbol);
    nativeBalance = parseFloat(asFixedString(nativeBalance));

    let rewardAssignPapi='';
    let threshold, transfer_amount;
    if(payload.symbol === "pzp"){
       rewardAssignPapi=process.env.PLAYZAP_MAIN_PAPI;
         threshold=THRESHOLD;
         transfer_amount=TRANSFER_AMOUNT;
    }else if(payload.symbol === "pzp_core"){
      rewardAssignPapi=process.env.ADMIN_PAPI;
        threshold=parseFloat(process.env.CORE_THREASHOLD );
         transfer_amount=parseFloat(process.env.CORE_TRANSFER_AMOUNT );
    }


    // Step 2: Transfer if balance is low
    if (nativeBalance <= threshold) {
      console.log('Balance low, topping up...');
      const transferRes = await callEscrow('TransferNative', rewardAssignPapi, {
        Amount: asFixedString(transfer_amount),
        RecieverAddress: payload.RecieverAddress
      },payload.symbol);

      const transferOk = transferRes?.success === true || Boolean(transferRes?.hash);
      if (!transferOk) {
        console.error('TransferNative failed payload:', transferRes);
        return { success: false, error: 'TransferNative failed', detail: transferRes };
      }

      await new Promise((res) => setTimeout(res, delayMs));
    }

   



    const response = await fetch(`${BASE_URL}/escrowPZP`, {
      method: 'POST',
      headers: {
        'key': process.env.ESCROW_KEY,
        'papi': rewardAssignPapi,
        'symbol': payload.symbol,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // If not JSON, read as text and return error
      const text = await response.text();
      console.log("Escrow API returned non-JSON response:", text);
      return {
        success: false,
        error: `Blockchain returned invalid response: ${text.substring(0, 100)}`,
        status: response.status
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: result.message || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return {
      success: true,
      txHash: result.hash,
      data: result
    };
  } catch (err) {
    console.error(`Blockchain call failed for withdraw:`, err.message);
    return { success: false, error: err.message, status: 500 };
  }
};



// Helper to log detailed Axios errors
function logAxiosError(context, err) {
  if (err.response) {
    console.error(`❌ [${context}] Blockchain API Error:`, {
      status: err.response.status,
      headers: err.response.headers,
      data: err.response.data
    });
  } else if (err.request) {
    console.error(`❌ [${context}] No response from Blockchain API:`, err.request);
  } else {
    console.error(`❌ [${context}] Request setup error:`, err.message);
  }
}
