require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  ensureInfra,
  vehiclesTable,
  customersTable,
  rentalsTable,
  blobService,
  CONTAINER,
  OWNER
} = require("./azure");
const { v4: uuid } = require("uuid");
const { newId, nowIso } = require("./utils");

const {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential
} = require("@azure/storage-blob");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

ensureInfra()
  .then(() => console.log("✅ Azure pronto (tabelas + container)"))
  .catch((e) => console.error("Infra erro:", e));

/* ===== VEHICLES ===== */
app.get("/api/vehicles", async (req, res) => {
  try {
    const brand = (req.query.brand || "").toString().toLowerCase();
    const model = (req.query.model || "").toString().toLowerCase();
    const available = req.query.available;

    const it = vehiclesTable.listEntities({ queryOptions: { filter: `PartitionKey eq 'VEHICLE'` }});
    const out = [];
    for await (const e of it) {
      let ok = true;
      if (brand) ok &&= String(e.brand || "").toLowerCase().includes(brand);
      if (model) ok &&= String(e.model || "").toLowerCase().includes(model);
      if (available !== undefined) ok &&= String(!!e.available) === String(available === "true");
      if (ok) out.push(e);
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao listar veículos" });
  }
});

app.post("/api/vehicles", async (req, res) => {
  try {
    const id = newId();
    const entity = {
      partitionKey: "VEHICLE",
      rowKey: id,
      brand: req.body.brand,
      model: req.body.model,
      year: Number(req.body.year),
      plate: req.body.plate,
      pricePerDay: Number(req.body.pricePerDay),
      available: true,
      imageUrls: JSON.stringify([]),
      owner: OWNER,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    await vehiclesTable.createEntity(entity);
    res.status(201).json(entity);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao criar veículo" });
  }
});

app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const e = await vehiclesTable.getEntity("VEHICLE", req.params.id);
    Object.assign(e, { ...req.body, updatedAt: nowIso() });
    await vehiclesTable.updateEntity(e, "Replace");
    res.json(e);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao atualizar veículo" });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    await vehiclesTable.deleteEntity("VEHICLE", req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao deletar veículo" });
  }
});

/* === SAS de upload por blob (10 min), usando AccountKey separada === */
app.post("/api/vehicles/:id/image-sas", async (req, res) => {
  try {
    const id = req.params.id;
    const fileName = req.body.fileName;
    if (!fileName) return res.status(400).json({ error: "fileName requerido" });

    const accountName = process.env.AZURE_ACCOUNT_NAME;
    const accountKey  = process.env.AZURE_ACCOUNT_KEY;
    if (!accountName || !accountKey) {
      return res.status(500).json({ error: "AZURE_ACCOUNT_NAME/AZURE_ACCOUNT_KEY ausentes no .env" });
    }

    const container = blobService.getContainerClient(CONTAINER);
    const blob = container.getBlockBlobClient(`${id}/${fileName}`);

    const cred = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000);

    const sas = generateBlobSASQueryParameters({
      containerName: CONTAINER,
      blobName: `${id}/${fileName}`,
      permissions: BlobSASPermissions.parse("cw"), // create + write
      startsOn: new Date(Date.now() - 60 * 1000),
      expiresOn,
      protocol: SASProtocol.Https
    }, cred).toString();

    res.json({ uploadUrl: `${blob.url}?${sas}`, expiresOn });
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao gerar SAS" });
  }
});

/* ===== CUSTOMERS ===== */
app.get("/api/customers", async (_req, res) => {
  try {
    const it = customersTable.listEntities({ queryOptions: { filter: `PartitionKey eq 'CUSTOMER'` }});
    const out = []; for await (const e of it) out.push(e);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao listar clientes" });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const id = newId();
    const e = {
      partitionKey: "CUSTOMER",
      rowKey: id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      documentId: req.body.documentId,
      address: req.body.address,
      owner: OWNER,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    await customersTable.createEntity(e);
    res.status(201).json(e);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao criar cliente" });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const e = await customersTable.getEntity("CUSTOMER", req.params.id);
    Object.assign(e, { ...req.body, updatedAt: nowIso() });
    await customersTable.updateEntity(e, "Replace");
    res.json(e);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao atualizar cliente" });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    await customersTable.deleteEntity("CUSTOMER", req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao deletar cliente" });
  }
});

/* ===== RENTALS ===== */
app.post("/api/rentals", async (req, res) => {
  try {
    const rentalId = uuid();
    const { customerId, vehicleId, startDate, endDate, startHour, endHour, totalPrice } = req.body;

    const e = {
      partitionKey: customerId,
      rowKey: rentalId,
      customerId, vehicleId,
      startDate, endDate, startHour, endHour,
      totalPrice: Number(totalPrice),
      status: "OPEN",
      owner: OWNER,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    await rentalsTable.createEntity(e);

    const v = await vehiclesTable.getEntity("VEHICLE", vehicleId);
    v.available = false; v.updatedAt = nowIso();
    await vehiclesTable.updateEntity(v, "Replace");

    res.status(201).json(e);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao criar locação" });
  }
});

app.put("/api/rentals/:customerId/:rentalId", async (req, res) => {
  try {
    const { customerId, rentalId } = req.params;
    const e = await rentalsTable.getEntity(customerId, rentalId);
    Object.assign(e, { ...req.body, updatedAt: nowIso() });
    await rentalsTable.updateEntity(e, "Replace");
    res.json(e);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao atualizar locação" });
  }
});

app.delete("/api/rentals/:customerId/:rentalId", async (req, res) => {
  try {
    const { customerId, rentalId } = req.params;
    await rentalsTable.deleteEntity(customerId, rentalId);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao deletar locação" });
  }
});

app.get("/api/customers/:customerId/rentals", async (req, res) => {
  try {
    const { customerId } = req.params;
    const it = rentalsTable.listEntities({ queryOptions: { filter: `PartitionKey eq '${customerId}'` }});
    const out = []; for await (const e of it) out.push(e);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message || "Erro ao listar histórico" });
  }
});

app.get("/", (_req, res) => {
  res.send(`<h1>API Locadora</h1><p>OK! Use <code>/health</code> ou <code>/api/...</code></p>`);
});
 
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`🚀 API em http://localhost:${port}`));
