import { AppLogo } from '@renderer/config/env'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setAuth, selectIsAuthenticated } from '@renderer/store/authStore'
import { Button, Form, Input, message, Card } from 'antd'
import { Lock, User } from 'lucide-react'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/v1'

const LoginPage: FC = () => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, values)
      const { token, user } = res.data
      dispatch(setAuth({ token, username: user.username, role: user.role, userId: user.id, canEditPublicKB: user.canEditPublicKB }))
      message.success(`欢迎回来，${user.username}！`)
      navigate('/')
    } catch (err: unknown) {
      const errorMsg = (err as any)?.response?.data?.error || '登录失败'
      message.error(errorMsg)
    }
  }

  return (
    <LoginContainer>
      <LoginCard>
        <LogoSection>
          <img src={AppLogo} alt="Logo" style={{ width: 80, height: 80, borderRadius: 16 }} />
          <AppTitle>知识库</AppTitle>
          <AppSubtitle>"地智"知识库平台</AppSubtitle>
        </LogoSection>
        <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<User size={18} color="#999" />} placeholder="用户名" autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<Lock size={18} color="#999" />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ height: 44, fontSize: 16 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </LoginCard>
    </LoginContainer>
  )
}

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const LoginCard = styled(Card)`
  width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .ant-card-body {
    padding: 40px;
  }
`

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`

const AppTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-1, #333);
  margin: 12px 0 4px 0;
`

const AppSubtitle = styled.p`
  font-size: 14px;
  color: #999;
  margin: 0;
`

export default LoginPage
