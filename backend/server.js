const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const urlRoutes = require('./routes/UrlRoutes');
const authRoutes = require('./routes/AuthRoutes');
const passRoutes = require('./routes/PasswordRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());



const allowedOrigins = [
  "http://localhost:5173",
  "https://url-shortner-lyart-two.vercel.app",
  "https://url-shortner-p3fh6cb35-prashant-kumars-projects-cf441b30.vercel.app",
  "https://url-shortner-phmns3q26-prashant-kumars-projects-cf441b30.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);



connectDB();


app.use('/api', urlRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', passRoutes);

app.get("/", (req, res) => {
  res.send("URL Shortener Backend is running!");
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});