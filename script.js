const API_BASE = "http://localhost:8001";

const state = { courseId: null, tab: "assignments" };

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

function openFilePicker(btn) {
  const input = document.createElement('input');
  input.type = 'file';

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;

    try {
      btn.before(file.name + " ");
      btn.before(document.createElement("br"));
      btn.textContent = "(submitted)";
      btn.className = 'w-32 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded';

      const contents = await file.text();

      console.log('File successfully opened and read!');
      console.log('File content:', contents);
    } catch (error) {
      console.error('Failed to open/read file:', error);
    }
  });

  input.click();
}

async function renderSidebar() {
  const container = document.getElementById("course-list");
  const courses = await apiGet("/courses");
  container.replaceChildren();

  const requested = Number(new URLSearchParams(location.search).get("course"));
  if (courses.some((c) => c.id === requested)) state.courseId = requested;

  if (courses.length && state.courseId === null) {
    state.courseId = courses[0].id;
  }

  for (const c of courses) {
    const link = el("a", c.code);
    link.href = "#";
    link.onclick = (e) => {
      e.preventDefault();
      selectCourse(c.id);
    };
    container.appendChild(link);
  }
}

function selectCourse(courseId) {
  state.courseId = courseId;
  renderMain();
}

async function renderMain() {
  if (state.courseId === null) return;

  const course = await apiGet(`/courses/${state.courseId}`, {});

  const header = document.getElementById("course-header");
  header.replaceChildren();
  header.appendChild(el("h1", `${course.code || ""} - ${course.name || ""}`));
  header.appendChild(el("h1", `${course.instructor || ""} | ${course.term || ""}`));

  const btn = document.getElementById('notifButton');

  btn.addEventListener('click', () => {
    if (btn.classList.contains('bg-green-400')) {
      btn.classList.toggle('bg-green-400');
      btn.classList.toggle('hover:bg-green-500');
      btn.classList.toggle('bg-red-400');
      btn.classList.toggle('hover:bg-red-500');
    } else if (btn.classList.contains('bg-red-400')) {
      btn.classList.toggle('bg-red-400');
      btn.classList.toggle('hover:bg-red-500');
      btn.classList.toggle('bg-green-400');
      btn.classList.toggle('hover:bg-green-500');
    }
  });

  renderTabs();
  renderPanel();
}

function renderTabs() {
  const tabs = document.getElementById("tabs");
  tabs.className = "tabs";
  tabs.replaceChildren();

  const names = [
    ["assignments", "Assignments"],
    ["announcements", "Announcements"],
    ["grades", "Grades"],
  ];
  for (const [key, label] of names) {
    const btn = el("button", label);
    if (state.tab === key) btn.className = "active";
    btn.onclick = () => {
      state.tab = key;
      renderTabs();
      renderPanel();
    };
    tabs.appendChild(btn);
  }
}

async function renderPanel() {
  const panel = document.getElementById("panel");
  panel.replaceChildren();

  if (state.tab === "assignments") await renderAssignments(panel);
  else if (state.tab === "announcements") await renderAnnouncements(panel);
  else await renderGrades(panel);
}

async function renderAssignments(panel) {
  const assignments = await apiGet(`/courses/${state.courseId}/assignments`);

  for (const a of assignments) {
    let label = `${a.title} - due ${a.due.slice(0, 10)} - ${a.points} pts`;
    panel.appendChild(el("div", label));
    const btn = document.createElement('button');
    btn.type = 'button';
    if (a.submitted) {
      btn.textContent = "(submitted)";
      btn.className = 'w-32 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded';
    }
    else {
      btn.textContent = "Submit";
      btn.className = 'w-32 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded';
    }
    btn.onclick = () => {
      openFilePicker(btn);
    };
    panel.appendChild(btn);
  }
}

async function renderAnnouncements(panel) {
  const announcements = await apiGet(`/courses/${state.courseId}/announcements`);

  for (const a of announcements) {
    panel.appendChild(el("div", a.title));
    panel.appendChild(el("div", a.body));
    panel.appendChild(document.createElement("hr"));
  }
}

async function renderGrades(panel) {
  const grades = await apiGet(`/courses/${state.courseId}/grades`);

  if (!grades.length) {
    panel.appendChild(el("div", "No grades posted yet."));
    return;
  }

  const table = el("table");
  const head = el("tr");
  for (const h of ["Assignment", "Score", "Points"]) head.appendChild(el("th", h));
  table.appendChild(head);

  for (const g of grades) {
    const row = el("tr");
    row.appendChild(el("td", g.assignment));
    row.appendChild(el("td", String(g.score)));
    row.appendChild(el("td", String(g.points)));
    table.appendChild(row);
  }
  panel.appendChild(table);
}

async function init() {
  await renderSidebar();
  await renderMain();
}

init();
