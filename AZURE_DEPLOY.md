# Deploy FieldBooking lên Azure (React + Hardhat + MetaMask)

Repo này có 2 phần:
- Frontend React (CRA) trong thư mục `frontend/`
- Node server tĩnh `server.js` (chỉ để serve `frontend/build`)

Về blockchain: Azure chỉ **host website**. Người dùng vẫn ký giao dịch bằng **MetaMask trong trình duyệt**.

Nếu bạn muốn người khác dùng được, bạn **không thể dựa vào Hardhat local** (vì mỗi người sẽ có “localhost blockchain” khác nhau). Cách phổ biến là deploy contract lên **Sepolia** (testnet) hoặc mainnet.

---

## 1) Chuẩn bị blockchain (2 chế độ)

Bạn có 2 lựa chọn:
- **(Khuyến nghị khi public cho nhiều người)** Deploy contract lên Sepolia/Mainnet.
- **(Theo yêu cầu của bạn hiện tại)** Dùng **Hardhat local**: Azure chỉ host UI, còn mỗi người dùng phải tự chạy Hardhat node trên máy họ.

### A. Tạo RPC + ví deploy
- Lấy RPC URL Sepolia (Alchemy/Infura/QuickNode… hoặc dùng mặc định, nhưng nên dùng provider riêng để ổn định)
- Ví deploy cần có Sepolia ETH

Tạo file `.env` ở thư mục gốc `FieldBooking/` (không commit lên git):
- `SEPOLIA_RPC_URL=...`
- `PRIVATE_KEY=...` (private key ví deploy)

### B. Deploy contract lên Sepolia
Chạy ở thư mục gốc `FieldBooking/`:
- `npm install`
- `npx hardhat compile`
- `npx hardhat run scripts/deploy-sepolia.js --network sepolia`

Kết quả sẽ in ra địa chỉ contract (và có thể ghi vào `deployment.json` tùy script).

---

## 2) Cấu hình frontend (địa chỉ contract + network)

Frontend lấy địa chỉ contract từ biến môi trường build-time:
- `REACT_APP_CONTRACT_ADDRESS`

Và có thể set thêm:
- `REACT_APP_NETWORK_ID=11155111` (Sepolia) hoặc `31337` (Hardhat local)
- `REACT_APP_SEPOLIA_RPC=...` (tuỳ chọn, để hiển thị/cấu hình network)

Khuyến nghị tạo file `frontend/.env.production` (không commit nếu chứa RPC riêng):
- `REACT_APP_CONTRACT_ADDRESS=0x...`
- `REACT_APP_NETWORK_ID=11155111`
- `REACT_APP_SEPOLIA_RPC=https://...`

Sau đó build:
- `cd frontend`
- `npm install`
- `npm run build`

---

## 3) Deploy lên Azure (2 lựa chọn)

### Lựa chọn 1 (khuyến nghị): Azure Static Web Apps (host frontend tĩnh)
Phù hợp khi bạn chỉ cần host React (và giao dịch đi qua MetaMask).

**Ưu điểm**: rẻ/đơn giản, có GitHub Actions tự build/deploy.

Các bước (Portal):
1. Tạo Azure Static Web Apps
2. Kết nối với GitHub repo
3. Cấu hình build:
   - App location: `frontend`
   - Output location: `build`
   - Build command: `npm ci && npm run build`
4. Set các environment variables cho workflow (GitHub Actions) hoặc trong SWA (tuỳ UI):
   - `REACT_APP_CONTRACT_ADDRESS`
   - `REACT_APP_NETWORK_ID`
   - `REACT_APP_SEPOLIA_RPC` (nếu dùng)

Lưu ý:
- CRA dùng biến môi trường **tại lúc build**, nên cần set env vars cho bước build.


### Lựa chọn 2: Azure App Service (Node) chạy `server.js`
Phù hợp khi bạn muốn deploy đúng kiểu “Node server serve build”.

**Yêu cầu**: trên App Service phải có sẵn `frontend/build`.

Các bước (Portal):
1. Tạo App Service (Linux), runtime Node.js 18/20
2. Deployment Center: kết nối GitHub
3. Thiết lập pipeline để:
   - `npm ci` ở root
   - `cd frontend && npm ci && npm run build`
4. Startup command:
   - `node server.js`
5. App Settings:
   - `PORT=3001` (hoặc để Azure tự set)

Lưu ý:
- `server.js` chỉ serve static; không cần DB.

---

## 4) Cách chọn mạng khi chạy thực tế

- Nếu deploy Azure cho nhiều người dùng: dùng Sepolia/mainnet.
- Nếu bạn host UI trên Azure nhưng **dùng Hardhat local**: DApp vẫn chạy trong trình duyệt, nên `http://127.0.0.1:8545` sẽ trỏ về **máy người dùng**. Vì vậy người dùng phải:
  1) chạy Hardhat node trên máy họ
  2) thêm network Hardhat Local vào MetaMask (RPC `http://127.0.0.1:8545`, chainId `31337`)
  3) import 1 account test (private key từ log Hardhat) để có ETH test
  4) deploy contract lên chính Hardhat node của họ

> Lưu ý quan trọng: Nếu người dùng không chạy Hardhat node local, UI trên Azure sẽ không thể gọi contract.

### Hardhat local + Azure SWA (Checklist)

1. Ở máy người dùng (hoặc máy bạn), chạy:
   - `cd FieldBooking`
   - `npx hardhat node`
2. Deploy contract lên localhost (mở terminal khác):
   - `cd FieldBooking`
   - `npx hardhat run scripts/deploy.js --network localhost`
3. Set `REACT_APP_NETWORK_ID=31337` và `REACT_APP_CONTRACT_ADDRESS=<địa chỉ vừa deploy>` rồi build frontend.

#### Giữ contract address ổn định để không phải redeploy Azure liên tục

Với Hardhat local, nếu bạn **luôn**:
- start node fresh (nonce reset)
- deploy bằng cùng 1 account
- deploy theo cùng thứ tự (contract này là tx deploy đầu tiên)

thì contract address thường sẽ **giữ ổn định** giữa các lần restart node.
Nếu bạn deploy thêm contract khác trước đó, địa chỉ sẽ đổi (do nonce tăng) → phải build lại frontend (hoặc dùng cách cấu hình runtime).

---

## 5) Checklist nhanh (Sepolia + Azure Static Web Apps)

1. Deploy contract lên Sepolia → lấy `contractAddress`
2. Set `REACT_APP_CONTRACT_ADDRESS=...` và `REACT_APP_NETWORK_ID=11155111`
3. `frontend` → `npm run build`
4. Tạo Azure Static Web Apps trỏ vào `frontend/build`

---

## 6) Troubleshooting

- Mở site Azure nhưng lỗi “contract chưa được khởi tạo”: kiểm tra `REACT_APP_CONTRACT_ADDRESS` đã đúng và đã được embed vào bản build.
- Đang ở Sepolia nhưng UI vẫn đòi Hardhat: kiểm tra component `NetworkSwitcher` hiện đang chỉ hiển thị Hardhat Local (có thể mở lại Sepolia nếu bạn muốn).
