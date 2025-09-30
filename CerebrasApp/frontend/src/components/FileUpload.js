import React from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

function FileUpload({ onUpload, accept, disabled }) {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const fileInputRef = React.useRef();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <VStack spacing={4} width="100%">
      <Box
        width="100%"
        height="200px"
        border="2px dashed"
        borderColor={borderColor}
        borderRadius="md"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        cursor="pointer"
        p={6}
      >
        <Icon as={FiUpload} w={8} h={8} mb={2} />
        <Text mb={2}>
          {selectedFile
            ? `Selected: ${selectedFile.name}`
            : 'Drag and drop your PDF here or click to browse'}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Supports PDF bank statements only
        </Text>
        <Input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          hidden
          ref={fileInputRef}
        />
      </Box>

      <Button
        colorScheme="blue"
        onClick={handleSubmit}
        isDisabled={!selectedFile || disabled}
        width="100%"
      >
        Analyze Statement
      </Button>
    </VStack>
  );
}

export default FileUpload;