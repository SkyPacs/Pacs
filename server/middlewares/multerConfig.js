import multer from 'multer';
import unzipper from 'unzipper';
import path from 'path';
import fs from 'fs';
import stream from 'stream';

const storage = multer.memoryStorage();
const upload = multer({ storage }).single('dicomFile'); 
export async function handleDicomFileUpload(req, res) {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send({ message: 'Error uploading file', error: err });
        }
        if (!req.file || req.file.mimetype !== 'application/zip') {
            return res.status(400).send({ message: 'Please upload a valid ZIP file' });
        }

        try {
            const zipBuffer = req.file.buffer;
            const zipDir = path.join(__dirname, 'uploads', `${Date.now()}/`);
            await fs.promises.mkdir(zipDir, { recursive: true }); 
            const unzipStream = unzipper.Extract({ path: zipDir });
            const bufferStream = new stream.PassThrough();
            bufferStream.end(zipBuffer);
            bufferStream.pipe(unzipStream);
            unzipStream.on('close', async () => {
                const extractedFiles = await fs.promises.readdir(zipDir);
                console.log('Extracted files:', extractedFiles);
                for (const file of extractedFiles) {
                    const filePath = path.join(zipDir, file);
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
const uploadDicomFile = upload;

export default uploadDicomFile;

