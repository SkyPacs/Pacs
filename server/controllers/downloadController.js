import axios from 'axios';
import AdmZip from 'adm-zip';

export const downloadAllDicomFiles = async (req, res) => {
  const { patientId } = req.params;
  const orthancUrl = process.env.ORTHANC_URL || 'http://localhost:8042';

  try {
    const studiesResponse = await axios.get(`${orthancUrl}/patients/${patientId}/studies`);
    const studies = studiesResponse.data;

    if (!studies || studies.length === 0) {
      return res.status(404).json({ message: 'No studies found for this patient.' });
    }
    const zip = new AdmZip();

    // Step 3: Iterate over studies to fetch instances
    for (const study of studies) {
      const studyId = study.ID; // Get the study ID

      // Fetch instances for this study
      const instancesResponse = await axios.get(`${orthancUrl}/studies/${studyId}/instances`);
      const instances = instancesResponse.data;

      // Step 4: Download each instance
      for (const instance of instances) {
        const instanceId = instance.ID;
        try {
          const response = await axios.get(`${orthancUrl}/instances/${instanceId}/file`, {
            responseType: 'arraybuffer',
            headers: {
              'Accept': 'application/dicom',
            },
          });

          // Step 5: Add the DICOM file to the ZIP
          zip.addFile(`${instanceId}.dcm`, Buffer.from(response.data)); 
        } catch (error) {
          console.error(`Error downloading DICOM file with instance ID ${instanceId}:`, error);
        }
      }
    }

    // Step 6: Send the ZIP file to the client with resumable download support
    const zipBuffer = zip.toBuffer(); 
    const totalBytes = zipBuffer.length;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dicom_files.zip"');
    
    // Check for the Range header to support resumable downloads
    const range = req.headers.range;
    if (range) {
      const start = Number(range.replace(/\D/g, '')); // Extract start byte from range
      const end = Math.min(start + 1024 * 1024, totalBytes - 1); // Send 1MB chunks
      const chunk = zipBuffer.slice(start, end + 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalBytes}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk.length,
      });
      res.end(chunk); // Send the chunk
    } else {
      // If no range, send the entire file
      res.setHeader('Content-Length', totalBytes);
      res.end(zipBuffer); // Send the entire buffer
    }

  } catch (error) {
    console.error('Error downloading DICOM files:', error);
    return res.status(500).json({ message: 'Error downloading DICOM files' });
  }
};
