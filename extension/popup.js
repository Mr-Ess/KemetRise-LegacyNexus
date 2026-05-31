const BASE = window.location.origin;
document.querySelectorAll(".btn").forEach(b => {
  b.addEventListener("click", () => chrome.tabs.create({ url: BASE + b.dataset.path }));
});
document.getElementById("search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") chrome.tabs.create({ url: BASE + "/?q=" + encodeURIComponent(e.target.value) });
});
