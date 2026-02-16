document.addEventListener("DOMContentLoaded", () => {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "../auth/login.html";
        return;
    }

    const roleBtn = document.querySelector(".role-display");
    if (roleBtn) {
        roleBtn.innerText = user.role.toUpperCase();
    }
});

function logout() {
    localStorage.removeItem("user");
    window.location.href = "../auth/login.html";
}
