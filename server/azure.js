require("dotenv").config();
const { BlobServiceClient } = require("@azure/storage-blob");
const { TableClient, TableServiceClient } = require("@azure/data-tables");

const CONN_SAS = process.env.AZURE_STORAGE_CONNECTION_STRING; // SAS connection string
if (!CONN_SAS) throw new Error("Faltou AZURE_STORAGE_CONNECTION_STRING (SAS) no .env");

const OWNER = process.env.OWNER || "alessandra";
const CONTAINER = process.env.CONTAINER_NAME || "alessandra";

const tableService = TableServiceClient.fromConnectionString(CONN_SAS);
const vehiclesTable = TableClient.fromConnectionString(CONN_SAS, "Vehicles");
const customersTable = TableClient.fromConnectionString(CONN_SAS, "Customers");
const rentalsTable   = TableClient.fromConnectionString(CONN_SAS, "Rentals");

const blobService = BlobServiceClient.fromConnectionString(CONN_SAS);

async function ensureInfra() {
  // Tabelas (idempotente)
  await tableService.createTable("Vehicles").catch(() => {});
  await tableService.createTable("Customers").catch(() => {});
  await tableService.createTable("Rentals").catch(() => {});

  // Container com seu nome
  const container = blobService.getContainerClient(CONTAINER);
  if (!(await container.exists())) {
    // Deixe "container" para leitura pública dos blobs (fotos) — exigência comum em prova
    await container.create({ access: "container" }).catch(() => {});
  }
}

module.exports = {
  OWNER,
  CONTAINER,
  vehiclesTable,
  customersTable,
  rentalsTable,
  blobService,
  ensureInfra
};
