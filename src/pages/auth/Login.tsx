import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login } from '../../store/slices/authSlice';
import type { RootState } from '../../store/store';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginForm>>({});

  const validateForm = () => {
    const errors: Partial<LoginForm> = {};
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const resultAction = await dispatch(login(formData) as any);
        if (login.fulfilled.match(resultAction)) {
          navigate('/');
        }
      } catch (err) {
        // Error handling is managed by the Redux slice
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name as keyof LoginForm]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #a8005a 0%, #c2185b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          mx: 2,
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            background: 'linear-gradient(90deg, #800B4C 0%, #B5106D 100%)',
            p: 3,
            pb: 4,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{
              height: 50,
              width: 'auto',
              mb: 1,
            }}
          />
          <Typography variant="h5" color="white" fontWeight="600">
            Login
          </Typography>
        </Box>

        {/* Form */}
        <CardContent sx={{ p: 3, pt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                Username
              </Typography>
              <TextField
                fullWidth
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('password')?.focus();
                  }
                }}
                InputProps={{
                  sx: { 
                    borderRadius: 1.5,
                    bgcolor: 'background.default',
                  }
                }}
              />
            </Box>

            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="600" color="secondary.main">
                  Password
                </Typography>
              </Box>
              <TextField
                fullWidth
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                disabled={isLoading}
                InputProps={{
                  sx: {
                    borderRadius: 1.5,
                    bgcolor: 'background.default',
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Link
                  component={RouterLink}
                  to="/forget-password"
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  Forgot Password?
                </Link>
              </Box>
            </Box>

            {error && (
              <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                backgroundColor: '#a8005a',
                '&:hover': { backgroundColor: '#8e004b' }
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login; 