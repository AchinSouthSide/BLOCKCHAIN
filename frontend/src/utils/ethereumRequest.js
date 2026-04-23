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
  if (String(message).toLowerCase().includes('could not coalesce')) {
    const hardhatRpc = process.env.REACT_APP_HARDHAT_RPC || 'http://127.0.0.1:8545';
    return (
      'Không thể kết nối RPC (ethers: could not coalesce). ' +
      'Thường do MetaMask đang trỏ RPC Hardhat sai (ví dụ vẫn là 127.0.0.1 trên máy bạn). ' +
      'Cách xử lý nhanh: MetaMask → Settings → Networks → Hardhat Local → cập nhật RPC URL đúng, hoặc xoá network rồi thêm lại. ' +
      `RPC URL cần dùng: ${hardhatRpc}`
    );
  }

  if (String(message).toLowerCase().includes('could not fetch chain id')) {
    return 'Không thể kết nối RPC (MetaMask: Could not fetch chain ID). Hãy kiểm tra RPC URL hoặc bật Hardhat node.';
  }

  if (String(message).toLowerCase().includes('insufficient funds')) {
    return (
      'Không đủ ETH để trả phí gas/giá trị giao dịch. ' +
      'Nếu bạn đang dùng Hardhat demo từ máy khác: hãy import 1 trong các tài khoản Hardhat (có sẵn 10,000 ETH) vào MetaMask, ' +
      'hoặc nhờ host chuyển ETH vào ví của bạn.'
    );
  }

  if (code === -32601) {
    return 'MetaMask/RPC không hỗ trợ method được gọi (method not found). Hãy kiểm tra lại network/RPC.';
  }

  if (code === -32603) {
    return 'RPC gặp lỗi nội bộ (-32603). Thử reload, kiểm tra RPC URL, hoặc khởi động lại Hardhat node.';
  }

  return message || 'Lỗi MetaMask';
}
