import React from 'react';
import { Box, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

function CategoryBreakdown({ categories }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Calculate total spending
  const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);

  // Sort categories by amount (descending)
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a);

  // Define colors for different categories
  const categoryColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF99CC',
    '#00CC99',
    '#FF6666',
    '#6666FF'
  ];

  const chartData = {
    labels: sortedCategories.map(([category]) => category),
    datasets: [{
      data: sortedCategories.map(([, amount]) => amount),
      backgroundColor: categoryColors.slice(0, sortedCategories.length),
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Spending by Category'
      }
    }
  };

  return (
    <Box 
      p={6} 
      bg={bgColor} 
      shadow="md" 
      borderRadius="lg" 
      borderWidth="1px"
      borderColor={borderColor}
      width="100%"
    >
      <Text fontSize="xl" mb={4}>Category Breakdown</Text>
      <VStack spacing={4}>
        <Box height="400px" width="100%">
          <Doughnut data={chartData} options={chartOptions} />
        </Box>
        <Box width="100%">
          {sortedCategories.map(([category, amount], index) => {
            const percentage = (amount / total * 100).toFixed(1);
            return (
              <Box 
                key={category} 
                p={2} 
                display="flex" 
                justifyContent="space-between"
                alignItems="center"
              >
                <Text color={categoryColors[index]}>●</Text>
                <Text flex="1" ml={2}>{category}</Text>
                <Text>${amount.toFixed(2)}</Text>
                <Text ml={2} color="gray.500">
                  ({percentage}%)
                </Text>
              </Box>
            );
          })}
        </Box>
        <Box width="100%" pt={4} borderTopWidth="1px" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold">
            Total Spending: ${total.toFixed(2)}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export default CategoryBreakdown;