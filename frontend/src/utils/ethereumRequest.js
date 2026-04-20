/**
 * ethereumRequest
 * Serialize MetaMask requests to avoid "wallet_requestPermissions already pending" (-32002)
 * when multiple components call window.ethereum.request() at the same time.
 */

let queue = Promise.resolve();

export function ethereumRequest({ method, params }) {
  if (!window.ethereum) {
    throw new Error('MetaMask chưa được cài đặt. Vui lòng cài MetaMask extension.');
  }

  const run = () => window.ethereum.request({ method, params });

  const result = queue.then(run, run);

  // Keep the queue moving even if a request fails
  queue = result.catch(() => undefined);

  return result;
}

export function formatMetaMaskError(err) {
  const code = err?.code ?? err?.data?.originalError?.code;

  const message = (
    err?.shortMessage ||
    err?.reason ||
    err?.data?.message ||
    err?.message ||
    ''
  );

  if (code === 4001) {
    return 'Bạn đã từ chối yêu cầu trên MetaMask.';
  }

  // MetaMask: request already pending for origin
  if (code === -32002) {
    return 'MetaMask đang có một yêu cầu kết nối đang chờ. Vui lòng mở MetaMask để Approve/Cancel, rồi quay lại bấm thử lại.';
  }

  // Chain not added / unknown chain
  if (code === 4902) {
    return 'Network chưa có trong MetaMask. Hãy bấm Thử lại và Approve khi MetaMask yêu cầu Add Network.';
  }

  // Common provider/RPC failures
  if (String(message).toLowerCase().includes('could not fetch chain id')) {
    return 'Không thể kết nối RPC (MetaMask: Could not fetch chain ID). Hãy kiểm tra RPC URL hoặc bật Hardhat node.';
  }

  if (String(message).toLowerCase().includes('insufficient funds')) {
    return 'Không đủ ETH để trả phí gas/giá trị giao dịch. Hãy nạp ETH hoặc chọn tài khoản có đủ số dư.';
  }

  if (code === -32601) {
    return 'MetaMask/RPC không hỗ trợ method được gọi (method not found). Hãy kiểm tra lại network/RPC.';
  }

  if (code === -32603) {
    return 'RPC gặp lỗi nội bộ (-32603). Thử reload, kiểm tra RPC URL, hoặc khởi động lại Hardhat node.';
  }

  return message || 'Lỗi MetaMask';
}
