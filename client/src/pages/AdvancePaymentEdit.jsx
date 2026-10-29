import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Typography, 
  Space, 
  Button, 
  Select, 
  Input, 
  InputNumber, 
  Modal, 
  Form, 
  message, 
  Tag 
} from 'antd'
import { 
  CalendarOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined 
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

export default function AdvancePaymentEdit() {
  const outletContext = useOutletContext() || {}
  const theme = outletContext.theme || { primary: '#065f46' }
  const primaryColor = theme.primary || '#065f46'

  const [selectedYear, setSelectedYear] = useState('2569')
  const [searchMemberId, setSearchMemberId] = useState('')
  const [advanceList, setAdvanceList] = useState([])
  const [filteredList, setFilteredList] = useState([])

  // Modal เพิ่ม/แก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('funeral_advance_payments')) || []
    setAdvanceList(saved)
    setFilteredList(saved.filter(item => String(item.year) === String(selectedYear)))
  }, [])

  // ฟังก์ชันกด "แสดง" (ค้นหาตามปี และรหัสสมาชิก)
  const handleSearch = () => {
    let result = advanceList.filter(item => String(item.year) === String(selectedYear))
    if (searchMemberId.trim()) {
      result = result.filter(item => String(item.memberId).includes(searchMemberId.trim()))
    }
    setFilteredList(result)
    message.success(`พบข้อมูล ${result.length} รายการ ประจำปี ${selectedYear}`)
  }

  // บันทึกเพิ่ม / แก้ไข
  const handleSaveModal = (values) => {
    const members = JSON.parse(localStorage.getItem('funeral_members')) || []
    const member = members.find(m => String(m.id || m.memberId) === String(values.memberId))
    const memberName = member ? `${member.prefix || ''}${member.firstName} ${member.lastName}` : (values.memberName || 'สมาชิกทั่วไป')

    let updated = []
    if (editingItem) {
      updated = advanceList.map(item => item.id === editingItem.id ? { ...item, ...values, memberName, year: selectedYear } : item)
      message.success('แก้ไขรายการชำระล่วงหน้าข้ามปีเรียบร้อยแล้ว')
    } else {
      const newItem = {
        id: Date.now(),
        year: selectedYear,
        memberId: values.memberId,
        memberName: memberName,
        balanceForward: Number(values.balanceForward || 0),
        arrears: Number(values.arrears || 0)
      }
      updated = [newItem, ...advanceList]
      message.success('บันทึกรายการชำระล่วงหน้าข้ามปีเรียบร้อยแล้ว')
    }

    setAdvanceList(updated)
    localStorage.setItem('funeral_advance_payments', JSON.stringify(updated))

    setIsModalOpen(false)
    setEditingItem(null)
    form.resetFields()
    
    // อัปเดตตารางแสดงผลทันทีหลังบันทึก
    let result = updated.filter(item => String(item.year) === String(selectedYear))
    if (searchMemberId.trim()) {
      result = result.filter(item => String(item.memberId).includes(searchMemberId.trim()))
    }
    setFilteredList(result)
  }

  const columns = [
    { title: 'ปี พ.ศ.', dataIndex: 'year', key: 'year', width: 90, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'รหัสสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 100, render: (v) => <b>{v}</b> },
    { title: 'ชื่อ-นามสกุลสมาชิก', dataIndex: 'memberName', key: 'memberName' },
    { title: 'คงเหลือยกมา (บาท)', dataIndex: 'balanceForward', key: 'balanceForward', align: 'right', render: (v) => <Text type="success" strong>{Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</Text> },
    { title: 'ค้างชำระยกมา (บาท)', dataIndex: 'arrears', key: 'arrears', align: 'right', render: (v) => <Text type={v > 0 ? 'danger' : 'secondary'} strong>{Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</Text> },
    {
      title: 'จัดการ',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => {
              setEditingItem(record)
              form.setFieldsValue(record)
              setIsModalOpen(true)
            }}
          >
            แก้ไข
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
      
      <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', borderLeft: `5px solid ${primaryColor}` }}>
        <Space>
          <CalendarOutlined style={{ color: primaryColor, fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 'bold' }}>
            บันทึกแก้ไขรายการชำระล่วงหน้าข้ามปี (Advance Payment Cross-Year)
          </Title>
        </Space>
      </div>

      {/* กรอบค้นหา ปรับ Select ให้พิมพ์ระบุปีเองได้ */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: '#e6f4ea', border: '1px solid #bbf7d0' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Text strong>ปี พ.ศ.:</Text>
            <Select 
              value={selectedYear} 
              onChange={setSelectedYear} 
              showSearch
              allowClear
              placeholder="พิมพ์หรือเลือกปี พ.ศ."
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: '2569', label: '2569' },
                { value: '2568', label: '2568' },
                { value: '2567', label: '2567' },
                { value: '2570', label: '2570' },
              ]}
            />
          </Col>
          <Col xs={24} sm={10}>
            <Text strong>เลขสมาชิก</Text>
            <Input 
              value={searchMemberId} 
              onChange={(e) => setSearchMemberId(e.target.value)} 
              placeholder="ระบุรหัสสมาชิก" 
              style={{ marginTop: 4 }} 
            />
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right', paddingTop: 20 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
                style={{ background: primaryColor, fontWeight: 'bold' }}
              >
                แสดงข้อมูล
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }}
                style={{ background: '#16a34a', fontWeight: 'bold' }}
              >
                เพิ่มรายการ
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ตารางแสดงผล */}
      <Card size="small" title={<Text strong>รายการชำระล่วงหน้าและค้างชำระข้ามปี ประจำปี {selectedYear}</Text>} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Table 
          dataSource={filteredList} 
          columns={columns} 
          rowKey="id" 
          size="small" 
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'ยังไม่มีข้อมูลชำระล่วงหน้าในระบบ กรุณาเพิ่มข้อมูลใหม่' }}
          bordered
        />
      </Card>

      {/* Modal เพิ่ม / แก้ไข */}
      <Modal
        title={<Text strong style={{ color: primaryColor }}>{editingItem ? 'แก้ไขรายการชำระล่วงหน้าข้ามปี' : 'เพิ่มรายการชำระล่วงหน้าข้ามปี'}</Text>}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingItem(null); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveModal} style={{ marginTop: 16 }}>
          <Form.Item name="memberId" label="รหัสสมาชิก" rules={[{ required: true, message: 'กรุณากรอกรหัสสมาชิก' }]}>
            <Input placeholder="ระบุรหัสสมาชิก" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item name="balanceForward" label="ยอดเงินคงเหลือยกมา (บาท)">
            <InputNumber style={{ width: '100%', height: 40 }} precision={2} min={0} />
          </Form.Item>
          <Form.Item name="arrears" label="ยอดเงินค้างชำระยกมา (บาท)">
            <InputNumber style={{ width: '100%', height: 40 }} precision={2} min={0} />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Space>
              <Button onClick={() => { setIsModalOpen(false); setEditingItem(null); }}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" style={{ background: primaryColor, fontWeight: 'bold' }}>
                {editingItem ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

    </div>
  )
}