import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Box,
  CssBaseline,
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
  Stack,
  Collapse,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ViewList as ViewListIcon,
  QrCode as QrCodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import type { RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";
const drawerWidth = 240;
const drawerCollapsedWidth = 65;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  subItems?: MenuItem[];
}

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  padding: 0, // Removed all padding
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("lg")]: {
    paddingLeft: drawerCollapsedWidth - 20, // Reduced by additional 10px
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: "linear-gradient(135deg, #A8005A 0%, #d63384 100%)",
  boxShadow: "0 2px 8px rgba(168, 0, 90, 0.2)",
  [theme.breakpoints.up("lg")]: {
    paddingLeft: 0, // Remove the left padding on desktop
  },
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  width: open ? drawerWidth : drawerCollapsedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    width: open ? drawerWidth : drawerCollapsedWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    background: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)",
    borderRight: "1px solid rgba(0, 0, 0, 0.12)",
    boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
    position: "fixed",
    height: "100vh",
    zIndex: theme.zIndex.drawer,
  },
}));

const LogoBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  minHeight: 64,
  background: "linear-gradient(135deg, #A8005A 0%, #d63384 100%)",
  color: "white",
  cursor: "pointer",
  justifyContent: open ? "space-between" : "center",
  transition: theme.transitions.create(["justify-content", "padding"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  "&:hover": {
    background: "linear-gradient(135deg, #920050 0%, #c02a5b 100%)",
  },
}));

const ADMIN_ROLE = "Admin";
const QC_ROLE = "QC";
const STORE_ROLE = "Store";

