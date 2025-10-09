import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Progress,
} from '@chakra-ui/react';
import FileUpload from '../components/FileUpload';
import ModelSelector from '../components/ModelSelector';
import { useNavigate } from 'react-router-dom';

function Upload() {
  const navigate = useNavigate();
  const toast = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState('llama-4-scout-17b-16e-instruct');
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const handleUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload file
      const response = await fetch('/api/statements/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      toast({
        title: 'Statement uploaded successfully',
        status: 'success',
        duration: 3000,
      });

      // Navigate to analysis page
      navigate(`/analysis/${data.file_id}`);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Upload Bank Statement</Heading>
        <Text>
          Upload your bank statement PDF to analyze transactions and get financial insights.
        </Text>

        <Box p={6} borderWidth={1} borderRadius="lg">
          <VStack spacing={4}>
            <ModelSelector
              selectedModel={selectedModel}
              onChange={handleModelChange}
            />
            
            <FileUpload
              onUpload={handleUpload}
              accept=".pdf"
              disabled={uploading}
            />

            {uploading && (
              <Progress
                value={uploadProgress}
                size="sm"
                width="100%"
                isIndeterminate
              />
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

export default Upload;