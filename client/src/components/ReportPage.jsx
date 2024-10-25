import React, { useRef, useState, useEffect } from 'react';
import { Card, CardBody, Form, Button, Input, Label, Col, Row } from 'reactstrap';
import JoditEditor from 'jodit-react';
import { useLocation } from "react-router-dom";
import axios from 'axios';

const editorConfig = {
  readonly: false,
  height: 800,
  toolbarAdaptive: false,
}; 

const ReportPage = () => {
  const location = useLocation();
  const patient = location.state?.patient;
  const editor = useRef(null);
  const [content, setContent] = useState('');
  const [modalities, setModalities] = useState(['CT', 'XRAY']);
  const [templates, setTemplates] = useState([]);
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateModality, setNewTemplateModality] = useState('');

  useEffect(() => {
    document.title = patient?.patientName || "Report Page";
    if (editor.current) {
      editor.current.focus();
    }
    fetchTemplates();
  }, [patient?.patientID]);

  const fetchTemplates = async () => {
    if (!patient) return; 
    try {
      const response = await axios.get(`/api/getTemplates?patientId=${patient.patientID}`);
      console.log('Fetched templates:', response.data);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleModalityChange = (e) => {
    setSelectedModality(e.target.value);
    setSelectedTemplate(null); 
    setContent(''); 
    console.log('Selected modality:', e.target.value);
  };

  const handleTemplateChange = (e) => {
    const selectedId = e.target.value;
    const template = templates.find(t => t._id === selectedId); 
    console.log('Selected template ID:', selectedId);
    setSelectedTemplate(template || null); 
    if (template) {
      setContent(template.content); 
      console.log('Content set for editor:', template.content);
    } else {
      setContent('');
    }
  };

  const handleCreateTemplateClick = () => {
    setIsCreatingTemplate(true);
    setContent(''); 
  };

  const handleSaveTemplate = async () => {
    if (!patient) return; 
    try {
      const response = await axios.post('/api/createTemplate', {
        name: newTemplateName,
        content: content,
        modality: newTemplateModality,
        patientId: patient.patientID,
      });
      console.log('Template saved:', response.data);
      setTemplates([...templates, response.data]);
      setIsCreatingTemplate(false);
      setNewTemplateName('');
      setNewTemplateModality('');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEditorChange = (newContent) => {
    setContent(newContent);
    console.log('Editor content changed:', newContent);
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100">
      <div className="w-1/4 p-4">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Patient Name:</th>
              <td style={{ padding: '8px' }}>{patient?.patientName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Age:</th>
              <td style={{ padding: '8px' }}>{patient?.age}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Sex:</th>
              <td style={{ padding: '8px' }}>{patient?.gender}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Study:</th>
              <td style={{ padding: '8px' }}>{patient?.dicomFiles?.[0]?.modality}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Patient ID:</th>
              <td style={{ padding: '8px' }}>{patient?.patientID}</td>
            </tr>
          </tbody>
        </table>
        <div className="mb-4">
          <Label for="modality" className="block font-medium mb-2">
            Select Modality
          </Label>
          <Input
            id="modality"
            type="select"
            value={selectedModality}
            onChange={handleModalityChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select Modality</option>
            {modalities.map((modality, index) => (
              <option key={index} value={modality}>{modality}</option>
            ))}
          </Input>
        </div>

        <div className="mb-4">
          <Label for="template" className="block font-medium mb-2">
            Select Template
          </Label>
          <Input
            id="template"
            type="select"
            value={selectedTemplate ? selectedTemplate._id : ''}
            onChange={handleTemplateChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!selectedModality}
          >
            <option value="">Select Template</option>
            {templates
              .filter(template => template.modality === selectedModality)
              .map(template => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
          </Input>
        </div>
        <div className="mb-4">
          <Button color="success" onClick={handleCreateTemplateClick} className="w-full">
            Create New Template
          </Button>
        </div>
      </div>

      <Card className="shadow-lg w-3/4" style={{ padding: '20px' }}>
        <CardBody className="text-center">
          <h3 className="text-2xl font-semibold mb-6">
            {isCreatingTemplate ? 'Create Template' : 'Generate Report'}
          </h3>
          <Form>
            {isCreatingTemplate && (
              <>
                <Row className="mb-4">
                  <Col>
                    <Label for="newModality" className="block font-medium mb-2">
                      Select Modality
                    </Label>
                    <Input
                      id="newModality"
                      type="select"
                      value={newTemplateModality}
                      onChange={(e) => setNewTemplateModality(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="">Select Modality</option>
                      {modalities.map((modality, index) => (
                        <option key={index} value={modality}>{modality}</option>
                      ))}
                    </Input>
                  </Col>
                  <Col>
                    <Label for="templateName" className="block font-medium mb-2">
                      Template Name
                    </Label>
                    <Input
                      id="templateName"
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </Col>
                </Row>
                <JoditEditor
                  ref={editor}
                  value={content}
                  config={editorConfig}
                  onChange={handleEditorChange}
                />
                <Button color="primary" onClick={handleSaveTemplate} className="mt-4">
                  Save Template
                </Button>
              </>
            )}
            {!isCreatingTemplate && (
              <JoditEditor
                ref={editor}
                value={content}
                config={editorConfig}
                onChange={handleEditorChange}
              />
            )}
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ReportPage;

