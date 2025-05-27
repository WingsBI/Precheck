import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { RootState } from '../store/store';
import { viewPrecheckDetails } from '../store/slices/precheckSlice';
import { getSopForAssembly } from '../store/slices/sopSlice';
import { fetchDashboardData } from '../store/slices/dashboardSlice';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { precheckDetails, isLoading: isPrecheckLoading } = useSelector(
    (state: RootState) => state.precheck
  );
  const { sopDetails, isLoading: isSopLoading } = useSelector(
    (state: RootState) => state.sop
  );
  const { data: dashboardData, loading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    // Fetch recent precheck and SOP data
    dispatch(viewPrecheckDetails({ limit: 5 }) as any);
    dispatch(getSopForAssembly({ limit: 5 }) as any);
    dispatch(fetchDashboardData() as any);
  }, [dispatch]);

  const summaryCards = [
    {
      title: 'Total Prechecks',
      value: precheckDetails?.length || 0,
      icon: <AssignmentIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Total SOPs',
      value: sopDetails?.length || 0,
      icon: <DescriptionIcon fontSize="large" color="secondary" />,
    },
    {
      title: 'Completed',
      value: precheckDetails?.filter((p: any) => p.status === 'Completed')?.length || 0,
      icon: <CheckCircleIcon fontSize="large" color="success" />,
    },
    {
      title: 'Pending',
      value: precheckDetails?.filter((p: any) => p.status === 'Pending')?.length || 0,
      icon: <WarningIcon fontSize="large" color="warning" />,
    },
  ];

  if (isPrecheckLoading || isSopLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}> {/* Minimal padding for content readability */}
      <Typography variant="h4" gutterBottom component="h2">
        Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }}
            >
              {card.icon}
              <Typography variant="h6" component="h3" sx={{ mt: 1 }}>
                {card.title}
              </Typography>
              <Typography variant="h4" component="p">
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2}>
        {/* Recent Prechecks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Recent Prechecks" />
            <Divider />
            <CardContent>
              <List>
                {precheckDetails?.slice(0, 5).map((precheck: any) => (
                  <ListItem key={precheck.id}>
                    <ListItemText
                      primary={precheck.assemblyNumber}
                      secondary={`Status: ${precheck.status} | Date: ${new Date(
                        precheck.createdAt
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
                {(!precheckDetails || precheckDetails.length === 0) && (
                  <ListItem>
                    <ListItemText primary="No recent prechecks" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent SOPs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Recent SOPs" />
            <Divider />
            <CardContent>
              <List>
                {sopDetails?.slice(0, 5).map((sop: any) => (
                  <ListItem key={sop.id}>
                    <ListItemText
                      primary={sop.assemblyNumber}
                      secondary={`Date: ${new Date(sop.createdAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
                {(!sopDetails || sopDetails.length === 0) && (
                  <ListItem>
                    <ListItemText primary="No recent SOPs" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Dashboard Data
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : dashboardData && Array.isArray(dashboardData) ? (
                dashboardData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No dashboard data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard; 