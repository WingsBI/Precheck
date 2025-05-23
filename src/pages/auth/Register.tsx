import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { register } from '../../store/slices/authSlice';
import {
  getAllDepartments,
  getUserRoles,
  getSecurityQuestions,
} from '../../store/slices/commonSlice';
import type { RootState } from '../../store/store';

interface RegisterFormValues {
  username: string;
  email: string;
  userId: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  plant: string;
  securityQuestion: string;
  securityAnswer: string;
}

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  userId: Yup.string().required('User ID is required'),
  password: Yup.string().required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  role: Yup.string().required('Role is required'),
  department: Yup.string().required('Department is required'),
  plant: Yup.string().required('Plant is required'),
  securityQuestion: Yup.string().required('Security question is required'),
  securityAnswer: Yup.string().required('Security answer is required'),
});

const getFieldError = (touched: boolean | undefined, error: string | undefined): string => {
  if (!touched || !error) return '';
  return error;
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const {
    departments,
    userRoles,
    securityQuestions,
    isLoading: isLoadingCommon,
  } = useSelector((state: RootState) => state.common);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    dispatch(getAllDepartments() as any);
    dispatch(getUserRoles() as any);
    dispatch(getSecurityQuestions() as any);
  }, [dispatch]);

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      username: '',
      email: '',
      userId: '',
      password: '',
      confirmPassword: '',
      role: '',
      department: '',
      plant: '',
      securityQuestion: '',
      securityAnswer: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const { confirmPassword, ...registerData } = values;
        const transformedData = {
          username: registerData.username,
          password: registerData.password,
          name: registerData.userId,
          departmentId: Number(registerData.department),
          roleId: Number(registerData.role),
          securityQuestionId: Number(registerData.securityQuestion),
          securityAnswer: registerData.securityAnswer,
          email: registerData.email,
          plantId: Number(registerData.plant)
        };
        const resultAction = await dispatch(register(transformedData) as any);
        if (register.fulfilled.match(resultAction)) {
          navigate('/login');
        }
      } catch (err) {
        // Error handling is managed by the Redux slice
      }
    },
  });

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isLoadingCommon) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

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
          maxWidth: 730,
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
            src="/src/assets/images/godrej-logo.svg"
            alt="Godrej Logo"
            sx={{
              height: 50,
              width: 'auto',
              mb: 1,
            }}
          />
          <Typography variant="h5" color="white" fontWeight="600">
            New User Registration
          </Typography>
        </Box>

        {/* Form */}
        <CardContent sx={{ p: 3, pt: 4 }}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Username
                  </Typography>
                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    placeholder="Enter username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.username && Boolean(formik.errors.username)}
                    helperText={getFieldError(formik.touched.username, formik.errors.username as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={getFieldError(formik.touched.email, formik.errors.email as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    User ID
                  </Typography>
                  <TextField
                    fullWidth
                    id="userId"
                    name="userId"
                    placeholder="Enter user ID"
                    value={formik.values.userId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.userId && Boolean(formik.errors.userId)}
                    helperText={getFieldError(formik.touched.userId, formik.errors.userId as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Security Question
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    id="securityQuestion"
                    name="securityQuestion"
                    value={formik.values.securityQuestion}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.securityQuestion && Boolean(formik.errors.securityQuestion)}
                    helperText={getFieldError(formik.touched.securityQuestion, formik.errors.securityQuestion as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  >
                    {securityQuestions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.question}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={getFieldError(formik.touched.password, formik.errors.password as string)}
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
                </Box>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Role
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    id="role"
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                    helperText={getFieldError(formik.touched.role, formik.errors.role as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  >
                    {userRoles.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Department
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    id="department"
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.department && Boolean(formik.errors.department)}
                    helperText={getFieldError(formik.touched.department, formik.errors.department as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  >
                    {departments.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Plant
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    id="plant"
                    name="plant"
                    value={formik.values.plant}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.plant && Boolean(formik.errors.plant)}
                    helperText={getFieldError(formik.touched.plant, formik.errors.plant as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  >
                    {departments.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Security Answer
                  </Typography>
                  <TextField
                    fullWidth
                    id="securityAnswer"
                    name="securityAnswer"
                    placeholder="Enter answer"
                    value={formik.values.securityAnswer}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.securityAnswer && Boolean(formik.errors.securityAnswer)}
                    helperText={getFieldError(formik.touched.securityAnswer, formik.errors.securityAnswer as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      }
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="600" color="secondary.main" mb={1}>
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={getFieldError(formik.touched.confirmPassword, formik.errors.confirmPassword as string)}
                    InputProps={{
                      sx: {
                        borderRadius: 1.5,
                        bgcolor: 'background.default',
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleToggleConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {error && (
              <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="secondary"
                sx={{
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                  minWidth: '120px',
                }}
              >
                Back to Login
              </Button>
             
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  minWidth: '120px',
                  backgroundColor: '#a8005a',
                  '&:hover': { backgroundColor: '#8e004b' }
                }}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register; 