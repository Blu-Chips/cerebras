import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Badge
} from '@chakra-ui/react';

function SavingsMatrix({ matrix }) {
  const strategies = {
    conservative: { color: 'green', label: 'Low Risk' },
    moderate: { color: 'blue', label: 'Balanced' },
    aggressive: { color: 'purple', label: 'High Return' }
  };

  return (
    <Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Strategy</Th>
            <Th>Monthly Savings</Th>
            <Th>Annual Savings</Th>
            <Th>ROI</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(matrix).map(([strategy, data]) => (
            <Tr key={strategy}>
              <Td>
                <Badge colorScheme={strategies[strategy].color}>
                  {strategies[strategy].label}
                </Badge>
              </Td>
              <Td>${data.monthly_savings.toFixed(2)}</Td>
              <Td>${data.annual_savings.toFixed(2)}</Td>
              <Td>{data.roi_projection}%</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default SavingsMatrix;