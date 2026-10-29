import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, DatePicker, Table, Space, message } from 'antd'
import { PrinterOutlined, SearchOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberInactiveReport() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

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

  // ฟังก์ชันดึงและกรองข้อมูลสมาชิกพ้นสภาพจากระบบจริง 100%
  const handleSearchData = () => {
    try {
      const allMembers = JSON.parse(localStorage.getItem('funeral_members')) || []

      if (allMembers.length === 0) {
        message.warning('ไม่พบข้อมูลสมาชิกในระบบ (funeral_members)')
      }

      // กรองเฉพาะสมาชิกที่มีสถานะพ้นสภาพและอยู่ในช่วงวันที่เลือก
      const inactiveMembers = allMembers.filter(m => {
        const status = (m.status || '').trim()
        const isInactive = 
          status === 'เสียชีวิต' || 
          status === 'ตาย' || 
          status === 'ลาออก' || 
          status === 'ให้อออก' || 
          status === 'ขาดสิทธิ' ||
          m.deathDate || m.resignDate || m.statusDate

        if (!isInactive) return false

        const rawDate = m.deathDate || m.resignDate || m.statusDate || m.registerDate
        if (!rawDate) return false
        const dDate = dayjs(rawDate)

        return (
          dDate.isValid() &&
          (dDate.isSame(startDate, 'day') || dDate.isAfter(startDate, 'day')) &&
          (dDate.isSame(endDate, 'day') || dDate.isBefore(endDate, 'day'))
        )
      })

      // เรียงลำดับตามวันที่พ้นสภาพ
      inactiveMembers.sort((a, b) => {
        const dateA = dayjs(a.deathDate || a.resignDate || a.statusDate)
        const dateB = dayjs(b.deathDate || b.resignDate || b.statusDate)
        return dateA.valueOf() - dateB.valueOf()
      })

      const formattedRows = inactiveMembers.map((m, idx) => {
        const mId = String(m.id || m.memberId || '')
        const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        
        const rawDate = m.deathDate || m.resignDate || m.statusDate
        const dateFormatted = rawDate ? dayjs(rawDate).format('DD/MM/YYYY') : '-'

        const reason = m.status || (m.deathDate ? 'ตาย' : 'พ้นสภาพ')
        const beneficiary = m.beneficiary || m.receiver || fullName

        return {
          key: mId || idx + 1,
          no: idx + 1,
          memberName: fullName,
          memberId: mId,
          group: m.group || m.memberGroup || '-',
          inactiveDate: dateFormatted,
          reason: reason,
          beneficiary: beneficiary
        }
      })

      setReportData(formattedRows)
      setSelectedRowKeys(formattedRows.map(item => item.key))
      message.success(`ซิงค์ข้อมูลทะเบียนสมาชิกพ้นสภาพสำเร็จ (${formattedRows.length} รายการ)`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }

  useEffect(() => {
    handleSearchData()
  }, [])

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 60, align: 'center' },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 220 },
    { title: 'ทะเบียนเลขที่', dataIndex: 'memberId', key: 'memberId', width: 100, align: 'center' },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 80, align: 'center' },
    { title: 'ว-ด-ป ที่พ้นสภาพ', dataIndex: 'inactiveDate', key: 'inactiveDate', width: 120, align: 'center' },
    { title: 'สาเหตุที่พ้นสภาพ', dataIndex: 'reason', key: 'reason', width: 110, align: 'center' },
    { title: 'ชื่อผู้รับเงินสงเคราะห์', dataIndex: 'beneficiary', key: 'beneficiary', width: 200 }
  ]

  const printData = reportData.filter(item => selectedRowKeys.includes(item.key))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์การพิมพ์: A4 แนวตั้ง ชิดขอบบน จัดกึ่งกลาง ฟอนต์ 11pt */}
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
            left: 10mm;
            top: 5mm;
            width: calc(100% - 20mm);
            background: #fff !important;
            padding: 0 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-only { 
            display: block !important; 
          }
          .ant-table-selection-column, .ant-table-selection-col {
            display: none !important;
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
            padding: 6px 6px !important;
            text-align: center !important;
          }
          .ant-table-tbody > tr > td {
            border-bottom: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            color: #000 !important;
            padding: 5px 6px !important;
          }
          @page { 
            size: A4 portrait; 
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
            <span>รายงานทะเบียนสมาชิกพ้นสภาพ (เสียชีวิต ลาออก ให้อออก และขาดสิทธิ)</span>
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
            หมายเหตุ: ติ๊กเลือกรายชื่อสมาชิกที่ต้องการพิมพ์รายงาน (ช่องติ๊กจะถูกซ่อนอัตโนมัติเมื่อกดพิมพ์)
          </div>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน */}
        <div id="printable-report-area">
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: 4 }}>
              <span>&nbsp;</span>
              <span>หน้า : 1</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '15pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์การเกษตรเซกา'}</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>
              ทะเบียนสมาชิกพ้นสภาพ ตั้งแต่ {startDate.format('D MMMM YYYY')} ถึง {endDate.format('D MMMM YYYY')}
            </h3>
          </div>

          <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 16 }}>
            <Table 
              dataSource={printData} 
              columns={columns} 
              rowKey="key"
              size="small"
              bordered
              pagination={false}
              rowSelection={rowSelection}
              locale={{ emptyText: 'ไม่พบข้อมูลสมาชิกพ้นสภาพในช่วงวันที่เลือก' }}
            />
          </div>

          {/* ส่วนลงนามสำหรับพิมพ์ (บังคับชิดขวาแน่นอน) */}
          <div className="print-only" style={{ marginTop: 30 }}>
            <div style={{ marginLeft: 'auto', width: '300px', textAlign: 'center', fontSize: '11pt' }}>
              <div style={{ marginBottom: 30 }}>
                ลงชื่อ ............................................................................<br />
                (............................................................)<br />
                นายกสมาคมฌาปนกิจสงเคราะห์
              </div>
            </div>
          </div>
        </div>

        {/* แถบด้านล่างหน้าจอ (ซ่อนตอนพิมพ์) */}
        <Row justify="space-between" align="middle" style={{ marginTop: 12 }} className="no-print">
          <Col>
            <Space size={16}>
              <div>
                <Text strong style={{ marginRight: 8 }}>เลือกพิมพ์:</Text>
                <input 
                  value={printData.length} 
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