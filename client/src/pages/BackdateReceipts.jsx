import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Row, 
  Col, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Form, 
  DatePicker, 
  InputNumber, 
  Select, 
  Modal, 
  message,
  Card 
} from 'antd'
import { 
  PrinterOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  SaveOutlined, 
  CloseOutlined, 
  BookOutlined,
  StopOutlined,
  FileDoneOutlined,
  UserOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Title, Text } = Typography

export default function BackdateReceipts() {
  const outletContext = useOutletContext() || {}
  const user = outletContext.user || { role: 'manager', name: 'ผู้จัดการ สมาคมฯ', code: 'MG001' }
  const theme = outletContext.theme || { primary: '#1f3a8a' }
  const primaryColor = theme.primary || '#1f3a8a'

  // State สำหรับเก็บชื่อสมาคมจริงจากหน้าข้อมูลหน่วยงาน
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา')

  // State สำหรับใบเสร็จย้อนหลัง
  const [backdateReceiptNo, setBackdateReceiptNo] = useState('')
  const [receiptDate, setReceiptDate] = useState(dayjs())
  const [memberId, setMemberId] = useState('')
  const [memberInfo, setMemberInfo] = useState(null)

  // รายการชำระเงิน 7 รายการ
  const [amount1, setAmount1] = useState(0) // เงินสงเคราะห์รับล่วงหน้า
  const [amount2, setAmount2] = useState(0) // เงินสงเคราะห์
  const [amount3, setAmount3] = useState(0) // ค่าสมัคร
  const [amount4, setAmount4] = useState(0) // ค่าบำรุง
  const [amount5, setAmount5] = useState(0) // เงินหักเปอร์เซ็นต์
  const [amount6, setAmount6] = useState(0) // เงินบริจาค
  const [amount7, setAmount7] = useState(0) // อื่นๆ

  const [corpsCount, setCorpsCount] = useState(30)
  const [corpsRate, setCorpsRate] = useState(50)
  const [discountPercent, setDiscountPercent] = useState(0)

  // Modal สมุดสมาชิก
  const [isPassbookModalOpen, setIsPassbookModalOpen] = useState(false)

  // Modal ยกเลิก/แก้ไข
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  // โหลดชื่อสมาคมเมื่อเปิดหน้า
  useEffect(() => {
    const savedOrg = localStorage.getItem('funeral_organization_info')
    if (savedOrg) {
      try {
        const parsedOrg = JSON.parse(savedOrg)
        if (parsedOrg.name) {
          setOrgName(parsedOrg.name)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // ค้นหาสมาชิก
  const handleSearchMember = (idToSearch) => {
    const targetId = (idToSearch !== undefined ? idToSearch : memberId).trim()
    if (!targetId) {
      setMemberInfo(null)
      return
    }

    const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || [
      { id: '1258', group: '10', prefix: 'นาง', firstName: 'บัวผัน', lastName: 'สีเกาะ', subDistrict: 'เซกา', district: 'เซกา', province: 'บึงกาฬ', zipcode: '38150', houseNo: '102', moo: '15', balance: 1500.00, lastPayDate: '21 ตุลาคม 2569', hasPaidMaintenance: true },
      { id: '3', group: '93', prefix: 'นาย', firstName: 'เขียว', lastName: 'สีดาสอน', subDistrict: 'ป่งไฮ', district: 'เซกา', province: 'บึงกาฬ', zipcode: '38150', houseNo: '1', moo: '07', balance: -650.00, lastPayDate: '13 พฤศจิกายน 2568', hasPaidMaintenance: false },
    ]
    const found = savedMembers.find(m => m.id.toString() === targetId.toString())

    if (found) {
      const fullName = `${found.prefix || ''}${found.firstName || ''} ${found.lastName || ''}`.trim()
      const fullAddress = `${found.houseNo || ''} หมู่ ${found.moo || ''} ต.${found.subDistrict || ''} อ.${found.district || ''} จ.${found.province || ''} ${found.zipcode || ''}`.trim()
      
      setMemberInfo({
        id: found.id,
        name: fullName,
        group: found.group || '-',
        address: fullAddress || '-',
        balance: found.balance !== undefined ? found.balance : 0,
        lastPayDate: found.lastPayDate || '-',
        hasPaidMaintenance: found.hasPaidMaintenance || false
      })
      setAmount4(found.hasPaidMaintenance ? 0 : 50)
      message.success(`ดึงข้อมูลสมาชิกเลขที่ ${targetId} สำเร็จ`)
    } else {
      setMemberInfo(null)
      message.warning(`ไม่พบข้อมูลสมาชิกเลขที่ ${targetId}`)
    }
  }

  // ค้นหาใบเสร็จย้อนหลังเดิมที่เคยบันทึกไว้ (เพื่อแก้ไข)
  const handleSearchExistingReceipt = () => {
    if (!backdateReceiptNo.trim()) return
    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const found = existingReceipts.find(r => r.docNo === backdateReceiptNo.trim())

    if (found) {
      setAmount1(found.advance || 0)
      setAmount2(found.welfare || 0)
      setAmount3(found.register || 0)
      setAmount4(found.maintenance || 0)
      setAmount5(found.discount || 0)
      setAmount6(found.donate || 0)
      setAmount7(found.other || 0)
      if (found.date) setReceiptDate(dayjs(found.date))
      if (found.memberId) {
        setMemberId(found.memberId)
        handleSearchMember(found.memberId)
      }
      message.success(`โหลดข้อมูลใบเสร็จย้อนหลังเลขที่ ${found.docNo} มาเพื่อตรวจสอบ/แก้ไขเรียบร้อย`)
    } else {
      message.warning(`ไม่พบเลขที่ใบเสร็จ ${backdateReceiptNo} ในระบบ`)
    }
  }

  const totalAmount = amount1 + amount2 + amount3 + amount4 + amount5 + amount6 + amount7
  const welfareContribution = amount1 + amount2
  const remainingBalance = memberInfo ? memberInfo.balance : 0

  const handleNewReceipt = () => {
    setBackdateReceiptNo('')
    setReceiptDate(dayjs())
    setMemberId('')
    setMemberInfo(null)
    setAmount1(0)
    setAmount2(0)
    setAmount3(0)
    setAmount4(0)
    setAmount5(0)
    setAmount6(0)
    setAmount7(0)
    setDiscountPercent(0)
    message.info('เคลียร์ฟอร์มสำหรับออกใบเสร็จย้อนหลังใหม่แล้ว')
  }

  // ฟังก์ชันบันทึกข้อมูลและซิงค์ลงรายงาน + อัปเดตยอดสมาชิก
  const processSaveBackdate = () => {
    if (!backdateReceiptNo.trim()) {
      message.error('กรุณาระบุเลขที่ใบเสร็จเขียนมือย้อนหลัง')
      return
    }
    if (!memberInfo) {
      message.error('กรุณาระบุรหัสสมาชิก')
      return
    }

    // 1. บันทึก/อัปเดตฐานข้อมูลสมาชิก
    const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || []
    const updatedMembers = savedMembers.map(m => {
      if (m.id.toString() === memberInfo.id.toString()) {
        const currentBalance = Number(m.balance) || 0
        return {
          ...m,
          balance: currentBalance + welfareContribution,
          lastPayDate: receiptDate.format('DD MMMM YYYY'),
          hasPaidMaintenance: amount4 > 0 ? true : m.hasPaidMaintenance
        }
      }
      return m
    })
    localStorage.setItem('funeral_members', JSON.stringify(updatedMembers))

    // 2. บันทึกลง funeral_receipts สำหรับรายงานรายวัน / ช่วงวันที่
    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const newItem = {
      key: Date.now().toString(),
      docNo: backdateReceiptNo.trim(),
      memberId: memberInfo.id,
      memberName: memberInfo.name,
      advance: amount1,
      welfare: amount2,
      register: amount3,
      maintenance: amount4,
      discount: amount5,
      donate: amount6,
      other: amount7,
      staff: user?.code || 'A',
      date: receiptDate.format('YYYY-MM-DD'),
      total: totalAmount
    }

    const filtered = existingReceipts.filter(r => r.docNo !== backdateReceiptNo.trim())
    localStorage.setItem('funeral_receipts', JSON.stringify([...filtered, newItem]))

    message.success(`บันทึกใบเสร็จย้อนหลังเลขที่ ${backdateReceiptNo} สำเร็จ (วันที่: ${receiptDate.format('DD/MM/YYYY')})`)
  }

  const tableData = [
    {
      key: '1',
      no: 1,
      name: (
        <Space wrap>
          <Text strong style={{ color: primaryColor, fontSize: 14 }}>เงินสงเคราะห์รับล่วงหน้า</Text>
          <Text type="secondary">จำนวนศพ</Text>
          <InputNumber value={corpsCount} onChange={(v) => { setCorpsCount(v); setAmount1((v || 0) * corpsRate); }} style={{ width: 65 }} size="small" min={0} />
          <Text type="secondary">ศพละ</Text>
          <InputNumber value={corpsRate} onChange={(v) => { setCorpsRate(v); setAmount1(corpsCount * (v || 0)); }} style={{ width: 65 }} size="small" min={0} />
        </Space>
      ),
      amountInput: <InputNumber value={amount1} onChange={setAmount1} style={{ width: '100%', fontWeight: '600' }} min={0} />
    },
    { key: '2', no: 2, name: <Text strong style={{ color: '#1e293b' }}>เงินสงเคราะห์</Text>, amountInput: <InputNumber value={amount2} onChange={setAmount2} style={{ width: '100%', fontWeight: '600' }} min={0} /> },
    { key: '3', no: 3, name: <Text strong style={{ color: '#1e293b' }}>ค่าสมัคร</Text>, amountInput: <InputNumber value={amount3} onChange={setAmount3} style={{ width: '100%', fontWeight: '600' }} min={0} /> },
    { 
      key: '4', 
      no: 4, 
      name: (
        <Space>
          <Text strong style={{ color: '#1e293b' }}>ค่าบำรุง</Text>
          {memberInfo?.hasPaidMaintenance && <Tag color="volcano">[จ่ายแล้ว]</Tag>}
        </Space>
      ), 
      amountInput: <InputNumber value={amount4} onChange={setAmount4} style={{ width: '100%', fontWeight: '600' }} min={0} /> 
    },
    {
      key: '5',
      no: 5,
      name: (
        <Space>
          <Text strong style={{ color: '#1e293b' }}>เงินหักเปอร์เซ็นต์จากเงินสงเคราะห์ศพ</Text>
          <InputNumber 
            value={discountPercent} 
            onChange={(v) => { 
              setDiscountPercent(v); 
              setAmount5((amount2 * (v || 0)) / 100);
            }} 
            style={{ width: 65 }} 
            size="small" 
            min={0} 
            max={100} 
          />
          <Text>%</Text>
        </Space>
      ),
      amountInput: <InputNumber value={amount5} onChange={setAmount5} style={{ width: '100%', fontWeight: '600' }} min={0} />
    },
    { key: '6', no: 6, name: <Text strong style={{ color: '#1e293b' }}>เงินบริจาค</Text>, amountInput: <InputNumber value={amount6} onChange={setAmount6} style={{ width: '100%', fontWeight: '600' }} min={0} /> },
    {
      key: '7',
      no: 7,
      name: (
        <Space>
          <Text strong style={{ color: '#1e293b' }}>อื่นๆ:</Text>
          <Select defaultValue="ค่าธรรมเนียม" style={{ width: 140 }} size="small" options={[{ value: 'ค่าธรรมเนียม', label: 'ค่าธรรมเนียม' }, { value: 'ค่าปรับ', label: 'ค่าปรับ' }]} />
        </Space>
      ),
      amountInput: <InputNumber value={amount7} onChange={setAmount7} style={{ width: '100%', fontWeight: '600' }} min={0} />
    },
  ]

  const columns = [
    { title: <span style={{ color: primaryColor, fontWeight: 'bold' }}>ลำดับ</span>, dataIndex: 'no', key: 'no', width: 65, align: 'center' },
    { title: <span style={{ color: primaryColor, fontWeight: 'bold' }}>รายการชำระเงิน</span>, dataIndex: 'name', key: 'name' },
    { title: <span style={{ color: primaryColor, fontWeight: 'bold' }}>จำนวนเงิน (บาท)</span>, dataIndex: 'amountInput', key: 'amountInput', width: 190, align: 'right' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
      
      {/* Header */}
      <div style={{ background: '#ffffff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', borderLeft: `4px solid #d97706` }}>
        <Space>
          <HistoryOutlined style={{ color: '#d97706', fontSize: 18 }} />
          <Text strong style={{ fontSize: 14, color: '#1e293b' }}>โหมดบันทึกใบเสร็จรับเงินย้อนหลัง (กรณีเจ้าหน้าที่ลา / ออกใบเสร็จมือ)</Text>
        </Space>
        <Tag color="orange" style={{ fontSize: 13, fontWeight: 'bold' }}>ผู้ทำรายการ: {user?.name} ({user?.code})</Tag>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: `2px solid ${primaryColor}`, paddingBottom: 8 }}>
        <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 'bold' }}>ใบเสร็จรับเงินย้อนหลัง</Title>
        <Text strong style={{ fontSize: 15, color: '#334155' }}>{orgName}</Text>
      </div>

      {/* ส่วนกรอกเลขที่ใบเสร็จและวันที่ย้อนหลัง */}
      <Row gutter={16} style={{ marginBottom: 14 }}>
        <Col xs={24} md={10}>
          <Card size="small" title={<Space><FileDoneOutlined style={{ color: primaryColor }} /><span style={{ color: primaryColor, fontWeight: 'bold' }}>ข้อมูลใบเสร็จเขียนมือ</span></Space>} style={{ borderRadius: 8, height: '100%', border: '1px solid #cbd5e1' }}>
            <Form layout="vertical">
              <Form.Item label={<Text strong style={{ color: '#334155' }}>เลขที่ใบเสร็จ (พิมพ์ค้นหาหรือระบุเลขเดิม)</Text>} style={{ marginBottom: 10 }}>
                <Input 
                  placeholder="เลขที่ใหม่"
                  value={backdateReceiptNo} 
                  onChange={(e) => setBackdateReceiptNo(e.target.value)} 
                  onPressEnter={handleSearchExistingReceipt}
                  suffix={<Button type="text" icon={<SearchOutlined style={{ color: primaryColor }} />} onClick={handleSearchExistingReceipt} size="small" />} 
                  style={{ background: '#fff', fontWeight: 'bold', color: primaryColor, fontSize: 15 }} 
                />
              </Form.Item>
              <Form.Item label={<Text strong style={{ color: '#334155' }}>วันที่ในใบเสร็จ (ย้อนหลัง)</Text>} style={{ marginBottom: 0 }}>
                <DatePicker value={receiptDate} onChange={setReceiptDate} format="DD MMMM YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card size="small" title={<Space><UserOutlined style={{ color: primaryColor }} /><span style={{ color: primaryColor, fontWeight: 'bold' }}>ข้อมูลสมาชิก</span></Space>} style={{ borderRadius: 8, height: '100%', border: '1px solid #cbd5e1' }}>
            <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
              <Col span={10}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>รหัสสมาชิก</Text>
                <Input 
                  placeholder="กรุณาระบุรหัสสมาชิก"
                  value={memberId} 
                  onChange={(e) => setMemberId(e.target.value)}
                  onPressEnter={() => handleSearchMember()}
                  suffix={<Button type="text" icon={<SearchOutlined style={{ color: primaryColor }} />} onClick={() => handleSearchMember()} size="small" />} 
                />
              </Col>
              <Col span={14}>
                <div style={{ background: '#e0f2fe', padding: '6px 12px', borderRadius: 6, border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 12, color: '#0369a1' }}>กลุ่ม:</Text>
                  <Tag color="cyan" style={{ fontSize: 14, fontWeight: 'bold', margin: 0 }}>กลุ่ม {memberInfo?.group || '-'}</Tag>
                </div>
              </Col>
            </Row>

            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <Row gutter={8} style={{ marginBottom: 4 }}>
                <Col span={5}><Text type="secondary">ชื่อ-นามสกุล:</Text></Col>
                <Col span={12}><Text strong style={{ color: '#0f172a', fontSize: 15 }}>{memberInfo?.name || '-'}</Text></Col>
                <Col span={3}><Text type="secondary">เลขสมาชิก:</Text></Col>
                <Col span={4}><Text strong style={{ color: primaryColor }}>{memberInfo?.id || '-'}</Text></Col>
              </Row>
              <Row gutter={8}>
                <Col span={5}><Text type="secondary">ที่อยู่:</Text></Col>
                <Col span={19}><Text style={{ color: '#334155' }}>{memberInfo?.address || '-'}</Text></Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ตารางรายการชำระเงิน */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 14, border: '1px solid #cbd5e1' }}>
        <Table dataSource={tableData} columns={columns} pagination={false} size="middle" bordered />
      </Card>

      {/* สรุปยอด */}
      <Card size="small" style={{ borderRadius: 8, marginBottom: 14, background: '#eff6ff', border: '1px solid #93c5fd' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Space>
              <Text strong style={{ color: '#334155' }}>ชำระครั้งก่อน:</Text>
              <Tag color="purple">{memberInfo?.lastPayDate || '-'}</Tag>
            </Space>
          </Col>
          <Col xs={12} md={8}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 12, color: '#334155' }}>เงินสงเคราะห์คงเหลือ</Text>
              <Input value={remainingBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} readOnly style={{ color: remainingBalance < 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold', textAlign: 'right', background: '#fff' }} />
            </Space>
          </Col>
          <Col xs={12} md={8}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 12, color: primaryColor }}>ยอดรวมสุทธิ (บาท)</Text>
              <Input value={totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} readOnly style={{ background: primaryColor, color: '#fff', fontWeight: 'bold', textAlign: 'right', fontSize: 18 }} />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* แถบปุ่มคำสั่งด้านล่าง */}
      <Row justify="space-between" align="middle" style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8 }}>
        <Space wrap>
          <Button danger icon={<StopOutlined />} onClick={() => setIsCancelModalOpen(true)}>ยกเลิกใบเสร็จย้อนหลัง</Button>
          <Button icon={<PlusOutlined />} onClick={handleNewReceipt}>ใบใหม่ [F3]</Button>
          <Button type="primary" ghost icon={<PrinterOutlined />} onClick={() => { processSaveBackdate(); window.print(); }} style={{ borderColor: primaryColor, color: primaryColor, fontWeight: '600' }}>บันทึกและพิมพ์</Button>
          <Button icon={<BookOutlined />} onClick={() => memberInfo ? setIsPassbookModalOpen(true) : message.warning('กรุณาระบุรหัสสมาชิก')}>สมุด [F8]</Button>
        </Space>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={processSaveBackdate} size="large" style={{ background: primaryColor, paddingInline: 24, fontWeight: 'bold' }}>บันทึกย้อนหลัง [F9]</Button>
          <Button danger icon={<CloseOutlined />} size="large">ปิด</Button>
        </Space>
      </Row>

      {/* Modal สมุดสมาชิก */}
      <Modal title="พิมพ์สมุดสมาชิก (Passbook PR9)" open={isPassbookModalOpen} onCancel={() => setIsPassbookModalOpen(false)} width={900} footer={[<Button key="c" onClick={() => setIsPassbookModalOpen(false)}>ปิด</Button>]}>
        <Text>พร้อมพิมพ์รายการย้อนหลังลงสมุด PR9 ของสมาชิก {memberInfo?.name}</Text>
      </Modal>

    </div>
  )
}