const BASE = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const COHORT = "/2506-Joe";
const RESOURCE = "/events";
const API = BASE + COHORT + RESOURCE;

let events = [];
let selectedEvent = null;
let guests = [];
let rsvps = [];

async function getEvents() {
  try {
    const res = await fetch(API);
    const json = await res.json();
    events = json.data;
    render();
  } catch (err) {
    console.error("Error fetching events:", err);
  }
}

async function getEvent(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const json = await res.json();
    selectedEvent = json.data;
    render();
  } catch (err) {
    console.error(`Error fetching event ${id}:`, err);
  }
}

async function getGuestsAndRsvps() {
  try {
    const guestsRes = await fetch(`${BASE}${COHORT}/guests`);
    const rsvpsRes = await fetch(`${BASE}${COHORT}/rsvps`);
    const guestsJson = await guestsRes.json();
    const rsvpsJson = await rsvpsRes.json();
    guests = guestsJson.data;
    rsvps = rsvpsJson.data;
    render();
  } catch (err) {
    console.error("Error fetching guests or RSVPs:", err);
  }
}

async function createEvent(eventData) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error("Failed to create event");
    const json = await res.json();
    await getEvents();
    selectedEvent = json.data;
    render();
  } catch (err) {
    console.error("Error creating event:", err);
    alert("There was a problem creating the event. Please check the fields and try again.");
  }
}

async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) return;
  try {
    const res = await fetch(`${API}/${id}` , { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete event");
    selectedEvent = null;
    await getEvents();
  } catch (err) {
    console.error("Error deleting event:", err);
    alert("There was a problem deleting the event. Please try again.");
  }
}

function EventForm() {
  const $form = document.createElement("form");
  $form.classList.add("event-form");

  $form.innerHTML = `
    <label>
      Name
      <input type="text" name="name" required />
    </label>
    <label>
      Description
      <textarea name="description" required></textarea>
    </label>
    <label>
      Location
      <input type="text" name="location" required />
    </label>
    <label>
      Date
      <input type="date" name="date" required />
    </label>
    <button type="submit">Create Event</button>
  `;

  $form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    const formData = new FormData($form);
    const name = formData.get("name").trim();
    const description = formData.get("description").trim();
    const location = formData.get("location").trim();
    const dateInput = formData.get("date");

    if (!name || !description || !location || !dateInput) {
      alert("Please fill in all fields.");
      return;
    }

    const isoDate = new Date(dateInput).toISOString();
    createEvent({ name, description, location, date: isoDate });
    $form.reset();
  });

  return $form;
}

function EventListItem(event) {
  const $li = document.createElement("li");
  const $a = document.createElement("a");
  $a.href = "#selected";
  $a.textContent = event.name;

  if (selectedEvent?.id === event.id) {
    $a.style.fontWeight = "bold";
    $a.style.color = "#3b82f6";
  }

  $a.addEventListener("click", (evt) => {
    evt.preventDefault();
    getEvent(event.id);
  });

  $li.appendChild($a);
  return $li;
}

function EventList() {
  const $ul = document.createElement("ul");
  $ul.classList.add("event-list");
  events.forEach((event) => $ul.appendChild(EventListItem(event)));
  return $ul;
}

function EventDetails() {
  const $section = document.createElement("section");
  $section.classList.add("event-details");

  if (!selectedEvent) {
    const $p = document.createElement("p");
    $p.textContent = "Please select an event to view details.";
    return $p;
  }

  const { id, name, description, location, date } = selectedEvent;

  const $h3 = document.createElement("h3");
  $h3.textContent = `${name} #${id}`;

  const $dl = document.createElement("dl");
  $dl.append(...dtdd("Date", new Date(date).toLocaleString()));
  $dl.append(...dtdd("Location", location));
  $dl.append(...dtdd("Description", description));

  $section.append($h3, $dl);

  const guestList = GuestList();
  if (guestList) $section.appendChild(guestList);

 
  const $deleteBtn = document.createElement("button");
  $deleteBtn.textContent = "Delete Event";
  $deleteBtn.classList.add("delete-btn");
  $deleteBtn.addEventListener("click", () => deleteEvent(id));
  $section.appendChild($deleteBtn);

  return $section;
}

function GuestList() {
  if (!selectedEvent || guests.length === 0 || rsvps.length === 0) return null;
  const matchingRsvps = rsvps.filter((r) => r.eventId === selectedEvent.id);
  const attending = guests.filter((g) => matchingRsvps.map((r) => r.guestId).includes(g.id));

  const $div = document.createElement("div");
  $div.classList.add("guest-list");

  const $h4 = document.createElement("h4");
  $h4.textContent = `Guests Attending (${attending.length})`;
  $div.appendChild($h4);

  const $ul = document.createElement("ul");
  attending.forEach((g) => {
    const $li = document.createElement("li");
    $li.textContent = g.name;
    $ul.appendChild($li);
  });

  $div.appendChild($ul);
  return $div;
}

function dtdd(label, value) {
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value ?? "—";
  return [dt, dd];
}

function render() {
  const $app = document.querySelector("#app");

  $app.innerHTML = `
    <h1>Event Planner Admin</h1>
    <main>
      <section id="create">
        <h2>Create a New Event</h2>
        <EventForm></EventForm>
      </section>
      <section>
        <h2>Upcoming Events</h2>
        <EventList></EventList>
      </section>
      <section id="selected">
        <h2>Event Details</h2>
        <EventDetails></EventDetails>
      </section>
    </main>
  `;
  $app.querySelector("EventForm").replaceWith(EventForm());
  $app.querySelector("EventList").replaceWith(EventList());
  $app.querySelector("EventDetails").replaceWith(EventDetails());
}

async function init() {
  await getEvents();
  await getGuestsAndRsvps();
}

init();
