import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Typography, 
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  InputNumber
} from 'antd'
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

export default function SystemUsers() {
  const navigate = useNavigate()
  const context = useOutletContext() || {}
  const user = context.user || { role: 'staff', name: 'เจ้าหน้าที่', code: 'ST001' }
  const theme = context.theme || { primary: '#1f3a8a' }
  const primaryColor = theme.primary || '#1f3a8a'
  
  const isStaff = user?.role === 'staff'
  const isManager = user?.role === 'manager'
  const isDev = user?.role === 'dev'

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('funeral_staff_users')
    let list = []
    if (saved) {
      try { list = JSON.parse(saved) } catch (e) { /* ignore */ }
    }
    return list.map(item => {
      if (item.expiryDate && item.expiryDate !== 'ไม่มีวันหมดอายุ') {
        const isExpired = dayjs().isAfter(dayjs(item.expiryDate), 'day')
        if (isExpired && item.status === 'ใช้งาน') {
          return { ...item, status: 'ระงับการใช้งาน' }
        }
      }
      return item
    })
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [durationType, setDurationType] = useState('months')
  const [form] = Form.useForm()

  useEffect(() => {
    localStorage.setItem('funeral_staff_users', JSON.stringify(staffList))
  }, [staffList])

  const visibleStaffList = staffList

  const handleAdd = () => {
    setEditingRecord(null)
    setDurationType('months')
    form.resetFields()
    form.setFieldsValue({
      role: 'staff',
      durationType: 'months',
      durationValue: isStaff ? 12 : 12,
      status: 'ใช้งาน'
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    const isSelf = record.code.toUpperCase() === user?.code?.toUpperCase()

    // Staff ห้ามแก้คนอื่นนอกจากตัวเอง และห้ามแก้ Manager/Dev
    if (isStaff && !isSelf) {
      message.error('❌ เจ้าหน้าที่ไม่สามารถแก้ไขบัญชีของผู้อื่นได้')
      return
    }
    // Manager ห้ามแก้ Dev
    if (isManager && record.role === 'dev') {
      message.error('❌ ผู้จัดการไม่มีสิทธิ์แก้ไขบัญชีนักพัฒนา (Dev)')
      return
    }

    setEditingRecord(record)
    const currentDurationType = record.durationType || (record.expiryDate === 'ไม่มีวันหมดอายุ' ? 'never' : 'months')
    setDurationType(currentDurationType)
    
    form.setFieldsValue({
      code: record.code,
      password: '', 
      name: record.name,
      role: record.role,
      durationType: currentDurationType,
      durationValue: record.durationValue || 12,
      status: record.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = (key, recordRole, recordCode) => {
    if (isStaff) {
      message.error('❌ เจ้าหน้าที่ไม่มีสิทธิ์ลบบัญชีผู้ใช้งาน')
      return
    }
    if (isManager && recordRole === 'dev') {
      message.error('❌ ผู้จัดการไม่มีสิทธิ์ลบบัญชีนักพัฒนา (Dev)')
      return
    }
    setStaffList(staffList.filter(item => item.key !== key))
    message.success(`ลบผู้ใช้งานรหัส ${recordCode} เรียบร้อยแล้ว`)
  }

  const handleRenew = (record) => {
    if (isStaff) {
      message.error('❌ เจ้าหน้าที่ไม่มีสิทธิ์ต่ออายุบัญชี')
      return
    }
    if (isManager && record.role === 'dev') {
      message.error('❌ ผู้จัดการไม่มีสิทธิ์ต่ออายุบัญชีนักพัฒนา (Dev)')
      return
    }

    const updated = staffList.map(item => {
      if (item.key === record.key) {
        let newExpiry = ''
        if (item.durationType === 'months') {
          const addMonths = item.durationValue || 12
          newExpiry = dayjs().add(addMonths, 'month').format('YYYY-MM-DD')
          message.success(`ต่ออายุรหัสให้ ${item.name} สำเร็จ (+${addMonths} เดือน เป็นถึง ${newExpiry})`)
        } else if (item.durationType === 'years') {
          const addYears = item.durationValue || 1
          newExpiry = dayjs().add(addYears, 'year').format('YYYY-MM-DD')
          message.success(`ต่ออายุรหัสให้ ${item.name} สำเร็จ (+${addYears} ปี เป็นถึง ${newExpiry})`)
        } else {
          newExpiry = 'ไม่มีวันหมดอายุ'
          message.success(`ต่ออายุรหัสให้ ${item.name} สำเร็จ (ถาวร)`)
        }
        return { ...item, expiryDate: newExpiry, status: 'ใช้งาน' }
      }
      return item
    })
    setStaffList(updated)
  }

  const handleModalSave = () => {
    form.validateFields().then(values => {
      // ถ้าเป็น Staff บังคับให้สร้างได้แค่ Staff และอายุไม่เกิน 12 เดือน
      if (isStaff) {
        if (values.role !== 'staff') {
          message.error('❌ เจ้าหน้าที่สามารถสร้างได้เฉพาะบัญชีเจ้าหน้าที่เท่านั้น')
          return
        }
        if (values.durationType !== 'months' || (values.durationValue || 0) > 12) {
          message.error('❌ เจ้าหน้าที่กำหนดอายุรหัสได้สูงสุดไม่เกิน 12 เดือน (1 ปี) เท่านั้น')
          return
        }
      }

      if (isManager && values.role === 'dev') {
        message.error('❌ ผู้จัดการไม่สามารถสร้างบัญชีนักพัฒนา (Dev) ได้')
        return
      }

      let expiryDate = editingRecord?.expiryDate || 'ไม่มีวันหมดอายุ'
      let val = values.durationValue || 1

      if (values.durationType === 'months') {
        expiryDate = dayjs().add(val, 'month').format('YYYY-MM-DD')
      } else if (values.durationType === 'years') {
        expiryDate = dayjs().add(val, 'year').format('YYYY-MM-DD')
      } else if (values.durationType === 'never') {
        expiryDate = 'ไม่มีวันหมดอายุ'
      }

      const isSelf = editingRecord && editingRecord.code.toUpperCase() === user?.code?.toUpperCase()
      const finalRole = isStaff ? 'staff' : values.role
      const finalStatus = isStaff ? (editingRecord ? editingRecord.status : 'ใช้งาน') : values.status
      const finalCode = (isStaff && !isSelf && editingRecord) ? editingRecord.code : values.code.trim().toUpperCase()

      if (editingRecord) {
        const updated = staffList.map(item => {
          if (item.key === editingRecord.key) {
            return {
              ...item,
              code: finalCode,
              name: values.name,
              role: finalRole,
              status: finalStatus,
              durationType: values.durationType,
              durationValue: val,
              expiryDate,
              password: values.password ? values.password.trim() : item.password
            }
          }
          return item
        })
        setStaffList(updated)
        message.success('บันทึกการเปลี่ยนข้อมูลผู้ใช้งานสำเร็จ')
      } else {
        const newStaff = {
          key: Date.now().toString(),
          code: finalCode,
          password: values.password ? values.password.trim() : '123',
          name: values.name,
          role: finalRole,
          status: finalStatus,
          durationType: values.durationType,
          durationValue: val,
          expiryDate
        }
        setStaffList([newStaff, ...staffList])
        message.success(`เพิ่มผู้ใช้งาน ${values.name} สำเร็จ`)
      }
      setIsModalOpen(false)
    })
  }

  const columns = [
    { 
      title: 'รหัสผู้ใช้ (Login ID)', 
      dataIndex: 'code', 
      key: 'code',
      render: (text) => <Text strong style={{ color: primaryColor }}>{text}</Text>
    },
    { 
      title: 'รหัสผ่าน (Password)', 
      dataIndex: 'password', 
      key: 'password',
      render: (text, record) => {
        const isSelf = record.code.toUpperCase() === user?.code?.toUpperCase()

        // Staff มองไม่เห็นรหัส Manager/Dev หรือคนอื่น
        if (isStaff && !isSelf) {
          return <Tag color="default">••••••</Tag>
        }
        // Manager มองไม่เห็นรหัส Dev
        if (isManager && record.role === 'dev') {
          return (
            <Tag color="purple" icon={<SafetyCertificateOutlined />} style={{ fontSize: 12, padding: '2px 8px' }}>
              •••••• (ข้อมูลลับนักพัฒนา)
            </Tag>
          )
        }

        return (
          <Space>
            <EyeInvisibleOutlined style={{ color: '#94a3b8' }} />
            <Text type="secondary" style={{ letterSpacing: 2 }}>{text}</Text>
          </Space>
        )
      }
    },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'name', key: 'name' },
    { 
      title: 'ระดับสิทธิ์', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => {
        if (role === 'dev') return <Tag color="purple">นักพัฒนา (Dev)</Tag>
        if (role === 'manager') return <Tag color="blue">ผู้จัดการ (Manager)</Tag>
        return <Tag color="green">เจ้าหน้าที่ (Staff)</Tag>
      }
    },
    { 
      title: 'อายุรหัส', 
      key: 'duration',
      render: (_, record) => {
        if (record.durationType === 'never' || record.expiryDate === 'ไม่มีวันหมดอายุ') {
          return <Tag color="cyan">ไม่มีวันหมดอายุ</Tag>
        }
        if (record.durationType === 'months') {
          return `${record.durationValue || 12} เดือน`
        }
        return `${record.durationValue || 1} ปี`
      }
    },
    { title: 'วันหมดอายุ', dataIndex: 'expiryDate', key: 'expiryDate' },
    { 
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color={status === 'ใช้งาน' ? 'success' : 'error'}>{status}</Tag>
    },
    {
      title: 'จัดการ',
      key: 'actions',
      align: 'center',
      render: (_, record) => {
        const isSelf = record.code.toUpperCase() === user?.code?.toUpperCase()
        const isTargetDev = record.role === 'dev'
        const isTargetMgr = record.role === 'manager'

        // Staff จัดการได้เฉพาะของตัวเอง (แก้รหัสผ่านตัวเอง)
        if (isStaff) {
          if (!isSelf) return <Tag color="default" style={{ fontSize: 11 }}>จำกัดสิทธิ์</Tag>
          return (
            <Tooltip title="แก้ไขรหัสผ่านของตนเอง">
              <Button type="text" icon={<EditOutlined style={{ color: '#0284c7' }} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )
        }

        // Manager ห้ามจัดการ Dev
        if (isManager && isTargetDev) {
          return <Tag color="default" style={{ fontSize: 11 }}>สงวนสิทธิ์ Dev</Tag>
        }

        return (
          <Space size="middle">
            <Tooltip title="ต่ออายุรหัส">
              <Button size="small" type="dashed" onClick={() => handleRenew(record)}>ต่ออายุ</Button>
            </Tooltip>
            <Tooltip title="แก้ไขข้อมูล">
              <Button type="text" icon={<EditOutlined style={{ color: '#0284c7' }} />} onClick={() => handleEdit(record)} />
            </Tooltip>
            <Popconfirm title="ยืนยันการลบ" description={`คุณต้องการลบผู้ใช้งานรหัส ${record.code} หรือไม่?`} onConfirm={() => handleDelete(record.key, record.role, record.code)} okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    },
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Header Card */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: primaryColor }}>🔐 จัดการรหัสผู้ใช้และสิทธิ์ระบบ (System Users)</Title>
            <Text type="secondary">ผู้ใช้งานปัจจุบัน: <strong style={{ color: primaryColor }}>{user?.name}</strong> ({user?.role === 'manager' ? 'ผู้จัดการ' : user?.role === 'staff' ? 'เจ้าหน้าที่' : 'Dev'})</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<UserAddOutlined />} size="large" style={{ background: primaryColor }} onClick={handleAdd}>
              เพิ่มผู้ใช้งานใหม่
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={visibleStaffList}
          pagination={false}
          bordered
          size="middle"
          locale={{ emptyText: 'ยังไม่มีผู้ใช้งานในระบบ กรุณาเพิ่มผู้ใช้งานใหม่' }}
          onRow={() => ({ style: { cursor: 'default' } })}
        />
      </Card>

      {/* Modal เพิ่ม/แก้ไข */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleModalSave}
        okText="บันทึก"
        cancelText="ปิด"
        okButtonProps={{ style: { background: primaryColor } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="code" label="รหัสผู้ใช้ (Login ID)" rules={[{ required: true, message: 'กรุณากรอกรหัสผู้ใช้' }]}>
            <Input placeholder="เช่น ST002 หรือ MG002" disabled={isStaff && !!editingRecord} />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="รหัสผ่าน (Password)" 
            extra={editingRecord ? "* พิมพ์รหัสผ่านใหม่หากต้องการเปลี่ยน" : "* กรอกรหัสผ่านสำหรับล็อกอิน"}
            rules={editingRecord ? [] : [{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password placeholder="กรอกรหัสผ่าน" />
          </Form.Item>

          <Form.Item name="name" label="ชื่อ-นามสกุลผู้ใช้งาน" rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}>
            <Input placeholder="ระบุชื่อ-นามสกุล" disabled={isStaff && editingRecord} />
          </Form.Item>

          <Form.Item name="role" label="ระดับสิทธิ์ (Permission)" rules={[{ required: true }]}>
            <Select disabled={isStaff}>
              <Option value="staff">เจ้าหน้าที่ (Staff)</Option>
              {isDev && <Option value="manager">ผู้จัดการ (Manager)</Option>}
              {isDev && <Option value="dev">นักพัฒนา (Dev)</Option>}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="durationType" label="ประเภทกำหนดอายุรหัส" rules={[{ required: true }]}>
                <Select onChange={(val) => setDurationType(val)} disabled={isStaff}>
                  <Option value="months">ระบุจำนวนเดือน {isStaff ? '(สูงสุด 12 เดือน)' : ''}</Option>
                  {!isStaff && <Option value="years">ระบุจำนวนปี</Option>}
                  {!isStaff && <Option value="never">ไม่มีวันหมดอายุ (ถาวร)</Option>}
                </Select>
              </Form.Item>
            </Col>
            {(durationType === 'months' || durationType === 'years') && (
              <Col span={10}>
                <Form.Item name="durationValue" label={durationType === 'months' ? 'จำนวนเดือน' : 'จำนวนปี'} rules={[{ required: true, message: 'กรุณาระบุจำนวน' }]}>
                  <InputNumber 
                    min={1} 
                    max={isStaff && durationType === 'months' ? 12 : 99} 
                    style={{ width: '100%' }} 
                    addonAfter={durationType === 'months' ? 'เดือน' : 'ปี'} 
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Form.Item name="status" label="สถานะการใช้งาน" rules={[{ required: true }]}>
            <Select disabled={isStaff}>
              <Option value="ใช้งาน">ใช้งาน</Option>
              <Option value="ระงับการใช้งาน">ระงับการใช้งาน</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}