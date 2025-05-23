import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { fetchIRMSNList } from '../../store/slices/irmsnSlice';
import type { RootState } from '../../store/store';

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch();
  const { irmsnList, loading } = useSelector((state: RootState) => state.irmsn);
  const [search, setSearch] = React.useState('');

  useEffect(() => {
    dispatch(fetchIRMSNList(search));
  }, [dispatch, search]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>View IRMSN</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Search IRMSN"
          variant="outlined"
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mr: 2 }}
        />
        <IconButton onClick={() => dispatch(fetchIRMSNList(search))}>
          <SearchIcon />
        </IconButton>
      </Box>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
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
                irmsnList.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.status}</TableCell>
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

export default ViewIRMSN; 