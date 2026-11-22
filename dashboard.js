const API_BASE = "http://localhost:8001";
const STORAGE_KEY = "dashboardCourseImages";

let pendingCourseId = null;

async function apiGet(path, fallback = []) {
    try {
        const resp = await fetch(API_BASE + path);
        if (!resp.ok) throw new Error(resp.status + " " + resp.statusText);
        clearError();
        return await resp.json();
    } catch (e) {
        showError("Could not reach API: " + e.message);
        return fallback;
    }
}

function showError(msg) { document.getElementById("error").textContent = msg; }
function clearError() { document.getElementById("error").textContent = ""; }

function el(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
}

function loadImages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveImage(courseId, dataUrl) {
    const images = loadImages();
    images[courseId] = dataUrl;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    } catch (e) {
        showError("Could not save image (it may be too large).");
    }
}

function removeImage(courseId) {
    const images = loadImages();
    delete images[courseId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    renderDashboard();
}

function buildCard(course, images) {
    const item = el("div");
    item.className = "course-item";

    const card = el("a");
    card.className = "course-card";
    card.href = `index.html?course=${course.id}`;

    let banner;
    if (images[course.id]) {
        banner = el("img");
        banner.src = images[course.id];
        banner.alt = "";
    } else {
        banner = el("div");
        banner.style.backgroundColor = course.color;
    }
    banner.className = "card-banner";

    const body = el("div");
    body.className = "card-body";

    const code = el("span", course.code);
    code.className = "card-code";

    const term = el("span", course.term);
    term.className = "card-term";

    body.appendChild(code);
    body.appendChild(el("span", course.name));
    body.appendChild(term);

    card.appendChild(banner);
    card.appendChild(body);
    item.appendChild(card);
    return item;
}

const courseDialog = document.getElementById("course-picker");

function buildPicker(courses, images) {
    const courseList = document.getElementById("course-picker-list");
    courseList.replaceChildren();

    for (const course of courses) {
        const row = el("div");
        row.className = "picker-row";

        const courseButton = el("button", `${course.code} - ${course.name}`);
        courseButton.onclick = () => {
            pendingCourseId = course.id;
            courseDialog.close();
            document.getElementById("image-input").click();
        };
        row.appendChild(courseButton);

        if (images[course.id]) {
            const removeButton = el("button", "Remove image");
            removeButton.setAttribute("aria-label", `Remove image from ${course.code}`);
            removeButton.onclick = () => removeImage(course.id);
            row.appendChild(removeButton);
        }

        courseList.appendChild(row);
    }
}

document.getElementById("change-images-btn").onclick = () => courseDialog.showModal();
document.getElementById("course-picker-cancel").onclick = () => courseDialog.close();

async function renderDashboard() {
    const grid = document.getElementById("card-grid");
    const courses = await apiGet("/courses");
    const images = loadImages();

    buildPicker(courses, images);

    grid.replaceChildren();
    for (const c of courses) {
        grid.appendChild(buildCard(c, images));
    }
}

document.getElementById("image-input").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        saveImage(pendingCourseId, reader.result);
        renderDashboard();
    };
    reader.readAsDataURL(file);
};

renderDashboard();