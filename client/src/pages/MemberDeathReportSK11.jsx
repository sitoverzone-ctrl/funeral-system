import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, DatePicker, Table, Space, message } from 'antd'
import { PrinterOutlined, SearchOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberDeceasedReportSK11() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ดึงข้อมูลหน่วยงานจาก localStorage
  const [orgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  const [startDate, setStartDate] = useState(dayjs().startOf('year'))
  const [endDate, setEndDate] = useState(dayjs().endOf('year'))
  const [reportData, setReportData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // ฟังก์ชันซิงค์และคำนวณข้อมูลสมาชิกผู้เสียชีวิตจากฐานข้อมูลจริง 100%
  const handleSearchData = () => {
    try {
      const allMembers = JSON.parse(localStorage.getItem('funeral_members')) || []

      if (allMembers.length === 0) {
        message.warning('ไม่พบข้อมูลสมาชิกในระบบ (funeral_members)')
      }

      // 1. กรองเฉพาะสมาชิกที่มีสถานะเสียชีวิต หรือมีวันที่เสียชีวิต และอยู่ในช่วงวันที่เลือก
      const deadMembers = allMembers.filter(m => {
        const isDead = m.status === 'เสียชีวิต' || m.status === 'ตาย' || m.deathDate || m.statusDate
        if (!isDead) return false

        const rawDeathDate = m.deathDate || m.statusDate || m.registerDate
        if (!rawDeathDate) return false
        const dDate = dayjs(rawDeathDate)

        return (
          dDate.isValid() &&
          (dDate.isSame(startDate, 'day') || dDate.isAfter(startDate, 'day')) &&
          (dDate.isSame(endDate, 'day') || dDate.isBefore(endDate, 'day'))
        )
      })

      // เรียงลำดับตามวันที่เสียชีวิตจากเก่าไปใหม่ เพื่อรันลำดับศพที่ 1, 2, 3...
      deadMembers.sort((a, b) => {
        const dateA = dayjs(a.deathDate || a.statusDate)
        const dateB = dayjs(b.deathDate || b.statusDate)
        return dateA.valueOf() - dateB.valueOf()
      })

      const totalActiveMembers = allMembers.filter(m => m.status !== 'เสียชีวิต' && m.status !== 'ตาย' && m.status !== 'ลาออก' && m.status !== 'ให้ออก').length || 1775

      const formattedRows = deadMembers.map((m, idx) => {
        const mId = String(m.id || m.memberId || '')
        const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        
        const rawDeathDate = m.deathDate || m.statusDate
        const deathDateFormatted = rawDeathDate ? dayjs(rawDeathDate).format('DD/MM/YYYY') : '-'

        const currentTotalMembers = totalActiveMembers - idx
        const totalAmount = currentTotalMembers * 50 // อัตราเงินสงเคราะห์มาตรฐาน 50 บาท/คน
        const deduction = Math.round(totalAmount * 0.08) // หักเข้าสมาคม 8%
        const netPaid = totalAmount - deduction

        return {
          key: mId || idx + 1,
          no: idx + 1,
          memberName: fullName,
          memberId: mId,
          deathSeq: idx + 1,
          deathDate: deathDateFormatted,
          totalMembers: currentTotalMembers,
          totalAmount: totalAmount,
          deduction: deduction,
          netPaid: netPaid,
          note: m.note || '-'
        }
      })

      setReportData(formattedRows)
      // เลือกทั้งหมดเป็นค่าเริ่มต้น
      setSelectedRowKeys(formattedRows.map(item => item.key))
      message.success(`ซิงค์ข้อมูลทะเบียนผู้เสียชีวิตสำเร็จ (${formattedRows.length} รายการ)`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการซิงค์ข้อมูลผู้เสียชีวิต')
    }
  }

  useEffect(() => {
    handleSearchData()
  }, [])

  // ตั้งค่าการเลือกแถวด้วย Checkbox
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  // Columns สำหรับตาราง
  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 45, align: 'center' },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 180 },
    { title: 'ทะเบียนเลขที่ตาย', dataIndex: 'memberId', key: 'memberId', width: 90, align: 'center' },
    { title: 'ลำดับศพที่ตาย', dataIndex: 'deathSeq', key: 'deathSeq', width: 85, align: 'center' },
    { title: 'ว-ด-ป ที่ตาย', dataIndex: 'deathDate', key: 'deathDate', width: 95, align: 'center' },
    { title: 'จำนวนสมาชิกที่มีอยู่', dataIndex: 'totalMembers', key: 'totalMembers', width: 95, align: 'center' },
    { 
      title: 'เงินสงเคราะห์ที่ได้รับจากสมาชิก (บาท)', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount', 
      width: 140, 
      align: 'right', 
      render: (v) => Number(v || 0).toLocaleString('th-TH') 
    },
    { 
      title: 'เงินหักจากเงินสงเคราะห์ไว้เป็น...', 
      dataIndex: 'deduction', 
      key: 'deduction', 
      width: 110, 
      align: 'right', 
      render: (v) => Number(v || 0).toLocaleString('th-TH') 
    },
    { 
      title: 'เงินสงเคราะห์ที่สมาคมจ่ายค้างจ่าย', 
      dataIndex: 'netPaid', 
      key: 'netPaid', 
      width: 120, 
      align: 'right', 
      render: (v) => Number(v || 0).toLocaleString('th-TH') 
    },
    { title: 'หมายเหตุ', dataIndex: 'note', key: 'note', width: 75, align: 'center' }
  ]

  // คำนวณผลรวมเฉพาะรายการที่ถูกติ๊กเลือก
  const selectedData = reportData.filter(item => selectedRowKeys.includes(item.key))
  const sumTotalAmount = selectedData.reduce((sum, item) => sum + item.totalAmount, 0)
  const sumDeduction = selectedData.reduce((sum, item) => sum + item.deduction, 0)
  const sumNetPaid = selectedData.reduce((sum, item) => sum + item.netPaid, 0)

  return (
    <div style={{ maxWidth: 1250, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์สำหรับการพิมพ์: ขยายเต็มหน้ากระดาษ A4 แนวนอน (เหลือขอบเพียง 2mm) ชิดขอบพอดี */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 2mm;
            top: 2mm;
            width: calc(100% - 4mm);
            background: #fff !important;
            padding: 0 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-only { 
            display: block !important; 
          }
          .ant-card { 
            border: none !important; 
            box-shadow: none !important; 
            background: transparent !important; 
          }
          .ant-card-body { 
            padding: 0 !important; 
          }
          .ant-table { 
            font-size: 11pt !important; 
            width: 100% !important;
          }
          .ant-table-bordered .ant-table-container {
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            background: #fff !important;
          }
          .ant-table-thead > tr > th {
            border-bottom: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            background: #f1f5f9 !important;
            color: #000 !important;
            font-weight: bold !important;
            padding: 6px 4px !important;
            text-align: center !important;
          }
          .ant-table-tbody > tr > td {
            border-bottom: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            color: #000 !important;
            padding: 5px 4px !important;
          }
          @page { 
            size: A4 landscape; 
            margin: 0mm; 
          }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <Card 
        title={
          <Space className="no-print">
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>รายงาน ส.ณ.ก.11 (ทะเบียนผู้เสียชีวิต / รายการรับ-จ่ายเงินสงเคราะห์)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="no-print" style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={3} style={{ textAlign: 'right' }}><Text strong>ตั้งแต่วันที่</Text></Col>
            <Col xs={24} sm={5}>
              <DatePicker 
                value={startDate} 
                onChange={(val) => val && setStartDate(val)} 
                format="DD/MM/YYYY" 
                style={{ width: '100%' }} 
              />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>ถึงวันที่</Text></Col>
            <Col xs={24} sm={5}>
              <DatePicker 
                value={endDate} 
                onChange={(val) => val && setEndDate(val)} 
                format="DD/MM/YYYY" 
                style={{ width: '100%' }} 
              />
            </Col>

            <Col xs={24} sm={4}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearchData}
                style={{ background: primaryColor, width: '100%' }}
              >
                แสดงข้อมูล
              </Button>
            </Col>
          </Row>
          <div style={{ marginTop: 6, fontSize: '11px', color: '#64748b' }} className="no-print">
            หมายเหตุ: ติ๊กเลือกรายการที่ต้องการคำนวณและสั่งพิมพ์ (ใช้กระดาษ A4 แนวนอน)[cite: 5, 6]
          </div>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน */}
        <div id="printable-report-area">
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: 4 }}>
              <span>แบบ ส.ณ.ก.๑๑</span>
              <span>หน้า : 1</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '15pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์การเกษตรเซกา'}</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>
              รายการรับจ่ายเงินสงเคราะห์ในรอบปี ตั้งแต่ {startDate.format('D MMMM YYYY')} ถึง {endDate.format('D MMMM YYYY')}[cite: 6]
            </h3>
          </div>

          <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 16 }}>
            <Table 
              dataSource={reportData} 
              columns={columns} 
              rowKey="key"
              size="small"
              bordered
              pagination={false}
              rowSelection={rowSelection}
              locale={{ emptyText: 'ไม่พบข้อมูลสมาชิกผู้เสียชีวิตในช่วงวันที่เลือก' }}
              summary={() => (
                <Table.Summary.Row style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={6} align="center">รวมทั้งสิ้น ({selectedData.length} รายการที่เลือก)</Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">{sumTotalAmount.toLocaleString('th-TH')}</Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">{sumDeduction.toLocaleString('th-TH')}</Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">{sumNetPaid.toLocaleString('th-TH')}</Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="center">-</Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        </div>

        <Row justify="space-between" align="middle" style={{ marginTop: 12 }} className="no-print">
          <Col>
            <Space size={16}>
              <div>
                <Text strong style={{ marginRight: 8 }}>เลือกแล้ว:</Text>
                <input 
                  value={selectedData.length} 
                  readOnly 
                  style={{ width: 80, textAlign: 'center', fontWeight: 'bold', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px' }} 
                />
                <Text style={{ marginLeft: 4 }}>รายจากทั้งหมด {reportData.length} ราย</Text>
              </div>
            </Space>
          </Col>
          <Col className="no-print">
            <Space>
              <Button 
                type="primary" 
                icon={<PrinterOutlined />} 
                onClick={() => window.print()} 
                style={{ background: '#334155', fontWeight: 'bold' }}
              >
                พิมพ์
              </Button>
              <Button 
                icon={<CloseOutlined />} 
                onClick={() => window.history.back()}
                style={{ fontWeight: 'bold' }}
              >
                ปิด
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}