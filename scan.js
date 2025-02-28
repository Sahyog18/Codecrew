// Import Html5Qrcode library.  This assumes you have it included in your HTML via a `<script>` tag.
// If using a module bundler like Webpack or Parcel, you'll need to import it appropriately.
// For example: import Html5Qrcode from 'html5-qrcode';

document.addEventListener("DOMContentLoaded", () => {
    const studentForm = document.getElementById("student-form")
    const studentInfoForm = document.getElementById("student-info-form")
    const scannerContainer = document.getElementById("scanner-container")
    const scanResult = document.getElementById("scan-result")
    const scanError = document.getElementById("scan-error")
  
    let html5QrCode
    let studentData = {}
  
    // Handle student form submission
    if (studentForm) {
      studentForm.addEventListener("submit", (e) => {
        e.preventDefault()
  
        // Get student info
        studentData = {
          id: document.getElementById("student-id").value,
          name: document.getElementById("student-name").value,
          email: document.getElementById("student-email").value,
          timestamp: new Date().toISOString(),
        }
  
        // Store student data in session storage
        sessionStorage.setItem("student_data", JSON.stringify(studentData))
  
        // Hide form and show scanner
        studentInfoForm.style.display = "none"
        scannerContainer.style.display = "block"
  
        // Initialize scanner
        initScanner()
      })
    }
  
    // Initialize QR code scanner
    function initScanner() {
      html5QrCode = new Html5Qrcode("scanner-preview")
      const config = { fps: 10, qrbox: 250 }
  
      html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
    }
  
    // Handle successful scan
    function onScanSuccess(decodedText) {
      // Stop scanner
      html5QrCode.stop()
  
      try {
        // Parse QR code data
        const qrData = JSON.parse(decodedText)
  
        // Check if QR code is valid and not expired
        const expiry = new Date(qrData.expiry)
        if (expiry < new Date()) {
          showError("This QR code has expired. Please ask your teacher for a new code.")
          return
        }
  
        // Combine student data with QR data
        const attendanceData = {
          ...studentData,
          class: qrData.class,
          title: qrData.title,
          teacher: qrData.teacher,
          sessionId: qrData.sessionId,
        }
  
        // In a real app, you would send this data to a server
        console.log("Attendance recorded:", attendanceData)
  
        // Store in local storage for demo purposes
        const attendanceRecords = JSON.parse(localStorage.getItem("attendance_records") || "[]")
        attendanceRecords.push(attendanceData)
        localStorage.setItem("attendance_records", JSON.stringify(attendanceRecords))
  
        // Show success message
        showSuccess(qrData)
      } catch (error) {
        console.error("Error processing QR code:", error)
        showError("Invalid QR code format. Please try again.")
      }
    }
  
    // Handle scan failure
    function onScanFailure(error) {
      // This is called when QR code scanning fails
      // We don't need to show an error for every frame that doesn't contain a QR code
      console.log("QR code scanning in progress...")
    }
  
    // Show success message
    function showSuccess(qrData) {
      scannerContainer.style.display = "none"
      scanResult.style.display = "block"
  
      document.getElementById("result-name").textContent = studentData.name
      document.getElementById("result-class").textContent = `${qrData.class} - ${qrData.title}`
      document.getElementById("result-time").textContent = new Date().toLocaleString()
    }
  
    // Show error message
    function showError(message) {
      scannerContainer.style.display = "none"
      scanError.style.display = "block"
      document.getElementById("error-message").textContent = message
    }
  
    // Handle "Scan Another" button
    const scanAnotherBtn = document.getElementById("scan-another")
    if (scanAnotherBtn) {
      scanAnotherBtn.addEventListener("click", () => {
        scanResult.style.display = "none"
        studentInfoForm.style.display = "block"
        studentForm.reset()
      })
    }
  
    // Handle "Try Again" button
    const tryAgainBtn = document.getElementById("try-again")
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener("click", () => {
        scanError.style.display = "none"
        scannerContainer.style.display = "block"
        initScanner()
      })
    }
  
    // Handle "Switch Camera" button
    const switchCameraBtn = document.getElementById("switch-camera")
    if (switchCameraBtn) {
      switchCameraBtn.addEventListener("click", () => {
        if (html5QrCode) {
          html5QrCode.stop().then(() => {
            const currentFacingMode = html5QrCode._localMediaStream.getVideoTracks()[0].getSettings().facingMode
            const newFacingMode = currentFacingMode === "environment" ? "user" : "environment"
  
            html5QrCode.start({ facingMode: newFacingMode }, { fps: 10, qrbox: 250 }, onScanSuccess, onScanFailure)
          })
        }
      })
    }
  
    // Handle "Cancel" button
    const cancelScanBtn = document.getElementById("cancel-scan")
    if (cancelScanBtn) {
      cancelScanBtn.addEventListener("click", () => {
        if (html5QrCode) {
          html5QrCode.stop()
        }
        scannerContainer.style.display = "none"
        studentInfoForm.style.display = "block"
      })
    }
  })
  
  