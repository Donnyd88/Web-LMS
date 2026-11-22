let all_materials_data = [];
let toast_timeout_id = null;

async function api_get(endpoint) {
    try {
        const response = await fetch(`http://localhost:8001${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch failed with error: ", error);
        return null;
    }
}

//Shows a 6-second Undo banner whenever a user toggles Purchased status
function show_undo_toast(message, undo_callback) {
    const toast_region = document.getElementById("toast-region");
    if (toast_timeout_id) {
        clearTimeout(toast_timeout_id);
    }

    toast_region.innerHTML = "";

    const toast = document.createElement("div");
    toast.className = "bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 flex items-center gap-4";

    const text = document.createElement("span");
    text.className = "text-sm font-medium";
    text.textContent = message;

    const undo_btn = document.createElement("button");
    undo_btn.type = "button";
    undo_btn.className = "bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white text-white text-sm font-bold px-3 py-1 rounded";
    undo_btn.textContent = "Undo";
    undo_btn.addEventListener("click", () => {
        clearTimeout(toast_timeout_id);
        toast_region.innerHTML = "";
        undo_callback();
    });

    toast.appendChild(text);
    toast.appendChild(undo_btn);
    toast_region.appendChild(toast);

    toast_timeout_id = setTimeout(() => {
        toast_region.innerHTML = "";
    }, 6000);
}


function populate_course_filter(materials_data) {
    const course_select = document.getElementById("course-filter");
    course_select.innerHTML = '<option value="all">All Courses</option>';

    materials_data.forEach(course => {
        const option = document.createElement("option");
        option.value = course.code || "";
        option.textContent = `${course.code || ""} - ${course.course_name || ""}`;
        course_select.appendChild(option);
    });
}

function render_filtered_materials() {
    const container = document.getElementById("materials-container");
    const search_query = document.getElementById("material-search").value.trim().toLowerCase();
    const selected_course = document.getElementById("course-filter").value;
    const required_only = document.getElementById("required-only-toggle").checked;
    const unpurchased_only = document.getElementById("unpurchased-only-toggle").checked;

    if (!all_materials_data || all_materials_data.length === 0) {
        container.innerHTML = '<p class="text-gray-800 font-medium">No materials uploaded yet.</p>';
        return;
    }

    container.innerHTML = "";
    const book_template = document.getElementById("book-template");
    let total_rendered_books = 0;

    all_materials_data.forEach((course, index) => {
        if (selected_course !== "all" && course.code !== selected_course) {
            return;
        }

        const raw_materials = course.class_materials || [];

    
        const sorted_materials = [...raw_materials].sort((a, b) => {
            const a_req = String(a["Required"] || "").toLowerCase() === "true" ? 1 : 0;
            const b_req = String(b["Required"] || "").toLowerCase() === "true" ? 1 : 0;
            return b_req - a_req;
        });

     
        const filtered_materials = sorted_materials.filter(book => {
            const is_required = String(book["Required"] || "").toLowerCase() === "true";
            const is_purchased = Boolean(book["Purchased"]);
            const name = (book["Book name"] || "").toLowerCase();
            const author = (book["Author"] || "").toLowerCase();
            const isbn = String(book["Isbn"] || book["ISBN"] || "").toLowerCase();

            if (required_only && !is_required) return false;
            if (unpurchased_only && is_purchased) return false;
            if (search_query && !name.includes(search_query) && !author.includes(search_query) && !isbn.includes(search_query)) {
                return false;
            }
            return true;
        });

        if (filtered_materials.length === 0) {
            return;
        }

        total_rendered_books += filtered_materials.length;

     
        const card = document.createElement("section");
        const headingId = `course-heading-${index}`;
        card.setAttribute("aria-labelledby", headingId);
        card.className = "w-full mb-8 p-5 shadow-md border border-gray-300 border-b-4 border-b-gray-500 rounded-lg bg-white flex flex-col";

      
        const header_row = document.createElement("div");
        header_row.className = "flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-gray-200";

        const title = document.createElement("h2");
        title.id = headingId;
        title.className = "text-2xl font-bold text-gray-900";
        title.textContent = `${course.code || ""} - ${course.course_name || ""}`;

        const required_books = raw_materials.filter(b => String(b["Required"] || "").toLowerCase() === "true");
        const owned_required = required_books.filter(b => Boolean(b["Purchased"])).length;

        const progress_pill = document.createElement("span");
        progress_pill.className = "text-sm font-semibold px-3 py-1 rounded bg-gray-100 border border-gray-300 text-gray-900";
        progress_pill.textContent = `Required Texts Owned: ${owned_required} of ${required_books.length}`;

        header_row.appendChild(title);
        header_row.appendChild(progress_pill);
        card.appendChild(header_row);

        // Wrapping flex container (prevents horizontal clipping at 200% zoom)
        const row_of_books = document.createElement("div");
        row_of_books.className = "w-full flex flex-row flex-wrap gap-6";

        filtered_materials.forEach(book => {
            const book_name = (book["Book name"] || "Unknown Title").trim();
            const book_ISBN = book["Isbn"] || book["ISBN"] || "N/A";
            const book_author = book["Author"] || "Unknown";
            const book_edition = book["Edition"] || "N/A";
            const book_link = book["Link"] || "";
            const has_image = Boolean(book["Image"]);
            const book_image = book["Image"] || "https://via.placeholder.com/120x160?text=No+Cover";
            const is_required = String(book["Required"] || "").toLowerCase() === "true";
            const is_purchased = Boolean(book["Purchased"]);

            const book_template_clone = book_template.content.cloneNode(true);
            const article = book_template_clone.querySelector(".book-card");

  
            if (is_purchased) {
                article.classList.remove("bg-gray-50");
                article.classList.add("bg-green-50", "border-green-600");
            }

       
            book_template_clone.querySelector(".book-title").textContent = book_name;
            book_template_clone.querySelector(".book-author").textContent = `Author: ${book_author}`;
            book_template_clone.querySelector(".book-edition").textContent = `Edition: ${book_edition}`;
            book_template_clone.querySelector(".book-isbn").textContent = `ISBN: ${book_ISBN}`;

            // alt text
            const cover_img = book_template_clone.querySelector(".book-cover");
            cover_img.src = book_image;
            cover_img.alt = has_image
                ? `Cover of ${book_name} by ${book_author}`
                : `No cover image available for ${book_name}`;

           
            const button_container = book_template_clone.querySelector(".button-container");
            const store_hint = book_template_clone.querySelector(".store-hint");

            if (book_link) {
                const link_element = document.createElement("a");
                link_element.href = book_link;
                link_element.target = "_blank";
                link_element.rel = "noopener noreferrer";
                link_element.setAttribute("aria-label", `Buy ${book_name} (opens external store in a new tab)`);
                link_element.className = "w-full block text-center underline bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 text-white font-semibold py-1.5 px-2 rounded";
                link_element.textContent = "Buy (New Tab)";

              
                link_element.addEventListener("click", event => {
                    if (book["Purchased"]) {
                        const proceed = window.confirm(`You already marked "${book_name}" as Purchased. Open the store listing anyway?`);
                        if (!proceed) {
                            event.preventDefault();
                        }
                    } else if (!is_required) {
                        const proceed = window.confirm(`"${book_name}" is listed as Optional for ${course.code}. Continue to store?`);
                        if (!proceed) {
                            event.preventDefault();
                        }
                    }
                });

                button_container.appendChild(link_element);
                store_hint.textContent = "Opens external store";
            } else {
                const turned_off_button = document.createElement("button");
                turned_off_button.type = "button";
                turned_off_button.disabled = true;
                turned_off_button.setAttribute("aria-label", `Buy ${book_name} (unavailable)`);
                turned_off_button.className = "w-full bg-gray-200 border border-gray-400 text-gray-800 font-semibold py-1.5 px-2 rounded cursor-not-allowed";
                turned_off_button.textContent = "Unavailable";
                button_container.appendChild(turned_off_button);
                store_hint.textContent = "No store link listed";
            }

           
            const badge_container = book_template_clone.querySelector(".badge-container");
            const badge = document.createElement("span");

            if (is_required) {
                badge.className = "bg-red-700 text-white border-2 border-red-900 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded w-max";
                badge.textContent = "Required";
            } else {
                badge.className = "bg-slate-100 text-slate-900 border-2 border-dashed border-slate-600 text-xs font-medium px-2.5 py-1 rounded-full w-max";
                badge.textContent = "Optional";
            }
            badge_container.appendChild(badge);

            if (is_purchased) {
                const owned_badge = document.createElement("span");
                owned_badge.className = "bg-green-800 text-white border-2 border-green-950 text-xs font-bold px-2.5 py-1 rounded w-max";
                owned_badge.textContent = "Owned";
                badge_container.appendChild(owned_badge);
            }

     
            const purchased_checkbox = book_template_clone.querySelector(".purchased-checkbox");
            const purchased_text = book_template_clone.querySelector(".purchased-text");
            purchased_checkbox.checked = is_purchased;
            purchased_text.textContent = is_purchased ? "Purchased" : "Mark as Purchased";

            purchased_checkbox.addEventListener("change", () => {
                const previous_state = Boolean(book["Purchased"]);
                book["Purchased"] = purchased_checkbox.checked;
                render_filtered_materials();

                const action_label = book["Purchased"]
                    ? `Marked "${book_name}" as purchased.`
                    : `Unmarked "${book_name}" as purchased.`;

                show_undo_toast(action_label, () => {
                    book["Purchased"] = previous_state;
                    render_filtered_materials();
                });
            });

            row_of_books.appendChild(book_template_clone);
        });

        card.appendChild(row_of_books);
        container.appendChild(card);
    });



    if (total_rendered_books === 0) {
        const empty_box = document.createElement("div");
        empty_box.className = "p-6 bg-gray-100 border border-gray-300 rounded-lg text-center flex flex-col items-center gap-3";

        const empty_msg = document.createElement("p");
        empty_msg.className = "text-gray-900 font-semibold";
        empty_msg.textContent = "No books match your current search or filter settings.";

        const reset_btn = document.createElement("button");
        reset_btn.type = "button";
        reset_btn.className = "bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 text-white font-semibold px-4 py-1.5 rounded";
        reset_btn.textContent = "Clear All Filters";
        reset_btn.addEventListener("click", () => {
            document.getElementById("material-search").value = "";
            document.getElementById("course-filter").value = "all";
            document.getElementById("required-only-toggle").checked = false;
            document.getElementById("unpurchased-only-toggle").checked = false;
            render_filtered_materials();
        });

        empty_box.appendChild(empty_msg);
        empty_box.appendChild(reset_btn);
        container.appendChild(empty_box);
    }
}

async function init_materials_page() {
    const data = await api_get("/Materials");
    all_materials_data = data || [];

    populate_course_filter(all_materials_data);
    render_filtered_materials();

    document.getElementById("material-search").addEventListener("input", render_filtered_materials);
    document.getElementById("course-filter").addEventListener("change", render_filtered_materials);
    document.getElementById("required-only-toggle").addEventListener("change", render_filtered_materials);
    document.getElementById("unpurchased-only-toggle").addEventListener("change", render_filtered_materials);
}

document.addEventListener("DOMContentLoaded", init_materials_page);