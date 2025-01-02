import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ReceiveModal({ isOpen, onClose }) {
  const walletAddress = "5g6N...MxUF"; // Replace with actual wallet address

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-[#131B2C] rounded-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Receive Crypto</h2>
        <div className="space-y-4">
          <p className="text-gray-300">Your wallet address:</p>
          <div className="bg-[#1F2A3C] border border-gray-600 rounded-lg p-4">
            <p className="text-white font-mono break-all">{walletAddress}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(walletAddress)}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Copy Address
          </button>
        </div>
      </div>
    </div>
  );
}
