import { Readable } from 'stream';
import axios from 'axios';
import AdmZip from 'adm-zip';

export const downloadAllDicomFiles = async (req, res) => {
  const { patientId } = req.params;
  const orthancUrl = process.env.ORTHANC_URL || 'http://skypacs.in:8042';

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

      for (const instance of instances) {
        const instanceId = instance.ID;
        try {
          const response = await axios.get(`${orthancUrl}/instances/${instanceId}/file`, {
            responseType: 'arraybuffer',
            headers: {
              'Accept': 'application/dicom',
            },
          });

          zip.addFile(`${instanceId}.dcm`, Buffer.from(response.data));
        } catch (error) {
          console.error(`Error downloading DICOM file with instance ID ${instanceId}:`, error);
        }
      }
    }

    const zipBuffer = zip.toBuffer();
    const totalBytes = zipBuffer.length;

    // Set headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dicom_files.zip"');
    res.setHeader('Content-Length', totalBytes);
    res.setHeader('Accept-Ranges', 'bytes');

    //  Stream ZIP buffer in chunks
    const zipStream = Readable.from(zipBuffer);
    zipStream.pipe(res);
  } catch (error) {
    console.error('Error downloading DICOM files:', error);
    res.status(500).json({ message: 'Error downloading DICOM files' });
  }
};
