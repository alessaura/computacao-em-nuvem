const API_URL = "http://localhost:4000/api";

const form = document.getElementById("vehicleForm");
const list = document.getElementById("vehicles");

// Cadastrar veículo
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const brand = document.getElementById("brand").value;
  const model = document.getElementById("model").value;
  const year = document.getElementById("year").value;
  const plate = document.getElementById("plate").value;
  const price = document.getElementById("price").value;

  const res = await fetch(`${API_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand, model, year, plate, pricePerDay: price })
  });

  if (res.ok) {
    alert("Veículo cadastrado com sucesso!");
    form.reset();
    loadVehicles();
  } else {
    alert("Erro ao cadastrar veículo");
  }
});

// Listar veículos
async function loadVehicles() {
  const res = await fetch(`${API_URL}/vehicles`);
  const data = await res.json();
  list.innerHTML = "";

  data.forEach((v) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${v.brand} ${v.model}</strong><br>
      Ano: ${v.year} — Placa: ${v.plate}<br>
      Preço: R$ ${v.pricePerDay || 0}/dia<br>
      Disponível: ${v.available ? "Sim ✅" : "Não ❌"}
    `;
    list.appendChild(div);
  });
}

// Carregar ao abrir
loadVehicles();
