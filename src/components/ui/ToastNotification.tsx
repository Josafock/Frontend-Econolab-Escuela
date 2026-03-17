'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastNotification() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 3200,
        style: {
          borderRadius: '18px',
          border: '1px solid rgba(226,232,240,0.95)',
          background: 'rgba(255,255,255,0.96)',
          color: '#1e293b',
          boxShadow: '0 18px 60px rgba(15,23,42,0.16)',
          padding: '14px 16px',
        },
        success: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#b91c1c',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
