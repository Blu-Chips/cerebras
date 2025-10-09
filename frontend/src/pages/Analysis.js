import React from 'react';
import {
  Container,
  VStack,
  Grid,
  GridItem,
  Heading,
  Text,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from '@chakra-ui/react';
import TransactionChart from '../components/TransactionChart';
import CategoryBreakdown from '../components/CategoryBreakdown';
import SavingsMatrix from '../components/SavingsMatrix';
import { useParams } from 'react-router-dom';

function Analysis() {
  const { id } = useParams();
  const [analysis, setAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/statements/analysis/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch analysis');

        const data = await response.json();
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) return <Text>Loading analysis...</Text>;
  if (!analysis) return <Text>No analysis found</Text>;

  const { transactions, categories, savings_matrix, advice } = analysis;

  // Calculate totals
  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Statement Analysis</Heading>

        <StatGroup>
          <Stat>
            <StatLabel>Total Transactions</StatLabel>
            <StatNumber>{transactions.length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Debits</StatLabel>
            <StatNumber>${totalDebits.toFixed(2)}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Credits</StatLabel>
            <StatNumber>${totalCredits.toFixed(2)}</StatNumber>
          </Stat>
        </StatGroup>

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <GridItem colSpan={2}>
            <TransactionChart transactions={transactions} />
          </GridItem>

          <GridItem>
            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>Category Breakdown</Heading>
              <CategoryBreakdown categories={categories} />
            </Box>
          </GridItem>

          <GridItem>
            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>Savings Opportunities</Heading>
              <SavingsMatrix matrix={savings_matrix} />
            </Box>
          </GridItem>

          <GridItem colSpan={2}>
            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>AI-Powered Financial Advice</Heading>
              <Text>{advice}</Text>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
}

export default Analysis;