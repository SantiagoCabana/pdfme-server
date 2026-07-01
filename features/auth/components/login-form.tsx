'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, ConfigProvider, Form, Input, Typography, theme } from 'antd';

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(values: LoginValues) {
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(payload.message ?? 'No se pudo iniciar sesion.');
        return;
      }

      router.push('/templates');
      router.refresh();
    } catch {
      setError('No se pudo conectar con el login interno.');
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
          colorPrimary: '#174a72',
          colorText: '#17212b',
          fontFamily: 'Segoe UI, Helvetica Neue, sans-serif',
        },
        components: {
          Button: { controlHeight: 44, fontWeight: 600 },
          Input: { controlHeight: 44 },
        },
      }}
    >
      <Card className="loginCard" bordered>
        <div className="loginHead">
          <div className="brandMark">PS</div>
          <div>
            <Typography.Text className="loginKicker">Pdfme Server</Typography.Text>
            <Typography.Title level={3} className="loginTitle">
              Iniciar sesion
            </Typography.Title>
          </div>
        </div>

        {error ? <Alert className="loginAlert" message={error} type="error" showIcon /> : null}

        <Form<LoginValues>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          initialValues={{ email: 'practisac.cursos@gmail.com' }}
        >
          <Form.Item
            label="Correo"
            name="email"
            rules={[
              { required: true, message: 'Ingresa el correo.' },
              { type: 'email', message: 'Correo invalido.' },
            ]}
          >
            <Input prefix={<MailOutlined />} autoComplete="email" />
          </Form.Item>

          <Form.Item
            label="Contrasena"
            name="password"
            rules={[{ required: true, message: 'Ingresa la contrasena.' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>

          <Button block htmlType="submit" icon={<LoginOutlined />} loading={pending} type="primary">
            Entrar
          </Button>
        </Form>
      </Card>
    </ConfigProvider>
  );
}
