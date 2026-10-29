import React, { useState, useEffect } from 'react'
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
  message, 
  Divider,
  Tag 
} from 'antd'
import { 
  FileTextOutlined, 
  SearchOutlined, 
  SaveOutlined, 
  PrinterOutlined, 
  UserOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

export default function GroupReceipts() {
  const outletContext = useOutletContext() || {}
  const user = outletContext.user || { name: 'นายพุทธิพงศ์ ศรีจะบก' }
  const theme = outletContext.theme || { primary: '#065f46' }
  const primaryColor = theme.primary || '#065f46'

  // States ข้อมูลสมาชิกและตัวกรอง
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)

  // Options สำหรับ Dropdown ที่ดึงมาจากที่อยู่สมาชิกจริง
  const [provinceOptions, setProvinceOptions] = useState([])
  const [districtOptions, setDistrictOptions] = useState([])
  const [subDistrictOptions, setSubDistrictOptions] = useState([])

  // States ตัวกรองที่เลือก
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [subDistrict, setSubDistrict] = useState('ทั้งหมด')
  const [villageNo, setVillageNo] = useState('1-99')

  // States ฟอร์มรับเงิน
  const [advanceAmount, setAdvanceAmount] = useState(0) 
  const [maintenanceAmount, setMaintenanceAmount] = useState(0) 
  const [registerAmount, setRegisterAmount] = useState(0)
  const [donateAmount, setDonateAmount] = useState(0)
  const [otherAmount, setOtherAmount] = useState(0)

  // โหลดข้อมูลสมาชิกและตั้งค่าตัวเลือกจังหวัด/อำเภอ/ตำบลจากข้อมูลจริง
  useEffect(() => {
    const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || []
    setMembers(savedMembers)
    setFilteredMembers(savedMembers)

    // สกัดรายชื่อจังหวัด, อำเภอ, ตำบล จากข้อมูลสมาชิกจริง
    const provinces = [...new Set(savedMembers.map(m => m.province).filter(Boolean))]
    const districts = [...new Set(savedMembers.map(m => m.district).filter(Boolean))]
    const subDistricts = [...new Set(savedMembers.map(m => m.subDistrict).filter(Boolean))]

    setProvinceOptions(provinces)
    setDistrictOptions(districts)
    setSubDistrictOptions(subDistricts)

    if (provinces.length > 0) setProvince(provinces[0])
    if (districts.length > 0) setDistrict(districts[0])
  }, [])

  // ฟังก์ชันกดปุ่ม "แสดงข้อมูล" กรองตามเงื่อนไขที่เลือก
  const handleShowData = () => {
    let result = members

    if (province) {
      result = result.filter(m => !m.province || m.province === province)
    }
    if (district) {
      result = result.filter(m => !m.district || m.district === district)
    }
    if (subDistrict && subDistrict !== 'ทั้งหมด') {
      result = result.filter(m => m.subDistrict === subDistrict)
    }
    if (villageNo && villageNo !== '1-99') {
      result = result.filter(m => String(m.village || m.moo) === String(villageNo))
    }

    setFilteredMembers(result)
    message.success(`แสดงข้อมูลสมาชิกตามเงื่อนไข พบทั้งสิ้น ${result.length} ราย`)
  }

  // คำนวณยอดรวม
  const totalAdvanceAndWelfare = Number(advanceAmount || 0)
  const totalMaintenance = Number(maintenanceAmount || 0) + Number(registerAmount || 0) + Number(donateAmount || 0) + Number(otherAmount || 0)
  const grandTotal = totalAdvanceAndWelfare + totalMaintenance

  // บันทึกใบเสร็จ (F9) และซิงค์เข้าสู่ระบบบัญชี/แดชบอร์ดอัตโนมัติ
  const handleSaveReceipt = () => {
    if (!selectedMember) {
      message.error('กรุณาเลือกสมาชิกที่ต้องการออกใบเสร็จก่อน!')
      return
    }
    if (grandTotal <= 0) {
      message.error('กรุณากรอกจำนวนเงินรับชำระให้ถูกต้อง!')
      return
    }

    const docNo = 'REC-' + dayjs().format('YYYYMMDD') + '-' + Math.floor(1000 + Math.random() * 9000)
    const newReceipt = {
      id: Date.now(),
      docNo: docNo,
      date: dayjs().format('YYYY-MM-DD'),
      memberId: selectedMember.id || selectedMember.memberId,
      memberName: `${selectedMember.prefix || ''}${selectedMember.firstName} ${selectedMember.lastName}`,
      advance: Number(advanceAmount || 0),
      welfare: 0,
      register: Number(registerAmount || 0),
      maintenance: Number(maintenanceAmount || 0),
      discount: 0,
      donate: Number(donateAmount || 0),
      other: Number(otherAmount || 0),
      total: grandTotal,
      collector: user.name || 'นายพุทธิพงศ์'
    }

    // 1. บันทึกลงประวัติใบเสร็จ
    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const updatedReceipts = [newReceipt, ...existingReceipts]
    localStorage.setItem('funeral_receipts', JSON.stringify(updatedReceipts))

    // 2. ซิงค์ยอดเงินเข้าสู่บัญชีธนาคารอัตโนมัติ
    const currentBank88 = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
    localStorage.setItem('funeral_total_bank_balance_88', (currentBank88 + totalAdvanceAndWelfare).toString())

    const currentCash87 = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
    localStorage.setItem('funeral_total_cash_balance', (currentCash87 + totalMaintenance).toString())

    message.success(`บันทึกใบเสร็จเลขที่ ${docNo} สำเร็จ! (ซิงค์ยอดเงินเข้าบัญชีเรียบร้อย)`)

    // รีเซ็ตฟอร์มรับเงิน
    setAdvanceAmount(0)
    setMaintenanceAmount(0)
    setRegisterAmount(0)
    setDonateAmount(0)
    setOtherAmount(0)
    setSelectedMember(null)
  }

  const columns = [
    { title: 'เลขที่สมาชิก', dataIndex: 'id', key: 'id', width: 100, render: (v) => <b style={{ color: primaryColor }}>{v}</b> },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 80 },
    { title: 'คำนำหน้า', dataIndex: 'prefix', key: 'prefix', width: 90 },
    { title: 'ชื่อ', dataIndex: 'firstName', key: 'firstName' },
    { title: 'นามสกุล', dataIndex: 'lastName', key: 'lastName' },
    { title: 'หมู่บ้าน (หมู่ที่)', dataIndex: 'village', key: 'village', width: 100, render: (v, r) => <Tag color="green">หมู่ {v || r.moo || '-'}</Tag> },
    { title: 'ตำบล / อำเภอ', key: 'address', render: (_, r) => `${r.subDistrict || '-'} / ${r.district || '-'}` },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 90, render: (v) => <Tag color="blue">{v || 'ปกติ'}</Tag> },
    { 
      title: 'เลือกทำรายการ', 
      key: 'action', 
      width: 120, 
      align: 'center',
      render: (_, record) => {
        const memId = record.id || record.memberId
        const isSelected = (selectedMember?.id || selectedMember?.memberId) === memId
        return (
          <Button 
            type={isSelected ? 'primary' : 'default'} 
            size="small"
            onClick={() => {
              setSelectedMember(record)
              message.info(`เลือกสมาชิก: ${record.firstName} ${record.lastName} (รหัส: ${memId})`)
            }}
          >
            {isSelected ? 'กำลังเลือก' : 'เลือก'}
          </Button>
        )
      } 
    }
  ]

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
      
      {/* แถบหัวข้อระบบ */}
      <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', borderLeft: `5px solid ${primaryColor}` }}>
        <Space>
          <FileTextOutlined style={{ color: primaryColor, fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 'bold' }}>
            ใบเสร็จรับเงินเป็นกลุ่มหมู่บ้าน (Group Receipts Sync)
          </Title>
        </Space>
        <Tag color="green" style={{ fontSize: 13, padding: '4px 10px' }}>
          เชื่อมโยงฐานข้อมูลสมาชิกและบัญชีอัตโนมัติ
        </Tag>
      </div>

      {/* กรอบตัวกรองดึงข้อมูลจากที่อยู่สมาชิกจริง */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: '#e6f4ea', border: '1px solid #bbf7d0' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text strong>จังหวัด:</Text>
            <Select value={province} onChange={setProvince} style={{ width: '100%', marginTop: 4 }} placeholder="เลือกจังหวัด">
              {provinceOptions.map((p, idx) => (
                <Option key={idx} value={p}>{p}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>อำเภอ:</Text>
            <Select value={district} onChange={setDistrict} style={{ width: '100%', marginTop: 4 }} placeholder="เลือกอำเภอ">
              {districtOptions.map((d, idx) => (
                <Option key={idx} value={d}>{d}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>ตำบล:</Text>
            <Select value={subDistrict} onChange={setSubDistrict} style={{ width: '100%', marginTop: 4 }}>
              <Option value="ทั้งหมด">-- ตำบลทั้งหมด --</Option>
              {subDistrictOptions.map((sd, idx) => (
                <Option key={idx} value={sd}>{sd}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Text strong>หมู่ (หมู่ที่):</Text>
            <Input value={villageNo} onChange={(e) => setVillageNo(e.target.value)} style={{ marginTop: 4, fontWeight: 'bold' }} placeholder="เช่น 1 หรือ 1-99" />
          </Col>
          <Col xs={24} sm={24} md={2} style={{ textAlign: 'right', paddingTop: 20 }}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleShowData}
              style={{ background: primaryColor, fontWeight: 'bold', width: '100%' }}
            >
              แสดงข้อมูล
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ตารางแสดงรายชื่อสมาชิกในกลุ่มหมู่บ้าน */}
      <Card size="small" title={<Text strong>รายชื่อสมาชิกตามเงื่อนไขกลุ่มหมู่บ้าน (คลิกเลือกเพื่อออกใบเสร็จ)</Text>} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Table 
          dataSource={filteredMembers} 
          columns={columns} 
          rowKey={(record) => record.id || record.memberId} 
          size="small" 
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'ยังไม่มีข้อมูลสมาชิกในระบบ หรือไม่พบข้อมูลตามเงื่อนไขที่เลือก' }}
          bordered
        />
      </Card>

      {/* กรอบบันทึกรับเงินด้านล่าง */}
      <Card size="small" style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ background: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <Text strong style={{ color: primaryColor, display: 'block', marginBottom: 6 }}>
                <UserOutlined /> สมาชิกที่เลือกออกใบเสร็จ:
              </Text>
              {selectedMember ? (
                <div>
                  <Text strong style={{ fontSize: 15, color: '#1e293b' }}>
                    {selectedMember.prefix}{selectedMember.firstName} {selectedMember.lastName}
                  </Text>
                  <div><Tag color="purple">รหัสสมาชิก: {selectedMember.id || selectedMember.memberId}</Tag> <Tag color="cyan">หมู่: {selectedMember.village || selectedMember.moo}</Tag></div>
                </div>
              ) : (
                <Text type="danger">ยังไม่ได้เลือกสมาชิกจากตารางด้านบน</Text>
              )}
            </div>
          </Col>

          <Col xs={24} md={16}>
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6}>
                <Text strong style={{ fontSize: 12 }}>เงินสงเคราะห์ล่วงหน้า (88):</Text>
                <InputNumber 
                  value={advanceAmount} 
                  onChange={setAdvanceAmount} 
                  style={{ width: '100%', fontWeight: 'bold' }} 
                  min={0} 
                  precision={2}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Text strong style={{ fontSize: 12 }}>ค่าบำรุง / ทะเบียน (87):</Text>
                <InputNumber 
                  value={maintenanceAmount} 
                  onChange={setMaintenanceAmount} 
                  style={{ width: '100%', fontWeight: 'bold' }} 
                  min={0} 
                  precision={2}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Text strong style={{ fontSize: 12 }}>เงินบริจาค / อื่นๆ:</Text>
                <InputNumber 
                  value={donateAmount} 
                  onChange={setDonateAmount} 
                  style={{ width: '100%', fontWeight: 'bold' }} 
                  min={0} 
                  precision={2}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Text strong style={{ fontSize: 12, color: '#b91c1c' }}>รวมสุทธิ (บาท):</Text>
                <InputNumber 
                  value={grandTotal} 
                  disabled 
                  style={{ width: '100%', fontWeight: 'bold', color: '#b91c1c', background: '#fef2f2' }} 
                  precision={2}
                />
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider style={{ margin: '14px 0' }} />

        {/* แถบปุ่มควบคุมด้านล่าง */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Tag color="cyan" style={{ fontSize: 13, padding: '4px 10px' }}>
                ผู้รับเงิน: <b>{user.name || 'นายพุทธิพงศ์'}</b>
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button onClick={() => { setSelectedMember(null); setAdvanceAmount(0); setMaintenanceAmount(0); setDonateAmount(0); setOtherAmount(0); }}>
                ยกเลิก
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveReceipt} style={{ background: '#16a34a', fontWeight: 'bold' }}>
                บันทึก [F9]
              </Button>
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => message.success('พิมพ์ใบเสร็จเรียบร้อย')} style={{ background: '#2563eb', fontWeight: 'bold' }}>
                พิมพ์
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

    </div>
  )
}