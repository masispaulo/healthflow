import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // AQUI: Transformamos o ID num formato aceito pelas lojas (com. + nome)
  appId: 'com.healthflow.plataforma',
  
  appName: 'HealthFlow',
  webDir: 'dist', // Importante: aponta para a pasta do Vite
  server: {
    androidScheme: 'https'
  }
};

export default config;