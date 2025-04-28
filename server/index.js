import dotenv from "dotenv"
import connectDb from "./db/index.js"
import express from "express"
import cors from "cors"
import uploadRoutes from "./routes/uploadRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import templateRoutes from "./routes/templateRoutes.js"
import audioRoutes from "./routes/audioRoutes.js"
import cookieParser from 'cookie-parser';

const app = express()   // Initializes an Express application
dotenv.config()     // Loads environment variables

app.use(express.json())           // Parses incoming JSON requests and puts the parsed data in req.body
app.use(cookieParser());        // Parses cookies attached to the client request object
app.use(cors({ origin: "*" }));     // Enables Cross-Origin Resource Sharing (CORS) for all origins

// Add Hello route
app.get("/", (req, res) => {        // Defines a GET route for the root URL
    res.send("Hello, World!");
});

app.use('/api', uploadRoutes);      // Mounts upload routes at /api
app.use('/api/admin', adminRoutes); // Mounts admin routes at /api/admin
app.use('/api', templateRoutes);    // Mounts template routes at /api
app.use('/api', audioRoutes);       // Mounts audio routes at /api
app.use('/uploads', express.static('uploads'));     // Serves static files from the uploads directory at /uploads

connectDb().then(() => {        // Connects to the database, then starts the server if successful
    app.listen(5000, () => {    // Starts the server on port 5000
        console.log("Server is running on port 5000");          // Logs a message indicating the server is running
    });
}).catch((err) => {
    console.log("MongoDB connection failed", err);              // Logs an error message if the connection fails
});
