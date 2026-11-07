async function api_get(endpoint){
    try{
        const response = await fetch (`http://localhost:8001${endpoint}`);
        return await response.json();
    } catch (error){
        console.error("Fetch failed with error: ", error)
        return null;

    }
}

async function render_materials_page() {
    const container = document.getElementById("materials-container");

    const materials_data = await api_get("/Materials");

    if(!materials_data || materials_data.length === 0){
        container.innerHTML = '<div class="text-gray-700">No materials uploaded yet.</div>';
        return;

    }

    container.innerHTML = "";

    //Starting template of html
    const book_template = document.getElementById("book-template");

    materials_data.forEach(course =>{

        //card
        const card = document.createElement("div");
        card.className = "w-full mb-6 p-4 shadow-md border rounded-lg bg-white flex flex-col";

        const title = document.createElement("h2");
        title.className = "text-2xl font-bold mb-4";
        title.textContent = `${course.code || ''} - ${course.course_name || ''}`;
        card.appendChild(title);

        //row of books, if they are multiple
        const row_of_books = document.createElement('div');
        row_of_books.className= "w-full flex flex-row flex-nowrap overflow-x-auto gap-6 pb-4";


        const materials = course.class_materials || [];
        materials.forEach(book =>{

            const book_name = book["Book name"] || "Unknown Title";
            const book_ISBN = book["Isbn"] || book["ISBN"] || "N/A";
            const book_author = book["Author"] || "Unknown";
            const book_edition = book["Edition"] || "N/A";
            const book_link = book["Link"] || "";
            let book_image = book["Image"] || "https://via.placeholder.com/120x160?text=No+Cover";

            const is_required = String(book["Required"] || "").toLowerCase() === "true";

            //clone template
            const book_template_clone = book_template.content.cloneNode(true);

            book_template_clone.querySelector(".book-title").textContent = book_name;
            book_template_clone.querySelector(".book-author").textContent = `Author: ${book_author}`;
            book_template_clone.querySelector(".book-edition").textContent = `Edition: ${book_edition}`;
            book_template_clone.querySelector(".book-isbn").textContent = `ISBN: ${book_ISBN}`;
            book_template_clone.querySelector(".book-cover").src = book_image;


            //Buy button
            const button_container = book_template_clone.querySelector(".button-container");

            if(book_link){
                const link_element = document.createElement("a");
                link_element.href = book_link;
                link_element.target = "_blank";
                link_element.className = "w-full block text-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-2 rounded";
                link_element.textContent = "Buy";
                button_container.appendChild(link_element);
            } else{
                const turned_off_button = document.createElement("button");
                turned_off_button.disabled = true;
                turned_off_button.className = "w-full bg-gray-300 text-gray-500 font-medium py-1 px-2 rounded cursor-not-allowed";
                turned_off_button.textContent = "Buy";
                button_container.appendChild(turned_off_button);
            }

            //badge
            const badge_container = book_template_clone.querySelector(".badge-container");
            const badge = document.createElement("span");

            if(is_required){
                badge.className = "bg-red-500 text-white text-xs font-bold px-2 py-1 rounded w-max";
                badge.textContent = "Required";
            } else {
                badge.className = "bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded w-max";
                badge.textContent = "Optional";
            }

            
            badge_container.appendChild(badge);

            //add book to row
            row_of_books.append(book_template_clone);

        });

        // add row to card
        card.appendChild(row_of_books);
        container.appendChild(card);


    });

    
    
}

document.addEventListener("DOMContentLoaded", render_materials_page);