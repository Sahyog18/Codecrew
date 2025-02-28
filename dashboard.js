import QRCode from "qrcode"

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem("edutrack_user") || "{}")
  if (!user.email && !window.location.pathname.includes("login.html")) {
    // Redirect to login if not logged in
    window.location.href = "login.html"
    return
  }

  // Set user info in the sidebar
  const teacherName = document.getElementById("teacher-name")
  const teacherEmail = document.getElementById("teacher-email")

  if (teacherName && teacherEmail) {
    teacherName.textContent = user.name || "Teacher Name"
    teacherEmail.textContent = user.email || "teacher@example.com"
  }

  // Handle logout
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      localStorage.removeItem("edutrack_user")
      window.location.href = "login.html"
    })
  }

  // QR Code generation
  const qrForm = document.getElementById("qr-form")
  const qrcodeDiv = document.getElementById("qrcode")
  const downloadBtn = document.getElementById("download-qr")
  const printBtn = document.getElementById("print-qr")
  const newQrBtn = document.getElementById("new-qr")
  const expiryCountdown = document.getElementById("expiry-countdown")

  if (qrForm && qrcodeDiv) {
    qrForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const classSelect = document.getElementById("class-select")
      const lectureTitle = document.getElementById("lecture-title")
      const expiryTime = document.getElementById("expiry-time")
      const spreadsheetId = document.getElementById("spreadsheet-id")

      if (!classSelect.value || !lectureTitle.value || !expiryTime.value) {
        alert("Please fill in all required fields")
        return
      }

      // Generate a unique code for this session
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2)

      // Create QR code data
      const qrData = JSON.stringify({
        class: classSelect.value,
        title: lectureTitle.value,
        teacher: user.email,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        expiry: new Date(Date.now() + Number.parseInt(expiryTime.value) * 60 * 1000).toISOString(),
      })

      // Generate QR code
      qrcodeDiv.innerHTML = ""
      QRCode.toCanvas(qrcodeDiv, qrData, { width: 200 }, (error) => {
        if (error) {
          console.error(error)
          alert("Error generating QR code")
          return
        }

        console.log("QR code generated!")

        // Enable buttons
        downloadBtn.disabled = false
        printBtn.disabled = false
        newQrBtn.disabled = false

        // Start countdown
        startCountdown(Number.parseInt(expiryTime.value) * 60)

        // Store session data
        localStorage.setItem("current_session", qrData)

        // Update attendance stats
        document.getElementById("total-students").textContent = getClassSize(classSelect.value)
        document.getElementById("present-students").textContent = "0"
        document.getElementById("absent-students").textContent = getClassSize(classSelect.value)
        document.getElementById("attendance-rate").textContent = "0%"
      })
    })

    // Download QR code
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        const canvas = qrcodeDiv.querySelector("canvas")
        if (canvas) {
          const image = canvas.toDataURL("image/png")
          const link = document.createElement("a")
          link.href = image
          link.download = "attendance-qr.png"
          link.click()
        }
      })
    }

    // Print QR code
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        const canvas = qrcodeDiv.querySelector("canvas")
        if (canvas) {
          const image = canvas.toDataURL("image/png")
          const printWindow = window.open("", "_blank")
          printWindow.document.write(`
            <html>
              <head>
                <title>Attendance QR Code</title>
                <style>
                  body { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
                  img { max-width: 80%; }
                  h2 { font-family: Arial, sans-serif; }
                </style>
              </head>
              <body>
                <h2>Scan to mark attendance</h2>
                <img src="${image}" />
                <p>Generated on ${new Date().toLocaleString()}</p>
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 500)
        }
      })
    }

    // Generate new QR code
    if (newQrBtn) {
      newQrBtn.addEventListener("click", () => {
        qrcodeDiv.innerHTML = ""
        downloadBtn.disabled = true
        printBtn.disabled = true
        newQrBtn.disabled = true
        qrForm.reset()
        clearInterval(window.countdownInterval)
        expiryCountdown.textContent = "60:00"
      })
    }
  }

  // Google Sheets API integration
  const googleAuthButton = document.getElementById("google-auth-button")
  if (googleAuthButton) {
    // Initialize Google API client
    function initGoogleAPI() {
      gapi.load("client:auth2", () => {
        gapi.client
          .init({
            apiKey: "YOUR_API_KEY", // In a real app, this would be stored securely
            clientId: "YOUR_CLIENT_ID", // In a real app, this would be stored securely
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            scope: "https://www.googleapis.com/auth/spreadsheets",
          })
          .then(() => {
            // Render the sign-in button
            googleAuthButton.innerHTML = ""
            const authInstance = gapi.auth2.getAuthInstance()

            if (authInstance.isSignedIn.get()) {
              googleAuthButton.innerHTML = '<button class="btn outline-btn">Connected to Google Sheets</button>'
            } else {
              const button = document.createElement("button")
              button.className = "btn outline-btn"
              button.textContent = "Connect to Google Sheets"
              button.addEventListener("click", () => {
                authInstance.signIn()
              })
              googleAuthButton.appendChild(button)
            }

            // Listen for sign-in state changes
            authInstance.isSignedIn.listen(updateSigninStatus)
          })
      })
    }

    // Update UI based on sign-in status
    function updateSigninStatus(isSignedIn) {
      if (isSignedIn) {
        googleAuthButton.innerHTML = '<button class="btn outline-btn">Connected to Google Sheets</button>'
      } else {
        const button = document.createElement("button")
        button.className = "btn outline-btn"
        button.textContent = "Connect to Google Sheets"
        button.addEventListener("click", () => {
          gapi.auth2.getAuthInstance().signIn()
        })
        googleAuthButton.innerHTML = ""
        googleAuthButton.appendChild(button)
      }
    }

    // Load the Google API script
    const script = document.createElement("script")
    script.src = "https://apis.google.com/js/api.js"
    script.onload = initGoogleAPI
    document.body.appendChild(script)
  }

  // Helper functions
  function startCountdown(seconds) {
    clearInterval(window.countdownInterval)

    function updateCountdown() {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      expiryCountdown.textContent = `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`

      if (seconds <= 0) {
        clearInterval(window.countdownInterval)
        qrcodeDiv.innerHTML = '<div style="text-align: center; color: #ef4444;">QR Code Expired</div>'
        downloadBtn.disabled = true
        printBtn.disabled = true
      }

      seconds--
    }

    updateCountdown()
    window.countdownInterval = setInterval(updateCountdown, 1000)
  }

  function getClassSize(classId) {
    // Mock data - in a real app, this would come from a database
    const classSizes = {
      cs101: 35,
      cs201: 28,
      math101: 42,
      eng101: 30,
    }

    return classSizes[classId] || 0
  }

  // Simulate receiving attendance data (for demo purposes)
  function simulateAttendance() {
    const currentSession = localStorage.getItem("current_session")
    if (!currentSession) return

    const sessionData = JSON.parse(currentSession)
    const attendanceList = document.getElementById("attendance-list")
    if (!attendanceList) return

    // Clear empty state if present
    const emptyState = attendanceList.querySelector(".empty-state")
    if (emptyState) {
      attendanceList.innerHTML = ""
    }

    // Mock student data
    const students = [
      { id: "S1001", name: "Alice Johnson" },
      { id: "S1002", name: "Bob Smith" },
      { id: "S1003", name: "Charlie Brown" },
      { id: "S1004", name: "Diana Prince" },
      { id: "S1005", name: "Edward Jones" },
    ]

    // Randomly select a student
    const randomStudent = students[Math.floor(Math.random() * students.length)]

    // Check if student already marked attendance
    const existingRow = Array.from(attendanceList.querySelectorAll("tr")).find((row) => {
      return row.querySelector("td:first-child").textContent === randomStudent.id
    })

    if (existingRow) return

    // Create new attendance record
    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${randomStudent.id}</td>
      <td>${randomStudent.name}</td>
      <td>${new Date().toLocaleTimeString()}</td>
      <td><span class="status-badge present">Present</span></td>
    `

    attendanceList.appendChild(row)

    // Update stats
    const totalStudents = Number.parseInt(document.getElementById("total-students").textContent)
    const presentStudents = attendanceList.querySelectorAll("tr").length

    document.getElementById("present-students").textContent = presentStudents
    document.getElementById("absent-students").textContent = totalStudents - presentStudents
    document.getElementById("attendance-rate").textContent = Math.round((presentStudents / totalStudents) * 100) + "%"
  }

  // Simulate attendance for demo purposes
  if (document.getElementById("attendance-list")) {
    setInterval(simulateAttendance, 5000)
  }
})

