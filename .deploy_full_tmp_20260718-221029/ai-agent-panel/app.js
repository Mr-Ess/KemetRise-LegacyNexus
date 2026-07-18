// app.js – handles CRUD for AI agents using localStorage

const STORAGE_KEY = "aiAgents";

function loadAgents() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAgents(agents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

function renderAgents() {
  const agents = loadAgents();
  const list = document.getElementById("agent-list");
  list.innerHTML = "";
  agents.forEach((agent, idx) => {
    const card = document.createElement("div");
    card.className = "agent-card";
    const title = document.createElement("h3");
    title.textContent = agent.agentName || `Agent ${idx + 1}`;
    const actions = document.createElement("div");
    actions.className = "agent-actions";
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => openModal("edit", idx);
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      if (confirm("Delete this agent?")) {
        agents.splice(idx, 1);
        saveAgents(agents);
        renderAgents();
      }
    };
    actions.append(editBtn, delBtn);
    card.append(title, actions);
    list.appendChild(card);
  });
}

function openModal(mode = "add", index = null) {
  const modal = document.getElementById("modal");
  const form = document.getElementById("agent-form");
  const title = document.getElementById("modal-title");
  modal.classList.remove("hidden");
  title.textContent = mode === "add" ? "Add New Agent" : "Edit Agent";
  form.reset();
  if (mode === "edit" && index !== null) {
    const agents = loadAgents();
    const agent = agents[index];
    form.agentName.value = agent.agentName || "";
    form.businessName.value = agent.businessName || "";
    form.role.value = agent.role || "sales_assistant";
    form.systemPrompt.value = agent.systemPrompt || "";
    form.dataset.mode = "edit";
    form.dataset.idx = index;
  } else {
    form.dataset.mode = "add";
    delete form.dataset.idx;
  }
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

document.getElementById("add-agent").addEventListener("click", () => openModal("add"));

document.querySelector(".close").addEventListener("click", closeModal);

document.getElementById("agent-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const agents = loadAgents();
  const agentData = {
    agentName: form.agentName.value.trim(),
    businessName: form.businessName.value.trim(),
    role: form.role.value,
    systemPrompt: form.systemPrompt.value.trim()
  };
  if (form.dataset.mode === "edit") {
    const idx = Number(form.dataset.idx);
    agents[idx] = agentData;
  } else {
    agents.push(agentData);
  }
  saveAgents(agents);
  renderAgents();
  closeModal();
});

// Initial render
renderAgents();
