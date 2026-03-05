import { useAppDispatch, useAppSelector } from '@renderer/store'
import { selectAuthToken, selectIsAdmin } from '@renderer/store/authStore'
import { performLogout } from '@renderer/utils/logout'
import { Button, Card, Form, Input, message, Modal, Select, Space, Switch, Table, Tag, Typography } from 'antd'
import axios from 'axios'
import { LogOut, Plus, Trash2, UserCog } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const API_BASE = 'http://localhost:3000/v1'

interface UserInfo {
  id: string
  username: string
  role: 'admin' | 'user'
  canEditPublicKB?: boolean
  created_at: string
}

const AdminPage: FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isAdmin = useAppSelector(selectIsAdmin)
  const token = useAppSelector(selectAuthToken)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (!isAdmin) {
      navigate('/')
    }
  }, [isAdmin, navigate])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (err: any) {
      message.error(err?.response?.data?.error || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAdmin && token) {
      fetchUsers()
    }
  }, [isAdmin, token, fetchUsers])

  const handleCreateUser = async (values: { username: string; password: string; role: string }) => {
    setCreating(true)
    try {
      await axios.post(
        `${API_BASE}/auth/users`,
        { username: values.username, password: values.password, role: values.role || 'user' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      message.success(`用户 ${values.username} 创建成功`)
      form.resetFields()
      setCreateModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      message.error(err?.response?.data?.error || '创建用户失败')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = (user: UserInfo) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      async onOk() {
        try {
          await axios.delete(`${API_BASE}/auth/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          message.success(`用户 ${user.username} 已删除`)
          fetchUsers()
        } catch (err: any) {
          message.error(err?.response?.data?.error || '删除用户失败')
        }
      }
    })
  }

  const handleTogglePublicKB = async (user: UserInfo, checked: boolean) => {
    try {
      await axios.put(
        `${API_BASE}/auth/users/${user.id}`,
        { canEditPublicKB: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      message.success(`已${checked ? '开启' : '关闭'} ${user.username} 的公共知识库编辑权限`)
      fetchUsers()
    } catch (err: any) {
      message.error(err?.response?.data?.error || '更新权限失败')
    }
  }

  const handleLogout = () => {
    performLogout()
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role === 'admin' ? '管理员' : '普通用户'}</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '公共知识库权限',
      key: 'canEditPublicKB',
      render: (_: any, record: UserInfo) =>
        record.role !== 'admin' ? (
          <Switch
            checked={record.canEditPublicKB === true}
            onChange={(checked) => handleTogglePublicKB(record, checked)}
            size="small"
          />
        ) : (
          <Typography.Text type="secondary">默认拥有</Typography.Text>
        )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: UserInfo) =>
        record.role !== 'admin' ? (
          <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => handleDeleteUser(record)}>
            删除
          </Button>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        )
    }
  ]

  if (!isAdmin) return null

  return (
    <PageContainer>
      <HeaderBar>
        <HeaderLeft>
          <UserCog size={24} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            用户管理
          </Typography.Title>
        </HeaderLeft>
        <Space>
          <Button onClick={() => navigate('/')}>返回主页</Button>
          <Button icon={<LogOut size={14} />} onClick={handleLogout}>
            退出登录
          </Button>
        </Space>
      </HeaderBar>
      <ContentArea>
        <Card
          title={
            <Space>
              <span>用户列表</span>
              <Tag>{users.length} 人</Tag>
            </Space>
          }
          extra={
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setCreateModalOpen(true)}>
              新增用户
            </Button>
          }>
          <Table dataSource={users} columns={columns} rowKey="id" loading={loading} pagination={false} />
        </Card>
      </ContentArea>

      <Modal
        title="新增用户"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        centered>
        <Form form={form} onFinish={handleCreateUser} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' }
            ]}>
            <Input placeholder="请输入用户名" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="user">
            <Select
              options={[
                { label: '普通用户', value: 'user' },
                { label: '管理员', value: 'admin' }
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCreateModalOpen(false)
                  form.resetFields()
                }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: var(--color-background, #f5f5f5);
`

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--color-background-soft, #fff);
  border-bottom: 1px solid var(--color-border, #e8e8e8);
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text, #333);
`

const ContentArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`

export default AdminPage
