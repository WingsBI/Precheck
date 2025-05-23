import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { fetchConsumptionList } from '../../store/slices/precheckSlice';
import type { RootState } from '../../store/store';

const ConsumptionView: React.FC = () => {
  const dispatch = useDispatch();
  const { consumptionList, loading } = useSelector((state: RootState) => state.precheck);

  useEffect(() => {
    dispatch(fetchConsumptionList());
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Precheck Consumption View</Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Date</TableCell>
                {/* Add more columns as needed */}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                consumptionList.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.item}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ConsumptionView; 