const APP_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwhgFq264rl6g8f0IlC_brwcP4NaZNygiKT3TMIpvJPdoQekbFHKAl4fKZFRsbd_U9f/exec";

// DOM refs
const main = document.getElementById("select-narasumber");
const formElement = document.getElementById("form-absensi");
const form = document.getElementById("attendanceForm");
const getLocationBtn = document.getElementById("getLocationBtn");
const locationInfo = document.getElementById("locationInfo");
const submitBtn = document.getElementById("submitBtn");
const loading = document.getElementById("loading");
const alert = document.getElementById("alert");
const header = document.getElementById("header");
const judul = document.getElementById("judul");
const logo = document.getElementById("logo-sif");
const keteranganForm = document.getElementById("keteranganForm");

let currentLocation = null;
let currentNarasumber = null;

// Data narasumber
const data = [
  {
    name: "Vokasi, Prompting, dan Vibe Coding: Siap menghadapi AI-driven Industry?",
    speaker: "Cycas Rifky",
    startTime: "13:00",
    endTime: "15:00",
    day: 1,
  },
  {
    name: "Cerdas Kelola Uang di Era Digital",
    speaker: "Himawan Adhi",
    startTime: "01:45",
    endTime: "23:59", //"11:30",
    day: 2,
  },
];

// Fungsi untuk memeriksa waktu dan menonaktifkan tombol
function checkTimeAndDisableButtons() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  data.forEach((narasumber, index) => {
    const button = document.getElementById(`narasumber-${index + 1}`);
    if (!button) return;

    const [startHour, startMinute] = narasumber.startTime
      .split(":")
      .map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = narasumber.endTime.split(":").map(Number);
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes) {
      button.disabled = false;
      button.innerText = "Absen";
      button.classList.remove("bg-gray-400", "cursor-not-allowed");
      button.classList.add("bg-[#F4BA35]");
    } else {
      button.disabled = true;
      button.innerText = "Absen Belum Dibuka";
      button.classList.add("bg-gray-400", "cursor-not-allowed");
      button.classList.remove("bg-[#F4BA35]");
    }
  });
}

document
  .getElementById("narasumber-1")
  .addEventListener("click", () => showForm(0));
document
  .getElementById("narasumber-2")
  .addEventListener("click", () => showForm(1));

document.addEventListener("DOMContentLoaded", checkTimeAndDisableButtons);
setInterval(checkTimeAndDisableButtons, 60000);

function showForm(index) {
  currentNarasumber = data[index];
  keteranganForm.innerText = `Form absensi Smart IT Festival untuk ${currentNarasumber.name}. Oleh: ${currentNarasumber.speaker}`;

  header.classList.add(
    "ease-in-out",
    "duration-500",
    "rounded-bl-md",
    "rounded-br-md",
    "flex-row-reverse",
    "pb-1",
    "pt-1",
    "gap-3",
    "justify-left"
  );
  header.classList.remove(
    "flex-col",
    "pb-10",
    "pt-6",
    "gap-5",
    "justify-center"
  );

  judul.classList.add("ease-in-out", "duration-500", "scale-50", "opacity-0");

  logo.classList.add(
    "ease-in-out",
    "duration-500",
    "w-30",
    "justify-left",
    "-ml-2"
  );
  logo.classList.remove("justify-center", "w-full");

  main.classList.add("-translate-y-[100%]", "opacity-0", "hidden");
  formElement.classList.remove("hidden", "opacity-0");
  formElement.classList.add("opacity-100", "z-10", "block");
}

// Lokasi
getLocationBtn.addEventListener("click", function () {
  if (!navigator.geolocation) {
    showLocationError("Geolocation tidak didukung oleh browser ini");
    return;
  }

  this.disabled = true;
  this.innerHTML = `<i class="fas fa-spinner animate-spin"></i> Mendapatkan lokasi...`;

  navigator.geolocation.getCurrentPosition(
    async function (position) {
      currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      getLocationBtn.innerHTML = `<i class="fas fa-spinner animate-spin"></i> Mendapatkan alamat...`;

      const address = await getAddressFromCoords(
        currentLocation.latitude,
        currentLocation.longitude
      );
      currentLocation.address = address || {
        formatted: "Alamat tidak dapat ditemukan",
      };

      showLocationSuccess();
      getLocationBtn.disabled = false;
      getLocationBtn.innerHTML = `<i class="fas fa-circle-check"></i> Lokasi Didapat`;
    },
    function (error) {
      const errorMessages = {
        1: "Izin lokasi ditolak",
        2: "Informasi lokasi tidak tersedia",
        3: "Timeout mendapatkan lokasi",
      };
      showLocationError(errorMessages[error.code] || "Error tidak diketahui");
      getLocationBtn.disabled = false;
      getLocationBtn.innerHTML = `<i class="fas fa-location-dot"></i> Dapatkan Lokasi`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

async function getAddressFromCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "AbsensiApp/1.0" } }
    );
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return { formatted: data.display_name };
  } catch (e) {
    console.error("Error getting address:", e);
    return null;
  }
}

