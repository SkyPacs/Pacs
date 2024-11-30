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
    for (const study of studies) {
      const studyId = study.ID;
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
    const zipBuffer = zip.toBuffer(); 
    const totalBytes = zipBuffer.length;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dicom_files.zip"');
    const range = req.headers.range;
    if (range) {
      const start = Number(range.replace(/\D/g, '')); 
      const end = Math.min(start + 1024 * 1024, totalBytes - 1);
      const chunk = zipBuffer.slice(start, end + 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalBytes}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk.length,
      });
      res.end(chunk); // Send the chunk
    } else {
      res.setHeader('Content-Length', totalBytes);
      res.end(zipBuffer);
    }

  } catch (error) {
    console.error('Error downloading DICOM files:', error);
    return res.status(500).json({ message: 'Error downloading DICOM files' });
  }
};
