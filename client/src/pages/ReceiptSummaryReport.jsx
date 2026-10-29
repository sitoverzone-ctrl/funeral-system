import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  DatePicker, 
  Button, 
  Table, 
  Typography, 
  Row, 
  Col, 
  Space, 
  Select, 
  message,
  Tag,
  Modal,
  Input 
} from 'antd'
import { 
  PrinterOutlined, 
  SearchOutlined, 
  FileTextOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function ReceiptSummaryReport() {
  const { theme, user } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const userRole = user?.role || 'dev'
  const isManagerOrDev = userRole === 'manager' || userRole === 'dev' || user?.name?.includes('Dev') || user?.name?.includes('ผู้จัดการ')

  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา')
  const [startDate, setStartDate] = useState(dayjs())
  const [endDate, setEndDate] = useState(dayjs())
  const [displayMode, setDisplayMode] = useState('screen')
  const [reportData, setReportData] = useState([])
  const [printTime, setPrintTime] = useState('')

  // State สำหรับ Modal ขอยกเลิกพร้อมเหตุผล
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [targetCancelKey, setTargetCancelKey] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // State สำหรับพิมพ์ใบเสร็จซ้ำ (Reprint Modal)
  const [reprintModalOpen, setReprintModalOpen] = useState(false)
  const [currentReceiptToPrint, setCurrentReceiptToPrint] = useState(null)

  const loadReportData = () => {
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

    const rawData = 
      JSON.parse(localStorage.getItem('funeral_receipts')) || 
      JSON.parse(localStorage.getItem('receipts')) || 
      []

    const formatted = rawData.map((item, index) => {
      const advance = Number(item.advance || item.advanceAmount || 0)
      const welfare = Number(item.welfare || item.welfareAmount || 0)
      const register = Number(item.register || item.registerFee || 0)
      const maintenance = Number(item.maintenance || item.maintenanceFee || 0)
      const discount = Number(item.discount || 0)
      const donate = Number(item.donate || item.donation || 0)
      const other = Number(item.other || 0)
      const calculatedTotal = advance + welfare + register + maintenance - discount + donate + other

      return {
        key: item.key || item.docNo || String(item.id) || index.toString(),
        docNo: item.docNo || item.receiptNo || item.id || `6900${index + 1}`,
        memberId: item.memberId || item.member_id || item.code || '-',
        memberName: item.memberName || item.member_name || item.name || 'ไม่ระบุชื่อ',
        advance,
        welfare,
        register,
        maintenance,
        discount,
        donate,
        other,
        staff: item.collector || item.staff || item.user || item.createdBy || user?.code || 'A',
        date: item.date || item.created_at || dayjs().format('YYYY-MM-DD'),
        total: Number(item.total || item.grandTotal || calculatedTotal),
        isCancelled: item.isCancelled || false,
        cancelReason: item.cancelReason || '-'
      }
    })

    const filtered = formatted.filter(item => {
      if (!item.date) return true
      const itemDate = dayjs(item.date)
      return (
        (itemDate.isSame(startDate, 'day') || itemDate.isAfter(startDate, 'day')) &&
        (itemDate.isSame(endDate, 'day') || itemDate.isBefore(endDate, 'day'))
      )
    })

    setReportData(filtered)
    setPrintTime(dayjs().format('HH:mm:ss'))
  }

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate])

  const handleOpenCancelModal = (recordKey) => {
    if (!isManagerOrDev) {
      message.error('ขออภัย! เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์ยกเลิกใบเสร็จได้')
      return
    }
    setTargetCancelKey(recordKey)
    setCancelReason('')
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      message.error('กรุณาระบุหมายเหตุหรือเหตุผลในการยกเลิกใบเสร็จ!')
      return
    }

    const rawData = JSON.parse(localStorage.getItem('funeral_receipts')) || JSON.parse(localStorage.getItem('receipts')) || []
    
    let cancelledItem = null
    const updatedRaw = rawData.map(item => {
      const k = item.key || item.docNo || String(item.id)
      if (k === targetCancelKey) {
        cancelledItem = item
        return { ...item, isCancelled: true, cancelReason: cancelReason.trim() }
      }
      return item
    })

    if (localStorage.getItem('funeral_receipts')) {
      localStorage.setItem('funeral_receipts', JSON.stringify(updatedRaw))
    } else {
      localStorage.setItem('receipts', JSON.stringify(updatedRaw))
    }

    if (cancelledItem) {
      const adv = Number(cancelledItem.advance || cancelledItem.advanceAmount || 0)
      const maint = Number(cancelledItem.maintenance || cancelledItem.maintenanceFee || 0)
      const reg = Number(cancelledItem.register || cancelledItem.registerFee || 0)
      const don = Number(cancelledItem.donate || cancelledItem.donation || 0)
      const oth = Number(cancelledItem.other || 0)

      if (adv > 0) {
        const currentBank88 = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
        localStorage.setItem('funeral_total_bank_balance_88', Math.max(0, currentBank88 - adv).toString())
      }

      const totalMaintReceipt = maint + reg + don + oth
      if (totalMaintReceipt > 0) {
        const currentCash87 = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
        localStorage.setItem('funeral_total_cash_balance', Math.max(0, currentCash87 - totalMaintReceipt).toString())
      }
    }

    message.success('ยกเลิกใบเสร็จและบันทึกหมายเหตุเรียบร้อยแล้ว')
    setIsCancelModalOpen(false)
    setTargetCancelKey(null)
    setCancelReason('')
    loadReportData()
  }

  const handlePrint = () => {
    setPrintTime(dayjs().format('HH:mm:ss'))
    window.print()
  }

  // ฟังก์ชันเปิด Modal พิมพ์ใบเสร็จซ้ำ
  const handleReprintReceipt = (record) => {
    setCurrentReceiptToPrint(record)
    setReprintModalOpen(true)
  }

  const columns = [
    { title: 'ใบสำคัญ', dataIndex: 'docNo', key: 'docNo', align: 'center', width: '9%' },
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', align: 'center', width: '8%' },
    { 
      title: 'ชื่อสมาชิก / หมายเหตุการยกเลิก', 
      dataIndex: 'memberName', 
      key: 'memberName', 
      width: '21%',
      render: (v, r) => r.isCancelled ? (
        <div>
          <span>{v}</span>
          <div style={{ color: '#dc2626', fontSize: 10, fontWeight: 'bold' }}>เหตุผล: {r.cancelReason}</div>
        </div>
      ) : v
    },
    { title: 'เงินสงเคราะห์ล่วงหน้า', dataIndex: 'advance', key: 'advance', align: 'right', width: '10%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'เงินสงเคราะห์', dataIndex: 'welfare', key: 'welfare', align: 'right', width: '9%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'ค่าสมัคร', dataIndex: 'register', key: 'register', align: 'right', width: '7%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'ค่าบำรุง', dataIndex: 'maintenance', key: 'maintenance', align: 'right', width: '7%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'เงินหัก %', dataIndex: 'discount', key: 'discount', align: 'right', width: '6%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'บริจาค', dataIndex: 'donate', key: 'donate', align: 'right', width: '7%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'อื่นๆ', dataIndex: 'other', key: 'other', align: 'right', width: '7%', render: (v, r) => r.isCancelled ? <Text delete>0</Text> : (v ? Number(v).toLocaleString() : '0') },
    { title: 'ผู้บันทึก', dataIndex: 'staff', key: 'staff', align: 'center', width: '6%', render: v => v ? String(v).charAt(0) : 'A' },
    { 
      title: 'จัดการ', 
      key: 'cancelAction', 
      align: 'center', 
      width: '12%',
      className: 'no-print',
      render: (_, record) => (
        <Space size={4}>
          {!record.isCancelled && (
            <Button 
              type="link" 
              icon={<PrinterOutlined />} 
              size="small" 
              onClick={() => handleReprintReceipt(record)}
            >
              พิมพ์
            </Button>
          )}
          {record.isCancelled ? (
            <Tag color="red">ยกเลิก</Tag>
          ) : isManagerOrDev ? (
            <Button 
              type="link" 
              danger 
              size="small" 
              onClick={() => handleOpenCancelModal(record.key)}
            >
              ยกเลิก
            </Button>
          ) : null}
        </Space>
      )
    }
  ]

  const activeData = reportData.filter(item => !item.isCancelled)
  const cancelledCount = reportData.filter(item => item.isCancelled).length

  const totalAdvance = activeData.reduce((sum, item) => sum + (Number(item.advance) || 0), 0)
  const totalWelfare = activeData.reduce((sum, item) => sum + (Number(item.welfare) || 0), 0)
  const totalRegister = activeData.reduce((sum, item) => sum + (Number(item.register) || 0), 0)
  const totalMaintenance = activeData.reduce((sum, item) => sum + (Number(item.maintenance) || 0), 0)
  const totalDiscount = activeData.reduce((sum, item) => sum + (Number(item.discount) || 0), 0)
  const totalDonate = activeData.reduce((sum, item) => sum + (Number(item.donate) || 0), 0)
  const totalOther = activeData.reduce((sum, item) => sum + (Number(item.other) || 0), 0)
  const grandTotal = activeData.reduce((sum, item) => sum + (Number(item.total) || 0), 0)

  const formatThaiDate = (dateObj) => {
    if (!dateObj) return ''
    const d = dayjs(dateObj)
    const day = d.date()
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    const month = monthNames[d.month()]
    const year = d.year() + 543
    return `${day} ${month} ${year}`
  }

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', paddingBottom: 40, background: '#ffffff', minHeight: '100vh', padding: '16px' }}>
      
      <Card 
        className="no-print"
        title={<Space><FileTextOutlined style={{ color: primaryColor }} /><span>รายงานสรุปใบเสร็จรับเงินรายวัน / ช่วงวันที่ (พร้อมพิมพ์ซ้ำ)</span></Space>}
        style={{ borderRadius: 8, marginBottom: 20, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ตั้งแต่วันที่</Text>
            <DatePicker value={startDate} onChange={setStartDate} format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ถึงวันที่</Text>
            <DatePicker value={endDate} onChange={setEndDate} format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>แสดงผลทาง</Text>
            <Select value={displayMode} onChange={setDisplayMode} style={{ width: '100%' }}>
              <Option value="screen">จอภาพ</Option>
              <Option value="print">เครื่องพิมพ์</Option>
            </Select>
          </Col>
          <Col xs={24} md={6} style={{ paddingTop: 22 }}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadReportData} style={{ background: primaryColor }}>
                แสดงรายงาน
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                พิมพ์
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div 
        id="printable-report" 
        style={{ 
          background: '#ffffff', 
          padding: '5px', 
          width: '100%', 
          boxSizing: 'border-box',
          fontFamily: "'Sarabun', sans-serif",
          color: '#000'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 2 }}>{orgName}</Text>
          <Text style={{ fontSize: 12 }}>
            {startDate.isSame(endDate, 'day') ? (
              `รายละเอียดการรับเงิน วันที่ ${formatThaiDate(startDate)}`
            ) : (
              `รายละเอียดการรับเงิน ระหว่างวันที่ ${formatThaiDate(startDate)} ถึง ${formatThaiDate(endDate)}`
            )}
          </Text>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}>
            <span>วันที่พิมพ์: {formatThaiDate(dayjs())} เวลา {printTime} น.</span>
            <span>หน้า : 1</span>
          </div>
        </div>

        <Table 
          dataSource={reportData} 
          columns={columns} 
          pagination={false} 
          size="small" 
          bordered 
          locale={{ emptyText: 'ยังไม่มีการทำรายการรับเงินในวันที่เลือก' }}
          rowClassName={(record) => record.isCancelled ? 'cancelled-row' : ''}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#fff', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} colSpan={3} align="right">รวม</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">{totalAdvance.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">{totalWelfare.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">{totalRegister.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">{totalMaintenance.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">{totalDiscount.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">{totalDonate.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">{totalOther.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">-</Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="center" className="no-print">-</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <div style={{ marginTop: 8, padding: '5px 8px', border: '1px solid #000', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, background: '#fff' }}>
          <span>จำนวนใบเสร็จ: <strong>{activeData.length}</strong> ใบ</span>
          <span>จำนวนใบยกเลิก: <strong style={{ color: cancelledCount > 0 ? 'red' : 'inherit' }}>{cancelledCount}</strong> ใบ</span>
          <span>รวมทั้งสิ้น: <strong style={{ fontSize: 13.5 }}>{grandTotal.toLocaleString()}</strong> บาท</span>
        </div>
      </div>

      {/* Modal กรอกหมายเหตุการยกเลิกใบเสร็จ */}
      <Modal
        title={<Text strong style={{ color: '#dc2626' }}>⚠️ ระบุเหตุผลการยกเลิกใบเสร็จ</Text>}
        open={isCancelModalOpen}
        onOk={handleConfirmCancel}
        onCancel={() => setIsCancelModalOpen(false)}
        okText="ยืนยันการยกเลิก"
        okButtonProps={{ danger: true }}
        cancelText="ปิด"
      >
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            กรุณากรอกสาเหตุหรือหมายเหตุในการยกเลิกใบเสร็จฉบับนี้ เพื่อบันทึกเป็นหลักฐานในรายงาน:
          </Text>
          <Input.TextArea 
            rows={4} 
            value={cancelReason} 
            onChange={(e) => setCancelReason(e.target.value)} 
            placeholder="เช่น คีย์จำนวนเงินผิด, ออกใบเสร็จซ้ำซ้อน, ฯลฯ" 
          />
        </div>
      </Modal>

      {/* Modal พิมพ์ใบเสร็จซ้ำ (Reprint Preview & Print) */}
      <Modal
        title={<Text strong style={{ color: primaryColor }}><PrinterOutlined /> พิมพ์ใบเสร็จรับเงิน (สำเนา)</Text>}
        open={reprintModalOpen}
        onCancel={() => setReprintModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setReprintModalOpen(false)}>ปิด</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: primaryColor }}>
            พิมพ์ใบเสร็จ
          </Button>
        ]}
        width={700}
      >
        {currentReceiptToPrint && (
          <div id="printable-single-receipt" style={{ padding: 16, background: '#fff', fontFamily: "'Sarabun', sans-serif", color: '#000' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, display: 'block' }}>{orgName}</Text>
              <Text style={{ fontSize: 13 }}>ใบเสร็จรับเงิน (สำเนา / Reprint)</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span>เลขที่ใบเสร็จ / ใบสำคัญ: <strong>{currentReceiptToPrint.docNo}</strong></span>
              <span>วันที่: {formatThaiDate(currentReceiptToPrint.date)}</span>
            </div>

            <div style={{ marginBottom: 12, fontSize: 13, padding: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 }}>
              ได้รับเงินจาก: <strong>{currentReceiptToPrint.memberName}</strong> (รหัสสมาชิก: {currentReceiptToPrint.memberId})
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left' }}>รายการชำระ</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', width: 120 }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {currentReceiptToPrint.advance > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>เงินสงเคราะห์ล่วงหน้า (บัญชี 88)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right' }}>{Number(currentReceiptToPrint.advance).toLocaleString()}</td>
                  </tr>
                )}
                {currentReceiptToPrint.welfare > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>เงินสงเคราะห์</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right' }}>{Number(currentReceiptToPrint.welfare).toLocaleString()}</td>
                  </tr>
                )}
                {currentReceiptToPrint.register > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>ค่าสมัคร</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right' }}>{Number(currentReceiptToPrint.register).toLocaleString()}</td>
                  </tr>
                )}
                {currentReceiptToPrint.maintenance > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>ค่าบำรุง (บัญชี 87)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right' }}>{Number(currentReceiptToPrint.maintenance).toLocaleString()}</td>
                  </tr>
                )}
                {currentReceiptToPrint.donate > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>เงินบริจาค</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right' }}>{Number(currentReceiptToPrint.donate).toLocaleString()}</td>
                  </tr>
                )}
                {currentReceiptToPrint.other > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>อื่นๆ</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right' }}>{Number(currentReceiptToPrint.other).toLocaleString()}</td>
                  </tr>
                )}
                <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>รวมสุทธิทั้งสิ้น</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', color: '#b91c1c' }}>{Number(currentReceiptToPrint.total).toLocaleString()} บาท</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 13 }}>
              <span>ผู้รับเงิน: {currentReceiptToPrint.staff}</span>
              <span>ลายเซ็น..................................................ผู้รับเงิน</span>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .cancelled-row td {
          background-color: #fef2f2 !important;
          color: #991b1b !important;
          text-decoration: line-through;
        }
        #printable-report .ant-table {
          font-size: 11px !important;
          width: 100% !important;
        }
        #printable-report .ant-table-content,
        #printable-report table {
          width: 100% !important;
        }
        th.ant-table-cell {
          text-align: center !important;
          background-color: #fff !important;
          color: #000 !important;
          font-weight: bold !important;
          border-color: #000 !important;
          padding: 4px 3px !important;
          font-size: 11px !important;
        }
        td.ant-table-cell {
          border-color: #000 !important;
          color: #000 !important;
          padding: 4px 3px !important;
        }
        .ant-table-bordered .ant-table-container {
          border-color: #000 !important;
        }
        @media print {
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          header, 
          div[style*="background: rgb(226, 232, 240)"], 
          .ant-modal-mask,
          .ant-modal-wrap,
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
          }
          ${reprintModalOpen ? `
            #printable-report { display: none !important; }
            .ant-modal { width: 100% !important; max-width: 100% !important; top: 0 !important; left: 0 !important; margin: 0 !important; }
            .ant-modal-content { box-shadow: none !important; padding: 0 !important; }
            .ant-modal-footer { display: none !important; }
            .ant-modal-header { display: none !important; }
            #printable-single-receipt { display: block !important; width: 100% !important; }
          ` : `
            #printable-report {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
          `}
          table {
            page-break-inside: avoid !important;
            width: 100% !important;
          }
        }
      `}</style>

    </div>
  )
}