export default function Layout() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // Menu items structure
  const menuItems: MenuItem[] = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "IR/MSN Number",
      icon: <ViewListIcon />,
      path: "/irmsn",
      subItems: [
        {
          text: "View All IR/MSN",
          icon: <VisibilityIcon />,
          path: "/irmsn/view",
        },
        { 
          text: "Create", 
          icon: <AddIcon />, 
          path: "/irmsn/generate",
          roles: [ADMIN_ROLE, QC_ROLE]
        },
        {
          text: "Search/Update",
          icon: <SearchIcon />,
          path: "/irmsn/search-update",
          roles: [ADMIN_ROLE, QC_ROLE]
        },
      ],
    },
    {
      text: "QR Code",
      icon: <QrCodeIcon />,
      path: "/qrcode",
      subItems: [
        {
          text: "View QR Code",
          icon: <VisibilityIcon />,
          path: "/qrcode/view",
        },
        {
          text: "Generate QR Code",
          icon: <AddIcon />,
          path: "/qrcode/generate",
          roles: [ADMIN_ROLE, QC_ROLE]
        },
      ],
    },
    {
      text: "Precheck",
      icon: <AssignmentIcon />,
      path: "/precheck",
      subItems: [
        { 
          text: "View Precheck", 
          icon: <VisibilityIcon />, 
          path: "/precheck/view" 
        },
        {
          text: "View Consumed In",
          icon: <SearchIcon />,
          path: "/precheck/consumed",
        },
        {
          text: "Make Order",
          icon: <ShoppingCartIcon />,
          path: "/precheck/make-order",
          roles: [ADMIN_ROLE, STORE_ROLE]
        },
        { 
          text: "Make Precheck", 
          icon: <AddIcon />, 
          path: "/precheck/make",
          roles: [ADMIN_ROLE, STORE_ROLE]
        },
        { 
          text: "Store In", 
          icon: <StoreIcon />, 
          path: "/precheck/store-in",
          roles: [ADMIN_ROLE, STORE_ROLE]
        },
        { 
          text: "Stored In Components", 
          icon: <VisibilityIcon />, 
          path: "/precheck/stored-components",
          roles: [ADMIN_ROLE, STORE_ROLE]
        },
      ],
    },
    {
      text: "SOP",
      icon: <ArticleIcon />,
      path: "/sop",
      subItems: [
        { text: "View SOP", icon: <VisibilityIcon />, path: "/sop/view" },
      ],
    },
    {
      text: "Components",
      icon: <DescriptionIcon />,
      path: "/components",
    },
  ];

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!user) return [];

    return menuItems.map(item => {
      // If item has no subItems, return as is
      if (!item.subItems) return item;

      // Filter subItems based on roles
      const filteredSubItems = item.subItems.filter(subItem => {
        // If no roles specified, show to all users
        if (!subItem.roles) return true;
        
        // If roles specified, check if user has required role
        return subItem.roles.includes(user?.role || '');
      });

      // Return item with filtered subItems
      return {
        ...item,
        subItems: filteredSubItems
      };
    }).filter(item => {
      // Remove main menu items that have no visible subItems
      if (item.subItems && item.subItems.length === 0) return false;
      return true;
    });
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Dashboard", path: "/dashboard" }];

    if (
      pathSegments.length > 1 ||
      (pathSegments.length === 1 && pathSegments[0] !== "dashboard")
    ) {
      const mainItem = menuItems.find(
        (item) =>
          location.pathname.startsWith(item.path) && item.path !== "/dashboard"
      );

      if (mainItem) {
        breadcrumbs.push({ label: mainItem.text, path: mainItem.path });

        const subItem = mainItem.subItems?.find(
          (sub) => location.pathname === sub.path
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

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleLogoClick = () => {
    if (isDesktop) {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0) {
      // If drawer is collapsed, open it first when clicking on items with subitems
      if (!desktopOpen && isDesktop) {
        setDesktopOpen(true);
      }

      const isExpanded = expandedItems.includes(item.text);
      setExpandedItems((prev) =>
        isExpanded
          ? prev.filter((text) => text !== item.text)
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
    navigate("/login");
    handleProfileMenuClose();
  };

  const drawerContent = (isDesktopVersion: boolean = false) => (
    <>
      <LogoBox
        open={isDesktopVersion ? desktopOpen : true}
        onClick={isDesktopVersion ? handleLogoClick : undefined}
      >
        {(!isDesktopVersion || desktopOpen) && (
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontSize: { xs: "1rem", md: "1.25rem" },
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Godrej Precheck
          </Typography>
        )}
        {isDesktopVersion && (
          <IconButton
            sx={{
              color: "white",
              opacity: desktopOpen ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
        {!isDesktopVersion && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </LogoBox>

      <List sx={{ flex: 1, py: 1 }}>
        {getFilteredMenuItems().map((item) => (
          <Box key={item.text}>
            <ListItem disablePadding sx={{ display: "block" }}>
              <Tooltip
                title={!desktopOpen && isDesktopVersion ? item.text : ""}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => handleItemClick(item)}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(168, 0, 90, 0.08)",
                      transform: "translateX(4px)",
                    },
                    backgroundColor:
                      location.pathname.startsWith(item.path) &&
                      item.path !== "/dashboard"
                        ? "rgba(168, 0, 90, 0.12)"
                        : "transparent",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: desktopOpen || !isDesktopVersion ? 3 : "auto",
                      justifyContent: "center",
                      color: location.pathname.startsWith(item.path)
                        ? "#A8005A"
                        : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: desktopOpen || !isDesktopVersion ? 1 : 0,
                      "& .MuiListItemText-primary": {
                        fontSize: "0.9rem",
                        fontWeight: location.pathname.startsWith(item.path)
                          ? 600
                          : 500,
                        color: location.pathname.startsWith(item.path)
                          ? "#A8005A"
                          : "text.primary",
                      },
                    }}
                  />
                  {item.subItems &&
                    item.subItems.length > 0 &&
                    (desktopOpen || !isDesktopVersion) && (
                      <Box sx={{ ml: 1 }}>
                        {expandedItems.includes(item.text) ? (
                          <ExpandLessIcon sx={{ color: "text.secondary" }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                        )}
                      </Box>
                    )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {item.subItems && item.subItems.length > 0 && (
              <Collapse
                in={
                  expandedItems.includes(item.text) &&
                  (desktopOpen || !isDesktopVersion)
                }
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      onClick={() => handleSubItemClick(subItem)}
                      sx={{
                        pl: 7,
                        py: 1,
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "rgba(168, 0, 90, 0.05)",
                          transform: "translateX(4px)",
                        },
                        backgroundColor:
                          location.pathname === subItem.path
                            ? "rgba(168, 0, 90, 0.08)"
                            : "transparent",
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color:
                            location.pathname === subItem.path
                              ? "#A8005A"
                              : "text.secondary",
                        }}
                      >
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={subItem.text}
                        sx={{
                          "& .MuiListItemText-primary": {
                            fontSize: "0.825rem",
                            fontWeight:
                              location.pathname === subItem.path ? 600 : 400,
                            color:
                              location.pathname === subItem.path
                                ? "#A8005A"
                                : "text.secondary",
                          },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* App Bar */}
      <StyledAppBar position="fixed">
        <Toolbar sx={{ minHeight: 64 }}>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 0, color: "white" }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Godrej Aerospace Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              pl: { xs: 0, lg: 0 }, // Add slight padding on desktop
              transition: theme.transitions.create("padding", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}  
          >
            <img
              src="/assets/logo.jpg"
              alt="Logo"
              style={{ height: 32, marginRight: 8, borderRadius: 10 }}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: 0.5,
                color: "white",
                display: "flex",
                alignItems: "center",
              }}
            >
              Godrej Aerospace
            </Typography>
          </Box>

          {/* User Profile */}
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
              <Stack
                alignItems="flex-end"
                sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "white" }}
                >
                  {user.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {user.department} - {user.role}
                </Typography>
              </Stack>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                onClick={handleProfileMenuOpen}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {user.username?.substring(0, 2).toUpperCase() || "U"}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                PaperProps={{
                  sx: {
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    borderRadius: 2,
                    mt: 1,
                  },
                }}
              >
                <MenuItem onClick={() => navigate("/settings")}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Settings"
                    secondary={`User: ${user.username}`}
                  />
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            background: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)",
            zIndex: theme.zIndex.drawer + 2,
          },
        }}
      >
        {drawerContent(false)}
      </Drawer>

      {/* Desktop Drawer */}
      <StyledDrawer
        variant="permanent"
        open={desktopOpen}
        sx={{
          display: { xs: "none", lg: "block" },
        }}
      >
        {drawerContent(true)}
      </StyledDrawer>

      {/* Main Content */}
      <Main>
        <Toolbar />
        <Box
          sx={{
            p: 0, // Completely removed padding
            // ml: { xs: 0, lg: desktopOpen ? `${drawerWidth - drawerCollapsedWidth}px` : 0 },
            transition: theme.transitions.create("margin-left", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
}
