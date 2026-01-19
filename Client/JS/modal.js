document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const modal = document.getElementById("uploadModal");
  const modalContent = document.getElementById("modalContent");
  const fileInput = document.getElementById("fileInput");

  if (!form || !modal || !modalContent || !fileInput) return;

  // === Handle form submission ===
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop normal form submit

    // ⚠️ Check if a file is uploaded first
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("⚠️ Please attach at least one file before submitting.");
      return; // ❌ STOP: no modal, no redirect
    }

    // STEP 1: Show modal + loading spinner
    modal.style.display = "flex";
    modalContent.innerHTML = `
      <div class="loader"></div>
      <h3 id="modalMessage">Uploading Document...</h3>
    `;

    // STEP 2: Simulate upload (2 seconds)
    setTimeout(() => {
      modalContent.innerHTML = `
        <h3 class="modal-success">✅ Document Uploaded Successfully!</h3>
        <button class="btn btn--success" id="closeModalBtn">OK</button>`;

      const closeModalBtn = document.getElementById("closeModalBtn");

      // ✅ Click OK button
      closeModalBtn.addEventListener("click", redirectToDashboard);

      // ✅ Press any key
      document.addEventListener("keydown", redirectToDashboard);
    }, 2000);
  });

  // === Redirect function ===
  function redirectToDashboard() {
    window.location.href = "documents.html";
  }
});
