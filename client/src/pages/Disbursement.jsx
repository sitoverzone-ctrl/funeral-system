import React, { useState, useEffect } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Typography, 
  DatePicker, 
  Space, 
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm 
} from 'antd'
import { 
  WalletOutlined, 
  BankOutlined, 
  PlusOutlined, 
  CalendarOutlined,
  BookOutlined,
  DeleteOutlined,
  EditOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

export default function Disbursement() {
  const outletContext = useOutletContext()
  const theme = outletContext?.theme || { primary: '#1f3a8a' }
  const primaryColor = theme.primary || '#1f3a8a'
  const location = useLocation()
  
  const user = outletContext?.user || { role: 'staff' }
  const canManage = user.role === 'manager' || user.role === 'dev'

  const isAccount88 = location.pathname.includes('88')
  const [selectedDate, setSelectedDate] = useState(dayjs())

  const [totalBankBalance88, setTotalBankBalance88] = useState(0)
  const [totalBankBalance87, setTotalBankBalance87] = useState(0)

  // States บัญชี 88
  const [disbursements88, setDisbursements88] = useState([])
  const [isModalOpen88, setIsModalOpen88] = useState(false)
  const [editingItem88, setEditingItem88] = useState(null)
  const [form88] = Form.useForm()

  // States บัญชี 87
  const [disbursements87, setDisbursements87] = useState([])
  const [isModalOpen87, setIsModalOpen87] = useState(false)
  const [editingItem87, setEditingItem87] = useState(null)
  const [form87] = Form.useForm()

  const loadData = () => {
    const saved88 = JSON.parse(localStorage.getItem('funeral_disbursements_88')) || []
    setDisbursements88(saved88)

    const saved87 = JSON.parse(localStorage.getItem('funeral_disbursements_87')) || []
    setDisbursements87(saved87)

    const bank88 = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
    const totalDisbursed88 = saved88.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    setTotalBankBalance88(Math.max(0, bank88 - totalDisbursed88))

    const bank87 = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
    const cash87 = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
    const currentTotal87 = bank87 + cash87
    const totalDisbursed87 = saved87.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    setTotalBankBalance87(Math.max(0, currentTotal87 - totalDisbursed87))
  }

  useEffect(() => {
    loadData()
  }, [])

  const targetDateStr = selectedDate.format('YYYY-MM-DD')

  // --- บันทึก / แก้ไข ถอนเงิน บัญชี 88 ---
  const handleSaveDisbursement88 = (values) => {
    const amt = Number(values.amount || 0)
    const saved88 = JSON.parse(localStorage.getItem('funeral_disbursements_88')) || []

    if (editingItem88) {
      // กรณีแก้ไขรายรายการ (คืนเงินเก่าก่อน แล้วเช็คยอดใหม่)
      const oldAmt = editingItem88.amount
      const bank88 = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
      const otherDisbursed = saved88.filter(i => i.id !== editingItem88.id).reduce((s, i) => s + i.amount, 0)
      
      if (amt > (bank88 - otherDisbursed)) {
        message.error('จำนวนเงินถอนเกินยอดคงเหลือในระบบ!')
        return
      }

      const updated = saved88.map(item => item.id === editingItem88.id ? { ...item, ...values, amount: amt } : item)
      setDisbursements88(updated)
      localStorage.setItem('funeral_disbursements_88', JSON.stringify(updated))
      message.success('แก้ไขรายการถอนเงิน บัญชี 88 เรียบร้อยแล้ว')
    } else {
      // กรณีเพิ่มใหม่
      if (amt > totalBankBalance88) {
        message.error('จำนวนเงินถอนมากกว่ายอดเงินคงเหลือในระบบ!')
        return
      }
      const newItem = {
        id: 'DIS88-' + Date.now(),
        date: targetDateStr,
        deceasedName: values.deceasedName,
        memberId: values.memberId || '-',
        amount: amt,
        note: values.note || '-'
      }
      const updated = [newItem, ...saved88]
      setDisbursements88(updated)
      localStorage.setItem('funeral_disbursements_88', JSON.stringify(updated))
      message.success(`บันทึกถอนเงิน บัญชี 88 จำนวน ${amt.toLocaleString()} บาท เรียบร้อย`)
    }

    loadData()
    setIsModalOpen88(false)
    setEditingItem88(null)
    form88.resetFields()
  }

  // --- บันทึก / แก้ไข เบิกจ่าย บัญชี 87 ---
  const handleSaveDisbursement87 = (values) => {
    const amt = Number(values.amount || 0)
    const saved87 = JSON.parse(localStorage.getItem('funeral_disbursements_87')) || []

    if (editingItem87) {
      const bank87 = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
      const cash87 = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
      const totalPool = bank87 + cash87
      const otherDisbursed = saved87.filter(i => i.id !== editingItem87.id).reduce((s, i) => s + i.amount, 0)

      if (amt > (totalPool - otherDisbursed)) {
        message.error('จำนวนเงินเบิกจ่ายเกินยอดคงเหลือในระบบ!')
        return
      }

      const updated = saved87.map(item => item.id === editingItem87.id ? { ...item, ...values, amount: amt } : item)
      setDisbursements87(updated)
      localStorage.setItem('funeral_disbursements_87', JSON.stringify(updated))
      message.success('แก้ไขรายการเบิกจ่าย บัญชี 87 เรียบร้อยแล้ว')
    } else {
      if (amt > totalBankBalance87) {
        message.error('จำนวนเงินเบิกจ่ายมากกว่ายอดเงินคงเหลือในระบบ!')
        return
      }
      const newItem = {
        id: 'DIS87-' + Date.now(),
        date: targetDateStr,
        category: values.category,
        receiver: values.receiver,
        amount: amt,
        note: values.note || '-'
      }
      const updated = [newItem, ...saved87]
      setDisbursements87(updated)
      localStorage.setItem('funeral_disbursements_87', JSON.stringify(updated))
      message.success(`บันทึกเบิกจ่าย บัญชี 87 จำนวน ${amt.toLocaleString()} บาท เรียบร้อย`)
    }

    loadData()
    setIsModalOpen87(false)
    setEditingItem87(null)
    form87.resetFields()
  }

  // --- ลบรายรายการ (เฉพาะ Manager / Dev) ---
  const handleDeleteItem = (id, accountType) => {
    if (!canManage) {
      message.error('เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์ลบหรือแก้ไขรายการ!')
      return
    }

    if (accountType === '88') {
      const updated = disbursements88.filter(item => item.id !== id)
      setDisbursements88(updated)
      localStorage.setItem('funeral_disbursements_88', JSON.stringify(updated))
      message.success('ลบรายการถอนเงิน บัญชี 88 เรียบร้อย (คืนยอดเข้าระบบแล้ว)')
    } else {
      const updated = disbursements87.filter(item => item.id !== id)
      setDisbursements87(updated)
      localStorage.setItem('funeral_disbursements_87', JSON.stringify(updated))
      message.success('ลบรายการเบิกจ่าย บัญชี 87 เรียบร้อย (คืนยอดเข้าระบบแล้ว)')
    }
    loadData()
  }

  const filtered88 = disbursements88.filter(item => item.date === targetDateStr)
  const filtered87 = disbursements87.filter(item => item.date === targetDateStr)

  const columns88 = [
    { title: 'วันที่ถอนเงิน', dataIndex: 'date', key: 'date', width: 110 },
    { title: 'รหัสสมาชิก / ผู้เสียชีวิต', dataIndex: 'deceasedName', key: 'deceasedName', render: (text, record) => <b>{text} (รหัส: {record.memberId})</b> },
    { title: 'หมายเหตุ', dataIndex: 'note', key: 'note' },
    { title: 'จำนวนเงินถอน (บาท)', dataIndex: 'amount', key: 'amount', align: 'right', render: (v) => <Text type="danger" strong>- {Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</Text> },
    { 
      title: 'จัดการ', 
      key: 'action', 
      width: 160, 
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            disabled={!canManage}
            onClick={() => {
              setEditingItem88(record)
              form88.setFieldsValue(record)
              setIsModalOpen88(true)
            }}
          >
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบรายการนี้?"
            description="ยอดเงินจะถูกคืนกลับเข้าระบบ"
            onConfirm={() => handleDeleteItem(record.id, '88')}
            okText="ยืนยันลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, disabled: !canManage }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">ลบ</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ]

  const columns87 = [
    { title: 'วันที่เบิกจ่าย', dataIndex: 'date', key: 'date', width: 110 },
    { title: 'ประเภทค่าใช้จ่าย', dataIndex: 'category', key: 'category', render: (v) => <Tag color="orange">{v}</Tag> },
    { title: 'ผู้รับเงิน / รายละเอียด', dataIndex: 'receiver', key: 'receiver' },
    { title: 'หมายเหตุ', dataIndex: 'note', key: 'note' },
    { title: 'จำนวนเงินเบิกจ่าย (บาท)', dataIndex: 'amount', key: 'amount', align: 'right', render: (v) => <Text type="danger" strong>- {Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</Text> },
    { 
      title: 'จัดการ', 
      key: 'action', 
      width: 160, 
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            disabled={!canManage}
            onClick={() => {
              setEditingItem87(record)
              form87.setFieldsValue(record)
              setIsModalOpen87(true)
            }}
          >
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบรายการนี้?"
            description="ยอดเงินจะถูกคืนกลับเข้าระบบ"
            onConfirm={() => handleDeleteItem(record.id, '87')}
            okText="ยืนยันลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, disabled: !canManage }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">ลบ</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ]

  return (
    <div style={{ maxWidth: 1250, margin: '0 auto', background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
      
      <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', borderLeft: `4px solid ${primaryColor}` }}>
        <Space>
          <BookOutlined style={{ color: primaryColor, fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 'bold' }}>
            ระบบถอนเงิน / เบิกจ่าย — บัญชี {isAccount88 ? '88 (ถอนเงินสงเคราะห์ศพ)' : '87 (เบิกจ่ายค่าใช้จ่ายสำนักงาน)'} ประจำวัน
          </Title>
        </Space>
        <Space>
          <Text strong><CalendarOutlined /> เลือกวันที่:</Text>
          <DatePicker 
            value={selectedDate} 
            onChange={(date) => date && setSelectedDate(date)} 
            format="DD / MM / YYYY" 
            style={{ fontWeight: 'bold' }}
          />
        </Space>
      </div>

      {isAccount88 ? (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #2563eb' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#1d4ed8' }}>ยอดเงินคงเหลือรวม (บัญชี 88 หลังหักถอน)</Text>} 
                  value={totalBankBalance88} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
            <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large"
                onClick={() => {
                  setEditingItem88(null)
                  form88.resetFields()
                  setIsModalOpen88(true)
                }}
                style={{ background: '#ef4444', fontWeight: 'bold' }}
              >
                + บันทึกถอนเงินค่าศพ (บัญชี 88)
              </Button>
            </Col>
          </Row>

          <Card title={<Text strong style={{ color: '#b91c1c' }}>รายการถอนเงินค่าศพ บัญชี 88 ประจำวันที่ {selectedDate.format('DD MMMM YYYY')}</Text>} size="small" style={{ borderRadius: 8 }}>
            <Table 
              dataSource={filtered88} 
              columns={columns88} 
              rowKey="id" 
              size="small" 
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: 'ยังไม่มีรายการถอนเงินในวันที่เลือก' }}
              bordered
            />
          </Card>
        </div>
      ) : (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #059669' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#047857' }}>ยอดเงินคงเหลือรวม (บัญชี 87 หลังหักเบิกจ่าย)</Text>} 
                  value={totalBankBalance87} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#047857', fontWeight: 'bold' }}
                  prefix={<WalletOutlined />}
                />
              </Card>
            </Col>
            <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large"
                onClick={() => {
                  setEditingItem87(null)
                  form87.resetFields()
                  setIsModalOpen87(true)
                }}
                style={{ background: '#d97706', fontWeight: 'bold' }}
              >
                + บันทึกเบิกจ่ายค่าใช้จ่าย (บัญชี 87)
              </Button>
            </Col>
          </Row>

          <Card title={<Text strong style={{ color: '#b45309' }}>รายการเบิกจ่าย บัญชี 87 ประจำวันที่ {selectedDate.format('DD MMMM YYYY')}</Text>} size="small" style={{ borderRadius: 8 }}>
            <Table 
              dataSource={filtered87} 
              columns={columns87} 
              rowKey="id" 
              size="small" 
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: 'ยังไม่มีรายการเบิกจ่ายในวันที่เลือก' }}
              bordered
            />
          </Card>
        </div>
      )}

      {/* Modal บัญชี 88 */}
      <Modal
        title={<Text strong style={{ color: '#ef4444' }}>{editingItem88 ? 'แก้ไขรายการถอนเงิน (บัญชี 88)' : 'บันทึกถอนเงินค่าศพ (บัญชี 88)'}</Text>}
        open={isModalOpen88}
        onCancel={() => { setIsModalOpen88(false); setEditingItem88(null); }}
        footer={null}
      >
        <Form form={form88} layout="vertical" onFinish={handleSaveDisbursement88} style={{ marginTop: 16 }}>
          <Form.Item name="memberId" label="รหัสสมาชิก (ผู้เสียชีวิต)">
            <Input placeholder="เช่น 2670" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item name="deceasedName" label="ชื่อ-นามสกุล ผู้เสียชีวิต / ผู้รับเงิน" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
            <Input placeholder="เช่น นายสมชาย ใจดี" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item name="amount" label="จำนวนเงินถอน (บาท)" rules={[{ required: true, message: 'กรุณากรอกจำนวนเงิน' }]}>
            <InputNumber style={{ width: '100%', height: 40, fontSize: 18 }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="note" label="หมายเหตุ / รายละเอียดการจ่าย">
            <TextArea rows={3} placeholder="เช่น จ่ายเงินสงเคราะห์ศพงวดที่..." />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Space>
              <Button onClick={() => { setIsModalOpen88(false); setEditingItem88(null); }}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#ef4444', fontWeight: 'bold' }}>
                {editingItem88 ? 'บันทึกการแก้ไข' : 'ยืนยันบันทึกถอนเงิน'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal บัญชี 87 */}
      <Modal
        title={<Text strong style={{ color: '#d97706' }}>{editingItem87 ? 'แก้ไขรายการเบิกจ่าย (บัญชี 87)' : 'บันทึกเบิกจ่ายค่าใช้จ่าย (บัญชี 87)'}</Text>}
        open={isModalOpen87}
        onCancel={() => { setIsModalOpen87(false); setEditingItem87(null); }}
        footer={null}
      >
        <Form form={form87} layout="vertical" onFinish={handleSaveDisbursement87} style={{ marginTop: 16 }}>
          <Form.Item name="category" label="เลือกประเภทค่าใช้จ่าย" rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
            <Select placeholder="-- กรุณาเลือกประเภท --" style={{ height: 40 }}>
              <Option value="เงินเดือนเจ้าหน้าที่">เงินเดือนเจ้าหน้าที่</Option>
              <Option value="เบี้ยประชุมกรรมการ (ประจำเดือน)">เบี้ยประชุมกรรมการ (ประจำเดือน)</Option>
              <Option value="เบี้ยประชุมกรรมการ (ประจำปี)">เบี้ยประชุมกรรมการ (ประจำปี)</Option>
              <Option value="ซื้อของเข้าสำนักงาน">ซื้อของเข้าสำนักงาน</Option>
              <Option value="ค่าเช่าสำนักงาน">ค่าเช่าสำนักงาน</Option>
              <Option value="ค่าไฟฟ้า">ค่าไฟฟ้า</Option>
              <Option value="ค่าโทรศัพท์ / ค่าอินเทอร์เน็ต">ค่าโทรศัพท์ / ค่าอินเทอร์เน็ต</Option>
              <Option value="อื่นๆ">อื่นๆ</Option>
            </Select>
          </Form.Item>
          <Form.Item name="receiver" label="ผู้รับเงิน / รายละเอียดคู่ค้า" rules={[{ required: true, message: 'กรุณากรอกผู้รับเงิน' }]}>
            <Input placeholder="เช่น การไฟฟ้าส่วนภูมิภาค..." style={{ height: 40 }} />
          </Form.Item>
          <Form.Item name="amount" label="จำนวนเงินเบิกจ่าย (บาท)" rules={[{ required: true, message: 'กรุณากรอกจำนวนเงิน' }]}>
            <InputNumber style={{ width: '100%', height: 40, fontSize: 18 }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="note" label="หมายเหตุเพิ่มเติม">
            <TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Space>
              <Button onClick={() => { setIsModalOpen87(false); setEditingItem87(null); }}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#d97706', fontWeight: 'bold' }}>
                {editingItem87 ? 'บันทึกการแก้ไข' : 'ยืนยันบันทึกเบิกจ่าย'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

    </div>
  )
}