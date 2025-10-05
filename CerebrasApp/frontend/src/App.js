import React, { useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ChakraProvider, Box, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

import FileUpload from './components/FileUpload';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const AnalysisResults = ({ data }) => {
  return (
    <Box mt={8} p={4} borderWidth={1} borderRadius="md">
      <h2>Analysis Results</h2>
      
      {/* Transaction summary table */}
      <Table variant="simple" mt={4}>
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Description</Th>
            <Th isNumeric>Amount</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.transactions?.map((tx, i) => (
            <Tr key={i}>
              <Td>{tx.date}</Td>
              <Td>{tx.description}</Td>
              <Td isNumeric>${tx.amount.toFixed(2)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      {/* Add charts here */}
    </Box>
  );
};

function App() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [advice, setAdvice] = useState('');
  const [savingsMatrix, setSavingsMatrix] = useState({});
  const [summary, setSummary] = useState({});
  const [selectedModel, setSelectedModel] = useState('llama-4-scout-17b-16e-instruct');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);

    try {
      // 1. Send to backend (update endpoint as needed)
      const response = await axios.post('/api/analyze', { file });
      
      // 2. Store results for display
      setResults(response.data);
      
      // Extract transactions
      const transactionsResponse = await axios.post('/api/analyze-transactions/', {
        file_path: response.data.temp_path,
        model_name: selectedModel
      });
      
      setTransactions(transactionsResponse.data.transactions);
      setCategories(transactionsResponse.data.categories);
      setAdvice(transactionsResponse.data.advice);
      setSavingsMatrix(transactionsResponse.data.savings_matrix);
      
      // Get summary
      const summaryResponse = await axios.get('/api/transaction-summary/', {
        params: { file_path: response.data.temp_path }
      });
      
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.post('/api/convert-to-excel/', {
        file_path: transactions.file_path
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bank_statement.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading Excel file:', error);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/cerebras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      const data = await res.json();
      setSummary(data.result.choices[0].text);
    } catch (err) {
      alert('Error summarizing');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: Object.keys(categories),
    datasets: [
      {
        label: 'Debits',
        data: Object.values(categories).map(() => Math.random() * 1000), // Placeholder data
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Credits',
        data: Object.values(categories).map(() => Math.random() * 1000), // Placeholder data
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Transaction Summary by Category',
      },
    },
  };

  return (
    <ChakraProvider>
      <div className="App">
        <header className="App-header">
          <h1>Cerebras Bank Statement Analyzer</h1>
        </header>
        
        <main>
          <section className="upload-section">
            <h2>Upload Bank Statement</h2>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <button onClick={handleUpload}>Analyze Statement</button>
          </section>
          
          <section className="model-selection">
            <h2>Select AI Model</h2>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              <option value="llama-4-scout-17b-16e-instruct">Llama 4 Scout</option>
              <option value="llama3.1-8b">Llama 3.1 8B</option>
              <option value="llama-3.3-70b">Llama 3.3 70B</option>
              <option value="qwen-3-32b">Qwen 3 32B</option>
            </select>
          </section>
          
          {summary && (
            <section className="summary-section">
              <h2>Transaction Summary</h2>
              <p>Total Transactions: {summary.total_transactions}</p>
              <p>Total Debits: {summary.debits?.count} (${summary.debits?.total_amount})</p>
              <p>Total Credits: {summary.credits?.count} (${summary.credits?.total_amount})</p>
            </section>
          )}
          
          {advice && (
            <section className="advice-section">
              <h2>Financial Advice</h2>
              <p>{advice}</p>
            </section>
          )}
          
          {Object.keys(categories).length > 0 && (
            <section className="chart-section">
              <h2>Transaction Analysis</h2>
              <Bar data={chartData} options={chartOptions} />
            </section>
          )}
          
          {savingsMatrix && Object.keys(savingsMatrix).length > 0 && (
            <section className="savings-section">
              <h2>Savings Projections</h2>
              <table>
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Monthly Savings</th>
                    <th>Annual Savings</th>
                    <th>ROI Projection</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(savingsMatrix).map(([strategy, data]) => (
                    <tr key={strategy}>
                      <td>{strategy.charAt(0).toUpperCase() + strategy.slice(1)}</td>
                      <td>${data.monthly_savings}</td>
                      <td>${data.annual_savings}</td>
                      <td>{data.roi_projection}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          
          <section className="download-section">
            <h2>Download Results</h2>
            <button onClick={handleDownloadExcel}>Download Excel Statement</button>
            <button onClick={() => window.print()}>Download Analysis Report</button>
          </section>
          
          {/* Display results when available */}
          {results && <AnalysisResults data={results} />}
        </main>
      </div>
    </ChakraProvider>
  );
}

export default App;