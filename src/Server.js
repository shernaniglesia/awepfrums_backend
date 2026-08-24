const express = require('express');
const cors = require('cors');
const { initExpirationCron } = require('./tasks/expirationCron');

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const roomReservationRoutes = require("./routes/roomReservationRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const scheduleChangeRoutes = require("./routes/scheduleChangeRoutes");
const semRoutes = require("./routes/semesterRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const yearSectionRoutes = require("./routes/yearSectionRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const equipmentReservationRoutes = require("./routes/equipmentReservationRoutes");

const app = express();

// Enable explicit CORS config to handle custom headers and browser preflight OPTIONS requests
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json());

app.set('trust proxy', 1);

app.get('/', (req, res) => {
    res.send('Hello from your backend!');
});

app.use("/auth", authRoutes); 
app.use("/dashboards", dashboardRoutes); 
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);
app.use("/rooms", roomRoutes);
app.use("/room-reservations", roomReservationRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/schedule-changes", scheduleChangeRoutes);
app.use("/sem", semRoutes);
app.use("/subjects", subjectRoutes);
app.use("/year-sections", yearSectionRoutes);
app.use("/equipments", equipmentRoutes);
app.use("/equipment-reservations", equipmentReservationRoutes);

app.listen(5000, '0.0.0.0', () => {
    console.log("Server running hahahaha...");
});

// const express = require('express');
// const cors = require('cors');
// const { initExpirationCron } = require('./tasks/expirationCron');

// const authRoutes = require("./routes/authRoutes");
// const dashboardRoutes = require("./routes/dashboardRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const userRoutes = require("./routes/userRoutes");
// const roomRoutes = require("./routes/roomRoutes");
// const roomReservationRoutes = require("./routes/roomReservationRoutes");
// const scheduleRoutes = require("./routes/scheduleRoutes");
// const scheduleChangeRoutes = require("./routes/scheduleChangeRoutes");
// const semRoutes = require("./routes/semesterRoutes");
// const subjectRoutes = require("./routes/subjectRoutes");
// const yearSectionRoutes = require("./routes/yearSectionRoutes");
// const equipmentRoutes = require("./routes/equipmentRoutes");
// const equipmentReservationRoutes = require("./routes/equipmentReservationRoutes");

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//     res.send('Hello from your backend!');
// });

// app.use("/auth", authRoutes); 
// app.use("/dashboards", dashboardRoutes); 
// app.use("/notifications", notificationRoutes);
// app.use("/users", userRoutes);
// app.use("/rooms", roomRoutes);
// app.use("/room-reservations", roomReservationRoutes);
// app.use("/schedules", scheduleRoutes);
// app.use("/schedule-changes", scheduleChangeRoutes);
// app.use("/sem", semRoutes);
// app.use("/subjects", subjectRoutes);
// app.use("/year-sections", yearSectionRoutes);
// app.use("/equipments", equipmentRoutes);
// app.use("/equipment-reservations", equipmentReservationRoutes);

// // initExpirationCron();
// //app.listen(5000, () => console.log("Server running hahahaha..."));

// app.listen(5000, '0.0.0.0', () => {
//     console.log("Server running hahahaha...");
// })