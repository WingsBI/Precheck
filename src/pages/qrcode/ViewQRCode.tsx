import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { fetchQRCodeList } from '../../store/slices/qrcodeSlice';
import type { RootState } from '../../store/store';

const ViewQRCode: React.FC = () => {
  const dispatch = useDispatch();
  const { qrcodeList, loading } = useSelector((state: RootState) => state.qrcode);

  useEffect(() => {
    dispatch(fetchQRCodeList());
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>View QR Codes</Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Date</TableCell>
                {/* Add more columns as needed */}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                qrcodeList.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.code}</TableCell>
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

export default ViewQRCode; 