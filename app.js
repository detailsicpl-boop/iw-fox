// Entirely synthetic, browser-memory-only workflow rehearsal. Never use these
// persona selectors or client-side checks as a production authorization model.
const personas = {
  operator: { label: "Operator (example)", entities: ["ICRPL", "AGRA", "LLP"], modules: ["home", "fox", "combined", "third-party"] },
  supervisor: { label: "Supervisor (example)", entities: ["ICRPL", "AGRA", "LLP"], modules: ["home", "fox", "combined", "third-party", "masters", "operations"] },
  entityAdmin: { label: "Entity admin (example)", entities: ["ICRPL", "AGRA", "LLP"], modules: ["home", "masters", "access", "operations"] },
  integrationAdmin: { label: "Provider admin (example)", entities: ["ICRPL", "AGRA", "LLP"], modules: ["home", "providers", "operations"] },
  technical: { label: "Technical custodian (example)", entities: ["ICRPL", "AGRA", "LLP"], modules: ["home", "technical", "operations"] },
};
const pages = [
  ["login", "Login and MFA"], ["home", "Home"], ["fox", "Fox work"],
  ["combined", "Combined record"], ["third-party", "Third-party workspace"],
  ["masters", "Master requests"], ["access", "User access admin"],
  ["providers", "Provider master admin"], ["operations", "Reconciliation"],
  ["technical", "Technical operations"],
];
const rows = [
  { id: "F-101", entity: "ICRPL", unit: "HQ", party: "Example Customer A", city: "Example City", updated: "Sample timestamp", link: "C-201" },
  { id: "F-102", entity: "ICRPL", unit: "HQ", party: "Example Customer B", city: "Sample Town", updated: "Sample timestamp", link: null },
  { id: "F-301", entity: "AGRA", unit: "STORE", party: "Example Customer C", city: "Example City", updated: "Sample timestamp", link: "C-401" },
  { id: "F-501", entity: "LLP", unit: "STORE", party: "Example Customer D", city: "Sample City", updated: "Sample timestamp", link: "C-601" },
];
const providerRows = [
  { id: "C-201", entity: "ICRPL", name: "Example Lead A", status: "Sample follow-up" },
  { id: "C-401", entity: "AGRA", name: "Example Lead B", status: "Sample new" },
  { id: "C-601", entity: "LLP", name: "Example Lead C", status: "Sample open" },
];
const state = { persona: "operator", entity: "ICRPL", selected: null, query: "", drafts: [], access: [], providers: [] };
const byId = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const tag = (text, kind = "") => `<span class="tag ${kind}">${esc(text)}</span>`;
const panel = (title, content) => `<section class="panel"><h2>${title}</h2>${content}</section>`;
const visible = () => rows.filter((row) => row.entity === state.entity &&
  `${row.id} ${row.party} ${row.city}`.toLowerCase().includes(state.query.toLowerCase()));
const currentPage = () => pages.some(([key]) => key === location.hash.slice(1)) ? location.hash.slice(1) : "home";
const allowed = (page) => page === "login" || personas[state.persona].modules.includes(page);

