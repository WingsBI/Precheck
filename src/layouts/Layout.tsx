import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Chip,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ViewList as ViewListIcon,
  QrCode as QrCodeIcon,
  AccountCircle as AccountCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import type { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';

const drawerWidth = 280;
const mobileDrawerWidth = 240;

// Role constants matching C# application
const ADMIN_ROLE = "Admin";
const QC_ROLE = "QC";
const STORE_ROLE = "Store";

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  subItems?: MenuItem[];
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
    marginLeft: open ? 0 : `-${drawerWidth}px`,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  [theme.breakpoints.up('lg')]: {
    marginLeft: 0,
  },
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.up('md')]: {
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
    marginLeft: open ? drawerWidth : 0,
  },
  [theme.breakpoints.up('lg')]: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
}));

export default function Layout() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // Menu items structure matching C# application
  const menuItems: MenuItem[] = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard' 
    },
    { 
      text: 'IR/MSN Number', 
      icon: <ViewListIcon />, 
      path: '/irmsn',
      subItems: [
        { text: 'View All IR/MSN', icon: <VisibilityIcon />, path: '/irmsn/view' },
        { text: 'Create', icon: <AddIcon />, path: '/irmsn/generate' },
        { text: 'Search/Update', icon: <SearchIcon />, path: '/irmsn/search-update' },
      ]
    },
    { 
      text: 'QR Code', 
      icon: <QrCodeIcon />, 
      path: '/qrcode',
      subItems: [
        { text: 'View QR Code', icon: <VisibilityIcon />, path: '/qrcode/view' },
        { text: 'Generate QR Code', icon: <AddIcon />, path: '/qrcode/generate' },
      ]
    },
    { 
      text: 'Precheck', 
      icon: <AssignmentIcon />, 
      path: '/precheck',
      subItems: [
        { text: 'View Precheck', icon: <VisibilityIcon />, path: '/precheck' },
        { text: 'View Consumed In', icon: <VisibilityIcon />, path: '/precheck/consumed' },
        { text: 'Make Order', icon: <ShoppingCartIcon />, path: '/precheck/make-order' },
        { text: 'Make Precheck', icon: <AddIcon />, path: '/precheck/make' },
        { text: 'Store In', icon: <StoreIcon />, path: '/precheck/store-in' },
      ]
    },
    { 
      text: 'SOP', 
      icon: <DescriptionIcon />, 
      path: '/sop',
      subItems: [
        { text: 'View SOP', icon: <VisibilityIcon />, path: '/sop/generate' },
      ]
    }
  ];

  // Helper functions for role-based access (matching C# logic)
  const hasAdminOrQcAccess = () => user?.role === ADMIN_ROLE || user?.role === QC_ROLE;
  const hasAdminOrStoreAccess = () => user?.role === ADMIN_ROLE || user?.role === STORE_ROLE;

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    return menuItems; // Show all items for testing
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];

    if (pathSegments.length > 1 || (pathSegments.length === 1 && pathSegments[0] !== 'dashboard')) {
      // Find the main menu item
      const mainItem = menuItems.find(item => 
        location.pathname.startsWith(item.path) && item.path !== '/dashboard'
      );
      
      if (mainItem) {
        breadcrumbs.push({ label: mainItem.text, path: mainItem.path });
        
        // Find sub item if exists
        const subItem = mainItem.subItems?.find(sub => 
          location.pathname === sub.path
        );
        
        if (subItem) {
          breadcrumbs.push({ label: subItem.text, path: subItem.path });
        }
      }
    }

    return breadcrumbs;
  };

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Set initial drawer state based on screen size
  useEffect(() => {
    if (isDesktop) {
      setDesktopOpen(true);
    } else if (isTablet) {
      setDesktopOpen(false);
    }
  }, [isDesktop, isTablet]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0) {
      const isExpanded = expandedItems.includes(item.text);
      setExpandedItems(prev => 
        isExpanded 
          ? prev.filter(text => text !== item.text)
          : [...prev, item.text]
      );
    } else {
      navigate(item.path);
      if (isMobile) setMobileOpen(false);
    }
  };

  const handleSubItemClick = (subItem: MenuItem) => {
    navigate(subItem.path);
    if (isMobile) setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleProfileMenuClose();
  };

  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        minHeight: 64,
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white'
      }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Godrej Logo"
          sx={{
            height: 32,
            width: 'auto',
            mr: 1,
          }}
        />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
          Godrej Precheck
        </Typography>
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {getFilteredMenuItems().map((item) => (
          <Box key={item.text}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleItemClick(item)}
                sx={{
                  minHeight: 48,
                  justifyContent: desktopOpen ? 'initial' : 'center',
                  px: 2.5,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: desktopOpen ? 3 : 'auto',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  <Tooltip title={!desktopOpen ? item.text : ''} placement="right">
                    <span>{item.icon}</span>
                  </Tooltip>
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: desktopOpen ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      fontWeight: 500,
                    }
                  }} 
                />
                {item.subItems && item.subItems.length > 0 && desktopOpen && (
                  expandedItems.includes(item.text) ? <ExpandLessIcon /> : <ExpandMoreIcon />
                )}
              </ListItemButton>
            </ListItem>
            {item.subItems && item.subItems.length > 0 && expandedItems.includes(item.text) && desktopOpen && (
              <List component="div" disablePadding>
                {item.subItems.map((subItem) => (
                  <ListItemButton
                    key={subItem.text}
                    sx={{ pl: 6, py: 1 }}
                    onClick={() => handleSubItemClick(subItem)}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={subItem.text} 
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                        }
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <StyledAppBar position="fixed" open={isDesktop ? desktopOpen : false}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Left side - Breadcrumb */}
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" />}
              sx={{ color: 'white' }}
            >
              {generateBreadcrumbs().map((crumb, index) => (
                <Link
                  key={crumb.path}
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(crumb.path);
                  }}
                  sx={{ 
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }}
                >
                  {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />}
                  {crumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Right side - User info */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Stack alignItems="flex-end" sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                  Welcome, {user.email}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {user.departmentId || 'Department'} - {user.role || 'Role'}
                  </Typography>
                  <Chip 
                    label="v1.7" 
                    size="small" 
                    sx={{ 
                      height: 16, 
                      fontSize: '0.7rem',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white'
                    }} 
                  />
                </Stack>
              </Stack>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
              >
                <MenuItem onClick={() => navigate('/settings')}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: mobileDrawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={isDesktop ? desktopOpen : false}
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: desktopOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Tablet drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={!isDesktop && desktopOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'none', md: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Main open={isDesktop ? desktopOpen : false}>
        <Toolbar />
        <Box 
          sx={{ 
            p: { xs: 1, sm: 2, md: 3 },
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
} 