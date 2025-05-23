import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import { fetchIRMSNList, updateIRMSN } from '../../store/slices/irmsnSlice';
import type { RootState } from '../../store/store';
import type { AppDispatch } from '../../store/store';

const SearchUpdateIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList } = useSelector((state: RootState) => state.irmsn);
  const [search, setSearch] = useState('');
  const [editRow, setEditRow] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', status: '', date: '' });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchIRMSNList(search));
  }, [dispatch, search]);

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({ name: row.name, status: row.status, date: row.date });
    setOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    dispatch(updateIRMSN({ ...editRow, ...editForm }));
    setOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Search & Update IRMSN</Typography>
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
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {irmsnList.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(row)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit IRMSN</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            name="name"
            value={editForm.name}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Status"
            name="status"
            value={editForm.status}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            value={editForm.date}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchUpdateIRMSN; 