function login() { return `<div class="two">${panel("1 · Bridge access", `<p>Production will verify a named web identity, password, authenticator and entity grant on the server.</p>${tag("Identity service pending", "warn")}`)}
${panel("2 · Fox identity", `<p>The selected company must have a verified Fox account-to-person mapping. Whether existing Fox credentials can be checked safely remains under source review.</p>${tag("Fox account mapping pending", "warn")}`)}</div>
${panel("3 · Browser workspace", `<p>After both gates pass, the browser shows approved Fox replacement workflows. It will not run or display the Fox EXE.</p>${tag("No real login in this preview", "lock")}`)}
<p class="status">Do not enter real usernames or passwords in this public design preview. The simulated user selector is not authentication.</p>`; }
function home() { return `<div class="grid"><div class="metric">Visible example records<strong>${visible().length}</strong><small>Only invented data</small></div>
<div class="metric">Draft requests<strong>${state.drafts.filter((item) => item.entity === state.entity).length}</strong><small>Browser memory only</small></div>
<div class="metric">Live connections<strong>0</strong><small>Fox and providers disconnected</small></div></div>
<div class="two">${panel("Current context", `<p><strong>${esc(state.entity)}</strong> · ${esc(personas[state.persona].label)}</p><p>Every production query must enforce the named person's exact entity, unit, action and field grants on the server.</p>`)}
${panel("Next workflow", `<ol class="steps"><li>Review the Fox record layout.</li><li>Compare only an approved record link.</li><li>Submit a master request for independent approval.</li><li>Reconcile each result before cutover.</li></ol>`)}</div>`; }
function fox() { const matches = visible();return `<div class="form-row"><label>Search examples<input id="record-search" value="${esc(state.query)}" maxlength="60" placeholder="ID, name or city"></label><button id="run-search">Search</button></div>
<div class="table-wrap"><table><thead><tr><th>ID</th><th>Example party</th><th>Unit</th><th>City</th><th>Source</th><th></th></tr></thead><tbody>${matches.map((row) => `<tr><td>${row.id}</td><td>${row.party}</td><td>${row.unit}</td><td>${row.city}</td><td>Fox example</td><td><button class="secondary" data-record="${row.id}">Detail</button></td></tr>`).join("") || `<tr><td colspan="6">No examples in this entity/search.</td></tr>`}</tbody></table></div>
${state.selected && matches.some((row) => row.id === state.selected) ? panel("Record detail", `<p>${esc(state.selected)} · source: Fox example · freshness: sample timestamp</p><p>Draft and submission to Fox are locked until a tested command contract exists.</p>${tag("Fox write disabled", "lock")}`) : ""}`; }
function combined() { const linked = visible().filter((row) => row.link);return `<p>Only explicitly linked examples appear together. Unlinked Fox records remain in Fox work.</p>
<div class="two">${linked.map((row) => { const crm = providerRows.find((item) => item.id === row.link && item.entity === row.entity);return panel(`${row.id} ↔ ${crm.id}`, `<p><strong>Fox source:</strong> ${row.party} · ${row.updated}</p><p><strong>Provider source:</strong> ${crm.name} · ${crm.status}</p>${tag("Example approved link")}`); }).join("") || panel("No linked records", `<p>There is no link for this example entity.</p>`)}
${panel("Actual data gate", `<p>A production link needs an approved source contract, matching entity/unit, field grants and a revocable link. Both sides show freshness independently.</p>${tag("No live records", "lock")}`)}</div>`; }
function thirdParty() { const matches = providerRows.filter((row) => row.entity === state.entity);return `<div class="table-wrap"><table><thead><tr><th>Provider ID</th><th>Example lead</th><th>Status</th><th>Ownership</th></tr></thead><tbody>${matches.map((row) => `<tr><td>${row.id}</td><td>${row.name}</td><td>${row.status}</td><td>${row.entity}</td></tr>`).join("") || `<tr><td colspan="4">No provider examples.</td></tr>`}</tbody></table></div>
${panel("Provider connection", `<p>Production reads require the vendor's API/export rights, scoped adapter, retention rule and a separate provider grant.</p>${tag("Disconnected", "lock")}`)}`; }
function masters() { const items = state.drafts.filter((item) => item.entity === state.entity);return `${panel("Create sample request", `<p>Practice the review journey without touching Fox.</p><div class="form-row"><label>Request summary<input id="master-summary" maxlength="80" placeholder="Example: update a sample master"></label><button id="create-master">Create local draft</button></div>`)}
${panel("Review queue", items.length ? `<ul class="steps">${items.map((item) => `<li>${esc(item.summary)} · ${tag(item.status, item.status === "draft" ? "warn" : "")}${state.persona === "entityAdmin" && item.proposer !== state.persona && item.status === "draft" ? ` <button data-approve="${item.id}" class="secondary">Approve in demo</button>` : ""}</li>`).join("")}</ul>` : `<p>No sample requests yet.</p>`)}
<p class="status">Approvals here are browser-memory rehearsals; a production approver must differ from the proposer and have delegated scope.</p>`; }
function access() { return `${panel("Fox account import review", `<p>Account source and named ownership remain unverified. MENUDEF USER slots are menu flags, not people.</p>${tag("No Fox users imported", "lock")}`)}
${panel("Propose example access", `<div class="form-row"><label>Example person ID<input id="person-id" maxlength="30" placeholder="Example-01"></label><button id="propose-access">Create local proposal</button></div><p>No grant becomes active.</p>`)}
${panel("Local proposals", state.access.length ? `<ul>${state.access.filter((x) => x.entity === state.entity).map((x) => `<li>${esc(x.person)} · ${esc(x.entity)} · pending verification</li>`).join("")}</ul>` : `<p>None</p>`)}`; }
function providers() { return `${panel("Provider contract draft", `<div class="form-row"><label>Example provider ID<input id="provider-id" maxlength="30" placeholder="ExampleCRM"></label><button id="create-provider">Save local draft</button></div><p>API tokens are never requested in this demo.</p>`)}
${panel("Draft register", state.providers.length ? `<ul>${state.providers.filter((x) => x.entity === state.entity).map((x) => `<li>${esc(x.id)} · ${esc(x.entity)} · draft, disabled</li>`).join("")}</ul>` : `<p>None</p>`)}
${panel("Release gates", `<p>Independent business/data/security approval, adapter mapping, sandbox proof, secret custody and rollback must precede activation.</p>${tag("Activation disabled", "lock")}`)}`; }
function operations() { return `<div class="grid"><div class="metric">Live queue<strong>—</strong><small>Service not connected</small></div><div class="metric">Example drafts<strong>${state.drafts.length}</strong><small>Local memory</small></div><div class="metric">Provider routes<strong>0</strong><small>None enabled</small></div></div>
${panel("Reconciliation and audit", `<p>Production will show scoped aggregate queue states, pinned provider route, freshness, uncertainty and masked audit evidence. No real events are loaded here.</p>${tag("No operational feed", "lock")}`)}`; }
function technical() { return `<div class="two">${panel("Service health", `<p>Static UI preview is available. Bridge, database and connector health are not represented by this screen.</p>${tag("Demo only", "warn")}`)}
${panel("Release and recovery", `<p>Deployment SHA, migration checksums, backups, restore test and rollback evidence must come from the target environment.</p>${tag("No production release", "lock")}`)}</div>`; }
const views = { login, home, fox, combined, "third-party": thirdParty, masters, access, providers, operations, technical };

function render() {
  const page = currentPage();
  const account = personas[state.persona];
  byId("persona").innerHTML = Object.entries(personas).map(([id, value]) => `<option value="${id}">${esc(value.label)}</option>`).join("");
  byId("persona").value = state.persona;
  byId("entity").innerHTML = account.entities.map((entity) => `<option value="${entity}">${entity}</option>`).join("");
  byId("entity").value = state.entity;
  byId("navigation").innerHTML = pages.map(([id, label]) => `<a href="#${id}" class="${id === page ? "active" : ""}">${label}</a>`).join("");
  byId("page-title").textContent = pages.find(([id]) => id === page)[1];
  byId("content").innerHTML = allowed(page) ? views[page]() : `<div class="empty"><h2>Outside this example role</h2><p>The selected persona has no sample access to this module. A real service must enforce this on its API and database queries.</p></div>`;
}
byId("persona").addEventListener("change", (event) => { state.persona = event.target.value; state.entity = personas[state.persona].entities[0]; state.selected = null; state.query = ""; render(); });
byId("entity").addEventListener("change", (event) => { if (personas[state.persona].entities.includes(event.target.value)) state.entity = event.target.value; state.selected = null; state.query = ""; render(); });
window.addEventListener("hashchange", render);
byId("content").addEventListener("click", (event) => {
  const target = event.target.closest("button"); if (!target || !allowed(currentPage())) return;
  if (target.id === "run-search") { state.query = byId("record-search").value.trim().slice(0, 60); state.selected = null; }
  if (target.dataset.record) state.selected = visible().some((row) => row.id === target.dataset.record) ? target.dataset.record : null;
  if (target.id === "create-master") { const summary = byId("master-summary").value.trim();if (summary) state.drafts.push({ id: state.drafts.length + 1, entity: state.entity, proposer: state.persona, summary: summary.slice(0, 80), status: "draft" }); }
  if (target.dataset.approve && state.persona === "entityAdmin") { const item = state.drafts.find((x) => x.id === Number(target.dataset.approve) && x.entity === state.entity && x.proposer !== state.persona && x.status === "draft");if (item) item.status = "demo-approved"; }
  if (target.id === "propose-access") { const person = byId("person-id").value.trim();if (person) state.access.push({ entity: state.entity, person: person.slice(0, 30) }); }
  if (target.id === "create-provider") { const id = byId("provider-id").value.trim();if (id) state.providers.push({ entity: state.entity, id: id.slice(0, 30) }); }
  render();
});
render();

byId("open-workspace").addEventListener("click", () => {
  const company = byId("entry-company").value;
  if (!personas[state.persona].entities.includes(company)) return;
  state.entity = company; state.selected = null; state.query = "";
  byId("entry-screen").hidden = true;
  byId("workspace-shell").hidden = false;
  location.hash = "home";
  render();
});
byId("change-company").addEventListener("click", () => {
  byId("entry-company").value = state.entity;
  byId("workspace-shell").hidden = true;
  byId("entry-screen").hidden = false;
  byId("open-workspace").focus();
});
