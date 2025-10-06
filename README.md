# 🚗 Locadora de Automóveis — Azure Cloud Project

**Disciplina:** Computação em Nuvem II — FATEC Cotia  
**Aluna:** Alessandra Sanches  
**Professor:** Eduardo Tadeu de Almeida  
**Data:** 06/10/2025

[![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.com/)

---

## 📋 Descrição do Projeto

Aplicação web de **locação de automóveis** utilizando os serviços do **Microsoft Azure** (Blob Storage e Table Storage). O sistema realiza o gerenciamento de veículos, clientes e locações com uma interface simples desenvolvida em **HTML**, **CSS** e **JavaScript** puro.

## ☁️ Serviços do Azure Utilizados

### 🗃️ Azure Table Storage
Armazena os registros de veículos, clientes e locações. Cada tabela é criada automaticamente ao iniciar o servidor.

### 📁 Azure Blob Storage
Utilizado para armazenar imagens dos veículos. Cada aluno cria um container com seu nome.

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Node.js, Express, Azure SDK, dotenv |
| **Frontend** | HTML5, CSS3, JavaScript puro |
| **Banco de Dados** | Azure Table Storage |
| **Armazenamento** | Azure Blob Storage |

## ⚙️ Configuração e Execução

1. **📦 Instale as dependências**
   ```bash
   npm install
   ```

2. **🔐 Configure o arquivo `.env`** com as credenciais do Azure fornecidas

3. **🖥️ Inicie o servidor**
   ```bash
   npm run dev
   ```

4. **🌐 Abra o arquivo** `frontend/index.html` no navegador

## ✨ Funcionalidades

- ✅ **Cadastro, listagem e edição de veículos**
- ✅ **Cadastro e histórico de clientes**
- ✅ **Criação e cancelamento de locações**
- ✅ **Upload de imagens via Azure Blob Storage**

## 🔗 Estrutura da API

A API fornece **endpoints RESTful** para gerenciamento de veículos, clientes e locações.

### Principais Endpoints

```http
GET    /api/veiculos          # Listar veículos
POST   /api/veiculos          # Cadastrar veículo
GET    /api/clientes          # Listar clientes
POST   /api/clientes          # Cadastrar cliente
GET    /api/locacoes          # Listar locações
POST   /api/locacoes          # Criar locação
```

---

## 💝 Créditos

**Desenvolvido com ❤️ por Alessandra Sanches**

🎓 **Curso:** Desenvolvimento de Software Multiplataforma (DSM) — FATEC Cotia  
📅 **Período:** 6º Semestre — 2025
