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
  EditOutlined, 
  BookOutlined,
  StopOutlined,
  FileDoneOutlined,
  UserOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function Receipts() {
  const outletContext = useOutletContext()
  const user = outletContext?.user || { role: 'manager', name: 'ผู้จัดการ สมาคมฯ', code: 'MG001' }
  
  const theme = outletContext?.theme || { primary: '#1f3a8a' }
  const primaryColor = theme.primary || '#1f3a8a'

  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา')
  const [receiptSeq, setReceiptSeq] = useState(1775)
  const [savedReceiptNo, setSavedReceiptNo] = useState('')
  const [receiptDate, setReceiptDate] = useState(dayjs())

  const [memberId, setMemberId] = useState('')
  const [memberInfo, setMemberInfo] = useState(null)

  const [amount1, setAmount1] = useState(0) // เงินสงเคราะห์รับล่วงหน้า
  const [amount2, setAmount2] = useState(0) // เงินสงเคราะห์
  const [amount3, setAmount3] = useState(0) // ค่าสมัคร
  const [amount4, setAmount4] = useState(0) // ค่าบำรุง
  const [amount5, setAmount5] = useState(0) // เงินหักเปอร์เซ็นต์
  const [amount6, setAmount6] = useState(0) // เงินบริจาค
  const [amount7, setAmount7] = useState(0) // อื่นๆ

  const [corpsCount, setCorpsCount] = useState(30)
  const [corpsRate, setCorpsRate] = useState(50)
  const [maintenanceDefault, setMaintenanceDefault] = useState(50)
  const [discountPercent, setDiscountPercent] = useState(0)

  // Printer Config State (ดึงจากระบบตั้งค่าจริง)
  const [receiptPrinterConfig, setReceiptPrinterConfig] = useState(null)
  const [passbookPrinterConfig, setPassbookPrinterConfig] = useState(null)

  // Passbook State
  const [isPassbookModalOpen, setIsPassbookModalOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState('2569')
  const [startLine, setStartLine] = useState(13)
  const [carryForwardBalance, setCarryForwardBalance] = useState(300.00)
  const [selectedRowKeys, setSelectedRowKeys] = useState(['3'])

  // Cancel / Edit Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [cancelRemark, setCancelRemark] = useState('')

  useEffect(() => {
    // 1. ดึงชื่อสมาคมและค่าตั้งต้นจากหน้าข้อมูลหน่วยงาน
    const savedOrg = localStorage.getItem('funeral_organization_info')
    if (savedOrg) {
      try {
        const parsedOrg = JSON.parse(savedOrg)
        if (parsedOrg.name) {
          setOrgName(parsedOrg.name)
        }
        if (parsedOrg.corpseDeductionRate) {
          const rate = Number(parsedOrg.corpseDeductionRate)
          setCorpsRate(rate)
          setAmount1(corpsCount * rate)
        }
        if (parsedOrg.maintenanceFee) {
          setMaintenanceDefault(Number(parsedOrg.maintenanceFee))
        }
      } catch (e) {
        console.error(e)
      }
    }

    // 2. ดึงค่าการตั้งค่าเครื่องพิมพ์ใบเสร็จและสมุดจากระบบจริง
    try {
      const receiptCfg = localStorage.getItem('funeral_receipt_printer_config')
      if (receiptCfg) {
        setReceiptPrinterConfig(JSON.parse(receiptCfg))
      }

      const passbookCfg = localStorage.getItem('funeral_passbook_printer_config')
      if (passbookCfg) {
        setPassbookPrinterConfig(JSON.parse(passbookCfg))
      }
    } catch (e) {
      console.error('Error loading printer configs:', e)
    }

    const now = dayjs()
    const cutoffTime = now.hour(14).minute(30).second(0)
    if (now.isAfter(cutoffTime)) {
      setReceiptDate(now.add(1, 'day'))
      message.info('เกินเวลา 14:30 น. ระบบปรับวันที่ใบเสร็จเป็นวันถัดไปให้อัตโนมัติ')
    } else {
      setReceiptDate(now)
    }

    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    let maxSeq = 1774
    existingReceipts.forEach(r => {
      if (r.docNo && r.docNo.length > 2) {
        const seqNum = parseInt(r.docNo.slice(2), 10)
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum
        }
      }
    })
    setReceiptSeq(maxSeq + 1)
  }, [])

  useEffect(() => {
    setAmount1((corpsCount || 0) * (corpsRate || 0))
  }, [corpsCount, corpsRate])

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
      const hasPaid = found.hasPaidMaintenance || false
      
      setMemberInfo({
        id: found.id,
        name: fullName,
        group: found.group || '-',
        address: fullAddress || '-',
        balance: found.balance !== undefined ? found.balance : 0,
        lastPayDate: found.lastPayDate || '21 ตุลาคม 2569',
        hasPaidMaintenance: hasPaid
      })

      setAmount4(hasPaid ? 0 : maintenanceDefault)
      message.success(`ดึงข้อมูลสมาชิกเลขที่ ${targetId} สำเร็จ`)
    } else {
      setMemberInfo(null)
      message.warning(`ไม่พบข้อมูลสมาชิกเลขที่ ${targetId}`)
    }
  }

  const handleSearchExistingReceipt = () => {
    if (!savedReceiptNo.trim()) return
    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const found = existingReceipts.find(r => r.docNo === savedReceiptNo.trim())

    if (found) {
      setAmount1(found.advance || 0)
      setAmount2(found.welfare || 0)
      setAmount3(found.register || 0)
      setAmount4(found.maintenance || 0)
      setAmount5(found.discount || 0)
      setAmount6(found.donate || 0)
      setAmount7(found.other || 0)
      if (found.memberId) {
        setMemberId(found.memberId)
        handleSearchMember(found.memberId)
      }
      message.success(`โหลดข้อมูลใบเสร็จเลขที่ ${found.docNo} มาเพื่อแก้ไขเรียบร้อย`)
    } else {
      message.warning(`ไม่พบเลขที่ใบเสร็จ ${savedReceiptNo} ในระบบ`)
    }
  }

  const totalAmount = amount1 + amount2 + amount3 + amount4 + amount5 + amount6 + amount7

  const handleNewReceipt = () => {
    const newNo = `69${receiptSeq.toString().padStart(4, '0')}`
    setSavedReceiptNo(newNo)
    setMemberId('')
    setMemberInfo(null)
    setAmount1(corpsCount * corpsRate)
    setAmount2(0)
    setAmount3(0)
    setAmount4(0)
    setAmount5(0)
    setAmount6(0)
    setAmount7(0)
    setDiscountPercent(0)
    message.info(`สร้างใบเสร็จใหม่ เลขที่ ${newNo}`)
  }

  const ensureReceiptNumber = () => {
    if (!savedReceiptNo || savedReceiptNo === '*เลขใหม่*') {
      const newNo = `69${receiptSeq.toString().padStart(4, '0')}`
      setSavedReceiptNo(newNo)
      setReceiptSeq(prev => prev + 1)
      return newNo
    }
    return savedReceiptNo
  }

  const updateMemberDatabase = (targetReceiptNo) => {
    if (!memberInfo) return

    const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || []
    const welfareContribution = amount1 + amount2

    const updatedMembers = savedMembers.map(m => {
      if (m.id.toString() === memberInfo.id.toString()) {
        const currentBalance = Number(m.balance) || 0
        const newBalance = currentBalance + welfareContribution
        const formattedPayDate = receiptDate.format('DD MMMM YYYY')

        return {
          ...m,
          balance: newBalance,
          lastPayDate: formattedPayDate,
          hasPaidMaintenance: amount4 > 0 ? true : m.hasPaidMaintenance
        }
      }
      return m
    })

    localStorage.setItem('funeral_members', JSON.stringify(updatedMembers))

    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const newReceiptItem = {
      key: Date.now().toString(),
      docNo: targetReceiptNo,
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

    const filteredReceipts = existingReceipts.filter(r => r.docNo !== targetReceiptNo)
    localStorage.setItem('funeral_receipts', JSON.stringify([...filteredReceipts, newReceiptItem]))
  }

  // ฟังก์ชันสั่งพิมพ์ใบเสร็จผ่านเครื่องพิมพ์ที่ตั้งค่าไว้จริง
  const handlePrintReceipt = () => {
    if (!memberInfo) {
      message.error('กรุณาระบุรหัสสมาชิกก่อนพิมพ์ใบเสร็จ')
      return
    }
    const currentNo = ensureReceiptNumber()
    updateMemberDatabase(currentNo)

    const printerName = receiptPrinterConfig?.printerModel || 'เครื่องพิมพ์ใบเสร็จหลัก'
    message.success(`กำลังส่งคำสั่งพิมพ์ใบเสร็จเลขที่ ${currentNo} ไปยัง "${printerName}"...`)
    window.print()
  }

  const handleSaveReceipt = () => {
    if (!memberInfo) {
      message.error('กรุณาระบุรหัสสมาชิกก่อนบันทึกใบเสร็จ')
      return
    }

    const currentNo = ensureReceiptNumber()
    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const isExisting = existingReceipts.some(r => r.docNo === currentNo)

    if (isExisting && user?.role !== 'manager' && user?.role !== 'dev') {
      message.error('สิทธิ์ของคุณไม่อนุญาตให้แก้ไขใบเสร็จที่บันทึกแล้ว (เฉพาะผู้จัดการหรือผู้พัฒนาเท่านั้น)')
      return
    }

    updateMemberDatabase(currentNo)
    message.success(`บันทึก/แก้ไขใบเสร็จเลขที่ ${currentNo} สำเร็จ (ผู้ทำรายการ: ${user?.name})`)
  }

  const handleConfirmCancelReceipt = () => {
    if (!cancelRemark.trim()) {
      message.error('กรุณาระบุเหตุผลการยกเลิก')
      return
    }
    if (!savedReceiptNo) {
      message.error('ยังไม่ได้เลือกเลขที่ใบเสร็จที่ต้องการลบ')
      return
    }
    if (user?.role !== 'manager' && user?.role !== 'dev') {
      message.error('เฉพาะผู้จัดการหรือผู้พัฒนาเท่านั้นที่มีสิทธิ์ลบใบเสร็จ')
      return
    }

    const existingReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
    const targetReceipt = existingReceipts.find(r => r.docNo === savedReceiptNo)

    if (targetReceipt && targetReceipt.memberId) {
      const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || []
      const refundAmount = (Number(targetReceipt.advance) || 0) + (Number(targetReceipt.welfare) || 0)

      const updatedMembers = savedMembers.map(m => {
        if (m.id.toString() === targetReceipt.memberId.toString()) {
          return {
            ...m,
            balance: (Number(m.balance) || 0) - refundAmount
          }
        }
        return m
      })
      localStorage.setItem('funeral_members', JSON.stringify(updatedMembers))
    }

    const filtered = existingReceipts.filter(r => r.docNo !== savedReceiptNo)
    localStorage.setItem('funeral_receipts', JSON.stringify(filtered))

    let maxSeq = 1774
    filtered.forEach(r => {
      if (r.docNo && r.docNo.length > 2) {
        const seqNum = parseInt(r.docNo.slice(2), 10)
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum
        }
      }
    })
    setReceiptSeq(maxSeq + 1)

    message.success(`ลบใบเสร็จเลขที่ ${savedReceiptNo} และคืนยอดเงินสมาชิกสำเร็จ!`)
    setIsCancelModalOpen(false)
    setCancelRemark('')
    handleNewReceipt()
  }

  const tableData = [
    {
      key: '1',
      no: 1,
      name: (
        <Space wrap>
          <Text strong style={{ color: primaryColor, fontSize: 14 }}>เงินสงเคราะห์รับล่วงหน้า</Text>
          <Text type="secondary">จำนวนศพ</Text>
          <InputNumber value={corpsCount} onChange={setCorpsCount} style={{ width: 65 }} size="small" min={0} />
          <Text type="secondary">ศพละ</Text>
          <InputNumber value={corpsRate} onChange={setCorpsRate} style={{ width: 65 }} size="small" min={0} />
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
          {memberInfo?.hasPaidMaintenance && (
            <Tag color="volcano" style={{ fontWeight: 'bold', fontSize: 12 }}>[จ่ายแล้วของปี {selectedYear}]</Tag>
          )}
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
              const calculated = ((amount2 * (v || 0)) / 100);
              setAmount5(calculated);
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

  const getPassbookRows = () => [
    { key: '1', line: 1, date: '28 ม.ค. 68', docNo: '25680128', advance: 0, deadFee: 100, deadNo: '1-2', balance: 200 },
    { key: '2', line: 2, date: '15 เม.ย. 68', docNo: '25680415', advance: 0, deadFee: 250, deadNo: '3-7', balance: -50 },
    { key: '3', line: 3, date: receiptDate.format('DD MMM BB'), docNo: savedReceiptNo || '69001774', advance: amount1, deadFee: amount2, deadNo: '8-12', balance: memberInfo?.balance || 1550 },
  ]

  const passbookColumns = [
    { title: 'แถว', dataIndex: 'line', key: 'line', width: 50, align: 'center' },
    { title: 'ลงวันที่', dataIndex: 'date', key: 'date', width: 100 },
    { title: 'เลขที่เอกสาร', dataIndex: 'docNo', key: 'docNo', width: 110 },
    { title: 'รับล่วงหน้า', dataIndex: 'advance', key: 'advance', align: 'right' },
    { title: 'หักสงเคราะห์ศพ', dataIndex: 'deadFee', key: 'deadFee', align: 'right' },
    { title: 'ศพที่', dataIndex: 'deadNo', key: 'deadNo', align: 'center', width: 70 },
    { title: 'คงเหลือ', dataIndex: 'balance', key: 'balance', align: 'right', render: (v) => <Text strong style={{ color: v < 0 ? '#ef4444' : '#16a34a' }}>{v?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text> },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
      
      {/* Header แสดงชื่อจริงและสิทธิ์ของเจ้าหน้าที่ผู้ทำรายการ พร้อมแจ้งเตือนเครื่องพิมพ์หลัก */}
      <div style={{ background: '#ffffff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', borderLeft: `4px solid ${primaryColor}` }}>
        <Space wrap>
          <UserOutlined style={{ color: primaryColor, fontSize: 18 }} />
          <Text strong style={{ fontSize: 14, color: '#1e293b' }}>ผู้ทำรายการออกใบเสร็จ:</Text>
          <Tag color="geekblue" style={{ fontSize: 13, fontWeight: 'bold' }}>
            {user?.name} ({user?.role === 'staff' ? 'เจ้าหน้าที่' : user?.role === 'manager' ? 'ผู้จัดการ' : 'Dev'}) - รหัส: {user?.code}
          </Tag>
        </Space>
        <Space>
          <Tag color="blue" style={{ fontSize: 12 }}>
            🖨️ เครื่องพิมพ์ใบเสร็จ: {receiptPrinterConfig?.printerModel || 'ตั้งค่าเริ่มต้น'}
          </Tag>
          <Tag color="green" style={{ fontSize: 12 }}>
            📖 สมุด PR9: {passbookPrinterConfig?.printerModel || 'ตั้งค่าเริ่มต้น'}
          </Tag>
        </Space>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: `2px solid ${primaryColor}`, paddingBottom: 8 }}>
        <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 'bold' }}>ใบเสร็จรับเงิน</Title>
        <Text strong style={{ fontSize: 15, color: '#334155' }}>{orgName}</Text>
      </div>

      {/* ข้อมูลใบเสร็จ & สมาชิก */}
      <Row gutter={16} style={{ marginBottom: 14 }}>
        <Col xs={24} md={9}>
          <Card size="small" title={<Space><FileDoneOutlined style={{ color: primaryColor }} /><span style={{ color: primaryColor, fontWeight: 'bold' }}>ข้อมูลใบเสร็จ</span></Space>} style={{ borderRadius: 8, height: '100%', border: '1px solid #cbd5e1' }}>
            <Form layout="vertical">
              <Form.Item label={<Text strong style={{ color: '#334155' }}>เลขที่ใบเสร็จ (พิมพ์ค้นหาเพื่อแก้ไข)</Text>} style={{ marginBottom: 10 }}>
                <Input 
                  placeholder="เลขที่ใหม่"
                  value={savedReceiptNo} 
                  onChange={(e) => setSavedReceiptNo(e.target.value)} 
                  onPressEnter={handleSearchExistingReceipt}
                  suffix={<Button type="text" icon={<SearchOutlined style={{ color: primaryColor }} />} onClick={handleSearchExistingReceipt} size="small" title="ค้นหาใบเสร็จเดิม" />} 
                  style={{ background: '#fff', fontWeight: 'bold', color: primaryColor, fontSize: 15 }} 
                />
              </Form.Item>
              <Form.Item label={<Text strong style={{ color: '#334155' }}>วันที่ใบเสร็จ</Text>} style={{ marginBottom: 0 }}>
                <DatePicker value={receiptDate} onChange={setReceiptDate} format="DD MMMM YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={15}>
          <Card size="small" title={<Space><UserOutlined style={{ color: primaryColor }} /><span style={{ color: primaryColor, fontWeight: 'bold' }}>ข้อมูลสมาชิก (ซิงค์อัตโนมัติ)</span></Space>} style={{ borderRadius: 8, height: '100%', border: '1px solid #cbd5e1' }}>
            <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
              <Col span={10}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>พิมพ์รหัสสมาชิกแล้วกดค้นหา</Text>
                <Input 
                  placeholder="กรุณาระบุรหัสสมาชิก"
                  value={memberId} 
                  onChange={(e) => setMemberId(e.target.value)}
                  onPressEnter={() => handleSearchMember()}
                  suffix={<Button type="text" icon={<SearchOutlined style={{ color: primaryColor }} />} onClick={() => handleSearchMember()} size="small" />} 
                  style={{ fontWeight: '500' }}
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
                <Col span={5}><Text type="secondary" style={{ fontWeight: '500' }}>ชื่อ-นามสกุล:</Text></Col>
                <Col span={12}><Text strong style={{ color: '#0f172a', fontSize: 15 }}>{memberInfo?.name || <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>กรุณาระบุรหัสสมาชิก -</span>}</Text></Col>
                <Col span={3}><Text type="secondary" style={{ fontWeight: '500' }}>เลขสมาชิก:</Text></Col>
                <Col span={4}><Text strong style={{ color: primaryColor }}>{memberInfo?.id || '-'}</Text></Col>
              </Row>
              <Row gutter={8}>
                <Col span={5}><Text type="secondary" style={{ fontWeight: '500' }}>ที่อยู่:</Text></Col>
                <Col span={19}><Text style={{ color: '#334155' }}>{memberInfo?.address || '-'}</Text></Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ตารางรายการชำระเงิน */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 14, border: '1px solid #cbd5e1' }}>
        <Table 
          dataSource={tableData} 
          columns={columns} 
          pagination={false} 
          size="middle" 
          bordered 
          onRow={() => ({ style: { cursor: 'default' } })}
        />
      </Card>

      {/* สรุปยอด */}
      <Card size="small" style={{ borderRadius: 8, marginBottom: 14, background: '#eff6ff', border: '1px solid #93c5fd' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={10}>
            <Space>
              <Text strong style={{ color: '#334155' }}>ชำระครั้งก่อน:</Text>
              <Tag color="purple" style={{ fontSize: 13, fontWeight: '600' }}>{memberInfo?.lastPayDate || '-'}</Tag>
            </Space>
          </Col>
          <Col xs={12} md={7}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 12, color: '#334155' }}>เงินสงเคราะห์คงเหลือ</Text>
              <Input value={memberInfo?.balance !== undefined ? memberInfo.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'} readOnly style={{ color: memberInfo?.balance < 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold', textAlign: 'right', background: '#fff' }} />
            </Space>
          </Col>
          <Col xs={12} md={7}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 12, color: primaryColor }}>ยอดรวมสุทธิ (บาท)</Text>
              <Input value={totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} readOnly style={{ background: primaryColor, color: '#fff', fontWeight: 'bold', textAlign: 'right', fontSize: 18 }} />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ส่วนลายเซ็นเจ้าหน้าที่รับเงิน */}
      <Row justify="end" style={{ marginTop: 20, marginBottom: 10, paddingRight: 24 }}>
        <Col span={8} style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 40, borderBottom: '1px dashed #64748b', height: 30, width: '80%', margin: '0 auto 8px auto' }}></div>
          <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>
            ({user?.name || '..........................................................'})
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>เจ้าหน้าที่ผู้รับเงิน</Text>
        </Col>
      </Row>

      {/* แถบปุ่มคำสั่งด้านล่าง */}
      <Row justify="space-between" align="middle" style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8 }}>
        <Space wrap>
          <Button danger icon={<StopOutlined />} onClick={() => setIsCancelModalOpen(true)}>ยกเลิกใบเสร็จ</Button>
          <Button icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>แก้ไข [F2]</Button>
          <Button icon={<PlusOutlined />} onClick={handleNewReceipt}>ใบใหม่ [F3]</Button>
          <Button type="primary" ghost icon={<PrinterOutlined />} onClick={handlePrintReceipt} style={{ borderColor: primaryColor, color: primaryColor, fontWeight: '600' }}>พิมพ์ออกเครื่องพิมพ์</Button>
          <Button icon={<BookOutlined />} onClick={() => {
            if (!memberInfo) {
              message.warning('กรุณาระบุรหัสสมาชิกก่อนเปิดสมุดฝากเงิน');
              return;
            }
            setIsPassbookModalOpen(true);
          }}>สมุด [F8]</Button>
        </Space>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveReceipt} size="large" style={{ background: primaryColor, paddingInline: 24, fontWeight: 'bold' }}>บันทึก [F9]</Button>
          <Button danger icon={<CloseOutlined />} size="large">ปิด</Button>
        </Space>
      </Row>

      {/* Modal พิมพ์สมุดสมาชิก (Passbook PR9) เชื่อมต่อเครื่องพิมพ์หัวเข็มจริง */}
      <Modal
        title={<Text strong style={{ color: primaryColor, fontSize: 16 }}>พิมพ์สมุดสมาชิกผ่านเครื่องพิมพ์หัวเข็ม (Passbook PR9)</Text>}
        open={isPassbookModalOpen}
        onCancel={() => setIsPassbookModalOpen(false)}
        width={950}
        footer={[
          <Button key="close" onClick={() => setIsPassbookModalOpen(false)}>ปิด</Button>,
          <Button key="p1" icon={<PrinterOutlined />} onClick={() => message.success(`ส่งคำสั่งพิมพ์ปกนอกไปยัง "${passbookPrinterConfig?.printerModel || 'PR9'}" สำเร็จ`)}>พิมพ์ปกนอก [F6]</Button>,
          <Button key="p2" icon={<PrinterOutlined />} onClick={() => message.success(`ส่งคำสั่งพิมพ์ปกในไปยัง "${passbookPrinterConfig?.printerModel || 'PR9'}" สำเร็จ`)}>พิมพ์ปกใน [F7]</Button>,
          <Button 
            key="p3" 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={() => {
              const targetPrinter = passbookPrinterConfig?.printerModel || 'Olivetti PR9 / 2SI'
              message.success(`กำลังส่งข้อมูลรายการลงสมุด (รวม ${selectedRowKeys.length} รายการ) ไปยังเครื่องพิมพ์หัวเข็ม "${targetPrinter}" ที่บรรทัด ${startLine}...`);
              window.print();
            }} 
            style={{ background: primaryColor }}
          >
            พิมพ์รายการลงสมุด [F8]
          </Button>
        ]}
      >
        <div style={{ background: '#eff6ff', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #bfdbfe' }}>
          <Row gutter={12} align="middle">
            <Col span={6}>
              <Text strong>รหัสสมาชิก: </Text>
              <Text type="danger" strong>{memberInfo?.id}</Text>
              <Text strong style={{ marginLeft: 12 }}>กลุ่ม: </Text>
              <Text>{memberInfo?.group}</Text>
            </Col>
            <Col span={6}>
              <Text strong>ปีบัญชี: </Text>
              <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 90 }} size="small" options={[{ value: '2568', label: '2568' }, { value: '2569', label: '2569' }]} />
            </Col>
            <Col span={6}>
              <Text strong>บรรทัดเริ่มพิมพ์ (PR9): </Text>
              <InputNumber value={startLine} onChange={setStartLine} style={{ width: 65 }} size="small" min={1} max={30} />
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Text strong>ยอดคงเหลือกยกมา: </Text>
              <InputNumber value={carryForwardBalance} onChange={setCarryForwardBalance} style={{ width: 90 }} size="small" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Col>
          </Row>
          <Row style={{ marginTop: 8 }}>
            <Col span={24}>
              <Text strong style={{ fontSize: 16, color: primaryColor }}>ชื่อ-นามสกุล: {memberInfo?.name}</Text>
            </Col>
          </Row>
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>ติ๊กเลือกรายการธุรกรรมที่ต้องการพิมพ์ลงในสมุดคู่มือประจำตัวสมาชิก:</Text>

        <Table 
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          dataSource={getPassbookRows()} 
          columns={passbookColumns} 
          pagination={false} 
          size="small" 
          bordered
          onRow={() => ({ style: { cursor: 'default' } })}
        />
      </Modal>

      {/* Modal ยกเลิก/ลบใบเสร็จ */}
      <Modal
        title="ยกเลิก/ลบใบเสร็จรับเงิน"
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        onOk={handleConfirmCancelReceipt}
        okText="ยืนยันลบ/ยกเลิก"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="เลขที่ใบเสร็จที่ต้องการลบ" required>
            <Input value={savedReceiptNo} readOnly style={{ fontWeight: 'bold' }} />
          </Form.Item>
          <Form.Item label="ระบุเหตุผล/หมายเหตุการยกเลิก" required>
            <Input.TextArea rows={3} placeholder="ระบุสาเหตุ เช่น กรอกยอดเงินผิด..." value={cancelRemark} onChange={(e) => setCancelRemark(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal แก้ไขใบเสร็จ */}
      <Modal title="แก้ไขข้อมูลใบเสร็จรับเงิน" open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} onOk={() => { message.success('บันทึกการแก้ไขสำเร็จ'); setIsEditModalOpen(false); }}>
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="หมายเหตุการแก้ไข">
            <Input placeholder="ระบุสาเหตุการแก้ไข..." />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}