import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';

function Analysis({ data, loading, error }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.100" color="red.900" borderRadius="md">
        <Text>Error: {error}</Text>
      </Box>
    );
  }

  if (!data) return null;

  const chartData = {
    labels: data.timeline.map(item => item.date),
    datasets: [{
      label: 'Daily Balance',
      data: data.timeline.map(item => item.balance),
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Account Balance Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <VStack spacing={6} width="100%">
      <Box 
        p={6} 
        bg={bgColor} 
        shadow="md" 
        borderRadius="lg" 
        borderWidth="1px"
        borderColor={borderColor}
        width="100%"
      >
        <Text fontSize="2xl" mb={4}>Analysis Summary</Text>
        <HStack spacing={8} mb={6}>
          <Box>
            <Text color="gray.500">Total Income</Text>
            <Text fontSize="2xl">${data.totalIncome.toFixed(2)}</Text>
          </Box>
          <Box>
            <Text color="gray.500">Total Expenses</Text>
            <Text fontSize="2xl">${data.totalExpenses.toFixed(2)}</Text>
          </Box>
          <Box>
            <Text color="gray.500">Net Change</Text>
            <Text fontSize="2xl" color={data.netChange >= 0 ? "green.500" : "red.500"}>
              ${Math.abs(data.netChange).toFixed(2)}
            </Text>
          </Box>
        </HStack>

        <Box height="400px" mb={8}>
          <Line data={chartData} options={chartOptions} />
        </Box>

        <Text fontSize="xl" mb={4}>Recent Transactions</Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.recentTransactions.map((transaction, index) => (
              <Tr key={index}>
                <Td>{transaction.date}</Td>
                <Td>{transaction.description}</Td>
                <Td>
                  <Badge colorScheme={transaction.category.color}>
                    {transaction.category.name}
                  </Badge>
                </Td>
                <Td isNumeric color={transaction.amount >= 0 ? "green.500" : "red.500"}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}

export default Analysis;