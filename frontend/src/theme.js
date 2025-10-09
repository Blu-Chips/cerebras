import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e5f0ff',
    100: '#b8d4ff',
    200: '#8ab8ff',
    300: '#5c9cff',
    400: '#2e80ff',
    500: '#0064ff',
    600: '#004ecc',
    700: '#003999',
    800: '#002466',
    900: '#000f33',
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorMode === 'dark' ? 'brand.200' : 'brand.500',
        color: 'white',
        _hover: {
          bg: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
        },
      }),
    },
  },
};

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
};

export const theme = extendTheme({ config, colors, components, styles });