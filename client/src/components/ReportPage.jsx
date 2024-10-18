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
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateModality, setNewTemplateModality] = useState('');

  useEffect(() => {
    document.title = patient.patientName;
    if (editor.current) {
      editor.current.focus();
    }
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/getTemplates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleModalityChange = (e) => {
    setSelectedModality(e.target.value);
  };

  const handleTemplateChange = (e) => {
    const template = templates.find(t => t.id === e.target.value);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      setContent(selectedTemplate.content);
    }
  };

  const handleCreateTemplateClick = () => {
    setIsCreatingTemplate(true);
    setContent('');
  };

  const handleSaveTemplate = async () => {
    try {
      const response = await axios.post('/api/createTemplate', {
        name: newTemplateName,
        content: content,
        modality: newTemplateModality,
      });
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
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100">
      <div className="w-1/4 p-4">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Patient Name:</th>
              <td style={{ padding: '8px' }}>{patient.patientName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Age:</th>
              <td style={{ padding: '8px' }}>{patient.age}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Sex:</th>
              <td style={{ padding: '8px' }}>{patient.gender}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Study:</th>
              <td style={{ padding: '8px' }}>{patient.medicalHistory}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Patient ID:</th>
              <td style={{ padding: '8px' }}>{patient._id}</td>
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
            value={selectedTemplate.id || ''}
            onChange={handleTemplateChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!selectedModality}
          >
            <option value="">Select Template</option>
            {templates
              .filter(template => template.modality === selectedModality)
              .map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
          </Input>
        </div>
        <div className="mb-4">

          <Button color="success" onClick={handleSelectTemplate} className="w-full">
            Select Template
          </Button>
        </div>
        <div className="mb-4">
          <Button color="primary" onClick={handleCreateTemplateClick} className="w-full">
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
              </>
            )}

            <div className="mb-4">
              <Label for="title" className="block text-left font-medium mb-2">
                {isCreatingTemplate ? 'Template Content' : 'Report Content'}
              </Label>
              <JoditEditor
                ref={editor}
                value={content}
                config={editorConfig}
                onChange={handleEditorChange}
              />
            </div>

            {isCreatingTemplate && (
              <Button color="primary" onClick={handleSaveTemplate} className="w-full">
                Save Template
              </Button>
            )}
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ReportPage; 
