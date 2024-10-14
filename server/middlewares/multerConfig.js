import multer from 'multer';
import unzipper from 'unzipper';
import path from 'path';
import fs from 'fs';
import stream from 'stream';

// Configure storage to save uploaded ZIP files in memory
const storage = multer.memoryStorage(); // Store files in memory for easy access

// Configure Multer
const upload = multer({ storage }).single('dicomFile'); // Accept a single file with the name 'dicomFile'

// Your controller function
export async function handleDicomFileUpload(req, res) {
    // Middleware to handle the file upload
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send({ message: 'Error uploading file', error: err });
        }

        // Ensure the file is a ZIP file
        if (!req.file || req.file.mimetype !== 'application/zip') {
            return res.status(400).send({ message: 'Please upload a valid ZIP file' });
        }

        try {
            const zipBuffer = req.file.buffer; // Access the uploaded ZIP file buffer
            const zipDir = path.join(__dirname, 'uploads', `${Date.now()}/`); // Define a directory for extracted files
            await fs.promises.mkdir(zipDir, { recursive: true }); // Create the directory if it doesn't exist

            // Unzip the files
            const unzipStream = unzipper.Extract({ path: zipDir });

            // Pipe the ZIP buffer to the unzipper
            const bufferStream = new stream.PassThrough();
            bufferStream.end(zipBuffer);
            bufferStream.pipe(unzipStream);

            unzipStream.on('close', async () => {
                // Here you can process the extracted DICOM files
                const extractedFiles = await fs.promises.readdir(zipDir);
                console.log('Extracted files:', extractedFiles);
                
                // Optionally handle each DICOM file
                for (const file of extractedFiles) {
                    const filePath = path.join(zipDir, file);
                    // Process your DICOM file here (e.g., upload to a server, save to a database, etc.)
                    console.log('Processing DICOM file:', filePath);
                }

                res.status(200).send({ message: 'DICOM files uploaded and processed successfully' });
            });

            unzipStream.on('error', (error) => {
                console.error('Error unzipping files:', error);
                res.status(500).send({ message: 'Error processing ZIP file' });
            });
        } catch (error) {
            console.error('Error processing uploaded file:', error);
            res.status(500).send({ message: 'Error processing uploaded file' });
        }
    });
}

// Rename the middleware function
const uploadDicomFile = upload; // This will be used in the route

export default uploadDicomFile; // Export the renamed middleware for use in your routes

