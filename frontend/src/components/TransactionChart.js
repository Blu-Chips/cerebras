import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Box } from '@chakra-ui/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function TransactionChart({ transactions }) {
  // Group transactions by category
  const categories = {};
  transactions.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = {
        debits: 0,
        credits: 0
      };
    }
    if (t.type === 'debit') {
      categories[t.category].debits += t.amount;
    } else {
      categories[t.category].credits += t.amount;
    }
  });

  const data = {
    labels: Object.keys(categories),
    datasets: [
      {
        label: 'Debits',
        data: Object.values(categories).map(c => c.debits),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Credits',
        data: Object.values(categories).map(c => c.credits),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Transactions by Category'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
      <Bar options={options} data={data} />
    </Box>
  );
}

export default TransactionChart;