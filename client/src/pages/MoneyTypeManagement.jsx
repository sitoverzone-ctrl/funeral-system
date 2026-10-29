import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Typography, Row, Col, Table, Modal, Space, message, Popconfirm } from 'antd'
import { SearchOutlined, SaveOutlined, DeleteOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons'

const { Text } = Typography

// ข้อมูลเริ่มต้นตามต้นฉบับ
const DEFAULT_MONEY_TYPES = [
  { key: '01', code: '01', name: 'เงินสงเคราะห์รับล่วงหน้า', accountCode: '' },
  { key: '02', code: '02', name: 'จ่ายเงินสงเคราะห์ศพ', accountCode: '' },
  { key: '03', code: '03', name: 'ค่าสมัคร', accountCode: '' },
  { key: '04', code: '04', name: 'ค่าบำรุงประจำปี', accountCode: '' },
  { key: '05', code: '05', name: 'หัก 7 %', accountCode: '' },
  { key: '06', code: '06', name: 'เงินบริจาค', accountCode: '' },
  { key: '07', code: '07', name: 'อื่นๆ', accountCode: '' },
]

export default function MoneyTypeManagement() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [moneyTypes, setMoneyTypes] = useState([])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [accountCode, setAccountCode] = useState('')

  // State สำหรับ Modal ค้นหา (แสดงรายการ)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  // โหลดข้อมูลจาก localStorage ตอนเปิดหน้าจอ
  useEffect(() => {
    try {
      const saved = localStorage.getItem('funeral_money_types')
      if (saved) {
        setMoneyTypes(JSON.parse(saved))
      } else {
        setMoneyTypes(DEFAULT_MONEY_TYPES)
        localStorage.setItem('funeral_money_types', JSON.stringify(DEFAULT_MONEY_TYPES))
      }
    } catch (e) {
      console.error(e)
      setMoneyTypes(DEFAULT_MONEY_TYPES)
    }
  }, [])

  // บันทึกหรือเพิ่มข้อมูลใหม่
  const handleSave = () => {
    if (!code.trim()) {
      message.warning('กรุณาระบุรหัสประเภทรับเงิน')
      return
    }
    if (!name.trim()) {
      message.warning('กรุณาระบุชื่อประเภทรับเงิน')
      return
    }

    try {
      const existingIndex = moneyTypes.findIndex(item => item.code === code.trim())
      let updatedList = [...moneyTypes]

      const newItem = {
        key: code.trim(),
        code: code.trim(),
        name: name.trim(),
        accountCode: accountCode.trim()
      }

      if (existingIndex >= 0) {
        updatedList[existingIndex] = newItem
        message.success(`อัปเดตข้อมูลรหัส ${code} สำเร็จ`)
      } else {
        updatedList.push(newItem)
        message.success(`บันทึกข้อมูลรหัส ${code} สำเร็จ`)
      }

      setMoneyTypes(updatedList)
      localStorage.setItem('funeral_money_types', JSON.stringify(updatedList))
      handleClear()
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  // ลบข้อมูล
  const handleDelete = () => {
    if (!code.trim()) {
      message.warning('กรุณาเลือกหรือระบุรหัสที่ต้องการลบ')
      return
    }

    try {
      const updatedList = moneyTypes.filter(item => item.code !== code.trim())
      setMoneyTypes(updatedList)
      localStorage.setItem('funeral_money_types', JSON.stringify(updatedList))
      message.success(`ลบข้อมูลรหัส ${code} สำเร็จ`)
      handleClear()
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  // ล้างฟอร์ม
  const handleClear = () => {
    setCode('')
    setName('')
    setAccountCode('')
  }

  // เลือกรายการจาก Modal
  const handleSelectRow = (record) => {
    setCode(record.code)
    setName(record.name)
    setAccountCode(record.accountCode || '')
    setIsModalOpen(false)
  }

  // กรองข้อมูลใน Modal ค้นหา
  const filteredModalData = moneyTypes.filter(item => 
    item.code.toLowerCase().includes(searchText.toLowerCase()) ||
    item.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const modalColumns = [
    { title: 'รหัส', dataIndex: 'code', key: 'code', width: 90, align: 'center' },
    { title: 'ชื่อประเภทรับเงิน', dataIndex: 'name', key: 'name' },
    { title: 'รหัสบัญชี', dataIndex: 'accountCode', key: 'accountCode', width: 110, align: 'center' },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>ข้อมูลประเภทรับเงิน</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* ฟอร์มกรอกข้อมูลหลัก */}
        <div style={{ background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 20 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
              <Text strong>รหัสประเภทรับเงิน</Text>
            </Col>
            <Col xs={24} sm={18}>
              <Space.Compact style={{ width: '100%', maxWidth: 260 }}>
                <Input 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  placeholder="ระบุรหัส..." 
                  maxLength={10}
                />
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  onClick={() => setIsModalOpen(true)}
                  style={{ background: primaryColor }}
                />
              </Space.Compact>
            </Col>

            <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
              <Text strong>ชื่อ</Text>
            </Col>
            <Col xs={24} sm={18}>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="ระบุชื่อประเภทรับเงิน..." 
                style={{ maxWidth: 500 }}
              />
            </Col>

            <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
              <Text strong>รหัสบัญชี</Text>
            </Col>
            <Col xs={24} sm={18}>
              <Input 
                value={accountCode} 
                onChange={e => setAccountCode(e.target.value)} 
                placeholder="ระบุรหัสบัญชี..." 
                style={{ maxWidth: 220 }}
              />
            </Col>
          </Row>
        </div>

        {/* ปุ่มควบคุม */}
        <Row justify="center" gutter={16} style={{ marginBottom: 12 }}>
          <Col>
            <Popconfirm
              title="ยืนยันการลบข้อมูล"
              description={`คุณต้องการลบข้อมูลรหัส ${code} ใช่หรือไม่?`}
              onConfirm={handleDelete}
              okText="ใช่"
              cancelText="ยกเลิก"
            >
              <Button danger icon={<DeleteOutlined />} size="large" style={{ minWidth: 110, fontWeight: 'bold' }}>
                ลบ
              </Button>
            </Popconfirm>
          </Col>
          <Col>
            <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleSave} style={{ background: '#059669', minWidth: 110, fontWeight: 'bold' }}>
              บันทึก
            </Button>
          </Col>
          <Col>
            <Button icon={<CloseOutlined />} size="large" onClick={() => window.history.back()} style={{ minWidth: 110, fontWeight: 'bold' }}>
              ปิด
            </Button>
          </Col>
        </Row>
      </Card>

      {/* หน้าต่าง Modal แสดงรายการ */}
      <Modal 
        title="แสดงรายการ" 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
        width={650}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ marginRight: 8 }}>คำที่ค้นหา</Text>
          <Input 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            placeholder="พิมพ์ค้นหารหัสหรือชื่อ..." 
            allowClear 
            style={{ width: 'calc(100% - 90px)' }}
          />
        </div>

        <Table 
          dataSource={filteredModalData} 
          columns={modalColumns} 
          size="small" 
          bordered
          rowKey="code"
          pagination={{ pageSize: 6 }}
          onRow={(record) => ({
            onClick: () => handleSelectRow(record),
            style: { cursor: 'pointer' }
          })}
          locale={{ emptyText: 'ไม่พบรายการข้อมูล' }}
        />
      </Modal>
    </div>
  )
}