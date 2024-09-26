import dotenv from "dotenv"
import connectDb from "./db/index.js"
import express from "express"
import cors from "cors"
import uploadRoutes from "./routes/uploadRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import cookieParser from 'cookie-parser';
const app = express()
dotenv.config()
app.use(express.json())
app.use(cookieParser());
app.use(cors())
app.use('/api',uploadRoutes)
app.use('/api/admin',adminRoutes)
connectDb().then(()=>{
    app.listen(5000,()=>{
        console.log("Server is running on port 5000")
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed",err)
})