// Event listener: setiap selesai input kode registrasi (blur / Enter)
document
  .getElementById("kode_registrasi")
  .addEventListener("blur", async function () {
    const kode = this.value.trim();
    if (!kode) return;

    try {
      showLoading(true);
      const res = await fetch(
        `${APP_SCRIPT_URL}?kode=${encodeURIComponent(
          kode
        )}&kode=${encodeURIComponent(currentNarasumber.day)}`
      );
      const result = await res.json();

      if (result.status === "error") {
        showAlert(
          "error",
          `<i class="fas fa-circle-xmark"></i> ${result.value}`
        );
        return;
      }

      // Isi elemen form berdasarkan data yang diterima
      const data = result.data;
      if (data) {
        document.getElementById("name").value = data.Nama || "";
        document.getElementById("email").value = data.Email || "";
        document.getElementById("phone").value = data["Nomor Telepon"] || "";
        document.getElementById("institution").value = data.Institusi || "";
      }
    } catch (error) {
      console.error(error);
      showAlert(
        "error",
        `<i class="fas fa-circle-xmark"></i> Gagal mengambil data: ${error.message}`
      );
    } finally {
      showLoading(false);
    }
  });

// Submit form
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  showLoading(true);
  try {
    const kode = document.getElementById("kode_registrasi").value.trim();

    const payload = {
      action: "submitAttendance",
      nim: document.getElementById("nim").value.trim() ?? "",
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      institution: document.getElementById("institution").value.trim(),
      speaker: currentNarasumber?.speaker || "Tidak diketahui",
      kode_registrasi: kode,
      location: currentLocation,
      day: currentNarasumber?.day,
    };

    const res = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.status === "error") {
      showAlert("error", `<i class="fas fa-circle-xmark"></i> ${result.value}`);
    } else {
      showAlert(
        "success",
        `<i class="fas fa-circle-check"></i> ${result.value}`
      );
      form.reset();
      resetForm();
    }
  } catch (error) {
    console.error(error);
    showAlert(
      "error",
      `<i class="fas fa-circle-xmark"></i> Terjadi kesalahan: ${error.message}`
    );
  } finally {
    showLoading(false);
  }
});

function validateForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const institution = document.getElementById("institution").value.trim();
  const kode = document.getElementById("kode_registrasi").value.trim();

  if (!phone || !name || !email || !institution || !kode) {
    showAlert(
      "error",
      `<i class="fas fa-circle-xmark"></i> Semua field wajib harus diisi`
    );
    return false;
  }
  if (!currentNarasumber) {
    showAlert(
      "error",
      `<i class="fas fa-circle-xmark"></i> Silakan pilih narasumber terlebih dahulu`
    );
    return false;
  }
  if (!currentLocation) {
    showAlert("error", `<i class="fas fa-circle-xmark"></i> Lokasi diperlukan`);
    return false;
  }
  return true;
}

function resetForm() {
  currentLocation = null;
  locationInfo.innerHTML = "";
  getLocationBtn.innerHTML = `<i class="fas fa-location-dot"></i> Dapatkan Lokasi`;
  getLocationBtn.disabled = false;
}

function showAlert(type, message) {
  alert.className = `alert alert-${type}`;
  alert.innerHTML = message;
  alert.style.display = "block";
  setTimeout(() => (alert.style.display = "none"), 5000);
}

function showLoading(show) {
  loading.style.display = show ? "block" : "none";
  submitBtn.disabled = show;
}

function showLocationSuccess() {
  locationInfo.innerHTML = `
    <div class="location-status location-success">
      <i class="fas fa-circle-check text-green-500"></i> Lokasi berhasil didapat
    </div>
    <div style="margin-top: 10px; font-size: 14px;">
      <strong>Koordinat:</strong> ${currentLocation.latitude.toFixed(
        6
      )}, ${currentLocation.longitude.toFixed(6)}<br>
      <strong>Akurasi:</strong> ${currentLocation.accuracy.toFixed(0)} meter
      <br><br><strong>Alamat:</strong>
      <div class="address-box">${currentLocation.address.formatted}</div>
    </div>
  `;
}

function showLocationError(message) {
  locationInfo.innerHTML = `
    <div class="location-status location-error">
      <i class="fas fa-circle-xmark text-red-500"></i> ${message}
    </div>
  `;
}
