document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form")
  
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
  
        const email = document.getElementById("email").value
        const password = document.getElementById("password").value
        const remember = document.getElementById("remember").checked
  
        // In a real application, you would send this data to a server
        // For this demo, we'll simulate a successful login
  
        // Simple validation
        if (!email || !password) {
          alert("Please enter both email and password")
          return
        }
  
        // Simulate login process
        console.log("Logging in with:", { email, password, remember })
  
        // Store user info in localStorage if remember is checked
        if (remember) {
          localStorage.setItem("edutrack_email", email)
        }
  
        // Simulate successful login
        localStorage.setItem(
          "edutrack_user",
          JSON.stringify({
            name: "John Doe",
            email: email,
            role: "teacher",
          }),
        )
  
        // Redirect to dashboard
        window.location.href = "dashboard.html"
      })
    }
  
    // Check if user is already logged in
    const user = localStorage.getItem("edutrack_user")
    if (user && window.location.pathname.includes("login.html")) {
      // Redirect to dashboard if already logged in
      window.location.href = "dashboard.html"
    }
  })
  
  