import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  Input, 
  DatePicker, 
  Select, 
  Button, 
  Table, 
  Typography, 
  Row, 
  Col, 
  Space, 
  InputNumber,
  message 
} from 'antd'
import { 
  CalculatorOutlined, 
  SearchOutlined, 
  PrinterOutlined, 
  CheckCircleOutlined,
  EditOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function WelfareDeduction() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [selectedYear, setSelectedYear] = useState('2569')
  const [cutoffDate, setCutoffDate] = useState(null)
  const [processQuery, setProcessQuery] = useState('')
  const [deductionList, setDeductionList] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [batchAmount, setBatchAmount] = useState(50)

  // โหลดรายชื่อสมาชิกพร้อมซิงค์ข้อมูลกับหน้าบันทึกสมาชิกเสียชีวิต
  const loadDeductionMembers = () => {
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    // กรองเฉพาะสมาชิกที่ยังไม่เสียชีวิต/ลาออก
    let activeMembers = rawMembers.filter(m => 
      m.status !== 'เสียชีวิต' && 
      m.status !== 'ลาออก' && 
      m.status !== 'ให้ออก'
    )

    const query = processQuery.trim()
    if (query) {
      const ids = query.split(',').map(s => s.trim())
      activeMembers = activeMembers.filter(m => {
        const mId = String(m.memberId || m.code || m.id || m.member_id || '')
        return ids.includes(mId)
      })
    }

    const formatted = activeMembers.map((m, index) => {
      const resolvedId = m.memberId || m.code || m.id || m.member_id || `M${index + 1}`
      const resolvedName = m.name || m.memberName || m.member_name || m.fullname || 
                           (m.firstName ? `${m.prefix || ''}${m.firstName} ${m.lastName || ''}` : `สมาชิกเลขที่ ${resolvedId}`)

      return {
        key: resolvedId,
        memberId: resolvedId,
        memberName: resolvedName,
        group: m.group || m.villageGroup || m.groupNo || '0',
        status: m.coverStatus || m.status || 'ได้รับความคุ้มครอง',
        deductionAmount: 50.00 // ตั้งต้นเริ่มต้น 50 บาท
      }
    })

    setDeductionList(formatted)
    setSelectedRowKeys(formatted.map(i => i.key))
  }

  useEffect(() => {
    loadDeductionMembers()
  }, [processQuery])

  const handleShowCutoffMembers = () => {
    loadDeductionMembers()
    message.success(`ซิงค์ข้อมูลสมาชิกพร้อมตัดยอดสำเร็จ จำนวน ${deductionList.length} ราย`)
  }

  const handleAmountChange = (key, val) => {
    const updated = deductionList.map(item => {
      if (item.key === key) {
        return { ...item, deductionAmount: val || 0 }
      }
      return item
    })
    setDeductionList(updated)
  }

  // ฟังก์ชันเปลี่ยนยอดหักทั้งหมดทีเดียว
  const handleApplyBatchAmount = () => {
    const updated = deductionList.map(item => ({
      ...item,
      deductionAmount: batchAmount
    }))
    setDeductionList(updated)
    message.success(`ปรับเปลี่ยนยอดหักเป็น ${batchAmount} บาท ให้สมาชิกทุกคนเรียบร้อยแล้ว`)
  }

  const handlePrint = () => {
    if (deductionList.length === 0) {
      message.warning('ไม่มีข้อมูลสำหรับพิมพ์รายชื่อ')
      return
    }
    window.print()
  }

  const handleProcessDeduction = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกรายการสมาชิกสำหรับประมวลผลตัดยอด')
      return
    }

    const deductionRecord = {
      date: cutoffDate ? cutoffDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      year: selectedYear,
      totalProcessed: selectedRowKeys.length,
      timestamp: new Date().toISOString()
    }

    const existingRecords = JSON.parse(localStorage.getItem('funeral_deductions')) || []
    localStorage.setItem('funeral_deductions', JSON.stringify([...existingRecords, deductionRecord]))

    message.success(`ประมวลผลตัดยอดเงินสงเคราะห์สำเร็จจำนวน ${selectedRowKeys.length} รายการ`)
  }

  const columns = [
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', align: 'center', width: 110 },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 240 },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', align: 'center', width: 90 },
    { title: 'สถานะสิทธิ', dataIndex: 'status', key: 'status', align: 'center', width: 150 },
    { title: 'ยอดหัก (บาท)', dataIndex: 'deductionAmount', key: 'deductionAmount', align: 'right', width: 140, 
      render: (val, record) => (
        <InputNumber 
          value={val} 
          min={0}
          step={1}
          onChange={(v) => handleAmountChange(record.key, v)}
          style={{ width: '100%', textAlign: 'right' }} 
        />
      ) 
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={<Space><CalculatorOutlined style={{ color: primaryColor }} /><span>การดำเนินงานหักเงินสงเคราะห์</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={5}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ปี</Text>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: '100%' }} size="large">
              <Option value="2569">2569</Option>
              <Option value="2568">2568</Option>
              <Option value="2567">2567</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่ตัดยอด</Text>
            <DatePicker value={cutoffDate} onChange={setCutoffDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={6} style={{ paddingTop: 22 }}>
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleShowCutoffMembers} style={{ background: primaryColor, width: '100%' }}>
              แสดงข้อมูล
            </Button>
          </Col>

          <Col xs={24} md={24}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ประมวลผลรายคน</Text>
            <Input 
              size="large"
              placeholder="ทุกรายที่ได้สิทธิ ถ้ารายบุคคลกรุณาใส่เลขสมาชิก" 
              value={processQuery}
              onChange={e => setProcessQuery(e.target.value)}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16, background: '#fef2f2', padding: '8px 12px', borderRadius: 4, border: '1px solid #fecaca' }}>
          <Text type="danger" strong>หมายเหตุ 1: ก่อนดำเนินการตัดตาย ให้ปรับสถานภาพสมาชิกใหม่ และบันทึก สมาชิกลาออก ให้ออก ให้เรียบร้อย</Text><br />
          <Text type="danger" strong>หมายเหตุ 2: ตรวจสอบลำดับศพให้ถูกต้อง เผื่อว่าลำดับศพอาจไม่ตรงกรณี ยกเลิกสมาชิกตาย</Text>
        </div>
      </Card>

      {/* แผงตั้งค่าตั้งหักรวมกดทีเดียวเปลี่ยนทุกคน */}
      <Card size="small" style={{ borderRadius: 8, marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Text strong style={{ color: '#047857' }}>กำหนดระบุยอดหักรวม (บาท):</Text>
          </Col>
          <Col xs={24} md={8}>
            <InputNumber 
              size="large" 
              value={batchAmount} 
              onChange={setBatchAmount} 
              min={0} 
              style={{ width: '100%' }} 
            />
          </Col>
          <Col xs={24} md={8}>
            <Button 
              type="primary" 
              size="large" 
              icon={<EditOutlined />} 
              onClick={handleApplyBatchAmount} 
              style={{ background: '#059669', width: '100%' }}
            >
              เปลี่ยนยอดหักทั้งหมด
            </Button>
          </Col>
        </Row>
      </Card>

      <div id="printable-report" style={{ background: '#fff', padding: 8 }}>
        <div className="print-header" style={{ textAlign: 'center', marginBottom: 16, display: 'none' }}>
          <Text strong style={{ fontSize: 16 }}>รายงานการหักเงินสงเคราะห์ประจำปี {selectedYear}</Text>
        </div>

        <Table 
          dataSource={deductionList} 
          columns={columns} 
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }} 
          size="small" 
          bordered 
          locale={{ emptyText: 'ยังไม่มีข้อมูลสมาชิกสำหรับการตัดยอด (0 รายการ)' }}
        />
      </div>

      <Card className="no-print" size="small" style={{ marginTop: 16, borderRadius: 8, background: '#f8fafc' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Text>จำนวนสมาชิกพร้อมตัดยอด: <strong style={{ color: primaryColor, fontSize: 16 }}>{deductionList.length}</strong> ราย (เลือก: <strong style={{ color: '#059669' }}>{selectedRowKeys.length}</strong>)</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button size="large" icon={<SearchOutlined />} onClick={handleShowCutoffMembers}>
                แสดงสมาชิกตัดยอดได้
              </Button>
              <Button size="large" icon={<PrinterOutlined />} onClick={handlePrint}>
                พิมพ์รายชื่อ
              </Button>
              <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleProcessDeduction} style={{ background: '#059669' }}>
                ประมวลผลตัดยอด
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <style>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          header, 
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          #printable-report {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  )
}