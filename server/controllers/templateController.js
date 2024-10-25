import Template from "../models/templateModel.js";

export const createTemplate = async(req,res)=>{
    const {name,content,modality,patientId} = req.body
    try {
        const newTemplate = new Template({
            name,
            content,
            modality,
            patient:patientId
        })
        const savedTemplate = await newTemplate.save()
        res.status(201).json(savedTemplate)
    } catch (error) {
        console.error("Error creating template:",error)
        res.status(500).json({message:"Server Error"})
    }
}
export const getTemplates = async(req,res)=>{
    const{patientId} = req.query
    try {
        const templates = await Template.find({patient:patientId})
        res.status(200).json(templates)
    } catch (error) {
        console.error("Error fetching templates:",error)
        res.status(500).json({message:"Server Error"})
    }
}