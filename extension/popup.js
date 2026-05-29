const BASE = "https://id-preview--6cd71b4b-51c0-42a4-aeec-64e237c43ccd.lovable.app";
document.querySelectorAll(".btn").forEach(b => {
  b.addEventListener("click", () => chrome.tabs.create({ url: BASE + b.dataset.path }));
});
document.getElementById("search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") chrome.tabs.create({ url: BASE + "/?q=" + encodeURIComponent(e.target.value) });
});
