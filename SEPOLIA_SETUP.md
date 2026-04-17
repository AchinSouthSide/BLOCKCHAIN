# Sepolia Testnet Configuration Guide

## 🔌 Option 1: Use Public RPC (Recomendado para Demo)

Crie/edite `.env`:

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=seu_private_key_do_metamask_aqui
```

## 🔑 Como pegar Private Key do MetaMask

1. Abra MetaMask
2. Settings → Security & Privacy
3. Mnemonic Phrase (salve seguro)
4. Ou: Account Menu → Export Private Key

## 💰 Pegar testETH

1. https://www.infura.io/faucet/sepolia (Infura faucet)
2. Ou: https://sepoliafaucet.com
3. Cole seu endereço MetaMask
4. Await ~30 segundos

## 🚀 Deploy para Sepolia

```bash
npm run deploy:sepolia
```

## 🧪 Teste

```bash
npm run test:sepolia
```

## ✅ Setup Completo

1. Edite `.env` com SEPOLIA_RPC_URL e PRIVATE_KEY
2. Run: `npm run deploy:sepolia`
3. Copy contract address
4. Update frontend config
5. Test!

---

**Status:** Pronto para deploy! 🎉
