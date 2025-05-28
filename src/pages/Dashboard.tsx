import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Description as DescriptionIcon,
  FolderOpen as ProjectIcon,
} from '@mui/icons-material';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Make Pre-check',
      description: 'Access and manage make pre-check related tasks',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: '#2196F3', // Blue
      route: '/precheck/make-order',
    },
    {
      title: 'Generate IR, MSN',
      description: 'Access and manage gen. ir msn no. related tasks',
      icon: <QrCodeIcon sx={{ fontSize: 40 }} />,
      color: '#9C27B0', // Purple
      route: '/irmsn/generate',
    },
    {
      title: 'Store Consumption',
      description: 'Access and manage Store Consumption related tasks',
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: '#4CAF50', // Green
      route: '/precheck/store-in',
    },
    {
      title: 'Generate Barcode',
      description: 'Access and manage Barcode generation related tasks',
      icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />,
      color: '#FF9800', // Orange
      route: '/qrcode/generate',
    },
    {
      title: 'Generate SOP',
      description: 'Access and manage SOP Generation related tasks',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      color: '#F44336', // Red
      route: '/sop/view',
    },
    {
      title: 'View Precheck',
      description: 'Access and view precheck details and status',
      icon: <ProjectIcon sx={{ fontSize: 40 }} />,
      color: '#3F51B5', // Indigo
      route: '/precheck/view',
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        component="h1"
        sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          mb: 4
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                border: '1px solid',
                borderColor: 'divider',
              }}
              onClick={() => handleCardClick(card.route)}
            >
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: card.color,
                      width: 64,
                      height: 64,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.4,
                      }}
                    >
                      {card.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 