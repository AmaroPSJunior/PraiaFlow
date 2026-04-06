# PraiaFlow - Sistema de Pedidos para Quiosques de Praia

PraiaFlow é uma solução completa para quiosques de praia que permite aos clientes fazerem pedidos diretamente de suas mesas via QR Code.

## 🚀 Funcionalidades

### Cliente
- **Acesso via QR Code**: Identificação automática da mesa.
- **Cardápio Digital**: Categorizado e com imagens.
- **Carrinho Persistente**: Salvo localmente para evitar perda de dados.
- **Pagamento PIX**: Fluxo simulado de pagamento instantâneo.
- **Acompanhamento Real-time**: Status do pedido atualizado via Firestore.
- **PWA**: Instalável e otimizado para uso ao ar livre (alto contraste).

### Admin (Quiosque)
- **Dashboard Kanban**: Gerenciamento de pedidos em tempo real.
- **Gestão de Cardápio**: Controle de disponibilidade de itens.
- **Gestão de Mesas**: Visualização das mesas ativas.
- **Relatórios**: Faturamento e status dos pedidos.

## 🧱 Stack Tecnológica
- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express (Vite Middleware).
- **Banco de Dados**: Firebase Firestore (Real-time).
- **Autenticação**: Firebase Auth (Google Login).

## ⚙️ Execução Local

1. **Instalação**:
   ```bash
   npm install
   ```

2. **Configuração**:
   - O arquivo `firebase-applet-config.json` já contém as credenciais necessárias.
   - O arquivo `.env.example` lista as variáveis de ambiente.

3. **Popular Banco de Dados (Seed)**:
   ```bash
   npm run seed
   ```

4. **Execução**:
   ```bash
   npm run dev
   ```

## 📱 URLs de Acesso
- **Cliente**: `https://<APP_URL>/mesa/1` (Mesa 1)
- **Admin**: `https://<APP_URL>/admin` (Login com Google)

---
Desenvolvido com foco em performance e usabilidade em ambientes externos.
