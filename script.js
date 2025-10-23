document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll("nav a, #mobileMenu a");
  const currentPage = window.location.pathname.split("/").pop();
  const mobileBtn = document.getElementById("mobileMenuButton");
  const mobileMenu = document.getElementById("mobileMenu");

  navLinks.forEach(link => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("text-green-700", "font-semibold", "border-b-2", "border-green-600", "pb-1");
      link.classList.remove("text-gray-600");
    } else {
      link.classList.remove("text-green-700", "font-semibold", "border-b-2", "border-green-600", "pb-1");
      link.classList.add("text-gray-600");
    }
  });

  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  const mobileLinks = mobileMenu.querySelectorAll("a");
  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });
});

// =============================
// 📸 Bagian Kamera & Upload
// =============================
document.addEventListener("DOMContentLoaded", function () {
  const uploadBtn = document.getElementById("uploadBtn");
  const cameraBtn = document.getElementById("cameraBtn");
  const captureBtn = document.getElementById("captureBtn");
  const cancelCameraBtn = document.getElementById("cancelCameraBtn");
  const switchCameraBtn = document.getElementById("switchCameraBtn");
  const fileInput = document.getElementById("fileInput");
  const previewImage = document.getElementById("previewImage");
  const videoElement = document.getElementById("videoElement");
  const canvasElement = document.getElementById("canvasElement");
  const placeholderText = document.getElementById("placeholderText");
  const resultDiv = document.getElementById("resultState");
  const initialState = document.getElementById("initialState");
  const classifyBtn = document.getElementById("classifyBtn");

  let currentFacingMode = "environment";

  uploadBtn.addEventListener("click", () => fileInput.click());
  cameraBtn.addEventListener("click", startCamera);
  captureBtn.addEventListener("click", captureImage);
  cancelCameraBtn.addEventListener("click", stopCamera);
  switchCameraBtn.addEventListener("click", switchCamera);
  fileInput.addEventListener("change", handleFileUpload);

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        previewImage.src = event.target.result;
        previewImage.classList.remove("hidden");
        placeholderText.classList.add("hidden");
        videoElement.classList.add("hidden");
        canvasElement.classList.add("hidden");
        captureBtn.classList.add("hidden");
        cancelCameraBtn.classList.add("hidden");
        switchCameraBtn.classList.add("hidden");
      };
      reader.readAsDataURL(file);
    }
  }

  function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { exact: currentFacingMode } } })
        .then(function (stream) {
          videoElement.srcObject = stream;
          videoElement.classList.remove("hidden");
          previewImage.classList.add("hidden");
          placeholderText.classList.add("hidden");
          captureBtn.classList.remove("hidden");
          cancelCameraBtn.classList.remove("hidden");
          switchCameraBtn.classList.remove("hidden");
        })
        .catch(function () {
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(function (stream) {
              videoElement.srcObject = stream;
              videoElement.classList.remove("hidden");
              previewImage.classList.add("hidden");
              placeholderText.classList.add("hidden");
              captureBtn.classList.remove("hidden");
              cancelCameraBtn.classList.remove("hidden");
              switchCameraBtn.classList.remove("hidden");
            })
            .catch(err => alert("Tidak dapat mengakses kamera: " + err.message));
        });
    } else {
      alert("Browser Anda tidak mendukung akses kamera.");
    }
  }

  function switchCamera() {
    stopCamera();
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera();
  }

  function captureImage() {
    if (videoElement.classList.contains("hidden")) return;
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasElement.getContext("2d").drawImage(videoElement, 0, 0);
    previewImage.src = canvasElement.toDataURL("image/png");
    previewImage.classList.remove("hidden");
    videoElement.classList.add("hidden");
    canvasElement.classList.add("hidden");
    captureBtn.classList.add("hidden");
  }

  function stopCamera() {
    if (videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    videoElement.classList.add("hidden");
    previewImage.classList.add("hidden");
    canvasElement.classList.add("hidden");
    captureBtn.classList.add("hidden");
    cancelCameraBtn.classList.add("hidden");
    switchCameraBtn.classList.add("hidden");
    placeholderText.classList.remove("hidden");
  }

  window.addEventListener("beforeunload", function () {
    if (videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
  });

  // =============================
  // 🧠 Fungsi Utama: Klasifikasi
  // =============================
  window.classifyImage = async function () {
    const canvas = document.getElementById("canvasElement");
    let file;

    if (fileInput.files[0]) {
      file = fileInput.files[0];
    } else if (previewImage.src && previewImage.src.startsWith("data:image")) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      file = new File([blob], "captured.png", { type: "image/png" });
    } else {
      resultDiv.innerHTML = `<p class="text-red-600">Silakan unggah atau ambil gambar terlebih dahulu.</p>`;
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    resultDiv.innerHTML = `
      <div class="flex items-center justify-center text-gray-600 py-6">
        <i class="fas fa-spinner fa-spin text-xl mr-2"></i> Memproses gambar...
      </div>`;
    initialState.classList.add("hidden");
    resultDiv.classList.remove("hidden");

    try {
      const response = await fetch("https://calluu-klasifikasi-padi.hf.space/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Response dari server:", data);

      // 🟡 CASE 1: Gambar bukan daun padi (CLIP OOD)
      if (data.status === "Not Rice Leaf") {
        resultDiv.innerHTML = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
              <div class="bg-yellow-100 p-3 rounded-full mr-4">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
              </div>
              <div>
                <h4 class="font-bold text-yellow-800 mb-1">Gambar Tidak Dikenali</h4>
                <p class="text-yellow-700">${data.message}</p>
              </div>
            </div>
          </div>`;
        return;
      }

      // 🟢 CASE 2: Gambar valid (hasil CNN)
      if (data.results && data.results.length > 0) {
        const main = data.results[0];
        const others = data.results.slice(1);

        let html = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
              <div class="bg-green-100 p-3 rounded-full mr-4">
                <i class="fas fa-info-circle text-green-600 text-xl"></i>
              </div>
              <div>
                <h4 class="font-bold text-green-800 mb-1">Penyakit Terdeteksi</h4>
                <p class="text-green-700" id="diseaseName">${main.label}</p>
                <p class="text-sm text-green-600 mt-2" id="confidenceLevel">
                  Tingkat Kepercayaan: ${Math.round(main.confidence * 100)}%
                </p>
              </div>
            </div>
          </div>`;

        if (others.length > 0) {
          html += `<h4 class="font-semibold text-gray-800 mb-3">Penyakit Lain yang Mungkin:</h4>`;
          html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
          others.forEach(item => {
            html += `
              <div class="disease-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md">
                <div class="flex items-center mb-2">
                  <div class="bg-yellow-100 p-2 rounded-full mr-3">
                    <i class="fas fa-bug text-yellow-600"></i>
                  </div>
                  <p class="font-medium text-gray-800">${item.label}</p>
                </div>
                <p class="text-sm text-gray-600">Kemungkinan: ${Math.round(item.confidence * 100)}%</p>
              </div>`;
          });
          html += `</div>`;
        }

        resultDiv.innerHTML = html;
      } else {
        resultDiv.innerHTML = `<p class="text-red-600">Tidak ada hasil yang bisa ditampilkan.</p>`;
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.innerHTML = `<p class="text-red-600">Terjadi kesalahan saat klasifikasi.</p>`;
    } finally {
      classifyBtn.innerHTML = '<i class="fas fa-microscope mr-2"></i> Klasifikasi Penyakit';
      classifyBtn.disabled = false;
    }
  };
});


