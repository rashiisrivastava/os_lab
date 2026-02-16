document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const role = document.getElementById("role").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    if (
        (role === "student" && password === "student123") ||
        (role === "instructor" && password === "admin123")
    ) {
        const user = {
            role: role
        };

        localStorage.setItem("user", JSON.stringify(user));

        window.location.href = "../module1-cpu-scheduling/index.html";
    } else {
        error.innerText = "Invalid credentials ❌";
        error.style.display = "block";
    }
});
