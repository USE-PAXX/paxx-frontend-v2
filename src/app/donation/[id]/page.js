"use client";

import { useState, useEffect } from "react";
import { PaymentLayout } from "@/components/Payment/payment-layout";
import { usePathname, useRouter } from "next/navigation";
import { getLinkForPage } from "@/services/links";
import { getUUIDFromPath } from "@/utils/lib";
import { getRPC } from "@/services/rpc";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import Loading from "@/components/Loading";
import { useTokenBalance } from "@/hooks/web3/useTokenBalance";
import { toast } from "react-toastify";
// import TestModeModal from "@/components/Modal/TestMode";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} from "@solana/spl-token";
import WalletConnectModal from "@/components/Modal/WalletConnectModal";
import MaintenanceMode from "@/components/Modal/MaintenanceMode";

const helios_key = process.env.NEXT_PUBLIC_HELIOS_API_KEY;
const REVENUE_WALLET = process.env.NEXT_PUBLIC_REVENUE_WALLET_MULTISIG;

// Centralize configuration
const CONFIG_TOKEN = {
  MAINNET_USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  TESTNET_USDC: {
    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    mint: "GrNg1XM2ctzeE2mXxXCfhcTUbejM8Z4z4wNVTy2FjMEz",
    token_address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
};

export default function DonationPaymentPage() {
  const [pageData, setPageData] = useState();
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const param = usePathname();
  const { push } = useRouter();
  const rpc = getRPC(pageData?.userMode, helios_key);
  const {
    connect,
    connected,
    connecting,
    publicKey,
    disconnect,
    signTransaction,
    sendTransaction,
  } = useWallet();
  const { connection } = useConnection();
  const [testMode, setTestMode] = useState(
    pageData?.userMode === "live" ? false : true
  );
  const [showWalletSelectModal, setshowWalletSelectModal] = useState(
    !connected
  );

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const {
    balance: usdcBalance,
    error: usdcError,
    loading: usdcBalanceLoading,
  } = useTokenBalance({
    network: pageData?.userMode === "live" ? "mainnet" : "devnet",
    walletAddress: publicKey?.toString(),
  });

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
    }
  };

  async function loadPage() {
    try {
      const data = await getLinkForPage(getUUIDFromPath(param));
      setPageData(data);
      document.title = data ? data.pageName : "Paxx Payment Processing";
    } catch (error) {
      console.error("Error loading page data:", error);
    }
  }

  useEffect(() => {
    loadPage();
  }, [getUUIDFromPath(param)]);

  const handlePayment = async () => {
    setMaintenanceMode(true);
    // const paymentConnection = new Connection(rpc);
    // if (pageData.currency === "usdc") {
    //   if (!publicKey) {
    //     toast.error("Please connect your wallet.");
    //     return;
    //   }

    //   // Determine the amount to transfer
    //   const amountToTransfer =
    //     customAmount && !isNaN(customAmount) && Number(customAmount) > 0
    //       ? Math.round(Number(customAmount) * 10 ** 6) // Use custom amount if valid
    //       : Math.round(Number(pageData?.amount) * 10 ** 6); // Otherwise, use pageData amount

    //   if (amountToTransfer <= 0) {
    //     toast.error("Please enter a valid amount.");
    //     return;
    //   }

    //   try {
    //     const usdcMint = new PublicKey(
    //       pageData?.userMode === "live"
    //         ? CONFIG_TOKEN.MAINNET_USDC.token_address
    //         : CONFIG_TOKEN.TESTNET_USDC.token_address
    //     );

    //     const revenueWallet = new PublicKey(REVENUE_WALLET);
    //     const merchantWallet = new PublicKey(pageData?.merchantWalletAddress);

    //     // Check if merchant wallet is defined
    //     if (!merchantWallet) {
    //       toast.error("Merchant wallet is not defined.");
    //       return;
    //     }

    //     console.log("Token Account Values", {
    //       paymentConnection,
    //       publicKey,
    //       usdcMint,
    //       publicKey,
    //     });

    //     // Get or create token accounts
    //     const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    //       paymentConnection,
    //       publicKey,
    //       usdcMint,
    //       publicKey // User's wallet address,
    //     );

    //     const revenueTokenAccount = await getOrCreateAssociatedTokenAccount(
    //       paymentConnection,
    //       publicKey,
    //       usdcMint,
    //       revenueWallet
    //     );

    //     const merchantTokenAccount = await getOrCreateAssociatedTokenAccount(
    //       paymentConnection,
    //       publicKey,
    //       usdcMint,
    //       merchantWallet
    //     );

    //     // Log token account addresses for debugging
    //     console.log("User Token Account:", userTokenAccount.address.toString());
    //     console.log(
    //       "Revenue Token Account:",
    //       revenueTokenAccount.address.toString()
    //     );
    //     console.log(
    //       "Merchant Token Account:",
    //       merchantTokenAccount.address.toString()
    //     );

    //     // Calculate amounts
    //     const revenueAmount = Math.floor(amountToTransfer * 0.025);
    //     const merchantAmount = amountToTransfer - revenueAmount;

    //     // Create transfer instructions
    //     const transferToRevenue = createTransferInstruction(
    //       userTokenAccount.address, // User's token account (source)
    //       revenueTokenAccount.address, // Revenue token account (destination)
    //       publicKey,
    //       revenueAmount,
    //       [],
    //       usdcMint
    //     );

    //     const transferToMerchant = createTransferInstruction(
    //       userTokenAccount.address, // User's token account (source)
    //       merchantTokenAccount.address, // Merchant token account (destination)
    //       publicKey,
    //       merchantAmount,
    //       [],
    //       usdcMint
    //     );

    //     // Create the transaction
    //     const transaction = new Transaction().add(
    //       transferToRevenue,
    //       transferToMerchant
    //     );

    //     // Fetch the recent blockhash and set fee payer
    //     transaction.recentBlockhash = (
    //       await connection.getLatestBlockhash()
    //     ).blockhash;
    //     transaction.feePayer = publicKey;

    //     // Sign and send the transaction
    //     const signedTransaction = await signTransaction(transaction);
    //     const signature = await connection.sendRawTransaction(
    //       signedTransaction.serialize()
    //     );

    //     // Confirm the transaction
    //     const confirmation = await connection.getSignatureStatuses([signature]);
    //     if (confirmation.value[0]?.confirmationStatus === "finalized") {
    //       toast.success("Payment successful!");
    //     } else {
    //       toast.error("Payment not confirmed. Please try again.");
    //     }
    //   } catch (error) {
    //     console.error("Payment error:", error);
    //     toast.error(
    //       "Payment processing for USDC Failed. Please try again Later."
    //     );
    //   }
    // }

    // if (pageData.currency === "solana") {
    //   const revenueWallet = new PublicKey(REVENUE_WALLET);
    //   const merchantWallet = new PublicKey(pageData?.merchantWalletAddress);

    //   if (!publicKey) {
    //     toast.error("Please connect your wallet.");
    //     return;
    //   }

    //   // Determine the amount to transfer in lamports
    //   const amountToTransfer =
    //     customAmount && !isNaN(customAmount) && Number(customAmount) > 0
    //       ? Math.round(Number(customAmount) * 10 ** 9) // Use custom amount if valid, converted to lamports
    //       : Math.round(Number(pageData?.amount) * 10 ** 9); // Otherwise, use pageData amount, converted to lamports

    //   if (amountToTransfer <= 0) {
    //     toast.error("Please enter a valid amount.");
    //     return;
    //   }

    //   try {
    //     const revenueAmount = Math.floor(amountToTransfer * 0.025); // 2.5% for revenue
    //     const merchantAmount = amountToTransfer - revenueAmount;

    //     // Ensure there's enough balance to cover the transfer and gas fees
    //     const balance = await connection.getBalance(publicKey);

    //     const transactionMessage = new TransactionMessage({
    //       payerKey: publicKey,
    //       recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    //       instructions: [
    //         SystemProgram.transfer({
    //           fromPubkey: publicKey,
    //           toPubkey: revenueWallet,
    //           lamports: revenueAmount,
    //         }),
    //         SystemProgram.transfer({
    //           fromPubkey: publicKey,
    //           toPubkey: merchantWallet,
    //           lamports: merchantAmount,
    //         }),
    //       ],
    //     });

    //     const estimatedGasFee = await connection.getFeeForMessage(
    //       transactionMessage.compileToV0Message()
    //     );

    //     console.log("Estimated gas fee:", estimatedGasFee);

    //     if (balance < amountToTransfer + estimatedGasFee) {
    //       toast.error("Insufficient balance to cover transfer and gas fees.");
    //       return;
    //     }

    //     // Create transfer instructions
    //     const transferToRevenue = SystemProgram.transfer({
    //       fromPubkey: publicKey,
    //       toPubkey: revenueWallet,
    //       lamports: revenueAmount,
    //     });

    //     const transferToMerchant = SystemProgram.transfer({
    //       fromPubkey: publicKey,
    //       toPubkey: merchantWallet,
    //       lamports: merchantAmount,
    //     });

    //     // Create the transaction
    //     const transaction = new Transaction().add(
    //       transferToRevenue,
    //       transferToMerchant
    //     );

    //     // Fetch the recent blockhash and set fee payer
    //     transaction.recentBlockhash = (
    //       await connection.getLatestBlockhash()
    //     ).blockhash;
    //     transaction.feePayer = publicKey;

    //     // Sign and send the transaction
    //     const signedTransaction = await signTransaction(transaction);
    //     const signature = await connection.sendRawTransaction(
    //       signedTransaction.serialize()
    //     );

    //     // Confirm the transaction
    //     const confirmation = await connection.getSignatureStatuses([signature]);
    //     if (confirmation.value[0]?.confirmationStatus === "finalized") {
    //       toast.success("Payment successful!");
    //     } else {
    //       toast.error("Payment not confirmed. Please try again.");
    //     }
    //   } catch (error) {
    //     console.error("Payment error:", error);
    //     toast.error(
    //       "Payment processing for SOL Failed. Please try again Later."
    //     );
    //   }
    // }
  };

  const handleConnect = () => {
    setshowWalletSelectModal(false);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <>
      <WalletConnectModal
        isOpen={showWalletSelectModal}
        onClose={() => setshowWalletSelectModal(false)}
        handleWalletConnect={handleConnect}
      />
      <MaintenanceMode
        isOpen={maintenanceMode}
        onClose={() => setMaintenanceMode(false)}
      />
      <PaymentLayout
        title={pageData?.pageName}
        amount={isCustom ? customAmount || "0.00" : pageData?.amount}
        currency={pageData?.currency?.toUpperCase()}
        paymentType="Donation"
        img={pageData?.image}
        walletAddress={publicKey?.toString()}
        tokenBalance={usdcBalance}
        currentWalletBalance={0}
        description={pageData?.description}
      >
        <form className="space-y-6">
          {showCustomAmount && (
            <div className="relative">
              <input
                type="text"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                onFocus={() => setIsCustom(true)}
                className="w-full pl-6 text-black py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                $
              </span>
            </div>
          )}
          <div>
            <button
              className="w-full py-3 text-purple-600 border-purple-600 border hover:text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200"
              type="button"
              onClick={() => setShowCustomAmount(!showCustomAmount)}
            >
              Enter Custom Amount
            </button>
          </div>
          {/* <WalletMultiButton style={{}} /> */}
          <div className="flex flex-col space-y-4">
            {connected ? (
              <>
                <button
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200"
                  type="button"
                  onClick={handlePayment}
                >
                  Pay
                </button>
                <button
                  className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition duration-200"
                  type="button"
                  onClick={handleDisconnect}
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200 flex justify-center"
                type="button"
                onClick={() => setshowWalletSelectModal(true)}
              >
                {connecting ? <Loading /> : "Connect"}
              </button>
            )}
          </div>
        </form>
      </PaymentLayout>
    </>
  );
}
