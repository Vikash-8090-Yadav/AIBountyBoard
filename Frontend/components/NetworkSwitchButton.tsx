"use client";

import { useWallet } from "../context/wallet-context";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

interface EthereumError extends Error {
  code: number;
}

const networks: Record<string, NetworkConfig> = {
  confluxTestnet: {
    chainId: `0x${Number(71).toString(16)}`,
    chainName: "Conflux eSpace Testnet",
    nativeCurrency: {
      name: "CFX",
      symbol: "CFX",
      decimals: 18,
    },
    rpcUrls: ["https://evmtestnet.confluxrpc.com"],
    blockExplorerUrls: ['https://evmtestnet.confluxscan.io'],
  },
};

export default function NetworkSwitchButton() {
  const { setIsCorrectNetwork } = useWallet();
  const [loading, setLoading] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // Use provider to get chain ID instead of direct request
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          const currentChainId = `0x${network.chainId.toString(16)}`;
          
          console.log("Current chain ID:", currentChainId);
          console.log("Target chain ID:", networks.confluxTestnet.chainId);
          
          if (currentChainId === networks.confluxTestnet.chainId) {
            console.log("On correct network, hiding button");
            setIsCorrectNetwork(true);
            setShowButton(false);
          } else {
            console.log("On wrong network, showing button");
            setIsCorrectNetwork(false);
            setShowButton(true);
          }
        } catch (error) {
          console.error("Error checking network:", error);
          setIsCorrectNetwork(false);
          setShowButton(true);
        }
      }
    };

    checkNetwork();

    // Add event listener for network changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, [setIsCorrectNetwork]);

  const handleSwitchNetwork = async () => {
    setLoading(true);
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("Please install MetaMask to use this feature");
        return;
      }

      // Get current chain ID
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Current chain ID:", currentChainId);
      console.log("Target network config:", networks.confluxTestnet);

      // If already on the correct network, return
      if (currentChainId === networks.confluxTestnet.chainId) {
        console.log("Already on the correct network");
        setIsCorrectNetwork(true);
        setShowButton(false);
        return;
      }

      try {
        // Try to switch to the network
        console.log("Attempting to switch network...");
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networks.confluxTestnet.chainId }],
        });
        console.log("Successfully switched networks");
        setIsCorrectNetwork(true);
        setShowButton(false);
      } catch (switchError: unknown) {
        console.error("Switch error details:", switchError);
        // If the network hasn't been added to MetaMask
        if ((switchError as EthereumError).code === 4902) {
          try {
            console.log("Network not found, attempting to add it...");
            // Add the network
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networks.confluxTestnet],
            });
            console.log("Network added successfully");
            
            // Try switching again after adding
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: networks.confluxTestnet.chainId }],
            });
            console.log("Successfully switched after adding network");
            setIsCorrectNetwork(true);
            setShowButton(false);
          } catch (addError) {
            console.error("Add network error details:", addError);
            throw new Error(`Failed to add Conflux eSpace Testnet to your wallet: ${(addError as Error).message}`);
          }
        } else {
          throw new Error(`Failed to switch to Conflux eSpace Testnet network: ${(switchError as Error).message}`);
        }
      }
    } catch (error) {
      console.error("Network switch error details:", error);
      alert(error instanceof Error ? error.message : "Failed to switch network. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showButton) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg">
        <p className="mb-2">You are on the wrong network!</p>
        <button
          onClick={handleSwitchNetwork}
          disabled={loading}
          className={`bg-white text-red-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Switching...' : 'Switch to Conflux eSpace Testnet'}
        </button>
      </div>
    </div>
  );
}