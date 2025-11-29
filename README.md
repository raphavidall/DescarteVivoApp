# ♻️ Descarte Vivo - API (Backend)

Backend da plataforma **Descarte Vivo**, uma solução de logística reversa e gamificação para conectar geradores de resíduos, coletores e pontos de destino em Fortaleza.

## 🚀 Tecnologias Utilizadas

- **Node.js** & **Express**: Servidor web.
- **Prisma ORM**: Gerenciamento de banco de dados e migrações.
- **PostgreSQL**: Banco de dados relacional.
- **JWT (JsonWebToken)**: Autenticação segura.
- **Multer**: Upload de imagens dos pacotes.
- **Jest & Supertest**: Testes unitários e de integração.
- **Bcrypt**: Criptografia de senhas.

## ⚙️ Funcionalidades Principais

- **Autenticação**: Cadastro, Login e Refresh Token.
- **Gestão de Pacotes**:
  - Máquina de estados complexa (Disponível -> Aguardando Aprovação -> Em Transporte -> Entregue).
  - Upload de fotos do material.
  - Geolocalização (Latitude/Longitude e Endereço).
- **Sistema Financeiro (Escrow)**:
  - Carteira digital (Saldo em moedas).
  - Transações atômicas: O valor fica retido pelo sistema até a confirmação da entrega.
  - Divisão de valores entre Descartador e Coletor.
- **Notificações**: Sistema de alertas automáticos baseado na mudança de status dos pacotes.
- **Chat**: Mensagens entre usuários vinculadas a um pacote específico.

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL rodando localmente ou via Docker.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/descarteVivoApp.git](https://github.com/seu-usuario/descarteVivoApp.git)
   cd descarteVivoApp

2. **Instale as dependências:**
    ```bash
    npm install