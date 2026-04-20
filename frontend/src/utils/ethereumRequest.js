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

  if (code === 4001) {
    return 'Bạn đã từ chối yêu cầu trên MetaMask.';
  }

  // MetaMask: request already pending for origin
  if (code === -32002) {
    return 'MetaMask đang có một yêu cầu kết nối đang chờ. Vui lòng mở MetaMask để Approve/Cancel, rồi quay lại bấm thử lại.';
  }

  return err?.message || 'Lỗi MetaMask';
}
