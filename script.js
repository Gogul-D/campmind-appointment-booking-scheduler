//GLOBAL CONSTANTS & VARIABLES
const STORAGE_KEY = 'capminds_appointments';
const SIDEBAR_KEY = 'capminds_sidebar_collapsed';

let currentCalendarDate = new Date();

//MODAL FUNCTIONS
function openModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;

    document.getElementById('appointmentId').value = '';
    document.getElementById('patientSelect').value = '';
    document.getElementById('doctorSelect').value = '';
    document.getElementById('hospitalSelect').value = '';
    document.getElementById('specialtySelect').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('timeInput').value = '';
    document.getElementById('reasonInput').value = '';

    modal.classList.add('open');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('open');
}

window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
};


//LOCAL STORAGE HELPERS


function getAppointments() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}


/* SAVE / EDIT / DELETE APPOINTMENTS*/

function saveAppointment() {

    const idField = document.getElementById('appointmentId');
    const patient = document.getElementById('patientSelect').value;
    const doctor = document.getElementById('doctorSelect').value;
    const hospital = document.getElementById('hospitalSelect').value;
    const specialty = document.getElementById('specialtySelect').value;
    const date = document.getElementById('dateInput').value;
    const time = document.getElementById('timeInput').value;
    const reason = document.getElementById('reasonInput').value;

    if (!patient || !doctor || !date || !time) {
        alert('Please fill all required fields');
        return;
    }

    const appointments = getAppointments();

    if (idField.value) {
        const id = parseInt(idField.value);
        const index = appointments.findIndex(a => a.id === id);

        if (index !== -1) {
            appointments[index] = {
                id,
                patient,
                doctor,
                hospital,
                specialty,
                date,
                time,
                reason
            };
            alert('Appointment Updated');
        }
    } else {
        appointments.push({
            id: Date.now(),
            patient,
            doctor,
            hospital,
            specialty,
            date,
            time,
            reason
        });
        alert('Appointment Saved');
    }

    saveAppointments(appointments);
    closeModal();

    if (document.getElementById('appointmentTableBody')) {
        renderDashboard();
    } else {
        renderCalendar();
    }
}

function editAppointment(id) {
    const appointments = getAppointments();
    const app = appointments.find(a => a.id === id);

    if (!app) return;

    document.getElementById('appointmentId').value = app.id;
    document.getElementById('patientSelect').value = app.patient;
    document.getElementById('doctorSelect').value = app.doctor;
    document.getElementById('hospitalSelect').value = app.hospital;
    document.getElementById('specialtySelect').value = app.specialty;
    document.getElementById('dateInput').value = app.date;
    document.getElementById('timeInput').value = app.time;
    document.getElementById('reasonInput').value = app.reason;

    openModal();
}

function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    let appointments = getAppointments();
    appointments = appointments.filter(app => app.id !== id);

    saveAppointments(appointments);

    if (document.getElementById('appointmentTableBody')) {
        renderDashboard();
    } else {
        renderCalendar();
    }
}

function copyAppointmentDetails(id) {
    const appointments = getAppointments();
    const app = appointments.find(a => a.id === id);
    if (!app) return;

    const text = `
Patient: ${app.patient}
Doctor: ${app.doctor}
Hospital: ${app.hospital}
Specialty: ${app.specialty}
Date: ${app.date}
Time: ${app.time}
Reason: ${app.reason}
`;

    navigator.clipboard.writeText(text.trim());
    alert('Appointment details copied');
}

//SIDEBAR LOGIC


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('toggleIcon');

    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        icon.src = 'icons/navbar-collapse-arrow-right.png';
        localStorage.setItem(SIDEBAR_KEY, 'true');
    } else {
        icon.src = 'icons/navbar-collapse-arrow-left.png';
        localStorage.setItem(SIDEBAR_KEY, 'false');
    }
}

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('toggleIcon');

    if (localStorage.getItem(SIDEBAR_KEY) === 'true') {
        sidebar.classList.add('collapsed');
        icon.src = 'icons/navbar-collapse-arrow-right.png';
    }
}


//DASHBOARD LOGIC


function renderDashboard() {
    const tableBody = document.getElementById('appointmentTableBody');
    if (!tableBody) return;

    let appointments = getAppointments();

    const patientSearch = document.getElementById('patientSearch');
    const doctorSearch = document.getElementById('doctorSearch');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    if (patientSearch?.value) {
        appointments = appointments.filter(a =>
            a.patient.toLowerCase().includes(patientSearch.value.toLowerCase())
        );
    }

    if (doctorSearch?.value) {
        appointments = appointments.filter(a =>
            a.doctor.toLowerCase().includes(doctorSearch.value.toLowerCase())
        );
    }

    if (startDate?.value) {
        appointments = appointments.filter(a => a.date >= startDate.value);
    }

    if (endDate?.value) {
        appointments = appointments.filter(a => a.date <= endDate.value);
    }

    tableBody.innerHTML = '';

    if (!appointments.length) {
        tableBody.innerHTML =
            `<tr><td colspan="7" style="text-align:center;">No appointments found</td></tr>`;
        return;
    }

    appointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.patient}</td>
            <td>${app.doctor}</td>
            <td>${app.hospital || '-'}</td>
            <td>${app.specialty || '-'}</td>
            <td>${formatDate(app.date)}</td>
            <td>${app.time}</td>
            <td>
                <div class="action-icons">
                    <img src="icons/appointment-edit.png" onclick="editAppointment(${app.id})">
                    <img src="icons/appointment-delete.png" onclick="deleteAppointment(${app.id})">
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function initDashboardFilters() {
    const updateBtn = document.getElementById('updateFilterBtn');
    if (updateBtn) updateBtn.addEventListener('click', renderDashboard);
}

//CALENDAR LOGIC


function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('currentMonthDisplay');
    if (!calendarGrid || !monthDisplay) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    monthDisplay.innerHTML =
        `<img src="icons/appointment-date-filter.svg" class="icon-img" style="margin-right:8px">
         ${monthNames[month]} ${year}`;

    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) monthSelect.value = month;

    calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const appointments = getAppointments();

    for (let i = 0; i < firstDay; i++) {
        calendarGrid.innerHTML += `<div class="calendar-cell disabled"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.innerHTML = `<div class="date-number">${day}</div>`;

        appointments
            .filter(a => a.date === dateStr)
            .forEach(a => {
                cell.innerHTML += `
                    <div class="event-item">
                        <div class="event-text">${a.patient} ${a.time}</div>
                        <div class="event-actions">
                            <img src="icons/appointment-edit.png" onclick="editAppointment(${a.id})">
                            <img src="icons/appointment-delete.png" onclick="deleteAppointment(${a.id})">
                        </div>
                    </div>
                `;
            });

        calendarGrid.appendChild(cell);
    }
}

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    renderCalendar();
}

function initCalendarControls() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => changeMonth(1));
    document.getElementById('todayBtn')?.addEventListener('click', goToToday);
    document.getElementById('monthSelect')?.addEventListener('change', e => {
        currentCalendarDate.setMonth(parseInt(e.target.value));
        renderCalendar();
    });
}

//UTILITIES


function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

//INITIAL LOAD
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    renderDashboard();
    initDashboardFilters();
    renderCalendar();
    initCalendarControls();
});
